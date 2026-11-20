import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface DreamEntity {
  x: number;
  y: number;
  type: 'shard' | 'clock' | 'jellyfish';
  radius: number;
}

export function mountDreamDiver(
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

  let diverX = 480;
  const diverY = 160;
  let isGliding = false;
  let moveLeft = false;
  let moveRight = false;

  let depthMeters = 0;
  let score = 0;
  let shardsCollected = 0;
  let dreamBurstCooldown = 0;

  let entities: DreamEntity[] = [];

  audioManager.startMusic('ambient');

  const triggerDreamBurst = () => {
    if (dreamBurstCooldown <= 0) {
      dreamBurstCooldown = 15;
      audioManager.playComboBoom();
      fxKit.triggerScreenShake(container, 8, 300);
      fxKit.triggerLightningFlash(api.flashRef.current, '#7C4DFF');

      // Vaporize nearby alarm clocks
      entities = entities.filter((e) => {
        if (e.type === 'clock' && Math.hypot(e.x - diverX, e.y - diverY) < 220) {
          score += 250;
          return false;
        }
        return true;
      });
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') moveLeft = true;
    if (e.key === 'd' || e.key === 'ArrowRight') moveRight = true;
    if (e.code === 'Space') isGliding = true;
    if (e.key === 'f') triggerDreamBurst();
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') moveLeft = false;
    if (e.key === 'd' || e.key === 'ArrowRight') moveRight = false;
    if (e.code === 'Space') isGliding = false;
  };

  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    diverX += (mx - diverX) * 0.12;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);

  let animId: number;
  let lastTime = performance.now();
  let spawnTimer = 0;

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // Fall Speed (slower if gliding)
    const fallSpeed = isGliding ? 140 : 280;
    depthMeters += Math.round(fallSpeed * dt * 0.2);
    score += Math.round(dt * 40);

    if (dreamBurstCooldown > 0) dreamBurstCooldown -= dt;

    // Horizontal steering
    const steerSpeed = 340;
    if (moveLeft) diverX = Math.max(50, diverX - steerSpeed * dt);
    if (moveRight) diverX = Math.min(canvas.width - 50, diverX + steerSpeed * dt);

    // Spawn hazards & shards
    spawnTimer += dt;
    if (spawnTimer >= 0.6) {
      spawnTimer = 0;
      const isHazard = Math.random() < 0.45;
      entities.push({
        x: 60 + Math.random() * (canvas.width - 120),
        y: canvas.height + 40,
        type: isHazard ? 'clock' : 'shard',
        radius: isHazard ? 20 : 12,
      });
    }

    // Update Entities
    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      e.y -= fallSpeed * dt;

      // Check Diver Collision
      const dist = Math.hypot(e.x - diverX, e.y - diverY);
      if (dist < e.radius + 18) {
        if (e.type === 'shard') {
          // Collect dream shard
          shardsCollected++;
          score += 200;
          audioManager.playKeystrokeTick();
          entities.splice(i, 1);
        } else if (e.type === 'clock') {
          // HIT ALARM CLOCK -> DREAM ENDED!
          audioManager.playPunchPOW();
          fxKit.triggerScreenShake(container, 14, 500);
          saveManager.save('dream-diver', { depth: depthMeters, highScore: score });
          api.triggerGameOver(score, Math.floor(depthMeters / 1000) + 1);
          return;
        }
        continue;
      }

      if (e.y < -50) entities.splice(i, 1);
    }

    // Determine Dream Layer Style
    let layerColor = '#060814';
    let layerName = 'CLOUD KINGDOM';
    if (depthMeters > 3000) {
      layerColor = '#1A0B2E';
      layerName = 'ORIGAMI HORIZON';
    } else if (depthMeters > 1500) {
      layerColor = '#0A192F';
      layerName = 'SUNKEN SKY';
    }

    // --- DRAWING ---
    ctx.fillStyle = layerColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Floating dream particles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 30; i++) {
      const px = (i * 47) % canvas.width;
      const py = ((i * 73 - depthMeters * 3) % canvas.height + canvas.height) % canvas.height;
      ctx.fillRect(px, py, 2, 2);
    }

    // Draw Entities
    entities.forEach((e) => {
      if (e.type === 'shard') {
        ctx.fillStyle = '#00F0FF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⏰', e.x, e.y + 8);
      }
    });

    // Draw Dream Diver
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#7C4DFF';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(diverX, diverY, 16, 0, Math.PI * 2);
    ctx.fill();

    // Glider Wings if Gliding
    if (isGliding) {
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(diverX - 35, diverY - 8);
      ctx.lineTo(diverX, diverY + 12);
      ctx.lineTo(diverX + 35, diverY - 8);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`DEPTH: ${depthMeters}M [${layerName}]`, 35, 40);
    ctx.fillText(`SHARDS: ${shardsCollected}`, 360, 40);
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 500, 40);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#CBD5E1';
    ctx.fillText('A/D steer • Space to Glide • F for Dream Burst shockwave', 35, 62);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
