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
  
  console.log("On Reports page");
  // click 'Purchases' tab
  try {
     const elements = await page.$x("//button[contains(., 'Purchases')]");
     if (elements.length > 0) {
        await elements[0].click();
        await new Promise(r => setTimeout(r, 500));
        console.log("Clicked Purchases");
     }
  } catch(e) {}
  
  // click 'Returns' tab
  try {
     const elements = await page.$x("//button[contains(., 'Returns')]");
     if (elements.length > 0) {
        await elements[0].click();
        await new Promise(r => setTimeout(r, 500));
        console.log("Clicked Returns");
     }
  } catch(e) {}
  
  // click 'Items' tab
  try {
     const elements = await page.$x("//button[contains(., 'Items')]");
     if (elements.length > 0) {
        await elements[0].click();
        await new Promise(r => setTimeout(r, 500));
        console.log("Clicked Items");
     }
  } catch(e) {}
  
  // click 'Staff' tab
  try {
     const elements = await page.$x("//button[contains(., 'Staff')]");
     if (elements.length > 0) {
        await elements[0].click();
        await new Promise(r => setTimeout(r, 500));
        console.log("Clicked Staff");
     }
  } catch(e) {}

  await browser.close();
})();
