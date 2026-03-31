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
  
  // Check the JS to understand the exact payload
  const jsRes = await page.request.get('https://timex.techsoftholding.co.th/assets/index-q1Z95YI-.js');
  const jsText = await jsRes.text();
  
  // Find the checkin function - look around "attendance/checkin"
  const idx = jsText.indexOf('/attendance/checkin');
  if (idx !== -1) {
    console.log('Found checkin API at idx:', idx);
    console.log('Context:', jsText.substring(idx - 200, idx + 500));
  }
  
  // Also look for the "Already checked in" message
  const alreadyIdx = jsText.indexOf('Already checked');
  if (alreadyIdx !== -1) {
    console.log('\nFound "Already checked" at:', alreadyIdx);
    console.log('Context:', jsText.substring(alreadyIdx - 100, alreadyIdx + 200));
  }
  
  await browser.close();
})();
