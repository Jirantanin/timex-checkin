const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://timex.techsoftholding.co.th/login');
  await page.waitForTimeout(2000);
  
  // ลอง type แทน fill (บางครั้ง Vue/React ไม่รู้จัก fill)
  const empInput = page.locator('input[placeholder="รหัสพนักงาน"]');
  await empInput.click();
  await page.waitForTimeout(200);
  await empInput.type(EMPLOYEE_ID, { delay: 100 });
  await page.waitForTimeout(500);
  
  // ดูค่าที่กรอกไป
  const value = await empInput.inputValue();
  console.log('ค่าในช่อง:', value);
  
  // กด Sign In
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  console.log('URL:', page.url());
  
  const bodyText = await page.locator('body').innerText();
  console.log('เนื้อหา:\n', bodyText.substring(0, 800));
  
  await browser.close();
})();
