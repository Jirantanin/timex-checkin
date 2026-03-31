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
  
  // Login + OTP flow
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
  console.log('Token:', token ? 'Got token ✓' : 'No token ✗');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  };
  
  // Go to checkin page with authenticated cookie
  await page.request.goto('https://timex.techsoftholding.co.th/checkin', { headers });
  await page.waitForTimeout(3000);
  console.log('Page URL:', page.url());
  
  // See if we can access the page
  const bodyText = await page.locator('body').innerText();
  console.log('Page content:\n', bodyText.substring(0, 1500));
  
  await browser.close();
})();
