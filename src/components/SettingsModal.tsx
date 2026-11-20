import React from 'react';
import { X, Volume2, VolumeX, Eye, Smartphone, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { audioManager } from '../game-sdk/AudioManager';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    audioSettings,
    setAudioSetting,
    toggleMute,
    fxSettings,
    setFxSetting,
  } = useStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0B0E1A] border border-neon-cyan/40 rounded-2xl shadow-neon-cyan p-6 overflow-hidden animate-fadeIn">
        <button
          onClick={() => setSettingsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-orbitron font-bold text-xl text-neon-cyan mb-1 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-neon-magenta" />
          <span>Platform Settings</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">Customize sound, visuals, and mobile controls.</p>

        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Audio Channels Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase text-neon-cyan flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4" />
                <span>Audio Mixer</span>
              </h4>
              <button
                onClick={() => {
                  audioManager.playUiClick();
                  toggleMute();
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border font-mono ${
                  audioSettings.isMuted
                    ? 'bg-neon-magenta/20 border-neon-magenta text-neon-magenta'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                {audioSettings.isMuted ? 'MUTED' : 'MUTE ALL'}
              </button>
            </div>

            <div className="space-y-3 bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Music Channel</span>
                  <span className="font-mono text-neon-cyan">
                    {Math.round(audioSettings.musicVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.musicVolume}
                  onChange={(e) => setAudioSetting('musicVolume', parseFloat(e.target.value))}
                  className="w-full accent-neon-cyan"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>SFX Channel</span>
                  <span className="font-mono text-neon-cyan">
                    {Math.round(audioSettings.sfxVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.sfxVolume}
                  onChange={(e) => {
                    setAudioSetting('sfxVolume', parseFloat(e.target.value));
                    audioManager.playUiClick();
                  }}
                  className="w-full accent-neon-cyan"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Typing Tick Channel (TypeStrike)</span>
                  <span className="font-mono text-neon-cyan">
                    {Math.round(audioSettings.typingVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.typingVolume}
                  onChange={(e) => {
                    setAudioSetting('typingVolume', parseFloat(e.target.value));
                    audioManager.playKeystrokeTick();
                  }}
                  className="w-full accent-neon-cyan"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Victory Fanfare Channel</span>
                  <span className="font-mono text-neon-cyan">
                    {Math.round(audioSettings.victoryVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.victoryVolume}
                  onChange={(e) => setAudioSetting('victoryVolume', parseFloat(e.target.value))}
                  className="w-full accent-neon-cyan"
                />
              </div>
            </div>
          </div>

          {/* Visuals & Performance */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-neon-magenta flex items-center space-x-1.5 mb-2">
              <Eye className="w-4 h-4" />
              <span>Visuals & Performance</span>
            </h4>
            <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-slate-200 font-medium">Low FX Mode</div>
                  <div className="text-slate-400 text-[11px]">Reduces particle density for budget mobile devices</div>
                </div>
                <input
                  type="checkbox"
                  checked={fxSettings.lowFxMode}
                  onChange={(e) => setFxSetting('lowFxMode', e.target.checked)}
                  className="w-4 h-4 accent-neon-cyan"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-white/10">
                <div>
                  <div className="text-slate-200 font-medium">Reduce Motion</div>
                  <div className="text-slate-400 text-[11px]">Disables screen shake, 3D card tilt & confetti</div>
                </div>
                <input
                  type="checkbox"
                  checked={fxSettings.reducedMotion}
                  onChange={(e) => setFxSetting('reducedMotion', e.target.checked)}
                  className="w-4 h-4 accent-neon-cyan"
                />
              </label>
            </div>
          </div>

          {/* Mobile Controls */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-neon-lime flex items-center space-x-1.5 mb-2">
              <Smartphone className="w-4 h-4" />
              <span>Touch Controls</span>
            </h4>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-slate-200 font-medium">Left-Handed Touch Layout</div>
                  <div className="text-slate-400 text-[11px]">Swaps virtual joystick to right and action buttons to left</div>
                </div>
                <input
                  type="checkbox"
                  checked={fxSettings.leftHandedTouch}
                  onChange={(e) => setFxSetting('leftHandedTouch', e.target.checked)}
                  className="w-4 h-4 accent-neon-lime"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={() => setSettingsOpen(false)}
          className="mt-6 w-full py-2.5 rounded-xl bg-neon-cyan text-black font-orbitron font-bold text-xs hover:bg-neon-cyan/90 transition-all shadow-neon-cyan"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};
