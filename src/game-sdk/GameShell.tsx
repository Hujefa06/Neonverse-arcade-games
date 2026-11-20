import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Tv,
  Volume2,
  VolumeX,
  HelpCircle,
  X,
  Award,
  Zap,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { inputManager } from './InputManager';
import { audioManager } from './AudioManager';
import { scoreManager } from './ScoreManager';
import { GameMetadata } from '../types/game';

export interface GameShellProps {
  game: GameMetadata;
  // Lifecycle callback passed from the active game implementation
  onMountGame: (container: HTMLDivElement, shellApi: GameShellApi) => (() => void) | Promise<(() => void)>;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
}

export interface GameShellApi {
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  triggerGameOver: (score: number, levelReached?: number) => void;
  triggerVictory: (score: number, levelReached?: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  flashRef: React.RefObject<HTMLDivElement>;
}

export const GameShell: React.FC<GameShellProps> = ({
  game,
  onMountGame,
  isTheaterMode = false,
  onToggleTheater,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const joystickBaseRef = useRef<HTMLDivElement>(null);

  const { audioSettings, toggleMute, fxSettings } = useStore();

  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [levelReached, setLevelReached] = useState(1);
  const [earnedRewards, setEarnedRewards] = useState<{ xp: number; coins: number; leveledUp: boolean } | null>(null);

  // Virtual Joystick Touch States
  const [isDraggingJoy, setIsDraggingJoy] = useState(false);
  const [joyPos, setJoyPos] = useState({ x: 0, y: 0 });

  const gameCleanupRef = useRef<(() => void) | null>(null);

  // Resume game
  const handleResume = useCallback(() => {
    setIsPaused(false);
    audioManager.playUiClick();
  }, []);

  // Pause game
  const handlePause = useCallback(() => {
    setIsPaused(true);
    audioManager.playUiClick();
  }, []);

  // Restart game
  const handleRestart = useCallback(() => {
    setIsPaused(false);
    setIsGameOver(false);
    setIsVictory(false);
    setEarnedRewards(null);
    audioManager.playUiClick();

    if (gameCleanupRef.current) {
      gameCleanupRef.current();
      gameCleanupRef.current = null;
    }
    if (containerRef.current) {
      // Clear container and remount
      containerRef.current.innerHTML = '';
      const res = onMountGame(containerRef.current, api);
      if (res instanceof Promise) {
        res.then((cleanup) => {
          if (typeof cleanup === 'function') {
            gameCleanupRef.current = cleanup;
          }
        });
      } else if (typeof res === 'function') {
        gameCleanupRef.current = res;
      }
    }
  }, [onMountGame]);

  // Handle Game Over
  const triggerGameOver = useCallback(
    async (score: number, lvl: number = 1) => {
      setFinalScore(score);
      setLevelReached(lvl);
      setIsGameOver(true);
      const res = await scoreManager.submitScore({
        gameId: game.id,
        score,
        levelReached: lvl,
      });
      setEarnedRewards({ xp: res.earnedXp, coins: res.earnedCoins, leveledUp: res.leveledUp });
    },
    [game.id]
  );

  // Handle Victory
  const triggerVictory = useCallback(
    async (score: number, lvl: number = 1) => {
      setFinalScore(score);
      setLevelReached(lvl);
      setIsVictory(true);
      const res = await scoreManager.submitScore({
        gameId: game.id,
        score,
        levelReached: lvl,
      });
      setEarnedRewards({ xp: res.earnedXp, coins: res.earnedCoins, leveledUp: res.leveledUp });
    },
    [game.id]
  );

  // Shell API object passed to game engines
  const api: GameShellApi = {
    pauseGame: handlePause,
    resumeGame: handleResume,
    restartGame: handleRestart,
    triggerGameOver,
    triggerVictory,
    containerRef,
    flashRef,
  };

  // Mount active game inside container
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    
    let isCancelled = false;
    let activeCleanup: (() => void) | null = null;

    const res = onMountGame(containerRef.current, api);
    if (res instanceof Promise) {
      res.then((cleanup) => {
        if (isCancelled) {
          if (typeof cleanup === 'function') cleanup();
        } else {
          activeCleanup = cleanup;
          gameCleanupRef.current = cleanup;
        }
      }).catch((err) => {
        console.error(`[GameShell] Error mounting game ${game.id}:`, err);
      });
    } else if (typeof res === 'function') {
      activeCleanup = res;
      gameCleanupRef.current = res;
    }

    // Start score session for anti-cheat
    scoreManager.startSession(game.id);

    // Start unique procedural track for this game with crossfade
    audioManager.playGameMusic(game.slug || game.id);

    return () => {
      isCancelled = true;
      if (activeCleanup) {
        try { activeCleanup(); } catch (e) { console.error(e); }
      }
      if (gameCleanupRef.current && gameCleanupRef.current !== activeCleanup) {
        try { gameCleanupRef.current(); } catch (e) { console.error(e); }
      }
      gameCleanupRef.current = null;
      if (containerRef.current) {
        const canvases = containerRef.current.querySelectorAll('canvas');
        canvases.forEach((c) => {
          c.width = 0;
          c.height = 0;
        });
        containerRef.current.innerHTML = '';
      }
      audioManager.stopMusic();
    };
  }, [game.id, onMountGame]);

