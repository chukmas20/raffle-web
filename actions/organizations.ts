"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { requireToken, text, toFeedback } from "@/lib/action-utils";
import { fieldErrorsFrom, organizationSchema } from "@/lib/validation";
import type { Organization } from "@/types/api";
import type { FormState } from "@/types/forms";

export async function createOrganizationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = await requireToken();
  const values = {
    name: text(formData, "name"),
    orgType: text(formData, "orgType") || "other",
    description: text(formData, "description"),
    contactEmail: text(formData, "contactEmail"),
    contactPhone: text(formData, "contactPhone"),
  };
  const parsed = organizationSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  let org: Organization;
  try {
    org = await apiFetch<Organization>("/orgs", {
      method: "POST",
      token,
      body: {
        name: values.name,
        org_type: values.orgType,
        description: values.description || null,
        contact_email: values.contactEmail || null,
        contact_phone: values.contactPhone || null,
      },
    });
  } catch (error) {
    return { ...toFeedback(error), values };
  }

  revalidatePath("/dashboard");
  redirect(`/orgs/${org.id}`);
}