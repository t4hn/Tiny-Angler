// Cozy Web Audio API synthesizer for Tiny Angler

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public playCast() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.22);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playSplash() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // High bubble drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.28);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playFishAppear() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(480, t + 0.08);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playReel() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const clickTime = t + i * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800 + i * 80, clickTime);

      gain.gain.setValueAtTime(0.06, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(clickTime);
      osc.stop(clickTime + 0.03);
    }
  }

  public playCatchRarityFanfare(rarity: string) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (rarity === 'common') {
      const notes = [440, 659.25]; // A4, E5
      notes.forEach((freq, idx) => {
        const nt = t + idx * 0.12;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, nt);
        gain.gain.setValueAtTime(0.12, nt);
        gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(nt);
        osc.stop(nt + 0.35);
      });
    } else if (rarity === 'uncommon') {
      const notes = [440, 554.37, 659.25]; // A, C#, E
      notes.forEach((freq, idx) => {
        const nt = t + idx * 0.1;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, nt);
        gain.gain.setValueAtTime(0.14, nt);
        gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(nt);
        osc.stop(nt + 0.4);
      });
    } else if (rarity === 'rare') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const nt = t + idx * 0.09;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, nt);
        gain.gain.setValueAtTime(0.15, nt);
        gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(nt);
        osc.stop(nt + 0.5);
      });
    } else if (rarity === 'epic') {
      const notes = [440, 554.37, 659.25, 830.61, 1108.73]; // A major 7th / shimmer
      notes.forEach((freq, idx) => {
        const nt = t + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, nt);
        gain.gain.setValueAtTime(0.16, nt);
        gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.65);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(nt);
        osc.stop(nt + 0.65);
      });
    } else {
      // Legendary royal golden arpeggio!
      const chords = [
        [523.25, 659.25], // C5, E5
        [659.25, 783.99], // E5, G5
        [783.99, 987.77], // G5, B5
        [1046.5, 1318.51, 1567.98], // C6, E6, G6 radiant chord!
      ];
      chords.forEach((group, gIdx) => {
        const gt = t + gIdx * 0.12;
        group.forEach(freq => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, gt);
          gain.gain.setValueAtTime(0.13, gt);
          gain.gain.exponentialRampToValueAtTime(0.001, gt + (gIdx === 3 ? 0.9 : 0.4));
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(gt);
          osc.stop(gt + (gIdx === 3 ? 0.9 : 0.4));
        });
      });
    }
  }

  public playCoin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, t); // B5
    osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, t);
    osc2.frequency.setValueAtTime(1760.0, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);
  }
}

export const sounds = new SoundManager();
