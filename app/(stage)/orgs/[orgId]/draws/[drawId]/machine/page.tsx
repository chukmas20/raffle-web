import type { Metadata } from "next";
import Link from "next/link";
import { DrawMachine } from "@/Components/machine/draw-machine";
import { authApi } from "@/lib/dal";
import { assertUuid, isUuid } from "@/lib/ids";
import type { Draw, DrawResults, Organization, TicketSummary } from "@/types/api";
import type { MachineWinner } from "@/types/machine";

export const metadata: Metadata = {
  title: "Draw machine",
  robots: { index: false, follow: false },
};

export default async function MachinePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; drawId: string }>;
  searchParams: Promise<{ prize?: string }>;
}) {
  const { orgId, drawId } = await params;
  assertUuid(orgId, drawId);
  const { prize } = await searchParams;
  const base = `/orgs/${orgId}/draws/${drawId}`;

  const [org, draw, results, summary] = await Promise.all([
    authApi<Organization>(`/orgs/${orgId}`),
    authApi<Draw>(base),
    authApi<DrawResults>(`${base}/results`),
    authApi<TicketSummary>(`${base}/tickets/summary`),
  ]);

  if (draw.status !== "active") {
    const message = {
      draft: ["Activate the draw first", "The draw machine opens once the draw is live."],
      completed: ["All prizes have been drawn", "This draw is complete. You can review the winners on the draw page."],
      cancelled: ["This draw was cancelled", "Cancelled draws can't be run."],
    }[draw.status];
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">{message[0]}</h1>
        <p className="max-w-md text-navy-200">{message[1]}</p>
        <Link
          href={base}
          className="rounded-xl bg-crimson-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-crimson-700"
        >
          Back to the draw
        </Link>
      </main>
    );
  }

  const initialWinners: Record<string, MachineWinner[]> = {};
  for (const block of results.categories) {
    initialWinners[block.category.id] = block.winners
      .filter((w) => w.status === "active")
      .sort((a, b) => a.position - b.position)
      .map((w) => ({ id: w.id, number: w.ticket_number, name: w.holder_name, position: w.position }));
  }

  const categories = draw.categories.map((c) => ({
    id: c.id,
    name: c.name,
    prize_description: c.prize_description,
    winners_count: c.winners_count,
  }));
  const isOpen = (id: string) =>
    (initialWinners[id]?.length ?? 0) < (categories.find((c) => c.id === id)?.winners_count ?? 0);

  const requested = prize && isUuid(prize) && categories.some((c) => c.id === prize) ? prize : null;
  const initialCategoryId =
    (requested && isOpen(requested) ? requested : null) ??
    categories.find((c) => isOpen(c.id))?.id ??
    categories[0].id;

  return (
    <DrawMachine
      orgId={orgId}
      drawId={drawId}
      orgName={org.name}
      drawTitle={draw.title}
      digits={draw.ticket_digits}
      soldOnly={draw.draw_from_sold_only}
      soldCount={summary.sold}
      categories={categories}
      initialWinners={initialWinners}
      initialCategoryId={initialCategoryId}
      backHref={base}
    />
  );
}