import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface Planet {
  x: number;
  y: number;
  mass: number;
  radius: number;
  color: string;
  isSun?: boolean;
}

export function mountRocketPostman(
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
  const maxLevels = 30;
  let score = 0;

  // Launch station
  const launchStation = { x: 120, y: 270 };
  const targetAlien = { x: 840, y: 270, radius: 28, emoji: '👽' };

  // Rocket state
  let rocketX = launchStation.x;
  let rocketY = launchStation.y;
  let rocketVx = 0;
  let rocketVy = 0;
  let isLaunched = false;
  let fuel = 100;
  let isSinged = false;

  // Slingshot Aiming
  let isAiming = false;
  let dragCurrX = launchStation.x;
  let dragCurrY = launchStation.y;

  // Planets for Level
  const planets: Planet[] = [
    { x: 420, y: 270, mass: 45000, radius: 36, color: '#00F0FF' },
    { x: 640, y: 160, mass: 35000, radius: 28, color: '#FFB800', isSun: true },
  ];

  // Flight Path History
  let flightTrail: { x: number; y: number }[] = [];

  audioManager.startMusic('ambient');

  const resetRocket = () => {
    rocketX = launchStation.x;
    rocketY = launchStation.y;
    rocketVx = 0;
    rocketVy = 0;
    isLaunched = false;
    fuel = 100;
    isSinged = false;
    flightTrail = [];
  };

  const launchRocket = (vx: number, vy: number) => {
    isLaunched = true;
    rocketVx = vx;
    rocketVy = vy;
    audioManager.playPunchPOW();
  };

  const fireMicroBooster = () => {
    if (isLaunched && fuel > 5) {
      fuel -= 8;
      rocketVx *= 1.25;
      rocketVy *= 1.25;
      audioManager.playKeystrokeTick();
      fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');
    }
  };

  // Pointer / Drag Slingshot
  const onMouseDown = (e: MouseEvent) => {
    if (isLaunched) return;
    isAiming = true;
    const rect = canvas.getBoundingClientRect();
    dragCurrX = (e.clientX - rect.left) * (canvas.width / rect.width);
    dragCurrY = (e.clientY - rect.top) * (canvas.height / rect.height);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isAiming) return;
    const rect = canvas.getBoundingClientRect();
    dragCurrX = (e.clientX - rect.left) * (canvas.width / rect.width);
    dragCurrY = (e.clientY - rect.top) * (canvas.height / rect.height);
  };

  const onMouseUp = () => {
    if (!isAiming) return;
    isAiming = false;
    const dx = launchStation.x - dragCurrX;
    const dy = launchStation.y - dragCurrY;
    launchRocket(dx * 2.8, dy * 2.8);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') fireMicroBooster();
    if (e.key === 'r') resetRocket();
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

    if (isLaunched) {
      // Gravitational physics simulation
      const G = 1.0;
      planets.forEach((p) => {
        const dx = p.x - rocketX;
        const dy = p.y - rocketY;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > 10) {
          const force = (G * p.mass) / distSq;
          rocketVx += (dx / dist) * force * dt;
          rocketVy += (dy / dist) * force * dt;
        }

        // Near-miss Sun zone (singes the mail)
        if (p.isSun && dist < p.radius + 45) {
          isSinged = true;
        }

        // Planet Crash
        if (dist < p.radius + 8) {
          audioManager.playComboBoom();
          fxKit.triggerScreenShake(container, 12, 400);
          resetRocket();
        }
      });

      rocketX += rocketVx * dt;
      rocketY += rocketVy * dt;
      flightTrail.push({ x: rocketX, y: rocketY });

      // Delivery Destination Check
      const targetDist = Math.hypot(rocketX - targetAlien.x, rocketY - targetAlien.y);
      if (targetDist < targetAlien.radius + 10) {
        // DELIVERED!
        const stars = isSinged ? 1 : fuel > 50 ? 3 : 2;
        score += stars * 1000;
        audioManager.playVictoryFanfare();
        saveManager.save('rocket-postman', { highestLevel: currentLevel, highScore: score });

        if (currentLevel >= maxLevels) {
          api.triggerVictory(score, currentLevel);
          return;
        } else {
          currentLevel++;
          resetRocket();
        }
      }

      // Out of bounds check
      if (rocketX < -50 || rocketX > canvas.width + 50 || rocketY < -50 || rocketY > canvas.height + 50) {
        resetRocket();
      }
    }

    // --- DRAWING ---
    ctx.fillStyle = '#060812';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Deep Space Starfield
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 35; i++) {
      ctx.fillRect((i * 123) % canvas.width, (i * 87) % canvas.height, 1.5, 1.5);
    }

    // Draw Planets & Suns
    planets.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.isSun ? 30 : 15;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Gravity Orbital Rings
      ctx.strokeStyle = `${p.color}33`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Launch Station
    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(launchStation.x, launchStation.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000000';
    ctx.font = '12px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚀', launchStation.x, launchStation.y + 4);

    // Draw Slingshot Band
    if (isAiming) {
      ctx.strokeStyle = '#FF2E9A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(launchStation.x, launchStation.y);
      ctx.lineTo(dragCurrX, dragCurrY);
      ctx.stroke();
    }

    // Draw Alien Destination Station
    ctx.fillStyle = '#B6FF3C';
    ctx.shadowColor = '#B6FF3C';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(targetAlien.x, targetAlien.y, targetAlien.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(targetAlien.emoji, targetAlien.x, targetAlien.y + 10);

    // Draw Flight Trail
    ctx.strokeStyle = isSinged ? '#FFB800' : 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    flightTrail.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Draw Rocket
    if (isLaunched) {
      ctx.save();
      ctx.translate(rocketX, rocketY);
      const angle = Math.atan2(rocketVy, rocketVx);
      ctx.rotate(angle);
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isSinged ? '🔥' : '🚀', 0, 7);
      ctx.restore();
    }

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`DELIVERY SECTOR ${currentLevel} / ${maxLevels}`, 35, 40);
    ctx.fillText(`FUEL: ${fuel}%`, 250, 40);
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 380, 40);

    if (isSinged) {
      ctx.fillStyle = '#FFB800';
      ctx.fillText('⚠️ MAIL SINGED BY SUN! (1-STAR)', 520, 40);
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
