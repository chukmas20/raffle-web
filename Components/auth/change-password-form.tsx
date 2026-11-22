"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/actions/auth";
import { Alert } from "@/Components/ui/alert";
import { PasswordField } from "@/Components/ui/field";
import { SubmitButton } from "@/Components/ui/submit-button";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}

      <PasswordField
        label="Current password"
        name="currentPassword"
        autoComplete="current-password"
        error={state?.fieldErrors?.currentPassword?.[0]}
        required
      />
      <PasswordField
        label="New password"
        name="newPassword"
        autoComplete="new-password"
        showRules
        error={state?.fieldErrors?.newPassword?.[0]}
        required
      />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        error={state?.fieldErrors?.confirmPassword?.[0]}
        required
      />

      <SubmitButton pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}