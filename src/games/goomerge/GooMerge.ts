import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface GooSpecies {
  tier: number;
  name: string;
  radius: number;
  color: string;
  eyeRadius: number;
  scoreVal: number;
}

const SPECIES: GooSpecies[] = [
  { tier: 1, name: 'Peep', radius: 18, color: '#00F0FF', eyeRadius: 3, scoreVal: 20 },
  { tier: 2, name: 'Blobby', radius: 26, color: '#B6FF3C', eyeRadius: 4, scoreVal: 50 },
  { tier: 3, name: 'Gloop', radius: 35, color: '#FFB800', eyeRadius: 5, scoreVal: 120 },
  { tier: 4, name: 'Wobbler', radius: 46, color: '#FF2E9A', eyeRadius: 6, scoreVal: 280 },
  { tier: 5, name: 'Chonker', radius: 58, color: '#7C4DFF', eyeRadius: 8, scoreVal: 650 },
  { tier: 6, name: 'MegaSlime', radius: 72, color: '#00E5FF', eyeRadius: 10, scoreVal: 1500 },
  { tier: 7, name: 'Cosmic Jelly', radius: 88, color: '#FF0055', eyeRadius: 12, scoreVal: 3500 },
  { tier: 8, name: 'Singing Titan', radius: 106, color: '#FFD700', eyeRadius: 14, scoreVal: 8000 },
];

interface ActiveBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  species: GooSpecies;
  squashX: number;
  squashY: number;
  isMerged?: boolean;
}

