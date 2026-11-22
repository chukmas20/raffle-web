import { deleteCategoryAction, runCategoryAction, voidRedrawAction } from "@/actions/draws";
import { ActionForm } from "@/Components/ui/action-form";
import { CategoryStatusBadge } from "@/Components/ui/badge";
import type { CategoryResults, DrawStatus } from "@/types/api";

export function CategoryCard({
  orgId,
  drawId,
  block,
  drawStatus,
}: {
  orgId: string;
  drawId: string;
  block: CategoryResults;
  drawStatus: DrawStatus;
}) {
  const { category, winners } = block;
  const pending = category.status === "pending";
  const canRun = drawStatus === "active" && pending;
  const canEdit = (drawStatus === "draft" || drawStatus === "active") && pending;
  const canReplace = drawStatus === "active" || drawStatus === "completed";

  return (
    <article className="rounded-2xl border border-navy-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-display text-xl font-bold text-navy-900">{category.name}</h3>
            <CategoryStatusBadge status={category.status} />
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {category.prize_description ?? "No prize description"} ·{" "}
            {category.winners_count} {category.winners_count === 1 ? "winner" : "winners"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canRun && (
            <ActionForm
              action={runCategoryAction.bind(null, orgId, drawId, category.id)}
              label="Run draw"
              pendingText="Drawing…"
              confirm={`Draw ${category.winners_count} winner(s) for "${category.name}"? This can't be undone.`}
            />
          )}
          {canEdit && (
            <ActionForm
              action={deleteCategoryAction.bind(null, orgId, drawId, category.id)}
              label="Remove"
              variant="danger"
              confirm={`Remove the prize "${category.name}"?`}
            />
          )}
        </div>
      </div>

      {pending && drawStatus === "draft" && (
        <p className="mt-4 text-sm text-navy-500">Activate the draw to start drawing this prize.</p>
      )}

      {winners.length > 0 && (
        <ul className="mt-5 divide-y divide-navy-100 border-t border-navy-100">
          {winners.map((winner) => {
            const voided = winner.status === "voided";
            return (
              <li key={winner.id} className="py-4">
                <div className={`flex flex-wrap items-center gap-4 ${voided ? "opacity-60" : ""}`}>
                  <span className="flex size-8 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
                    {winner.position}
                  </span>
                  <span
                    className={`font-display text-3xl font-bold tracking-widest text-navy-900 ${voided ? "line-through" : ""}`}
                  >
                    {winner.ticket_number}
                  </span>
                  <span className="text-sm text-navy-600">
                    {winner.holder_name ?? "No holder recorded"}
                    {winner.holder_phone ? ` · ${winner.holder_phone}` : ""}
                  </span>
                  {voided && (
                    <span className="text-sm font-semibold text-crimson-700">
                      Replaced{winner.void_reason ? `: ${winner.void_reason}` : ""}
                    </span>
                  )}
                </div>

                {!voided && canReplace && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-crimson-600">
                      Winner absent? Replace
                    </summary>
                    <ActionForm
                      action={voidRedrawAction.bind(null, orgId, drawId, winner.id)}
                      label="Replace winner"
                      variant="danger"
                      size="sm"
                      confirm="Replace this winner? A new winner is drawn and this one is marked as replaced."
                      className="mt-3 flex flex-wrap items-center gap-3"
                    >
                      <input
                        name="reason"
                        required
                        minLength={3}
                        maxLength={255}
                        placeholder="Reason (for example winner not present)"
                        className="min-w-64 flex-1 rounded-xl border border-navy-200 px-3.5 py-2 text-sm placeholder:text-navy-300 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
                      />
                    </ActionForm>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}