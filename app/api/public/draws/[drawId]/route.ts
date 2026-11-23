import { isUuid } from "@/lib/ids";
import { getPublicDraw } from "@/lib/public-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ drawId: string }> },
) {
  const { drawId } = await params;
  if (!isUuid(drawId)) return Response.json({ detail: "Not found" }, { status: 404 });

  const result = await getPublicDraw(drawId);
  if (result.status === "not_found") return Response.json({ detail: "Not found" }, { status: 404 });
  if (result.status === "error") return Response.json({ detail: "Unavailable" }, { status: 502 });

  return Response.json(result.draw, {
    headers: { "Cache-Control": "public, s-maxage=2, stale-while-revalidate=5" },
  });
}