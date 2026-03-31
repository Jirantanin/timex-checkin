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
  
  // Try checkout
  console.log('=== ลอง checkout ===');
  const checkoutEndpoints = [
    '/attendance/checkout',
    '/attendance/check-out',
    '/attendance/clock-out',
    '/clockout',
    '/time/checkout'
  ];
  
  for (const ep of checkoutEndpoints) {
    try {
      const res = await page.request.post(API_BASE + ep, {
        data: { userId: EMPLOYEE_ID },
        headers
      });
      const text = await res.text();
      console.log(`POST ${ep}: ${res.status()} ${text.substring(0, 300)}`);
    } catch (e) {
      console.log(`POST ${ep}: ERROR`);
    }
  }
  
  // Also try to see what the JS bundle sends for checkin
  // by looking at the source
  console.log('\n=== ดู API docs จาก JS ===');
  const jsRes = await page.request.get('https://timex.techsoftholding.co.th/assets/index-q1Z95YI-.js');
  const jsText = await jsRes.text();
  
  // Search for checkin related strings
  const patterns = ['checkin', 'check-in', 'latitude', 'longitude', 'location', 'lat', 'lng', 'gps'];
  for (const p of patterns) {
    const idx = jsText.indexOf(p);
    if (idx !== -1) {
      console.log(`Found "${p}" at ${idx}: ${jsText.substring(idx-30, idx+80)}`);
    }
  }
  
  await browser.close();
})();
