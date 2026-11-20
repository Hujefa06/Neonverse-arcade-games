import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

export function mountBeatSerpent(
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

  // Grid setup: 30 x 17 cells (32px each)
  const CELL_SIZE = 30;
  const GRID_W = 28;
  const GRID_H = 16;
  const OFFSET_X = 60;
  const OFFSET_Y = 30;

  let snake: { x: number; y: number }[] = [
    { x: 10, y: 8 },
    { x: 9, y: 8 },
    { x: 8, y: 8 },
  ];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };

  let currentLevel = 1;
  const maxLevels = 8;
  let score = 0;
  let bpm = 120; // 120 to 160 BPM across tracks
  let beatInterval = 60 / bpm;
  let beatTimer = 0;
  let pulseRadius = 0;

  // Active rhythm note food
  let food = { x: 18, y: 8, onBeat: true, notePitch: 440 };

  const spawnFood = () => {
    food = {
      x: Math.floor(Math.random() * GRID_W),
      y: Math.floor(Math.random() * GRID_H),
      onBeat: true,
      notePitch: 300 + Math.random() * 400,
    };
  };

  const turnClockwise = () => {
    if (dir.x === 1 && dir.y === 0) nextDir = { x: 0, y: 1 };
    else if (dir.x === 0 && dir.y === 1) nextDir = { x: -1, y: 0 };
    else if (dir.x === -1 && dir.y === 0) nextDir = { x: 0, y: -1 };
    else if (dir.x === 0 && dir.y === -1) nextDir = { x: 1, y: 0 };
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'w') {
      if (dir.y !== 1) nextDir = { x: 0, y: -1 };
    } else if (e.key === 'ArrowDown' || e.key === 's') {
      if (dir.y !== -1) nextDir = { x: 0, y: 1 };
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
      if (dir.x !== 1) nextDir = { x: -1, y: 0 };
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      if (dir.x !== -1) nextDir = { x: 1, y: 0 };
    } else if (e.code === 'Space') {
      turnClockwise(); // One-button 90° clockwise turn
    }
  };

  // Mobile Swipe & Tap
  let touchStartX = 0;
  let touchStartY = 0;
  const onTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      turnClockwise(); // Tap = 90 turn
    } else if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && dir.x !== -1) nextDir = { x: 1, y: 0 };
      if (dx < 0 && dir.x !== 1) nextDir = { x: -1, y: 0 };
    } else {
      if (dy > 0 && dir.y !== -1) nextDir = { x: 0, y: 1 };
      if (dy < 0 && dir.y !== 1) nextDir = { x: 0, y: -1 };
    }
  };

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('touchstart', onTouchStart);
  canvas.addEventListener('touchend', onTouchEnd);

  audioManager.startMusic('battle');

  let animId: number;
  let lastTime = performance.now();
  let stepTimer = 0;
  const stepRate = 0.12;

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // BPM Beat Tick Pulse
    beatTimer += dt;
    if (beatTimer >= beatInterval) {
      beatTimer = 0;
      pulseRadius = 35;
      audioManager.playKeystrokeTick();
    }
    if (pulseRadius > 0) pulseRadius = Math.max(0, pulseRadius - dt * 80);

    // Snake Step update
    stepTimer += dt;
    if (stepTimer >= stepRate) {
      stepTimer = 0;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= GRID_W || head.y < 0 || head.y >= GRID_H) {
        audioManager.playPunchPOW();
        saveManager.save('beat-serpent', { highestTrack: currentLevel, highScore: score });
        api.triggerGameOver(score, currentLevel);
        return;
      }

      // Self collision
      for (const seg of snake) {
        if (seg.x === head.x && seg.y === head.y) {
          audioManager.playPunchPOW();
          api.triggerGameOver(score, currentLevel);
          return;
        }
      }

      snake.unshift(head);

      // Check food consumption
      if (head.x === food.x && head.y === food.y) {
        // Did player eat on the beat pulse?
        const isOnBeat = beatTimer < 0.15 || beatTimer > beatInterval - 0.15;
        const pts = isOnBeat ? 400 : 200;
        score += pts * currentLevel;

        audioManager.playSlashSpecial();
        if (isOnBeat) {
          fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');
          fxKit.triggerScreenShake(container, 4, 150);
        }

        spawnFood();

        // Level clear every 10 notes
        if (snake.length >= 10 + currentLevel * 3) {
          if (currentLevel >= maxLevels) {
            api.triggerVictory(score, currentLevel);
            return;
          } else {
            currentLevel++;
            bpm += 8;
            beatInterval = 60 / bpm;
            audioManager.playLevelUpChime();
          }
        }
      } else {
        snake.pop();
      }
    }

    // --- DRAWING ---
    ctx.fillStyle = '#07080F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Audio Visualizer Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_W; x++) {
      ctx.beginPath();
      ctx.moveTo(OFFSET_X + x * CELL_SIZE, OFFSET_Y);
      ctx.lineTo(OFFSET_X + x * CELL_SIZE, OFFSET_Y + GRID_H * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_H; y++) {
      ctx.beginPath();
      ctx.moveTo(OFFSET_X, OFFSET_Y + y * CELL_SIZE);
      ctx.lineTo(OFFSET_X + GRID_W * CELL_SIZE, OFFSET_Y + y * CELL_SIZE);
      ctx.stroke();
    }

    // Arena Perimeter Glow
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 10;
    ctx.strokeRect(OFFSET_X, OFFSET_Y, GRID_W * CELL_SIZE, GRID_H * CELL_SIZE);
    ctx.shadowBlur = 0;

    // Draw Rhythm Food with expanding beat pulse
    const fx = OFFSET_X + food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = OFFSET_Y + food.y * CELL_SIZE + CELL_SIZE / 2;

    ctx.fillStyle = '#FF2E9A';
    ctx.shadowColor = '#FF2E9A';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(fx, fy, 8, 0, Math.PI * 2);
    ctx.fill();

    // Beat Pulse Ring
    if (pulseRadius > 0) {
      ctx.strokeStyle = 'rgba(255, 46, 154, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx, fy, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Draw Serpent
    snake.forEach((seg, idx) => {
      const sx = OFFSET_X + seg.x * CELL_SIZE + 2;
      const sy = OFFSET_Y + seg.y * CELL_SIZE + 2;
      ctx.fillStyle = idx === 0 ? '#B6FF3C' : '#00F0FF';
      ctx.shadowColor = idx === 0 ? '#B6FF3C' : '#00F0FF';
      ctx.shadowBlur = 8;
      ctx.fillRect(sx, sy, CELL_SIZE - 4, CELL_SIZE - 4);
    });
    ctx.shadowBlur = 0;

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`TRACK ${currentLevel} / ${maxLevels} [${bpm} BPM]`, 60, 20);

    ctx.fillStyle = '#00F0FF';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 300, 20);

    ctx.fillStyle = '#B6FF3C';
    ctx.fillText(`LENGTH: ${snake.length}`, 540, 20);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchend', onTouchEnd);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
