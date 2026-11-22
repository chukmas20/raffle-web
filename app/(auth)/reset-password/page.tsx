import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/Components/auth/auth-heading";
import { ResetPasswordForm } from "@/Components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <>
        <AuthHeading
          title="Reset link missing"
          subtitle="This page needs the link from your reset email. Request a new one to continue."
        />
        <Link
          href="/forgot-password"
          className="block rounded-xl bg-crimson-600 px-4 py-3.5 text-center text-[15px] font-semibold text-white transition hover:bg-crimson-700"
        >
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Choose a new password" subtitle="Pick something strong you haven't used before." />
      <ResetPasswordForm token={token} />
    </>
  );
}