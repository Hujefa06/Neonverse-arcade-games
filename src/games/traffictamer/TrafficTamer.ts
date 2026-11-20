import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface Vehicle {
  id: number;
  x: number;
  y: number;
  dir: 'horizontal' | 'vertical';
  speed: number;
  isAmbulance: boolean;
  isDuck: boolean;
  emoji: string;
}

export function mountTrafficTamer(
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

  const INT_X = 480;
  const INT_Y = 270;

  // Signal State: true = Horizontal Green, false = Vertical Green
  let isHorizontalGreen = true;

  let vehicles: Vehicle[] = [];
  let nextVehicleId = 1;
  let score = 0;
  let flowCombo = 0;
  let cityIndex = 1;

  audioManager.startMusic('battle');

  const toggleSignal = () => {
    isHorizontalGreen = !isHorizontalGreen;
    audioManager.playKeystrokeTick();
  };

  const onMouseDown = () => toggleSignal();
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') toggleSignal();
  };

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('keydown', onKeyDown);

  let animId: number;
  let lastTime = performance.now();
  let spawnTimerH = 0;
  let spawnTimerV = 0;

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // Spawning Horizontal traffic (West to East)
    spawnTimerH += dt;
    if (spawnTimerH >= 1.6) {
      spawnTimerH = 0;
      vehicles.push({
        id: nextVehicleId++,
        x: -40,
        y: INT_Y - 15,
        dir: 'horizontal',
        speed: 180,
        isAmbulance: Math.random() < 0.2,
        isDuck: Math.random() < 0.15,
        emoji: Math.random() < 0.2 ? '🚑' : Math.random() < 0.15 ? '🦆' : '🚗',
      });
    }

    // Spawning Vertical traffic (North to South)
    spawnTimerV += dt;
    if (spawnTimerV >= 1.8) {
      spawnTimerV = 0;
      vehicles.push({
        id: nextVehicleId++,
        x: INT_X - 15,
        y: -40,
        dir: 'vertical',
        speed: 180,
        isAmbulance: Math.random() < 0.2,
        isDuck: false,
        emoji: Math.random() < 0.2 ? '🚑' : '🚕',
      });
    }

    // Update Vehicles
    for (let i = vehicles.length - 1; i >= 0; i--) {
      const v = vehicles[i];

      let shouldStop = false;
      if (v.dir === 'horizontal') {
        // Red light stop zone
        if (!isHorizontalGreen && v.x > INT_X - 90 && v.x < INT_X - 30) {
          shouldStop = true;
        }
      } else {
        if (isHorizontalGreen && v.y > INT_Y - 90 && v.y < INT_Y - 30) {
          shouldStop = true;
        }
      }

      if (!shouldStop) {
        if (v.dir === 'horizontal') v.x += v.speed * dt;
        else v.y += v.speed * dt;
      }

      // Check collision between vehicles in center intersection
      for (let j = i - 1; j >= 0; j--) {
        const v2 = vehicles[j];
        if (v.dir !== v2.dir) {
          const dist = Math.hypot(v.x - v2.x, v.y - v2.y);
          if (dist < 32 && Math.hypot(v.x - INT_X, v.y - INT_Y) < 45) {
            // CRASH AT INTERSECTION!
            audioManager.playComboBoom();
            fxKit.triggerScreenShake(container, 14, 500);
            saveManager.save('traffic-tamer', { highScore: score });
            api.triggerGameOver(score, cityIndex);
            return;
          }
        }
      }

      // Passed intersection safely
      if (v.x > canvas.width + 40 || v.y > canvas.height + 40) {
        vehicles.splice(i, 1);
        score += 150;
        flowCombo++;
        if (flowCombo % 10 === 0) {
          score += 1000;
          audioManager.playLevelUpChime();
        }
      }
    }

    // --- DRAWING ---
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Crossroad Roads
    ctx.fillStyle = '#1E293B';
    // Horizontal Avenue
    ctx.fillRect(0, INT_Y - 45, canvas.width, 90);
    // Vertical Boulevard
    ctx.fillRect(INT_X - 45, 0, 90, canvas.height);

    // Crosswalk Striping
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(INT_X - 40 + i * 22, INT_Y - 55, 14, 8);
      ctx.fillRect(INT_X - 40 + i * 22, INT_Y + 47, 14, 8);
    }

    // Traffic Light Indicators
    // Horizontal Signal
    ctx.fillStyle = isHorizontalGreen ? '#B6FF3C' : '#FF2E9A';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(INT_X - 60, INT_Y - 60, 10, 0, Math.PI * 2);
    ctx.arc(INT_X + 60, INT_Y + 60, 10, 0, Math.PI * 2);
    ctx.fill();

    // Vertical Signal
    ctx.fillStyle = !isHorizontalGreen ? '#B6FF3C' : '#FF2E9A';
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(INT_X + 60, INT_Y - 60, 10, 0, Math.PI * 2);
    ctx.arc(INT_X - 60, INT_Y + 60, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Vehicles
    vehicles.forEach((v) => {
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v.emoji, v.x, v.y + 10);
    });

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`CITY ${cityIndex}: CYBER TOKYO`, 35, 40);
    ctx.fillText(`FLOW COMBO: ${flowCombo}`, 240, 40);

    ctx.fillStyle = '#00F0FF';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 420, 40);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Tap intersection / Space to toggle Green & Red lights • Prevent crashes!', 35, 62);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('keydown', onKeyDown);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