export function mountGooMerge(
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

  // Physics Pit Boundaries
  const PIT_LEFT = 280;
  const PIT_RIGHT = 680;
  const PIT_BOTTOM = 510;
  const OVERFLOW_Y = 130;

  let score = 0;
  let comboCount = 0;
  let overflowWarningTime = 0;
  let blobs: ActiveBlob[] = [];

  // Launcher state
  let launcherX = 480;
  let isAiming = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragCurrX = 0;
  let dragCurrY = 0;
  let currentSpecies = SPECIES[0];
  let nextSpecies = SPECIES[Math.floor(Math.random() * 2)];

  // Audio setup
  audioManager.startMusic('ambient');

  // Sling Blob
  const dropBlob = (vx: number, vy: number) => {
    blobs.push({
      x: launcherX,
      y: 90,
      vx,
      vy,
      species: currentSpecies,
      squashX: 1.0,
      squashY: 1.0,
    });
    audioManager.playKeystrokeTick();
    currentSpecies = nextSpecies;
    nextSpecies = SPECIES[Math.floor(Math.random() * 3)];
  };

  // Pointer / Touch Handlers for Slingshot Aiming
  const onMouseDown = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (mx >= PIT_LEFT && mx <= PIT_RIGHT) {
      launcherX = mx;
    }
    isAiming = true;
    dragStartX = mx;
    dragStartY = my;
    dragCurrX = mx;
    dragCurrY = my;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isAiming) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    dragCurrX = mx;
    dragCurrY = my;
    if (mx >= PIT_LEFT && mx <= PIT_RIGHT) {
      launcherX = mx;
    }
  };

  const onMouseUp = () => {
    if (!isAiming) return;
    isAiming = false;
    const dx = (dragStartX - dragCurrX) * 2.5;
    const dy = Math.max(100, (dragStartY - dragCurrY) * 2.5);
    dropBlob(dx, dy);
  };

  // Mobile Touch equivalents
  const onTouchStart = (e: TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const my = (touch.clientY - rect.top) * (canvas.height / rect.height);
    if (mx >= PIT_LEFT && mx <= PIT_RIGHT) launcherX = mx;
    isAiming = true;
    dragStartX = mx;
    dragStartY = my;
    dragCurrX = mx;
    dragCurrY = my;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!isAiming) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const my = (touch.clientY - rect.top) * (canvas.height / rect.height);
    dragCurrX = mx;
    dragCurrY = my;
    if (mx >= PIT_LEFT && mx <= PIT_RIGHT) launcherX = mx;
  };

  const onTouchEnd = () => {
    onMouseUp();
  };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('touchstart', onTouchStart);
  canvas.addEventListener('touchmove', onTouchMove);
  canvas.addEventListener('touchend', onTouchEnd);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.033, (time - lastTime) / 1000);
    lastTime = time;

    // Physics Simulation (Sub-stepping for stability)
    const substeps = 4;
    const subDt = dt / substeps;
    const gravity = 1200;

    for (let step = 0; step < substeps; step++) {
      // 1. Position and Wall Collisions
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        b.vy += gravity * subDt;
        b.x += b.vx * subDt;
        b.y += b.vy * subDt;

        // Pit floor
        if (b.y + b.species.radius > PIT_BOTTOM) {
          b.y = PIT_BOTTOM - b.species.radius;
          b.vy *= -0.25; // dampening
          b.vx *= 0.85;
          b.squashY = 0.8;
          b.squashX = 1.2;
        }

        // Left wall
        if (b.x - b.species.radius < PIT_LEFT) {
          b.x = PIT_LEFT + b.species.radius;
          b.vx *= -0.3;
        }

        // Right wall
        if (b.x + b.species.radius > PIT_RIGHT) {
          b.x = PIT_RIGHT - b.species.radius;
          b.vx *= -0.3;
        }
      }

      // 2. Blob-to-Blob Circle Collisions & Merges
      for (let i = 0; i < blobs.length; i++) {
        for (let j = i + 1; j < blobs.length; j++) {
          const b1 = blobs[i];
          const b2 = blobs[j];
          if (b1.isMerged || b2.isMerged) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = b1.species.radius + b2.species.radius;

          if (dist < minDist) {
            // Check for identical species merge!
            if (b1.species.tier === b2.species.tier && b1.species.tier < SPECIES.length) {
              b1.isMerged = true;
              b2.isMerged = true;

              // Spawn next tier at collision midpoint
              const nextTier = b1.species.tier + 1;
              const nextSpec = SPECIES.find((s) => s.tier === nextTier) || b1.species;

              blobs.push({
                x: (b1.x + b2.x) / 2,
                y: (b1.y + b2.y) / 2,
                vx: 0,
                vy: -80, // gentle pop upward
                species: nextSpec,
                squashX: 1.4,
                squashY: 0.7,
              });

              comboCount++;
              score += nextSpec.scoreVal * comboCount;

              audioManager.playLevelUpChime();
              fxKit.triggerScreenShake(container, 4, 150);
              break;
            }

            // Normal elastic collision response
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            const overlap = minDist - dist;

            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;

            b1.vx -= p * 0.5 * nx;
            b1.vy -= p * 0.5 * ny;
            b2.vx += p * 0.5 * nx;
            b2.vy += p * 0.5 * ny;
          }
        }
      }
    }

    // Filter out merged blobs
    blobs = blobs.filter((b) => !b.isMerged);

    // Ease squash-and-stretch back to round (1.0)
    for (const b of blobs) {
      b.squashX += (1.0 - b.squashX) * dt * 8;
      b.squashY += (1.0 - b.squashY) * dt * 8;
    }

    // Overflow check
    let anyOverflowing = false;
    for (const b of blobs) {
      if (b.y - b.species.radius < OVERFLOW_Y && Math.abs(b.vy) < 20) {
        anyOverflowing = true;
        break;
      }
    }

    if (anyOverflowing) {
      overflowWarningTime += dt;
      if (overflowWarningTime > 3.0) {
        audioManager.playPunchPOW();
        saveManager.save('goo-merge', { highScore: score });
        api.triggerGameOver(score, 1);
        return;
      }
    } else {
      overflowWarningTime = Math.max(0, overflowWarningTime - dt * 2);
    }

    // --- DRAWING ---
    ctx.fillStyle = '#07080F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Pit Container
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00F0FF';

    ctx.beginPath();
    // Left Wall
    ctx.moveTo(PIT_LEFT, OVERFLOW_Y);
    ctx.lineTo(PIT_LEFT, PIT_BOTTOM);
    // Floor
    ctx.lineTo(PIT_RIGHT, PIT_BOTTOM);
    // Right Wall
    ctx.lineTo(PIT_RIGHT, OVERFLOW_Y);
    ctx.stroke();

    // Red Overflow Line
    ctx.strokeStyle = overflowWarningTime > 0 ? '#FF2E9A' : 'rgba(255, 46, 154, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(PIT_LEFT, OVERFLOW_Y);
    ctx.lineTo(PIT_RIGHT, OVERFLOW_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Draw Next Drop Preview at Launcher
    ctx.save();
    ctx.translate(launcherX, 90);
    ctx.fillStyle = currentSpecies.color;
    ctx.beginPath();
    ctx.arc(0, 0, currentSpecies.radius, 0, Math.PI * 2);
    ctx.fill();

    // Launcher Aim Guide Line
    if (isAiming) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, PIT_BOTTOM - 90);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Draw Blobs
    for (const b of blobs) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(b.squashX, b.squashY);

      // Squishy blob body
      ctx.fillStyle = b.species.color;
      ctx.shadowColor = b.species.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, b.species.radius, 0, Math.PI * 2);
      ctx.fill();

      // Expressive Face (Eyes + Smile)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000000';
      const eyeOffset = b.species.radius * 0.35;
      // Left eye
      ctx.beginPath();
      ctx.arc(-eyeOffset, -eyeOffset * 0.3, b.species.eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.arc(eyeOffset, -eyeOffset * 0.3, b.species.eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Smiling mouth
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, eyeOffset * 0.2, eyeOffset * 0.6, 0.1, Math.PI - 0.1);
      ctx.stroke();

      ctx.restore();
    }

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 40, 50);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#B6FF3C';
    ctx.fillText(`NEXT: ${nextSpecies.name}`, 40, 75);

    if (overflowWarningTime > 0) {
      ctx.fillStyle = '#FF2E9A';
      ctx.font = 'bold 14px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ PIT OVERFLOW! [${(3.0 - overflowWarningTime).toFixed(1)}s]`, 480, OVERFLOW_Y - 15);
    }

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
