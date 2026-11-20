import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface RivalBoxer {
  name: string;
  costume: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  color: string;
}

export function mountNoodleKnockout(
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

  let careerIndex = 0;
  const careerRivals: RivalBoxer[] = [
    { name: 'Overworked Intern Bob', costume: '👔', hp: 100, maxHp: 100, x: 620, y: 320, color: '#94A3B8' },
    { name: 'Chef Brawly', costume: '👨‍🍳', hp: 160, maxHp: 160, x: 620, y: 320, color: '#FFB800' },
    { name: 'Cyber Ninja Kane', costume: '🥷', hp: 240, maxHp: 240, x: 620, y: 320, color: '#FF2E9A' },
    { name: 'Galactic Champion Titan', costume: '👑', hp: 350, maxHp: 350, x: 620, y: 320, color: '#00F0FF' },
  ];

  let rival = careerRivals[careerIndex];

  // Player Noodle Boxer state
  const playerBody = { x: 340, y: 320, hp: 100, maxHp: 100 };
  let gloveX = 390;
  let gloveY = 320;
  let gloveVx = 0;
  let gloveVy = 0;

  let isCharging = false;
  let chargeTime = 0;
  let score = 0;

  audioManager.startMusic('battle');

  // Mouse / Pointer motion tracking
  let prevMx = gloveX;
  let prevMy = gloveY;

  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    gloveVx = (mx - prevMx) * 20;
    gloveVy = (my - prevMy) * 20;
    prevMx = mx;
    prevMy = my;

    // Follow mouse with spring elasticity
    gloveX += (mx - gloveX) * 0.35;
    gloveY += (my - gloveY) * 0.35;

    // Check hit on rival head
    if (Math.hypot(gloveX - rival.x, gloveY - rival.y) < 55) {
      const punchSpeed = Math.hypot(gloveVx, gloveVy);
      if (punchSpeed > 250) {
        // HIT!
        const dmg = Math.round(punchSpeed * 0.08);
        rival.hp = Math.max(0, rival.hp - dmg);
        score += dmg * 15;
        audioManager.playPunchPOW();
        fxKit.triggerScreenShake(container, 5, 150);

        if (rival.hp <= 0) onRivalKnockout();
      }
    }
  };

  const onMouseDown = () => {
    isCharging = true;
    chargeTime = 0;
  };

  const onMouseUp = () => {
    if (isCharging) {
      isCharging = false;
      if (chargeTime > 0.6) {
        // Charged Windmill Uppercut!
        audioManager.playComboBoom();
        fxKit.triggerScreenShake(container, 14, 450);
        fxKit.triggerLightningFlash(api.flashRef.current, '#FFB800');

        const chargedDmg = Math.round(chargeTime * 70);
        rival.hp = Math.max(0, rival.hp - chargedDmg);
        score += chargedDmg * 25;

        if (rival.hp <= 0) onRivalKnockout();
      }
    }
  };

  const onRivalKnockout = () => {
    audioManager.playVictoryFanfare();
    fxKit.applySlowMotion(() => {}, 0.25, 800);

    if (careerIndex < careerRivals.length - 1) {
      careerIndex++;
      rival = careerRivals[careerIndex];
      playerBody.hp = 100;
    } else {
      saveManager.save('noodle-knockout', { career: careerIndex + 1, highScore: score });
      api.triggerVictory(score, careerIndex + 1);
    }
  };

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    if (isCharging) chargeTime += dt;

    // Rival AI weave & counter-punch
    rival.y = 320 + Math.sin(time * 3) * 20;

    // --- DRAWING ---
    ctx.fillStyle = '#080A14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Boxing Ring Canvas & Ropes
    ctx.strokeStyle = '#FF2E9A';
    ctx.lineWidth = 4;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      ctx.moveTo(100, 220 + r * 60);
      ctx.lineTo(canvas.width - 100, 220 + r * 60);
      ctx.stroke();
    }

    // Draw Rival Boxer
    ctx.fillStyle = rival.color;
    ctx.shadowColor = rival.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(rival.x, rival.y, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rival.costume, rival.x, rival.y + 12);

    // Draw Player Boxer Torso
    ctx.fillStyle = '#00F0FF';
    ctx.beginPath();
    ctx.arc(playerBody.x, playerBody.y, 35, 0, Math.PI * 2);
    ctx.fill();

    // Draw Floppy Noodle Arm (Curved Bezier joint)
    ctx.strokeStyle = '#B6FF3C';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(playerBody.x + 15, playerBody.y);
    const elbowX = (playerBody.x + gloveX) / 2 + Math.sin(time * 8) * 30;
    const elbowY = (playerBody.y + gloveY) / 2 + 40;
    ctx.quadraticCurveTo(elbowX, elbowY, gloveX, gloveY);
    ctx.stroke();

    // Draw Boxing Glove
    ctx.fillStyle = isCharging ? '#FFB800' : '#FF2E9A';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = isCharging ? 25 : 8;
    ctx.beginPath();
    ctx.arc(gloveX, gloveY, isCharging ? 24 : 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`RIVAL: ${rival.name}`, 35, 40);

    // Rival Health Bar
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(35, 55, 200, 14);
    ctx.fillStyle = rival.color;
    ctx.fillRect(35, 55, (rival.hp / rival.maxHp) * 200, 14);

    ctx.fillStyle = '#00F0FF';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, canvas.width - 35, 40);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.fillText('Circle cursor to wind up floppy arm • Flick to jab • Hold & Release for Uppercut', canvas.width / 2, canvas.height - 25);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
