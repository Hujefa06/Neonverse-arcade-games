import puppeteer from 'puppeteer';

async function testHeadlessNew() {
  const browser = await puppeteer.launch({
    headless: 'shell',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--headless=new',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

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
  console.log('--headless=new Game page RAF FPS:', gameFps);
  await browser.close();
}

testHeadlessNew().catch(console.error);
