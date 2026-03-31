const { chromium } = require('playwright');
const OTPAuth = require('otpauth');

const EMPLOYEE_ID = '61019';
const PASSWORD = 'N@029ii2';
const SECRET_KEY = 'FOPVPLL3QRLSSA2Q';
const API_BASE = 'https://timex.techsoftholding.co.th/LeaveSystemAPI/api';

async function generateOTP() {
  let totp = new OTPAuth.TOTP({
    issuer: 'LeaveSystem',
    label: 'User',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(SECRET_KEY)
  });
  return totp.generate();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Step 1: Login
  console.log('=== Step 1: Login ===');
  const loginRes = await page.request.post(API_BASE + '/auth/login', {
    data: { userId: EMPLOYEE_ID, password: PASSWORD },
    headers: { 'Content-Type': 'application/json' }
  });
  const loginData = await loginRes.json();
  console.log('Login response:', JSON.stringify(loginData));
  
  // Step 2: Try OTP verify endpoints
  const otp = await generateOTP();
  console.log('\n=== OTP:', otp, '===');
  
  const otpEndpoints = [
    '/auth/two-factor',
    '/auth/2fa',
    '/auth/verify-2fa',
    '/auth/otp/verify',
    '/two-factor/verify',
    '/api/auth/verify-2fa',
    '/api/auth/two-factor'
  ];
  
  for (const ep of otpEndpoints) {
    try {
      const res = await page.request.post(API_BASE + ep, {
        data: { userId: EMPLOYEE_ID, twoFactorCode: otp },
        headers: { 'Content-Type': 'application/json' }
      });
      const text = await res.text();
      console.log(`${ep}: ${res.status()}`, text.substring(0, 300));
    } catch (e) {
      console.log(`${ep}: ERROR - ${e.message}`);
    }
  }
  
  await browser.close();
})();
