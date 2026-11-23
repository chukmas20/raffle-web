import { proxyDownload } from "@/lib/api-proxy";
import { isUuid } from "@/lib/ids";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string; drawId: string }> },
) {
  const { orgId, drawId } = await params;
  if (!isUuid(orgId) || !isUuid(drawId)) return new Response("Not found", { status: 404 });

  const status = new URL(request.url).searchParams.get("status");
  const query = status && ["available", "sold", "void"].includes(status) ? `?status=${status}` : "";
  return proxyDownload(`/orgs/${orgId}/draws/${drawId}/tickets/export${query}`, "tickets.xlsx");
}