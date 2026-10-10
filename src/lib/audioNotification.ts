/**
 * Audio Notification Service for Digital Azadi Operations Deck
 * Generates clear, high-fidelity chimes using Web Audio API (zero external assets needed)
 */

class AudioNotificationService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check if muted preference is saved
    try {
      const saved = localStorage.getItem('DA_AUDIO_NOTIF_MUTED');
      this.isMuted = saved === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Unlock AudioContext on first user interaction (browser security policy)
   */
  public unlockAudio(): void {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  /**
   * Play crystal-clear 2-tone chime for incoming support query
   */
  public playNewTicketChime(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: B5 (987.77 Hz) - cheerful chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);

      // Note 3: E6 (1318.51 Hz) - high bell shimmer
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1318.51, now + 0.22);
      gain3.gain.setValueAtTime(0.14, now + 0.22);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.22);
      osc3.stop(now + 0.7);
    } catch (err) {
      console.warn('Audio chime playback error:', err);
    }
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public setSoundMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('DA_AUDIO_NOTIF_MUTED', String(muted));
    } catch {}
  }

  public toggleMute(): boolean {
    this.setSoundMuted(!this.isMuted);
    return this.isMuted;
  }
}

export const audioNotification = new AudioNotificationService();
