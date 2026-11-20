import puppeteer from 'puppeteer';

async function testSingleGame() {
  const slug = process.argv[2] || 'beat-serpent';
  console.log(`Testing slug: ${slug}`);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log(`[BROWSER ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  const url = `http://localhost:5173/play/${slug}`;
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Waiting for canvas...');
  await page.waitForSelector('canvas', { timeout: 20000 });
  console.log('Canvas found successfully!');
  await browser.close();
}

testSingleGame().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
