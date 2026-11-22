"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction } from "@/actions/auth";
import { Alert } from "@/Components/ui/alert";
import { PasswordField } from "@/Components/ui/field";
import { SubmitButton } from "@/Components/ui/submit-button";
import { jakartaSans } from "@/utils/fonts";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, undefined);

  return (
    <form action={action} className={`${jakartaSans.className}   space-y-5 `} noValidate>
      <input type="hidden" name="token" value={token} />
      {state?.message && (
        <Alert tone="error">
          {state.message}{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            Request a new link
          </Link>
        </Alert>
      )}

      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        placeholder="Create a new password"
        showRules
        error={state?.fieldErrors?.password?.[0]}
        required
      />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Repeat your new password"
        error={state?.fieldErrors?.confirmPassword?.[0]}
        required
      />

      <SubmitButton pendingText="Resetting…">Reset password</SubmitButton>
    </form>
  );
}