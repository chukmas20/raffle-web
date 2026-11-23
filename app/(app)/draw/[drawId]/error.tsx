"use client";

export default function DrawError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <h1 className="font-display text-2xl font-bold text-navy-900">We couldn&apos;t load this draw</h1>
      <p className="max-w-md text-navy-500">Check your connection and try again.</p>
      <button
        onClick={reset}
        className="rounded-xl bg-crimson-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-crimson-700"
      >
        Try again
      </button>
    </main>
  );
}