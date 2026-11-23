"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { runCategoryAction } from "@/actions/draws";
import { Logo } from "@/Components/brand/logo";
import { AdBanner } from "@/Components/public/ad-banner";
import { Confetti } from "@/Components/stage/confetti";
import { PrizeSlide } from "@/Components/stage/prize-slide";
import { SummarySlide } from "@/Components/stage/summary-slide";
import { winnerKey } from "@/lib/public-utils";
import type { PublicDraw } from "@/types/public";

const SUMMARY = "summary";
const POLL_LIVE_MS = 2_000;
const POLL_DONE_MS = 10_000;
const MAX_BACKOFF_MS = 30_000;
const FRESH_MS = 20_000;
const ARM_MS = 4_000;

const firstSlide = (draw: PublicDraw) =>
  draw.categories.find((category) => category.status === "pending")?.id ?? SUMMARY;

const SHORTCUTS: [string, string][] = [
  ["← →", "Previous / next prize"],
  ["Enter", "Draw (press twice to confirm)"],
  ["A", "Show adverts"],
  ["F", "Full screen"],
  ["M", "Mute music"],
  ["Q", "Show or hide QR code"],
  ["C", "Show or hide these controls"],
  ["Esc", "Cancel"],
];

export function StageScreen({
  orgId,
  drawId,
  initial,
}: {
  orgId: string;
  drawId: string;
  initial: PublicDraw;
}) {
  const [draw, setDraw] = useState(initial);
  const [currentId, setCurrentId] = useState(() => firstSlide(initial));
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [celebration, setCelebration] = useState(0);
  const [started, setStarted] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [showAds, setShowAds] = useState(false);
  const [showQr, setShowQr] = useState(true);
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [joinUrl, setJoinUrl] = useState("");
  const [running, startTransition] = useTransition();

  const audioRef = useRef<HTMLAudioElement>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const statusRef = useRef(initial.status);
  const lastSerialized = useRef(JSON.stringify(initial));
  const knownWinners = useRef(new Set(initial.winners.map(winnerKey)));

  // ---- derived values
  const music = draw.media.filter((m) => m.kind === "music");
  const track = music.length ? music[trackIndex % music.length] : undefined;
  const ads = draw.media.filter(
    (m) => m.kind === "advert" && !m.category_id && m.media_type !== "audio",
  );
  const slideIds = [...draw.categories.map((c) => c.id), SUMMARY];
  const category = draw.categories.find((c) => c.id === currentId);
  const showingSummary = !category;
  const canDraw = false; // draws are run on the draw machine page

  // ---- live data
  const applyData = useCallback((data: PublicDraw) => {
    const serialized = JSON.stringify(data);
    if (serialized === lastSerialized.current) return;
    lastSerialized.current = serialized;

    const newWinners = data.winners.filter((w) => !knownWinners.current.has(winnerKey(w)));
    if (newWinners.length) {
      const keys = newWinners.map(winnerKey);
      keys.forEach((key) => knownWinners.current.add(key));
      setFresh((current) => new Set([...current, ...keys]));
      setCurrentId(newWinners[0].category_id); // jump to the prize that was just drawn
      setCelebration((n) => n + 1);
      setTimeout(() => {
        setFresh((current) => {
          const next = new Set(current);
          keys.forEach((key) => next.delete(key));
          return next;
        });
      }, FRESH_MS);
    }
    setDraw(data);
  }, []);

  const fetchLatest = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch(`/api/stage/${drawId}`, { cache: "no-store", signal });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as PublicDraw;
      statusRef.current = data.status;
      applyData(data);
    },
    [drawId, applyData],
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let failures = 0;
    const controller = new AbortController();

    const schedule = () => {
      if (stopped) return;
      const base = statusRef.current === "completed" ? POLL_DONE_MS : POLL_LIVE_MS;
      timer = setTimeout(tick, Math.min(base * 2 ** Math.min(failures, 4), MAX_BACKOFF_MS));
    };

    const tick = async () => {
      if (stopped) return;
      if (document.visibilityState === "hidden") return schedule();
      try {
        await fetchLatest(controller.signal);
        failures = 0;
        setOffline(false);
      } catch {
        if (controller.signal.aborted) return;
        failures += 1;
        if (failures >= 3) setOffline(true);
      }
      schedule();
    };

    schedule();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetchLatest]);

  // ---- page setup
  useEffect(() => {
    setJoinUrl(`${window.location.origin}/draw/${drawId}`);
  }, [drawId]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
      audioRef.current.volume = 0.6;
    }
  }, [muted, track?.id]);

  const keepAwake = useCallback(async () => {
    try {
      wakeLock.current = (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      // Not supported or not allowed: the screen may dim after a while.
    }
  }, []);

  useEffect(() => {
    if (!started) return;
    const reacquire = () => {
      if (document.visibilityState === "visible") void keepAwake();
    };
    document.addEventListener("visibilitychange", reacquire);
    return () => {
      document.removeEventListener("visibilitychange", reacquire);
      void wakeLock.current?.release();
    };
  }, [started, keepAwake]);

  // ---- actions
  function cancelArm() {
    clearTimeout(armTimer.current);
    setArmed(false);
  }

  function go(delta: number) {
    const index = Math.max(0, slideIds.indexOf(currentId));
    setCurrentId(slideIds[Math.min(Math.max(index + delta, 0), slideIds.length - 1)]);
    cancelArm();
  }

  function requestDraw() {
    if (running || !canDraw || !category) return;
    if (!armed) {
      setArmed(true);
      clearTimeout(armTimer.current);
      armTimer.current = setTimeout(() => setArmed(false), ARM_MS);
      return;
    }
    cancelArm();
    setError(null);
    const categoryId = category.id;
    startTransition(async () => {
      const result = await runCategoryAction(orgId, drawId, categoryId);
      if (!result?.ok) {
        setError(result?.message ?? "Could not run the draw.");
        return;
      }
      try {
        await fetchLatest();
      } catch {
        // The regular poll will pick the result up in a moment.
      }
    });
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }

  function toggleAds() {
    if (ads.length) setShowAds((value) => !value);
  }

  function startShow() {
    setStarted(true);
    audioRef.current?.play().catch(() => undefined);
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
    void keepAwake();
    (document.activeElement as HTMLElement | null)?.blur();
  }

  // The keyboard listener is registered once and always calls the latest functions.
  const latest = useRef({
    started,
    go,
    requestDraw,
    toggleAds,
    toggleFullscreen,
    escape: () => {},
    toggleControls: () => {},
    toggleMute: () => {},
    toggleQr: () => {},
  });
  useEffect(() => {
    latest.current = {
      started,
      go,
      requestDraw,
      toggleAds,
      toggleFullscreen,
      escape: () => {
        cancelArm();
        setShowAds(false);
      },
      toggleControls: () => setControlsOpen((value) => !value),
      toggleMute: () => setMuted((value) => !value),
      toggleQr: () => setShowQr((value) => !value),
    };
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const actions = latest.current;
      if (!actions.started) return;

      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      const key = event.key.toLowerCase();
      switch (key) {
        case "arrowright":
        case "pagedown":
          event.preventDefault();
          actions.go(1);
          break;
        case "arrowleft":
        case "pageup":
          event.preventDefault();
          actions.go(-1);
          break;
        case "enter":
        case " ":
        case "d":
          if (tag === "BUTTON" && (key === "enter" || key === " ")) return; // the button handles it
          event.preventDefault();
          actions.requestDraw();
          break;
        case "escape":
          actions.escape();
          break;
        case "c":
          actions.toggleControls();
          break;
        case "a":
          actions.toggleAds();
          break;
        case "f":
          actions.toggleFullscreen();
          break;
        case "m":
          actions.toggleMute();
          break;
        case "q":
          actions.toggleQr();
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ---- render
  const live = draw.status === "active";
  const winnerWord = (category?.winners_count ?? 0) === 1 ? "winner" : "winners";
  const panelButton =
    "rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40";

  return (
    <div
      className={`relative flex h-dvh w-screen flex-col overflow-hidden bg-navy-950 text-white ${
        started && !controlsOpen ? "cursor-none" : ""
      }`}
    >
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-crimson-600/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-navy-500/25 blur-3xl" />

      {track && (
        <audio
          ref={audioRef}
          key={track.id}
          src={track.url}
          preload="auto"
          autoPlay={started}
          loop={music.length === 1}
          onEnded={() => setTrackIndex((index) => index + 1)}
        />
      )}

      {/* Header */}
      <header className="relative flex items-center justify-between gap-6 px-[5vw] pt-[3vh]">
        <div className="flex min-w-0 items-center gap-4">
          {draw.organization.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draw.organization.logo_url} alt="" className="size-[clamp(2.5rem,3.5vw,3.5rem)] rounded-full bg-white object-cover" />
          ) : (
            <span className="flex size-[clamp(2.5rem,3.5vw,3.5rem)] items-center justify-center rounded-full bg-white/10 font-display text-xl font-bold">
              {draw.organization.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[clamp(1rem,1.8vw,1.8rem)] font-semibold leading-tight">{draw.organization.name}</p>
            <p className="truncate text-[clamp(0.8rem,1.2vw,1.2rem)] text-navy-200">{draw.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {offline && (
            <span role="status" className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-navy-100">
              Reconnecting…
            </span>
          )}
          {live ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-crimson-600 px-4 py-1.5 text-sm font-bold uppercase tracking-wide">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              Live
            </span>
          ) : (
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold uppercase tracking-wide">Completed</span>
          )}
        </div>
      </header>

      {/* Slide */}
      <main className="relative min-h-0 flex-1 py-[2vh]">
        {showingSummary ? (
          <SummarySlide draw={draw} />
        ) : (
          <PrizeSlide
            key={category.id}
            category={category}
            winners={draw.winners.filter((w) => w.category_id === category.id)}
            image={draw.media.find((m) => m.category_id === category.id && m.media_type === "image")}
            fresh={fresh}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative flex items-end justify-between gap-6 px-[5vw] pb-[3vh]">
        <p className="hidden w-48 text-xs text-navy-300 sm:block">{started ? "Press C for controls" : ""}</p>

        <ol aria-label="Prizes" className="flex items-center gap-2">
          {slideIds.map((id) => {
            const c = draw.categories.find((x) => x.id === id);
            const done = c ? c.status === "completed" : draw.status === "completed";
            const active = id === (showingSummary ? SUMMARY : currentId);
            return (
              <li
                key={id}
                className={`h-2.5 rounded-full transition-all ${
                  active ? "w-10 bg-crimson-500" : done ? "w-2.5 bg-white" : "w-2.5 bg-white/30"
                }`}
              />
            );
          })}
        </ol>

        <div className="flex w-48 justify-end">
          {showQr && joinUrl && (
            <div className="flex items-center gap-3 rounded-2xl bg-white p-3 text-navy-900 shadow-xl">
              <QRCodeSVG value={joinUrl} size={96} level="M" bgColor="#ffffff" fgColor="#0f1f47" />
              <p className="max-w-[6.5rem] text-xs font-bold leading-snug">Follow live on your phone</p>
            </div>
          )}
        </div>
      </footer>

      {celebration > 0 && <Confetti key={celebration} startDelay={2.4} />}

      {/* Advert interlude */}
      {showAds && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-navy-950/95 p-8">
          <div className="w-full max-w-6xl">
            <AdBanner ads={ads} />
          </div>
          <p className="text-sm text-navy-300">Press A or Esc to return</p>
        </div>
      )}

      {/* Armed hint and errors */}
      {armed && (
        <div role="status" className="fixed bottom-[14vh] left-1/2 z-30 -translate-x-1/2 rounded-full bg-crimson-600 px-6 py-3 text-lg font-semibold shadow-2xl">
          Press Enter again to draw {category?.winners_count} {winnerWord} · Esc to cancel
        </div>
      )}
      {running && (
        <div role="status" className="fixed bottom-[14vh] left-1/2 z-30 -translate-x-1/2 rounded-full bg-white px-6 py-3 text-lg font-semibold text-navy-900 shadow-2xl">
          Drawing…
        </div>
      )}
      {error && (
        <div role="alert" className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-4 bg-crimson-700 px-6 py-3 text-sm font-semibold">
          {error}
          <button type="button" onClick={() => setError(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Controls panel (hidden by default so the audience sees a clean screen) */}
      {started && controlsOpen && (
        <aside aria-label="Presenter controls" className="fixed bottom-4 left-4 z-30 w-[22rem] space-y-4 rounded-2xl bg-navy-900/95 p-5 shadow-2xl ring-1 ring-white/15 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Controls</h2>
            <button type="button" onClick={() => setControlsOpen(false)} className="text-sm text-navy-200 hover:text-white">
              Close
            </button>
          </div>

          <label className="block text-sm font-semibold">
            Prize on screen
            <select
              value={showingSummary ? SUMMARY : currentId}
              onChange={(event) => {
                setCurrentId(event.target.value);
                cancelArm();
              }}
              className="mt-1.5 block w-full rounded-lg border border-white/20 bg-navy-950 px-3 py-2 text-sm"
            >
              {draw.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.status === "completed" ? " ✓" : ""}
                </option>
              ))}
              <option value={SUMMARY}>All winners</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              requestDraw();
              (document.activeElement as HTMLElement | null)?.blur();
            }}
            disabled={!canDraw || running}
            className="w-full rounded-xl bg-crimson-600 px-4 py-3 text-[15px] font-semibold transition hover:bg-crimson-700 disabled:opacity-40"
          >
            {running
              ? "Drawing…"
              : armed
                ? "Click again to confirm"
                : canDraw
                  ? `Draw ${category?.winners_count} ${winnerWord}`
                  : "Nothing to draw here"}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => go(-1)} className={panelButton}>← Previous</button>
            <button type="button" onClick={() => go(1)} className={panelButton}>Next →</button>
            <button type="button" onClick={toggleFullscreen} className={panelButton}>{fullscreen ? "Exit full screen" : "Full screen"}</button>
            <button type="button" onClick={() => setMuted((value) => !value)} disabled={!track} className={panelButton}>{muted ? "Unmute" : "Mute"}</button>
            <button type="button" onClick={toggleAds} disabled={!ads.length} className={panelButton}>Show adverts</button>
            <button type="button" onClick={() => setShowQr((value) => !value)} className={panelButton}>{showQr ? "Hide QR" : "Show QR"}</button>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-xs text-navy-200">
            {SHORTCUTS.map(([keys, label]) => (
              <div key={keys} className="contents">
                <dt className="font-bold text-white">{keys}</dt>
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </aside>
      )}

      {/* Start screen: browsers only allow sound and full screen after a click */}
      {!started && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-navy-950 px-6 text-center">
          <Logo tone="light" />
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{draw.title}</h1>
          <p className="max-w-lg text-navy-200">
            Drag this window onto the projector, then start. It goes full screen, plays the background
            music and keeps the screen awake.
          </p>
          <button
            type="button"
            onClick={startShow}
            className="rounded-2xl bg-crimson-600 px-10 py-4 text-lg font-semibold shadow-2xl shadow-crimson-600/30 transition hover:bg-crimson-700"
          >
            Start presentation
          </button>
          <p className="text-sm text-navy-300">
            {track ? `Music: ${track.title}` : "No background music uploaded"} · {ads.length} advert
            {ads.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}