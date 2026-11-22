type PulseListener = () => void;

class HandheldSFX {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private listeners = new Set<PulseListener>();

  subscribePulse(fn: PulseListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emitPulse() {
    this.listeners.forEach((fn) => fn());
  }

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.36;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.emitPulse();
    return this.ctx;
  }

  private tone(
    freq: number,
    type: OscillatorType,
    delay: number,
    dur: number,
    peak = 0.24,
    slideTo: number | null = null
  ) {
    const c = this.ensure();
    if (!c || !this.master) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private clickNoise(dur = 0.022, freq = 2400, peak = 0.16) {
    const c = this.ensure();
    if (!c || !this.master) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
    }
    const s = c.createBufferSource();
    const fl = c.createBiquadFilter();
    const g = c.createGain();
    s.buffer = buf;
    fl.type = 'bandpass';
    fl.frequency.value = freq;
    g.gain.value = peak;
    s.connect(fl);
    fl.connect(g);
    g.connect(this.master);
    s.start();
  }

  private vib(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore unsupported haptics
      }
    }
  }

  unlock() {
    this.ensure();
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (!this.muted) this.click();
    return this.muted;
  }

  click() {
    this.clickNoise(0.02, 2600, 0.16);
    this.tone(640, 'triangle', 0, 0.032, 0.14, 430);
    this.vib(8);
  }

  select(zoneIdx = 0) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 987.77];
    const f = scale[zoneIdx % scale.length];
    this.clickNoise(0.015, 3200, 0.08);
    this.tone(f, 'triangle', 0, 0.075, 0.22, f * 1.12);
    this.tone(f * 2, 'sine', 0.015, 0.06, 0.07);
    this.vib(10);
  }

  openCard() {
    this.tone(587.33, 'triangle', 0, 0.07, 0.2);
    this.tone(783.99, 'triangle', 0.045, 0.08, 0.22);
    this.tone(1046.5, 'sine', 0.09, 0.16, 0.24);
    this.vib(12);
  }

  closeCard() {
    this.tone(520, 'triangle', 0, 0.06, 0.18, 330);
    this.tone(330, 'sine', 0.04, 0.09, 0.14, 240);
    this.vib(8);
  }

  zoomIn() {
    this.clickNoise(0.018, 2800, 0.14);
    this.tone(440, 'triangle', 0, 0.055, 0.18, 660);
    this.tone(660, 'sine', 0.04, 0.08, 0.16, 880);
    this.vib(10);
  }

  zoomOut() {
    this.clickNoise(0.018, 2100, 0.14);
    this.tone(660, 'triangle', 0, 0.055, 0.18, 440);
    this.tone(440, 'sine', 0.04, 0.08, 0.15, 330);
    this.vib(8);
  }

  scanBeep() {
    this.tone(1320, 'sine', 0, 0.07, 0.24);
    this.tone(1760, 'sine', 0.07, 0.1, 0.26);
    this.vib([15, 25, 15]);
  }

  dup() {
    this.tone(520, 'triangle', 0, 0.07, 0.18);
    this.tone(440, 'triangle', 0.08, 0.1, 0.18);
    this.vib(12);
  }

  stamp() {
    this.tone(150, 'sine', 0, 0.14, 0.42, 42);
    this.clickNoise(0.05, 900, 0.28);
    this.tone(523.25, 'triangle', 0.1, 0.1, 0.22);
    this.tone(659.25, 'triangle', 0.18, 0.1, 0.22);
    this.tone(783.99, 'triangle', 0.26, 0.11, 0.24);
    this.tone(1046.5, 'sine', 0.34, 0.34, 0.28);
    this.tone(1318.5, 'triangle', 0.36, 0.3, 0.14);
    this.vib([24, 38, 20]);
  }

  bootUp() {
    // Classic handheld power-on "ba-ding!" chime
    this.tone(1046.5, 'square', 0.02, 0.08, 0.11);
    this.tone(2093.0, 'triangle', 0.1, 0.28, 0.18);
    this.tone(1567.98, 'sine', 0.12, 0.22, 0.08);
  }

  milestone() {
    // Celebratory 5-note arcade rank-up / zone-clear arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    notes.forEach((f, idx) => {
      this.tone(f, idx >= 4 ? 'sine' : 'triangle', idx * 0.075, 0.22, 0.22);
    });
    this.vib([18, 28, 18, 28, 35]);
  }
}

export const SFX = new HandheldSFX();
