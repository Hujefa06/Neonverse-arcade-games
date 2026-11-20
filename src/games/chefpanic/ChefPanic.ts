import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

type IngredientType = 'bun_bottom' | 'patty' | 'cheese' | 'lettuce' | 'tomato' | 'bun_top' | 'hazard';

interface IngredientDef {
  type: IngredientType;
  label: string;
  emoji: string;
  color: string;
}

const INGREDIENTS: Record<IngredientType, IngredientDef> = {
  bun_bottom: { type: 'bun_bottom', label: 'Bottom Bun', emoji: '🍞', color: '#D4A373' },
  patty: { type: 'patty', label: 'Patty', emoji: '🥩', color: '#6F4E37' },
  cheese: { type: 'cheese', label: 'Cheese', emoji: '🧀', color: '#FFD166' },
  lettuce: { type: 'lettuce', label: 'Lettuce', emoji: '🥬', color: '#06D6A0' },
  tomato: { type: 'tomato', label: 'Tomato', emoji: '🍅', color: '#EF476F' },
  bun_top: { type: 'bun_top', label: 'Top Bun', emoji: '🍞', color: '#D4A373' },
  hazard: { type: 'hazard', label: 'Rotten Junk', emoji: '🐟', color: '#8D99AE' },
};

interface FallingItem {
  x: number;
  y: number;
  vy: number;
  type: IngredientType;
}

