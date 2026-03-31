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
  
  // Login
  const loginRes = await page.request.post(API_BASE + '/auth/login', {
    data: { userId: EMPLOYEE_ID, password: PASSWORD },
    headers: { 'Content-Type': 'application/json' }
  });
  const loginData = await loginRes.json();
  
  // OTP
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
  
  // Try check-in endpoints
  const checkinEndpoints = [
    '/attendance/checkin',
    '/attendance/check-in',
    '/checkin',
    '/clockin',
    '/attendance/clock-in',
    '/time/checkin',
    '/work/checkin'
  ];
  
  console.log('=== ลอง check-in endpoints ===');
  for (const ep of checkinEndpoints) {
    try {
      const res = await page.request.post(API_BASE + ep, {
        data: { userId: EMPLOYEE_ID },
        headers
      });
      const text = await res.text();
      console.log(`${ep}: ${res.status()} ${text.substring(0, 200)}`);
    } catch (e) {
      console.log(`${ep}: ERROR`);
    }
  }
  
  // Try GET too
  const getEndpoints = [
    '/attendance',
    '/attendance/today',
    '/checkin',
    '/time',
    '/profile'
  ];
  
  console.log('\n=== ลอง GET endpoints ===');
  for (const ep of getEndpoints) {
    try {
      const res = await page.request.get(API_BASE + ep, { headers });
      const text = await res.text();
      console.log(`GET ${ep}: ${res.status()} ${text.substring(0, 200)}`);
    } catch (e) {
      console.log(`GET ${ep}: ERROR`);
    }
  }
  
  await browser.close();
})();
