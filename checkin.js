const OTPAuth = require('otpauth');

// ========== CONFIG ==========
const CONFIG = {
  EMPLOYEE_ID: process.env.EMPLOYEE_ID || '61019',
  PASSWORD: process.env.PASSWORD || 'N@029ii2',
  SECRET_KEY: process.env.SECRET_KEY || 'FOPVPLL3QRLSSA2Q',
  API_BASE: 'https://timex.techsoftholding.co.th/LeaveSystemAPI/api',
  LOCATION: {
    lat: parseFloat(process.env.LOCATION_LAT || '13.79177234'),
    lng: parseFloat(process.env.LOCATION_LNG || '100.57600597'),
    name: process.env.LOCATION_NAME || 'รัชดาภิเษก 20'
  }
};
// ============================

async function httpPost(path, data, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(CONFIG.API_BASE + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  return { status: res.status, body: await res.json() };
}

async function httpGet(path, token, params = {}) {
  const url = new URL(CONFIG.API_BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return { status: res.status, body: await res.json() };
}

function generateOTP() {
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
  console.log('🔵 Login...');
  const login = await httpPost('/auth/login', {
    userId: CONFIG.EMPLOYEE_ID,
    password: CONFIG.PASSWORD
  });
  if (login.status !== 200) {
    console.log('❌ Login failed:', login.body);
    return { success: false, error: 'Login failed' };
  }

  console.log('🔑 Generate OTP...');
  const otp = generateOTP();
  console.log('   OTP:', otp);

  console.log('🔵 Verify OTP...');
  const verify = await httpPost('/auth/verify-2fa', {
    userId: CONFIG.EMPLOYEE_ID,
    code: otp
  });
  if (verify.status !== 200 || !verify.body.token) {
    console.log('❌ OTP verify failed:', verify.body);
    return { success: false, error: 'OTP verify failed' };
  }
  const token = verify.body.token;

  console.log('📊 ตรวจสอบสถานะ...');
  const now = new Date();
  const history = await httpGet('/Attendance/history', token, {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  });
  const today = history.body?.find(h => h.workDate.startsWith(now.toISOString().split('T')[0]));

  if (today?.checkInTime && !today?.checkOutTime) {
    console.log('⚠️ ยังไม่ได้เช็คเอาต์ - กำลังเช็คเอาต์ก่อน...');
    await httpPost('/Attendance/checkout', { userId: CONFIG.EMPLOYEE_ID }, token);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`📍 Check-in: ${CONFIG.LOCATION.name} (${CONFIG.LOCATION.lat}, ${CONFIG.LOCATION.lng})`);
  const ci = await httpPost('/Attendance/checkin', {
    UserId: CONFIG.EMPLOYEE_ID,
    Latitude: CONFIG.LOCATION.lat,
    Longitude: CONFIG.LOCATION.lng,
    LocationName: CONFIG.LOCATION.name
  }, token);

  if (ci.status === 200) {
    console.log('✅ Check-in success!');
    return { success: true, message: 'Check-in สำเร็จ!', detail: ci.body };
  } else {
    console.log('❌ Check-in failed:', ci.body);
    return { success: false, error: ci.body.message || 'Check-in failed', detail: ci.body };
  }
}

// Run and exit
checkin()
  .then(r => {
    console.log('\n📋 Result:', JSON.stringify(r, null, 2));
    process.exit(r.success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
