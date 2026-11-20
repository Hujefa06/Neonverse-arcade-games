// NEONVERSE ARCADE v2 — Procedural Web Audio Music Engine
// Zero-CPU offline AudioBuffer rendering per game seed + 800ms crossfade + dynamic layers
import { GAME_REGISTRY, getGame } from '../games/registry';
import { useStore } from '../store/useStore';

export interface GameMusicSeed {
  trackId: string;
  mood: string;
  bpm: number;
  key: string;
}

// Musical note frequency mapping
const NOTE_FREQS: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  'F#2': 92.50, 'F#3': 185.00, 'F#4': 369.99, 'F#5': 739.99,
  'Bb2': 116.54, 'Bb3': 233.08, 'Bb4': 466.16, 'Bb5': 932.33,
  'C#3': 138.59, 'C#4': 277.18, 'C#5': 554.37,
  'Eb3': 155.56, 'Eb4': 311.13, 'Eb5': 622.25,
  'Ab3': 207.65, 'Ab4': 415.30, 'Ab5': 830.61,
};

// Scale formulas
const SCALES: Record<string, string[]> = {
  'D minor': ['D3', 'E3', 'F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'A4'],
  'A minor': ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'E4'],
  'E minor': ['E2', 'F#2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F#3', 'G3', 'B3'],
  'C major': ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'G4'],
  'G major': ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F#3', 'G3', 'A3', 'B3', 'D4'],
  'F major': ['F2', 'G2', 'A2', 'Bb2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'C4'],
  'F minor': ['F2', 'G2', 'Ab2', 'Bb2', 'C3', 'Db3', 'Eb3', 'F3', 'Ab3', 'C4'],
  'B minor': ['B2', 'C#3', 'D3', 'E3', 'F#3', 'G3', 'A3', 'B3', 'D4', 'F#4'],
  'F sharp minor': ['F#2', 'G#2', 'A2', 'B2', 'C#3', 'D3', 'E3', 'F#3', 'A3', 'C#4'],
  'A major': ['A2', 'B2', 'C#3', 'D3', 'E3', 'F#3', 'G#3', 'A3', 'C#4', 'E4'],
  'D major': ['D2', 'E2', 'F#2', 'G2', 'A2', 'B2', 'C#3', 'D3', 'F#3', 'A3'],
  'B flat': ['Bb2', 'C3', 'D3', 'Eb3', 'F3', 'G3', 'A3', 'Bb3', 'D4', 'F4'],
  'C minor': ['C2', 'D2', 'Eb2', 'F2', 'G2', 'Ab2', 'Bb2', 'C3', 'Eb3', 'G3'],
};

class ProceduralMusicEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGain: GainNode | null = null;
  private bossSource: AudioBufferSourceNode | null = null;
  private bossGain: GainNode | null = null;
  private currentTrackId: string | null = null;
  private isMutedLocally = false;
  private isUnlocked = false;

  // In-memory cache for rendered 16-bar AudioBuffers: trackId -> AudioBuffer
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private bossBufferCache: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.setupAutoUnlock();
    this.setupTabVisibility();
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Mobile Chrome user-gesture unlock listener
  private setupAutoUnlock() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      if (this.isUnlocked) return;
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            this.isUnlocked = true;
          });
        } else {
          this.isUnlocked = true;
        }
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  // Auto-pause on tab blur, resume on tab focus
  private setupTabVisibility() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.currentGain && this.ctx) {
          this.currentGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        }
      } else {
        if (this.currentGain && this.ctx) {
          const targetVol = this.getTargetVolume();
          this.currentGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
        }
      }
    });
  }

  private getTargetVolume(): number {
    const { audioSettings } = useStore.getState();
    if (audioSettings.isMuted) return 0;
    return audioSettings.masterVolume * audioSettings.musicVolume * 0.45;
  }

  // Synthesize and render an entire 16-bar AudioBuffer offline
  public async renderTrackOffline(seed: GameMusicSeed, isBoss = false): Promise<AudioBuffer> {
    const cacheKey = `${seed.trackId}_${isBoss ? 'boss' : 'main'}`;
    const cache = isBoss ? this.bossBufferCache : this.bufferCache;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    const sampleRate = 22050;
    const bpm = Math.max(75, Math.min(145, seed.bpm || 120));
    const beatsPerBar = 4;
    const totalBars = 8;
    const beatDuration = 60 / bpm;
    const totalDuration = totalBars * beatsPerBar * beatDuration;

    const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * totalDuration), sampleRate);
    const scaleNotes = SCALES[seed.key] || SCALES['D minor'];

    // 1. Drum Layer (Kick, Snare/Clap, Hi-Hat)
    const sixteenth = beatDuration / 4;
    const totalSixteenths = totalBars * 16;

    for (let step = 0; step < totalSixteenths; step++) {
      const time = step * sixteenth;
      const beatInBar = (step % 16) / 4;
      const isDownbeat = step % 16 === 0;
      const isBackbeat = step % 16 === 4 || step % 16 === 12;

      // Kick on 1 and 3 (and extra hits in high BPM)
      if (isDownbeat || step % 16 === 8 || (isBoss && step % 16 === 14)) {
        this.renderOfflineKick(offlineCtx, time, isBoss ? 0.6 : 0.45);
      }

      // Snare on 2 and 4
      if (isBackbeat) {
        this.renderOfflineSnare(offlineCtx, time, isBoss ? 0.45 : 0.35);
      }

      // Hi-hats on 16ths (dynamic velocity)
      if (step % 2 === 0 || bpm > 120) {
        const hatVol = step % 4 === 2 ? 0.18 : 0.09;
        this.renderOfflineHiHat(offlineCtx, time, hatVol);
      }
    }

    // 2. Bassline Layer (Rhythmic sub-bass locked to root scale)
    const rootNote = scaleNotes[0] || 'D3';
    const fifthNote = scaleNotes[4] || scaleNotes[3] || 'A3';
    const rootFreq = NOTE_FREQS[rootNote] || 110;
    const fifthFreq = NOTE_FREQS[fifthNote] || 164;

    for (let bar = 0; bar < totalBars; bar++) {
      const barTime = bar * 4 * beatDuration;
      const barFreq = bar % 4 === 2 ? fifthFreq : rootFreq;

      for (let eighth = 0; eighth < 8; eighth++) {
        const time = barTime + eighth * (beatDuration / 2);
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        const filter = offlineCtx.createBiquadFilter();

        osc.type = isBoss ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(barFreq / 2, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isBoss ? 550 : 320, time);

        gain.gain.setValueAtTime(isBoss ? 0.35 : 0.28, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + beatDuration * 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(time);
        osc.stop(time + beatDuration * 0.5);
      }
    }

    // 3. Ambient Pad / Chords Layer
    for (let bar = 0; bar < totalBars; bar += 2) {
      const time = bar * 4 * beatDuration;
      const padDuration = 8 * beatDuration;

      const chordNotes = [
        NOTE_FREQS[scaleNotes[0]] || 220,
        NOTE_FREQS[scaleNotes[2]] || 277,
        NOTE_FREQS[scaleNotes[4]] || 330,
      ];

      chordNotes.forEach((freq, idx) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        const filter = offlineCtx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * (idx === 0 ? 0.5 : 1), time);
        osc.detune.setValueAtTime((idx - 1) * 8, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, time);
        filter.frequency.linearRampToValueAtTime(1200, time + padDuration * 0.5);
        filter.frequency.linearRampToValueAtTime(750, time + padDuration);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.8);
        gain.gain.linearRampToValueAtTime(0.001, time + padDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(time);
        osc.stop(time + padDuration);
      });
    }

    // 4. Arpeggiator Melodic Synth Layer
    for (let step = 0; step < totalSixteenths; step++) {
      const time = step * sixteenth;
      // Walk arpeggio pattern: 0, 2, 4, 6, 7, 5, 3, 1
      const pattern = [0, 2, 4, 7, 5, 3, 2, 0, 4, 6, 8, 6, 4, 2, 1, 0];
      const noteIdx = pattern[step % pattern.length] % scaleNotes.length;
      const noteName = scaleNotes[noteIdx];
      const freq = NOTE_FREQS[noteName] || 440;

      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      osc.type = isBoss ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq * (isBoss ? 2 : 1), time);

      gain.gain.setValueAtTime(isBoss ? 0.16 : 0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + sixteenth * 0.85);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(time);
      osc.stop(time + sixteenth);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    // LRU eviction: Keep maximum 2 rendered buffers to prevent memory growth across route transitions
    while (cache.size >= 2) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }
    cache.set(cacheKey, renderedBuffer);
    return renderedBuffer;
  }

  private renderOfflineKick(ctx: OfflineAudioContext, time: number, volume: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private renderOfflineSnare(ctx: OfflineAudioContext, time: number, volume: number) {
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
  }

  private renderOfflineHiHat(ctx: OfflineAudioContext, time: number, volume: number) {
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
  }

  // Play game-specific procedural music with 800ms crossfade
  public async playGameTrack(gameSlug: string) {
    if (this.currentTrackId === gameSlug) return;
    const game = getGame(gameSlug);
    if (!game) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Check for optional public audio file override: /assets/music/{slug}.mp3
    let buffer: AudioBuffer | null = null;
    try {
      const fileRes = await fetch(`/assets/music/${gameSlug}.mp3`, { method: 'HEAD' });
      if (fileRes.ok) {
        const fullRes = await fetch(`/assets/music/${gameSlug}.mp3`);
        const arrayBuf = await fullRes.arrayBuffer();
        buffer = await ctx.decodeAudioData(arrayBuf);
      }
    } catch {
      // Procedural fallback
    }

    if (!buffer) {
      buffer = await this.renderTrackOffline(game.music);
    }

    this.crossfadeToBuffer(buffer, gameSlug);
  }

  // Play homepage / platform ambient menu theme
  public async playMenuTheme() {
    if (this.currentTrackId === 'menu-theme') return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const menuSeed: GameMusicSeed = {
      trackId: 'menu-synthwave',
      mood: 'chill cyber neon lobby',
      bpm: 98,
      key: 'D minor',
    };

    const buffer = await this.renderTrackOffline(menuSeed);
    this.crossfadeToBuffer(buffer, 'menu-theme');
  }

  // Smooth 800ms crossfade transition
  private crossfadeToBuffer(newBuffer: AudioBuffer, trackId: string) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const FADE_TIME = 0.8; // 800ms
    const targetVol = this.getTargetVolume();

    // Fade out previous source node over 800ms
    if (this.currentGain && this.currentSource) {
      const oldGain = this.currentGain;
      const oldSource = this.currentSource;
      oldGain.gain.setValueAtTime(oldGain.gain.value, ctx.currentTime);
      oldGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + FADE_TIME);

      setTimeout(() => {
        try {
          oldSource.stop();
          oldSource.disconnect();
          oldGain.disconnect();
        } catch {}
      }, FADE_TIME * 1000 + 100);
    }

    // Set up new looped audio buffer source
    const newSource = ctx.createBufferSource();
    newSource.buffer = newBuffer;
    newSource.loop = true;

    const newGain = ctx.createGain();
    newGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    newGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + FADE_TIME);

    newSource.connect(newGain);
    newGain.connect(ctx.destination);

    newSource.start();

    this.currentSource = newSource;
    this.currentGain = newGain;
    this.currentTrackId = trackId;
  }

  // Dynamic Intensity: Boss Layer Hook
  public setBossIntensity(intensity: number) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.bossGain) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    const targetVol = this.getTargetVolume() * clamped * 0.8;
    this.bossGain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.2);
  }

  // Victory Fanfare Stinger (4-bar triumphant fanfare)
  public playVictoryStinger() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = this.getTargetVolume() * 1.2;

    const fanfareNotes = [
      { f: 440.0, d: 0.15, t: 0.0 },
      { f: 440.0, d: 0.15, t: 0.15 },
      { f: 440.0, d: 0.15, t: 0.30 },
      { f: 554.37, d: 0.40, t: 0.45 },
      { f: 659.25, d: 0.30, t: 0.85 },
      { f: 880.0, d: 0.80, t: 1.15 },
    ];

    fanfareNotes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0, now + note.t);
      gain.gain.linearRampToValueAtTime(vol * 0.4, now + note.t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.05);
    });
  }

  // Stop music with smooth fade out
  public stopMusic(fadeTime = 0.5) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (this.currentGain && this.currentSource) {
      this.currentGain.gain.setValueAtTime(this.currentGain.gain.value, ctx.currentTime);
      this.currentGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fadeTime);
      const source = this.currentSource;
      setTimeout(() => {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      }, fadeTime * 1000 + 50);
      this.currentSource = null;
      this.currentGain = null;
    }
    this.currentTrackId = null;
  }
}

export const proceduralMusicEngine = new ProceduralMusicEngine();
