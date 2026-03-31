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
  
  // Try POST to create new attendance (not checkin/checkout)
  console.log('=== ลองสร้าง attendance record ใหม่ ===');
  const createEndpoints = [
    '/Attendance',
    '/Attendance/create',
    '/Attendance/new'
  ];
  
  for (const ep of createEndpoints) {
    try {
      const res = await page.request.post(API_BASE + ep, {
        data: {
          userId: EMPLOYEE_ID,
          workDate: new Date().toISOString().split('T')[0],
          checkInTime: new Date().toISOString(),
          Latitude: 16.2468,
          Longitude: 103.2510,
          LocationName: 'มหาวิทยาลัยมหาสารคาม'
        },
        headers
      });
      const text = await res.text();
      console.log(`POST ${ep}: ${res.status()} ${text.substring(0, 300)}`);
    } catch (e) {
      console.log(`POST ${ep}: ERROR`);
    }
  }
  
  // Try checkin with tomorrows date
  console.log('\n=== ลอง checkin วันพรุ่งนี้ ===');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const ciRes = await page.request.post(API_BASE + '/Attendance/checkin', {
    data: {
      UserId: EMPLOYEE_ID,
      Latitude: 16.2468,
      Longitude: 103.2510,
      LocationName: 'มหาวิทยาลัยมหาสารคาม',
      WorkDate: tomorrow.toISOString().split('T')[0]
    },
    headers
  });
  console.log('Check-in tomorrow:', ciRes.status(), await ciRes.text());
  
  await browser.close();
})();
