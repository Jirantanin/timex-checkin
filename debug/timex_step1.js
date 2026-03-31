const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';
const SECRET_KEY = 'FOPVPLL3QRLSSA2Q';

async function generateOTP() {
  const OTPAuth = require('otpauth');
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
  const page = await browser.newPage();
  
  console.log('🔵 ไปหน้า login...');
  await page.goto('https://timex.techsoftholding.co.th/login');
  await page.waitForTimeout(2000);
  
  // กรอกรหัสพนักงาน
  console.log('🔵 กรอกรหัสพนักงาน:', EMPLOYEE_ID);
  await page.fill('input[placeholder="รหัสพนักงาน"]', EMPLOYEE_ID);
  await page.waitForTimeout(500);
  
  // กด Sign In
  console.log('🔵 กด Sign In...');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  console.log('📌 URL หลังกด:', page.url());
  
  // ดูว่ามี input ใหม่ไหม
  const inputs = await page.locator('input').all();
  console.log('Inputs หลัง login:', inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type');
    const placeholder = await inputs[i].getAttribute('placeholder');
    console.log(`  Input ${i}: type=${type}, placeholder=${placeholder}`);
  }
  
  // ดู text ทั้งหมด
  const bodyText = await page.locator('body').innerText();
  console.log('📝 เนื้อหา:\n', bodyText.substring(0, 800));
  
  await browser.close();
})();
