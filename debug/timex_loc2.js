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
  
  // Login + OTP
  const loginRes = await page.request.post(API_BASE + '/auth/login', {
    data: { userId: EMPLOYEE_ID, password: PASSWORD },
    headers: { 'Content-Type': 'application/json' }
  });
  
  const otp = await generateOTP();
  const otpRes = await page.request.post(API_BASE + '/auth/verify-2fa', {
    data: { userId: EMPLOYEE_ID, code: otp },
    headers: { 'Content-Type': 'application/json' }
  });
  const otpData = await otpRes.json();
  const token = otpData.token;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  };
  
  // Try checkin WITHOUT location first
  console.log('=== Check-in ไม่มี location ===');
  const ci1 = await page.request.post(API_BASE + '/attendance/checkin', {
    data: { userId: EMPLOYEE_ID },
    headers
  });
  console.log('Status:', ci1.status(), await ci1.text());
  
  // Wait 2 sec
  await page.waitForTimeout(2000);
  
  // Checkout
  console.log('\n=== Checkout ===');
  const co = await page.request.post(API_BASE + '/attendance/checkout', {
    data: { userId: EMPLOYEE_ID },
    headers
  });
  console.log('Status:', co.status(), await co.text());
  
  // Wait 2 sec
  await page.waitForTimeout(2000);
  
  // Checkin with location
  console.log('\n=== Check-in with location ===');
  const ci2 = await page.request.post(API_BASE + '/attendance/checkin', {
    data: { 
      userId: EMPLOYEE_ID,
      latitude: 13.7563,
      longitude: 100.5018,
      address: 'Mock Location - Bangkok'
    },
    headers
  });
  console.log('Status:', ci2.status(), await ci2.text());
  
  await browser.close();
})();
