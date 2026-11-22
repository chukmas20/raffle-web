import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/Components/brand/logo";
import { RoleBadge } from "@/Components/ui/role-badge";
import { requireUser } from "@/lib/dal";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-navy-50/60">
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/dashboard" aria-label="Raffle Angel dashboard">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-navy-600 sm:flex">
            <Link href="/dashboard" className="transition hover:text-crimson-600">Dashboard</Link>
            <Link href="/account/password" className="transition hover:text-crimson-600">Password</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-navy-900">{user.full_name}</p>
              <RoleBadge role={user.role} />
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-navy-200 px-3.5 py-2 text-sm font-semibold text-navy-800 transition hover:border-crimson-600 hover:text-crimson-700"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-5 border-t border-navy-100 px-4 py-2.5 text-sm font-medium text-navy-600 sm:hidden">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/account/password">Password</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}