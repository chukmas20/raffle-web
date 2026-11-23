import { proxyDownload } from "@/lib/api-proxy";
import { isUuid } from "@/lib/ids";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; drawId: string }> },
) {
  const { orgId, drawId } = await params;
  if (!isUuid(orgId) || !isUuid(drawId)) return new Response("Not found", { status: 404 });
  return proxyDownload(
    `/orgs/${orgId}/draws/${drawId}/tickets/import-template`,
    "sold-tickets-template.xlsx",
  );
}