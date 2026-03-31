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
  const loginData = await loginRes.json();
  
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
  
  // Checkout first (to test checkin again)
  console.log('=== Checkout first ===');
  const coRes = await page.request.post(API_BASE + '/attendance/checkout', {
    data: { userId: EMPLOYEE_ID },
    headers
  });
  console.log('Checkout:', coRes.status(), await coRes.text());
  
  // Now try checkin with explicit lat/lng
  console.log('\n=== Check-in with lat/lng ===');
  const ciRes = await page.request.post(API_BASE + '/attendance/checkin', {
    data: { 
      userId: EMPLOYEE_ID,
      latitude: 13.7563,
      longitude: 100.5018
    },
    headers
  });
  const ciText = await ciRes.text();
  console.log('Checkin:', ciRes.status(), ciText);
  
  await browser.close();
})();
