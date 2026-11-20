import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface ChamberTwin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  isDead: boolean;
  atExit: boolean;
}

export function mountMirrorTwins(
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

  const FLOOR_Y = 440;
  const SPLIT_X = 480;

  let currentLevel = 1;
  const maxLevels = 30;
  let score = 0;

  // Twin A (Left Chamber) & Twin B (Right Chamber)
  let twinA: ChamberTwin = { x: 120, y: FLOOR_Y - 24, vx: 0, vy: 0, color: '#00F0FF', isDead: false, atExit: false };
  let twinB: ChamberTwin = { x: 840, y: FLOOR_Y - 24, vx: 0, vy: 0, color: '#FF2E9A', isDead: false, atExit: false };

  // Exit Doors
  const exitA = { x: 420, y: FLOOR_Y - 24 };
  const exitB = { x: 540, y: FLOOR_Y - 24 };

  // Hazards (Left & Right chambers)
  const hazards = [
    { x: 260, y: FLOOR_Y - 20, w: 30, h: 20 },
    { x: 700, y: FLOOR_Y - 20, w: 30, h: 20 },
  ];

  let moveLeft = false;
  let moveRight = false;

  audioManager.startMusic('battle');

  const jump = () => {
    if (twinA.y >= FLOOR_Y - 25) twinA.vy = -620;
    if (twinB.y >= FLOOR_Y - 25) twinB.vy = -620;
    audioManager.playKeystrokeTick();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') moveLeft = true;
    if (e.key === 'd' || e.key === 'ArrowRight') moveRight = true;
    if (e.code === 'Space' || e.key === 'w' || e.key === 'ArrowUp') jump();
    if (e.key === 'r') resetLevel();
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') moveLeft = false;
    if (e.key === 'd' || e.key === 'ArrowRight') moveRight = false;
  };

  const resetLevel = () => {
    twinA = { x: 120, y: FLOOR_Y - 24, vx: 0, vy: 0, color: '#00F0FF', isDead: false, atExit: false };
    twinB = { x: 840, y: FLOOR_Y - 24, vx: 0, vy: 0, color: '#FF2E9A', isDead: false, atExit: false };
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    const gravity = 1500;
    const speed = 240;

    // Movement: Left Chamber moves standard, Right Chamber MIRRORS horizontally!
    if (moveLeft) {
      twinA.x = Math.max(30, twinA.x - speed * dt);
      twinB.x = Math.min(canvas.width - 30, twinB.x + speed * dt);
    }
    if (moveRight) {
      twinA.x = Math.min(SPLIT_X - 30, twinA.x + speed * dt);
      twinB.x = Math.max(SPLIT_X + 30, twinB.x - speed * dt);
    }

    // Gravity for Twin A
    twinA.vy += gravity * dt;
    twinA.y += twinA.vy * dt;
    if (twinA.y >= FLOOR_Y - 24) { twinA.y = FLOOR_Y - 24; twinA.vy = 0; }

    // Gravity for Twin B
    twinB.vy += gravity * dt;
    twinB.y += twinB.vy * dt;
    if (twinB.y >= FLOOR_Y - 24) { twinB.y = FLOOR_Y - 24; twinB.vy = 0; }

    // Hazard collision
    hazards.forEach((h) => {
      if (twinA.x + 12 > h.x && twinA.x - 12 < h.x + h.w && twinA.y + 12 > h.y) {
        audioManager.playComboBoom();
        fxKit.triggerScreenShake(container, 10, 300);
        resetLevel();
      }
      if (twinB.x + 12 > h.x && twinB.x - 12 < h.x + h.w && twinB.y + 12 > h.y) {
        audioManager.playComboBoom();
        fxKit.triggerScreenShake(container, 10, 300);
        resetLevel();
      }
    });

    // Check Exit Doors (BOTH must reach doors)
    twinA.atExit = Math.hypot(twinA.x - exitA.x, twinA.y - exitA.y) < 25;
    twinB.atExit = Math.hypot(twinB.x - exitB.x, twinB.y - exitB.y) < 25;

    if (twinA.atExit && twinB.atExit) {
      score += 2500;
      audioManager.playVictoryFanfare();
      saveManager.save('mirror-twins', { level: currentLevel, highScore: score });

      if (currentLevel >= maxLevels) {
        api.triggerVictory(score, currentLevel);
        return;
      } else {
        currentLevel++;
        resetLevel();
      }
    }

    // --- DRAWING ---
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center Mirror Dividing Line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(SPLIT_X, 0);
    ctx.lineTo(SPLIT_X, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Chambers Floors
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(SPLIT_X, FLOOR_Y);
    ctx.stroke();

    ctx.strokeStyle = '#FF2E9A';
    ctx.beginPath();
    ctx.moveTo(SPLIT_X, FLOOR_Y);
    ctx.lineTo(canvas.width, FLOOR_Y);
    ctx.stroke();

    // Draw Exit Portals
    ctx.fillStyle = '#B6FF3C';
    ctx.shadowColor = '#B6FF3C';
    ctx.shadowBlur = 12;
    ctx.fillRect(exitA.x - 16, exitA.y - 16, 32, 40);
    ctx.fillRect(exitB.x - 16, exitB.y - 16, 32, 40);
    ctx.shadowBlur = 0;

    // Draw Hazards
    ctx.fillStyle = '#EF4444';
    hazards.forEach((h) => {
      ctx.fillRect(h.x, h.y, h.w, h.h);
    });

    // Draw Twin A (Cyan)
    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 12;
    ctx.fillRect(twinA.x - 12, twinA.y - 12, 24, 24);

    // Draw Twin B (Magenta)
    ctx.fillStyle = '#FF2E9A';
    ctx.shadowColor = '#FF2E9A';
    ctx.fillRect(twinB.x - 12, twinB.y - 12, 24, 24);
    ctx.shadowBlur = 0;

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`CHAMBER ${currentLevel} / ${maxLevels}`, 35, 40);

    ctx.fillStyle = '#00F0FF';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 240, 40);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('WASD / Arrows to move • Both twins must reach their portal doors simultaneously!', 35, 62);

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
