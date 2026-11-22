"use client";

import { useActionState } from "react";
import { createOrganizationAction } from "@/actions/organizations";
import { Alert } from "@/Components/ui/alert";
import { SelectField, TextAreaField, TextField } from "@/Components/ui/field";
import { SubmitButton } from "@/Components/ui/submit-button";
import { ORG_TYPE_LABELS } from "@/lib/format";

export function OrganizationForm() {
  const [state, action] = useActionState(createOrganizationAction, undefined);
  const errors = state?.fieldErrors;

  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}

      <TextField
        label="Organization name"
        name="name"
        placeholder="Grace Chapel International"
        defaultValue={state?.values?.name}
        error={errors?.name?.[0]}
        required
      />
      <SelectField
        label="Type"
        name="orgType"
        defaultValue={state?.values?.orgType ?? "church"}
        error={errors?.orgType?.[0]}
      >
        {Object.entries(ORG_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <TextAreaField
        label="Description (optional)"
        name="description"
        placeholder="A short note about your organization"
        defaultValue={state?.values?.description}
        error={errors?.description?.[0]}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Contact email (optional)"
          name="contactEmail"
          type="email"
          defaultValue={state?.values?.contactEmail}
          error={errors?.contactEmail?.[0]}
        />
        <TextField
          label="Contact phone (optional)"
          name="contactPhone"
          type="tel"
          defaultValue={state?.values?.contactPhone}
          error={errors?.contactPhone?.[0]}
        />
      </div>

      <SubmitButton pendingText="Creating…">Create organization</SubmitButton>
    </form>
  );
}