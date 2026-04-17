const OTPAuth = require('otpauth');

const CONFIG = {
  EMPLOYEE_ID: process.env.EMPLOYEE_ID,
  PASSWORD: process.env.PASSWORD,
  SECRET_KEY: process.env.SECRET_KEY,
  API_BASE: 'https://timex.techsoftholding.co.th/LeaveSystemAPI/api',
  ATTENDANCE_API_BASE: 'https://timex.techsoftholding.co.th/api',
  LOCATION: {
    lat: parseFloat(process.env.LOCATION_LAT),
    lng: parseFloat(process.env.LOCATION_LNG),
    name: process.env.LOCATION_NAME
  },
  MANUAL_CHECKIN_REASON: 'Auto check-in by GitHub Actions'
};

if (!CONFIG.EMPLOYEE_ID || !CONFIG.PASSWORD || !CONFIG.SECRET_KEY) {
  console.error('Missing required env: EMPLOYEE_ID, PASSWORD, SECRET_KEY');
  process.exit(1);
}

async function parseResponseBody(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function httpPost(baseUrl, path, data, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });

  return { status: res.status, body: await parseResponseBody(res) };
}

async function httpGet(path) {
  const res = await fetch(CONFIG.API_BASE + path, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  return { status: res.status, body: await parseResponseBody(res) };
}

function generateOTP() {
  const totp = new OTPAuth.TOTP({
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
  return holidays.find((holiday) => {
    const holidayDate = normalizeApiDateStr(holiday.holidayDate);
    return holidayDate === today;
  });
}

function hasApprovedOrPendingLeaveToday(leaves) {
  const todayStr = getBangkokDateStr();
  return leaves.find((leave) => {
    if (!['Approved', 'Pending'].includes(leave.status)) return false;
    const start = normalizeApiDateStr(leave.startDate);
    const end = normalizeApiDateStr(leave.endDate);
    if (!start || !end) return false;
    return todayStr >= start && todayStr <= end;
  });
}

function getBangkokDateParts() {
  const dateStr = getBangkokDateStr();
  const [year, month, day] = dateStr.split('-');
  return { year, month, day };
}

function getManualCheckinDateTime() {
  const { year, month, day } = getBangkokDateParts();
  return `${year}-${month}-${day}T09:40:00+07:00`;
}

async function checkPreConditions() {
  console.log('Checking holidays...');
  const holidaysRes = await httpGet('/leave/holidays');
  const holiday = isTodayHoliday(holidaysRes.body || []);
  if (holiday) {
    console.log(`Skip check-in because today is holiday: ${holiday.holidayName}`);
    return { skipped: true, reason: `Holiday: ${holiday.holidayName}` };
  }

  console.log('Checking leave requests...');
  const leavesRes = await httpGet(`/Leave/User/${CONFIG.EMPLOYEE_ID}`);
  const leave = hasApprovedOrPendingLeaveToday(leavesRes.body || []);
  if (leave) {
    const statusText = leave.status === 'Pending' ? 'Pending' : 'Approved';
    console.log(`Skip check-in because leave exists: ${leave.leaveTypeName || leave.typeName} (${statusText})`);
    return {
      skipped: true,
      reason: `${leave.leaveTypeName || leave.typeName} (${statusText}): ${leave.reason}`
    };
  }

  return { skipped: false };
}

async function checkin() {
  const pre = await checkPreConditions();
  if (pre.skipped) {
    return { success: true, skipped: true, message: pre.reason };
  }

  console.log('Login...');
  const login = await httpPost(CONFIG.API_BASE, '/auth/login', {
    userId: CONFIG.EMPLOYEE_ID,
    password: CONFIG.PASSWORD
  });
  if (login.status !== 200) {
    return { success: false, error: 'Login failed', detail: login.body };
  }

  console.log('Generate OTP...');
  const otp = generateOTP();

  console.log('Verify OTP...');
  const verify = await httpPost(CONFIG.API_BASE, '/auth/verify-2fa', {
    userId: CONFIG.EMPLOYEE_ID,
    code: otp
  });
  if (verify.status !== 200 || !verify.body.token) {
    return { success: false, error: 'OTP verify failed', detail: verify.body };
  }

  const selectedDateTime = getManualCheckinDateTime();
  console.log(`Manual check-in at ${selectedDateTime}`);
  console.log(`Location: ${CONFIG.LOCATION.name} (${CONFIG.LOCATION.lat}, ${CONFIG.LOCATION.lng})`);

  const checkinRes = await httpPost(
    CONFIG.ATTENDANCE_API_BASE,
    '/Attendance/manual-checkin',
    {
      userId: CONFIG.EMPLOYEE_ID,
      selectedDateTime,
      reason: CONFIG.MANUAL_CHECKIN_REASON,
      lat: CONFIG.LOCATION.lat,
      long: CONFIG.LOCATION.lng
    },
    verify.body.token
  );

  if (checkinRes.status === 200) {
    return {
      success: true,
      message: 'Manual check-in success',
      selectedDateTime,
      detail: checkinRes.body
    };
  }

  return {
    success: false,
    error: checkinRes.body?.message || checkinRes.body || 'Manual check-in failed',
    selectedDateTime,
    detail: checkinRes.body
  };
}

checkin()
  .then((result) => {
    console.log('\nResult:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
