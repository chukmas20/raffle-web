"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import { Alert } from "@/Components/ui/alert";
import { PasswordField, TextField } from "@/Components/ui/field";
import { SubmitButton } from "@/Components/ui/submit-button";
import { jakartaSans } from "@/utils/fonts";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, undefined);

  return (
    <form action={action} className={`${jakartaSans.className}   space-y-5`} noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}

      <TextField
        label="Full name"
        name="fullName"
        autoComplete="name"
        placeholder="Chukwuma Oparaeke"
        defaultValue={state?.values?.fullName}
        error={state?.fieldErrors?.fullName?.[0]}
        required
      />
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
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        placeholder="Create a password"
        showRules
        error={state?.fieldErrors?.password?.[0]}
        required
      />
      <PasswordField
        label="Confirm password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Repeat your password"
        error={state?.fieldErrors?.confirmPassword?.[0]}
        required
      />

      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>

      <p className="text-center text-sm text-navy-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-crimson-600 hover:text-crimson-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}