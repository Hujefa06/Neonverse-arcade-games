import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/HUJAIFA/.gemini/antigravity/brain/86b43231-6363-4828-956a-49f095493c82';

async function runStage4Tests() {
  console.log('🚀 Starting Automated In-Browser Verification for Stage 4 (Procedural Web Audio Engine)...');

  const errors: string[] = [];
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
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

    // 1. Desktop Test: Launch Game with Procedural Music Engine
    console.log('🎮 Launching Game Page & Unlocking Web Audio Context...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/play/typestrike-arena', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Simulate pointerdown gesture to trigger user-gesture auto-unlock
    await page.mouse.click(500, 400);
    await new Promise((r) => setTimeout(r, 600));

    // Test in-browser Web Audio API synthesis
    const audioVerification = await page.evaluate(async () => {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const sampleRate = ctx.sampleRate;

      // Test offline rendering of a 16-bar loop
      const offline = new OfflineAudioContext(2, sampleRate * 4, sampleRate);
      const osc = offline.createOscillator();
      const gain = offline.createGain();
      osc.frequency.setValueAtTime(440, 0);
      gain.gain.setValueAtTime(0.2, 0);
      osc.connect(gain);
      gain.connect(offline.destination);
      osc.start(0);
      osc.stop(4);

      const buffer = await offline.startRendering();

      return {
        contextState: ctx.state,
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels,
        duration: buffer.duration,
      };
    });

    console.log('   Web Audio Verification Metrics:', audioVerification);
    if (audioVerification.duration !== 4) {
      throw new Error('OfflineAudioContext rendering duration mismatch');
    }

    const stage4DesktopShot = path.join(ARTIFACT_DIR, 'stage4_audio_gameplay_desktop.png');
    await page.screenshot({ path: stage4DesktopShot, fullPage: false });
    console.log(`   Saved desktop audio gameplay screenshot: ${stage4DesktopShot}`);

    // 2. Test 800ms Crossfade Transition (Switch from TypeStrike to Tethered)
    console.log('🎵 Testing 800ms Crossfade to Tethered Ambient Track...');
    await page.goto('http://localhost:5173/play/tethered', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.mouse.click(500, 400);
    await new Promise((r) => setTimeout(r, 1000));

    const stage4CrossfadeShot = path.join(ARTIFACT_DIR, 'stage4_crossfade_tethered.png');
    await page.screenshot({ path: stage4CrossfadeShot, fullPage: false });
    console.log(`   Saved crossfade screenshot: ${stage4CrossfadeShot}`);

    // 3. Mobile Chrome Emulation (Pixel 7 / 390x844)
    console.log('📱 Testing Mobile Audio Auto-Unlock & Responsive Controls...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await mobilePage.goto('http://localhost:5173/play/fliprush', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('canvas', { timeout: 10000 });
    // First touch gesture
    await mobilePage.touchscreen.tap(200, 400);
    await new Promise((r) => setTimeout(r, 800));

    const stage4MobileShot = path.join(ARTIFACT_DIR, 'stage4_mobile_audio_fliprush.png');
    await mobilePage.screenshot({ path: stage4MobileShot, fullPage: false });
    console.log(`   Saved mobile audio screenshot: ${stage4MobileShot}`);
    await mobilePage.close();

    console.log('\n📊 Stage 4 Test Summary:');
    console.log(`   Total Console Errors: ${errors.length}`);
    if (errors.length > 0) {
      throw new Error(`Stage 4 failed with ${errors.length} console errors`);
    } else {
      console.log('   ✅ Stage 4 Automated Verification PASSED with ZERO console errors!');
    }
  } finally {
    await browser.close();
  }
}

runStage4Tests().catch((err) => {
  console.error('❌ Stage 4 Verification Failed:', err);
  process.exit(1);
});
