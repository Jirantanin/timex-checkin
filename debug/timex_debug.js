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
  
  // Get full history
  const now = new Date();
  const historyRes = await page.request.get(API_BASE + '/Attendance/history', {
    params: { month: now.getMonth() + 1, year: now.getFullYear() },
    headers
  });
  const history = await historyRes.json();
  
  console.log('=== Full History ===');
  history.forEach(h => {
    console.log(`${h.workDate}: In=${h.checkInTime}, Out=${h.checkOutTime}, Status=${h.status}`);
  });
  
  // Try checkout anyway
  console.log('\n=== Try checkout ===');
  const coRes = await page.request.post(API_BASE + '/Attendance/checkout', {
    data: { userId: EMPLOYEE_ID },
    headers
  });
  console.log('Checkout:', coRes.status(), await coRes.text());
  
  // Try check-in again
  console.log('\n=== Try check-in again ===');
  const ciRes = await page.request.post(API_BASE + '/Attendance/checkin', {
    data: {
      UserId: EMPLOYEE_ID,
      Latitude: 16.2468,
      Longitude: 103.2510,
      LocationName: 'มหาวิทยาลัยมหาสารคาม'
    },
    headers
  });
  console.log('Check-in:', ciRes.status(), await ciRes.text());
  
  await browser.close();
})();
