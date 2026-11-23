import { detailOf, forwardHeaders, getToken } from "@/lib/api-proxy";
import { getApiUrl } from "@/lib/env";
import { isUuid } from "@/lib/ids";

const MAX_BYTES = 4 * 1024 * 1024;
const json = (detail: string, status: number) => Response.json({ detail }, { status });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; drawId: string }> },
) {
  const { orgId, drawId } = await params;
  if (!isUuid(orgId) || !isUuid(drawId)) return json("Not found", 404);

  // Only accept uploads that come from this site (extra CSRF protection on top of SameSite cookies).
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && new URL(origin).host !== host) return json("Forbidden", 403);

  const token = await getToken();
  if (!token) return json("Please sign in again.", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json("The upload could not be read.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return json("Choose a file to upload.", 400);
  if (file.size === 0) return json("The file is empty.", 400);
  if (file.size > MAX_BYTES) return json("The file is too large (4 MB maximum).", 413);
  if (!/\.(xlsx|csv)$/i.test(file.name)) return json("Upload an .xlsx or .csv file.", 400);

  const body = new FormData();
  body.append("file", file, file.name);
  body.append("dry_run", form.get("dry_run") === "false" ? "false" : "true");

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiUrl()}/orgs/${orgId}/draws/${drawId}/tickets/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, ...(await forwardHeaders()) },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    return json("We couldn't reach the server. Please try again.", 502);
  }

  const data = await upstream.json().catch(() => null);
  if (!upstream.ok) return json(detailOf(data), upstream.status === 403 ? 404 : upstream.status);
  return Response.json(data);
}