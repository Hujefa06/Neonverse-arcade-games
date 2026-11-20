import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'cracked' | 'orb';
  surface: 'floor' | 'ceiling';
  shattered?: boolean;
}

export function mountFlipRush(
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
  const CEILING_Y = 100;

  // Player state
  let playerX = 140;
  let playerY = FLOOR_Y - 32;
  let playerVy = 0;
  let gravity = 1800; // pixels / s^2
  let isUpsideDown = false;
  let isMidAir = false;
  let dashCharged = false;
  let isDashing = false;
  let dashTimer = 0;
  const dashDuration = 0.28;

  // Upgrades & Progression
  let currentLevel = 1;
  const maxLevels = 30;
  let score = 0;
  let orbsCollected = 0;
  let scrollSpeed = 380;
  let distanceRun = 0;
  const levelDistance = 2200;

  let obstacles: Obstacle[] = [];
  let nextSpawnX = 600;

  // Trail particles
  interface GhostTrail {
    x: number;
    y: number;
    alpha: number;
    isUpsideDown: boolean;
  }
  let trails: GhostTrail[] = [];

  const spawnObstacleBatch = (startX: number) => {
    let currX = startX;
    for (let i = 0; i < 8; i++) {
      currX += 280 + Math.random() * 200;
      const r = Math.random();
      if (r < 0.4) {
        // Floor or Ceiling Laser Spikes
        const surface: 'floor' | 'ceiling' = Math.random() > 0.5 ? 'floor' : 'ceiling';
        obstacles.push({
          x: currX,
          y: surface === 'floor' ? FLOOR_Y - 36 : CEILING_Y,
          width: 32,
          height: 36,
          type: 'spike',
          surface,
        });
      } else if (r < 0.7) {
        // Cracked Barrier (Spans center, must dash to break)
        obstacles.push({
          x: currX,
          y: CEILING_Y + 50,
          width: 38,
          height: FLOOR_Y - CEILING_Y - 100,
          type: 'cracked',
          surface: 'floor',
        });
      } else {
        // Quantum Orb
        const orbY = CEILING_Y + 40 + Math.random() * (FLOOR_Y - CEILING_Y - 80);
        obstacles.push({
          x: currX,
          y: orbY,
          width: 24,
          height: 24,
          type: 'orb',
          surface: 'floor',
        });
      }
    }
  };

  spawnObstacleBatch(800);

  // Trigger Gravity Flip
  const flipGravity = () => {
    isUpsideDown = !isUpsideDown;
    gravity = -gravity;
    audioManager.playUiClick();

    // If flipped while already in mid-air, charge kinetic dash!
    if (isMidAir) {
      dashCharged = true;
      fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');
      audioManager.playKeystrokeTick();
    }
  };

  // Trigger Kinetic Dash
  const triggerDash = () => {
    if (dashCharged && !isDashing) {
      isDashing = true;
      dashCharged = false;
      dashTimer = dashDuration;
      audioManager.playSlashSpecial();
      fxKit.triggerScreenShake(container, 6, 250);
    }
  };

  // Keyboard controls
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') {
      e.preventDefault();
      flipGravity();
    } else if (e.key === 'Shift' || e.key === 'f') {
      triggerDash();
    }
  };

  // Mobile / Pointer Click listener
  let touchStartX = 0;
  const onTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStartX;
    if (diffX > 50) {
      triggerDash(); // Swipe Right = Dash
    } else {
      flipGravity(); // Tap = Flip
    }
  };
  const onMouseDown = () => {
    flipGravity();
  };

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('touchstart', onTouchStart);
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('mousedown', onMouseDown);

  audioManager.startMusic('battle');

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // Scroll distance & speed
    const currentSpeed = isDashing ? scrollSpeed * 2.2 : scrollSpeed;
    const distanceStep = currentSpeed * dt;
    distanceRun += distanceStep;
    score += Math.floor(distanceStep * 0.5);

    // Check Level Progression
    if (distanceRun >= levelDistance * currentLevel) {
      if (currentLevel >= maxLevels) {
        audioManager.playVictoryFanfare();
        api.triggerVictory(score, currentLevel);
        return;
      } else {
        currentLevel++;
        scrollSpeed += 25;
        audioManager.playLevelUpChime();
        fxKit.triggerLightningFlash(api.flashRef.current, '#B6FF3C');
      }
    }

    // Handle Dash Timer
    if (isDashing) {
      dashTimer -= dt;
      if (dashTimer <= 0) isDashing = false;
    }

    // Physics Update
    playerVy += gravity * dt;
    playerY += playerVy * dt;

    // Floor and Ceiling Collision
    if (!isUpsideDown) {
      if (playerY >= FLOOR_Y - 32) {
        playerY = FLOOR_Y - 32;
        playerVy = 0;
        isMidAir = false;
      } else {
        isMidAir = true;
      }
    } else {
      if (playerY <= CEILING_Y) {
        playerY = CEILING_Y;
        playerVy = 0;
        isMidAir = false;
      } else {
        isMidAir = true;
      }
    }

    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= currentSpeed * dt;

      // Check collision with player
      if (
        playerX + 28 > obs.x &&
        playerX < obs.x + obs.width &&
        playerY + 32 > obs.y &&
        playerY < obs.y + obs.height
      ) {
        if (obs.type === 'orb' && !obs.shattered) {
          obs.shattered = true;
          orbsCollected++;
          score += 250;
          audioManager.playPunchPOW();
          fxKit.triggerLightningFlash(api.flashRef.current, '#B6FF3C');
        } else if (obs.type === 'cracked') {
          if (isDashing && !obs.shattered) {
            // Smash cracked barrier with kinetic dash!
            obs.shattered = true;
            score += 500;
            audioManager.playPunchPOW();
            fxKit.triggerScreenShake(container, 10, 300);
          } else if (!obs.shattered) {
            // Crashed without dashing
            audioManager.playPunchPOW();
            fxKit.triggerScreenShake(container, 12, 400);
            api.triggerGameOver(score, currentLevel);
            return;
          }
        } else if (obs.type === 'spike') {
          // Lethal spike crash!
          audioManager.playPunchPOW();
          fxKit.triggerScreenShake(container, 14, 450);
          api.triggerGameOver(score, currentLevel);
          return;
        }
      }

      // Despawn passed obstacles
      if (obs.x < -100) {
        obstacles.splice(i, 1);
      }
    }

    // Repopulate obstacles
    if (obstacles.length < 10) {
      const lastX = obstacles.length > 0 ? obstacles[obstacles.length - 1].x : canvas.width;
      spawnObstacleBatch(lastX);
    }

    // Ghost trails
    if (isDashing || Math.random() < 0.4) {
      trails.push({
        x: playerX,
        y: playerY,
        alpha: 0.6,
        isUpsideDown,
      });
    }

    // --- DRAWING ---
    ctx.fillStyle = '#07080F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Floor and Ceiling Neon Rails
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00F0FF';

    // Ceiling
    ctx.beginPath();
    ctx.moveTo(0, CEILING_Y);
    ctx.lineTo(canvas.width, CEILING_Y);
    ctx.stroke();

    // Floor
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(canvas.width, FLOOR_Y);
    ctx.stroke();

    // Grid lines passing
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridOffset = (distanceRun % 40);
    for (let x = -gridOffset; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, CEILING_Y);
      ctx.lineTo(x, FLOOR_Y);
      ctx.stroke();
    }

    // Draw Obstacles
    obstacles.forEach((obs) => {
      if (obs.shattered) return;
      if (obs.type === 'spike') {
        ctx.fillStyle = '#FF2E9A';
        ctx.shadowColor = '#FF2E9A';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        if (obs.surface === 'floor') {
          ctx.moveTo(obs.x, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        } else {
          ctx.moveTo(obs.x, obs.y);
          ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width, obs.y);
        }
        ctx.closePath();
        ctx.fill();
      } else if (obs.type === 'cracked') {
        ctx.fillStyle = 'rgba(255, 184, 0, 0.8)';
        ctx.strokeStyle = '#FFB800';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#FFB800';
        ctx.shadowBlur = 12;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        // Crack lines
        ctx.strokeStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(obs.x + 8, obs.y);
        ctx.lineTo(obs.x + 20, obs.y + obs.height / 2);
        ctx.lineTo(obs.x + 10, obs.y + obs.height);
        ctx.stroke();
      } else if (obs.type === 'orb') {
        ctx.fillStyle = '#B6FF3C';
        ctx.shadowColor = '#B6FF3C';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(obs.x + 12, obs.y + 12, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Ghost Trails
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.alpha -= dt * 2.5;
      if (t.alpha <= 0) {
        trails.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(0, 240, 255, ${t.alpha * 0.4})`;
      ctx.fillRect(t.x, t.y, 28, 32);
    }

    // Draw Player Neon Runner
    ctx.save();
    ctx.translate(playerX, playerY);
    if (isUpsideDown) {
      ctx.scale(1, -1);
      ctx.translate(0, -32);
    }

    ctx.fillStyle = isDashing ? '#FFFFFF' : '#00F0FF';
    ctx.shadowColor = isDashing ? '#00F0FF' : '#B6FF3C';
    ctx.shadowBlur = isDashing ? 20 : 12;
    ctx.fillRect(0, 0, 28, 32);

    // Eyes / Visor
    ctx.fillStyle = '#FF2E9A';
    ctx.fillRect(16, 8, 10, 6);

    ctx.restore();

    // Top HUD Bar
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`STAGE ${currentLevel} / ${maxLevels}`, 30, 40);

    ctx.fillStyle = '#00F0FF';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 30, 60);

    ctx.fillStyle = '#B6FF3C';
    ctx.fillText(`ORBS: ${orbsCollected}`, 30, 80);

    // Dash Ready Indicator
    if (dashCharged) {
      ctx.fillStyle = '#FF2E9A';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillText('⚡ AIR DASH PRIMED! [SHIFT / SWIPE]', canvas.width - 280, 40);
    }

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchend', onTouchEnd);
    canvas.removeEventListener('mousedown', onMouseDown);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
