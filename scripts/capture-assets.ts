import puppeteer, { Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { GAME_REGISTRY } from '../src/games/registry';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const GAMES_ASSETS_DIR = path.join(ASSETS_DIR, 'games');
const BG_ASSETS_DIR = path.join(ASSETS_DIR, 'bg');
const ARTIFACT_DIR = 'C:/Users/HUJAIFA/.gemini/antigravity/brain/86b43231-6363-4828-956a-49f095493c82';

// Ensure required asset folders exist
function ensureDirs() {
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
  if (!fs.existsSync(GAMES_ASSETS_DIR)) fs.mkdirSync(GAMES_ASSETS_DIR, { recursive: true });
  if (!fs.existsSync(BG_ASSETS_DIR)) fs.mkdirSync(BG_ASSETS_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

// Procedural high-res SVG neon artwork generator (fallback / bespoke generator)
function generateNeonArtSvg(game: typeof GAME_REGISTRY[0], width: number, height: number, shotIndex = 0): string {
  const accent = game.accentColor || '#00F0FF';
  const secondary = game.category === 'Action' ? '#FF2E9A' : game.category === 'Puzzle' ? '#B6FF3C' : '#7C4DFF';

  // Seeded variation based on shotIndex
  const waveOffset = shotIndex * 40;
  const orbScale = 1 + shotIndex * 0.15;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad-core" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
          <stop offset="50%" stop-color="${secondary}" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#07080F" stop-opacity="0.95"/>
        </radialGradient>
        <linearGradient id="grid-fade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="transparent"/>
          <stop offset="100%" stop-color="${accent}" stop-opacity="0.25"/>
        </linearGradient>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Dark Cosmic Backdrop -->
      <rect width="100%" height="100%" fill="#07080F"/>
      <rect width="100%" height="100%" fill="url(#grad-core)"/>

      <!-- Perspective Retro-Synth Grid -->
      <g stroke="${accent}" stroke-opacity="0.15" stroke-width="1.5">
        ${Array.from({ length: 14 }).map((_, i) => {
          const y = height * 0.55 + Math.pow(i / 13, 1.8) * (height * 0.45);
          return `<line x1="0" y1="${y}" x2="${width}" y2="${y}"/>`;
        }).join('')}
        ${Array.from({ length: 17 }).map((_, i) => {
          const x = (i / 16) * width;
          return `<line x1="${width / 2}" y1="${height * 0.55}" x2="${x}" y2="${height}"/>`;
        }).join('')}
      </g>

      <!-- Ambient Glow Orbs -->
      <circle cx="${width * 0.25}" cy="${height * 0.35 + waveOffset * 0.5}" r="${80 * orbScale}" fill="${secondary}" opacity="0.18" filter="url(#neon-glow)"/>
      <circle cx="${width * 0.75}" cy="${height * 0.3 - waveOffset * 0.3}" r="${90 * orbScale}" fill="${accent}" opacity="0.18" filter="url(#neon-glow)"/>

      <!-- Geometric Game-Specific Iconography -->
      <g transform="translate(${width / 2}, ${height * 0.42})">
        <circle r="64" fill="none" stroke="${accent}" stroke-width="3" filter="url(#neon-glow)"/>
        <circle r="76" fill="none" stroke="${secondary}" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.75"/>
        <polygon points="0,-45 39,22 -39,22" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.85"/>
        <text y="16" font-family="'Orbitron', sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle" filter="url(#neon-glow)">
          ${game.title.split(' ')[0].toUpperCase()}
        </text>
      </g>

      <!-- Bottom Cyber Accent Strip -->
      <rect x="0" y="${height - 6}" width="${width}" height="6" fill="${accent}"/>
      <text x="${width / 2}" y="${height - 24}" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="14" fill="#E2E8F0" text-anchor="middle" letter-spacing="4">
        ${game.category.toUpperCase()} • 60 FPS ARCADE
      </text>
    </svg>
  `;
}

// Background Generator (Hero and Categories)
function generateBackgroundSvg(type: string, width = 1920, height = 1080): string {
  if (type === 'hero') {
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sky-grad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#1B0E38"/>
            <stop offset="60%" stop-color="#0B0E1A"/>
            <stop offset="100%" stop-color="#07080F"/>
          </radialGradient>
          <linearGradient id="neon-cyan-fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#00F0FF" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="neon-magenta-fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FF2E9A" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#FF2E9A" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#sky-grad)"/>

        <!-- Distant Cyber City Skyline Silhouettes -->
        <g fill="#0E1222">
          ${Array.from({ length: 28 }).map((_, i) => {
            const w = 45 + ((i * 37) % 55);
            const h = 200 + ((i * 53) % 320);
            const x = i * 70;
            const y = height * 0.65 - h;
            return `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
          }).join('')}
        </g>

        <!-- Midground Glowing Skyscrapers with Neon Windows -->
        <g fill="#141A32">
          ${Array.from({ length: 20 }).map((_, i) => {
            const w = 60 + ((i * 47) % 75);
            const h = 260 + ((i * 61) % 380);
            const x = i * 100 - 30;
            const y = height * 0.65 - h;
            const color = i % 2 === 0 ? '#00F0FF' : '#FF2E9A';
            return `
              <rect x="${x}" y="${y}" width="${w}" height="${h}"/>
              <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${height * 0.65}" stroke="${color}" stroke-opacity="0.25" stroke-dasharray="3 9"/>
            `;
          }).join('')}
        </g>

        <!-- Laser Searchlights Sweeping Sky -->
        <line x1="${width * 0.3}" y1="${height * 0.65}" x2="${width * 0.15}" y2="0" stroke="url(#neon-cyan-fade)" stroke-width="4"/>
        <line x1="${width * 0.7}" y1="${height * 0.65}" x2="${width * 0.85}" y2="0" stroke="url(#neon-magenta-fade)" stroke-width="4"/>

        <!-- Retro Horizon Grid -->
        <g stroke="#00F0FF" stroke-opacity="0.22" stroke-width="2">
          ${Array.from({ length: 15 }).map((_, i) => {
            const y = height * 0.65 + Math.pow(i / 14, 2) * (height * 0.35);
            return `<line x1="0" y1="${y}" x2="${width}" y2="${y}"/>`;
          }).join('')}
          ${Array.from({ length: 25 }).map((_, i) => {
            const x = (i / 24) * width;
            return `<line x1="${width / 2}" y1="${height * 0.65}" x2="${x}" y2="${height}"/>`;
          }).join('')}
        </g>

        <!-- Glowing Horizon Burst -->
        <ellipse cx="${width / 2}" cy="${height * 0.65}" rx="${width * 0.4}" ry="35" fill="#FF2E9A" opacity="0.3" filter="blur(20px)"/>
        <ellipse cx="${width / 2}" cy="${height * 0.65}" rx="${width * 0.25}" ry="15" fill="#00F0FF" opacity="0.4" filter="blur(15px)"/>
      </svg>
    `;
  }

  // Category specific backgrounds
  const categoryThemes: Record<string, { c1: string; c2: string; motif: string }> = {
    action: { c1: '#FF2E9A', c2: '#FF6B6B', motif: 'streaks' },
    arcade: { c1: '#00F0FF', c2: '#7C4DFF', motif: 'grid' },
    puzzle: { c1: '#B6FF3C', c2: '#00F0FF', motif: 'hexagons' },
    typing: { c1: '#00F0FF', c2: '#38EF7D', motif: 'matrix' },
    physics: { c1: '#FF9E00', c2: '#FF2E9A', motif: 'orbits' },
    chill: { c1: '#7C4DFF', c2: '#38EF7D', motif: 'nebula' },
    rhythm: { c1: '#7C4DFF', c2: '#FF2E9A', motif: 'equalizer' },
    coop: { c1: '#00F0FF', c2: '#FF2E9A', motif: 'tether' },
  };

  const theme = categoryThemes[type] || { c1: '#00F0FF', c2: '#7C4DFF', motif: 'grid' };

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cat-core" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="${theme.c1}" stop-opacity="0.25"/>
          <stop offset="50%" stop-color="${theme.c2}" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#07080F" stop-opacity="0.98"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="#07080F"/>
      <rect width="100%" height="100%" fill="url(#cat-core)"/>

      <!-- Ambient Glows -->
      <circle cx="${width * 0.2}" cy="${height * 0.3}" r="220" fill="${theme.c1}" opacity="0.12" filter="blur(50px)"/>
      <circle cx="${width * 0.8}" cy="${height * 0.7}" r="260" fill="${theme.c2}" opacity="0.12" filter="blur(60px)"/>

      <!-- Abstract Thematic Geometry -->
      <g stroke="${theme.c1}" stroke-opacity="0.18" stroke-width="1.5">
        ${Array.from({ length: 8 }).map((_, i) => {
          const cx = width * (0.15 + (i * 0.1));
          const cy = height * (0.2 + ((i % 3) * 0.25));
          return `<circle cx="${cx}" cy="${cy}" r="${40 + i * 8}" fill="none"/>`;
        }).join('')}
      </g>
    </svg>
  `;
}

