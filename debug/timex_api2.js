const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';
const API_BASE = 'https://timex.techsoftholding.co.th/LeaveSystemAPI/api';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Try /auth/login with employeeId and empty password first
  console.log('=== Step 1: Login with employeeId ===');
  const loginRes = await page.request.post(API_BASE + '/auth/login', {
    data: { userId: EMPLOYEE_ID, password: '' },
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('Status:', loginRes.status());
  const loginBody = await loginRes.text();
  console.log('Body:', loginBody.substring(0, 500));
  
  const loginData = JSON.parse(loginBody);
  
  // If we get a token or challenge, proceed to OTP
  if (loginData.token || loginData.challenge || loginData.requireOTP) {
    console.log('\n=== OTP Required - got challenge/token ===');
  }
  
  // Try to find OTP verification endpoint
  const otpEndpoints = [
    '/auth/verify',
    '/auth/otp',
    '/otp/verify',
    '/auth/validate',
    '/auth/login/otp'
  ];
  
  for (const ep of otpEndpoints) {
    try {
      const res = await page.request.post(API_BASE + ep, {
        data: { userId: EMPLOYEE_ID, token: loginData.token || loginData.challenge || '' },
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`${ep}: ${res.status()}`, (await res.text()).substring(0, 200));
    } catch (e) {
      console.log(`${ep}: ERROR - ${e.message}`);
    }
  }
  
  await browser.close();
})();
