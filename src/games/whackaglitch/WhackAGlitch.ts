import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface GlitchTarget {
  id: number;
  x: number;
  y: number;
  type: 'dead_pixel' | 'popup_error' | 'hourglass' | 'cute_cat';
  timer: number;
  maxTimer: number;
  label?: string;
  isWhacked?: boolean;
}

export function mountWhackAGlitch(
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

  // CRT Integrity
  let systemIntegrity = 100;
  let score = 0;
  let wave = 1;
  let glitchesDefeated = 0;

  // Degauss Bomb Cooldown
  let degaussCooldown = 0;
  const degaussMaxCooldown = 25; // 25s
  let degaussWarpTimer = 0;

  let targets: GlitchTarget[] = [];
  let nextId = 1;
  let spawnTimer = 0;

  // Wave Management
  let waveTimer = 0;
  let waveRestTimer = 0;
  const waveDuration = 18; // 18 seconds per wave

  // Trigger Degauss Emergency Coil
  const triggerDegaussBomb = () => {
    if (degaussCooldown <= 0) {
      degaussCooldown = degaussMaxCooldown;
      degaussWarpTimer = 0.6;

      audioManager.playComboBoom();
      fxKit.triggerScreenShake(container, 15, 600);
      fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');

      // Clear all active harmful glitches
      targets.forEach((t) => {
        if (t.type !== 'cute_cat') {
          t.isWhacked = true;
          score += 150;
        }
      });
    }
  };

  // Whack Click Handler
  const handleWhack = (clickX: number, clickY: number) => {
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      if (t.isWhacked) continue;

      const hitDist = t.type === 'popup_error' ? 50 : 35;
      const dx = clickX - t.x;
      const dy = clickY - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < hitDist) {
        t.isWhacked = true;

        if (t.type === 'cute_cat') {
          // MISTAKE! Whacked innocent desktop cat!
          systemIntegrity = Math.max(0, systemIntegrity - 25);
          audioManager.playPunchPOW();
          fxKit.triggerScreenShake(container, 8, 300);
        } else {
          // Whacked harmful glitch!
          glitchesDefeated++;
          score += t.type === 'popup_error' ? 300 : 150;
          audioManager.playKeystrokeTick();
          fxKit.triggerLightningFlash(api.flashRef.current, '#FF2E9A');
        }

        if (systemIntegrity <= 0) {
          saveManager.save('whack-a-glitch', { highestWave: wave, highScore: score });
          api.triggerGameOver(score, wave);
        }
        return;
      }
    }
  };

  // Pointer & Touch Listeners
  const onMouseDown = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    handleWhack(mx, my);
  };

  const onTouchStart = (e: TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const my = (touch.clientY - rect.top) * (canvas.height / rect.height);
    handleWhack(mx, my);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'f' || e.code === 'Space') {
      triggerDegaussBomb();
    }
  };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('touchstart', onTouchStart);
  window.addEventListener('keydown', onKeyDown);

  audioManager.startMusic('battle');

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // Handle Timers
    if (degaussCooldown > 0) degaussCooldown -= dt;
    if (degaussWarpTimer > 0) degaussWarpTimer -= dt;

    // Wave Progression
    if (waveRestTimer > 0) {
      waveRestTimer -= dt;
    } else {
      waveTimer += dt;
      if (waveTimer >= waveDuration) {
        waveTimer = 0;
        wave++;
        waveRestTimer = 2.0; // 2s degauss repair transition
        systemIntegrity = Math.min(100, systemIntegrity + 20); // auto-repair
        audioManager.playLevelUpChime();
        fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');
      }

      // Spawning Glitches
      spawnTimer += dt;
      const spawnRate = Math.max(0.4, 1.4 - wave * 0.06);
      if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        const types: GlitchTarget['type'][] = ['dead_pixel', 'popup_error', 'hourglass', 'cute_cat'];
        const weights = [0.4, 0.3, 0.2, 0.1];
        const r = Math.random();
        let pickedType: GlitchTarget['type'] = 'dead_pixel';
        if (r < 0.4) pickedType = 'dead_pixel';
        else if (r < 0.7) pickedType = 'popup_error';
        else if (r < 0.9) pickedType = 'hourglass';
        else pickedType = 'cute_cat';

        targets.push({
          id: nextId++,
          x: 120 + Math.random() * (canvas.width - 240),
          y: 120 + Math.random() * (canvas.height - 240),
          type: pickedType,
          timer: 3.5,
          maxTimer: 3.5,
          label: pickedType === 'popup_error' ? 'FATAL 0x00FF' : undefined,
        });
      }
    }

    // Update Targets & Check Timeouts
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      if (t.isWhacked) {
        targets.splice(i, 1);
        continue;
      }
      t.timer -= dt;

      if (t.timer <= 0) {
        // Glitch expired without being whacked!
        targets.splice(i, 1);
        if (t.type !== 'cute_cat') {
          systemIntegrity = Math.max(0, systemIntegrity - 15);
          audioManager.playPunchPOW();
          fxKit.triggerScreenShake(container, 7, 250);

          if (systemIntegrity <= 0) {
            saveManager.save('whack-a-glitch', { highestWave: wave, highScore: score });
            api.triggerGameOver(score, wave);
            return;
          }
        }
      }
    }

    // --- DRAWING ---
    ctx.fillStyle = '#05070B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // CRT Warp / Degauss wobble effect
    if (degaussWarpTimer > 0) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // CRT Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 2);
    }

    // Draw Targets
    targets.forEach((t) => {
      const progress = t.timer / t.maxTimer;

      if (t.type === 'dead_pixel') {
        // Red flashing glitch block
        ctx.fillStyle = Math.floor(time * 15) % 2 === 0 ? '#FF2E9A' : '#00F0FF';
        ctx.fillRect(t.x - 18, t.y - 18, 36, 36);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👾', t.x, t.y + 8);
      } else if (t.type === 'popup_error') {
        // Windows retro error dialog
        ctx.fillStyle = '#1A202C';
        ctx.strokeStyle = '#FF2E9A';
        ctx.lineWidth = 2;
        ctx.fillRect(t.x - 55, t.y - 30, 110, 60);
        ctx.strokeRect(t.x - 55, t.y - 30, 110, 60);

        // Title bar
        ctx.fillStyle = '#FF2E9A';
        ctx.fillRect(t.x - 55, t.y - 30, 110, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CRITICAL ERROR', t.x, t.y - 18);

        ctx.font = '16px sans-serif';
        ctx.fillText('⚠️ [X]', t.x, t.y + 16);
      } else if (t.type === 'hourglass') {
        // Spinning Hourglass
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⏳', t.x, t.y + 10);
      } else if (t.type === 'cute_cat') {
        // Cute Cat Pixel (DO NOT WHACK)
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🐱', t.x, t.y + 10);
        ctx.fillStyle = '#B6FF3C';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('INNOCENT!', t.x, t.y - 18);
      }

      // Countdown Ring
      ctx.strokeStyle = progress < 0.3 ? '#FF2E9A' : '#00F0FF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 30, 0, Math.PI * 2 * progress);
      ctx.stroke();
    });

    // Top CRT Header HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`CRT WAVE: ${wave}`, 30, 40);
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 30, 65);

    // System Integrity Gauge
    ctx.fillStyle = '#1A202C';
    ctx.fillRect(canvas.width - 260, 25, 220, 18);
    ctx.fillStyle = systemIntegrity > 50 ? '#00F0FF' : systemIntegrity > 25 ? '#FFB800' : '#FF2E9A';
    ctx.fillRect(canvas.width - 260, 25, (systemIntegrity / 100) * 220, 18);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - 260, 25, 220, 18);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Orbitron, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`INTEGRITY: ${systemIntegrity}%`, canvas.width - 45, 18);

    // Degauss Bomb Ready Badge
    ctx.textAlign = 'center';
    if (degaussCooldown <= 0) {
      ctx.fillStyle = '#B6FF3C';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillText('⚡ DEGAUSS BOMB READY! [PRESS F / SPACE]', canvas.width / 2, 40);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '11px monospace';
      ctx.fillText(`DEGAUSS COOLDOWN: ${degaussCooldown.toFixed(1)}s`, canvas.width / 2, 40);
    }

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('keydown', onKeyDown);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
