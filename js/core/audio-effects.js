/**
 * AUDIO EFFECTS ENGINE (Web Audio API)
 * Tổng hợp âm thanh buồng chụp thực tế mà không phụ thuộc file audio bên ngoài
 */

(function(window) {
  class AudioEffectsEngine {
    constructor() {
      this.ctx = null;
    }

    init() {
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
     * Tiếng bíp đếm ngược 3, 2, 1
     */
    playBeep(isFinal = false) {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isFinal ? 1200 : 880, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isFinal ? 0.25 : 0.12));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + (isFinal ? 0.25 : 0.12));
      } catch (e) {}
    }

    /**
     * Tiếng màn trập cơ học máy ảnh (Mechanical DSLR / Vintage Shutter Click)
     */
    playShutter() {
      try {
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        // 1. Noise buffer (tiếng gương lật & ma sát cơ học)
        const bufferSize = this.ctx.sampleRate * 0.12;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(3.0, t);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        noiseGain.gain.setValueAtTime(0.35, t + 0.06);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        // 2. Click impulses (tiếng kim loại đóng mở lá khẩu)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

        oscGain.gain.setValueAtTime(0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        noise.start(t);
        osc.start(t);
        noise.stop(t + 0.13);
        osc.stop(t + 0.13);
      } catch (e) {}
    }

    /**
     * Tiếng cuộn phim / in ảnh chạy ra
     */
    playMotorAdvance() {
      try {
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.linearRampToValueAtTime(160, t + 0.4);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.45);
      } catch (e) {}
    }
  }

  window.audioEffects = new AudioEffectsEngine();
})(window);
