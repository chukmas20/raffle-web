"use client";

import { RevealNumber } from "@/Components/public/reveal-number";
import { winnerKey } from "@/lib/public-utils";
import type { PublicDraw } from "@/types/public";

export function SummarySlide({ draw }: { draw: PublicDraw }) {
  const done = draw.status === "completed";

  return (
    <div className="h-full overflow-y-auto px-[5vw] py-4">
      <h2 className="font-display text-[clamp(2rem,4.5vw,4.5rem)] font-bold leading-tight tracking-tight">
        {done ? "Congratulations to all winners!" : "Results so far"}
      </h2>

      <div className="mt-[3vh] grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {draw.categories.map((category) => {
          const winners = draw.winners.filter((w) => w.category_id === category.id);
          return (
            <section key={category.id} className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
              <h3 className="font-display text-xl font-bold">{category.name}</h3>
              {category.prize_description && (
                <p className="mt-1 text-sm text-navy-200">{category.prize_description}</p>
              )}
              {winners.length === 0 ? (
                <p className="mt-4 text-sm text-navy-300">Not drawn yet</p>
              ) : (
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-4">
                  {winners.map((winner) => (
                    <li key={winnerKey(winner)} className="flex flex-col gap-1.5">
                      <RevealNumber value={winner.ticket_number} tone="white" size="md" />
                      {winner.holder_name && (
                        <span className="text-xs text-navy-200">{winner.holder_name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}