import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/HUJAIFA/.gemini/antigravity/brain/86b43231-6363-4828-956a-49f095493c82';

async function runPhase2Tests() {
  console.log('🚀 Starting Phase 2 In-Browser Verification for 6 Games...');

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
      if (type === 'error') {
        console.error(`[Browser Console ERROR] ${text}`);
        errors.push(text);
      }
    });

    page.on('pageerror', (err) => {
      console.error(`[Browser Unhandled Exception] ${err.message}`);
      errors.push(err.message);
    });

    // 1. Test Game 1: TypeStrike Arena (Typing Fighter)
    console.log('🥊 Testing Game 1: TypeStrike Arena (/play/typestrike-arena)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/play/typestrike-arena', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#neonverse-canvas-viewport canvas', { visible: true });
    // Simulate typing a couple of letters
    await page.keyboard.press('KeyH');
    await page.keyboard.press('KeyI');
    await page.keyboard.press('KeyT');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_game1_typestrike.png') });
    console.log('✅ Captured TypeStrike Arena screenshot.');

    // 2. Test Game 3: FlipRush (Gravity Runner)
    console.log('🌀 Testing Game 3: FlipRush (/play/fliprush)...');
    await page.goto('http://localhost:5173/play/fliprush', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#neonverse-canvas-viewport canvas', { visible: true });
    // Simulate gravity flip with Space
    await page.keyboard.press('Space');
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_game3_fliprush.png') });
    console.log('✅ Captured FlipRush screenshot.');

    // 3. Test Game 4: Goo Merge (Physics Pit)
    console.log('🧪 Testing Game 4: Goo Merge (/play/goo-merge)...');
    await page.goto('http://localhost:5173/play/goo-merge', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#neonverse-canvas-viewport canvas', { visible: true });
    // Click on canvas to drop blob
    const canvasEl = await page.$('#neonverse-canvas-viewport canvas');
    if (canvasEl) {
      const box = await canvasEl.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 3);
      }
    }
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_game4_goomerge.png') });
    console.log('✅ Captured Goo Merge screenshot.');

    // 4. Test Game 5: Chef Panic! (Food Catcher)
    console.log('🍔 Testing Game 5: Chef Panic! (/play/chef-panic)...');
    await page.goto('http://localhost:5173/play/chef-panic', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#neonverse-canvas-viewport canvas', { visible: true });
    await page.keyboard.press('KeyD');
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_game5_chefpanic.png') });
    console.log('✅ Captured Chef Panic! screenshot.');

    // 5. Test Game 21: Whack-a-Glitch (CRT Buster)
    console.log('👾 Testing Game 21: Whack-a-Glitch (/play/whack-a-glitch)...');
    await page.goto('http://localhost:5173/play/whack-a-glitch', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#neonverse-canvas-viewport canvas', { visible: true });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_game21_whackaglitch.png') });
    console.log('✅ Captured Whack-a-Glitch screenshot.');

    // 6. Test Game 24: Echo Bloom (Chill Musical Garden)
    console.log('🌸 Testing Game 24: Echo Bloom (/play/echo-bloom)...');
    await page.goto('http://localhost:5173/play/echo-bloom', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#neonverse-canvas-viewport canvas', { visible: true });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_game24_echobloom.png') });
    console.log('✅ Captured Echo Bloom screenshot.');

    // 7. Mobile Touch Emulation on FlipRush
    console.log('📱 Testing Mobile Touch Emulation on FlipRush...');
    await page.setViewport({
      width: 393,
      height: 851,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    );
    await page.goto('http://localhost:5173/play/fliprush', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2_mobile_fliprush.png') });
    console.log('✅ Captured mobile touch FlipRush screenshot.');

    console.log('==============================================');
    console.log(`Phase 2 Verification Complete. Total Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors encountered:', errors);
      process.exit(1);
    } else {
      console.log('🎉 ZERO errors! All 6 Phase 2 games verified successfully.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase2Tests();
