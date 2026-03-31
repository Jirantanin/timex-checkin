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
  
  // Look for manual checkin endpoint
  console.log('=== ดู JS หาวิธี checkin แบบ manual ===');
  const jsRes = await page.request.get('https://timex.techsoftholding.co.th/assets/index-q1Z95YI-.js');
  const jsText = await jsRes.text();
  
  // Search for manual checkin
  const manualIdx = jsText.indexOf('manual');
  const checkinIdx = jsText.indexOf('manualCheckIn');
  
  if (checkinIdx !== -1) {
    console.log('Found manualCheckIn at:', checkinIdx);
    console.log(jsText.substring(checkinIdx - 100, checkinIdx + 500));
  }
  
  // Search for any POST/PUT to attendance
  const postAttIdx = jsText.indexOf('Attendance/');
  console.log('\nAll Attendance references:', jsText.split('Attendance/').length);
  
  // Try PUT to update attendance record
  console.log('\n=== ลอง PUT update attendance วันนี้ ===');
  const putRes = await page.request.put(API_BASE + '/Attendance', {
    data: {
      UserId: EMPLOYEE_ID,
      AttendanceId: 7364,
      Latitude: 16.2468,
      Longitude: 103.2510,
      LocationName: 'มหาวิทยาลัยมหาสารคาม (Manual)',
      IsManualCheckIn: 1,
      ManualReason: 'Test'
    },
    headers
  });
  console.log('PUT Attendance:', putRes.status(), await putRes.text());
  
  // Try manual checkin endpoint
  console.log('\n=== ลอง manual-checkin ===');
  const manualRes = await page.request.post(API_BASE + '/Attendance/manual-checkin', {
    data: {
      UserId: EMPLOYEE_ID,
      Latitude: 16.2468,
      Longitude: 103.2510,
      LocationName: 'มหาวิทยาลัยมหาสารคาม'
    },
    headers
  });
  console.log('manual-checkin:', manualRes.status(), await manualRes.text());
  
  await browser.close();
})();
