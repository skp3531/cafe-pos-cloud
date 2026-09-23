const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.error(`PAGE ERROR: ${error.message}`);
  });

  await page.goto('http://localhost:5173/');
  
  await page.evaluate(() => {
    window.testZustand = async () => {
      const { useAuthStore } = await import('/src/store/useAuthStore.js');
      console.log("Before auth state:", useAuthStore.getState().isAuthenticated);
      useAuthStore.getState().login({name: 'Owner', pin: '1234', role: 'owner', id: 1});
      console.log("After auth state:", useAuthStore.getState().isAuthenticated);
    };
  });
  
  await page.evaluate(() => window.testZustand());
  await page.waitForTimeout(1000);
  await browser.close();
})();
