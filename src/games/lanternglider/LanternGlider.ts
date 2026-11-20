import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface ForestLantern {
  x: number;
  y: number;
  isLit: boolean;
}

interface ForestOwl {
  x: number;
  y: number;
  isAwake: boolean;
}

export function mountLanternGlider(
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

  let currentLevel = 1;
  const maxLevels = 20;
  let score = 0;
  let glowHealth = 100;

  // Firefly Glider state
  let flyX = 140;
  let flyY = 270;
  let targetX = flyX;
  let targetY = flyY;

  // Lanterns for Level
  let lanterns: ForestLantern[] = [
    { x: 320, y: 180, isLit: false },
    { x: 500, y: 340, isLit: false },
    { x: 680, y: 220, isLit: false },
    { x: 840, y: 270, isLit: false },
  ];

  const owls: ForestOwl[] = [
    { x: 420, y: 140, isAwake: false },
    { x: 600, y: 400, isAwake: false },
  ];

  audioManager.startMusic('ambient');

  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    targetX = (e.clientX - rect.left) * (canvas.width / rect.width);
    targetY = (e.clientY - rect.top) * (canvas.height / rect.height);
  };

  const onTouchMove = (e: TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    targetX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    targetY = (touch.clientY - rect.top) * (canvas.height / rect.height);
  };

  const triggerGlowPulse = () => {
    if (glowHealth > 15) {
      glowHealth -= 10;
      audioManager.playLevelUpChime();
      fxKit.triggerLightningFlash(api.flashRef.current, '#FFB800');
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') triggerGlowPulse();
  };

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('touchmove', onTouchMove);
  window.addEventListener('keydown', onKeyDown);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // Firefly smooth gliding physics
    flyX += (targetX - flyX) * dt * 4;
    flyY += (targetY - flyY) * dt * 4;

    // Glow slowly burns down
    glowHealth -= dt * 2.5;
    if (glowHealth <= 0) {
      audioManager.playPunchPOW();
      saveManager.save('lantern-glider', { highestLevel: currentLevel, highScore: score });
      api.triggerGameOver(score, currentLevel);
      return;
    }

    // Check Lantern Ignitions
    let unlitCount = 0;
    lanterns.forEach((l) => {
      if (!l.isLit) {
        unlitCount++;
        if (Math.hypot(flyX - l.x, flyY - l.y) < 35) {
          l.isLit = true;
          glowHealth = Math.min(100, glowHealth + 35);
          score += 500;
          audioManager.playLevelUpChime();
        }
      }
    });

    // Check Owl Collisions
    owls.forEach((o) => {
      if (Math.hypot(flyX - o.x, flyY - o.y) < 32) {
        o.isAwake = true;
        glowHealth = Math.max(0, glowHealth - 20);
        audioManager.playPunchPOW();
        fxKit.triggerScreenShake(container, 6, 200);
      }
    });

    // Level Clear when all lanterns lit
    if (unlitCount === 0) {
      score += 1500;
      audioManager.playVictoryFanfare();
      if (currentLevel >= maxLevels) {
        api.triggerVictory(score, currentLevel);
        return;
      } else {
        currentLevel++;
        glowHealth = 100;
        lanterns.forEach((l) => (l.isLit = false));
      }
    }

    // --- DRAWING ---
    // Nocturnal Shadowed Forest
    ctx.fillStyle = '#05070C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tree Branch Silhouettes
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(350, 0);
    ctx.lineTo(440, 160);
    ctx.lineTo(580, 140);
    ctx.moveTo(560, 540);
    ctx.lineTo(620, 380);
    ctx.lineTo(760, 420);
    ctx.stroke();

    // Draw Owls
    owls.forEach((o) => {
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(o.isAwake ? '🦉' : '💤', o.x, o.y);
    });

    // Draw Lanterns
    lanterns.forEach((l) => {
      ctx.fillStyle = l.isLit ? '#FFB800' : '#475569';
      ctx.shadowColor = l.isLit ? '#FFB800' : 'transparent';
      ctx.shadowBlur = l.isLit ? 25 : 0;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏮', l.x, l.y + 7);
    });

    // Draw Firefly Glider with Radiance Halo
    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = (glowHealth / 100) * 35;
    ctx.beginPath();
    ctx.arc(flyX, flyY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`GROVE ${currentLevel} / ${maxLevels}`, 35, 40);
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 200, 40);

    // Glow Bar
    ctx.textAlign = 'right';
    ctx.fillStyle = glowHealth > 30 ? '#00F0FF' : '#FF2E9A';
    ctx.fillText(`GLOW ENERGY: ${Math.round(glowHealth)}%`, canvas.width - 35, 40);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('keydown', onKeyDown);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
