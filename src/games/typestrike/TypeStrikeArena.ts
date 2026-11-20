import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';

interface EnemyFighter {
  name: string;
  maxHp: number;
  hp: number;
  isBoss: boolean;
  color: string;
}

export function mountTypeStrikeArena(
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

  // Hidden input for mobile keyboard activation
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'text';
  hiddenInput.autocomplete = 'off';
  hiddenInput.autocapitalize = 'off';
  hiddenInput.spellcheck = false;
  hiddenInput.style.position = 'absolute';
  hiddenInput.style.opacity = '0';
  hiddenInput.style.pointerEvents = 'none';
  hiddenInput.style.top = '-9999px';
  hiddenInput.style.left = '-9999px';
  container.appendChild(hiddenInput);

  const focusInput = () => {
    hiddenInput.focus();
  };
  canvas.addEventListener('click', focusInput);
  canvas.addEventListener('touchstart', focusInput);

  // Word & Sentence Banks
  const WORDS_EASY = [
    'HIT', 'KICK', 'POW', 'FAST', 'SWAP', 'DASH', 'BOLT', 'RUSH', 'NEON',
    'FIST', 'BLOW', 'FLEX', 'STRIKE', 'BLADE', 'QUICK', 'SURGE', 'SPARK'
  ];
  const WORDS_MED = [
    'THUNDER', 'CYBER', 'VELOCITY', 'DYNAMIC', 'COUNTER', 'REFLEX',
    'VOLTAGE', 'SHADOW', 'PULSING', 'KINETIC', 'WARRIOR', 'OVERLOAD'
  ];
  const SENTENCES = [
    'STRIKE LIKE THUNDER',
    'THE BLADE NEVER BLINKS',
    'MAXIMUM OVERDRIVE ATTACK',
    'SWIFT AS DIGITAL LIGHT',
    'SHATTER THE ENERGY SHIELD'
  ];
  const DANGER_PHRASES = [
    'BLOCK NOW',
    'DEFLECT BLOW',
    'ENERGY SHIELD',
    'PARRY ATTACK'
  ];

  // Game State
  let currentLevel = 1;
  const maxLevels = 10;
  let score = 0;
  let playerHp = 100;
  let playerMaxHp = 100;
  let currentStreak = 0;
  let comboMeter = 0; // 0 to 5
  let totalWordsTyped = 0;
  let correctKeystrokes = 0;
  let totalKeystrokes = 0;
  let startTime = Date.now();
  let liveWpm = 0;
  let timeScale = 1.0;

  // Active Target Word
  let currentTarget = '';
  let typedIndex = 0;
  let isDangerCounter = false;
  let dangerTimer = 0;
  const dangerMaxTime = 4.0; // 4 seconds to block

  // Animation & Visuals
  let animId: number;
  let playerAnimState: 'idle' | 'punch' | 'slash' | 'block' | 'hurt' = 'idle';
  let enemyAnimState: 'idle' | 'punch' | 'block' | 'hurt' = 'idle';
  let animTimer = 0;
  let lastTime = performance.now();

  // Floating Combat Sparks
  interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
  }
  let sparks: Spark[] = [];

  const spawnSparks = (x: number, y: number, color = '#00F0FF', count = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
      });
    }
  };

  // Setup Level Enemy
  const setupEnemy = (lvl: number): EnemyFighter => {
    if (lvl === 3) {
      return { name: 'RONIN VIPER', maxHp: 180, hp: 180, isBoss: true, color: '#FF2E9A' };
    } else if (lvl === 7) {
      return { name: 'CYBER TITAN', maxHp: 280, hp: 280, isBoss: true, color: '#7C4DFF' };
    } else if (lvl === 10) {
      return { name: 'MECHA SHOGUN', maxHp: 420, hp: 420, isBoss: true, color: '#FFB800' };
    }
    return {
      name: `GLADIATOR MK-${lvl}`,
      maxHp: 80 + lvl * 20,
      hp: 80 + lvl * 20,
      isBoss: false,
      color: '#00F0FF',
    };
  };

  let enemy = setupEnemy(currentLevel);

  // Start music
  if (enemy.isBoss) {
    audioManager.startMusic('boss');
  } else {
    audioManager.startMusic('battle');
  }

  // Pick Next Target
  const pickNewTarget = () => {
    typedIndex = 0;
    // Chance of red danger counterattack from enemies
    const dangerChance = enemy.isBoss ? 0.35 : 0.2;
    if (Math.random() < dangerChance) {
      isDangerCounter = true;
      dangerTimer = dangerMaxTime;
      currentTarget = DANGER_PHRASES[Math.floor(Math.random() * DANGER_PHRASES.length)];
      return;
    }

    isDangerCounter = false;
    if (currentLevel >= 4 && Math.random() < 0.4) {
      currentTarget = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
    } else if (currentLevel >= 3) {
      currentTarget = WORDS_MED[Math.floor(Math.random() * WORDS_MED.length)];
    } else {
      currentTarget = WORDS_EASY[Math.floor(Math.random() * WORDS_EASY.length)];
    }
  };

  pickNewTarget();

  // Weapon Evolution calculation based on live WPM
  const getWeaponType = (wpm: number) => {
    if (wpm >= 75) return { name: 'PLASMA BLADE', color: '#00F0FF', dmgMult: 2.2 };
    if (wpm >= 50) return { name: 'CYBER KATANA', color: '#B6FF3C', dmgMult: 1.7 };
    if (wpm >= 30) return { name: 'STEEL TONFA', color: '#FFB800', dmgMult: 1.3 };
    return { name: 'BARE FISTS', color: '#FFFFFF', dmgMult: 1.0 };
  };

  // Keyboard Typing Listener
  const onKeyDown = (e: KeyboardEvent) => {
    if (playerHp <= 0 || enemy.hp <= 0) return;

    // Trigger Ultimate on Enter if Combo is Full
    if (e.key === 'Enter') {
      if (comboMeter >= 5) {
        triggerComboUltimate();
      }
      return;
    }

    // Single character typing test
    if (e.key.length !== 1) return;

    totalKeystrokes++;
    const expectedChar = currentTarget[typedIndex];

    if (e.key.toUpperCase() === expectedChar.toUpperCase()) {
      // Correct keystroke!
      correctKeystrokes++;
      typedIndex++;
      audioManager.playKeystrokeTick();

      // Recalculate WPM
      const mins = Math.max(0.05, (Date.now() - startTime) / 60000);
      liveWpm = Math.round((correctKeystrokes / 5) / mins);

      // Check if current word/sentence is completed
      if (typedIndex >= currentTarget.length) {
        onTargetCompleted();
      }
    } else {
      // Typo! Streak resets
      currentStreak = 0;
      comboMeter = Math.max(0, comboMeter - 1);
      audioManager.playUiClick();
      fxKit.triggerScreenShake(container, 3, 150);
    }
  };

  window.addEventListener('keydown', onKeyDown);

  // Hidden input listener for mobile software keyboard
  hiddenInput.addEventListener('input', (e: any) => {
    const val = hiddenInput.value;
    if (val.length > 0) {
      const char = val[val.length - 1];
      onKeyDown(new KeyboardEvent('keydown', { key: char }));
      hiddenInput.value = '';
    }
  });

  const onTargetCompleted = () => {
    totalWordsTyped++;
    currentStreak++;
    comboMeter = Math.min(5, comboMeter + 1);

    const weapon = getWeaponType(liveWpm);
    const isSentence = currentTarget.includes(' ');

    if (isDangerCounter) {
      // BLOCKED ENEMY COUNTER!
      audioManager.playSlashSpecial();
      playerAnimState = 'block';
      enemyAnimState = 'hurt';
      animTimer = 0.3;
      spawnSparks(600, 270, '#B6FF3C', 20);
      score += 250 * currentLevel;
    } else if (isSentence) {
      // SENTENCE SLASH SPECIAL!
      audioManager.playSlashSpecial();
      playerAnimState = 'slash';
      enemyAnimState = 'hurt';
      animTimer = 0.4;
      fxKit.triggerScreenShake(container, 9, 300);
      fxKit.triggerLightningFlash(api.flashRef.current, '#00F0FF');
      spawnSparks(650, 270, '#00F0FF', 30);

      const dmg = Math.round(55 * weapon.dmgMult);
      enemy.hp = Math.max(0, enemy.hp - dmg);
      score += 500 * currentLevel;
    } else {
      // NORMAL WORD PUNCH (POW!)
      audioManager.playPunchPOW();
      playerAnimState = 'punch';
      enemyAnimState = 'hurt';
      animTimer = 0.25;
      fxKit.triggerScreenShake(container, 5, 200);
      spawnSparks(630, 270, '#FF2E9A', 15);

      const dmg = Math.round(25 * weapon.dmgMult);
      enemy.hp = Math.max(0, enemy.hp - dmg);
      score += 100 * currentLevel;
    }

    // Check if Enemy Defeated
    if (enemy.hp <= 0) {
      onEnemyDefeated();
    } else {
      pickNewTarget();
    }
  };

  const triggerComboUltimate = () => {
    comboMeter = 0;
    audioManager.playComboBoom();
    playerAnimState = 'slash';
    enemyAnimState = 'hurt';
    animTimer = 0.6;

    // Screen Shake + Slow motion hit
    fxKit.triggerScreenShake(container, 14, 500);
    fxKit.triggerLightningFlash(api.flashRef.current, '#FF2E9A');
    fxKit.applySlowMotion((ts) => {
      timeScale = ts;
    }, 0.25, 600);

    spawnSparks(650, 260, '#FF2E9A', 45);

    const ultimateDmg = 120 * currentLevel;
    enemy.hp = Math.max(0, enemy.hp - ultimateDmg);
    score += 1500 * currentLevel;

    if (enemy.hp <= 0) {
      onEnemyDefeated();
    }
  };

  const onEnemyDefeated = () => {
    audioManager.playVictoryFanfare();
    saveManager.save('typestrike-arena', { highestLevel: currentLevel, highScore: score });

    if (currentLevel >= maxLevels) {
      // Fully conquered all 10 levels
      api.triggerVictory(score, currentLevel);
    } else {
      currentLevel++;
      enemy = setupEnemy(currentLevel);
      playerHp = Math.min(100, playerHp + 30); // heal between rounds
      if (enemy.isBoss) {
        audioManager.startMusic('boss');
      } else {
        audioManager.startMusic('battle');
      }
      pickNewTarget();
    }
  };

  const onPlayerHurt = (dmg: number) => {
    playerHp = Math.max(0, playerHp - dmg);
    playerAnimState = 'hurt';
    enemyAnimState = 'punch';
    animTimer = 0.3;
    audioManager.playPunchPOW();
    fxKit.triggerScreenShake(container, 10, 350);
    spawnSparks(330, 270, '#FF2E9A', 20);

    if (playerHp <= 0) {
      api.triggerGameOver(score, currentLevel);
    }
  };

  // Main Render & Simulation Loop (Target 60 FPS)
  const render = (time: number) => {
    const dt = Math.min(0.1, (time - lastTime) / 1000) * timeScale;
    lastTime = time;

    // Handle Timers
    if (animTimer > 0) {
      animTimer -= dt;
      if (animTimer <= 0) {
        playerAnimState = 'idle';
        enemyAnimState = 'idle';
      }
    }

    // Handle Danger Counterattack Countdown
    if (isDangerCounter && playerHp > 0 && enemy.hp > 0) {
      dangerTimer -= dt;
      if (dangerTimer <= 0) {
        // Player missed block timer! Enemy strikes back!
        onPlayerHurt(25 + currentLevel * 3);
        pickNewTarget();
      }
    }

    // 1. Draw Arena Background & Cyber Grid
    ctx.fillStyle = '#07080F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid Floor
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 340);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 340; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Neon Arena Horizon Line
    const grad = ctx.createLinearGradient(0, 335, canvas.width, 335);
    grad.addColorStop(0, '#00F0FF');
    grad.addColorStop(0.5, '#FF2E9A');
    grad.addColorStop(1, '#00F0FF');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 338);
    ctx.lineTo(canvas.width, 338);
    ctx.stroke();

    // 2. Render HUD: Health Bars & WPM Weapon Evolution
    // Player Health Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(40, 25, 240, 16);
    ctx.fillStyle = '#00F0FF';
    ctx.fillRect(40, 25, (playerHp / playerMaxHp) * 240, 16);
    ctx.strokeStyle = '#00F0FF';
    ctx.strokeRect(40, 25, 240, 16);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`PLAYER [HP: ${playerHp}]`, 40, 18);

    // Enemy Health Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(canvas.width - 280, 25, 240, 16);
    ctx.fillStyle = enemy.color;
    ctx.fillRect(canvas.width - 280, 25, Math.max(0, (enemy.hp / enemy.maxHp) * 240), 16);
    ctx.strokeStyle = enemy.color;
    ctx.strokeRect(canvas.width - 280, 25, 240, 16);

    ctx.textAlign = 'right';
    ctx.fillText(`${enemy.name} [HP: ${enemy.hp}]`, canvas.width - 40, 18);

    // Center Level & WPM Indicator
    const weapon = getWeaponType(liveWpm);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFB800';
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.fillText(`STAGE ${currentLevel} / ${maxLevels}`, canvas.width / 2, 22);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = weapon.color;
    ctx.fillText(`WPM: ${liveWpm} • WEAPON: ${weapon.name}`, canvas.width / 2, 42);

    // Combo Meter (5 slots)
    ctx.fillText('COMBO CHARGE', canvas.width / 2, 60);
    const comboStartX = canvas.width / 2 - 45;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < comboMeter ? '#FF2E9A' : 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(comboStartX + i * 20, 68, 14, 8);
    }
    if (comboMeter >= 5) {
      ctx.fillStyle = '#FF2E9A';
      ctx.font = 'bold 11px Orbitron, sans-serif';
      ctx.fillText('⚡ PRESS ENTER FOR BOOM ULTIMATE! ⚡', canvas.width / 2, 92);
    }

    // 3. Render Fighters (Procedural Neon Martial Artists)
    // Player Character (Left, x: 280, y: 320)
    drawFighter(ctx, 280, 320, '#00F0FF', playerAnimState, true, weapon.color);

    // Enemy Character (Right, x: 680, y: 320)
    drawFighter(ctx, 680, 320, enemy.color, enemyAnimState, false);

    // 4. Render Active Floating Target Words
    if (currentTarget && enemy.hp > 0) {
      const bubbleX = 680;
      const bubbleY = 170;

      // Draw Danger Warning Indicator if Counterattack
      if (isDangerCounter) {
        ctx.fillStyle = '#FF2E9A';
        ctx.font = 'bold 13px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️ INCOMING COUNTER! [${dangerTimer.toFixed(1)}s]`, bubbleX, bubbleY - 24);
      }

      // Draw Word with Typed Progress Coloring
      ctx.font = 'bold 24px Orbitron, monospace';
      ctx.textAlign = 'center';

      // Measure total width
      const totalWidth = ctx.measureText(currentTarget).width;
      const startX = bubbleX - totalWidth / 2;

      let currentX = startX;
      for (let i = 0; i < currentTarget.length; i++) {
        const char = currentTarget[i];
        const isTyped = i < typedIndex;

        ctx.fillStyle = isTyped
          ? '#B6FF3C' // Green for correct typed
          : isDangerCounter
          ? '#FF2E9A' // Red for danger counter
          : '#FFFFFF'; // White for remaining

        ctx.fillText(char, currentX + ctx.measureText(char).width / 2, bubbleY);
        currentX += ctx.measureText(char).width;
      }

      // Underline / Cursor
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, bubbleY + 6);
      ctx.lineTo(startX + ctx.measureText(currentTarget.slice(0, typedIndex)).width, bubbleY + 6);
      ctx.stroke();
    }

    // 5. Render Sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= dt * 2.5;
      if (s.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.life;
      ctx.fillRect(s.x, s.y, 3, 3);
      ctx.globalAlpha = 1.0;
    }

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('click', focusInput);
    canvas.removeEventListener('touchstart', focusInput);
    if (hiddenInput.parentNode) hiddenInput.parentNode.removeChild(hiddenInput);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}

