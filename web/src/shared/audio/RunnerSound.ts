type SfxEvent = "jump" | "collect" | "smash" | "hit";

export class RunnerSound {
  private context: AudioContext | null = null;
  private enabled = true;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.context) {
      const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.context = new Ctx();
    }
    return this.context;
  }

  async ensureReady(): Promise<void> {
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state !== "running") {
      await ctx.resume();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  play(event: SfxEvent): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== "running") return;

    if (event === "jump") this.playJump(ctx);
    if (event === "collect") this.playCollect(ctx);
    if (event === "smash") this.playSmash(ctx);
    if (event === "hit") this.playHit(ctx);
  }

  playBeatPulse(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== "running") return;
    this.beep(ctx, "triangle", 230, 0.04, 0.045, 0.018);
  }

  private playJump(ctx: AudioContext): void {
    this.beep(ctx, "square", 280, 0.09, 0.09, 0.045, 520);
  }

  private playCollect(ctx: AudioContext): void {
    this.beep(ctx, "sawtooth", 420, 0.11, 0.1, 0.05, 760);
    this.beep(ctx, "sawtooth", 680, 0.08, 0.06, 0.02);
  }

  private playSmash(ctx: AudioContext): void {
    this.beep(ctx, "square", 170, 0.05, 0.07, 0.02);
  }

  private playHit(ctx: AudioContext): void {
    this.beep(ctx, "sawtooth", 200, 0.18, 0.11, 0.02, 70);
  }

  private beep(
    ctx: AudioContext,
    type: OscillatorType,
    startFreq: number,
    duration: number,
    gainStart: number,
    gainEnd: number,
    endFreq?: number
  ): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }
    gain.gain.setValueAtTime(gainStart, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(gainEnd, 0.001), now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }
}
