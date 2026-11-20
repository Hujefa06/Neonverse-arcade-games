import puppeteer from 'puppeteer';

async function runStage1Verification() {
  console.log('=== STAGE 1 VERIFICATION ===\n');

  // 1. Verify Express API Direct Endpoint
  console.log('1. Checking Express API Direct (http://localhost:3001)...');
  const healthRes = await fetch('http://localhost:3001/api/health');
  const healthData = await healthRes.json();
  console.log('   /api/health status:', healthData.status);
  console.log('   /api/health gamesCount:', healthData.gamesCount);

  const gamesRes = await fetch('http://localhost:3001/api/games');
  const gamesData = await gamesRes.json();
  console.log('   /api/games count:', gamesData.count);
  console.log('   /api/games games array length:', gamesData.games.length);

  if (gamesData.games.length !== 24) {
    throw new Error(`Expected 24 games from /api/games, got ${gamesData.games.length}`);
  }

  // 2. Verify Vite Proxy (http://localhost:5173/api/games)
  console.log('\n2. Checking Vite Proxy (http://localhost:5173/api/games)...');
  const proxyGamesRes = await fetch('http://localhost:5173/api/games');
  const proxyGamesData = await proxyGamesRes.json();
  console.log('   Proxy /api/games length:', proxyGamesData.games.length);
  if (proxyGamesData.games.length !== 24) {
    throw new Error(`Vite proxy failed to return 24 games, got ${proxyGamesData.games.length}`);
  }

  // 3. In-Browser Verification with Puppeteer (Console Error Check)
  console.log('\n3. Starting Puppeteer In-Browser QA Check...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const errors: string[] = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) {
        console.error('   [BROWSER CONSOLE ERROR]:', msg.text());
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      console.error('   [BROWSER UNHANDLED EXCEPTION]:', err.message);
      errors.push(err.message);
    });

    // A. Check Homepage
    console.log('   Navigating to Homepage (http://localhost:5173)...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('main', { timeout: 10000 });

    // Verify game cards are rendered
    const cards = await page.$$('[data-testid="game-card"], a[href^="/play/"]');
    console.log(`   Homepage rendered ${cards.length} game links/cards.`);
    if (cards.length === 0) {
      throw new Error('Homepage did not render any game cards!');
    }

    // B. Check Category Page
    console.log('   Navigating to Category Page (/category/Action)...');
    await page.goto('http://localhost:5173/category/Action', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('main', { timeout: 10000 });
    const actionCards = await page.$$('a[href^="/play/"]');
    console.log(`   Category Action rendered ${actionCards.length} games.`);
    if (actionCards.length === 0) {
      throw new Error('Category Action did not render any game cards!');
    }

    // C. Check Game Page
    console.log('   Navigating to Game Page (/play/typestrike-arena)...');
    await page.goto('http://localhost:5173/play/typestrike-arena', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('canvas', { timeout: 15000 });
    console.log('   Game canvas mounted successfully.');

    // Settle time for any lingering events
    await new Promise((r) => setTimeout(r, 1000));

    console.log('\n=== SUMMARY ===');
    console.log('API /api/games count:', gamesData.games.length, '(PASS)');
    console.log('Vite Proxy /api/games count:', proxyGamesData.games.length, '(PASS)');
    console.log('Console errors encountered:', errors.length);

    if (errors.length > 0) {
      throw new Error(`Verification failed with ${errors.length} console errors`);
    } else {
      console.log('✅ ALL STAGE 1 CHECKS PASSED WITH ZERO CONSOLE ERRORS!');
    }
  } finally {
    await browser.close();
  }
}

runStage1Verification().catch((err) => {
  console.error('❌ Stage 1 Verification Failed:', err);
  process.exit(1);
});
