import type { Metadata } from "next";
import { createDrawAction } from "@/actions/draws";
import { DrawForm } from "@/Components/draws/draw-form";
import { Breadcrumbs } from "@/Components/ui/breadcrumbs";
import { authApi } from "@/lib/dal";
import { assertUuid } from "@/lib/ids";
import type { Organization } from "@/types/api";

export const metadata: Metadata = { title: "New draw" };

export default async function NewDrawPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  assertUuid(orgId);
  const org = await authApi<Organization>(`/orgs/${orgId}`);

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: org.name, href: `/orgs/${orgId}` },
          { label: "New draw" },
        ]}
      />
      <div className="rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900">Create a draw</h1>
        <p className="mb-6 mt-2 text-sm leading-relaxed text-navy-500">
          Set up the draw and its prizes. You&apos;ll generate tickets on the next screen.
        </p>
        <DrawForm action={createDrawAction.bind(null, orgId)} cancelHref={`/orgs/${orgId}`} />
      </div>
    </div>
  );
}