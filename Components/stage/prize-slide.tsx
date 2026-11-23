"use client";

import { RevealNumber } from "@/Components/public/reveal-number";
import { winnerKey } from "@/lib/public-utils";
import type { PublicCategory, PublicMedia, PublicWinner } from "@/types/public";

export function PrizeSlide({
  category,
  winners,
  image,
  fresh,
}: {
  category: PublicCategory;
  winners: PublicWinner[];
  image?: PublicMedia;
  fresh: ReadonlySet<string>;
}) {
  const count = category.winners_count;
  const size = count === 1 ? "xl" : count <= 4 ? "lg" : count <= 12 ? "md" : "sm";
  const stepMs = count > 10 ? 150 : 800;
  const freshKeys = winners.map(winnerKey).filter((key) => fresh.has(key));
  const drawn = category.status === "completed";

  return (
    <div className="grid h-full min-h-0 items-center gap-[4vw] px-[5vw] lg:grid-cols-[5fr_6fr]">
      <div className="hidden min-h-0 lg:block">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.title}
            className="max-h-[62vh] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-white/10"
          />
        ) : (
          <div
            aria-hidden
            className="relative mx-auto flex aspect-[4/3] w-full max-w-xl -rotate-3 items-center justify-center rounded-3xl bg-white text-navy-900 shadow-2xl"
          >
            <div className="absolute inset-y-6 left-1/2 border-l-4 border-dashed border-navy-200" />
            <span className="font-display text-[clamp(4rem,9vw,9rem)] font-bold text-crimson-600">★</span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[clamp(0.9rem,1.4vw,1.4rem)] font-semibold uppercase tracking-[0.3em] text-crimson-400">
          {count === 1 ? "1 winner" : `${count} winners`}
        </p>
        <h2 className="mt-3 font-display text-[clamp(2.5rem,6.5vw,6.5rem)] font-bold leading-none tracking-tight">
          {category.name}
        </h2>
        {category.prize_description && (
          <p className="mt-4 text-[clamp(1.1rem,2.2vw,2.2rem)] text-navy-200">{category.prize_description}</p>
        )}

        <div className="mt-[4vh]">
          {winners.length === 0 ? (
            <div className="flex items-center gap-4 text-[clamp(1.2rem,2.4vw,2.4rem)] font-semibold text-navy-200">
              <span className="relative flex size-4">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-crimson-400 opacity-75" />
                <span className="relative inline-flex size-4 rounded-full bg-crimson-500" />
              </span>
              {drawn ? "No winners recorded" : "Ready to draw"}
            </div>
          ) : (
            <ul className="flex max-h-[52vh] flex-wrap gap-x-10 gap-y-6 overflow-y-auto">
              {winners.map((winner) => {
                const key = winnerKey(winner);
                return (
                  <li key={key} className="flex flex-col items-start gap-2">
                    <RevealNumber
                      value={winner.ticket_number}
                      animate={fresh.has(key)}
                      delay={Math.max(0, freshKeys.indexOf(key)) * stepMs}
                      tone={size === "xl" ? "crimson" : "white"}
                      size={size}
                    />
                    {winner.holder_name && (
                      <span className="text-[clamp(0.9rem,1.5vw,1.6rem)] font-medium text-navy-100">
                        {winner.holder_name}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}