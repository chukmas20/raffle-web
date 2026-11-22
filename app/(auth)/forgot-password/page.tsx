import type { Metadata } from "next";
import { AuthHeading } from "@/Components/auth/auth-heading";
import { ForgotPasswordForm } from "@/Components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Forgot your password?"
        subtitle="Enter your email and we'll send you a link to choose a new one."
      />
      <ForgotPasswordForm />
    </>
  );
}