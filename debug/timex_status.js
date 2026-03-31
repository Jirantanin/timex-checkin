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
  
  // Try attendance records
  console.log('=== ดึงข้อมูลวันนี้ ===');
  const todayEndpoints = [
    '/attendance/today',
    '/attendance/record',
    '/attendance/current',
    '/time/today',
    '/api/attendance'
  ];
  
  for (const ep of todayEndpoints) {
    try {
      const res = await page.request.get(API_BASE + ep, { headers });
      const text = await res.text();
      console.log(`GET ${ep}: ${res.status()} ${text.substring(0, 500)}`);
    } catch (e) {
      console.log(`GET ${ep}: ERROR`);
    }
  }
  
  // Also try POST to get attendance
  console.log('\n=== ลอง POST attendance ===');
  const postEndpoints = ['/attendance', '/attendance/record', '/time'];
  for (const ep of postEndpoints) {
    try {
      const res = await page.request.post(API_BASE + ep, { data: { userId: EMPLOYEE_ID }, headers });
      const text = await res.text();
      console.log(`POST ${ep}: ${res.status()} ${text.substring(0, 500)}`);
    } catch (e) {
      console.log(`POST ${ep}: ERROR`);
    }
  }
  
  await browser.close();
})();
