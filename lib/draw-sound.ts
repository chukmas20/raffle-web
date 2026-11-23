type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

/** Built-in draw sounds, synthesized in the browser. No audio files are needed. */
export class DrawSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private tickTimer: ReturnType<typeof setInterval> | undefined;
  private paceMs = 85;
  private volume = 0.7;
  private muted = false;

  private context(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const Ctor = (window.AudioContext ?? (window as AudioWindow).webkitAudioContext) as typeof AudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.applyGain();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private applyGain() {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
  }

  setVolume(value: number) {
    this.volume = Math.min(1, Math.max(0, value));
    this.applyGain();
  }

  setMuted(value: boolean) {
    this.muted = value;
    this.applyGain();
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    peak: number,
    delay = 0,
    endFrequency?: number,
  ) {
    const ctx = this.context();
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(this.master!);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  private stopTicks() {
    clearInterval(this.tickTimer);
    this.tickTimer = undefined;
  }

  private runTicks() {
    this.stopTicks();
    this.tickTimer = setInterval(() => {
      this.tone(700 + Math.random() * 500, 0.035, "square", 0.05);
    }, this.paceMs);
  }

  /** Ticking while the reels roll. Call from a click so the browser allows sound. */
  start() {
    this.context();
    this.paceMs = 85;
    this.runTicks();
  }

  /** Slow the ticking down as the reels wind down. */
  setPace(ms: number) {
    this.paceMs = ms;
    if (this.tickTimer) this.runTicks();
  }

  stop() {
    this.stopTicks();
  }

  reelStop() {
    this.tone(180, 0.18, "sine", 0.5, 0, 55);
    this.tone(1200, 0.05, "triangle", 0.12);
  }

  win() {
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((frequency, i) => this.tone(frequency, 0.45, "triangle", 0.28, i * 0.13));
    chord.forEach((frequency) => this.tone(frequency, 1.6, "sine", 0.14, 0.55));
    for (let i = 0; i < 10; i++) {
      this.tone(1500 + Math.random() * 1800, 0.08, "sine", 0.06, 0.6 + i * 0.12);
    }
  }

  preview() {
    this.reelStop();
    setTimeout(() => this.win(), 450);
  }

  dispose() {
    this.stopTicks();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }
}