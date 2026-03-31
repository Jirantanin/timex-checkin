const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('request', req => {
    const url = req.url();
    if (url.includes('LeaveSystemAPI') || url.includes('login')) {
      console.log('>>> REQ:', req.method(), url);
    }
  });
  page.on('response', res => {
    const url = res.url();
    if (url.includes('LeaveSystemAPI') || url.includes('login')) {
      console.log('<<< RES:', res.status(), url);
    }
  });
  
  await page.goto('https://timex.techsoftholding.co.th/login');
  await page.waitForTimeout(3000);
  
  // Fill BOTH fields - employee ID and password (try empty password)
  await page.fill('input[placeholder="รหัสพนักงาน"]', EMPLOYEE_ID);
  await page.fill('input[placeholder="รหัสผ่าน"]', '');  // empty password
  await page.waitForTimeout(500);
  
  console.log('Filled - emp:', await page.locator('input[placeholder="รหัสพนักงาน"]').inputValue());
  console.log('Filled - pwd:', await page.locator('input[placeholder="รหัสผ่าน"]').inputValue());
  
  // Click Sign In
  console.log('Clicking Sign In...');
  await page.locator('button:has-text("Sign In")').click();
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  
  await browser.close();
})();
