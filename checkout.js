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

async function httpGet(path) {
  const res = await fetch(CONFIG.API_BASE + path, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
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

function getBangkokDateStr(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Could not resolve Asia/Bangkok date');
  }

  return `${year}-${month}-${day}`;
}

function normalizeApiDateStr(value) {
  if (!value) return null;

  const isoLikeMatch = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoLikeMatch) return isoLikeMatch[1];

  const slashDateMatch = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashDateMatch) {
    const [, month, day, year] = slashDateMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return getBangkokDateStr(parsed);
}

function isTodayHoliday(holidays) {
  const today = getBangkokDateStr();
  return holidays.find(h => {
    const holDate = normalizeApiDateStr(h.holidayDate);
    return holDate === today;
  });
}

function hasApprovedOrPendingLeaveToday(leaves) {
  const todayStr = getBangkokDateStr();
  return leaves.find(l => {
    if (!['Approved', 'Pending'].includes(l.status)) return false;
    const start = normalizeApiDateStr(l.startDate);
    const end = normalizeApiDateStr(l.endDate);
    if (!start || !end) return false;
    return todayStr >= start && todayStr <= end;
  });
}

async function checkPreConditions() {
  // Check holiday
  console.log('🔵 เช็ควันหยุด...');
  const holidaysRes = await httpGet('/leave/holidays');
  const holiday = isTodayHoliday(holidaysRes.body || []);
  if (holiday) {
    console.log(`⏭️ วันนี้ (${holiday.holidayDate}) ตรงกับ "${holiday.holidayName}" — ข้าม check-out`);
    return { skipped: true, reason: `วันหยุด: ${holiday.holidayName}` };
  }

  // Check approved or pending leave
  console.log('🔵 เช็ควันลา...');
  const leavesRes = await httpGet(`/Leave/User/${CONFIG.EMPLOYEE_ID}`);
  const leaves = leavesRes.body || [];
  const leave = hasApprovedOrPendingLeaveToday(leaves);
  if (leave) {
    const statusText = leave.status === 'Pending' ? 'รออนุมัติ' : 'อนุมัติแล้ว';
    console.log(`⏭️ วันนี้ตรงกับ "${leave.leaveTypeName || leave.typeName}" (${statusText}) — ข้าม check-out`);
    return { skipped: true, reason: `${leave.leaveTypeName || leave.typeName} (${statusText}): ${leave.reason}` };
  }

  return { skipped: false };
}

async function checkout() {
  // Pre-check: holiday & approved leave
  const pre = await checkPreConditions();
  if (pre.skipped) {
    return { success: true, skipped: true, message: pre.reason };
  }

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
