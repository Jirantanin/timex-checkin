const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://timex.techsoftholding.co.th/login');
  await page.waitForTimeout(3000);
  
  // Try filling via different methods
  const empInput = page.locator('input[placeholder="รหัสพนักงาน"]');
  
  await empInput.click();
  await empInput.type(EMPLOYEE_ID, { delay: 50 });
  
  // Dispatch input event for Vue reactivity
  await empInput.dispatchEvent('input');
  await page.waitForTimeout(500);
  
  const val = await empInput.inputValue();
  console.log('Value:', val);
  
  // Check Vue data
  const vueData = await page.evaluate(() => {
    // Try to access Vue instance
    const inputs = document.querySelectorAll('input');
    const result = {};
    inputs.forEach((inp, i) => {
      result[`input${i}`] = {
        value: inp.value,
        hasListener: inp.oninput !== null
      };
    });
    return result;
  });
  console.log('Vue/input state:', vueData);
  
  // Try clicking button
  await page.evaluate(() => {
    document.querySelector('button').click();
  });
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  
  await browser.close();
})();
