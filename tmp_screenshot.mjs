import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error));

  await page.goto('http://localhost:3000/product/pro1', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 7000)); // wait for 3D model
  await page.screenshot({ path: 'pro1-screenshot.png' });
  await browser.close();
})();
