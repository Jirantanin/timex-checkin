const OTPAuth = require('otpauth');

// Secret key from the otpauth URL
const secret = 'FOPVPLL3QRLSSA2Q';

let totp = new OTPAuth.TOTP({
  issuer: 'LeaveSystem',
  label: 'User',
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  secret: OTPAuth.Secret.fromBase32(secret)
});

// Generate current code
let code = totp.generate();
console.log('Current OTP:', code);

// Also show time until next code
let now = new Date();
let seconds = Math.floor((Date.now() / 1000) % 30);
console.log('Expires in:', 30 - seconds, 'seconds');
