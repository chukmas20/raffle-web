"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Alert } from "@/Components/ui/alert";
import { PasswordField, TextField } from "@/Components/ui/field";
import { SubmitButton } from "@/Components/ui/submit-button";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      {notice && <Alert tone="notice">{notice}</Alert>}
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
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        placeholder="Your password"
        error={state?.fieldErrors?.password?.[0]}
        required
      />

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-semibold text-crimson-600 hover:text-crimson-700">
          Forgot password?
        </Link>
      </div>

      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>

      <p className="text-center text-sm text-navy-500">
        New to Raffle Angel?{" "}
        <Link href="/register" className="font-semibold text-crimson-600 hover:text-crimson-700">
          Create an account
        </Link>
      </p>
    </form>
  );
}