import type { Metadata } from "next";
import Link from "next/link";
import { Badge, DrawStatusBadge } from "@/Components/ui/badge";
import { Breadcrumbs } from "@/Components/ui/breadcrumbs";
import { buttonClass } from "@/Components/ui/styles";
import { authApi } from "@/lib/dal";
import { formatDateTime, ORG_TYPE_LABELS } from "@/lib/format";
import { assertUuid } from "@/lib/ids";
import type { Draw, Organization } from "@/types/api";

export const metadata: Metadata = { title: "Organization" };

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  assertUuid(orgId);

  const [org, draws] = await Promise.all([
    authApi<Organization>(`/orgs/${orgId}`),
    authApi<Draw[]>(`/orgs/${orgId}/draws`),
  ]);

  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: org.name }]} />

      <section className="rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
        <Badge>{ORG_TYPE_LABELS[org.org_type]}</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900">{org.name}</h1>
        {org.description && <p className="mt-2 max-w-2xl text-navy-600">{org.description}</p>}
        {(org.contact_email || org.contact_phone) && (
          <p className="mt-3 text-sm text-navy-500">
            {[org.contact_email, org.contact_phone].filter(Boolean).join(" · ")}
          </p>
        )}
      </section>

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-navy-900">Draws</h2>
        <Link href={`/orgs/${orgId}/draws/new`} className={buttonClass("primary", "sm")}>
          New draw
        </Link>
      </div>

      {draws.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-navy-200 bg-white/60 p-10 text-center">
          <p className="text-sm text-navy-500">No draws yet. Create your first one, for example a harvest raffle.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {draws.map((draw) => (
            <li key={draw.id}>
              <Link
                href={`/orgs/${orgId}/draws/${draw.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-navy-100 bg-white p-5 transition hover:border-crimson-300 hover:shadow-md"
              >
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-900">{draw.title}</h3>
                  <p className="mt-0.5 text-sm text-navy-500">
                    {draw.categories.length} {draw.categories.length === 1 ? "prize" : "prizes"} ·{" "}
                    {formatDateTime(draw.scheduled_at)}
                  </p>
                </div>
                <DrawStatusBadge status={draw.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}