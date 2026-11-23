import type { Metadata } from "next";
import Link from "next/link";
import { activateDrawAction, addCategoryAction, cancelDrawAction } from "@/actions/draws";
import { CategoryCard } from "@/Components/draws/category-card";
import { ActionForm } from "@/Components/ui/action-form";
import { DrawStatusBadge } from "@/Components/ui/badge";
import { Breadcrumbs } from "@/Components/ui/breadcrumbs";
import { TextField } from "@/Components/ui/field";
import { buttonClass } from "@/Components/ui/styles";
import { authApi } from "@/lib/dal";
import { formatDateTime, formatNumber } from "@/lib/format";
import { assertUuid } from "@/lib/ids";
import type { Draw, DrawResults, Organization, TicketSummary } from "@/types/api";
import { CopyLinkButton } from "@/Components/ui/copy-link-button";

export const metadata: Metadata = { title: "Draw" };

export default async function DrawPage({
  params,
}: {
  params: Promise<{ orgId: string; drawId: string }>;
}) {
  const { orgId, drawId } = await params;
  assertUuid(orgId, drawId);
  const base = `/orgs/${orgId}/draws/${drawId}`;

  const [org, draw, results, summary] = await Promise.all([
    authApi<Organization>(`/orgs/${orgId}`),
    authApi<Draw>(base),
    authApi<DrawResults>(`${base}/results`),
    authApi<TicketSummary>(`${base}/tickets/summary`),
  ]);

  const editable = draw.status === "draft" || draw.status === "active";
  const hasWinners = results.categories.some((block) => block.winners.length > 0);

  const steps = [
    { label: "Add prizes", done: draw.categories.length > 0 },
    { label: "Generate tickets", done: summary.total > 0 },
    ...(draw.draw_from_sold_only ? [{ label: "Mark tickets as sold", done: summary.sold > 0 }] : []),
    { label: "Activate the draw", done: draw.status !== "draft" },
    { label: "Run each prize draw", done: draw.status === "completed" },
  ];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: org.name, href: `/orgs/${orgId}` },
          { label: draw.title },
        ]}
      />

      <section className="rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900">{draw.title}</h1>
              <DrawStatusBadge status={draw.status} />
            </div>
            {draw.description && <p className="mt-2 max-w-2xl text-navy-600">{draw.description}</p>}
            <p className="mt-3 text-sm text-navy-500">
              {formatDateTime(draw.scheduled_at)} · {draw.ticket_digits}-digit tickets ·{" "}
              {draw.draw_from_sold_only ? "Sold tickets only" : "All tickets"} ·{" "}
              {draw.exclude_previous_winners ? "One win per ticket" : "Tickets can win more than once"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`${base}/tickets`} className={buttonClass("outline", "sm")}>
              Tickets
            </Link>
                        <Link href={`${base}/media`} className={buttonClass("outline", "sm")}>
              Media
            </Link>
            {(draw.status === "active" || draw.status === "completed") && (
              <>
            {draw.status === "active" && (
              <Link href={`${base}/machine`} className={buttonClass("primary", "sm")}>
                Open draw machine
              </Link>
            )}
                <Link href={`${base}/stage`} target="_blank" className={buttonClass("outline", "sm")}>
                  Present on projector
                </Link>
                <Link href={`/draw/${drawId}`} target="_blank" className={buttonClass("outline", "sm")}>
                  Public page
                </Link>
                <CopyLinkButton path={`/draw/${drawId}`} label="Copy public link" />
              </>
            )}
            {hasWinners && (
              <a href={`${base}/export`} className={buttonClass("outline", "sm")}>
                Export results (CSV)
              </a>
            )}
            {draw.status === "draft" && (
              <ActionForm
                action={activateDrawAction.bind(null, orgId, drawId)}
                label="Activate draw"
                size="sm"
                confirm="Activate this draw? Ticket length and draw rules can't be changed afterwards."
              />
            )}
            {editable && (
              <ActionForm
                action={cancelDrawAction.bind(null, orgId, drawId)}
                label="Cancel draw"
                variant="danger"
                size="sm"
                confirm="Cancel this draw? This can't be undone."
              />
            )}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Tickets", formatNumber(summary.total)],
            ["Sold", formatNumber(summary.sold)],
            ["Available", formatNumber(summary.available)],
            ["Prizes", String(draw.categories.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-navy-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-navy-500">{label}</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-navy-900">{value}</dd>
            </div>
          ))}
        </dl>

        {editable && (
          <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {steps.map((step, index) => (
              <li key={step.label} className={`flex items-center gap-2 ${step.done ? "text-navy-900" : "text-navy-500"}`}>
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-xs font-bold ${
                    step.done ? "bg-navy-900 text-white" : "border border-navy-300"
                  }`}
                >
                  {step.done ? "✓" : index + 1}
                </span>
                {step.label}
              </li>
            ))}
          </ol>
        )}
      </section>

      <h2 className="mb-4 mt-10 font-display text-xl font-bold text-navy-900">Prizes and results</h2>

      {draw.status === "active" && draw.draw_from_sold_only && summary.sold === 0 && (
        <p className="mb-4 rounded-xl border border-crimson-200 bg-crimson-50 px-4 py-3 text-sm text-crimson-800">
          No tickets are marked as sold yet, so there is nobody to draw. Mark tickets as sold on the Tickets screen.
        </p>
      )}

      <div className="space-y-5">
        {results.categories.map((block) => (
          <CategoryCard
            key={block.category.id}
            orgId={orgId}
            drawId={drawId}
            block={block}
            drawStatus={draw.status}
          />
        ))}
        {results.categories.length === 0 && (
          <p className="rounded-2xl border border-dashed border-navy-200 bg-white/60 p-8 text-center text-sm text-navy-500">
            This draw has no prizes yet.
          </p>
        )}
      </div>

      {editable && (
        <ActionForm
          action={addCategoryAction.bind(null, orgId, drawId)}
          label="Add prize"
          variant="outline"
          className="mt-6 grid gap-4 rounded-2xl border border-navy-100 bg-white p-6 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end"
        >
          <TextField label="Prize name" name="name" placeholder="Cow Draw" required />
          <TextField label="Prize (optional)" name="prize" placeholder="One cow" />
          <TextField label="Winners" name="winners" type="number" min={1} max={1000} defaultValue="1" />
        </ActionForm>
      )}
    </>
  );
}