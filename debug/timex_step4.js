const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('request', req => {
    console.log('REQUEST:', req.method(), req.url());
  });
  page.on('response', res => {
    console.log('RESPONSE:', res.status(), res.url());
  });
  
  await page.goto('https://timex.techsoftholding.co.th/login');
  await page.waitForTimeout(3000);
  
  // Click Sign In without filling anything
  console.log('\n=== ลองกด Sign In เฉยๆ ===');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  console.log('URL:', page.url());
  const bodyText = await page.locator('body').innerText();
  console.log('เนื้อหา:\n', bodyText.substring(0, 800));
  
  await browser.close();
})();
