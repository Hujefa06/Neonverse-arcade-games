import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface InkBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  team: 1 | 2; // 1 = Cyan (Player), 2 = Magenta (Rival)
}

export function mountSplatSquad(
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

  // High-performance offscreen turf floor canvas (replaces 1,300 per-frame fillRect calls with 1 drawImage)
  const turfCanvas = document.createElement('canvas');
  turfCanvas.width = canvas.width;
  turfCanvas.height = canvas.height;
  const turfCtx = turfCanvas.getContext('2d')!;
  turfCtx.fillStyle = '#07080F';
  turfCtx.fillRect(0, 0, turfCanvas.width, turfCanvas.height);

  // Turf Grid: 48 x 27 tiles (20px each)
  const TILE_SIZE = 20;
  const COLS = 48;
  const ROWS = 27;
  const totalTiles = COLS * ROWS;
  const turfGrid: Uint8Array = new Uint8Array(totalTiles); // 0 = none, 1 = Cyan, 2 = Magenta

  let cyanCount = 0;
  let magentaCount = 0;

  // Player state
  let playerX = 180;
  let playerY = 270;
  let moveKeys = { up: false, down: false, left: false, right: false };
  let mouseAimX = 480;
  let mouseAimY = 270;
  let isFiring = false;
  let inkBombCooldown = 0;

  // AI Rival state
  let botX = 780;
  let botY = 270;
  let botFireTimer = 0;

  let matchTime = 90.0;
  let projectiles: InkBlob[] = [];
  let score = 0;

  audioManager.startMusic('battle');

  // Input listeners
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 'ArrowUp') moveKeys.up = true;
    if (e.key === 's' || e.key === 'ArrowDown') moveKeys.down = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') moveKeys.left = true;
    if (e.key === 'd' || e.key === 'ArrowRight') moveKeys.right = true;
    if (e.key === 'f' || e.code === 'Space') deployInkBomb();
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 'ArrowUp') moveKeys.up = false;
    if (e.key === 's' || e.key === 'ArrowDown') moveKeys.down = false;
    if (e.key === 'a' || e.key === 'ArrowLeft') moveKeys.left = false;
    if (e.key === 'd' || e.key === 'ArrowRight') moveKeys.right = false;
  };

  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouseAimX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseAimY = (e.clientY - rect.top) * (canvas.height / rect.height);
  };

  const onMouseDown = () => {
    isFiring = true;
  };
  const onMouseUp = () => {
    isFiring = false;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      mouseAimX = (t.clientX - rect.left) * (canvas.width / rect.width);
      mouseAimY = (t.clientY - rect.top) * (canvas.height / rect.height);
      isFiring = true;
    }
  };
  const onTouchEnd = () => {
    isFiring = false;
  };

  const deployInkBomb = () => {
    if (inkBombCooldown <= 0) {
      inkBombCooldown = 12.0;
      audioManager.playComboBoom();
      fxKit.triggerScreenShake(container, 10, 350);
      fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');

      // Paint 360 circle
      splatRadius(playerX, playerY, 90, 1);
    }
  };

  const splatRadius = (cx: number, cy: number, radius: number, team: 1 | 2) => {
    // 1. Draw directly to offscreen floor canvas
    turfCtx.save();
    turfCtx.fillStyle = team === 1 ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 46, 154, 0.45)';
    turfCtx.beginPath();
    turfCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    turfCtx.fill();
    turfCtx.restore();

    // 2. Incremental grid update bounded to bounding box
    const minCol = Math.max(0, Math.floor((cx - radius) / TILE_SIZE));
    const maxCol = Math.min(COLS - 1, Math.floor((cx + radius) / TILE_SIZE));
    const minRow = Math.max(0, Math.floor((cy - radius) / TILE_SIZE));
    const maxRow = Math.min(ROWS - 1, Math.floor((cy + radius) / TILE_SIZE));
    const rSq = radius * radius;

    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const tx = c * TILE_SIZE + TILE_SIZE / 2;
        const ty = r * TILE_SIZE + TILE_SIZE / 2;
        if ((tx - cx) ** 2 + (ty - cy) ** 2 <= rSq) {
          const old = turfGrid[r * COLS + c];
          if (old !== team) {
            if (old === 1) cyanCount--;
            else if (old === 2) magentaCount--;

            turfGrid[r * COLS + c] = team;
            if (team === 1) cyanCount++;
            else if (team === 2) magentaCount++;
          }
        }
      }
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('touchmove', onTouchMove, { passive: true });
  canvas.addEventListener('touchstart', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd);

  let animId: number;
  let lastTime = performance.now();
  let fireInterval = 0;

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    matchTime -= dt;
    if (inkBombCooldown > 0) inkBombCooldown -= dt;

    // Determine current tile paint under player for speed boost/slow
    const playerTileCol = Math.max(0, Math.min(COLS - 1, Math.floor(playerX / TILE_SIZE)));
    const playerTileRow = Math.max(0, Math.min(ROWS - 1, Math.floor(playerY / TILE_SIZE)));
    const tileUnder = turfGrid[playerTileRow * COLS + playerTileCol] || 0;
    const speedMult = tileUnder === 1 ? 1.4 : tileUnder === 2 ? 0.6 : 1.0;

    const baseSpeed = 220 * speedMult;
    if (moveKeys.up) playerY = Math.max(20, playerY - baseSpeed * dt);
    if (moveKeys.down) playerY = Math.min(canvas.height - 20, playerY + baseSpeed * dt);
    if (moveKeys.left) playerX = Math.max(20, playerX - baseSpeed * dt);
    if (moveKeys.right) playerX = Math.min(canvas.width - 20, playerX + baseSpeed * dt);

    // Player Shooting
    fireInterval += dt;
    if (isFiring && fireInterval >= 0.12) {
      fireInterval = 0;
      const angle = Math.atan2(mouseAimY - playerY, mouseAimX - playerX);
      const spread = (Math.random() - 0.5) * 0.2;
      projectiles.push({
        x: playerX,
        y: playerY,
        vx: Math.cos(angle + spread) * 600,
        vy: Math.sin(angle + spread) * 600,
        team: 1,
      });
      audioManager.playKeystrokeTick();
    }

    // AI Bot Behavior
    const botAngle = Math.atan2(playerY - botY, playerX - botX);
    botX += Math.cos(botAngle) * 130 * dt;
    botY += Math.sin(botAngle) * 130 * dt;

    botFireTimer += dt;
    if (botFireTimer >= 0.25) {
      botFireTimer = 0;
      projectiles.push({
        x: botX,
        y: botY,
        vx: Math.cos(botAngle + (Math.random() - 0.5) * 0.4) * 500,
        vy: Math.sin(botAngle + (Math.random() - 0.5) * 0.4) * 500,
        team: 2,
      });
    }

    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Splat on floor
      if (Math.random() < 0.25 || p.x < 10 || p.x > canvas.width - 10 || p.y < 10 || p.y > canvas.height - 10) {
        splatRadius(p.x, p.y, 25, p.team);
        projectiles.splice(i, 1);
      }
    }

    // Turf Percentages computed in O(1)
    const cyanPct = Math.round((cyanCount / totalTiles) * 100);
    const magentaPct = Math.round((magentaCount / totalTiles) * 100);

    // Check Match Completion
    if (matchTime <= 0) {
      score = cyanPct * 200;
      if (cyanPct > magentaPct) {
        audioManager.playVictoryFanfare();
        api.triggerVictory(score, 1);
      } else {
        audioManager.playPunchPOW();
        api.triggerGameOver(score, 1);
      }
      return;
    }

    // --- DRAWING ---
    // 1. Draw cached offscreen turf floor (1 single blit!)
    ctx.drawImage(turfCanvas, 0, 0);

    // 2. Draw Projectiles
    projectiles.forEach((p) => {
      ctx.fillStyle = p.team === 1 ? '#00F0FF' : '#FF2E9A';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // 3. Draw Player
    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(playerX, playerY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Player Blaster Nozzle
    const aimAngle = Math.atan2(mouseAimY - playerY, mouseAimX - playerX);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(playerX, playerY);
    ctx.lineTo(playerX + Math.cos(aimAngle) * 22, playerY + Math.sin(aimAngle) * 22);
    ctx.stroke();

    // 4. Draw AI Bot
    ctx.fillStyle = '#FF2E9A';
    ctx.shadowColor = '#FF2E9A';
    ctx.beginPath();
    ctx.arc(botX, botY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 5. Top HUD Turf Bar
    ctx.fillStyle = '#000000';
    ctx.fillRect(canvas.width / 2 - 200, 15, 400, 24);
    ctx.fillStyle = '#00F0FF';
    ctx.fillRect(canvas.width / 2 - 200, 15, (cyanPct / 100) * 400, 24);
    ctx.fillStyle = '#FF2E9A';
    ctx.fillRect(canvas.width / 2 - 200 + (cyanPct / 100) * 400, 15, (magentaPct / 100) * 400, 24);
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeRect(canvas.width / 2 - 200, 15, 400, 24);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`CYAN: ${cyanPct}%  vs  RIVAL: ${magentaPct}%  [${Math.ceil(matchTime)}s]`, canvas.width / 2, 32);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchstart', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    turfCanvas.width = 0;
    turfCanvas.height = 0;
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
