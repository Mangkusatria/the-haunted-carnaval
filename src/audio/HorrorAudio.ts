/**
 * Procedural Web Audio API sound engine for Jacky's Carnival: Circus Horror
 * Zero external audio files required!
 */

export class HorrorAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;

  // Ambient loop nodes
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;

  // Music Box state ("Pop Goes the Weasel" haunting sequence)
  private musicBoxInterval: number | null = null;
  private musicBoxNoteIdx: number = 0;
  private musicBoxSpeed: number = 280; // ms per note
  private musicBoxDistFactor: number = 0; // 0 (far) to 1 (right on top of you)
  private isMusicBoxMuted: boolean = false;

  // Heartbeat loop state
  private heartbeatInterval: number | null = null;
  private heartbeatActive: boolean = false;

  // Notes for twisted "Pop Goes the Weasel" in C-minor / harmonic minor
  // Frequencies in Hz: C4, Eb4, F4, G4, Ab4, Bb4, C5, D5, Eb5, etc.
  private weaselNotes: number[] = [
    261.63, 293.66, 311.13, 349.23, 392.00, 311.13, 261.63, 0,
    293.66, 311.13, 349.23, 392.00, 311.13, 0,
    261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 392.00, 349.23,
    311.13, 293.66, 261.63, 0, // "Pop goes the weasel!"
    523.25, 0, 415.30, 392.00, 311.13, 261.63
  ];

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.startAmbient();
      this.startMusicBoxLoop();
    } catch (e) {
      console.warn('Web Audio could not be initialized:', e);
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, music: number, sfx: number): void {
    this.masterVolume = master;
    this.musicVolume = music;
    this.sfxVolume = sfx;
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    this.masterGain.gain.setValueAtTime(master, this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(music, this.ctx.currentTime);
    this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
  }

  private startAmbient(): void {
    if (!this.ctx || !this.ambientGain) return;
    // Ominous low-frequency wind & carnival drone
    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = 'sawtooth';
    this.ambientOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1

    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = 'triangle';
    this.ambientOsc2.frequency.setValueAtTime(58.27, this.ctx.currentTime); // Slight detuned beat

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(40, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientFilter.frequency);
    lfo.start();

    this.ambientOsc1.connect(this.ambientFilter);
    this.ambientOsc2.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);

    this.ambientOsc1.start();
    this.ambientOsc2.start();
  }

  /**
   * Continuous ominous music box playing Jacky's wind-up tune
   * Gets louder, higher, and faster as Jacky draws closer!
   */
  private startMusicBoxLoop(): void {
    const playNextNote = () => {
      if (this.ctx && this.musicGain && !this.isMusicBoxMuted && this.musicBoxDistFactor > 0.05) {
        const freq = this.weaselNotes[this.musicBoxNoteIdx % this.weaselNotes.length];
        if (freq > 0) {
          this.playMusicBoxTine(freq, this.musicBoxDistFactor);
        }
        this.musicBoxNoteIdx++;
      }
      const interval = Math.max(120, this.musicBoxSpeed - this.musicBoxDistFactor * 100);
      this.musicBoxInterval = window.setTimeout(playNextNote, interval);
    };
    playNextNote();
  }

  /**
   * Plays a single chime tine like an antique metallic music box
   */
  private playMusicBoxTine(freq: number, intensity: number): void {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pure metallic bell timbre: Sine + High harmonic + fast decay
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.01), t);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 3.01, t); // Metallic chime ratio

    const noteVolume = Math.min(1.0, 0.15 + intensity * 0.7);
    gain.gain.setValueAtTime(noteVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    overtone.start(t);
    osc.stop(t + 0.7);
    overtone.stop(t + 0.7);
  }

  /**
   * Update Jacky proximity for music box intensity and heartbeat
   * distance: meters away (0 = caught, 100 = far away)
   */
  public updateJackyProximity(distance: number, isChasing: boolean): void {
    if (!this.ctx || this.isMusicBoxMuted) return;
    const maxDist = 80;
    const clamped = Math.max(0, Math.min(maxDist, distance));
    // Factor: 1 at 0m, 0 at 80m
    const factor = Math.max(0, 1 - clamped / maxDist);
    this.musicBoxDistFactor = factor;

    if (isChasing) {
      this.musicBoxSpeed = 160; // fast frantic winding
    } else {
      this.musicBoxSpeed = 280;
    }

    // Heartbeat triggers when distance < 35m
    if (distance < 35 && !this.heartbeatActive) {
      this.startHeartbeat();
    } else if (distance >= 35 && this.heartbeatActive) {
      this.stopHeartbeat();
    }
  }

  /**
   * Mutes Jacky's music box, heartbeat & carnival ambient drone so Chapter 2 Labyrinth feels dead quiet
   */
  public setMazeSilentMode(silent: boolean): void {
    this.isMusicBoxMuted = silent;
    if (silent) {
      this.musicBoxDistFactor = 0;
      this.stopHeartbeat();
    }
    if (this.ctx && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(silent ? 0.0 : 0.35, this.ctx.currentTime, 0.25);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatActive = true;
    const beat = () => {
      if (!this.heartbeatActive || !this.ctx || !this.sfxGain) return;
      this.playHeartbeatThud();
      // Second quicker thud (lub-dub)
      window.setTimeout(() => {
        if (this.heartbeatActive) this.playHeartbeatThud(0.8);
      }, 180);

      const bpmInterval = Math.max(450, 950 - this.musicBoxDistFactor * 450);
      this.heartbeatInterval = window.setTimeout(beat, bpmInterval);
    };
    beat();
  }

  private stopHeartbeat(): void {
    this.heartbeatActive = false;
    if (this.heartbeatInterval) {
      clearTimeout(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private playHeartbeatThud(scale: number = 1.0): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Deep chest thud: drops from 85Hz down to 38Hz
    osc.frequency.setValueAtTime(80 * scale, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.16);

    gain.gain.setValueAtTime(0.7 * scale, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Jacky Jumpscare & Roar: Harsh spring boing + metallic screech + distorted burst
   */
  public playJackyJumpscare(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // 1. Spring Boing (rapid modulated pitch drop)
    const springOsc = this.ctx.createOscillator();
    const springGain = this.ctx.createGain();
    springOsc.type = 'sawtooth';
    springOsc.frequency.setValueAtTime(450, t);
    springOsc.frequency.exponentialRampToValueAtTime(70, t + 0.4);
    springGain.gain.setValueAtTime(0.9, t);
    springGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    springOsc.connect(springGain);
    springGain.connect(this.sfxGain);
    springOsc.start(t);
    springOsc.stop(t + 0.55);

    // 2. High Harsh Screech
    const screechOsc = this.ctx.createOscillator();
    const screechGain = this.ctx.createGain();
    screechOsc.type = 'triangle';
    screechOsc.frequency.setValueAtTime(880, t);
    screechOsc.frequency.linearRampToValueAtTime(1400, t + 0.1);
    screechOsc.frequency.exponentialRampToValueAtTime(220, t + 0.7);

    // Tremolo for jittery horror
    const trem = this.ctx.createOscillator();
    const tremGain = this.ctx.createGain();
    trem.frequency.setValueAtTime(28, t);
    tremGain.gain.setValueAtTime(0.5, t);
    trem.connect(tremGain.gain);

    screechGain.gain.setValueAtTime(1.0, t);
    screechGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    screechOsc.connect(screechGain);
    screechGain.connect(this.sfxGain);
    screechOsc.start(t);
    screechOsc.stop(t + 0.85);

    // 3. Noise crunch
    this.playNoiseBurst(0.4, 0.8, 1200);
  }

  /**
   * Sound when Jacky winds his crank
   */
  public playCrankClick(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.04);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Flashlight switch click
   */
  public playFlashlightClick(turnOn: boolean): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(turnOn ? 900 : 700, t);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  /**
   * Footstep sound (gravel/mud/wood)
   */
  public playFootstep(isSprinting: boolean): void {
    if (!this.ctx || !this.sfxGain) return;
    const duration = isSprinting ? 0.07 : 0.09;
    const volume = isSprinting ? 0.45 : 0.22;
    this.playNoiseBurst(duration, volume, 380);
  }

  /**
   * Generator repair spark / cranking sound
   */
  public playGeneratorRepair(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110 + Math.random() * 40, t);
    osc.frequency.linearRampToValueAtTime(160, t + 0.15);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Generator turned ON completely (roaring engine hum + carnival lights turning on chime)
   */
  public playGeneratorStart(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Roar engine
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.6);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 1.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.3);

    // Victory chime
    window.setTimeout(() => {
      if (!this.ctx || !this.sfxGain) return;
      const t2 = this.ctx.currentTime;
      const c = this.ctx.createOscillator();
      const cg = this.ctx.createGain();
      c.type = 'sine';
      c.frequency.setValueAtTime(659.25, t2); // E5
      cg.gain.setValueAtTime(0.4, t2);
      cg.gain.exponentialRampToValueAtTime(0.001, t2 + 0.6);
      c.connect(cg);
      cg.connect(this.sfxGain);
      c.start(t2);
      c.stop(t2 + 0.65);
    }, 400);
  }

  /**
   * Bot Companion walkie-talkie chirp
   */
  public playRadioChirp(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, t); // A6
    osc.frequency.setValueAtTime(2200, t + 0.03);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Bot screaming / crying out
   */
  public playBotScream(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(950, t + 0.2);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.6);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  /**
   * Helper: White noise burst with filter
   */
  private playNoiseBurst(duration: number, volume: number, cutoff: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  /**
   * Jacky Nyengar-Nyengir & Creepy Chuckle
   */
  public playJackyChuckle(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Dissonant, creepy high-pitched giggle bursts
    const giggleCount = 4;
    for (let i = 0; i < giggleCount; i++) {
      const start = t + i * 0.11;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const baseFreq = 520 + Math.sin(i * 1.5) * 80;
      osc.frequency.setValueAtTime(baseFreq, start);
      osc.frequency.linearRampToValueAtTime(baseFreq + 120, start + 0.05);
      osc.frequency.exponentialRampToValueAtTime(baseFreq - 80, start + 0.1);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.095);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.1);
    }
  }

  /**
   * Sound played when finding one of the 20 Jack-in-the-box collectibles
   */
  public playBoxCollectChime(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const noteTime = t + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.4, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.55);
    });
  }

  /**
   * Horror stinger when Jacky traps the player and initiates interrogation
   */
  public playInterrogationStinger(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Dissonant tritone chord
    const freqs = [110, 155.56, 220, 311.13];
    freqs.forEach((f) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.25);
    });
  }

  /**
   * Eerie Carnival sirens when all 20 boxes are collected
   */
  public playSirens(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(750, t + 1.2);
    osc.frequency.linearRampToValueAtTime(440, t + 2.4);
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 2.0);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 2.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 2.5);
  }

  /**
   * Shocked cry from the betrayed bot companion
   */
  public playBetrayalCry(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.playRadioChirp();
    setTimeout(() => {
      this.playBotScream();
    }, 150);
  }

  /**
   * Apocalyptic soundscape when the Blood Sky triggers:
   * Siren crescendo, deep subterranean rumble, Jacky's manic chuckle,
   * and hyper-fast music box tempo!
   */
  public playBloodSkyRoar(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // 1. Sirens
    this.playSirens();

    // 2. Apocalyptic brass rumble (low dissonance)
    const lowFreqs = [45, 53, 90];
    lowFreqs.forEach((f) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, t + 3.0);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.linearRampToValueAtTime(0.6, t + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 4.5);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 4.6);
    });

    // 3. Manic laugh sequence
    setTimeout(() => {
      this.playJackyChuckle();
    }, 600);
    setTimeout(() => {
      this.playJackyJumpscare();
    }, 1800);

    // 4. Accelerate music box tempo to frantic speed
    this.musicBoxSpeed = 160;
  }

  /**
   * Sound when Jacky coils his spring inside his box and launches high into the air!
   */
  public playSpringLaunch(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Coiled twang
    const twang = this.ctx.createOscillator();
    const twangGain = this.ctx.createGain();
    twang.type = 'sawtooth';
    twang.frequency.setValueAtTime(120, t);
    twang.frequency.exponentialRampToValueAtTime(750, t + 0.35);
    twangGain.gain.setValueAtTime(0.5, t);
    twangGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    twang.connect(twangGain);
    twangGain.connect(this.sfxGain);
    twang.start(t);
    twang.stop(t + 0.5);

    // Rising wind whoosh
    const whoosh = this.ctx.createOscillator();
    const whooshGain = this.ctx.createGain();
    whoosh.type = 'triangle';
    whoosh.frequency.setValueAtTime(300, t + 0.1);
    whoosh.frequency.exponentialRampToValueAtTime(900, t + 0.6);
    whooshGain.gain.setValueAtTime(0.01, t);
    whooshGain.gain.linearRampToValueAtTime(0.4, t + 0.3);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    whoosh.connect(whooshGain);
    whooshGain.connect(this.sfxGain);
    whoosh.start(t + 0.1);
    whoosh.stop(t + 0.95);
  }

  /**
   * Heavy impact thud when Jacky slams down into the landing zone!
   */
  public playLandingThud(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Sub-bass thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 0.5);
    subGain.gain.setValueAtTime(0.8, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + 0.65);

    // Metal crash/clang of the heavy box
    const crash = this.ctx.createOscillator();
    const crashGain = this.ctx.createGain();
    crash.type = 'sawtooth';
    crash.frequency.setValueAtTime(260, t);
    crash.frequency.exponentialRampToValueAtTime(60, t + 0.4);
    crashGain.gain.setValueAtTime(0.6, t);
    crashGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    crash.connect(crashGain);
    crashGain.connect(this.sfxGain);
    crash.start(t);
    crash.stop(t + 0.55);
  }

  /**
   * Radio tracking beep when dying companion reveals Jacky's location
   */
  public playTrackingRadioBeep(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1174.66, t + 0.08);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  private carEngineOsc: OscillatorNode | null = null;
  private carEngineGain: GainNode | null = null;

  public startCarDriving(): void {
    if (!this.ctx || !this.sfxGain || this.carEngineOsc) return;
    const t = this.ctx.currentTime;
    this.carEngineOsc = this.ctx.createOscillator();
    this.carEngineGain = this.ctx.createGain();
    this.carEngineOsc.type = 'sawtooth';
    this.carEngineOsc.frequency.setValueAtTime(45, t);
    this.carEngineOsc.frequency.linearRampToValueAtTime(75, t + 3.0);
    this.carEngineGain.gain.setValueAtTime(0.01, t);
    this.carEngineGain.gain.linearRampToValueAtTime(0.25, t + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, t);

    this.carEngineOsc.connect(filter);
    filter.connect(this.carEngineGain);
    this.carEngineGain.connect(this.sfxGain);
    this.carEngineOsc.start(t);
  }

  public stopCarDriving(): void {
    if (this.carEngineOsc) {
      try { this.carEngineOsc.stop(); } catch {}
      this.carEngineOsc = null;
    }
    this.carEngineGain = null;
  }

  public playCarCrash(): void {
    this.stopCarDriving();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // 1. Harsh screech
    const screech = this.ctx.createOscillator();
    const screechGain = this.ctx.createGain();
    screech.type = 'triangle';
    screech.frequency.setValueAtTime(1400, t);
    screech.frequency.linearRampToValueAtTime(350, t + 0.5);
    screechGain.gain.setValueAtTime(0.6, t);
    screechGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    screech.connect(screechGain);
    screechGain.connect(this.sfxGain);
    screech.start(t);
    screech.stop(t + 0.65);

    // 2. High noise glass shatter burst
    this.playNoiseBurst(0.7, 0.75, 4500);

    // 3. Huge low-end metal collision impact
    const crashSub = this.ctx.createOscillator();
    const crashGain = this.ctx.createGain();
    crashSub.type = 'sawtooth';
    crashSub.frequency.setValueAtTime(90, t);
    crashSub.frequency.exponentialRampToValueAtTime(25, t + 1.2);
    crashGain.gain.setValueAtTime(0.85, t);
    crashGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    crashSub.connect(crashGain);
    crashGain.connect(this.sfxGain);
    crashSub.start(t);
    crashSub.stop(t + 1.5);
  }

  public playMazeDoorUnlock(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Heavy latch clunk
    const latch = this.ctx.createOscillator();
    const latchGain = this.ctx.createGain();
    latch.type = 'square';
    latch.frequency.setValueAtTime(220, t);
    latchGain.gain.setValueAtTime(0.6, t);
    latchGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    latch.connect(latchGain);
    latchGain.connect(this.sfxGain);
    latch.start(t);
    latch.stop(t + 0.4);

    // Radiant victory chords
    setTimeout(() => {
      if (!this.ctx || !this.sfxGain) return;
      const t2 = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t2 + idx * 0.1);
        gain.gain.setValueAtTime(0.4, t2 + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t2 + idx * 0.1 + 1.5);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t2 + idx * 0.1);
        osc.stop(t2 + idx * 0.1 + 1.6);
      });
    }, 400);
  }

  /**
   * Player whistle to detect nearby bots (20s cooldown)
   */
  public playWhistle(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    // Characteristic 2-tone melodic whistle: E6 (1318Hz) -> G#6 (1661Hz)
    osc.frequency.setValueAtTime(1318, t);
    osc.frequency.linearRampToValueAtTime(1661, t + 0.15);
    osc.frequency.setValueAtTime(1661, t + 0.28);
    osc.frequency.linearRampToValueAtTime(1975, t + 0.42);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.08);
    gain.gain.setValueAtTime(0.35, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  /**
   * Bot companion responding to whistle from afar
   */
  public playBotWhistleResponse(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    // Slightly lower, reverberating response whistle
    osc.frequency.setValueAtTime(1174, t);
    osc.frequency.linearRampToValueAtTime(1480, t + 0.16);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  /**
   * Sound when Jesty throws player or a bot into the Circus Prison Cage
   */
  public playPrisonDoorClang(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Heavy iron cage bar slam
    const bar = this.ctx.createOscillator();
    const barGain = this.ctx.createGain();
    bar.type = 'sawtooth';
    bar.frequency.setValueAtTime(320, t);
    bar.frequency.exponentialRampToValueAtTime(65, t + 0.45);
    barGain.gain.setValueAtTime(0.7, t);
    barGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    bar.connect(barGain);
    barGain.connect(this.sfxGain);
    bar.start(t);
    bar.stop(t + 0.55);

    // Iron chain rattle
    this.playNoiseBurst(0.4, 0.4, 2800);
  }

  /**
   * Sound when companion or player unlocks and rescues someone from the prison cage
   */
  public playPrisonRescueUnlock(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Padlock pop & metal click
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(800, t);
    click.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    clickGain.gain.setValueAtTime(0.5, t);
    clickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    click.connect(clickGain);
    clickGain.connect(this.sfxGain);
    click.start(t);
    click.stop(t + 0.25);

    // Relief chime
    setTimeout(() => {
      if (!this.ctx || !this.sfxGain) return;
      const t2 = this.ctx.currentTime;
      [587.33, 880, 1174.66].forEach((f, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, t2 + i * 0.08);
        g.gain.setValueAtTime(0.3, t2 + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t2 + i * 0.08 + 0.4);
        o.connect(g);
        g.connect(this.sfxGain!);
        o.start(t2 + i * 0.08);
        o.stop(t2 + i * 0.08 + 0.45);
      });
    }, 150);
  }

  /**
   * Jesty the Clown's theatrical Comedy & Tragedy laugh (distance-scaled)
   */
  public playJestyLaughter(volumeScale: number = 1.0): void {
    if (!this.ctx || !this.sfxGain) return;
    const scale = Math.max(0.08, Math.min(1.0, volumeScale));
    const t = this.ctx.currentTime;
    // Theatrical jester giggle (fast high staccato notes)
    for (let i = 0; i < 6; i++) {
      const noteTime = t + i * 0.085;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const f = 600 + (i % 2 === 0 ? 160 : -70) + (Math.random() - 0.5) * 30;
      osc.frequency.setValueAtTime(f, noteTime);
      osc.frequency.linearRampToValueAtTime(f + 85, noteTime + 0.04);
      gain.gain.setValueAtTime(0.28 * scale, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.085);
    }
  }

  /**
   * Jesty's ominous heavy footsteps + subtle brass jester-bell jingle attenuated by distance
   */
  public playJestyFootstep(distanceToPlayer: number, isFast: boolean): void {
    if (!this.ctx || !this.sfxGain || distanceToPlayer > 38) return;
    const t = this.ctx.currentTime;
    const atten = Math.pow(Math.max(0, 1 - distanceToPlayer / 38), 1.35);
    if (atten <= 0.02) return;

    // 1. Heavy jester boot thud
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(isFast ? 115 : 92, t);
    thud.frequency.exponentialRampToValueAtTime(34, t + 0.11);
    thudGain.gain.setValueAtTime((isFast ? 0.42 : 0.28) * atten, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    thud.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thud.start(t);
    thud.stop(t + 0.14);

    // 2. Subtle metallic jester-hat bell jingle
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'triangle';
    bell.frequency.setValueAtTime(2150 + Math.random() * 240, t);
    bellGain.gain.setValueAtTime((isFast ? 0.09 : 0.055) * atten, t);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    bell.connect(bellGain);
    bellGain.connect(this.sfxGain);
    bell.start(t);
    bell.stop(t + 0.1);
  }

  /**
   * Jesty swaps to Comedy Mask (Aggressive/Laughing)
   */
  public playMaskSwapComedy(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Theatrical circus fanfare chord + maniacal jester laugh
    [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t + idx * 0.04);
      gain.gain.setValueAtTime(0.2, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.04);
      osc.stop(t + 0.65);
    });
    setTimeout(() => this.playJestyLaughter(), 180);
  }

  /**
   * Jesty swaps to Tragedy Mask (Passive/Weeping)
   */
  public playMaskSwapTragedy(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Sad, sorrowful descending minor chord glide + sobbing tone
    [440.0, 392.0, 349.23, 311.13, 261.63].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const noteTime = t + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, noteTime);
      osc.frequency.exponentialRampToValueAtTime(f * 0.85, noteTime + 0.22);
      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }

  /**
   * Sound played when finding one of the 10 Golden Maze Keys
   */
  public playKeyCollectChime(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Bright golden metallic tinkle: C6, E6, G6
    [1046.50, 1318.51, 1567.98].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const noteTime = t + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.35, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  }

  public playSkillCheckTrigger(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.setValueAtTime(1480, t + 0.05);
    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playSkillCheckSuccess(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [880, 1318.5].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t + idx * 0.05);
      g.gain.setValueAtTime(0.35, t + idx * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.25);
      o.connect(g);
      g.connect(this.sfxGain!);
      o.start(t + idx * 0.05);
      o.stop(t + idx * 0.05 + 0.28);
    });
  }

  public playMachineFailExplosion(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const zap = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    zap.type = 'sawtooth';
    zap.frequency.setValueAtTime(420, t);
    zap.frequency.exponentialRampToValueAtTime(55, t + 0.45);
    zapGain.gain.setValueAtTime(0.75, t);
    zapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    zap.connect(zapGain);
    zapGain.connect(this.sfxGain);
    zap.start(t);
    zap.stop(t + 0.55);
    this.playNoiseBurst(0.35, 0.7, 3200);
  }

  public playSomethingComingSting(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [138.59, 196.0, 277.18, 415.3].forEach((f) => {
      if (!this.ctx || !this.sfxGain) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.12, t + 0.65);
      g.gain.setValueAtTime(0.45, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      o.connect(g);
      g.connect(this.sfxGain!);
      o.start(t);
      o.stop(t + 0.8);
    });
  }

  private mazeSirenInterval: number | null = null;

  public playGrabbedSound(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.14);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.45);
    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.55);
    this.playNoiseBurst(0.22, 0.5, 1600);
  }

  public startMazeEscapeSiren(): void {
    this.stopMazeEscapeSiren();
    const triggerWail = () => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc2.type = 'triangle';

      osc.frequency.setValueAtTime(340, t);
      osc.frequency.linearRampToValueAtTime(860, t + 1.3);
      osc.frequency.linearRampToValueAtTime(340, t + 2.6);

      osc2.frequency.setValueAtTime(345, t);
      osc2.frequency.linearRampToValueAtTime(872, t + 1.3);
      osc2.frequency.linearRampToValueAtTime(345, t + 2.6);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.38, t + 0.25);
      gain.gain.setValueAtTime(0.38, t + 2.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.7);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc2.start(t);
      osc.stop(t + 2.75);
      osc2.stop(t + 2.75);
    };

    triggerWail();
    this.mazeSirenInterval = window.setInterval(triggerWail, 3100);
  }

  public stopMazeEscapeSiren(): void {
    if (this.mazeSirenInterval !== null) {
      clearInterval(this.mazeSirenInterval);
      this.mazeSirenInterval = null;
    }
  }

  /**
   * Car starter cranking ("krek-krek-krek") followed by deep engine ignition
   */
  public playCarIgnition(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const crankTime = t + i * 0.24;
      const crank = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      crank.type = 'sawtooth';
      crank.frequency.setValueAtTime(115, crankTime);
      crank.frequency.linearRampToValueAtTime(165, crankTime + 0.14);
      gain.gain.setValueAtTime(0.35, crankTime);
      gain.gain.exponentialRampToValueAtTime(0.01, crankTime + 0.2);
      crank.connect(gain);
      gain.connect(this.sfxGain);
      crank.start(crankTime);
      crank.stop(crankTime + 0.21);
    }

    // Engine roar catch
    const roar = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();
    roar.type = 'sawtooth';
    roar.frequency.setValueAtTime(62, t + 0.72);
    roar.frequency.exponentialRampToValueAtTime(140, t + 1.05);
    roar.frequency.exponentialRampToValueAtTime(70, t + 1.65);
    roarGain.gain.setValueAtTime(0.01, t + 0.72);
    roarGain.gain.linearRampToValueAtTime(0.5, t + 0.9);
    roarGain.gain.exponentialRampToValueAtTime(0.01, t + 1.75);
    roar.connect(roarGain);
    roarGain.connect(this.sfxGain);
    roar.start(t + 0.72);
    roar.stop(t + 1.8);
  }

  /**
   * Dramatic sound of Jesty getting slammed by the getaway car & his masks shattering
   */
  public playJestyDefeat(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // 1. Ceramic comedy/tragedy mask shatter burst
    this.playNoiseBurst(0.55, 0.75, 5200);

    // 2. Final distorted jester shriek fading down to lifeless silence
    const cry = this.ctx.createOscillator();
    const cryGain = this.ctx.createGain();
    cry.type = 'sawtooth';
    cry.frequency.setValueAtTime(760, t + 0.08);
    cry.frequency.exponentialRampToValueAtTime(92, t + 1.35);
    cryGain.gain.setValueAtTime(0.55, t + 0.08);
    cryGain.gain.exponentialRampToValueAtTime(0.001, t + 1.45);
    cry.connect(cryGain);
    cryGain.connect(this.sfxGain);
    cry.start(t + 0.08);
    cry.stop(t + 1.5);
  }

  /**
   * Pistol Sirkus firing sound: punchy toy-cannon POP + spring twang + electric stun zap
   */
  public playCircusPistolShot(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // 1. Snappy circus pop-cannon thump
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(520, t);
    popOsc.frequency.exponentialRampToValueAtTime(95, t + 0.16);
    popGain.gain.setValueAtTime(0.75, t);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    popOsc.connect(popGain);
    popGain.connect(this.sfxGain);
    popOsc.start(t);
    popOsc.stop(t + 0.19);

    // 2. Electric stun arc crackle
    const zapOsc = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    zapOsc.type = 'sawtooth';
    zapOsc.frequency.setValueAtTime(1450, t + 0.02);
    zapOsc.frequency.exponentialRampToValueAtTime(340, t + 0.28);
    zapGain.gain.setValueAtTime(0.35, t + 0.02);
    zapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    zapOsc.connect(zapGain);
    zapGain.connect(this.sfxGain);
    zapOsc.start(t + 0.02);
    zapOsc.stop(t + 0.31);

    // 3. Confetti / spark burst
    this.playNoiseBurst(0.22, 0.45, 3800);
  }

  /**
   * Dizzy circus warble + electric shock pulse when Jacky or Jesty is stunned by Pistol Sirkus
   */
  public playMonsterStunned(): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Cartoon/circus dizzy wobble chime
    const warble = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    warble.type = 'sine';
    warble.frequency.setValueAtTime(660, t);
    warble.frequency.exponentialRampToValueAtTime(240, t + 0.85);

    lfo.frequency.setValueAtTime(14, t);
    lfoGain.gain.setValueAtTime(95, t);
    lfo.connect(lfoGain);
    lfoGain.connect(warble.frequency);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    warble.connect(gain);
    gain.connect(this.sfxGain);

    warble.start(t);
    lfo.start(t);
    warble.stop(t + 0.92);
    lfo.stop(t + 0.92);
  }

  public dispose(): void {
    this.stopHeartbeat();
    this.stopMazeEscapeSiren();
    if (this.musicBoxInterval) {
      clearTimeout(this.musicBoxInterval);
      this.musicBoxInterval = null;
    }
    if (this.ambientOsc1) {
      try { this.ambientOsc1.stop(); } catch {}
    }
    if (this.ambientOsc2) {
      try { this.ambientOsc2.stop(); } catch {}
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const horrorAudio = new HorrorAudio();
