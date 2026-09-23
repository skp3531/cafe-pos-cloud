import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => { if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text()); });
  page.on('pageerror', err => { console.log('PAGE ERROR:', err.message); });
  
  await page.goto('http://localhost:5173');
  await page.waitForSelector('input[type="password"]');
  await page.evaluate(() => {
    const input = document.querySelector('input[type="password"]');
    input.value = 'admin123';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  
  await new Promise(r => setTimeout(r, 100));
  await page.evaluate(() => document.querySelector('button[type="submit"]').click());
  
  try {
     await page.waitForSelector('main', { timeout: 3000 });
     await page.goto('http://localhost:5173/billing', { waitUntil: 'networkidle0' });
     await new Promise(r => setTimeout(r, 1000));
     const html = await page.content();
     if (html.includes('id="root"></div>')) {
        console.log("CRASHED EMPTY ROOT");
     } else {
        console.log("NOT EMPTY");
        console.log(html.substring(0, 1000));
     }
  } catch (e) {
     console.log("FAILED TO NAVIGATE");
  }
  
  await browser.close();
})();
