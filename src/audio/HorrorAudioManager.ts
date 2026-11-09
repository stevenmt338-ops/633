/**
 * Procedural Horror Web Audio Engine
 * Delivers realistic, atmospheric horror sound effects and tension audio
 * with zero external dependencies.
 */

class HorrorAudioManager {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private heartbeatOsc1: OscillatorNode | null = null;
  private heartbeatOsc2: OscillatorNode | null = null;
  private heartbeatGain: GainNode | null = null;
  private heartbeatInterval: number | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private sfxVolume: number = 0.9;
  private musicVolume: number = 0.6;
  private isWindPlaying: boolean = false;
  private currentHeartRate: number = 0; // 0 = off, 1 = distant, 2 = near, 3 = intense terror

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, sfx: number, music: number) {
    this.masterVolume = master;
    this.sfxVolume = sfx;
    this.musicVolume = music;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.musicVolume * this.masterVolume * 0.4, this.ctx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(muted ? 0 : this.musicVolume * this.masterVolume * 0.4, this.ctx.currentTime);
    }
  }

  // --- AMBIENT SOUNDS ---

  public startAtmosphericAmbience() {
    if (this.isWindPlaying) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.isWindPlaying = true;
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise for deep wind rumble
        lastOut = output[i];
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      // Low frequency oscillator for wind gusts
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(90, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume * this.masterVolume * 0.35, this.ctx.currentTime);

      // Add deep subterranean drone osc
      const droneOsc = this.ctx.createOscillator();
      droneOsc.type = 'sawtooth';
      droneOsc.frequency.setValueAtTime(45, this.ctx.currentTime);
      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(90, this.ctx.currentTime);
      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      droneOsc.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(this.ambientGain);
      droneOsc.start();

      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      whiteNoise.start();
    } catch {
      // Audio autoplay policy handled smoothly
    }
  }

  // --- HEARTBEAT SYSTEM (SCALES WITH GRANNY DISTANCE) ---

  public updateHeartbeatTerror(intensity: number) {
    // intensity: 0 to 1
    if (this.isMuted || intensity <= 0.05) {
      this.stopHeartbeat();
      return;
    }
    this.init();
    if (!this.ctx) return;

    const rateLevel = intensity > 0.7 ? 3 : intensity > 0.4 ? 2 : 1;
    if (rateLevel === this.currentHeartRate) return;
    this.currentHeartRate = rateLevel;

    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    const intervalMs = rateLevel === 3 ? 420 : rateLevel === 2 ? 650 : 950;
    this.playHeartbeatThud(intensity);

    this.heartbeatInterval = window.setInterval(() => {
      this.playHeartbeatThud(intensity);
    }, intervalMs);
  }

  public stopHeartbeat() {
    this.currentHeartRate = 0;
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private playHeartbeatThud(intensity: number) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const vol = Math.min(1, Math.max(0.1, intensity)) * this.sfxVolume * this.masterVolume * 0.8;

    // Double beat "Lub-Dub"
    const playBeat = (time: number, freq: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(25, time + duration);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    };

    playBeat(now, 68, 0.12);
    playBeat(now + 0.14, 52, 0.16);
  }

  // --- SOUND EFFECTS ---

  public playFootstep(isSprinting: boolean = false, isCrouching: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const pitch = 75 + Math.random() * 25;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);

    const baseVol = isCrouching ? 0.08 : isSprinting ? 0.45 : 0.22;
    const vol = baseVol * this.sfxVolume * this.masterVolume;

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playDoorSqueak(isOpen: boolean) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const startFreq = isOpen ? 320 : 600;
    const endFreq = isOpen ? 580 : 280;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.45);

    gain.gain.setValueAtTime(0.18 * this.sfxVolume * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(3.5, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playJumpscare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = 0.85 * this.sfxVolume * this.masterVolume;

    // Screaming dissonant chords
    [320, 335, 480, 510, 890].forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, now + 0.6);

      gain.gain.setValueAtTime(vol * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    });

    // Heavy bass impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.7);

    subGain.gain.setValueAtTime(vol * 0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.75);
  }

  public playGrannyScream() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.linearRampToValueAtTime(780, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.7);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, now);
    filter.Q.setValueAtTime(4, now);

    const vol = 0.6 * this.sfxVolume * this.masterVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  public playBatHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(0.8 * this.sfxVolume * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playThunder() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 2.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.04 * white) / 1.04;
      last = data[i];
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(70, now + 2.0);

    const gain = this.ctx.createGain();
    const vol = 0.75 * this.sfxVolume * this.masterVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  public playItemPickup() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.setValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playItemDrop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playUnlockKey() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Metallic double clink
    [now, now + 0.08].forEach((t, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 1200 : 1600, t);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  public playCrowbar() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.35);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playSnipPliers() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'highpass' as unknown as OscillatorType; // fallback sine
    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playBearTrapSnap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.6 * this.sfxVolume * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playShotgunBlast() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    gain.gain.setValueAtTime(0.7 * this.sfxVolume * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playDayGong() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [65, 130, 195].forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.4 * this.sfxVolume * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 3.0);
    });
  }

  public playReviveSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, i) => {
      if (!this.ctx) return;
      const t = now + i * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }
}

export const soundManager = new HorrorAudioManager();
