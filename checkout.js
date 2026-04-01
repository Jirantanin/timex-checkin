const OTPAuth = require('otpauth');

// ========== CONFIG ==========
const CONFIG = {
  EMPLOYEE_ID: process.env.EMPLOYEE_ID,
  PASSWORD: process.env.PASSWORD,
  SECRET_KEY: process.env.SECRET_KEY,
  API_BASE: 'https://timex.techsoftholding.co.th/LeaveSystemAPI/api',
  LOCATION: {
    lat: parseFloat(process.env.LOCATION_LAT),
    lng: parseFloat(process.env.LOCATION_LNG),
    name: process.env.LOCATION_NAME
  }
};

if (!CONFIG.EMPLOYEE_ID || !CONFIG.PASSWORD || !CONFIG.SECRET_KEY) {
  console.error('❌ Missing required env: EMPLOYEE_ID, PASSWORD, SECRET_KEY');
  process.exit(1);
}
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

async function checkout() {
  console.log('🔵 Login...');
  const login = await httpPost('/auth/login', {
    userId: CONFIG.EMPLOYEE_ID,
    password: CONFIG.PASSWORD
  });
  if (login.status !== 200) {
    console.log('❌ Login failed:', login.body);
    return { success: false, error: 'Login failed', detail: login.body };
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
    return { success: false, error: 'OTP verify failed', detail: verify.body };
  }
  const token = verify.body.token;

  console.log(`📍 Check-out: ${CONFIG.LOCATION.name} (${CONFIG.LOCATION.lat}, ${CONFIG.LOCATION.lng})`);
  const co = await httpPost('/Attendance/checkout', {
    UserId: CONFIG.EMPLOYEE_ID,
    Latitude: CONFIG.LOCATION.lat,
    Longitude: CONFIG.LOCATION.lng,
    LocationName: CONFIG.LOCATION.name
  }, token);

  if (co.status === 200) {
    console.log('✅ Check-out success!');
    return { success: true, message: 'Check-out สำเร็จ!', detail: co.body };
  } else {
    console.log('❌ Check-out failed:', co.body);
    return { success: false, error: co.body?.message || co.body || 'Check-out failed', detail: co.body };
  }
}

// Run and exit
checkout()
  .then(r => {
    console.log('\n📋 Result:', JSON.stringify(r, null, 2));
    process.exit(r.success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
