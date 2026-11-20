// Web Audio API Procedural Sound Synthesizer & Multi-Channel Mixer
import { useStore } from '../store/useStore';
import { proceduralMusicEngine } from './ProceduralMusicEngine';

class AudioManager {
  private ctx: AudioContext | null = null;
  private musicNode: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private isMusicPlaying = false;
  private currentMusicTrack: string | null = null;
  private musicInterval: any = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private getEffectiveVolume(channel: 'master' | 'music' | 'sfx' | 'typing' | 'victory'): number {
    const { audioSettings } = useStore.getState();
    if (audioSettings.isMuted) return 0;
    const master = audioSettings.masterVolume;
    switch (channel) {
      case 'music':
        return master * audioSettings.musicVolume;
      case 'sfx':
        return master * audioSettings.sfxVolume;
      case 'typing':
        return master * audioSettings.typingVolume;
      case 'victory':
        return master * audioSettings.victoryVolume;
      default:
        return master;
    }
  }

  // --- Sound Effects Synthesis ---

  /** Soft mechanical tick per keystroke (never loud) */
  playKeystrokeTick() {
    const vol = this.getEffectiveVolume('typing');
    if (vol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Subtle wooden key click pitch
    const pitch = 700 + Math.random() * 200;
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(vol * 0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.025);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  /** Punch POW impact for completed words */
  playPunchPOW() {
    const vol = this.getEffectiveVolume('sfx');
    if (vol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Low frequency punch thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

    oscGain.gain.setValueAtTime(vol * 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);

    // Punch transient noise burst
    this.playNoiseBurst(0.08, vol * 0.4, 600);
  }

  /** WHOOSH / SLASH for sentence specials */
  playSlashSpecial() {
    const vol = this.getEffectiveVolume('sfx');
    if (vol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

    gain.gain.setValueAtTime(vol * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);

    this.playNoiseBurst(0.2, vol * 0.5, 1200);
  }

  /** COMBO BOOM for high streaks and ultimate attacks */
  playComboBoom() {
    const vol = this.getEffectiveVolume('sfx');
    if (vol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Sub-bass rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    subGain.gain.setValueAtTime(vol * 0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.7);

    // Crackle noise burst
    this.playNoiseBurst(0.35, vol * 0.6, 400);
  }

  /** Generic UI Click sound */
  playUiClick() {
    const vol = this.getEffectiveVolume('sfx');
    if (vol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.04);

    gain.gain.setValueAtTime(vol * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Level Up / Score Burst Chime */
  playLevelUpChime() {
    const vol = this.getEffectiveVolume('victory');
    if (vol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(vol * 0.4, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  /** Victory Fanfare */
  playVictoryFanfare() {
    const vol = this.getEffectiveVolume('victory');
    if (vol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Fanfare chords: F, G, A, C (Heroic cadence)
    const melody = [
      { f: 440.0, d: 0.15, t: 0.0 },
      { f: 440.0, d: 0.15, t: 0.15 },
      { f: 440.0, d: 0.15, t: 0.30 },
      { f: 554.37, d: 0.35, t: 0.45 },
      { f: 659.25, d: 0.25, t: 0.80 },
      { f: 880.0, d: 0.65, t: 1.05 },
    ];

    melody.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0, now + note.t);
      gain.gain.linearRampToValueAtTime(vol * 0.35, now + note.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.05);
    });
  }

  /** Helper to generate shaped white/pink noise */
  private playNoiseBurst(duration: number, volume: number, filterFreq = 1000) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
  }

  // --- Procedural Synth Music Engine Integration ---

  /** Play unique procedural music for any game */
  playGameMusic(slug: string) {
    this.isMusicPlaying = true;
    this.currentMusicTrack = slug;
    proceduralMusicEngine.playGameTrack(slug);
  }

  /** Play menu theme */
  playMenuMusic() {
    this.isMusicPlaying = true;
    this.currentMusicTrack = 'menu';
    proceduralMusicEngine.playMenuTheme();
  }

  /** Set boss layer intensity (0.0 to 1.0) */
  setBossIntensity(intensity: number) {
    proceduralMusicEngine.setBossIntensity(intensity);
  }

  startMusic(trackName: 'battle' | 'boss' | 'ambient' | 'victory' = 'battle') {
    this.isMusicPlaying = true;
    this.currentMusicTrack = trackName;
    if (trackName === 'boss') {
      proceduralMusicEngine.playGameTrack('fliprush');
      proceduralMusicEngine.setBossIntensity(1.0);
    } else if (trackName === 'ambient') {
      proceduralMusicEngine.playMenuTheme();
    } else {
      proceduralMusicEngine.playGameTrack('typestrike-arena');
    }
  }

  stopMusic() {
    this.isMusicPlaying = false;
    this.currentMusicTrack = null;
    proceduralMusicEngine.stopMusic(0.8);
  }
}

export const audioManager = new AudioManager();
