const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';
const API_BASE = 'https://timex.techsoftholding.co.th/LeaveSystemAPI/api';

(async () => {
  // Try calling API directly
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Try login API
  console.log('=== ลองเรียก API ตรง ===');
  
  // Try various login endpoints
  const endpoints = [
    '/auth/login',
    '/login',
    '/auth',
    '/token',
    '/user/login',
    '/employee/login'
  ];
  
  for (const ep of endpoints) {
    try {
      const res = await page.request.post(API_BASE + ep, {
        data: { employeeId: EMPLOYEE_ID },
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`${ep}: ${res.status()}`, await res.text().catch(() => ''));
    } catch (e) {
      console.log(`${ep}: ERROR - ${e.message}`);
    }
  }
  
  await browser.close();
})();
