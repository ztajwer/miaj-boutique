const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const videoPath = '/Users/zimal/Desktop/Screen Recording 2026-07-25 at 7.33.21 PM.mov';
  const outDir = '/Users/zimal/.gemini/antigravity/brain/45ef19ce-7328-4eb2-9983-1cd44d46343c/scratch/video_frames';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const fileUrl = 'file://' + encodeURI(videoPath);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; background:black; display:flex; justify-content:center; align-items:center;">
        <video id="vid" src="${fileUrl}" style="width:100%; height:100%;" preload="auto"></video>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const v = document.getElementById('vid');
      v.onloadedmetadata = resolve;
      v.load();
    });
  });

  const duration = await page.evaluate(() => {
    const v = document.getElementById('vid');
    return v ? v.duration : 0;
  });

  console.log('Video duration:', duration);

  const numFrames = 6;
  const step = duration > 0 ? duration / numFrames : 1;

  for (let i = 0; i <= numFrames; i++) {
    const time = Math.min(duration, i * step);
    await page.evaluate((t) => {
      return new Promise((resolve) => {
        const v = document.getElementById('vid');
        if (!v) return resolve();
        v.currentTime = t;
        v.onseeked = resolve;
      });
    }, time);

    await new Promise(r => setTimeout(r, 200));
    const framePath = path.join(outDir, `frame_${i}_${time.toFixed(1)}s.png`);
    await page.screenshot({ path: framePath });
    console.log(`Saved ${framePath}`);
  }

  await browser.close();
})();
