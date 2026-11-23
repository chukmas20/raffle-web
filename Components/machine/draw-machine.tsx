"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { drawNextWinnerAction, redrawWinnerAction } from "@/actions/machine";
import { Logo } from "@/Components/brand/logo";
import { Reel } from "@/Components/machine/reel";
import { Confetti } from "@/Components/stage/confetti";
import { DrawSound } from "@/lib/draw-sound";
import { ReelEngine } from "@/lib/reel-engine";
import type { MachineWinner, SpinOutcome } from "@/types/machine";

type MachineCategory = {
  id: string;
  name: string;
  prize_description: string | null;
  winners_count: number;
};

const SPEEDS = {
  quick: { label: "Quick (about 5 seconds)", spinMs: 2500, gapMs: 500 },
  standard: { label: "Standard (about 10 seconds)", spinMs: 5000, gapMs: 1000 },
  dramatic: { label: "Dramatic (about 15 seconds)", spinMs: 8000, gapMs: 1500 },
} as const;
type SpeedKey = keyof typeof SPEEDS;
type NameMode = "full" | "initial" | "hidden";
type Phase = "idle" | "spinning" | "revealed";

const digitsOf = (number: string) => number.split("").map(Number);

function displayName(name: string | null, mode: NameMode): string | null {
  const trimmed = name?.trim();
  if (!trimmed || mode === "hidden") return null;
  if (mode === "full") return trimmed;
  const parts = trimmed.split(/\s+/);
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function IconButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`flex size-10 items-center justify-center rounded-full border transition ${
        active ? "border-crimson-400 bg-crimson-600/30" : "border-white/20 hover:bg-white/10"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}

export function DrawMachine({
  orgId,
  drawId,
  orgName,
  drawTitle,
  digits,
  soldOnly,
  soldCount,
  categories,
  initialWinners,
  initialCategoryId,
  backHref,
}: {
  orgId: string;
  drawId: string;
  orgName: string;
  drawTitle: string;
  digits: number;
  soldOnly: boolean;
  soldCount: number;
  categories: MachineCategory[];
  initialWinners: Record<string, MachineWinner[]>;
  initialCategoryId: string;
  backHref: string;
}) {
  const router = useRouter();
  const [engine] = useState(() => new ReelEngine(digits));
  const [sound] = useState(() => new DrawSound());

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [winnersByCat, setWinnersByCat] = useState(initialWinners);
  const [phase, setPhase] = useState<Phase>("idle");
  const [current, setCurrent] = useState<MachineWinner | null>(null);
  const [lights, setLights] = useState<boolean[]>(() => Array(digits).fill(false));
  const [error, setError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState(0);

  const [speed, setSpeed] = useState<SpeedKey>("standard");
  const [nameMode, setNameMode] = useState<NameMode>("full");
  const [confettiOn, setConfettiOn] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const busy = useRef(false);
  const landedCount = useRef(0);
  const pending = useRef<{
    kind: "next" | "redraw";
    categoryId: string;
    replaceId?: string;
    winner: MachineWinner | null;
  } | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const stripRefs = useMemo(
    () =>
      Array.from({ length: digits }, (_, i) => (element: HTMLDivElement | null) =>
        engine.attach(i, element),
      ),
    [engine, digits],
  );

  // ---- derived values
  const category = categories.find((c) => c.id === categoryId) ?? categories[0];
  const winners = winnersByCat[category.id] ?? [];
  const total = category.winners_count;
  const complete = winners.length >= total;
  const nextCategory = categories.find(
    (c) => c.id !== category.id && (winnersByCat[c.id]?.length ?? 0) < c.winners_count,
  );
  const noSoldTickets = soldOnly && soldCount === 0;
  const config = SPEEDS[speed];
  const shownName = current ? displayName(current.name, nameMode) : null;

  // ---- setup and teardown
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSpeed("quick");
      setConfettiOn(false);
    }
    return () => {
      engine.destroy();
      sound.dispose();
    };
  }, [engine, sound]);

  useEffect(() => {
    sound.setVolume(volume);
    sound.setMuted(muted);
  }, [sound, volume, muted]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const reacquire = () => {
      if (document.visibilityState === "visible" && wakeLock.current) void keepAwake();
    };
    document.addEventListener("visibilitychange", reacquire);
    return () => {
      document.removeEventListener("visibilitychange", reacquire);
      void wakeLock.current?.release();
    };
  }, []);

  async function keepAwake() {
    try {
      wakeLock.current = (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      // Not supported: the screen may dim after a while.
    }
  }

  // The reels report back through these (kept current on every render).
  useEffect(() => {
    engine.callbacks = {
      onLanded: (index, aborted) => {
        setLights((previous) => previous.map((lit, i) => (i === index ? true : lit)));
        if (aborted) return;
        sound.reelStop();
        landedCount.current += 1;
        sound.setPace(85 + landedCount.current * 30);
      },
      onAllLanded: (aborted) => {
        sound.stop();
        busy.current = false;
        const job = pending.current;
        pending.current = null;

        if (aborted || !job?.winner) {
          setLights(Array(digits).fill(false));
          setPhase("idle");
          return;
        }

        const winner = job.winner;
        sound.win();
        setWinnersByCat((all) => {
          const list = all[job.categoryId] ?? [];
          const next = job.replaceId
            ? list.map((w) => (w.id === job.replaceId ? winner : w))
            : [...list, winner];
          return { ...all, [job.categoryId]: next };
        });
        setCurrent(winner);
        setPhase("revealed");
        if (confettiOn) setCelebration((n) => n + 1);
      },
    };
  });

  // ---- actions
  async function startSpin(kind: "next" | "redraw", replaceId?: string) {
    if (busy.current || phase === "spinning") return;
    busy.current = true;

    setError(null);
    setCurrent(null);
    setLights(Array(digits).fill(false));
    setPhase("spinning");
    landedCount.current = 0;
    pending.current = { kind, categoryId: category.id, replaceId, winner: null };

    sound.start();
    void keepAwake();
    engine.spin(performance.now() + config.spinMs, config.gapMs);

    let outcome: SpinOutcome;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const request =
        kind === "next"
          ? drawNextWinnerAction(orgId, drawId, category.id)
          : redrawWinnerAction(orgId, drawId, replaceId ?? "");
      const timeout = new Promise<SpinOutcome>((resolve) => {
        timer = setTimeout(
          () =>
            resolve({
              ok: false,
              message: "This is taking too long. Check the draw page for the result before spinning again.",
            }),
          25_000,
        );
      });
      outcome = await Promise.race([request, timeout]);
    } catch {
      outcome = { ok: false, message: "Could not reach the server. Please try again." };
    } finally {
      clearTimeout(timer);
    }

    if (!outcome.ok) {
      setError(outcome.message);
      engine.abort();
      return;
    }
    if (pending.current) pending.current.winner = outcome.winner;
    engine.setTarget(digitsOf(outcome.winner.number));
  }

  function selectCategory(id: string) {
    setCategoryId(id);
    setPhase("idle");
    setCurrent(null);
    setError(null);
    setLights(Array(digits).fill(false));
    engine.setDigits(Array(digits).fill(0));
  }

    function primary() {
    if (phase === "spinning") return; // the reels stop by themselves
    if (!complete) {
      if (!noSoldTickets) void startSpin("next");
      return;
    }
    if (nextCategory) return selectCategory(nextCategory.id);
    router.push(backHref);
  }

  function redraw() {
    if (phase !== "revealed" || !current) return;
    const ok = window.confirm(
      `Is the holder of ticket ${current.number} absent? A new winner will be drawn and this one marked as replaced.`,
    );
    if (ok) void startSpin("redraw", current.id);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }

  // Keyboard: Space or Enter = main button, M = mute, F = full screen.
  const latest = useRef({ primary, toggleFullscreen, toggleMute: () => {} });
  useEffect(() => {
    latest.current = { primary, toggleFullscreen, toggleMute: () => setMuted((value) => !value) };
  });
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const key = event.key.toLowerCase();
      if (key === "enter" || key === " ") {
        if (tag === "BUTTON" || tag === "A") return; // the focused control handles it
        event.preventDefault();
        latest.current.primary();
      } else if (key === "m") latest.current.toggleMute();
      else if (key === "f") latest.current.toggleFullscreen();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ---- render
    const buttonLabel =
    phase === "spinning"
      ? "SPINNING…"
      : complete
        ? nextCategory
          ? "NEXT PRIZE"
          : "FINISH"
        : phase === "revealed"
          ? "NEXT WINNER"
          : "SPIN";

  return (
    <div
      className="relative flex h-dvh w-screen flex-col overflow-hidden bg-navy-950 text-white"
      style={
        {
          "--reel-w": `min(11vw, ${64 / digits}vw)`,
          "--reel-h": "min(calc(var(--reel-w) * 1.45), 30vh)",
        } as React.CSSProperties
      }
    >
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-crimson-600/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-navy-500/25 blur-3xl" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between gap-4 px-[3vw] pt-[2vh]">
        <div className="flex min-w-0 items-center gap-4">
          <Link href={backHref} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold transition hover:bg-white/10">
            ← Back
          </Link>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold leading-tight">{orgName}</p>
            <p className="truncate text-xs text-navy-200">{drawTitle}</p>
          </div>
        </div>

        <Logo tone="light" className="hidden md:inline-flex" />

        <div className="flex items-center gap-2">
          <IconButton label={muted ? "Unmute sound" : "Mute sound"} onClick={() => setMuted((v) => !v)} active={muted}>
            {muted ? (
              <>
                <path d="M11 5 6 9H3v6h3l5 4V5z" />
                <path d="m22 9-6 6M16 9l6 6" />
              </>
            ) : (
              <>
                <path d="M11 5 6 9H3v6h3l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
              </>
            )}
          </IconButton>
          <IconButton label="Settings" onClick={() => setSettingsOpen((v) => !v)} active={settingsOpen}>
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="10" cy="12" r="2" />
            <circle cx="18" cy="18" r="2" />
          </IconButton>
          <IconButton label={fullscreen ? "Exit full screen" : "Full screen"} onClick={toggleFullscreen} active={fullscreen}>
            <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
          </IconButton>
        </div>
      </header>

      {/* Settings */}
      {settingsOpen && (
        <aside aria-label="Draw settings" className="absolute right-[3vw] top-[9vh] z-30 w-80 space-y-4 rounded-2xl bg-navy-900/95 p-5 text-left shadow-2xl ring-1 ring-white/15 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Settings</h2>
            <button type="button" onClick={() => setSettingsOpen(false)} className="text-sm text-navy-200 hover:text-white">
              Close
            </button>
          </div>

          <label className="block text-sm font-semibold">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="mt-2 block w-full accent-crimson-500"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMuted((v) => !v)} className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20">
              {muted ? "Unmute" : "Mute"}
            </button>
            <button type="button" onClick={() => sound.preview()} className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20">
              Test sound
            </button>
          </div>

          <label className="block text-sm font-semibold">
            Spin speed
            <select
              value={speed}
              onChange={(event) => setSpeed(event.target.value as SpeedKey)}
              disabled={phase === "spinning"}
              className="mt-1.5 block w-full rounded-lg border border-white/20 bg-navy-950 px-3 py-2 text-sm"
            >
              {(Object.keys(SPEEDS) as SpeedKey[]).map((key) => (
                <option key={key} value={key}>
                  {SPEEDS[key].label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Winner name
            <select
              value={nameMode}
              onChange={(event) => setNameMode(event.target.value as NameMode)}
              className="mt-1.5 block w-full rounded-lg border border-white/20 bg-navy-950 px-3 py-2 text-sm"
            >
              <option value="full">Show full name</option>
              <option value="initial">First name and initial</option>
              <option value="hidden">Hide names</option>
            </select>
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={confettiOn} onChange={(event) => setConfettiOn(event.target.checked)} className="size-4 accent-crimson-500" />
            Confetti when a winner is revealed
          </label>

          <p className="border-t border-white/10 pt-3 text-xs text-navy-300">
             Space or Enter: spin · M: mute · F: full screen
          </p>
        </aside>
      )}

      {/* Machine */}
      <main className="relative z-0 flex min-h-0 flex-1 flex-col items-center justify-center gap-[2vh] px-4 pb-[2vh] text-center">
        <div>
          <h1 className="bg-gradient-to-b from-white to-crimson-300 bg-clip-text font-display text-[clamp(1.8rem,4.2vw,4rem)] font-bold uppercase leading-none tracking-[0.12em] text-transparent">
            {category.name}
          </h1>
          <p className="mt-2 text-[clamp(0.9rem,1.5vw,1.4rem)] text-navy-200">
            {category.prize_description ? `${category.prize_description} · ` : ""}
            {complete ? "All winners drawn" : `Winner ${winners.length + 1} of ${total}`}
          </p>
          {categories.length > 1 && phase !== "spinning" && (
            <select
              aria-label="Prize"
              value={category.id}
              onChange={(event) => selectCategory(event.target.value)}
              className="mt-3 rounded-lg border border-white/20 bg-navy-900 px-3 py-1.5 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {(winnersByCat[c.id]?.length ?? 0) >= c.winners_count ? " ✓" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="relative rounded-[2rem] bg-gradient-to-b from-crimson-500 to-crimson-800 p-[1.2vw] shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
          <div aria-hidden className="absolute -top-3 left-1/2 h-4 w-28 -translate-x-1/2 rounded-t-xl bg-crimson-400" />
          <div className="rounded-2xl bg-navy-900/95 px-[2vw] pb-[1.5vh] pt-[2.2vh] ring-2 ring-white/10">
            <div className="flex items-start justify-center gap-[1.4vw]">
               {stripRefs.map((ref, i) => (
                <Reel key={i} stripRef={ref} lit={lights[i]} />
              ))}
            </div>

            <div className="mt-[1.5vh] flex min-h-[clamp(2.6rem,6vh,4rem)] items-center justify-center">
              {phase === "revealed" && shownName && (
                <p
                  key={current?.id}
                  className="rounded-xl bg-white px-[2vw] py-2 font-display text-[clamp(1.3rem,3vw,2.8rem)] font-bold text-navy-900 shadow-xl"
                  style={{ animation: "nameplate-in 0.6s ease-out both" }}
                >
                  {shownName}
                </p>
              )}
            </div>
          </div>
        </div>

               <button
          type="button"
          onClick={() => {
            primary();
            (document.activeElement as HTMLElement | null)?.blur();
          }}
          disabled={phase === "spinning" || (noSoldTickets && !complete)}
          className={`rounded-full bg-gradient-to-b from-crimson-500 to-crimson-700 px-[clamp(2.5rem,5vw,4.5rem)] py-[clamp(0.8rem,1.8vh,1.2rem)] font-display text-[clamp(1rem,1.8vw,1.6rem)] font-bold tracking-wider shadow-[0_10px_30px_rgba(216,34,47,0.45)] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
            phase === "spinning" ? "animate-pulse" : ""
          }`}
        >
          {buttonLabel}
        </button>

        <div className="flex min-h-[3.5rem] flex-col items-center gap-2">
          {noSoldTickets && (
            <p className="text-sm text-crimson-300">No tickets are marked as sold yet. Mark some as sold first.</p>
          )}
          {error && (
            <p role="alert" className="max-w-xl rounded-lg bg-crimson-700/80 px-4 py-2 text-sm font-semibold">
              {error}
            </p>
          )}
          {phase === "revealed" && current && (
            <button type="button" onClick={redraw} className="text-sm font-semibold text-navy-200 underline decoration-dotted underline-offset-4 hover:text-white">
              Winner absent? Redraw
            </button>
          )}
          {winners.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-2" aria-label="Winners so far">
              {winners.map((winner) => {
                const name = displayName(winner.name, nameMode);
                return (
                  <li key={winner.id} className="rounded-full bg-white/10 px-3 py-1 text-sm">
                    <span className="font-bold tabular-nums">{winner.number}</span>
                    {name && <span className="text-navy-200"> · {name}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <p className="sr-only" aria-live="polite">
        {phase === "revealed" && current ? `Winner: ticket ${current.number}${shownName ? `, ${shownName}` : ""}` : ""}
      </p>

      {celebration > 0 && confettiOn && <Confetti key={celebration} count={180} spread={4.5} />}
    </div>
  );
}