async function renderSvgToWebp(page: Page, svgString: string, outputPath: string, width: number, height: number) {
  await page.setViewport({ width, height });
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  await page.goto(dataUrl, { waitUntil: 'networkidle0' });
  await page.screenshot({
    path: outputPath,
    type: 'webp',
    quality: 85,
  });
}

async function captureAllAssets() {
  console.log('🎨 Launching Automated Asset Pipeline for Neonverse Arcade v2...');
  ensureDirs();

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    // 1. Generate Platform Backgrounds
    console.log('🌌 Generating Platform Backgrounds (WebP)...');
    const heroSvg = generateBackgroundSvg('hero', 1920, 1080);
    const heroPath = path.join(BG_ASSETS_DIR, 'hero-cityscape.webp');
    await renderSvgToWebp(page, heroSvg, heroPath, 1920, 1080);
    fs.copyFileSync(heroPath, path.join(ARTIFACT_DIR, 'hero-cityscape.webp'));
    console.log(`   Saved: ${heroPath}`);

    const categories = ['action', 'arcade', 'puzzle', 'typing', 'physics', 'chill', 'rhythm', 'coop'];
    for (const cat of categories) {
      const catSvg = generateBackgroundSvg(cat, 1200, 800);
      const catPath = path.join(BG_ASSETS_DIR, `cat-${cat}.webp`);
      await renderSvgToWebp(page, catSvg, catPath, 1200, 800);
      console.log(`   Saved category BG: ${catPath}`);
    }

    // 2. Capture / Generate Rich Art for all 24 Games
    console.log(`\n🎮 Processing Assets for ${GAME_REGISTRY.length} Games...`);

    for (let i = 0; i < GAME_REGISTRY.length; i++) {
      const game = GAME_REGISTRY[i];
      const gameDir = path.join(GAMES_ASSETS_DIR, game.slug);
      if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });

      const thumbPath = path.join(gameDir, 'thumb.webp');
      const shot1Path = path.join(gameDir, 'shot1.webp');
      const shot2Path = path.join(gameDir, 'shot2.webp');
      const shot3Path = path.join(gameDir, 'shot3.webp');

      console.log(`[${i + 1}/${GAME_REGISTRY.length}] Capturing: ${game.title} (${game.slug})...`);

      let capturedFromCanvas = false;

      try {
        // Attempt live canvas gameplay capture
        await page.setViewport({ width: 960, height: 600 });
        await page.goto(`http://localhost:5173/play/${game.slug}`, { waitUntil: 'networkidle0', timeout: 7000 });
        const canvas = await page.waitForSelector('canvas', { timeout: 3500 });

        if (canvas) {
          // Send responsive input simulation to wake game particles & entities
          await page.keyboard.press('ArrowRight');
          await page.keyboard.press('Space');
          await new Promise((r) => setTimeout(r, 400));

          // Capture shot 1 (Action)
          await canvas.screenshot({ path: shot1Path, type: 'webp', quality: 85 });

          // Further simulation
          await page.keyboard.press('ArrowUp');
          await page.keyboard.press('Space');
          await new Promise((r) => setTimeout(r, 400));
          await canvas.screenshot({ path: shot2Path, type: 'webp', quality: 85 });

          await page.keyboard.press('Enter');
          await new Promise((r) => setTimeout(r, 400));
          await canvas.screenshot({ path: shot3Path, type: 'webp', quality: 85 });

          // Capture thumbnail (640x400)
          await page.setViewport({ width: 640, height: 400 });
          await new Promise((r) => setTimeout(r, 300));
          const thumbCanvas = await page.$('canvas');
          if (thumbCanvas) {
            await thumbCanvas.screenshot({ path: thumbPath, type: 'webp', quality: 85 });
          } else {
            await canvas.screenshot({ path: thumbPath, type: 'webp', quality: 85 });
          }

          capturedFromCanvas = true;
          console.log(`   Captured 3 action shots + thumb from live game engine!`);
        }
      } catch (e: any) {
        console.warn(`   Live canvas capture skipped/timed out for ${game.slug} (${e.message}). Using bespoke high-res procedural artwork generator.`);
      }

      // Procedural fallback / key art generation if live capture didn't produce all files
      if (!capturedFromCanvas || !fs.existsSync(thumbPath)) {
        const thumbSvg = generateNeonArtSvg(game, 640, 400, 0);
        await renderSvgToWebp(page, thumbSvg, thumbPath, 640, 400);

        const shot1Svg = generateNeonArtSvg(game, 960, 600, 1);
        await renderSvgToWebp(page, shot1Svg, shot1Path, 960, 600);

        const shot2Svg = generateNeonArtSvg(game, 960, 600, 2);
        await renderSvgToWebp(page, shot2Svg, shot2Path, 960, 600);

        const shot3Svg = generateNeonArtSvg(game, 960, 600, 3);
        await renderSvgToWebp(page, shot3Svg, shot3Path, 960, 600);
        console.log(`   Rendered high-res procedural key art (thumb + 3 shots)!`);
      }

      // Copy a couple samples to artifact directory for presentation
      if (i === 0 || i === 1 || i === 2) {
        fs.copyFileSync(thumbPath, path.join(ARTIFACT_DIR, `stage2_${game.slug}_thumb.webp`));
        fs.copyFileSync(shot1Path, path.join(ARTIFACT_DIR, `stage2_${game.slug}_shot1.webp`));
      }
    }

    console.log('\n✨ Asset pipeline completed successfully for all 24 games and backgrounds!');
  } finally {
    await browser.close();
  }
}

captureAllAssets().catch((err) => {
  console.error('Asset capture pipeline failed:', err);
  process.exit(1);
});
