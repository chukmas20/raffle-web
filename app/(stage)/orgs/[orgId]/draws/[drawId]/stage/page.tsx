import type { Metadata } from "next";
import Link from "next/link";
import { authApi } from "@/lib/dal";
import { assertUuid } from "@/lib/ids";
import { getPublicDraw } from "@/lib/public-api";
import type { Draw } from "@/types/api";
import { StageScreen } from "@/Components/stage/stage-screen";

export const metadata: Metadata = {
  title: "Stage",
  robots: { index: false, follow: false },
};

export default async function StagePage({
  params,
}: {
  params: Promise<{ orgId: string; drawId: string }>;
}) {
  const { orgId, drawId } = await params;
  assertUuid(orgId, drawId);
  const draw = await authApi<Draw>(`/orgs/${orgId}/draws/${drawId}`);

  if (draw.status !== "active" && draw.status !== "completed") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {draw.status === "draft" ? "Activate the draw first" : "This draw was cancelled"}
        </h1>
        <p className="max-w-md text-navy-200">
          {draw.status === "draft"
            ? "Stage mode opens once the draw is live. Activate it from the draw page."
            : "Cancelled draws can't be presented."}
        </p>
        <Link
          href={`/orgs/${orgId}/draws/${drawId}`}
          className="rounded-xl bg-crimson-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-crimson-700"
        >
          Back to the draw
        </Link>
      </main>
    );
  }

  const result = await getPublicDraw(drawId, { fresh: true });
  if (result.status !== "ok") throw new Error("Could not load the draw");

  return <StageScreen orgId={orgId} drawId={drawId} initial={result.draw} />;
}