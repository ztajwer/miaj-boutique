const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("BROWSER ERROR:", err.message));
  
  console.log("Navigating to http://127.0.0.1:3000/...");
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle0" });
  
  console.log("Waiting 5 seconds for animations/3D to load...");
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
  console.log("Done.");
})();
