import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface OddMoon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isOrbiting: boolean;
  emoji: string;
}

export function mountOrbitOddballs(
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

  const PLANET_X = 480;
  const PLANET_Y = 270;
  const PLANET_MASS = 60000;
  const PLANET_RADIUS = 52;

  let currentLevel = 1;
  const maxLevels = 28;
  const requiredMoons = 2 + Math.floor(currentLevel * 0.3);

  let orbitingMoons: OddMoon[] = [];
  let stableTimer = 0;
  let isSimPaused = false;
  let score = 0;

  // Slingshot Aim
  let isAiming = false;
  let slingStartX = 180;
  let slingStartY = 420;
  let slingCurrX = 180;
  let slingCurrY = 420;

  audioManager.startMusic('ambient');

  const flingMoon = (vx: number, vy: number) => {
    orbitingMoons.push({
      x: slingStartX,
      y: slingStartY,
      vx,
      vy,
      isOrbiting: false,
      emoji: '🌝',
    });
    audioManager.playKeystrokeTick();
  };

  const onMouseDown = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    isAiming = true;
    slingStartX = mx;
    slingStartY = my;
    slingCurrX = mx;
    slingCurrY = my;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isAiming) return;
    const rect = canvas.getBoundingClientRect();
    slingCurrX = (e.clientX - rect.left) * (canvas.width / rect.width);
    slingCurrY = (e.clientY - rect.top) * (canvas.height / rect.height);
  };

  const onMouseUp = () => {
    if (!isAiming) return;
    isAiming = false;
    const dx = slingStartX - slingCurrX;
    const dy = slingStartY - slingCurrY;
    flingMoon(dx * 2.8, dy * 2.8);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') isSimPaused = !isSimPaused;
    if (e.key === 'r') {
      orbitingMoons = [];
      stableTimer = 0;
    }
  };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('keydown', onKeyDown);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.04, (time - lastTime) / 1000);
    lastTime = time;

    if (!isSimPaused) {
      // Simulate Gravity Orbits
      for (let i = orbitingMoons.length - 1; i >= 0; i--) {
        const m = orbitingMoons[i];
        const dx = PLANET_X - m.x;
        const dy = PLANET_Y - m.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > 10) {
          const force = PLANET_MASS / distSq;
          m.vx += (dx / dist) * force * dt;
          m.vy += (dy / dist) * force * dt;
        }

        m.x += m.vx * dt;
        m.y += m.vy * dt;

        // Collision with Host Planet
        if (dist < PLANET_RADIUS + 10) {
          orbitingMoons.splice(i, 1);
          audioManager.playPunchPOW();
          fxKit.triggerScreenShake(container, 8, 250);
          stableTimer = 0;
          continue;
        }

        // Out of bounds
        if (dist > 700) {
          orbitingMoons.splice(i, 1);
          stableTimer = 0;
        }
      }

      // Check Stability (if all required moons orbiting)
      if (orbitingMoons.length >= requiredMoons) {
        stableTimer += dt;
        if (stableTimer >= 10.0) {
          // LEVEL CLEARED!
          score += 3000;
          audioManager.playVictoryFanfare();
          saveManager.save('orbit-oddballs', { level: currentLevel, highScore: score });

          if (currentLevel >= maxLevels) {
            api.triggerVictory(score, currentLevel);
            return;
          } else {
            currentLevel++;
            orbitingMoons = [];
            stableTimer = 0;
          }
        }
      } else {
        stableTimer = 0;
      }
    }

    // --- DRAWING ---
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Orbit Guide Rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(PLANET_X, PLANET_Y, 160, 0, Math.PI * 2);
    ctx.arc(PLANET_X, PLANET_Y, 230, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Goofy Planet
    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(PLANET_X, PLANET_Y, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Goofy Face
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪐', PLANET_X, PLANET_Y + 16);

    // Draw Moons
    orbitingMoons.forEach((m) => {
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.emoji, m.x, m.y + 8);
    });

    // Draw Slingshot Band if Aiming
    if (isAiming) {
      ctx.strokeStyle = '#FF2E9A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(slingStartX, slingStartY);
      ctx.lineTo(slingCurrX, slingCurrY);
      ctx.stroke();
    }

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`ORBIT SECTOR ${currentLevel} / ${maxLevels}`, 35, 40);
    ctx.fillText(`MOONS: ${orbitingMoons.length} / ${requiredMoons} REQUIRED`, 240, 40);

    if (stableTimer > 0) {
      ctx.fillStyle = '#B6FF3C';
      ctx.fillText(`STABILITY: ${stableTimer.toFixed(1)}s / 10.0s`, 520, 40);
    }

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('keydown', onKeyDown);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
