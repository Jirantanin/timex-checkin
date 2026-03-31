const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';
const PASSWORD = 'N@029ii2';
const API_BASE = 'https://timex.techsoftholding.co.th/LeaveSystemAPI/api';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== Login ===');
  const loginRes = await page.request.post(API_BASE + '/auth/login', {
    data: { userId: EMPLOYEE_ID, password: PASSWORD },
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('Status:', loginRes.status());
  const loginBody = await loginRes.text();
  console.log('Body:', loginBody.substring(0, 800));
  
  await browser.close();
})();
