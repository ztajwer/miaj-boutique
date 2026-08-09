const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6000));
  const doorOpacity = await page.evaluate(() => {
    const el = document.querySelector('.door-scene-canvas');
    return el ? el.style.opacity : 'not found';
  });
  console.log("Door opacity:", doorOpacity);
  await browser.close();
})();
