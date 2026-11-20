import puppeteer from 'puppeteer';

async function testHeadlessFps() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-frame-rate-limit',
      '--disable-gpu-vsync',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=CalculateNativeWinOcclusion',
      '--ignore-gpu-blocklist',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Test game page
  await page.goto('http://localhost:5173/play/splat-squad', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  const gameFps = await page.evaluate(`
    new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      const loop = (now) => {
        frames++;
        if (now - start < 2000) {
          requestAnimationFrame(loop);
        } else {
          resolve(Math.round((frames * 1000) / (now - start)));
        }
      };
      requestAnimationFrame(loop);
    })
  `);
  console.log('Game page RAF FPS with disable-gpu-vsync & disable-frame-rate-limit:', gameFps);

  await browser.close();
}

testHeadlessFps().catch(console.error);