// Helper to draw procedural martial fighter
function drawFighter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  state: 'idle' | 'punch' | 'slash' | 'block' | 'hurt',
  isPlayer: boolean,
  weaponGlowColor = '#FFFFFF'
) {
  ctx.save();
  ctx.translate(x, y);
  if (!isPlayer) ctx.scale(-1, 1); // Flip enemy horizontally

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;

  // Head
  ctx.beginPath();
  ctx.arc(0, -65, 12, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Torso
  ctx.beginPath();
  ctx.moveTo(0, -53);
  ctx.lineTo(state === 'hurt' ? -10 : 0, -15);
  ctx.stroke();

  // Arms & Weapons
  if (state === 'punch') {
    // Punching forward arm
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(35, -42);
    ctx.stroke();

    // Fist burst
    ctx.fillStyle = weaponGlowColor;
    ctx.beginPath();
    ctx.arc(38, -42, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (state === 'slash') {
    // Slashing energy blade
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(25, -60);
    ctx.lineTo(50, -30);
    ctx.stroke();

    // Weapon blade arc
    ctx.strokeStyle = weaponGlowColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(20, -40, 35, -Math.PI / 3, Math.PI / 4);
    ctx.stroke();
  } else if (state === 'block') {
    // Crossed arms block stance
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(12, -48);
    ctx.lineTo(12, -25);
    ctx.stroke();
  } else if (state === 'hurt') {
    // Knocked back
    ctx.beginPath();
    ctx.moveTo(-10, -42);
    ctx.lineTo(-25, -35);
    ctx.stroke();
  } else {
    // Idle martial ready stance
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(15, -36);
    ctx.lineTo(8, -20);
    ctx.stroke();
  }

  // Legs
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(-12, 0);
  ctx.moveTo(0, -15);
  ctx.lineTo(16, 0);
  ctx.stroke();

  ctx.restore();
}
