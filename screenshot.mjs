import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 1000));
  await page.goto('http://localhost:5173/billing', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'billing_screenshot.png' });
  await browser.close();
})();
