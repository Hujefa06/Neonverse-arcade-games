import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/HUJAIFA/.gemini/antigravity/brain/86b43231-6363-4828-956a-49f095493c82';

async function runStage3Tests() {
  console.log('🚀 Starting Automated In-Browser Verification for Stage 3 (CrazyGames Redesign)...');

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
      if (type === 'error' && !text.includes('favicon.ico')) {
        console.error(`[Browser Console ERROR] ${text}`);
        errors.push(text);
      }
    });

    page.on('pageerror', (err) => {
      console.error(`[Browser Unhandled Exception] ${err.message}`);
      errors.push(err.message);
    });

    // 1. Desktop Test: CrazyGames-Style Home (1440x900)
    console.log('🖥️ Testing Desktop Homepage with CrazyGames Layout (1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));

    const homeShot = path.join(ARTIFACT_DIR, 'stage3_crazygames_desktop_home.png');
    await page.screenshot({ path: homeShot, fullPage: false });
    console.log(`   Saved home screenshot: ${homeShot}`);

    // Test Sidebar Collapse/Expand Toggle
    console.log('📑 Testing Collapsible Left Sidebar...');
    const collapseBtn = await page.$('aside button[title*="Sidebar"]');
    if (collapseBtn) {
      await collapseBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const sidebarCollapsedShot = path.join(ARTIFACT_DIR, 'stage3_sidebar_collapsed.png');
      await page.screenshot({ path: sidebarCollapsedShot, fullPage: false });
      console.log(`   Saved collapsed sidebar screenshot: ${sidebarCollapsedShot}`);
      // Re-expand
      await collapseBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    // Test Back to Top Button
    console.log('⬆️ Testing Back to Top scroll button...');
    await page.evaluate(() => window.scrollTo(0, 1000));
    await new Promise((r) => setTimeout(r, 500));
    const backToTopBtn = await page.$('button[title="Back to Top"]');
    if (backToTopBtn) {
      await backToTopBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      console.log('   Back to Top button clicked successfully!');
    }

    // Test Random Game Button in Header
    console.log('🎲 Testing Random Game Action Button...');
    const randomBtn = await page.$('button[title="Play a Random Game"]');
    if (randomBtn) {
      await randomBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
      console.log(`   Navigated to random game URL: ${page.url()}`);
      if (!page.url().includes('/play/')) {
        throw new Error('Random button did not navigate to a game');
      }
    }

    // 2. Desktop Test: Enhanced Game Page
    console.log('🎮 Testing Redesigned Game Page (Typing / TypeStrike Arena)...');
    await page.goto('http://localhost:5173/play/typestrike-arena', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));

    // Test Like Button click
    console.log('👍 Testing Like Button & Vote Reaction...');
    const likeBtn = await page.$('button:has(svg.lucide-thumbs-up)');
    if (likeBtn) {
      await likeBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }

    // Test Controls Tab Toggle (Desktop -> Mobile)
    console.log('📱 Testing Controls Tabs (Desktop vs Mobile)...');
    const mobileControlsTab = await page.$('button::-p-text(Mobile)');
    if (mobileControlsTab) {
      await mobileControlsTab.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    // Scroll down to details, FAQ and Play Next rail
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise((r) => setTimeout(r, 600));

    // Test FAQ Accordion expansion
    console.log('❓ Testing FAQ Accordion...');
    const firstFaqBtn = await page.$('button::-p-text(How does WPM)');
    if (firstFaqBtn) {
      await firstFaqBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    const gamePageEnhancedShot = path.join(ARTIFACT_DIR, 'stage3_gamepage_enhanced_details.png');
    await page.screenshot({ path: gamePageEnhancedShot, fullPage: false });
    console.log(`   Saved game page enhanced details screenshot: ${gamePageEnhancedShot}`);

    // 3. Mobile Viewport Test (Pixel 7 / 390x844)
    console.log('📱 Testing Mobile Emulation (Pixel 7 390x844)...');
    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    const mobileHomeShot = path.join(ARTIFACT_DIR, 'stage3_mobile_crazygames_home.png');
    await page.screenshot({ path: mobileHomeShot, fullPage: false });
    console.log(`   Saved mobile home screenshot: ${mobileHomeShot}`);

    // Mobile Game Page
    await page.goto('http://localhost:5173/play/typestrike-arena', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1000));

    const mobileGameShot = path.join(ARTIFACT_DIR, 'stage3_mobile_gamepage_player.png');
    await page.screenshot({ path: mobileGameShot, fullPage: false });
    console.log(`   Saved mobile game page screenshot: ${mobileGameShot}`);

    console.log('\n📊 Stage 3 Test Summary:');
    console.log(`   Total Console Errors: ${errors.length}`);
    if (errors.length > 0) {
      throw new Error(`Stage 3 failed with ${errors.length} console errors`);
    } else {
      console.log('   ✅ Stage 3 Automated Verification PASSED with ZERO console errors!');
    }
  } finally {
    await browser.close();
  }
}

runStage3Tests().catch((err) => {
  console.error('❌ Stage 3 Verification Failed:', err);
  process.exit(1);
});