  // Auto-pause on tab blur
  useEffect(() => {
    const onBlur = () => {
      if (!isPaused && !isGameOver && !isVictory) {
        setIsPaused(true);
      }
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [isPaused, isGameOver, isVictory]);

  // Hotkeys: Escape/P to pause, R to restart
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (!isGameOver && !isVictory) {
          setIsPaused((prev) => !prev);
        }
      } else if (e.key.toLowerCase() === 'r') {
        if (!isPaused && (isGameOver || isVictory || confirm('Restart game?'))) {
          handleRestart();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isGameOver, isVictory, isPaused, handleRestart]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const elem = containerRef.current?.parentElement;
    if (!elem) return;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Joystick touch handlers
  const handleTouchStartJoy = (e: React.TouchEvent) => {
    setIsDraggingJoy(true);
    handleTouchMoveJoy(e);
  };

  const handleTouchMoveJoy = (e: React.TouchEvent) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const touch = e.touches[0];
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.min(40, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);
    const clampedX = Math.cos(angle) * distance;
    const clampedY = Math.sin(angle) * distance;

    setJoyPos({ x: clampedX, y: clampedY });
    inputManager.setTouchMoveVector(clampedX / 40, clampedY / 40);
  };

  const handleTouchEndJoy = () => {
    setIsDraggingJoy(false);
    setJoyPos({ x: 0, y: 0 });
    inputManager.setTouchMoveVector(0, 0);
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden glass-card border border-neon-cyan/30 shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-black' : isTheaterMode ? 'max-w-7xl mx-auto h-[80vh]' : 'aspect-video max-h-[720px]'
      }`}
    >
      {/* Game Viewport Canvas Container */}
      <div
        ref={containerRef}
        id="neonverse-canvas-viewport"
        className="w-full h-full relative overflow-hidden bg-[#07080F] flex items-center justify-center select-none"
      />

      {/* Lightning Flash Overlay */}
      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 z-20 opacity-0 bg-white"
      />

      {/* Floating HUD Top-Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          <span className="text-xl">{game.iconEmoji}</span>
          <span className="font-orbitron font-bold text-sm tracking-wider text-neon-cyan hidden sm:inline">
            {game.title}
          </span>
          {game.badge && (
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/40">
              {game.badge}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pointer-events-auto flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shadow-lg">
          <button
            onClick={() => setShowControlsModal(true)}
            className="p-1.5 text-slate-300 hover:text-neon-cyan transition-colors"
            title="Controls Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 text-slate-300 hover:text-neon-cyan transition-colors"
            title={audioSettings.isMuted ? 'Unmute' : 'Mute'}
          >
            {audioSettings.isMuted ? <VolumeX className="w-4 h-4 text-neon-magenta" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRestart}
            className="p-1.5 text-slate-300 hover:text-neon-lime transition-colors"
            title="Restart (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={isPaused ? handleResume : handlePause}
            className="p-1.5 text-slate-300 hover:text-neon-cyan transition-colors"
            title={isPaused ? 'Resume' : 'Pause (Esc/P)'}
          >
            {isPaused ? <Play className="w-4 h-4 text-neon-lime" /> : <Pause className="w-4 h-4" />}
          </button>
          {onToggleTheater && (
            <button
              onClick={onToggleTheater}
              className={`p-1.5 transition-colors hidden md:inline-flex ${isTheaterMode ? 'text-neon-cyan' : 'text-slate-300 hover:text-white'}`}
              title="Theater Mode"
            >
              <Tv className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-neon-cyan transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Virtual Touch Controls Overlay */}
      <div className="md:hidden absolute inset-0 pointer-events-none z-25 flex justify-between items-end p-4 pb-6">
        {/* Virtual Joystick */}
        <div
          ref={joystickBaseRef}
          onTouchStart={handleTouchStartJoy}
          onTouchMove={handleTouchMoveJoy}
          onTouchEnd={handleTouchEndJoy}
          className={`pointer-events-auto relative w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-neon-cyan/40 flex items-center justify-center touch-none ${
            fxSettings.leftHandedTouch ? 'order-2' : 'order-1'
          }`}
        >
          <div
            className="w-10 h-10 rounded-full bg-neon-cyan/80 shadow-neon-cyan transition-transform"
            style={{ transform: `translate(${joyPos.x}px, ${joyPos.y}px)` }}
          />
        </div>

        {/* Context Action Touch Buttons */}
        <div className={`pointer-events-auto flex items-center space-x-3 ${fxSettings.leftHandedTouch ? 'order-1' : 'order-2'}`}>
          <button
            onTouchStart={() => inputManager.setTouchButton('jump', true)}
            onTouchEnd={() => inputManager.setTouchButton('jump', false)}
            className="w-14 h-14 rounded-full bg-neon-magenta/30 border border-neon-magenta/60 active:bg-neon-magenta flex items-center justify-center font-orbitron font-bold text-xs text-white shadow-neon-magenta active:scale-95 transition-all select-none"
          >
            JUMP
          </button>
          <button
            onTouchStart={() => inputManager.setTouchButton('action', true)}
            onTouchEnd={() => inputManager.setTouchButton('action', false)}
            className="w-14 h-14 rounded-full bg-neon-cyan/30 border border-neon-cyan/60 active:bg-neon-cyan flex items-center justify-center font-orbitron font-bold text-xs text-white shadow-neon-cyan active:scale-95 transition-all select-none"
          >
            ACT
          </button>
        </div>
      </div>

      {/* Pause Menu Overlay */}
      {isPaused && !isGameOver && !isVictory && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center space-y-6 animate-fadeIn">
          <h2 className="font-orbitron font-extrabold text-4xl text-neon-cyan tracking-wider drop-shadow-neon-cyan">
            GAME PAUSED
          </h2>
          <p className="text-sm text-slate-400">Take a breath, champion</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleResume}
              className="px-8 py-3 rounded-xl bg-neon-cyan text-black font-orbitron font-bold shadow-neon-cyan hover:scale-105 transition-all"
            >
              RESUME (ESC)
            </button>
            <button
              onClick={handleRestart}
              className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold border border-white/20 hover:scale-105 transition-all"
            >
              RESTART (R)
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Victory Modal Overlay */}
      {(isGameOver || isVictory) && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center space-x-2">
            {isVictory ? (
              <Award className="w-10 h-10 text-neon-lime animate-bounce" />
            ) : (
              <Zap className="w-10 h-10 text-neon-magenta" />
            )}
            <h2
              className={`font-orbitron font-black text-4xl tracking-wider ${
                isVictory ? 'text-neon-lime drop-shadow-neon-lime' : 'text-neon-magenta drop-shadow-neon-magenta'
              }`}
            >
              {isVictory ? 'STAGE CLEARED!' : 'GAME OVER'}
            </h2>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center space-y-3">
            <div className="text-xs uppercase tracking-widest text-slate-400">Final Score</div>
            <div className="font-orbitron font-extrabold text-4xl text-neon-cyan">
              {finalScore.toLocaleString()}
            </div>
            {levelReached > 1 && (
              <div className="text-sm text-slate-300 font-medium">Level Reached: {levelReached}</div>
            )}
            {earnedRewards && (
              <div className="pt-2 border-t border-white/10 flex justify-around text-xs text-slate-300 font-orbitron">
                <div>
                  <span className="text-neon-cyan">+{earnedRewards.xp}</span> XP
                </div>
                <div>
                  <span className="text-neon-amber">+{earnedRewards.coins}</span> COINS
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-8 py-3 rounded-xl bg-neon-cyan text-black font-orbitron font-bold shadow-neon-cyan hover:scale-105 transition-all flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>
          </div>
        </div>
      )}

      {/* Controls Overlay Guide Modal */}
      {showControlsModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="relative bg-[#0B0E1A] border border-neon-cyan/40 rounded-2xl p-6 max-w-md w-full shadow-neon-cyan">
            <button
              onClick={() => setShowControlsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-orbitron font-bold text-xl text-neon-cyan mb-4 flex items-center space-x-2">
              <HelpCircle className="w-5 h-5" />
              <span>How to Play & Controls</span>
            </h3>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <h4 className="text-xs font-semibold uppercase text-neon-magenta mb-2">Instructions</h4>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {game.howToPlay.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-neon-cyan mb-2">Desktop Keyboard & Mouse</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {game.controls.desktop.map((c, idx) => (
                    <div key={idx} className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="font-mono font-bold text-neon-cyan">{c.key}</span>
                      <div className="text-slate-400 text-[11px]">{c.action}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-neon-lime mb-2">Mobile Touch Controls</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {game.controls.mobile.map((c, idx) => (
                    <div key={idx} className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="font-mono font-bold text-neon-lime">{c.gesture}</span>
                      <div className="text-slate-400 text-[11px]">{c.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-neon-cyan text-black font-orbitron font-bold text-xs hover:bg-neon-cyan/90 transition-all"
            >
              GOT IT, LET'S PLAY!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
