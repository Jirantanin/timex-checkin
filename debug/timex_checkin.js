const OTPAuth = require('otpauth');
const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';
const SECRET_KEY = 'FOPVPLL3QRLSSA2Q';
const TIME_URL = 'https://timex.techsoftholding.co.th/checkin';

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

async function checkin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🔵 เปิดเว็บ TimeX...');
    await page.goto(TIME_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // ดู URL ปัจจุบัน
    console.log('📌 URL:', page.url());
    
    // ถ้ายังอยู่หน้า login
    if (page.url().includes('/login')) {
      console.log('🔵 กำลัง login...');
      
      // พิมพ์ employee ID
      await page.fill('input[type="text"], input[name="username"], input#employeeId', EMPLOYEE_ID);
      await page.waitForTimeout(500);
      
      // กด Sign In
      await page.click('button[type="submit"], button:has-text("Sign In")');
      await page.waitForTimeout(3000);
      
      console.log('📌 URL หลัง login:', page.url());
    }
    
    // ถ้าไปหน้า OTP
    if (page.url().includes('/otp') || page.url().includes('verify')) {
      console.log('🔵 กำลังสร้าง OTP...');
      const otp = await generateOTP();
      console.log('🔑 OTP:', otp);
      
      await page.fill('input[type="text"][maxlength="6"], input[name="otp"], input#otp', otp);
      await page.waitForTimeout(500);
      
      await page.click('button[type="submit"], button:has-text("Verify"), button:has-text("ยืนยัน")');
      await page.waitForTimeout(3000);
      
      console.log('📌 URL หลัง OTP:', page.url());
    }
    
    // ดูหน้าปัจจุบัน
    console.log('📌 หน้าสุดท้าย:', page.url());
    const bodyText = await page.locator('body').innerText();
    console.log('📝 เนื้อหา:\n', bodyText.substring(0, 1000));
    
    // ดูปุ่ม check-in
    const checkinBtn = page.locator('button:has-text("เช็ค"), button:has-text("Check"), button:has-text("ลง"), button[type="submit"]');
    const btnCount = await checkinBtn.count();
    console.log('🔘 ปุ่มที่พบ:', btnCount);
    
    if (btnCount > 0) {
      const btnText = await checkinBtn.first().innerText();
      console.log('🔘 ปุ่มแรก:', btnText);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
}

checkin();
