import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/Components/ui/styles";
import { authApi, requireUser } from "@/lib/dal";
import { ORG_TYPE_LABELS } from "@/lib/format";
import type { Organization } from "@/types/api";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const orgs = await authApi<Organization[]>("/orgs");
  const firstName = user.full_name.split(" ")[0];

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-8 text-white sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-crimson-600/30 blur-3xl" />
        <p className="relative text-sm font-medium text-navy-200">Welcome back</p>
        <h1 className="relative mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{firstName}</h1>
        <p className="relative mt-3 max-w-xl text-navy-200">
          Create an organization, set up a draw, generate tickets and pick winners fairly.
        </p>
      </section>

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-navy-900">Your organizations</h2>
        {orgs.length > 0 && (
          <Link href="/orgs/new" className={buttonClass("primary", "sm")}>
            New organization
          </Link>
        )}
      </div>

      {orgs.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-navy-200 bg-white/60 p-10 text-center">
          <h3 className="font-display text-lg font-bold text-navy-900">Start with your organization</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy-500">
            A school, church, NGO or community group. You&apos;ll be its admin and can run raffles in its name.
          </p>
          <Link href="/orgs/new" className={`${buttonClass("primary")} mt-6`}>
            Create your organization
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/orgs/${org.id}`}
              className="rounded-2xl border border-navy-100 bg-white p-6 transition hover:border-crimson-300 hover:shadow-lg"
            >
              <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                {ORG_TYPE_LABELS[org.org_type]}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-navy-900">{org.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-navy-500">
                {org.description ?? "No description yet"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}