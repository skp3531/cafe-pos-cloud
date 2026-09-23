import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: { name: 'Owner', role: 'owner' }, isAuthenticated: true },
      version: 0
    }));
  });
  
  await page.goto('http://localhost:5173/billing', { waitUntil: 'networkidle0' });
  const html = await page.content();
  console.log(html);
  await browser.close();
})();
