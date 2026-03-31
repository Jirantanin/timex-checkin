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
  
  // Step 1: Login
  console.log('=== Step 1: Login ===');
  const loginRes = await page.request.post(API_BASE + '/auth/login', {
    data: { userId: EMPLOYEE_ID, password: PASSWORD },
    headers: { 'Content-Type': 'application/json' }
  });
  const loginData = await loginRes.json();
  console.log('Status:', loginRes.status(), '| requires2FA:', loginData.requiresTwoFactor);
  
  // Step 2: Verify OTP
  const otp = await generateOTP();
  console.log('\n=== Step 2: Verify OTP ===');
  console.log('OTP:', otp);
  
  const otpRes = await page.request.post(API_BASE + '/auth/verify-2fa', {
    data: { userId: EMPLOYEE_ID, code: otp },
    headers: { 'Content-Type': 'application/json' }
  });
  const otpData = await otpRes.json();
  console.log('Status:', otpRes.status());
  console.log('Response:', JSON.stringify(otpData));
  
  if (otpData.token) {
    console.log('\n🎉 LOGIN SUCCESS! Token:', otpData.token.substring(0, 50) + '...');
    
    // Step 3: Try check-in
    console.log('\n=== Step 3: Check-in ===');
    const checkinRes = await page.request.post(API_BASE + '/checkin', {
      data: { userId: EMPLOYEE_ID },
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + otpData.token
      }
    });
    console.log('Checkin status:', checkinRes.status());
    console.log('Checkin response:', (await checkinRes.text()).substring(0, 500));
  }
  
  await browser.close();
})();
