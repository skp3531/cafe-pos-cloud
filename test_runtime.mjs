import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  // Set localStorage auth so we don't get redirected to /login!
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        user: { name: 'Owner', role: 'owner' },
        isAuthenticated: true
      },
      version: 0
    }));
  });
  
  await page.goto('http://localhost:5173/billing', { waitUntil: 'networkidle0' });
  
  const html = await page.content();
  if (html.includes('Shift is Closed') || html.includes('Search items')) {
     console.log('RENDERED CORRECTLY');
  } else {
     console.log('DID NOT RENDER CORRECTLY');
  }
  
  await browser.close();
})();
