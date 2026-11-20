import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface CircuitTile {
  col: number;
  row: number;
  rotation: number; // 0, 90, 180, 270 deg
  type: 'straight' | 'corner' | 'cross' | 'start' | 'end';
}

export function mountCircuitSprint(
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

  const COLS = 8;
  const ROWS = 5;
  const TILE_SIZE = 70;
  const ORIGIN_X = 200;
  const ORIGIN_Y = 95;

  let currentLevel = 1;
  const maxLevels = 35;
  let score = 0;
  let slowDownsLeft = 3;
  let isSlowed = false;

  // Spark state
  let sparkX = ORIGIN_X + TILE_SIZE / 2;
  let sparkY = ORIGIN_Y + TILE_SIZE / 2;
  let sparkDir = { x: 1, y: 0 };
  let sparkSpeed = 90;

  // Grid tiles
  let tiles: CircuitTile[] = [];
  const initBoard = () => {
    tiles = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        let type: CircuitTile['type'] = 'straight';
        if (c === 0 && r === 0) type = 'start';
        else if (c === COLS - 1 && r === ROWS - 1) type = 'end';
        else {
          type = Math.random() < 0.5 ? 'corner' : 'straight';
        }
        tiles.push({
          col: c,
          row: r,
          rotation: Math.floor(Math.random() * 4) * 90,
          type,
        });
      }
    }
    sparkX = ORIGIN_X + TILE_SIZE / 2;
    sparkY = ORIGIN_Y + TILE_SIZE / 2;
    sparkDir = { x: 1, y: 0 };
  };

  initBoard();
  audioManager.startMusic('battle');

  // Rotate tile on click
  const rotateTileAt = (x: number, y: number) => {
    const col = Math.floor((x - ORIGIN_X) / TILE_SIZE);
    const row = Math.floor((y - ORIGIN_Y) / TILE_SIZE);
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      const tile = tiles.find((t) => t.col === col && t.row === row);
      if (tile && tile.type !== 'start' && tile.type !== 'end') {
        tile.rotation = (tile.rotation + 90) % 360;
        audioManager.playKeystrokeTick();
      }
    }
  };

  const useSlowdown = () => {
    if (slowDownsLeft > 0 && !isSlowed) {
      slowDownsLeft--;
      isSlowed = true;
      audioManager.playLevelUpChime();
      setTimeout(() => (isSlowed = false), 2500);
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    rotateTileAt(mx, my);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') useSlowdown();
    if (e.key === 'r') initBoard();
  };

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('keydown', onKeyDown);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // Move rolling spark
    const spd = isSlowed ? sparkSpeed * 0.35 : sparkSpeed;
    sparkX += sparkDir.x * spd * dt;
    sparkY += sparkDir.y * spd * dt;

    // Check Tile Boundary & Routing
    const curCol = Math.floor((sparkX - ORIGIN_X) / TILE_SIZE);
    const curRow = Math.floor((sparkY - ORIGIN_Y) / TILE_SIZE);

    // Terminal reached!
    if (curCol === COLS - 1 && curRow === ROWS - 1) {
      score += 2500;
      audioManager.playVictoryFanfare();
      saveManager.save('circuit-sprint', { level: currentLevel, highScore: score });

      if (currentLevel >= maxLevels) {
        api.triggerVictory(score, currentLevel);
        return;
      } else {
        currentLevel++;
        sparkSpeed += 12;
        slowDownsLeft = 3;
        initBoard();
      }
    }

    // Spark fizzle out of bounds
    if (curCol < 0 || curCol >= COLS || curRow < 0 || curRow >= ROWS) {
      audioManager.playComboBoom();
      fxKit.triggerScreenShake(container, 10, 300);
      initBoard();
    }

    // --- DRAWING ---
    ctx.fillStyle = '#060812';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Circuit Board Backdrop PCB lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw Tiles
    tiles.forEach((t) => {
      const tx = ORIGIN_X + t.col * TILE_SIZE;
      const ty = ORIGIN_Y + t.row * TILE_SIZE;

      ctx.fillStyle = '#0B1120';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
      ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

      // Draw Conductive Path Wire
      ctx.save();
      ctx.translate(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2);
      ctx.rotate((t.rotation * Math.PI) / 180);

      ctx.strokeStyle = t.type === 'start' ? '#B6FF3C' : t.type === 'end' ? '#FF2E9A' : '#00F0FF';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      ctx.beginPath();
      if (t.type === 'straight' || t.type === 'start' || t.type === 'end') {
        ctx.moveTo(-TILE_SIZE / 2, 0);
        ctx.lineTo(TILE_SIZE / 2, 0);
      } else if (t.type === 'corner') {
        ctx.moveTo(-TILE_SIZE / 2, 0);
        ctx.lineTo(0, 0);
        ctx.lineTo(0, TILE_SIZE / 2);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Draw Rolling Electric Spark
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`CHIP LEVEL: ${currentLevel} / ${maxLevels}`, 35, 40);
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 240, 40);
    ctx.fillText(`SLOWDOWNS: ${slowDownsLeft} [SPACE]`, 420, 40);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Click circuit tile to rotate 90° • Route the rolling spark home', 35, 62);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('keydown', onKeyDown);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
