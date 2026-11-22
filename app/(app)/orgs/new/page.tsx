import type { Metadata } from "next";
import { OrganizationForm } from "@/Components/orgs/organization-form";
import { Breadcrumbs } from "@/Components/ui/breadcrumbs";

export const metadata: Metadata = { title: "New organization" };

export default function NewOrganizationPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "New organization" }]} />
      <div className="rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900">Create an organization</h1>
        <p className="mb-6 mt-2 text-sm leading-relaxed text-navy-500">
          You&apos;ll become its admin and can run draws in its name.
        </p>
        <OrganizationForm />
      </div>
    </div>
  );
}