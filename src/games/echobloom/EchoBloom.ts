import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { saveManager } from '../../game-sdk/SaveManager';

interface FlowerSpecies {
  id: string;
  name: string;
  emoji: string;
  color: string;
  freq: number;
}

const FLOWER_SPECIES: FlowerSpecies[] = [
  { id: 'lotus', name: 'Lumina Lotus', emoji: '🌸', color: '#FF2E9A', freq: 523.25 }, // C5
  { id: 'bell', name: 'Solstice Bell', emoji: '🌻', color: '#FFB800', freq: 587.33 }, // D5
  { id: 'orchid', name: 'Cyan Orchid', emoji: '🪷', color: '#00F0FF', freq: 659.25 }, // E5
  { id: 'violet', name: 'Astral Violet', emoji: '🪻', color: '#7C4DFF', freq: 783.99 }, // G5
  { id: 'echo', name: 'Echo Blossom', emoji: '🌺', color: '#B6FF3C', freq: 880.00 }, // A5
];

interface PlantedFlower {
  x: number;
  y: number;
  species: FlowerSpecies;
  pulseAlpha: number;
  ringRadius: number;
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  glowPhase: number;
}

export function mountEchoBloom(
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

  // Garden state
  let plantedFlowers: PlantedFlower[] = [
    // Pre-populate welcoming starter melody
    { x: 300, y: 320, species: FLOWER_SPECIES[0], pulseAlpha: 0, ringRadius: 0 },
    { x: 440, y: 250, species: FLOWER_SPECIES[2], pulseAlpha: 0, ringRadius: 0 },
    { x: 620, y: 340, species: FLOWER_SPECIES[4], pulseAlpha: 0, ringRadius: 0 },
  ];

  let selectedSpeciesIndex = 0;
  let draggedFlower: PlantedFlower | null = null;
  let isLuring = false;
  let lureX = 480;
  let lureY = 270;

  // Fireflies flock
  const fireflies: Firefly[] = Array.from({ length: 12 }, () => ({
    x: 100 + Math.random() * (canvas.width - 200),
    y: 100 + Math.random() * (canvas.height - 200),
    vx: (Math.random() - 0.5) * 60,
    vy: (Math.random() - 0.5) * 60,
    glowPhase: Math.random() * Math.PI * 2,
  }));

  // Procedural Web Audio synth note playback
  let audioCtx: AudioContext | null = null;
  const playFlowerNote = (freq: number) => {
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch {}
  };

  audioManager.startMusic('ambient');

  // Trigger Postcard Snapshot Download
  const snapshotPostcard = () => {
    audioManager.playLevelUpChime();
    const link = document.createElement('a');
    link.download = `EchoBloom_Garden_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Pointer / Touch Handlers
  const onMouseDown = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Check if clicked an existing flower to drag
    for (const f of plantedFlowers) {
      const dist = Math.sqrt((f.x - mx) ** 2 + (f.y - my) ** 2);
      if (dist < 30) {
        draggedFlower = f;
        return;
      }
    }

    // Otherwise plant new flower if in garden bounds
    if (my > 100 && my < canvas.height - 60) {
      const species = FLOWER_SPECIES[selectedSpeciesIndex];
      plantedFlowers.push({
        x: mx,
        y: my,
        species,
        pulseAlpha: 1.0,
        ringRadius: 10,
      });
      playFlowerNote(species.freq);
      audioManager.playKeystrokeTick();
      saveManager.save('echo-bloom', { count: plantedFlowers.length });
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (draggedFlower) {
      draggedFlower.x = mx;
      draggedFlower.y = my;
    }
    if (isLuring) {
      lureX = mx;
      lureY = my;
    }
  };

  const onMouseUp = () => {
    draggedFlower = null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'e') {
      isLuring = true;
    } else if (e.key === 'c') {
      snapshotPostcard();
    } else if (e.key >= '1' && e.key <= '5') {
      selectedSpeciesIndex = parseInt(e.key) - 1;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'e') isLuring = false;
  };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // Update Fireflies
    fireflies.forEach((f) => {
      f.glowPhase += dt * 3;

      if (isLuring) {
        // Attract towards lure
        const dx = lureX - f.x;
        const dy = lureY - f.y;
        f.vx += dx * dt * 2.5;
        f.vy += dy * dt * 2.5;
      } else {
        // Natural wandering with soft boundary bounce
        f.vx += (Math.random() - 0.5) * 40 * dt;
        f.vy += (Math.random() - 0.5) * 40 * dt;
      }

      // Speed clamp
      const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
      if (speed > 90) {
        f.vx = (f.vx / speed) * 90;
        f.vy = (f.vy / speed) * 90;
      }

      f.x += f.vx * dt;
      f.y += f.vy * dt;

      // Soft borders
      if (f.x < 40) f.vx += 30 * dt;
      if (f.x > canvas.width - 40) f.vx -= 30 * dt;
      if (f.y < 120) f.vy += 30 * dt;
      if (f.y > canvas.height - 80) f.vy -= 30 * dt;

      // Check visit to planted flowers
      plantedFlowers.forEach((flower) => {
        const dx = flower.x - f.x;
        const dy = flower.y - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 26 && flower.pulseAlpha <= 0.1) {
          flower.pulseAlpha = 1.0;
          flower.ringRadius = 15;
          playFlowerNote(flower.species.freq);
        }
      });
    });

    // Update Flower Sound Rings
    plantedFlowers.forEach((flower) => {
      if (flower.pulseAlpha > 0) {
        flower.pulseAlpha -= dt * 1.5;
        flower.ringRadius += dt * 60;
      }
    });

    // --- DRAWING ---
    // Deep nocturnal garden background
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Distant ambient stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137) % canvas.width);
      const sy = ((i * 93) % 250);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Soil ground glow
    const groundGrad = ctx.createLinearGradient(0, 420, 0, canvas.height);
    groundGrad.addColorStop(0, 'rgba(18, 26, 40, 0.4)');
    groundGrad.addColorStop(1, 'rgba(10, 14, 24, 0.9)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 420, canvas.width, canvas.height - 420);

    // Draw Expanding Acoustic Echo Rings
    plantedFlowers.forEach((flower) => {
      if (flower.pulseAlpha > 0) {
        ctx.strokeStyle = flower.species.color;
        ctx.globalAlpha = flower.pulseAlpha * 0.6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(flower.x, flower.y, flower.ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    });

    // Draw Planted Flowers
    plantedFlowers.forEach((flower) => {
      ctx.save();
      ctx.translate(flower.x, flower.y);

      // Bioluminescent Petal Aura
      ctx.fillStyle = flower.species.color;
      ctx.shadowColor = flower.species.color;
      ctx.shadowBlur = flower.pulseAlpha > 0 ? 25 : 12;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Flower Emoji Blossom
      ctx.shadowBlur = 0;
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(flower.species.emoji, 0, 10);

      ctx.restore();
    });

    // Draw Fireflies
    fireflies.forEach((f) => {
      const alpha = 0.4 + 0.6 * Math.sin(f.glowPhase);
      ctx.fillStyle = `rgba(182, 255, 60, ${alpha})`;
      ctx.shadowColor = '#B6FF3C';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Top Header & Species Palette Selector
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(20, 15, canvas.width - 40, 60);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ECHO BLOOM: NIGHT GARDEN', 35, 40);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#A0AEC0';
    ctx.fillText('Click soil to plant • Drag to arrange • E = Lure • C = Postcard', 35, 58);

    // Species Selector Icons on Right
    const palStartX = canvas.width - 270;
    FLOWER_SPECIES.forEach((s, idx) => {
      const px = palStartX + idx * 48;
      const py = 30;
      const isSelected = idx === selectedSpeciesIndex;

      if (isSelected) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 14, py - 10, 36, 40);
      }
      ctx.font = '24px sans-serif';
      ctx.fillText(s.emoji, px + 4, py + 18);
    });

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    if (audioCtx && audioCtx.state !== 'closed') {
      try {
        audioCtx.close().catch(() => {});
      } catch {}
      audioCtx = null;
    }
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
