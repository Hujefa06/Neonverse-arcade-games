import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface ScrapDebris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  isAttached: boolean;
  isLaunched: boolean;
}

interface HunterDrone {
  x: number;
  y: number;
  vy: number;
  hp: number;
}

export function mountMagnetSurfer(
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

  // Surfer state
  let surferX = 160;
  let surferY = 270;
  let surferVy = 0;
  let moveUp = false;
  let moveDown = false;
  let isAttracting = false;

  let score = 0;
  let distance = 0;
  let playerHp = 100;

  let debrisList: ScrapDebris[] = [];
  let drones: HunterDrone[] = [];
  let attachedCount = 0;

  audioManager.startMusic('battle');

  // Input listeners
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 'ArrowUp') moveUp = true;
    if (e.key === 's' || e.key === 'ArrowDown') moveDown = true;
    if (e.code === 'Space') {
      isAttracting = true;
      audioManager.playKeystrokeTick();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 'ArrowUp') moveUp = false;
    if (e.key === 's' || e.key === 'ArrowDown') moveDown = false;
    if (e.code === 'Space') {
      isAttracting = false;
      // RELEASE = REPEL SHRAPNEL BLAST
      repelScrapShrapnel();
    }
  };

  const repelScrapShrapnel = () => {
    let launched = 0;
    debrisList.forEach((d) => {
      if (d.isAttached) {
        d.isAttached = false;
        d.isLaunched = true;
        d.vx = 900 + Math.random() * 200;
        d.vy = (Math.random() - 0.5) * 150;
        launched++;
      }
    });
    if (launched > 0) {
      audioManager.playSlashSpecial();
      fxKit.triggerScreenShake(container, 8, 250);
      fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');
    }
    attachedCount = 0;
  };

  // Pointer / Touch support
  const onMouseDown = () => {
    isAttracting = true;
  };
  const onMouseUp = () => {
    if (isAttracting) {
      isAttracting = false;
      repelScrapShrapnel();
    }
  };
  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    surferY += (my - surferY) * 0.15;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mousemove', onMouseMove);

  let animId: number;
  let lastTime = performance.now();
  let spawnTimer = 0;

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    distance += 350 * dt;
    score += Math.floor(dt * 80);

    // Turn speed decreases as more debris attaches (risk/reward)
    const turnSpeed = Math.max(180, 480 - attachedCount * 25);
    if (moveUp) surferY = Math.max(50, surferY - turnSpeed * dt);
    if (moveDown) surferY = Math.min(canvas.height - 50, surferY + turnSpeed * dt);

    // Spawning Scrap Debris & Hunter Drones
    spawnTimer += dt;
    if (spawnTimer >= 0.8) {
      spawnTimer = 0;
      // Scrap debris
      debrisList.push({
        x: canvas.width + 40,
        y: 60 + Math.random() * (canvas.height - 120),
        vx: -240 - Math.random() * 60,
        vy: 0,
        size: 14 + Math.random() * 12,
        isAttached: false,
        isLaunched: false,
      });

      // Drones
      if (Math.random() < 0.6) {
        drones.push({
          x: canvas.width + 50,
          y: 80 + Math.random() * (canvas.height - 160),
          vy: (Math.random() - 0.5) * 80,
          hp: 2,
        });
      }
    }

    // Update Debris
    attachedCount = 0;
    for (let i = debrisList.length - 1; i >= 0; i--) {
      const d = debrisList[i];

      if (d.isAttached) {
        attachedCount++;
        // Stick near surfer board
        d.x = surferX + (attachedCount % 4) * 12;
        d.y = surferY + Math.sin(attachedCount * 1.5) * 20;
      } else if (d.isLaunched) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        // Check hit on drones
        drones.forEach((drone) => {
          if (Math.hypot(d.x - drone.x, d.y - drone.y) < 30) {
            drone.hp -= 2;
            d.x = 99999; // consume projectile
            score += 350;
            audioManager.playPunchPOW();
          }
        });
      } else {
        d.x += d.vx * dt;

        // If Attract active, pull debris towards surfer
        if (isAttracting) {
          const dx = surferX - d.x;
          const dy = surferY - d.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 340) {
            d.vx += (dx / dist) * 700 * dt;
            d.vy += (dy / dist) * 700 * dt;

            // Attach when close
            if (dist < 40 && attachedCount < 16) {
              d.isAttached = true;
              audioManager.playKeystrokeTick();
            }
          }
        }
      }

      // Despawn off screen
      if (d.x < -80 || d.x > canvas.width + 120) {
        debrisList.splice(i, 1);
      }
    }

    // Update Drones
    for (let i = drones.length - 1; i >= 0; i--) {
      const drone = drones[i];
      drone.x -= 160 * dt;
      drone.y += drone.vy * dt;
      if (drone.y < 60 || drone.y > canvas.height - 60) drone.vy *= -1;

      // Crash with Surfer
      if (Math.hypot(drone.x - surferX, drone.y - surferY) < 35 + attachedCount * 2) {
        if (attachedCount > 0) {
          // Scrap armor absorbs damage!
          attachedCount = Math.max(0, attachedCount - 3);
          drone.hp = 0;
          audioManager.playPunchPOW();
          fxKit.triggerScreenShake(container, 6, 200);
        } else {
          // Direct hull hit!
          playerHp -= 25;
          drone.hp = 0;
          audioManager.playComboBoom();
          fxKit.triggerScreenShake(container, 12, 400);

          if (playerHp <= 0) {
            saveManager.save('magnet-surfer', { highScore: score });
            api.triggerGameOver(score, 1);
            return;
          }
        }
      }

      if (drone.hp <= 0 || drone.x < -60) {
        drones.splice(i, 1);
      }
    }

    // --- DRAWING ---
    ctx.fillStyle = '#070914';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Junkyard Nebula dust
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, 'rgba(124, 77, 255, 0.08)');
    grad.addColorStop(1, 'rgba(0, 240, 255, 0.05)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Magnetic Field Arc if Attracting
    if (isAttracting) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(surferX, surferY, 260, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }

    // Draw Debris
    debrisList.forEach((d) => {
      ctx.fillStyle = d.isAttached ? '#B6FF3C' : '#94A3B8';
      ctx.shadowColor = d.isAttached ? '#B6FF3C' : '#00F0FF';
      ctx.shadowBlur = d.isAttached ? 10 : 0;
      ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
    });

    // Draw Drones
    drones.forEach((dr) => {
      ctx.fillStyle = '#FF2E9A';
      ctx.shadowColor = '#FF2E9A';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(dr.x, dr.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛸', dr.x, dr.y + 6);
    });

    // Draw Surfer & Hoverboard
    ctx.save();
    ctx.translate(surferX, surferY);
    // Board
    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 15;
    ctx.fillRect(-25, 12, 50 + attachedCount * 3, 8);
    // Rider
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 0;
    ctx.fillRect(-8, -16, 16, 28);
    ctx.restore();

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 35, 40);
    ctx.fillText(`ARMOR SCRAP: ${attachedCount}`, 220, 40);

    ctx.fillStyle = playerHp > 40 ? '#00F0FF' : '#FF2E9A';
    ctx.fillText(`HULL HP: ${playerHp}%`, 380, 40);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('HOLD SPACE / CLICK to Attract • RELEASE to Repel Shrapnel Cannon', 35, 62);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
