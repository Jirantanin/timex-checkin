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
  
  // Try check-in with location data
  console.log('=== ลอง check-in with location ===');
  const locationPayloads = [
    { userId: EMPLOYEE_ID, latitude: 13.7563, longitude: 100.5018 },
    { userId: EMPLOYEE_ID, lat: 13.7563, lng: 100.5018, location: 'Bangkok' },
    { userId: EMPLOYEE_ID, latitude: 13.7563, longitude: 100.5018, address: 'Bangkok' },
    { userId: EMPLOYEE_ID, checkinLat: 13.7563, checkinLng: 100.5018 },
    { userId: EMPLOYEE_ID, location: { lat: 13.7563, lng: 100.5018 } },
  ];
  
  for (const payload of locationPayloads) {
    try {
      const res = await page.request.post(API_BASE + '/attendance/checkin', {
        data: payload,
        headers
      });
      const text = await res.text();
      console.log(`Payload: ${JSON.stringify(payload)}`);
      console.log(`Result: ${res.status()} ${text.substring(0, 300)}\n`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
  
  await browser.close();
})();
