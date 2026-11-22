import type { Metadata } from "next";
import { ChangePasswordForm } from "@/Components/auth/change-password-form";

export const metadata: Metadata = { title: "Change password" };

export default function ChangePasswordPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900">Change password</h1>
      <p className="mt-2 mb-6 text-sm leading-relaxed text-navy-500">
        You&apos;ll be signed out of every device afterwards and asked to sign in again.
      </p>
      <ChangePasswordForm />
    </div>
  );
}