import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface ElementalHazard {
  x: number;
  width: number;
  type: 'ice_wall' | 'fire_gate' | 'water_lake' | 'wooden_gate';
}

export function mountEmberAndFrost(
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

  const FLOOR_Y = 420;

  // Player state
  let playerX = 160;
  let playerY = FLOOR_Y;
  let playerVy = 0;
  let currentForm: 'ember' | 'frost' = 'ember';

  let currentLevel = 1;
  const maxLevels = 30;
  let score = 0;
  let runDistance = 0;
  const levelDistance = 2400;

  let hazards: ElementalHazard[] = [];

  const spawnHazardBatch = (startX: number) => {
    let currX = startX;
    for (let i = 0; i < 6; i++) {
      currX += 340 + Math.random() * 150;
      const types: ElementalHazard['type'][] = ['ice_wall', 'fire_gate', 'water_lake', 'wooden_gate'];
      hazards.push({
        x: currX,
        width: 45,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
  };

  spawnHazardBatch(600);
  audioManager.startMusic('battle');

  const swapElement = () => {
    currentForm = currentForm === 'ember' ? 'frost' : 'ember';
    audioManager.playKeystrokeTick();
    fxKit.triggerLightningFlash(api.flashRef.current, currentForm === 'ember' ? '#FF5500' : '#00F0FF');
  };

  const jump = () => {
    if (playerY >= FLOOR_Y) {
      playerVy = -640;
      audioManager.playSlashSpecial();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') jump();
    if (e.key === 'f' || e.key === 'Shift') swapElement();
  };

  const onMouseDown = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    if (mx < canvas.width / 2) jump();
    else swapElement();
  };

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('mousedown', onMouseDown);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    const runSpeed = 380 + currentLevel * 10;
    runDistance += runSpeed * dt;
    score += Math.floor(runSpeed * dt * 0.4);

    // Check Level Progression
    if (runDistance >= levelDistance * currentLevel) {
      if (currentLevel >= maxLevels) {
        audioManager.playVictoryFanfare();
        api.triggerVictory(score, currentLevel);
        return;
      } else {
        currentLevel++;
        audioManager.playLevelUpChime();
      }
    }

    // Jump Physics
    playerVy += 1700 * dt;
    playerY += playerVy * dt;
    if (playerY >= FLOOR_Y) {
      playerY = FLOOR_Y;
      playerVy = 0;
    }

    // Update Hazards & Collision Check
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      h.x -= runSpeed * dt;

      // Check collision
      if (playerX + 20 > h.x && playerX - 20 < h.x + h.width && playerY >= FLOOR_Y - 30) {
        let isFatal = false;

        if (h.type === 'ice_wall' || h.type === 'wooden_gate') {
          // Ember melts/burns these safely; Frost perishes!
          if (currentForm !== 'ember') isFatal = true;
          else score += 100;
        } else if (h.type === 'fire_gate' || h.type === 'water_lake') {
          // Frost passes flames/freezes water safely; Ember perishes!
          if (currentForm !== 'frost') isFatal = true;
          else score += 100;
        }

        if (isFatal) {
          audioManager.playComboBoom();
          fxKit.triggerScreenShake(container, 14, 450);
          saveManager.save('ember-and-frost', { level: currentLevel, highScore: score });
          api.triggerGameOver(score, currentLevel);
          return;
        }
      }

      if (h.x < -100) hazards.splice(i, 1);
    }

    if (hazards.length < 5) {
      const lastX = hazards.length > 0 ? hazards[hazards.length - 1].x : canvas.width;
      spawnHazardBatch(lastX);
    }

    // --- DRAWING ---
    ctx.fillStyle = '#060812';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Floor Runway
    ctx.strokeStyle = currentForm === 'ember' ? '#FF5500' : '#00F0FF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(canvas.width, FLOOR_Y);
    ctx.stroke();

    // Draw Hazards
    hazards.forEach((h) => {
      if (h.type === 'ice_wall') {
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(h.x, FLOOR_Y - 60, h.width, 60);
        ctx.font = '22px sans-serif';
        ctx.fillText('🧊', h.x + 8, FLOOR_Y - 20);
      } else if (h.type === 'fire_gate') {
        ctx.fillStyle = '#FF5500';
        ctx.fillRect(h.x, FLOOR_Y - 70, h.width, 70);
        ctx.font = '22px sans-serif';
        ctx.fillText('🔥', h.x + 8, FLOOR_Y - 25);
      } else if (h.type === 'water_lake') {
        ctx.fillStyle = currentForm === 'frost' ? '#7DD3FC' : '#0284C7';
        ctx.fillRect(h.x, FLOOR_Y, h.width, 15);
        ctx.font = '20px sans-serif';
        ctx.fillText(currentForm === 'frost' ? '❄️' : '🌊', h.x + 10, FLOOR_Y - 5);
      } else if (h.type === 'wooden_gate') {
        ctx.fillStyle = '#78350F';
        ctx.fillRect(h.x, FLOOR_Y - 55, h.width, 55);
        ctx.font = '20px sans-serif';
        ctx.fillText('🪵', h.x + 10, FLOOR_Y - 15);
      }
    });

    // Draw Elemental Runner Character
    ctx.save();
    ctx.translate(playerX, playerY - 24);

    ctx.fillStyle = currentForm === 'ember' ? '#FF5500' : '#00F0FF';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentForm === 'ember' ? '🔥' : '❄️', 0, 7);
    ctx.restore();

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`ZONE ${currentLevel} / ${maxLevels}`, 35, 40);

    ctx.fillStyle = currentForm === 'ember' ? '#FF5500' : '#00F0FF';
    ctx.fillText(`FORM: ${currentForm.toUpperCase()} [F / SWAP]`, 200, 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 440, 40);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Space = Jump • F = Swap Form (Ember burns wood/ice; Frost freezes water/fire)', 35, 62);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('mousedown', onMouseDown);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
