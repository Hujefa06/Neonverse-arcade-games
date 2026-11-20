import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { GAME_REGISTRY } from '../src/games/registry';

const ARTIFACT_DIR = 'C:/Users/HUJAIFA/.gemini/antigravity/brain/86b43231-6363-4828-956a-49f095493c82';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

async function runStage2Tests() {
  console.log('🚀 Starting Automated In-Browser Verification for Stage 2 (Real WebP Images & Backgrounds)...');

  // 1. Filesystem Verification
  console.log('📂 Verifying filesystem assets for all 24 games and backgrounds...');
  for (const game of GAME_REGISTRY) {
    const thumb = path.join(PUBLIC_DIR, 'assets', 'games', game.slug, 'thumb.webp');
    const shot1 = path.join(PUBLIC_DIR, 'assets', 'games', game.slug, 'shot1.webp');
    const shot2 = path.join(PUBLIC_DIR, 'assets', 'games', game.slug, 'shot2.webp');
    const shot3 = path.join(PUBLIC_DIR, 'assets', 'games', game.slug, 'shot3.webp');

    if (!fs.existsSync(thumb) || !fs.existsSync(shot1) || !fs.existsSync(shot2) || !fs.existsSync(shot3)) {
      throw new Error(`Missing asset files for game: ${game.slug}`);
    }
  }
  console.log('   ✅ All 24 games have thumb.webp, shot1.webp, shot2.webp, and shot3.webp verified!');

  const heroBg = path.join(PUBLIC_DIR, 'assets', 'bg', 'hero-cityscape.webp');
  if (!fs.existsSync(heroBg)) {
    throw new Error('Missing hero-cityscape.webp background');
  }
  console.log('   ✅ Hero cityscape background verified!');

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

    // 2. Desktop Test: Homepage (1440x900)
    console.log('🖥️ Testing Desktop Homepage with Real WebP Cards (1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    // Wait for images to load as they enter viewport
    await page.evaluate(async () => {
      // Smooth scroll down the page to trigger lazy loading
      const scrollHeight = document.body.scrollHeight;
      const step = 400;
      for (let y = 0; y < scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 800));

      // Wait for all images to settle
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
            setTimeout(resolve, 2500);
          });
        })
      );
    });

    // Detect truly broken images (failed load: complete but naturalWidth === 0)
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src);
    });
    console.log(`   Broken images found: ${brokenImages.length}`);
    if (brokenImages.length > 0) {
      console.error('   Broken images list:', brokenImages);
      throw new Error(`Found ${brokenImages.length} broken images on homepage`);
    }

    const desktopHomeShot = path.join(ARTIFACT_DIR, 'stage2_desktop_home_webp.png');
    await page.screenshot({ path: desktopHomeShot, fullPage: false });
    console.log(`   Saved screenshot: ${desktopHomeShot}`);

    // Test Hover Effect on first card
    const firstCard = await page.$('a[href^="/play/"]');
    if (firstCard) {
      await firstCard.hover();
      await new Promise((r) => setTimeout(r, 500));
      const hoverShot = path.join(ARTIFACT_DIR, 'stage2_card_hover_kenburns.png');
      await page.screenshot({ path: hoverShot, fullPage: false });
      console.log(`   Saved card hover screenshot: ${hoverShot}`);
    }

    // 3. Desktop Test: Game Page with Blurred Backdrop & Screenshot Strip
    console.log('🎮 Testing Game Page with Screenshots Gallery & Blurred Backdrop...');
    await page.goto('http://localhost:5173/play/typestrike-arena', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));

    // Scroll down to reveal screenshot strip
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise((r) => setTimeout(r, 600));

    const gamePageGalleryShot = path.join(ARTIFACT_DIR, 'stage2_gamepage_screenshot_gallery.png');
    await page.screenshot({ path: gamePageGalleryShot, fullPage: false });
    console.log(`   Saved game page gallery screenshot: ${gamePageGalleryShot}`);

    // 4. Desktop Test: Category Page with Thematic Background
    console.log('📁 Testing Category Page with Dynamic Category Background...');
    await page.goto('http://localhost:5173/category/Action', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));

    const categoryShot = path.join(ARTIFACT_DIR, 'stage2_category_page_action.png');
    await page.screenshot({ path: categoryShot, fullPage: false });
    console.log(`   Saved category screenshot: ${categoryShot}`);

    // 5. Mobile Viewport Test (Pixel 7 / 390x844)
    console.log('📱 Testing Mobile Viewport (Pixel 7 390x844)...');
    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    const mobileShot = path.join(ARTIFACT_DIR, 'stage2_mobile_home_webp.png');
    await page.screenshot({ path: mobileShot, fullPage: false });
    console.log(`   Saved mobile screenshot: ${mobileShot}`);

    console.log('\n📊 Stage 2 Test Summary:');
    console.log(`   Total Console Errors: ${errors.length}`);
    if (errors.length > 0) {
      throw new Error(`Stage 2 failed with ${errors.length} console errors`);
    } else {
      console.log('   ✅ Stage 2 Automated Verification PASSED with ZERO console errors!');
    }
  } finally {
    await browser.close();
  }
}

runStage2Tests().catch((err) => {
  console.error('❌ Stage 2 Verification Failed:', err);
  process.exit(1);
});
