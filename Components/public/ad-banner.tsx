"use client";

import { useEffect, useState } from "react";
import type { PublicMedia } from "@/types/public";

const IMAGE_SECONDS = 6;

export function AdBanner({ ads }: { ads: PublicMedia[] }) {
  const [index, setIndex] = useState(0);
  const count = ads.length;
  const current = count ? ads[index % count] : undefined;
  const currentId = current?.id;
  const currentType = current?.media_type;

  // Depend on stable ids, so the live updates don't restart the timer every few seconds.
  useEffect(() => {
    if (!currentId || count < 2 || currentType !== "image") return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), IMAGE_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [currentId, currentType, count]);

  if (!current) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-navy-950">
      <div className="aspect-[16/7] w-full">
        {current.media_type === "video" ? (
          <video
            key={current.id}
            src={current.url}
            autoPlay
            muted
            playsInline
            loop={count === 1}
            onEnded={() => setIndex((i) => (i + 1) % count)}
            className="size-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={current.id} src={current.url} alt={current.title} className="size-full object-contain" />
        )}
      </div>

      <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white">
        Advert
      </span>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {ads.map((ad, i) => (
            <button
              key={ad.id}
              type="button"
              aria-label={`Show advert ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === index % count ? "w-6 bg-white" : "w-2 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}