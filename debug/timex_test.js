const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://timex.techsoftholding.co.th/checkin');
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  const url = page.url();
  
  console.log('Title:', title);
  console.log('URL:', url);
  
  // Get visible text
  const bodyText = await page.locator('body').innerText().catch(() => 'N/A');
  console.log('Body text:', bodyText.substring(0, 500));
  
  // Check for login form
  const inputs = await page.locator('input').count();
  const buttons = await page.locator('button').count();
  console.log('Inputs found:', inputs);
  console.log('Buttons found:', buttons);
  
  await browser.close();
})();
