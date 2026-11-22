import type { Metadata } from "next";
import Link from "next/link";
import {
  generateTicketsAction,
  markSoldAction,
  updateTicketAction,
} from "@/actions/draws";
import { ActionForm } from "@/Components/ui/action-form";
import { TicketStatusBadge } from "@/Components/ui/badge";
import { Breadcrumbs } from "@/Components/ui/breadcrumbs";
import { SelectField, TextField } from "@/Components/ui/field";
import { buttonClass } from "@/Components/ui/styles";
import { authApi } from "@/lib/dal";
import { formatDateTime, formatNumber } from "@/lib/format";
import { assertUuid } from "@/lib/ids";
import type { Draw, Organization, TicketPage, TicketSummary } from "@/types/api";

export const metadata: Metadata = { title: "Tickets" };

const PAGE_SIZE = 50;
const STATUSES = ["available", "sold", "void"];

export default async function TicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; drawId: string }>;
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  const { orgId, drawId } = await params;
  assertUuid(orgId, drawId);
  const query = await searchParams;

  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const status = STATUSES.includes(query.status ?? "") ? (query.status as string) : "";
  const q = /^\d{1,6}$/.test(query.q ?? "") ? (query.q as string) : "";

  const base = `/orgs/${orgId}/draws/${drawId}`;
  const apiQuery = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
  if (status) apiQuery.set("status", status);
  if (q) apiQuery.set("search", q);

  const [org, draw, summary, tickets] = await Promise.all([
    authApi<Organization>(`/orgs/${orgId}`),
    authApi<Draw>(base),
    authApi<TicketSummary>(`${base}/tickets/summary`),
    authApi<TicketPage>(`${base}/tickets?${apiQuery}`),
  ]);

  const editable = draw.status === "draft" || draw.status === "active";
  const totalPages = Math.max(1, Math.ceil(tickets.total / PAGE_SIZE));
  const pageHref = (target: number) => {
    const params = new URLSearchParams({ page: String(target) });
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    return `/orgs/${orgId}/draws/${drawId}/tickets?${params}`;
  };

  const digits = draw.ticket_digits;
  const sample = (n: number) => String(n).padStart(digits, "0");

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: org.name, href: `/orgs/${orgId}` },
          { label: draw.title, href: base },
          { label: "Tickets" },
        ]}
      />

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          ["Total", formatNumber(summary.total)],
          ["Sold", formatNumber(summary.sold)],
          ["Available", formatNumber(summary.available)],
          ["Void", formatNumber(summary.void)],
          ["Room left", formatNumber(summary.capacity - summary.total)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-navy-100 bg-white px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-navy-500">{label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold text-navy-900">{value}</dd>
          </div>
        ))}
      </dl>

      {editable && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-navy-100 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Generate tickets</h2>
            <p className="mb-4 mt-1 text-sm text-navy-500">
              {digits}-digit numbers, for example {sample(7)} or {sample(42)}. You can generate more at any time.
            </p>
            <ActionForm
              action={generateTicketsAction.bind(null, orgId, drawId)}
              label="Generate"
              pendingText="Generating…"
              className="grid gap-4 sm:grid-cols-2"
            >
              <TextField label="How many?" name="count" type="number" min={1} max={100000} defaultValue="100" required />
              <SelectField label="Numbering" name="mode" defaultValue="random" hint="Random numbers are unpredictable.">
                <option value="random">Random</option>
                <option value="sequential">In order (1, 2, 3…)</option>
              </SelectField>
            </ActionForm>
          </section>

          <section className="rounded-2xl border border-navy-100 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Mark tickets as sold</h2>
            <p className="mb-4 mt-1 text-sm text-navy-500">
              Use a range, or paste a list of numbers. Only available tickets change.
            </p>
            <ActionForm
              action={markSoldAction.bind(null, orgId, drawId)}
              label="Mark as sold"
              pendingText="Updating…"
              className="grid gap-4 sm:grid-cols-2"
            >
              <TextField label="From" name="rangeFrom" placeholder={sample(1)} maxLength={digits} inputMode="numeric" />
              <TextField label="To" name="rangeTo" placeholder={sample(10 ** digits - 1)} maxLength={digits} inputMode="numeric" />
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-navy-800" htmlFor="numbers">
                  Or a list of numbers
                </label>
                <textarea
                  id="numbers"
                  name="numbers"
                  rows={2}
                  placeholder={`${sample(12)}, ${sample(45)}, ${sample(301)}`}
                  className="block w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-[15px] text-navy-900 placeholder:text-navy-300 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
                />
              </div>
            </ActionForm>
          </section>
        </div>
      )}

      <section className="mt-8">
        <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
          <div className="w-44">
            <TextField label="Number starts with" name="q" defaultValue={q} inputMode="numeric" maxLength={6} placeholder="e.g. 04" />
          </div>
          <div className="w-44">
            <SelectField label="Status" name="status" defaultValue={status}>
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="void">Void</option>
            </SelectField>
          </div>
          <button type="submit" className={buttonClass("outline", "md")}>
            Filter
          </button>
        </form>

        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-navy-100 bg-navy-50 text-xs uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Number</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Holder</th>
                <th className="px-4 py-3 font-semibold">Sold</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 align-top">
              {tickets.items.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-4 py-3 font-display text-lg font-bold tracking-widest text-navy-900">
                    {ticket.number}
                  </td>
                  <td className="px-4 py-3"><TicketStatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3 text-navy-700">
                    {ticket.holder_name ?? "—"}
                    {ticket.holder_phone && <span className="block text-navy-500">{ticket.holder_phone}</span>}
                  </td>
                  <td className="px-4 py-3 text-navy-500">{formatDateTime(ticket.sold_at, "—")}</td>
                  <td className="px-4 py-3">
                    {draw.status !== "cancelled" && (
                      <details>
                        <summary className="cursor-pointer font-semibold text-crimson-600">Edit</summary>
                        <ActionForm
                          action={updateTicketAction.bind(null, orgId, drawId, ticket.id)}
                          label="Save"
                          size="sm"
                          className="mt-3 w-64 space-y-3"
                        >
                          {editable && (
                            <SelectField label="Status" name="status" defaultValue={ticket.status}>
                              <option value="available">Available</option>
                              <option value="sold">Sold</option>
                              <option value="void">Void</option>
                            </SelectField>
                          )}
                          <TextField label="Holder name" name="holderName" defaultValue={ticket.holder_name ?? ""} />
                          <TextField label="Phone" name="holderPhone" type="tel" defaultValue={ticket.holder_phone ?? ""} />
                          <TextField label="Email" name="holderEmail" type="email" defaultValue={ticket.holder_email ?? ""} />
                        </ActionForm>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
              {tickets.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-navy-500">
                    No tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-navy-600">
          <span>
            Page {page} of {totalPages} · {formatNumber(tickets.total)} tickets
          </span>
          <div className="flex gap-2">
            {page > 1 && <Link href={pageHref(page - 1)} className={buttonClass("outline", "sm")}>Previous</Link>}
            {page < totalPages && <Link href={pageHref(page + 1)} className={buttonClass("outline", "sm")}>Next</Link>}
          </div>
        </div>
      </section>
    </>
  );
}