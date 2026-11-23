"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicMedia } from "@/types/public";

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
} as const;

export function MusicPlayer({ tracks }: { tracks: PublicMedia[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [started, setStarted] = useState(false);
  const [wantPlaying, setWantPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [index, setIndex] = useState(0);

  const track = tracks.length ? tracks[index % tracks.length] : undefined;
  const trackId = track?.id;

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = muted;
    }
  }, [volume, muted, trackId]);

  // Pause the music when a visitor starts a video or audio clip with sound.
  useEffect(() => {
    const onPlay = (event: Event) => {
      const element = event.target;
      if (element instanceof HTMLMediaElement && element !== audioRef.current && !element.muted) {
        audioRef.current?.pause();
        setWantPlaying(false);
      }
    };
    document.addEventListener("play", onPlay, true);
    return () => document.removeEventListener("play", onPlay, true);
  }, []);

  if (!track) return null;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    setStarted(true);
    if (wantPlaying) {
      audio.pause();
      setWantPlaying(false);
    } else {
      audio.play().then(() => setWantPlaying(true)).catch(() => setWantPlaying(false));
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3">
      <audio
        ref={audioRef}
        key={track.id}
        src={track.url}
        preload="auto"
        autoPlay={wantPlaying}
        loop={tracks.length === 1}
        onEnded={() => setIndex((i) => (i + 1) % tracks.length)}
      />

      {!started ? (
        <button
          type="button"
          onClick={toggle}
          className="mx-auto flex items-center gap-2 rounded-full bg-crimson-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-2xl shadow-crimson-600/30 transition hover:bg-crimson-700"
        >
          <svg {...iconProps}><path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" /></svg>
          Turn on music
        </button>
      ) : (
        <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-navy-900 px-4 py-3 text-white shadow-2xl ring-1 ring-white/10">
          <button
            type="button"
            onClick={toggle}
            aria-label={wantPlaying ? "Pause music" : "Play music"}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-crimson-600 transition hover:bg-crimson-700"
          >
            {wantPlaying ? (
              <svg {...iconProps}><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
            ) : (
              <svg {...iconProps}><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{track.title}</p>
            <p className="text-xs text-navy-200">
              {wantPlaying ? "Now playing" : "Paused"}
              {tracks.length > 1 && ` · Track ${(index % tracks.length) + 1} of ${tracks.length}`}
            </p>
          </div>

          {tracks.length > 1 && (
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % tracks.length)}
              aria-label="Next track"
              className="text-navy-200 transition hover:text-white"
            >
              <svg {...iconProps}><path d="M6 6v12l8.5-6L6 6zm9 0h2v12h-2z" /></svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={muted}
            className="text-navy-200 transition hover:text-white"
          >
            {muted ? (
              <svg {...iconProps}><path d="M3 10v4h4l5 4V6L7 10H3zm13.6 2 2.4-2.4-1.4-1.4-2.4 2.4-2.4-2.4-1.4 1.4 2.4 2.4-2.4 2.4 1.4 1.4 2.4-2.4 2.4 2.4 1.4-1.4-2.4-2.4z" /></svg>
            ) : (
              <svg {...iconProps}><path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" /></svg>
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="Volume"
            className="hidden w-24 accent-crimson-500 sm:block"
          />
        </div>
      )}
    </div>
  );
}