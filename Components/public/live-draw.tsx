"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/Components/brand/logo";
import { AdBanner } from "@/Components/public/ad-banner";
import { MusicPlayer } from "@/Components/public/music-player";
import { PrizeCard } from "@/Components/public/prize-card";
import { ShareButtons } from "@/Components/public/share-buttons";
import { formatDateTime, ORG_TYPE_LABELS } from "@/lib/format";
import { winnerKey } from "@/lib/public-utils";
import type { PublicDraw } from "@/types/public";

const LIVE_INTERVAL = 4_000;
const DONE_INTERVAL = 30_000;
const MAX_INTERVAL = 60_000;

export function LiveDraw({ drawId, initial }: { drawId: string; initial: PublicDraw }) {
  const [draw, setDraw] = useState(initial);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [reconnecting, setReconnecting] = useState(false);

  const statusRef = useRef(initial.status);
  const lastSerialized = useRef(JSON.stringify(initial));
  const knownWinners = useRef(new Set(initial.winners.map(winnerKey)));

  // Poll for updates: every 4 s while live, every 30 s when completed, backing off on errors,
  // and pausing while the tab is hidden.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let failures = 0;
    const controller = new AbortController();

    const schedule = () => {
      if (stopped) return;
      const base = statusRef.current === "completed" ? DONE_INTERVAL : LIVE_INTERVAL;
      timer = setTimeout(tick, Math.min(base * 2 ** Math.min(failures, 4), MAX_INTERVAL));
    };

    const tick = async () => {
      if (stopped) return;
      if (document.visibilityState === "hidden") {
        schedule();
        return;
      }
      try {
        const response = await fetch(`/api/public/draws/${drawId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as PublicDraw;

        failures = 0;
        setReconnecting(false);
        statusRef.current = data.status;

        const serialized = JSON.stringify(data);
        if (serialized !== lastSerialized.current) {
          lastSerialized.current = serialized;
          const newKeys = data.winners
            .map(winnerKey)
            .filter((key) => !knownWinners.current.has(key));
          if (newKeys.length) {
            newKeys.forEach((key) => knownWinners.current.add(key));
            setFresh((current) => new Set([...current, ...newKeys]));
          }
          setDraw(data);
        }
      } catch {
        if (controller.signal.aborted) return;
        failures += 1;
        if (failures >= 3) setReconnecting(true);
      }
      schedule();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && !stopped) {
        clearTimeout(timer);
        void tick();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    schedule();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [drawId]);

  const { organization, media, categories } = draw;
  const live = draw.status === "active";
  const upcoming = live && draw.scheduled_at && new Date(draw.scheduled_at) > new Date();

  const music = media.filter((m) => m.kind === "music");
  const ads = media.filter((m) => m.kind === "advert" && !m.category_id && m.media_type !== "audio");
  const videos = media.filter((m) => m.media_type === "video" && (m.kind === "video" || m.category_id));
  const audios = media.filter((m) => m.media_type === "audio" && m.kind !== "music");
  const prizeImage = (categoryId: string) =>
    media.find((m) => m.category_id === categoryId && m.media_type === "image");
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name;

  return (
    <div className="min-h-screen bg-navy-50/60 pb-28">
      <header className="relative overflow-hidden bg-navy-900 text-white">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-crimson-600/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-navy-500/30 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 py-10 sm:py-14">
          <div className="flex items-center gap-3">
            {organization.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={organization.logo_url} alt="" className="size-10 rounded-full bg-white object-cover" />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-white/10 font-display text-lg font-bold">
                {organization.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <p className="font-semibold leading-tight">{organization.name}</p>
              <p className="text-xs text-navy-200">{ORG_TYPE_LABELS[organization.org_type]}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{draw.title}</h1>
            {live ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-crimson-600 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                Live
              </span>
            ) : (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                Completed
              </span>
            )}
          </div>

          {draw.description && <p className="mt-4 max-w-2xl text-navy-100">{draw.description}</p>}
          {draw.scheduled_at && (
            <p className="mt-3 text-sm text-navy-200">
              {upcoming ? "Draw starts " : "Scheduled for "}
              {formatDateTime(draw.scheduled_at)}
            </p>
          )}

          <div className="mt-6">
            <ShareButtons title={`${draw.title} · ${organization.name}`} />
          </div>
        </div>
      </header>

      {reconnecting && (
        <p role="status" className="bg-navy-900 px-5 py-2 text-center text-sm text-navy-100">
          Reconnecting… results will update as soon as you&apos;re back online.
        </p>
      )}

      <main className="mx-auto max-w-5xl space-y-12 px-5 py-10">
        <section aria-labelledby="prizes">
          <h2 id="prizes" className="mb-5 font-display text-2xl font-bold tracking-tight text-navy-900">
            Prizes
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category) => (
              <PrizeCard
                key={category.id}
                category={category}
                winners={draw.winners.filter((w) => w.category_id === category.id)}
                image={prizeImage(category.id)}
                fresh={fresh}
              />
            ))}
          </div>
        </section>

        {ads.length > 0 && (
          <section aria-label="Adverts">
            <AdBanner ads={ads} />
          </section>
        )}

        {videos.length > 0 && (
          <section aria-labelledby="videos">
            <h2 id="videos" className="mb-5 font-display text-2xl font-bold tracking-tight text-navy-900">
              Videos
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {videos.map((video) => (
                <figure key={video.id} className="overflow-hidden rounded-2xl border border-navy-100 bg-white">
                  <video src={video.url} controls preload="metadata" playsInline className="aspect-video w-full bg-black" />
                  <figcaption className="px-4 py-3 text-sm font-semibold text-navy-800">
                    {video.title}
                    {categoryName(video.category_id) && (
                      <span className="ml-2 font-normal text-navy-500">· {categoryName(video.category_id)}</span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {audios.length > 0 && (
          <section aria-labelledby="audio">
            <h2 id="audio" className="mb-5 font-display text-2xl font-bold tracking-tight text-navy-900">
              Listen
            </h2>
            <div className="space-y-3">
              {audios.map((clip) => (
                <div key={clip.id} className="rounded-2xl border border-navy-100 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold text-navy-800">{clip.title}</p>
                  <audio src={clip.url} controls preload="none" className="w-full" />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-5 pb-8 text-sm text-navy-500">
        Powered by <Logo />
      </footer>

      <MusicPlayer tracks={music} />
    </div>
  );
}