export function mountChefPanic(
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

  // Chef state
  let chefX = 480;
  const chefY = 460;
  const chefWidth = 110;
  let moveLeft = false;
  let moveRight = false;

  // Level & Progression
  let currentLevel = 1;
  const maxLevels = 40;
  let score = 0;
  let strikes = 0;
  const maxStrikes = 3;
  let ordersDelivered = 0;

  // Burger Orders & Current Stack
  const generateOrder = (lvl: number): IngredientType[] => {
    if (lvl === 1) return ['bun_bottom', 'patty', 'bun_top'];
    if (lvl === 2) return ['bun_bottom', 'patty', 'cheese', 'bun_top'];
    if (lvl <= 5) return ['bun_bottom', 'patty', 'cheese', 'tomato', 'bun_top'];
    // Higher levels: double patties or giant multi-layer orders
    return ['bun_bottom', 'patty', 'cheese', 'lettuce', 'patty', 'tomato', 'bun_top'];
  };

  let currentOrder = generateOrder(currentLevel);
  let caughtStack: IngredientType[] = [];

  // Falling items pool
  let fallingItems: FallingItem[] = [];
  let spawnTimer = 0;

  // Comic explosion visual effect
  let explosionTimer = 0;
  let explosionX = 0;
  let explosionY = 0;
  let customerEmoji = '😀';
  let emojiTimer = 0;

  // Toss Tray handler
  const tossTray = () => {
    if (caughtStack.length > 0) {
      caughtStack = [];
      audioManager.playSlashSpecial();
      fxKit.triggerScreenShake(container, 5, 200);
    }
  };

  // Keyboard controls
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') moveLeft = true;
    if (e.key === 'd' || e.key === 'ArrowRight') moveRight = true;
    if (e.code === 'Space') tossTray();
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') moveLeft = false;
    if (e.key === 'd' || e.key === 'ArrowRight') moveRight = false;
  };

  // Pointer / Drag control
  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    chefX = Math.max(chefWidth / 2, Math.min(canvas.width - chefWidth / 2, mx));
  };

  const onTouchMove = (e: TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = (touch.clientX - rect.left) * (canvas.width / rect.width);
    chefX = Math.max(chefWidth / 2, Math.min(canvas.width - chefWidth / 2, mx));
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('touchmove', onTouchMove);

  audioManager.startMusic('battle');

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // Chef movement via keyboard
    if (moveLeft) chefX = Math.max(chefWidth / 2, chefX - 600 * dt);
    if (moveRight) chefX = Math.min(canvas.width - chefWidth / 2, chefX + 600 * dt);

    // Spawning Falling Ingredients
    spawnTimer += dt;
    const spawnRate = Math.max(0.45, 1.2 - currentLevel * 0.02);
    if (spawnTimer >= spawnRate) {
      spawnTimer = 0;
      const types: IngredientType[] = [
        'bun_bottom',
        'patty',
        'cheese',
        'lettuce',
        'tomato',
        'bun_top',
        'hazard',
      ];
      const picked = types[Math.floor(Math.random() * types.length)];
      fallingItems.push({
        x: 80 + Math.random() * (canvas.width - 160),
        y: -30,
        vy: 180 + currentLevel * 12 + Math.random() * 40,
        type: picked,
      });
    }

    // Update falling items & check catches
    const expectedIngredient = currentOrder[caughtStack.length];

    for (let i = fallingItems.length - 1; i >= 0; i--) {
      const item = fallingItems[i];
      item.y += item.vy * dt;

      // Tray collision check
      const trayTopY = chefY - 20 - caughtStack.length * 12;
      if (
        item.y >= trayTopY - 15 &&
        item.y <= trayTopY + 15 &&
        item.x >= chefX - chefWidth / 2 &&
        item.x <= chefX + chefWidth / 2
      ) {
        // CATCH EVENT
        fallingItems.splice(i, 1);

        if (item.type === expectedIngredient) {
          // CORRECT INGREDIENT!
          caughtStack.push(item.type);
          score += 150 * currentLevel;
          audioManager.playPunchPOW();

          // Check if burger order is complete!
          if (caughtStack.length === currentOrder.length) {
            ordersDelivered++;
            score += 1000 * currentLevel;
            customerEmoji = '🤩';
            emojiTimer = 1.5;
            audioManager.playVictoryFanfare();
            fxKit.triggerLightningFlash(api.flashRef.current, '#B6FF3C');

            if (currentLevel >= maxLevels) {
              api.triggerVictory(score, currentLevel);
              return;
            } else {
              currentLevel++;
              currentOrder = generateOrder(currentLevel);
              caughtStack = [];
            }
          }
        } else {
          // WRONG ITEM / HAZARD -> COMIC EXPLOSION!
          strikes++;
          customerEmoji = '😡';
          emojiTimer = 2.0;
          explosionTimer = 0.5;
          explosionX = chefX;
          explosionY = chefY - 20;

          audioManager.playComboBoom();
          fxKit.triggerScreenShake(container, 12, 400);
          caughtStack = [];

          if (strikes >= maxStrikes) {
            saveManager.save('chef-panic', { highestLevel: currentLevel, highScore: score });
            api.triggerGameOver(score, currentLevel);
            return;
          }
        }
        continue;
      }

      // Despawn off bottom
      if (item.y > canvas.height + 40) {
        fallingItems.splice(i, 1);
      }
    }

    // Update timers
    if (explosionTimer > 0) explosionTimer -= dt;
    if (emojiTimer > 0) {
      emojiTimer -= dt;
      if (emojiTimer <= 0) customerEmoji = '😀';
    }

    // --- DRAWING ---
    ctx.fillStyle = '#07080F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Kitchen Counter Neon Horizon
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00F0FF';
    ctx.beginPath();
    ctx.moveTo(0, chefY + 25);
    ctx.lineTo(canvas.width, chefY + 25);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Top Order Ticket Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.fillRect(canvas.width / 2 - 240, 20, 480, 70);
    ctx.strokeRect(canvas.width / 2 - 240, 20, 480, 70);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`ORDER TICKET #${ordersDelivered + 1}`, canvas.width / 2 - 225, 42);

    // Draw Ticket Target Ingredients
    const ticketStartX = canvas.width / 2 - 220;
    currentOrder.forEach((ing, idx) => {
      const isFilled = idx < caughtStack.length;
      ctx.font = '24px sans-serif';
      ctx.fillText(INGREDIENTS[ing].emoji, ticketStartX + idx * 45, 75);

      if (isFilled) {
        ctx.fillStyle = '#B6FF3C';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('✓', ticketStartX + idx * 45 + 8, 88);
      }
    });

    // Customer Reaction Box
    ctx.font = '36px sans-serif';
    ctx.fillText(customerEmoji, canvas.width / 2 + 190, 65);

    // Draw Falling Ingredients
    fallingItems.forEach((item) => {
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(INGREDIENTS[item.type].emoji, item.x, item.y);
    });

    // Draw Chef & Tray
    ctx.fillStyle = '#FFFFFF';
    // Chef Body
    ctx.fillStyle = '#00F0FF';
    ctx.fillRect(chefX - 20, chefY - 10, 40, 35);
    // Chef Toque Hat
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(chefX - 16, chefY - 30, 32, 20);

    // Silver Tray
    ctx.fillStyle = '#E2E8F0';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 8;
    ctx.fillRect(chefX - chefWidth / 2, chefY - 20, chefWidth, 8);
    ctx.shadowBlur = 0;

    // Draw Current Caught Burger Stack on Tray
    caughtStack.forEach((ing, idx) => {
      const stackY = chefY - 30 - idx * 14;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(INGREDIENTS[ing].emoji, chefX, stackY);
    });

    // Comic Explosion on Wrong Catch
    if (explosionTimer > 0) {
      ctx.fillStyle = '#FF2E9A';
      ctx.font = 'bold 28px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💥 WRONG RECIPE! 💥', explosionX, explosionY - 40);
    }

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`STAGE: ${currentLevel} / ${maxLevels}`, 30, 40);
    ctx.fillStyle = '#00F0FF';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 30, 65);

    // Strikes Display (3 Red X marks)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FF2E9A';
    ctx.font = 'bold 14px Orbitron, sans-serif';
    let strikeText = '';
    for (let i = 0; i < maxStrikes; i++) {
      strikeText += i < strikes ? '❌ ' : '⭕ ';
    }
    ctx.fillText(`STRIKES: ${strikeText}`, canvas.width - 30, 40);

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('touchmove', onTouchMove);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
