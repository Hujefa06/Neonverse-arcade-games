import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface Citizen {
  name: string;
  emoji: string;
  x: number;
  y: number;
  routine: (time: number) => { x: number; y: number; action?: string };
}

export function mountThirtySecondDetective(
  container: HTMLDivElement,
  api: GameShellApi
): () => void {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'contain';
  canvas.style.backgroundColor = '#07080F';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;

  let currentCaseIndex = 0;
  const cases = [
    { id: 1, title: 'Case 1: The Bakery Toast Smoke', clue: 'The baker burns the cyber toast at second 15! Reach the bakery oven to shut it off.', targetSec: 15, targetX: 240, targetY: 180 },
    { id: 2, title: 'Case 2: The Alleyway Pickpocket', clue: 'A mysterious thief slips through Neon Alley at second 21 to snatch the keycard. Intercept him!', targetSec: 21, targetX: 680, targetY: 340 },
    { id: 3, title: 'Case 3: The Cafe Secret Swap', clue: 'An encrypted envelope is left on the cafe table at second 12. Swap it with a fake!', targetSec: 12, targetX: 480, targetY: 260 },
  ];

  let loopTime = 0.0;
  const maxLoopTime = 30.0;
  let loopsCompleted = 0;
  let score = 0;

  // Detective player
  let detX = 480;
  let detY = 440;
  let moveKeys = { up: false, down: false, left: false, right: false };
  let statusMessage = cases[currentCaseIndex].clue;

  const activeCase = cases[currentCaseIndex];

  // Town Citizens with deterministic routines
  const citizens: Citizen[] = [
    {
      name: 'Baker Bob',
      emoji: '👨‍🍳',
      x: 240,
      y: 180,
      routine: (t) => ({ x: 240, y: t < 15 ? 180 : 140, action: t >= 15 ? '🔥 Toast Burning!' : 'Baking' }),
    },
    {
      name: 'Shady Thief',
      emoji: '🦹',
      x: 760,
      y: 180,
      routine: (t) => ({ x: 760 - Math.min(200, t * 12), y: 180 + Math.min(160, t * 8), action: 'Lurking' }),
    },
    {
      name: 'Diplomat',
      emoji: '🕵️',
      x: 480,
      y: 260,
      routine: (t) => ({ x: 480, y: 260, action: t >= 12 ? 'Envelope Dropped' : 'Sipping Coffee' }),
    },
  ];

  audioManager.startMusic('ambient');

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 'ArrowUp') moveKeys.up = true;
    if (e.key === 's' || e.key === 'ArrowDown') moveKeys.down = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') moveKeys.left = true;
    if (e.key === 'd' || e.key === 'ArrowRight') moveKeys.right = true;
    if (e.key === 'e') interact();
    if (e.code === 'Space') loopTime = Math.min(maxLoopTime, loopTime + 3); // Skip 3 seconds
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 'ArrowUp') moveKeys.up = false;
    if (e.key === 's' || e.key === 'ArrowDown') moveKeys.down = false;
    if (e.key === 'a' || e.key === 'ArrowLeft') moveKeys.left = false;
    if (e.key === 'd' || e.key === 'ArrowRight') moveKeys.right = false;
  };

  const interact = () => {
    audioManager.playKeystrokeTick();
    const curr = cases[currentCaseIndex];
    const dist = Math.hypot(detX - curr.targetX, detY - curr.targetY);

    // Check if player solved case at the right second
    if (dist < 55 && Math.abs(loopTime - curr.targetSec) < 3.0) {
      // CASE SOLVED!
      score += 2000;
      audioManager.playVictoryFanfare();
      fxKit.triggerLightningFlash(api.flashRef.current, '#B6FF3C');

      if (currentCaseIndex < cases.length - 1) {
        currentCaseIndex++;
        statusMessage = `STAMPED SOLVED! Next: ${cases[currentCaseIndex].title}`;
        detX = 480;
        detY = 440;
        loopTime = 0;
      } else {
        saveManager.save('thirty-second-detective', { highScore: score });
        api.triggerVictory(score, 8);
      }
    } else {
      statusMessage = 'Nothing to interact with right now. Check your clue!';
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    loopTime += dt;
    if (loopTime >= maxLoopTime) {
      // Loop Reset!
      loopTime = 0;
      loopsCompleted++;
      detX = 480;
      detY = 440;
      audioManager.playSlashSpecial();
      fxKit.triggerLightningFlash(api.flashRef.current, '#7C4DFF');
    }

    // Player movement
    const spd = 200;
    if (moveKeys.up) detY = Math.max(60, detY - spd * dt);
    if (moveKeys.down) detY = Math.min(canvas.height - 40, detY + spd * dt);
    if (moveKeys.left) detX = Math.max(40, detX - spd * dt);
    if (moveKeys.right) detX = Math.min(canvas.width - 40, detX + spd * dt);

    // Update Citizens
    citizens.forEach((c) => {
      const state = c.routine(loopTime);
      c.x = state.x;
      c.y = state.y;
    });

    // --- DRAWING ---
    ctx.fillStyle = '#080A12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noir Town Buildings
    // Bakery (Top-Left)
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = '#00F0FF';
    ctx.strokeRect(160, 100, 160, 120);
    ctx.fillRect(160, 100, 160, 120);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Orbitron, sans-serif';
    ctx.fillText('🍞 CYBER BAKERY', 170, 125);

    // Cafe (Center)
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = '#FFB800';
    ctx.strokeRect(400, 180, 160, 130);
    ctx.fillRect(400, 180, 160, 130);
    ctx.fillText('☕ NEON CAFE', 410, 205);

    // Neon Alley (Right)
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = '#FF2E9A';
    ctx.strokeRect(660, 120, 180, 220);
    ctx.fillRect(660, 120, 180, 220);
    ctx.fillText('🏮 NEON ALLEY', 675, 145);

    // Draw Citizens
    citizens.forEach((c) => {
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.emoji, c.x, c.y);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#A0AEC0';
      ctx.fillText(c.name, c.x, c.y + 16);
    });

    // Draw Detective
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🕵️‍♂️', detX, detY);

    // Top HUD with Loop Time Gauge
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(cases[currentCaseIndex].title, 35, 35);

    // 30-Second Loop Clock Progress
    const clockPct = loopTime / maxLoopTime;
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(canvas.width - 240, 20, 200, 16);
    ctx.fillStyle = '#7C4DFF';
    ctx.fillRect(canvas.width - 240, 20, clockPct * 200, 16);
    ctx.strokeStyle = '#00F0FF';
    ctx.strokeRect(canvas.width - 240, 20, 200, 16);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Orbitron, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`LOOP: ${loopTime.toFixed(1)}s / 30.0s`, canvas.width - 45, 15);

    // Bottom Clue Ribbon
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - 35, canvas.width, 35);
    ctx.fillStyle = '#B6FF3C';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`CLUE: ${statusMessage}`, canvas.width / 2, canvas.height - 14);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
