import puppeteer from 'puppeteer';

async function testNormalFps() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=CalculateNativeWinOcclusion',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173/play/splat-squad', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 600));

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
  console.log('Standard 60Hz compositor Game page RAF FPS:', gameFps);

  const startShot = Date.now();
  await page.screenshot({ path: 'test_shot.png' });
  console.log('Screenshot took:', Date.now() - startShot, 'ms');

  await browser.close();
}

testNormalFps().catch(console.error);
