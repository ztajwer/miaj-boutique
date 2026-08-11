import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], userDataDir: './tmp_puppeteer_20416' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  console.log("Navigating to https://miajboutique.ae...");
  await page.goto('https://miajboutique.ae', { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log("Waiting a bit for React to render...");
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
}

main().catch(console.error);
