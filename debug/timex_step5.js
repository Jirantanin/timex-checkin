const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('request', req => console.log('REQ:', req.method(), req.url().split('/').slice(-1)));
  page.on('response', res => {
    if (!res.url().includes('fonts') && !res.url().includes('png') && !res.url().includes('css')) {
      console.log('RES:', res.status(), res.url().split('/').slice(-1));
    }
  });
  
  await page.goto('https://timex.techsoftholding.co.th/login');
  await page.waitForTimeout(3000);
  
  // Type employee ID using keyboard
  const empInput = page.locator('input[placeholder="รหัสพนักงาน"]');
  await empInput.click();
  await empInput.type(EMPLOYEE_ID, { delay: 50 });
  await page.waitForTimeout(500);
  
  // Check value
  const val = await empInput.inputValue();
  console.log('Value:', val);
  
  // Try triggering click via JS since normal click doesn't work
  console.log('\n=== Trigger click via JS ===');
  await page.evaluate(() => {
    const btn = document.querySelector('button');
    if (btn) {
      console.log('Found button:', btn.textContent);
      btn.click();
    } else {
      console.log('No button found');
    }
  });
  
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  const bodyText = await page.locator('body').innerText();
  console.log('เนื้อหา:\n', bodyText.substring(0, 800));
  
  await browser.close();
})();
