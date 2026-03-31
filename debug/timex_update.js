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
  
  // Get today's attendance status
  const now = new Date();
  const historyRes = await page.request.get(API_BASE + '/Attendance/history', {
    params: { month: now.getMonth() + 1, year: now.getFullYear() },
    headers
  });
  const history = await historyRes.json();
  const today = history.find(h => h.workDate.startsWith(now.toISOString().split('T')[0]));
  
  console.log('Today attendance:');
  console.log(JSON.stringify(today, null, 2));
  
  // Check if there's a flag for "can checkin"
  console.log('\ncheckInTime:', today?.checkInTime);
  console.log('checkOutTime:', today?.checkOutTime);
  
  // Try UPDATE the existing record instead
  console.log('\n=== ลอง update checkin แทน ===');
  const updateRes = await page.request.put(API_BASE + '/Attendance/checkin', {
    data: {
      UserId: EMPLOYEE_ID,
      AttendanceId: today?.attendanceId,
      Latitude: 16.2468,
      Longitude: 103.2510,
      LocationName: 'มหาวิทยาลัยมหาสารคาม'
    },
    headers
  });
  console.log('PUT update:', updateRes.status(), await updateRes.text());
  
  // Try with PATCH
  console.log('\n=== ลอง PATCH ===');
  const patchRes = await page.request.patch(API_BASE + '/Attendance/' + today?.attendanceId, {
    data: {
      checkInLat: 16.2468,
      checkInLong: 103.2510,
      checkInLocation: 'มหาวิทยาลัยมหาสารคาม'
    },
    headers
  });
  console.log('PATCH:', patchRes.status(), await patchRes.text());
  
  await browser.close();
})();
