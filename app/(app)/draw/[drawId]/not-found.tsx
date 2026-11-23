import Link from "next/link";
import { Logo } from "@/Components/brand/logo";

export default function DrawNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center">
      <Logo />
      <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900">This draw isn&apos;t available</h1>
      <p className="max-w-md text-navy-500">
        It may not have started yet, or the link may be wrong. Ask the organizer for the latest link.
      </p>
      <Link href="/" className="text-sm font-semibold text-crimson-600 hover:text-crimson-700">
        Go to Raffle Angel
      </Link>
    </main>
  );
}