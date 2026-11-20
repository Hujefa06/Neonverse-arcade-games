import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/HUJAIFA/.gemini/antigravity/brain/86b43231-6363-4828-956a-49f095493c82';

async function runPhase1Tests() {
  console.log('🚀 Starting Automated In-Browser Verification for Phase 1...');
  
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
    
    // Capture console errors
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error(`[Browser Console ERROR] ${text}`);
        errors.push(text);
      } else if (type === 'warn') {
        console.warn(`[Browser Console WARN] ${text}`);
      }
    });

    page.on('pageerror', (err) => {
      console.error(`[Browser Unhandled Exception] ${err.message}`);
      errors.push(err.message);
    });

    // 1. Desktop Test: Homepage
    console.log('📱 Testing Desktop Homepage (1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'phase1_desktop_home.png'),
      fullPage: false,
    });
    console.log('✅ Captured desktop home screenshot.');

    // 2. Test Search Modal
    console.log('🔍 Testing Search Modal (pressing "/")...');
    await page.keyboard.press('/');
    await page.waitForSelector('input[placeholder*="Search"]', { visible: true });
    await page.type('input[placeholder*="Search"]', 'Typing');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'phase1_search_modal.png'),
    });
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 400));
    console.log('✅ Captured search modal screenshot.');

    // 3. Test Game Page (TypeStrike Arena)
    console.log('🕹️ Testing Game Page (/play/typestrike-arena)...');
    await page.goto('http://localhost:5173/play/typestrike-arena', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#neonverse-canvas-viewport canvas', { visible: true });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'phase1_desktop_gamepage.png'),
    });
    console.log('✅ Captured game page screenshot.');

    // 4. Test Controls Guide Modal
    console.log('❓ Testing Controls Guide Modal...');
    const helpBtn = await page.$('button[title="Controls Guide"]');
    if (helpBtn) {
      await helpBtn.click();
      await page.waitForSelector('h3', { visible: true });
      await new Promise((r) => setTimeout(r, 400));
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'phase1_controls_modal.png'),
      });
      await page.keyboard.press('Escape');
      console.log('✅ Captured controls modal screenshot.');
    }

    // 5. Mobile Emulation Test (Pixel 7 / iPhone: 393x851, touch enabled)
    console.log('📱 Testing Mobile Emulation (393x851, Touch Enabled)...');
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
    await page.goto('http://localhost:5173/play/typestrike-arena', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'phase1_mobile_gamepage.png'),
    });
    console.log('✅ Captured mobile game page screenshot with touch controls.');

    // 6. Mobile Homepage
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'phase1_mobile_home.png'),
    });
    console.log('✅ Captured mobile homepage screenshot.');

    console.log('==============================================');
    console.log(`Verification Complete. Total Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors encountered:', errors);
      process.exit(1);
    } else {
      console.log('🎉 ZERO errors! Phase 1 verification PASSED.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase1Tests();
