import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthHeading } from "@/Components/auth/auth-heading";
import { RegisterForm } from "@/Components/auth/register-form";
import { getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <AuthHeading
        title="Create your account"
        subtitle="Start running fair, transparent raffles in minutes."
      />
      <RegisterForm />
    </>
  );
}