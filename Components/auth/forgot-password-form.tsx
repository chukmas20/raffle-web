"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "@/actions/auth";
import { Alert } from "@/Components/ui/alert";
import { TextField } from "@/Components/ui/field";
import { SubmitButton } from "@/Components/ui/submit-button";
import { jakartaSans } from "@/utils/fonts";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, undefined);

  if (state?.ok) {
    return (
      <div className="space-y-6">
        <Alert tone="notice">{state.message}</Alert>
        <Link href="/login" className="block text-center text-sm font-semibold text-crimson-600 hover:text-crimson-700">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className={`${jakartaSans.className}   space-y-5`} noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}

      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        defaultValue={state?.values?.email}
        error={state?.fieldErrors?.email?.[0]}
        required
      />

      <SubmitButton pendingText="Sending link…">Send reset link</SubmitButton>

      <p className="text-center text-sm text-navy-500">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-crimson-600 hover:text-crimson-700">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}