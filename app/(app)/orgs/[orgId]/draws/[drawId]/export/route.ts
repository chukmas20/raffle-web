import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { getApiUrl } from "@/lib/env";
import { isUuid } from "@/lib/ids";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; drawId: string }> },
) {
  const { orgId, drawId } = await params;
  if (!isUuid(orgId) || !isUuid(drawId)) return new Response("Not found", { status: 404 });

  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const upstream = await fetch(
    `${getApiUrl()}/orgs/${orgId}/draws/${drawId}/results/export`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!upstream.ok) {
    return new Response("Could not export results", {
      status: upstream.status === 404 || upstream.status === 403 ? 404 : 502,
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ?? 'attachment; filename="results.csv"',
      "Cache-Control": "no-store",
    },
  });
}