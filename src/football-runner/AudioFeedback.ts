/**
 * Small procedural sound layer. No downloaded audio assets are required.
 * AudioContext is created/resumed only after a user gesture (Start/Resume).
 */
export class RunnerAudioFeedback {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private enabled = true;
  private running = false;
  private stepElapsed = 0;
  private stepIndex = 0;
  private disposed = false;

  async unlock(): Promise<void> {
    if (this.disposed || !this.enabled) return;
    try {
      const AudioContextConstructor = window.AudioContext;
      if (!AudioContextConstructor) return;
      if (!this.context) this.createContext(new AudioContextConstructor());
      const context = this.context;
      if (context && context.state === "suspended") await context.resume();
      this.updateAmbienceLevel();
    } catch {
      // Audio is an enhancement; gameplay remains available if a browser blocks it.
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.running = false;
      this.stepElapsed = 0;
      this.updateAmbienceLevel();
      return;
    }
    this.updateAmbienceLevel();
  }

  setRunning(running: boolean): void {
    this.running = running && this.enabled;
    this.stepElapsed = 0;
    this.updateAmbienceLevel();
  }

  updateRun(delta: number, speedRatio: number): void {
    if (!this.enabled || !this.running || !this.context) return;
    const interval = Math.max(0.22, 0.36 / Math.max(1, speedRatio));
    this.stepElapsed += delta;
    if (this.stepElapsed >= interval) {
      this.stepElapsed %= interval;
      this.footstep(this.stepIndex++ % 2 === 0);
    }
  }

  jump(): void {
    // Short boot-lift whoosh with a bright, confident landing-note.
    this.noiseSweep(1500, 260, 0.2, 0.055, "bandpass");
    this.tone(185, 330, 0.16, 0.045, "triangle");
    this.tone(520, 410, 0.1, 0.018, "sine", 0.07);
  }

  slide(): void {
    // Wider low-mid sweep gives the slide a gritty turf brush instead of a beep.
    this.noiseSweep(1250, 170, 0.32, 0.065, "bandpass");
    this.noiseSweep(420, 95, 0.24, 0.028, "lowpass");
  }

  collect(): void {
    // A three-note football pickup chime with a soft leather-like impact.
    this.noiseSweep(360, 115, 0.075, 0.026, "lowpass");
    this.tone(660, 660, 0.12, 0.052, "sine");
    this.tone(880, 880, 0.15, 0.052, "sine", 0.075);
    this.tone(1180, 1180, 0.2, 0.045, "sine", 0.15);
    this.tone(330, 220, 0.12, 0.025, "triangle", 0.02);
  }

  collision(): void {
    this.setRunning(false);
    // A padded body impact, a short debris-like burst and a descending cue.
    this.noiseSweep(520, 72, 0.34, 0.14, "lowpass");
    this.noiseSweep(1800, 320, 0.11, 0.035, "bandpass");
    this.tone(118, 48, 0.38, 0.14, "triangle");
    this.tone(220, 92, 0.2, 0.045, "sine", 0.035);
  }

  milestone(kind: "distance" | "speed"): void {
    if (kind === "distance") {
      this.tone(523.25, 523.25, 0.13, 0.05, "sine");
      this.tone(659.25, 659.25, 0.13, 0.05, "sine", 0.09);
      this.tone(783.99, 783.99, 0.22, 0.06, "sine", 0.18);
    } else {
      this.noiseSweep(900, 1500, 0.12, 0.025, "bandpass");
      this.tone(440, 587.33, 0.14, 0.045, "triangle");
      this.tone(587.33, 880, 0.19, 0.052, "triangle", 0.1);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.running = false;
    try {
      this.ambienceSource?.stop();
    } catch {
      // The source may already have ended.
    }
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.ambienceGain = null;
    this.ambienceSource = null;
    this.noiseBuffer = null;
  }

  private createContext(context: AudioContext): void {
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(context.destination);

    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 2), context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index++) {
      // Layered low-level noise creates a soft, non-verbal stadium crowd bed.
      channel[index] = (Math.random() * 2 - 1) * 0.55;
    }
    this.noiseBuffer = buffer;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const band = context.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 520;
    band.Q.value = 0.55;
    const low = context.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 1450;
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(band);
    band.connect(low);
    low.connect(gain);
    gain.connect(this.master);
    source.start();
    this.ambienceSource = source;
    this.ambienceGain = gain;
    this.updateAmbienceLevel();
  }

  private updateAmbienceLevel(): void {
    if (!this.context || !this.ambienceGain) return;
    const target = this.enabled ? (this.running ? 0.018 : 0.004) : 0;
    this.ambienceGain.gain.setTargetAtTime(target, this.context.currentTime, 0.22);
  }

  private footstep(alternate: boolean): void {
    const frequency = alternate ? 88 : 104;
    const variation = alternate ? 0.94 : 1.04;
    this.tone(frequency * variation, frequency * 0.58, 0.09, 0.052, "triangle");
    this.noiseSweep(alternate ? 330 : 410, 105, 0.065, 0.021, "lowpass");
    this.tone(54, 38, 0.075, 0.018, "sine", 0.006);
  }

  private tone(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    delay = 0,
  ): void {
    const context = this.context;
    const master = this.master;
    if (!this.enabled || !context || !master) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, startFrequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.025);
  }

  private noiseSweep(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
    filterType: BiquadFilterType,
  ): void {
    const context = this.context;
    const master = this.master;
    const buffer = this.noiseBuffer;
    if (!this.enabled || !context || !master || !buffer) return;
    const start = context.currentTime;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.setValueAtTime(Math.max(40, startFrequency), start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), start + duration);
    filter.Q.value = filterType === "bandpass" ? 0.7 : 0.5;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
    source.stop(start + duration + 0.02);
  }
}
