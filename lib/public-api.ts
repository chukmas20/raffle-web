import "server-only";
import { getApiUrl } from "@/lib/env";
import type { PublicDraw } from "@/types/public";

type Result = { status: "ok"; draw: PublicDraw } | { status: "not_found" } | { status: "error" };

export async function getPublicDraw(
  drawId: string,
  options: { fresh?: boolean } = {},
): Promise<Result> {
  try {
    const response = await fetch(`${getApiUrl()}/public/draws/${drawId}`, {
      ...(options.fresh ? { cache: "no-store" as const } : { next: { revalidate: 2 } }),
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "error" };
    return { status: "ok", draw: (await response.json()) as PublicDraw };
  } catch {
    return { status: "error" };
  }
}