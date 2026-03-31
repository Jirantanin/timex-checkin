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
  
  // Try with workDate field
  console.log('=== ลอง checkin พรุ่งนี้ + workDate ===');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const ciRes = await page.request.post(API_BASE + '/Attendance/checkin', {
    data: {
      UserId: EMPLOYEE_ID,
      Latitude: 16.2468,
      Longitude: 103.2510,
      LocationName: 'มหาวิทยาลัยมหาสารคาม',
      workDate: tomorrow.toISOString().split('T')[0]
    },
    headers
  });
  console.log('Check-in tomorrow + workDate:', ciRes.status(), await ciRes.text());
  
  // Try different payload variations
  console.log('\n=== ลอง payload ต่างๆ ===');
  
  const payloads = [
    { UserId: EMPLOYEE_ID, Latitude: 16.2468, Longitude: 103.2510, LocationName: 'Test Location' },
    { userId: EMPLOYEE_ID, Latitude: 16.2468, Longitude: 103.2510, LocationName: 'Test Location' },
    { UserId: EMPLOYEE_ID, lat: 16.2468, lng: 103.2510, location: 'Test Location' },
    { employeeId: EMPLOYEE_ID, Latitude: 16.2468, Longitude: 103.2510, LocationName: 'Test Location' },
  ];
  
  for (const p of payloads) {
    const r = await page.request.post(API_BASE + '/Attendance/checkin', {
      data: p,
      headers
    });
    console.log(`Payload: ${JSON.stringify(p)}`);
    console.log(`  Result: ${r.status()} ${(await r.text()).substring(0, 100)}`);
  }
  
  await browser.close();
})();
