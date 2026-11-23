"use client";

import { RevealNumber } from "@/Components/public/reveal-number";
import { winnerKey } from "@/lib/public-utils";
import type { PublicCategory, PublicMedia, PublicWinner } from "@/types/public";

export function PrizeCard({
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
  const drawn = category.status === "completed";
  const freshKeys = winners.map(winnerKey).filter((key) => fresh.has(key));
  const single = category.winners_count === 1;

  return (
    <article className="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-sm">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt={image.title} loading="lazy" className="aspect-video w-full object-cover" />
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-navy-900">{category.name}</h3>
            {category.prize_description && <p className="mt-1 text-navy-600">{category.prize_description}</p>}
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-navy-500">
              {category.winners_count} {single ? "winner" : "winners"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              drawn ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-600"
            }`}
          >
            {drawn ? "Drawn" : "Coming up"}
          </span>
        </div>

        {winners.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-navy-200 bg-navy-50/60 px-4 py-8 text-center text-sm text-navy-500">
            {drawn ? "Winners will appear here." : "Waiting for the draw…"}
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {winners.map((winner) => {
              const key = winnerKey(winner);
              const isFresh = fresh.has(key);
              return (
                <li key={key} className="flex flex-wrap items-center gap-4">
                  {!single && (
                    <span className="flex size-8 items-center justify-center rounded-full bg-navy-50 text-sm font-bold text-navy-700">
                      {winner.position}
                    </span>
                  )}
                  <RevealNumber
                    value={winner.ticket_number}
                    animate={isFresh}
                    delay={Math.max(0, freshKeys.indexOf(key)) * 800}
                    tone={single ? "crimson" : "navy"}
                    size={single ? "lg" : "md"}
                  />
                  {winner.holder_name && (
                    <span className="text-sm font-medium text-navy-700">{winner.holder_name}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}