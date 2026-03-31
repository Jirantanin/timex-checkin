const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('request', req => {
    if (req.url().includes('login') || req.url().includes('auth') || req.url().includes('api')) {
      console.log('REQUEST:', req.method(), req.url());
    }
  });
  page.on('response', res => {
    if (res.url().includes('login') || res.url().includes('auth') || res.url().includes('api')) {
      console.log('RESPONSE:', res.status(), res.url());
    }
  });
  
  await page.goto('https://timex.techsoftholding.co.th/login');
  await page.waitForTimeout(2000);
  
  // Fill employee ID
  const empInput = page.locator('input[placeholder="รหัสพนักงาน"]');
  await empInput.click();
  await empInput.type(EMPLOYEE_ID, { delay: 100 });
  await page.waitForTimeout(500);
  
  // Try pressing Enter instead of clicking
  console.log('กด Enter...');
  await empInput.press('Enter');
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  const bodyText = await page.locator('body').innerText();
  console.log('เนื้อหา:\n', bodyText.substring(0, 800));
  
  await browser.close();
})();
