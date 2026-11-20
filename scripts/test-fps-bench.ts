import puppeteer from 'puppeteer';

async function bench() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const games = ['splat-squad', 'dream-diver', 'tethered', 'fliprush'];
  for (const slug of games) {
    console.log(`Loading /play/${slug}...`);
    await page.goto(`http://localhost:5173/play/${slug}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 15000 });
    // Allow 800ms for initial loading/audio to settle
    await new Promise(r => setTimeout(r, 800));

    const metrics = await page.evaluate(`
      new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        const loop = (now) => {
          frames++;
          if (now - start < 3000) {
            requestAnimationFrame(loop);
          } else {
            const totalMs = now - start;
            resolve({
              avgFps: Math.round((frames * 1000) / totalMs),
              frames,
              totalMs,
            });
          }
        };
        requestAnimationFrame(loop);
      })
    `);
    console.log(`Results for ${slug}:`, metrics);
  }

  await browser.close();
}

bench().catch(console.error);
