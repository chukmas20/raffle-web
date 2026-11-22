import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthHeading } from "@/Components/auth/auth-heading";
import { LoginForm } from "@/Components/auth/login-form";
import { getCurrentUser } from "@/lib/dal";
import { safeNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  reset: "Your password has been reset. Sign in with your new password.",
  registered: "Your account was created. Please sign in.",
  changed: "Your password was changed. Please sign in again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

  // The API confirms the session is valid, so stale cookies can't cause a redirect loop.
  if (await getCurrentUser()) redirect(safeNextPath(next));

  const noticeKey = Object.keys(NOTICES).find((key) => params[key]);

  return (
    <>
      <AuthHeading title="Welcome back" subtitle="Sign in to manage your raffles." />
      <LoginForm next={next} notice={noticeKey ? NOTICES[noticeKey] : undefined} />
    </>
  );
}