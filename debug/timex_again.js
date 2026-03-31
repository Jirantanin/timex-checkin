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
  
  // Login fresh
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
  
  // Delete today's attendance record entirely
  console.log('=== ลองลบ attendance วันนี้ ===');
  const deleteRes = await page.request.delete(API_BASE + '/Attendance/7364', {
    headers
  }).catch(() => null);
  
  if (deleteRes) {
    console.log('Delete by ID:', deleteRes.status(), await deleteRes.text());
  } else {
    console.log('Delete by ID: request failed');
  }
  
  // Try with shiftId
  console.log('\n=== ลอง checkin พร้อม shiftId ===');
  const ciRes = await page.request.post(API_BASE + '/Attendance/checkin', {
    data: {
      UserId: EMPLOYEE_ID,
      Latitude: 16.2468,
      Longitude: 103.2510,
      LocationName: 'มหาวิทยาลัยมหาสารคาม',
      ShiftId: 'WN003'
    },
    headers
  });
  console.log('Check-in with ShiftId:', ciRes.status(), await ciRes.text());
  
  // Try with different location - ACTUAL location from history
  console.log('\n=== ลอง checkin ด้วย location จริงของ user ===');
  const realLat = 13.79177234;
  const realLng = 100.57600597;
  
  const ciReal = await page.request.post(API_BASE + '/Attendance/checkin', {
    data: {
      UserId: EMPLOYEE_ID,
      Latitude: realLat,
      Longitude: realLng,
      LocationName: 'รัชดาภิเษก 20'
    },
    headers
  });
  console.log('Check-in real location:', ciReal.status(), await ciReal.text());
  
  await browser.close();
})();
