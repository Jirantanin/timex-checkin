const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';

(async () => {
  const browser = await chromium.launch({ headless: false });  // non-headless
  const page = await browser.newPage();
  
  await page.goto('https://timex.techsoftholding.co.th/login');
  await page.waitForTimeout(3000);
  
  // Fill employee ID
  await page.fill('input[placeholder="รหัสพนักงาน"]', EMPLOYEE_ID);
  await page.waitForTimeout(500);
  
  // Click Sign In
  await page.locator('button:has-text("Sign In")').click();
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  
  const bodyText = await page.locator('body').innerText();
  console.log('เนื้อหา:\n', bodyText.substring(0, 800));
  
  await browser.close();
})();
