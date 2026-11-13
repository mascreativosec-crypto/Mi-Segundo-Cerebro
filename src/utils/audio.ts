// Web Audio API Synthesizer for Zen bells, chimes and gongs (no external audio files needed)

class ZenAudioService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Lazy initialize to adhere to browser autoplay policies
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // 528 Hz - Solfeggio frequency (Transformation & Miracles / Dawn Bell)
  public playDawnBell() {
    if (!this.soundEnabled) return;
    this.playTone({
      freq: 528,
      duration: 3.5,
      type: 'sine',
      harmonics: [1056, 1584],
      attack: 0.03,
      decay: 3.2,
      gainLevel: 0.25,
    });
  }

  // 587.33 Hz (D5) - Tibetan Singing Bowl transition chime
  public playTransitionChime() {
    if (!this.soundEnabled) return;
    this.playTone({
      freq: 587.33,
      duration: 2.8,
      type: 'sine',
      harmonics: [880, 1174.66],
      attack: 0.05,
      decay: 2.5,
      gainLevel: 0.22,
    });
  }

  // 740 Hz - Gentle prompt / 10-second warning tick
  public playWarningTick() {
    if (!this.soundEnabled) return;
    this.playTone({
      freq: 740,
      duration: 0.8,
      type: 'sine',
      harmonics: [1480],
      attack: 0.01,
      decay: 0.75,
      gainLevel: 0.15,
    });
  }

  // 432 Hz - Deep Grounding Gong for completion
  public playFinishGong() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const baseFreq = 432;
      const frequencies = [baseFreq, baseFreq * 1.5, baseFreq * 2, baseFreq * 2.75];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const initialGain = (0.28 / (idx + 1));
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(initialGain, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 5.1);
      });
    } catch {
      // Audio fallback quiet
    }
  }

  // --- Nocturnal Ultra-Calm Sounds (Súper Noche) ---
  // 174 Hz + 261.63 Hz warm deep sleep pad for beginning Súper Noche
  public playNightCalmBell() {
    if (!this.soundEnabled) return;
    this.playTone({
      freq: 261.63, // C4 soft warm tone
      duration: 4.2,
      type: 'sine',
      harmonics: [174, 392],
      attack: 0.35,
      decay: 3.9,
      gainLevel: 0.16,
    });
  }

  // 285 Hz - Gentle soothing night transition (much softer/lower than morning 587Hz)
  public playNightTransitionChime() {
    if (!this.soundEnabled) return;
    this.playTone({
      freq: 285,
      duration: 3.6,
      type: 'sine',
      harmonics: [427.5],
      attack: 0.25,
      decay: 3.3,
      gainLevel: 0.14,
    });
  }

  // Soft 220 Hz tap for night decree counting
  public playNightSoftTick() {
    if (!this.soundEnabled) return;
    this.playTone({
      freq: 220,
      duration: 0.65,
      type: 'sine',
      harmonics: [330],
      attack: 0.04,
      decay: 0.6,
      gainLevel: 0.1,
    });
  }

  // 174 Hz + 256 Hz - Deep sleep serenity closing chord
  public playNightSleepPad() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [174, 261.63, 329.63].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        const peak = 0.14 / (idx + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 6.0);
      });
    } catch {
      // ignore
    }
  }

  private playTone(params: {
    freq: number;
    duration: number;
    type: OscillatorType;
    harmonics?: number[];
    attack: number;
    decay: number;
    gainLevel: number;
  }) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Fundamental oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = params.type;
      osc.frequency.setValueAtTime(params.freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(params.gainLevel, now + params.attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + params.decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + params.duration);

      // Soft harmonics
      if (params.harmonics) {
        params.harmonics.forEach((hFreq, idx) => {
          const hOsc = ctx.createOscillator();
          const hGain = ctx.createGain();

          hOsc.type = 'sine';
          hOsc.frequency.setValueAtTime(hFreq, now);

          const hGainLevel = (params.gainLevel * 0.3) / (idx + 1);
          hGain.gain.setValueAtTime(0.0001, now);
          hGain.gain.exponentialRampToValueAtTime(hGainLevel, now + params.attack * 1.5);
          hGain.gain.exponentialRampToValueAtTime(0.0001, now + params.decay * 0.8);

          hOsc.connect(hGain);
          hGain.connect(ctx.destination);

          hOsc.start(now);
          hOsc.stop(now + params.duration);
        });
      }
    } catch {
      // ignore
    }
  }
}

export const zenAudio = new ZenAudioService();
