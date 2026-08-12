import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('TableModel Debug')) {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  await page.goto('http://localhost:3000');
  
  // wait for it to load
  await new Promise(r => setTimeout(r, 6000));
  
  await browser.close();
})();
