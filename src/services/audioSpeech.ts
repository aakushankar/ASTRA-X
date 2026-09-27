/**
 * ASTRA-X On-board Spacecraft Audio & Speech Dispatch Engine
 * Provides local real-time audio chimes via Web Audio API
 * and Astronaut voice feedback via Web Speech API
 * Designed for offline-first autonomous spaceflight operation
 */

class AstraAudioService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private voiceEnabled: boolean = true;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  /**
   * Spacecraft Nominal Step Confirmation Tone (High double chirp)
   */
  public playNominalTone() {
    if (this.isMuted) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.08); // D6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore audio synthesis errors on locked autoplay policies
    }
  }

  /**
   * Spacecraft Caution / Uncertainty Tone (Warm double chime)
   */
  public playCautionTone() {
    if (this.isMuted) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(440, now + 0.12); // A4

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  /**
   * Spacecraft Protocol Deviation Warning Klaxon (Attention pulsed alarm)
   */
  public playDeviationAlarm() {
    if (this.isMuted) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Two quick pulses
      for (let i = 0; i < 2; i++) {
        const offset = i * 0.15;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(740, now + offset);
        osc.frequency.exponentialRampToValueAtTime(490, now + offset + 0.12);

        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.13);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.14);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Dispatch Astronaut Voice Guidance
   */
  public speak(text: string, priority: 'nominal' | 'caution' | 'deviation' = 'nominal') {
    if (this.isMuted || !this.voiceEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      // Play appropriate tone first
      if (priority === 'deviation') {
        this.playDeviationAlarm();
      } else if (priority === 'caution') {
        this.playCautionTone();
      } else {
        this.playNominalTone();
      }

      // Small delay before speech so chime is heard
      setTimeout(() => {
        window.speechSynthesis.cancel(); // Cancel any prior lingering utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05; // clear, rapid telemetry cadence
        utterance.pitch = priority === 'deviation' ? 1.15 : 1.0;
        utterance.volume = 0.95;

        // Try to select an English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen')) && 
          v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      }, 200);
    } catch {
      // Ignore speech synthesis errors
    }
  }
}

export const astraAudio = new AstraAudioService();
