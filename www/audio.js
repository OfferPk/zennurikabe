/**
 * ZenNurikabe - Procedural Japanese Garden & Water Acoustic Synthesizer
 * Pure Web Audio API - Zero External Audio Files
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('zennurikabe_sound');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch (e) {
      this.enabled = true;
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('zennurikabe_sound', String(this.enabled));
    } catch (e) {}
  }

  toggleSound() {
    this.enabled = !this.enabled;
    this.saveSettings();
    if (this.enabled) {
      this.playTap();
    }
    return this.enabled;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Resonant water droplet pluck when placing an island cell
   */
  playIsland() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Water drop pitch glide
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 440 + Math.random() * 120;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 0.7, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.08);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Crisp river pebble / bamboo tick when placing an ocean stream wall
   */
  playWall() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Dual stone resonance
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Soft clear / ripple tap
   */
  playClear() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Simple UI button tap
   */
  playTap() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.04);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Harmonic bell chime when an island reaches its target size
   */
  playIslandComplete() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [659.25, 880.0, 1046.5]; // E5, A5, C6 water chime

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);

      gain.gain.setValueAtTime(0.16, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.35);
    });
  }

  /**
   * Resonant Zen Temple Gong & pentatonic victory cascade upon completing the puzzle
   */
  playVictory() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Deep singing bowl / temple gong fundamental
    const gong = this.ctx.createOscillator();
    const gongGain = this.ctx.createGain();
    gong.type = 'sine';
    gong.frequency.setValueAtTime(146.83, t); // D3 gong

    gongGain.gain.setValueAtTime(0.35, t);
    gongGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    gong.connect(gongGain);
    gongGain.connect(this.ctx.destination);
    gong.start(t);
    gong.stop(t + 1.8);

    // Pentatonic ripple arpeggio
    const freqs = [
      293.66, // D4
      349.23, // F4
      392.00, // G4
      440.00, // A4
      523.25, // C5
      587.33, // D5
      698.46, // F5
      880.00  // A5
    ];

    freqs.forEach((f, i) => {
      const delay = 0.15 + i * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + delay);

      gain.gain.setValueAtTime(0.2, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + delay);
      osc.stop(t + delay + 0.65);
    });
  }
}

const sounds = new SoundManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundManager, sounds };
}
