import { Logo } from "@/Components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-crimson-600/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-navy-500/30 blur-3xl" />

        <Logo tone="light" className="relative" />

        <div className="relative">
          <h2 className="max-w-md font-display text-4xl font-bold leading-tight tracking-tight">
            Raffles your community can <span className="text-crimson-400">trust</span>.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-navy-200">
            Create draws for your school, church or NGO. Generate tickets in seconds, pick winners
            fairly and keep every result on record.
          </p>

          <div aria-hidden className="mt-10 w-72 -rotate-3 rounded-2xl bg-white p-5 text-navy-900 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-crimson-600">Harvest Raffle</p>
            <p className="mt-1 font-display text-4xl font-bold tracking-tight">No. 0427</p>
            <div className="my-4 border-t-2 border-dashed border-navy-200" />
            <p className="text-xs text-navy-500">Grand prize · Toyota Corolla</p>
          </div>
        </div>

        <p className="relative text-sm text-navy-300">© {new Date().getFullYear()} Raffle Angel</p>
      </aside>

      <main className="flex flex-col">
        <header className="px-6 py-5 lg:hidden">
          <Logo />
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}