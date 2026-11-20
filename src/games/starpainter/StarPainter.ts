import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface StarNode {
  index: number;
  x: number;
  y: number;
  visited: boolean;
}

export function mountStarPainter(
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

  let constellationIndex = 0;
  const constellations = [
    { name: 'PHOENIX OF LIGHT', emoji: '🦅', count: 5 },
    { name: 'CELESTIAL DRAGON', emoji: '🐉', count: 6 },
    { name: 'ASTRAL PEGASUS', emoji: '🦄', count: 7 },
  ];

  let stars: StarNode[] = [];
  let nextExpected = 1;
  let lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let score = 0;
  let isLivingCreature = false;
  let creatureAnimTime = 0;

  audioManager.startMusic('ambient');

  const setupConstellation = () => {
    stars = [];
    lines = [];
    nextExpected = 1;
    isLivingCreature = false;
    creatureAnimTime = 0;

    const count = constellations[constellationIndex].count;
    for (let i = 1; i <= count; i++) {
      const angle = (i / count) * Math.PI * 1.5;
      stars.push({
        index: i,
        x: 480 + Math.cos(angle) * (140 + (i % 2) * 50),
        y: 270 + Math.sin(angle) * (110 + (i % 2) * 40),
        visited: false,
      });
    }
  };

  setupConstellation();

  const handleStarClick = (star: StarNode) => {
    if (star.index === nextExpected) {
      star.visited = true;
      audioManager.playKeystrokeTick();

      if (nextExpected > 1) {
        const prev = stars.find((s) => s.index === nextExpected - 1);
        if (prev) {
          lines.push({ x1: prev.x, y1: prev.y, x2: star.x, y2: star.y });
        }
      }

      nextExpected++;

      // Constellation Completed!
      if (nextExpected > stars.length) {
        isLivingCreature = true;
        score += 2000;
        audioManager.playVictoryFanfare();
        fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');

        setTimeout(() => {
          if (constellationIndex < constellations.length - 1) {
            constellationIndex++;
            setupConstellation();
          } else {
            saveManager.save('star-painter', { highScore: score });
            api.triggerVictory(score, 24);
          }
        }, 3000);
      }
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    stars.forEach((s) => {
      if (Math.hypot(s.x - mx, s.y - my) < 25) {
        handleStarClick(s);
      }
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'r') setupConstellation();
  };

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('keydown', onKeyDown);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    if (isLivingCreature) creatureAnimTime += dt;

    // --- DRAWING ---
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cosmic background star dust
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 137) % canvas.width, (i * 83) % canvas.height, 1.5, 1.5);
    }

    // Draw Drawn Astral Lines
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 10;
    lines.forEach((l) => {
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Draw Stars
    stars.forEach((s) => {
      ctx.fillStyle = s.visited ? '#B6FF3C' : '#FFFFFF';
      ctx.shadowColor = s.visited ? '#B6FF3C' : '#00F0FF';
      ctx.shadowBlur = s.visited ? 15 : 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Index label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${s.index}`, s.x, s.y - 14);
    });

    // Draw Animated Luminous Creature if Completed!
    if (isLivingCreature) {
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      const animX = 480 + Math.sin(creatureAnimTime * 2) * 50;
      const animY = 270 + Math.cos(creatureAnimTime * 2) * 30;
      ctx.fillText(constellations[constellationIndex].emoji, animX, animY);
    }

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`CONSTELLATION ${constellationIndex + 1} / 24: ${constellations[constellationIndex].name}`, 35, 40);

    ctx.fillStyle = '#00F0FF';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 480, 40);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Click glowing stars in numbered order (1 → 2 → 3...) • R to Redraw', 35, 62);

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
