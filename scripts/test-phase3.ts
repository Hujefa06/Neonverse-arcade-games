import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/HUJAIFA/.gemini/antigravity/brain/86b43231-6363-4828-956a-49f095493c82';

async function runPhase3Tests() {
  console.log('🚀 Starting Phase 3 In-Browser Verification for 9 Games...');

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

    await page.setViewport({ width: 1440, height: 900 });

    const phase3Games = [
      { id: 'beat-serpent', name: 'Beat Serpent' },
      { id: 'cloud-shepherd', name: 'Cloud Shepherd' },
      { id: 'rocket-postman', name: 'Rocket Postman' },
      { id: 'magnet-surfer', name: 'Magnet Surfer' },
      { id: 'splat-squad', name: 'Splat Squad' },
      { id: 'thirty-second-detective', name: '30-Second Detective' },
      { id: 'stack-storm', name: 'Stack Storm' },
      { id: 'lantern-glider', name: 'Lantern Glider' },
      { id: 'squish-volley', name: 'Squish Volley' },
    ];

    for (const g of phase3Games) {
      console.log(`🕹️ Testing ${g.name} (/play/${g.id})...`);
      await page.goto(`http://localhost:5173/play/${g.id}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('#neonverse-canvas-viewport canvas', { visible: true });
      await new Promise((r) => setTimeout(r, 650));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `phase3_${g.id}.png`) });
      console.log(`✅ Captured ${g.name} screenshot.`);
    }

    // Mobile touch test on Beat Serpent
    console.log('📱 Testing Mobile Touch Emulation on Beat Serpent...');
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
    await page.goto('http://localhost:5173/play/beat-serpent', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_mobile_beatserpent.png') });
    console.log('✅ Captured mobile touch Beat Serpent screenshot.');

    console.log('==============================================');
    console.log(`Phase 3 Verification Complete. Total Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors encountered:', errors);
      process.exit(1);
    } else {
      console.log('🎉 ZERO errors! All 9 Phase 3 games verified successfully.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase3Tests();
