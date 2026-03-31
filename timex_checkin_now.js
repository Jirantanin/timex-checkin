const { chromium } = require('playwright');
const OTPAuth = require('otpauth');

// ========== CONFIG ==========
const CONFIG = {
  EMPLOYEE_ID: '61019',
  PASSWORD: 'N@029ii2',
  SECRET_KEY: 'FOPVPLL3QRLSSA2Q',
  // ✨ Fixed location
  LOCATION: {
    lat: 13.79177234,
    lng: 100.57600597,
    name: 'รัชดาภิเษก 20'
  }
};
// ============================

const API_BASE = 'https://timex.techsoftholding.co.th/LeaveSystemAPI/api';

async function generateOTP() {
  let totp = new OTPAuth.TOTP({
    issuer: 'LeaveSystem',
    label: 'User',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(CONFIG.SECRET_KEY)
  });
  return totp.generate();
}

async function checkin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Login
  console.log('🔵 Login...');
  const loginRes = await page.request.post(API_BASE + '/auth/login', {
    data: { userId: CONFIG.EMPLOYEE_ID, password: CONFIG.PASSWORD },
    headers: { 'Content-Type': 'application/json' }
  });
  const loginData = await loginRes.json();

  // 2. Generate OTP
  console.log('🔑 Generate OTP...');
  const otp = await generateOTP();
  console.log('   OTP:', otp);

  // 3. Verify OTP
  console.log('🔵 Verify OTP...');
  const otpRes = await page.request.post(API_BASE + '/auth/verify-2fa', {
    data: { userId: CONFIG.EMPLOYEE_ID, code: otp },
    headers: { 'Content-Type': 'application/json' }
  });
  const otpData = await otpRes.json();
  const token = otpData.token;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  };

  // 4. Check today's status
  console.log('📊 ตรวจสอบสถานะวันนี้...');
  const now = new Date();
  const historyRes = await page.request.get(API_BASE + '/Attendance/history', {
    params: { month: now.getMonth() + 1, year: now.getFullYear() },
    headers
  });
  const history = await historyRes.json();
  const today = history.find(h => h.workDate.startsWith(now.toISOString().split('T')[0]));

  // 5. Auto checkout if not already
  if (today?.checkInTime && !today?.checkOutTime) {
    console.log('⚠️ ยังไม่ได้เช็คเอาต์ - กำลังเช็คเอาต์ก่อน...');
    await page.request.post(API_BASE + '/Attendance/checkout', {
      data: { userId: CONFIG.EMPLOYEE_ID },
      headers
    });
    await page.waitForTimeout(2000);
  }

  // 6. Check-in with fixed location
  console.log(`\n📍 Check-in ด้วย Location:`);
  console.log(`   Lat: ${CONFIG.LOCATION.lat}, Lng: ${CONFIG.LOCATION.lng}`);
  console.log(`   สถานที่: ${CONFIG.LOCATION.name}`);

  const ciRes = await page.request.post(API_BASE + '/Attendance/checkin', {
    data: {
      UserId: CONFIG.EMPLOYEE_ID,
      Latitude: CONFIG.LOCATION.lat,
      Longitude: CONFIG.LOCATION.lng,
      LocationName: CONFIG.LOCATION.name
    },
    headers
  });

  const ciText = await ciRes.text();
  console.log(`\n${ciRes.status() === 200 ? '✅' : '❌'} Check-in Response:`, ciText);

  await browser.close();
  return { status: ciRes.status(), body: ciText };
}

// Run!
checkin()
  .then(r => {
    if (r.status === 200) {
      console.log('\n🎉 Check-in สำเร็จ!');
    } else {
      console.log('\n😢 Check-in ไม่สำเร็จ:', r.body);
    }
  })
  .catch(err => console.error('❌ Error:', err.message));
