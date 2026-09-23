import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 1000));
  await page.goto('http://localhost:5173/billing', { waitUntil: 'networkidle0' });
  
  const html = await page.content();
  if (html.includes('id="root"></div>')) {
      console.log("REACT APP CRASHED (EMPTY ROOT)");
  } else {
      console.log("RENDERED OK, length:", html.length);
  }
  
  await browser.close();
})();
