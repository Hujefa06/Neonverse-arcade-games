import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface CloudSheep {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  inPen: boolean;
  bleatTimer: number;
}

interface StormCloud {
  x: number;
  y: number;
  radius: number;
}

export function mountCloudShepherd(
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
  const maxLevels = 25;
  let score = 0;
  let gustsUsed = 0;

  // Sky Pen Corral
  const pen = { x: 740, y: 160, width: 170, height: 220 };

  // Gust Drawing State
  let isDrawingGust = false;
  let gustStartX = 0;
  let gustStartY = 0;
  let gustEndX = 0;
  let gustEndY = 0;

  // Wind Particle Streaks
  interface WindParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
  }
  let windParticles: WindParticle[] = [];

  // Setup Level Sheep & Storms
  const sheepCount = 3 + Math.floor(currentLevel * 0.5);
  let sheep: CloudSheep[] = Array.from({ length: sheepCount }, () => ({
    x: 140 + Math.random() * 260,
    y: 120 + Math.random() * 300,
    vx: (Math.random() - 0.5) * 15,
    vy: (Math.random() - 0.5) * 15,
    radius: 22,
    inPen: false,
    bleatTimer: 0,
  }));

  const storms: StormCloud[] = [
    { x: 500, y: 220, radius: 45 },
    { x: 560, y: 380, radius: 40 },
  ];

  audioManager.startMusic('ambient');

  // Ring Gentle Bell
  const ringBell = () => {
    audioManager.playLevelUpChime();
    sheep.forEach((s) => {
      const dx = canvas.width / 2 - s.x;
      const dy = canvas.height / 2 - s.y;
      s.vx += dx * 0.15;
      s.vy += dy * 0.15;
    });
  };

  // Pointer / Touch Handlers
  const onMouseDown = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    isDrawingGust = true;
    gustStartX = (e.clientX - rect.left) * (canvas.width / rect.width);
    gustStartY = (e.clientY - rect.top) * (canvas.height / rect.height);
    gustEndX = gustStartX;
    gustEndY = gustStartY;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDrawingGust) return;
    const rect = canvas.getBoundingClientRect();
    gustEndX = (e.clientX - rect.left) * (canvas.width / rect.width);
    gustEndY = (e.clientY - rect.top) * (canvas.height / rect.height);
  };

  const onMouseUp = () => {
    if (!isDrawingGust) return;
    isDrawingGust = false;
    const dx = gustEndX - gustStartX;
    const dy = gustEndY - gustStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 30) {
      gustsUsed++;
      audioManager.playSlashSpecial();

      // Spawn wind particles
      for (let i = 0; i < 25; i++) {
        const offset = (Math.random() - 0.5) * 40;
        windParticles.push({
          x: gustStartX + (dy / dist) * offset,
          y: gustStartY - (dx / dist) * offset,
          vx: (dx / dist) * (dist * 2.5),
          vy: (dy / dist) * (dist * 2.5),
          life: 0.8,
        });
      }

      // Propel nearby sheep
      sheep.forEach((s) => {
        const sDist = Math.hypot(s.x - gustStartX, s.y - gustStartY);
        if (sDist < dist + 80) {
          s.vx += (dx / dist) * 120;
          s.vy += (dy / dist) * 120;
        }
      });
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'e') ringBell();
  };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('keydown', onKeyDown);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // Update Wind Particles
    for (let i = windParticles.length - 1; i >= 0; i--) {
      const p = windParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1.5;
      if (p.life <= 0) windParticles.splice(i, 1);
    }

    // Update Sheep Physics & Corral check
    let allInPen = true;
    sheep.forEach((s) => {
      s.vx *= 0.98; // gentle air friction
      s.vy *= 0.98;
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Soft world bounce
      if (s.x < s.radius) { s.x = s.radius; s.vx *= -0.5; }
      if (s.x > canvas.width - s.radius) { s.x = canvas.width - s.radius; s.vx *= -0.5; }
      if (s.y < s.radius + 60) { s.y = s.radius + 60; s.vy *= -0.5; }
      if (s.y > canvas.height - s.radius) { s.y = canvas.height - s.radius; s.vy *= -0.5; }

      // Storm Cloud Bounce & Tiny Thunder Bleat
      storms.forEach((st) => {
        const dist = Math.hypot(s.x - st.x, s.y - st.y);
        if (dist < s.radius + st.radius) {
          const nx = (s.x - st.x) / dist;
          const ny = (s.y - st.y) / dist;
          s.vx = nx * 80;
          s.vy = ny * 80;
          audioManager.playKeystrokeTick();
        }
      });

      // Check if inside Sky Pen
      if (
        s.x >= pen.x &&
        s.x <= pen.x + pen.width &&
        s.y >= pen.y &&
        s.y <= pen.y + pen.height
      ) {
        s.inPen = true;
      } else {
        s.inPen = false;
        allInPen = false;
      }
    });

    // Level Clear check
    if (allInPen && sheep.length > 0) {
      score += Math.max(500, 2000 - gustsUsed * 250);
      audioManager.playVictoryFanfare();
      saveManager.save('cloud-shepherd', { highestLevel: currentLevel, highScore: score });

      if (currentLevel >= maxLevels) {
        api.triggerVictory(score, currentLevel);
        return;
      } else {
        currentLevel++;
        gustsUsed = 0;
        // Re-spawn sheep
        sheep = Array.from({ length: 3 + Math.floor(currentLevel * 0.5) }, () => ({
          x: 140 + Math.random() * 260,
          y: 120 + Math.random() * 300,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          radius: 22,
          inPen: false,
          bleatTimer: 0,
        }));
      }
    }

    // --- DRAWING ---
    // Twilight Pastel Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#0F172A');
    skyGrad.addColorStop(0.6, '#1E1B4B');
    skyGrad.addColorStop(1, '#2E1065');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Sky Pen Corral
    ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 12;
    ctx.strokeRect(pen.x, pen.y, pen.width, pen.height);
    ctx.fillRect(pen.x, pen.y, pen.width, pen.height);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 11px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌈 SKY PEN CORRAL', pen.x + pen.width / 2, pen.y + 24);

    // Draw Storm Clouds
    storms.forEach((st) => {
      ctx.fillStyle = '#334155';
      ctx.shadowColor = '#FF2E9A';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', st.x, st.y + 8);
    });

    // Draw Wind Stream Particles
    windParticles.forEach((p) => {
      ctx.fillStyle = `rgba(0, 240, 255, ${p.life * 0.7})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Drawn Gust Line
    if (isDrawingGust) {
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gustStartX, gustStartY);
      ctx.lineTo(gustEndX, gustEndY);
      ctx.stroke();
    }

    // Draw Cloud Sheep
    sheep.forEach((s) => {
      ctx.fillStyle = s.inPen ? '#B6FF3C' : '#F8FAFC';
      ctx.shadowColor = s.inPen ? '#B6FF3C' : '#FFFFFF';
      ctx.shadowBlur = 10;

      // Puffy cloud body
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.arc(s.x - 10, s.y - 5, s.radius * 0.7, 0, Math.PI * 2);
      ctx.arc(s.x + 10, s.y - 5, s.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Sheep Face (Eyes)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(s.x - 5, s.y, 2.5, 0, Math.PI * 2);
      ctx.arc(s.x + 5, s.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SKY LEVEL ${currentLevel} / ${maxLevels}`, 35, 40);
    ctx.fillText(`GUSTS USED: ${gustsUsed}`, 220, 40);
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 380, 40);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#A7F3D0';
    ctx.fillText('Drag to draw wind gust • Press E for Shepherd Bell', 35, 62);

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
