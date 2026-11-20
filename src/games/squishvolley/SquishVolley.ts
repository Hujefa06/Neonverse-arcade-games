import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

export function mountSquishVolley(
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

  const FLOOR_Y = 460;
  const NET_X = 480;
  const NET_HEIGHT = 150;

  // P1 State
  let p1X = 240;
  let p1Y = FLOOR_Y;
  let p1Vy = 0;
  let p1MoveLeft = false;
  let p1MoveRight = false;

  // AI / P2 State
  let p2X = 720;
  let p2Y = FLOOR_Y;
  let p2Vy = 0;

  // Ball State
  let ballX = 240;
  let ballY = 200;
  let ballVx = 120;
  let ballVy = -80;
  let ballRadius = 18;

  let p1Score = 0;
  let p2Score = 0;
  const winningScore = 7;
  let cupLevel = 1;

  audioManager.startMusic('battle');

  const onKeyDown = (e: KeyboardEvent) => {
    // P1 Controls: A / D / W
    if (e.key === 'a' || e.key === 'ArrowLeft') p1MoveLeft = true;
    if (e.key === 'd' || e.key === 'ArrowRight') p1MoveRight = true;
    if ((e.key === 'w' || e.code === 'Space' || e.key === 'ArrowUp') && p1Y >= FLOOR_Y) {
      p1Vy = -650;
      audioManager.playKeystrokeTick();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') p1MoveLeft = false;
    if (e.key === 'd' || e.key === 'ArrowRight') p1MoveRight = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const resetRound = (servedByP1: boolean) => {
    ballX = servedByP1 ? 240 : 720;
    ballY = 220;
    ballVx = servedByP1 ? 160 : -160;
    ballVy = -180;
  };

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.04, (time - lastTime) / 1000);
    lastTime = time;

    const gravity = 1200;

    // P1 Movement & Jump
    const speed = 360;
    if (p1MoveLeft) p1X = Math.max(60, p1X - speed * dt);
    if (p1MoveRight) p1X = Math.min(NET_X - 45, p1X + speed * dt);

    p1Vy += gravity * dt;
    p1Y += p1Vy * dt;
    if (p1Y >= FLOOR_Y) {
      p1Y = FLOOR_Y;
      p1Vy = 0;
    }

    // AI P2 Reaction Movement
    if (ballX > NET_X - 50) {
      const targetP2X = Math.max(NET_X + 45, Math.min(canvas.width - 60, ballX));
      if (p2X < targetP2X - 10) p2X += speed * 0.75 * dt;
      else if (p2X > targetP2X + 10) p2X -= speed * 0.75 * dt;

      // AI Jump to spike
      if (ballY < FLOOR_Y - 40 && Math.abs(ballX - p2X) < 50 && p2Y >= FLOOR_Y) {
        p2Vy = -620;
      }
    }
    p2Vy += gravity * dt;
    p2Y += p2Vy * dt;
    if (p2Y >= FLOOR_Y) {
      p2Y = FLOOR_Y;
      p2Vy = 0;
    }

    // Ball Physics
    ballVy += gravity * 0.75 * dt;
    ballX += ballVx * dt;
    ballY += ballVy * dt;

    // Ball Wall Bounce
    if (ballX < ballRadius) { ballX = ballRadius; ballVx *= -0.85; }
    if (ballX > canvas.width - ballRadius) { ballX = canvas.width - ballRadius; ballVx *= -0.85; }

    // Net Collision
    if (
      ballX > NET_X - 12 &&
      ballX < NET_X + 12 &&
      ballY > FLOOR_Y - NET_HEIGHT
    ) {
      ballVx *= -0.85;
      audioManager.playKeystrokeTick();
    }

    // Ball Bounce off P1 Jelly Head
    const p1Dist = Math.hypot(ballX - p1X, ballY - (p1Y - 25));
    if (p1Dist < ballRadius + 32) {
      ballVy = -580;
      ballVx = (ballX - p1X) * 12 + 100;
      audioManager.playPunchPOW();
      fxKit.triggerScreenShake(container, 3, 100);
    }

    // Ball Bounce off P2 Jelly Head
    const p2Dist = Math.hypot(ballX - p2X, ballY - (p2Y - 25));
    if (p2Dist < ballRadius + 32) {
      ballVy = -580;
      ballVx = (ballX - p2X) * 12 - 100;
      audioManager.playPunchPOW();
      fxKit.triggerScreenShake(container, 3, 100);
    }

    // Ball Ground Floor Hit (Point Scored!)
    if (ballY + ballRadius >= FLOOR_Y) {
      if (ballX < NET_X) {
        // Point for P2 (Rival)
        p2Score++;
        audioManager.playComboBoom();
        fxKit.triggerScreenShake(container, 8, 300);
        resetRound(true);
      } else {
        // Point for P1 (Player)
        p1Score++;
        audioManager.playVictoryFanfare();
        fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');
        resetRound(false);
      }

      // Check Match Win
      if (p1Score >= winningScore) {
        saveManager.save('squish-volley', { cup: cupLevel, score: p1Score * 500 });
        api.triggerVictory(p1Score * 500, cupLevel);
        return;
      } else if (p2Score >= winningScore) {
        api.triggerGameOver(p1Score * 200, cupLevel);
        return;
      }
    }

    // --- DRAWING ---
    ctx.fillStyle = '#060812';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Court Floor
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(canvas.width, FLOOR_Y);
    ctx.stroke();

    // Center Net
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(NET_X, FLOOR_Y);
    ctx.lineTo(NET_X, FLOOR_Y - NET_HEIGHT);
    ctx.stroke();

    // Draw P1 Cyan Jelly Blob
    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p1X, p1Y - 25, 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw P2 Magenta Jelly Blob
    ctx.fillStyle = '#FF2E9A';
    ctx.shadowColor = '#FF2E9A';
    ctx.beginPath();
    ctx.arc(p2X, p2Y - 25, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Squishy Volleyball
    ctx.fillStyle = '#FFB800';
    ctx.shadowColor = '#FFB800';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Top Scoreboard
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 28px Orbitron, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${p1Score}`, NET_X - 40, 50);

    ctx.fillStyle = '#FF2E9A';
    ctx.textAlign = 'left';
    ctx.fillText(`${p2Score}`, NET_X + 40, 50);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CUP TOURNAMENT #${cupLevel} (FIRST TO 7)`, canvas.width / 2, 22);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
