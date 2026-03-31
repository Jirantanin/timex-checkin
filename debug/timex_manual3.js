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
  
  // Try with different field combinations
  const payloads = [
    { UserId: EMPLOYEE_ID, Latitude: 16.2468, Longitude: 103.2510, LocationName: 'มหาวิทยาลัยมหาสารคาม', Reason: 'ทดสอบ' },
    { userId: EMPLOYEE_ID, Latitude: 16.2468, Longitude: 103.2510, LocationName: 'Test', Reason: 'Test', Type: 'IN' },
    { userId: EMPLOYEE_ID, latitude: 16.2468, longitude: 103.2510, locationName: 'Test', reason: 'Test' },
  ];
  
  for (let i = 0; i < payloads.length; i++) {
    const res = await page.request.post(API_BASE + '/Attendance/manual-checkin', {
      data: payloads[i],
      headers
    });
    console.log(`Payload ${i}: ${res.status()} ${await res.text()}`);
  }
  
  // Also try /Attendance/manual
  console.log('\n=== /Attendance/manual ===');
  const r = await page.request.post(API_BASE + '/Attendance/manual', {
    data: { UserId: EMPLOYEE_ID, Latitude: 16.2468, Longitude: 103.2510, LocationName: 'Test', Reason: 'Test' },
    headers
  });
  console.log('manual:', r.status(), await r.text());
  
  await browser.close();
})();
