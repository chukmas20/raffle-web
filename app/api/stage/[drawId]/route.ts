import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { isUuid } from "@/lib/ids";
import { getPublicDraw } from "@/lib/public-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ drawId: string }> },
) {
  const { drawId } = await params;
  if (!isUuid(drawId)) return Response.json({ detail: "Not found" }, { status: 404 });

  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return Response.json({ detail: "Unauthorized" }, { status: 401 });

  const result = await getPublicDraw(drawId, { fresh: true });
  if (result.status === "not_found") return Response.json({ detail: "Not found" }, { status: 404 });
  if (result.status === "error") return Response.json({ detail: "Unavailable" }, { status: 502 });

  return Response.json(result.draw, { headers: { "Cache-Control": "no-store" } });
}