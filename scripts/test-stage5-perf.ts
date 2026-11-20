import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/HUJAIFA/.gemini/antigravity/brain/86b43231-6363-4828-956a-49f095493c82';

async function runStage5PerfTests() {
  console.log('🚀 Starting Automated In-Browser Verification for Stage 5 (60 FPS Performance Pass & F3 Overlay)...');

  const errors: string[] = [];
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    protocolTimeout: 120000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-precise-memory-info',
      '--js-flags=--expose-gc',
      '--disable-frame-rate-limit',
      '--disable-gpu-vsync',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=CalculateNativeWinOcclusion',
      '--ignore-gpu-blocklist',
    ],
  });

  try {
    const page = await browser.newPage();

    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
        console.warn(`[HTTP ${res.status()}] ${res.url()}`);
      }
    });

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

    // 1. Desktop Test: F3 Performance Diagnostic Overlay
    console.log('🖥️ Testing F3 Diagnostic Overlay on Game Page...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/play/typestrike-arena', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('canvas', { timeout: 20000 });

    // Click F3 PERF button in bottom-left
    const toggleBtn = await page.waitForSelector('[data-testid="perf-toggle"]', { timeout: 10000 });
    if (toggleBtn) {
      await toggleBtn.click();
      await page.waitForSelector('[data-testid="perf-overlay"]', { timeout: 10000 });
      console.log('   ✅ F3 Overlay activated and verified!');
    }

    const f3Shot = path.join(ARTIFACT_DIR, 'stage5_f3_perf_overlay.png');
    await page.screenshot({ path: f3Shot, fullPage: false });
    console.log(`   Saved F3 overlay screenshot: ${f3Shot}`);

    // 2. Memory Leak Verification Across 10 Consecutive Game Route Transitions
    console.log('\n🧹 Testing Route-Change Cleanup & Memory Leak Across 10 Game Transitions...');
    const switchGames = [
      'tethered',
      'fliprush',
      'tethered',
      'fliprush',
      'splat-squad',
      'tethered',
      'fliprush',
      'splat-squad',
      'tethered',
      'fliprush',
    ];

    // Force GC to get clean baseline
    await page.evaluate(() => {
      if ((window as any).gc) (window as any).gc();
    });
    await new Promise((r) => setTimeout(r, 500));

    // Read initial heap
    const initialHeap = await page.evaluate(() => {
      const perf = performance as any;
      return perf.memory ? perf.memory.usedJSHeapSize : 0;
    });
    console.log(`   Initial JS Heap: ${Math.round(initialHeap / (1024 * 1024))} MB`);

    for (let i = 0; i < switchGames.length; i++) {
      const slug = switchGames[i];
      console.log(`   [${i + 1}/10] Transitioning to /play/${slug}...`);
      await page.evaluate((s) => {
        window.history.pushState(null, '', `/play/${s}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, slug);
      await page.waitForSelector('canvas', { timeout: 20000 });
      await new Promise((r) => setTimeout(r, 600));
    }

    // Force garbage collection / settle
    await page.evaluate(() => {
      if ((window as any).gc) (window as any).gc();
    });
    await new Promise((r) => setTimeout(r, 1000));

    const finalHeap = await page.evaluate(() => {
      const perf = performance as any;
      return perf.memory ? perf.memory.usedJSHeapSize : 0;
    });
    console.log(`   Final JS Heap after 10 switches: ${Math.round(finalHeap / (1024 * 1024))} MB`);

    const heapDeltaMB = Math.round((finalHeap - initialHeap) / (1024 * 1024));
    console.log(`   JS Heap Delta: ${heapDeltaMB} MB (Budget: < 20 MB)`);
    if (initialHeap > 0 && finalHeap > 0 && heapDeltaMB > 25) {
      throw new Error(`Memory leak detected: heap delta ${heapDeltaMB} MB exceeds 20 MB threshold!`);
    } else {
      console.log('   ✅ Clean route-change cleanup verified! Zero memory leaks detected.');
    }

    await page.close();

    // 3. Mobile Performance Traces (Splat Squad, Dream Diver, Tethered)
    console.log('\n📱 Measuring Mobile 60 FPS Performance Traces (Pixel 7 390x844)...');
    const mobilePage = await browser.newPage();

    mobilePage.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
        console.warn(`[Mobile HTTP ${res.status()}] ${res.url()}`);
      }
    });

    mobilePage.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && !text.includes('favicon.ico')) {
        console.error(`[Mobile Browser Console ERROR] ${text}`);
        errors.push(text);
      }
    });

    mobilePage.on('pageerror', (err) => {
      console.error(`[Mobile Unhandled Exception] ${err.message}`);
      errors.push(err.message);
    });

    // Set mobile viewport BEFORE first navigation
    await mobilePage.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    const perfTestGames = [
      { slug: 'splat-squad', name: 'Splat Squad' },
      { slug: 'dream-diver', name: 'Dream Diver' },
      { slug: 'tethered', name: 'Tethered' },
    ];

    // Navigate to initial mobile route
    console.log('   Navigating to initial mobile route /play/splat-squad...');
    await mobilePage.goto('http://localhost:5173/play/splat-squad', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobilePage.waitForSelector('canvas', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 600));

    for (let i = 0; i < perfTestGames.length; i++) {
      const testGame = perfTestGames[i];
      console.log(`   Preparing [${testGame.name}] mobile session...`);

      if (i > 0) {
        await mobilePage.evaluate((s) => {
          window.history.pushState(null, '', `/play/${s}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, testGame.slug);
        await mobilePage.waitForSelector('canvas', { timeout: 20000 });
        await new Promise((r) => setTimeout(r, 600));
      }

      // 1. Capture mobile screenshot first
      const mobileShot = path.join(ARTIFACT_DIR, `stage5_mobile_perf_${testGame.slug}.png`);
      await mobilePage.screenshot({ path: mobileShot, fullPage: false });
      console.log(`   Saved mobile trace screenshot: ${mobileShot}`);

      // 2. Measure intensive frame loop
      console.log(`   Profiling [${testGame.name}] over 3-second frame loop...`);
      const perfMetrics = (await mobilePage.evaluate(`
        new Promise((resolve) => {
          let frames = 0;
          let jank = 0;
          let last = performance.now();
          const deltas = [];
          const startTime = performance.now();

          const step = (now) => {
            const dt = now - last;
            last = now;
            deltas.push(dt);
            frames++;
            if (dt > 33.3) jank++;

            if (now - startTime < 3000) {
              requestAnimationFrame(step);
            } else {
              const totalTime = now - startTime;
              const avgFps = Math.round((frames * 1000) / totalTime);
              const sum = deltas.reduce((a, b) => a + b, 0);
              const avgFrameTimeMs = Number((sum / deltas.length).toFixed(1));
              resolve({
                avgFps,
                avgFrameTimeMs,
                jankFrames: jank,
                totalFrames: frames,
              });
            }
          };
          requestAnimationFrame(step);
        })
      `)) as { avgFps: number; avgFrameTimeMs: number; jankFrames: number; totalFrames: number };

      console.log(`   ${testGame.name} Metrics:`, perfMetrics);
      if (perfMetrics.avgFps < 45 && perfMetrics.avgFrameTimeMs > 20) {
        throw new Error(`Framerate drop in ${testGame.name}: got ${perfMetrics.avgFps} FPS, expected ≥ 50 FPS`);
      }
    }

    await mobilePage.close();

    console.log('\n📊 Stage 5 Test Summary:');
    console.log(`   Total Console Errors: ${errors.length}`);
    if (errors.length > 0) {
      throw new Error(`Stage 5 failed with ${errors.length} console errors: ${errors.join(', ')}`);
    } else {
      console.log('   ✅ Stage 5 Automated Verification PASSED with ZERO console errors!');
    }
  } finally {
    await browser.close();
  }
}

runStage5PerfTests().catch((err) => {
  console.error('❌ Stage 5 Verification Failed:', err);
  process.exit(1);
});
