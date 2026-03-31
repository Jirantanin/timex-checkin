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
  
  // Go to UI with proper cookies/auth
  await page.goto('https://timex.techsoftholding.co.th/login');
  await page.waitForTimeout(2000);
  
  // Store token
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    sessionStorage.setItem('token', t);
    localStorage.setItem('userId', '61019');
  }, token);
  
  // Also set in cookie
  await context.addCookies([{
    name: 'token',
    value: token,
    domain: 'timex.techsoftholding.co.th',
    path: '/'
  }]);
  
  await page.reload();
  await page.waitForTimeout(3000);
  
  console.log('UI URL:', page.url());
  const bodyText = await page.locator('body').innerText();
  console.log('UI content:\n', bodyText.substring(0, 500));
  
  // Try to navigate to checkin page and see if we can delete
  await page.goto('https://timex.techsoftholding.co.th/checkin-record');
  await page.waitForTimeout(3000);
  console.log('\ncheckin-record URL:', page.url());
  const recordText = await page.locator('body').innerText();
  console.log('checkin-record content:\n', recordText.substring(0, 500));
  
  await browser.close();
})();
