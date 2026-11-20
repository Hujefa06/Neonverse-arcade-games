import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/HUJAIFA/.gemini/antigravity/brain/86b43231-6363-4828-956a-49f095493c82';

async function runStage1Tests() {
  console.log('🚀 Starting Automated In-Browser Verification for Stage 1 (Game Registry & Unified API)...');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const errors: string[] = [];
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      // Ignore normal informational/warning messages or favicon 404s
      if (type === 'error' && !text.includes('favicon.ico')) {
        console.error(`[Browser Console ERROR] ${text}`);
        errors.push(text);
      }
    });

    page.on('pageerror', (err) => {
      console.error(`[Browser Unhandled Exception] ${err.message}`);
      errors.push(err.message);
    });

    // 1. Verify Vite proxy to API
    console.log('📡 Testing API Proxy from frontend (/api/health & /api/games)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    const healthJson = await page.evaluate(async () => {
      const res = await fetch('/api/health');
      return await res.json();
    });
    console.log('   /api/health:', healthJson);
    if (healthJson.gamesCount !== 24) {
      throw new Error(`Expected 24 games in health check, got ${healthJson.gamesCount}`);
    }

    const gamesJson = await page.evaluate(async () => {
      const res = await fetch('/api/games');
      return await res.json();
    });
    console.log(`   /api/games count: ${gamesJson.count}`);
    if (gamesJson.count !== 24) {
      throw new Error(`Expected 24 games in /api/games, got ${gamesJson.count}`);
    }

    // 2. Desktop Test: Homepage (1440x900)
    console.log('🖥️ Testing Desktop Homepage (1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');

    // Screenshot Desktop Home
    const desktopHomeShot = path.join(ARTIFACT_DIR, 'stage1_desktop_home.png');
    await page.screenshot({ path: desktopHomeShot, fullPage: false });
    console.log(`   Desktop Home screenshot saved: ${desktopHomeShot}`);

    // Check game cards rendered
    const gameCards = await page.$$('a[href^="/play/"], a[href^="/game/"]');
    console.log(`   Found ${gameCards.length} game cards rendered on homepage`);
    if (gameCards.length === 0) {
      throw new Error('No game cards rendered on homepage');
    }

    // 3. Desktop Test: Navigate to Game Page (TypeStrike Arena)
    console.log('🎮 Testing Desktop Game Page (typestrike-arena)...');
    await page.goto('http://localhost:5173/game/typestrike-arena', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));

    const gamePageShot = path.join(ARTIFACT_DIR, 'stage1_desktop_gamepage.png');
    await page.screenshot({ path: gamePageShot, fullPage: false });
    console.log(`   Desktop Game Page screenshot saved: ${gamePageShot}`);

    // Check leaderboards tab
    console.log('🏆 Testing Leaderboard Tab on Game Page...');
    const lbBtn = await page.$('button::-p-text(LEADERBOARDS), button::-p-text(LEADERBOARD)');
    if (lbBtn) {
      await lbBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      const lbShot = path.join(ARTIFACT_DIR, 'stage1_game_leaderboard.png');
      await page.screenshot({ path: lbShot, fullPage: false });
      console.log(`   Leaderboard screenshot saved: ${lbShot}`);
    }

    // 4. Mobile Emulation: Pixel 7 (390x844)
    console.log('📱 Testing Mobile Emulation (390x844 Pixel 7)...');
    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    const mobileHomeShot = path.join(ARTIFACT_DIR, 'stage1_mobile_home.png');
    await page.screenshot({ path: mobileHomeShot, fullPage: false });
    console.log(`   Mobile Home screenshot saved: ${mobileHomeShot}`);

    // Navigate to game on mobile
    await page.goto('http://localhost:5173/game/typestrike-arena', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));

    const mobileGameShot = path.join(ARTIFACT_DIR, 'stage1_mobile_game.png');
    await page.screenshot({ path: mobileGameShot, fullPage: false });
    console.log(`   Mobile Game screenshot saved: ${mobileGameShot}`);

    // 5. Test Co-Op Flagship Tethered Route
    console.log('🔗 Testing Flagship Co-op (tethered)...');
    await page.goto('http://localhost:5173/game/tethered', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1000));
    const tetheredShot = path.join(ARTIFACT_DIR, 'stage1_tethered_coop.png');
    await page.screenshot({ path: tetheredShot, fullPage: false });
    console.log(`   Tethered screenshot saved: ${tetheredShot}`);

    console.log('\n📊 Stage 1 Test Summary:');
    console.log(`   Total Console Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error('   Errors detected:', errors);
      throw new Error(`Stage 1 failed with ${errors.length} console errors`);
    } else {
      console.log('   ✅ Stage 1 Automated Verification PASSED with ZERO console errors!');
    }
  } finally {
    await browser.close();
  }
}

runStage1Tests().catch((err) => {
  console.error('❌ Stage 1 Verification Failed:', err);
  process.exit(1);
});
