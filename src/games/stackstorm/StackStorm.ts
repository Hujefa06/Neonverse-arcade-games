import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface PlacedFloor {
  x: number;
  y: number;
  width: number;
  height: number;
  residentQuote?: string;
}

export function mountStackStorm(
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

  const FLOOR_HEIGHT = 28;
  const INITIAL_WIDTH = 180;
  const BASE_Y = 480;

  let stack: PlacedFloor[] = [
    { x: canvas.width / 2 - INITIAL_WIDTH / 2, y: BASE_Y, width: INITIAL_WIDTH, height: FLOOR_HEIGHT },
  ];

  let currentFloorWidth = INITIAL_WIDTH;
  let score = 0;
  let floorsCount = 0;
  let balanceOffset = 0; // Cumulative lean offset

  // Crane swing state
  let craneAngle = 0;
  let craneSpeed = 2.4;
  let isSteady = false;
  let steadyUses = 3;

  // Storm Wind
  let windSpeed = 0;
  let stormTimer = 0;
  let stormName = 'MILD BREEZE';

  const residentQuotes = [
    'My soup is sliding!',
    'Who engineered this?!',
    'Hold onto the fridge!',
    'Great view, bad tilt!',
    'Floors wobbling again!',
  ];

  audioManager.startMusic('battle');

  const dropFloor = () => {
    const craneX = canvas.width / 2 + Math.sin(craneAngle) * 220 + windSpeed * 20;
    const topFloor = stack[stack.length - 1];
    const targetY = topFloor.y - FLOOR_HEIGHT;

    // Calculate alignment overlap
    const dropLeft = craneX - currentFloorWidth / 2;
    const dropRight = craneX + currentFloorWidth / 2;
    const baseLeft = topFloor.x;
    const baseRight = topFloor.x + topFloor.width;

    const overlapLeft = Math.max(dropLeft, baseLeft);
    const overlapRight = Math.min(dropRight, baseRight);
    const overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 15) {
      // TOTAL MISS / COLLAPSE!
      audioManager.playComboBoom();
      fxKit.triggerScreenShake(container, 15, 500);
      saveManager.save('stack-storm', { floors: floorsCount, highScore: score });
      api.triggerGameOver(score, Math.floor(floorsCount / 10) + 1);
      return;
    }

    // Successful drop!
    floorsCount++;
    score += Math.round(overlapWidth * 10);
    audioManager.playPunchPOW();

    const isPerfect = Math.abs(dropLeft - baseLeft) < 5;
    if (isPerfect) {
      score += 500;
      audioManager.playLevelUpChime();
      fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');
      balanceOffset *= 0.5; // Re-aligns tower
    } else {
      balanceOffset += (dropLeft - baseLeft) * 0.15;
    }

    currentFloorWidth = overlapWidth;
    stack.push({
      x: overlapLeft,
      y: targetY,
      width: overlapWidth,
      height: FLOOR_HEIGHT,
      residentQuote: residentQuotes[Math.floor(Math.random() * residentQuotes.length)],
    });

    // Camera scroll adjustment if stack gets tall
    if (stack.length > 8) {
      stack.forEach((f) => (f.y += FLOOR_HEIGHT));
    }

    // Check Balance Meter
    if (Math.abs(balanceOffset) > 85) {
      // Tower leaned too far!
      audioManager.playComboBoom();
      fxKit.triggerScreenShake(container, 15, 600);
      api.triggerGameOver(score, Math.floor(floorsCount / 10) + 1);
      return;
    }

    // Named Storm Levels every 10 floors
    if (floorsCount % 10 === 0) {
      craneSpeed += 0.4;
      stormName = floorsCount === 10 ? 'GALE FORCE' : floorsCount === 20 ? 'THUNDER SQUALL' : 'PIGEON TYPHOON';
      audioManager.playVictoryFanfare();
    }
  };

  const useSteadyHand = () => {
    if (steadyUses > 0 && !isSteady) {
      steadyUses--;
      isSteady = true;
      audioManager.playKeystrokeTick();
      setTimeout(() => (isSteady = false), 2500);
    }
  };

  const onMouseDown = () => dropFloor();
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') dropFloor();
    if (e.key === 'Shift') useSteadyHand();
  };

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('keydown', onKeyDown);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // Wind oscillation
    stormTimer += dt;
    windSpeed = Math.sin(stormTimer * 1.5) * (floorsCount * 0.8 + 1);

    // Crane swing physics
    const speed = isSteady ? craneSpeed * 0.25 : craneSpeed;
    craneAngle += speed * dt;

    const craneX = canvas.width / 2 + Math.sin(craneAngle) * 220 + windSpeed * 20;

    // --- DRAWING ---
    ctx.fillStyle = '#060812';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Storm Weather Visuals (Rain streaks)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const rx = (i * 37 + time * 0.3) % canvas.width;
      const ry = (i * 53 + time * 0.8) % canvas.height;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + windSpeed * 4, ry + 16);
      ctx.stroke();
    }

    // Crane Cable & Swinging Block
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(craneX, 90);
    ctx.stroke();

    // Swinging Floor Block
    ctx.fillStyle = isSteady ? '#B6FF3C' : '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 10;
    ctx.fillRect(craneX - currentFloorWidth / 2, 90, currentFloorWidth, FLOOR_HEIGHT);
    ctx.shadowBlur = 0;

    // Draw Stacked Floors
    stack.forEach((f, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#1E293B' : '#0F172A';
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 2;
      ctx.fillRect(f.x + balanceOffset * (idx * 0.05), f.y, f.width, f.height);
      ctx.strokeRect(f.x + balanceOffset * (idx * 0.05), f.y, f.width, f.height);

      // Lit windows
      ctx.fillStyle = '#FFB800';
      const windowCount = Math.floor(f.width / 24);
      for (let w = 0; w < windowCount; w++) {
        ctx.fillRect(f.x + 8 + w * 22 + balanceOffset * (idx * 0.05), f.y + 6, 12, 14);
      }
    });

    // Resident speech bubble on top floor
    const topFloor = stack[stack.length - 1];
    if (topFloor.residentQuote) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`"${topFloor.residentQuote}"`, topFloor.x + topFloor.width / 2, topFloor.y - 10);
    }

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`FLOORS: ${floorsCount}`, 35, 40);
    ctx.fillText(`STORM: ${stormName}`, 180, 40);
    ctx.fillText(`STEADY HAND: ${steadyUses} LEFT [SHIFT]`, 420, 40);

    // Balance Lean Meter
    ctx.textAlign = 'right';
    const balancePct = Math.min(100, Math.round((Math.abs(balanceOffset) / 85) * 100));
    ctx.fillStyle = balancePct > 70 ? '#FF2E9A' : '#00F0FF';
    ctx.fillText(`SWAY TILT: ${balancePct}%`, canvas.width - 35, 40);

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
