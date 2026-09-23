import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => { if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text()); });
  page.on('pageerror', err => { console.log('PAGE ERROR:', err.message); });
  
  await page.goto('http://localhost:5173');
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await page.waitForSelector('text/Dashboard');
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle0' });
  
  const html = await page.content();
  if (html.includes('id="root"></div>')) {
      console.log("REPORTS CRASHED ON LOAD");
  } else {
      console.log("REPORTS RENDERED");
  }
  
  await browser.close();
})();
