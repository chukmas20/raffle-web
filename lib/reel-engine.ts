const DIGITS = 10;
const COPIES = 3; // each reel strip holds 0-9 three times, so it can wrap around smoothly
const SPIN_SPEED = 15; // digits per second while spinning
const BASE_TRAVEL = 5; // minimum digits a reel keeps rolling while it slows down
const MAX_BLUR = 2.8;

type Mode = "idle" | "spinning" | "stopping";

type Reel = {
  pos: number;
  dir: 1 | -1;
  mode: Mode;
  stopAt: number;
  p0: number;
  p1: number;
  t0: number;
  dur: number;
  landed: boolean;
};

export type ReelCallbacks = {
  onLanded: (index: number, aborted: boolean) => void;
  onAllLanded: (aborted: boolean) => void;
};

const mod = (value: number, size: number) => ((value % size) + size) % size;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Animates the reels directly on the DOM, so React doesn't re-render on every frame. */
export class ReelEngine {
  callbacks: ReelCallbacks = { onLanded: () => {}, onAllLanded: () => {} };

  private reels: Reel[];
  private strips: (HTMLElement | null)[];
  private target: number[] | null = null;
  private aborted = false;
  private raf = 0;
  private last = 0;

  constructor(count: number) {
    this.reels = Array.from(
      { length: count },
      (_, i): Reel => ({
        pos: 0,
        dir: i % 2 === 0 ? 1 : -1, // neighbouring reels roll in opposite directions
        mode: "idle",
        stopAt: Infinity,
        p0: 0,
        p1: 0,
        t0: 0,
        dur: 1000,
        landed: false,
      }),
    );
    this.strips = Array(count).fill(null);
  }

  attach(index: number, element: HTMLElement | null) {
    this.strips[index] = element;
    this.render(index, 0);
  }

  setDigits(digits: number[]) {
    this.reels.forEach((reel, i) => {
      reel.pos = digits[i] ?? 0;
      reel.mode = "idle";
      this.render(i, 0);
    });
  }

  /** Start every reel rolling. Reel i may start stopping at firstStopAt + i * gapMs. */
  spin(firstStopAt: number, gapMs: number) {
    this.target = null;
    this.aborted = false;
    this.reels.forEach((reel, i) => {
      reel.mode = "spinning";
      reel.landed = false;
      reel.stopAt = firstStopAt + i * gapMs;
    });
    this.ensureRunning();
  }

  /** The winning digits. Reels only start slowing down once these are known. */
  setTarget(digits: number[]) {
    this.target = digits;
    this.ensureRunning();
  }

  stopReel(index: number) {
    const reel = this.reels[index];
    if (reel.mode === "spinning") reel.stopAt = Math.min(reel.stopAt, performance.now());
  }

  stopAll() {
    const now = performance.now();
    this.reels.forEach((reel, i) => {
      if (reel.mode === "spinning") reel.stopAt = Math.min(reel.stopAt, now + i * 220);
    });
  }

  /** Something went wrong: bring the reels to a halt without revealing anything. */
  abort() {
    const now = performance.now();
    this.aborted = true;
    this.target = this.reels.map((reel) => mod(Math.round(reel.pos), DIGITS));
    this.reels.forEach((reel, i) => {
      if (reel.mode === "spinning") reel.stopAt = now + i * 150;
    });
    this.ensureRunning();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private ensureRunning() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private render(index: number, blur: number) {
    const element = this.strips[index];
    if (!element) return;
    const offset = mod(this.reels[index].pos, DIGITS) + DIGITS; // the middle copy
    element.style.transform = `translate3d(0, ${-(offset / (DIGITS * COPIES)) * 100}%, 0)`;
    element.style.filter = blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : "none";
  }

  private beginStop(index: number, now: number) {
    const reel = this.reels[index];
    const digit = this.target![index];

    // Land on `digit` after rolling on in the same direction, slowing down smoothly.
    let end: number;
    if (reel.dir === 1) {
      end = reel.pos + BASE_TRAVEL;
      end += mod(digit - mod(end, DIGITS), DIGITS);
    } else {
      end = reel.pos - BASE_TRAVEL;
      end -= mod(mod(end, DIGITS) - digit, DIGITS);
    }

    reel.mode = "stopping";
    reel.p0 = reel.pos;
    reel.p1 = end;
    reel.t0 = now;
    // Match the spinning speed at the start so the slow-down looks natural (1 to 3 seconds).
    reel.dur = ((3 * Math.abs(end - reel.pos)) / SPIN_SPEED) * 1000;
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    let active = false;

    this.reels.forEach((reel, i) => {
      if (reel.mode === "spinning") {
        active = true;
        reel.pos += reel.dir * SPIN_SPEED * dt;
        if (this.target && now >= reel.stopAt) this.beginStop(i, now);
        this.render(i, MAX_BLUR);
      } else if (reel.mode === "stopping") {
        active = true;
        const t = Math.min(1, (now - reel.t0) / reel.dur);
        reel.pos = reel.p0 + (reel.p1 - reel.p0) * easeOutCubic(t);

        if (t >= 1) {
          reel.pos = mod(Math.round(reel.p1), DIGITS);
          reel.mode = "idle";
          reel.landed = true;
          this.render(i, 0);
          this.callbacks.onLanded(i, this.aborted);
          if (this.reels.every((r) => r.landed)) this.callbacks.onAllLanded(this.aborted);
        } else {
          this.render(i, MAX_BLUR * (1 - t) * (1 - t));
        }
      }
    });

    this.raf = active ? requestAnimationFrame(this.tick) : 0;
  };
}