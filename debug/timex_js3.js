const { chromium } = require('playwright');

const API_BASE = 'https://timex.techsoftholding.co.th/LeaveSystemAPI/api';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const loginRes = await page.request.post(API_BASE + '/auth/login', {
    data: { userId: '61019', password: 'N@029ii2' },
    headers: { 'Content-Type': 'application/json' }
  });
  
  const jsRes = await page.request.get('https://timex.techsoftholding.co.th/assets/index-q1Z95YI-.js');
  const jsText = await jsRes.text();
  
  // Look for the full checkin submission block
  // Search around "Check-In Failed"
  const failedIdx = jsText.indexOf('Check-In Failed');
  if (failedIdx !== -1) {
    console.log('Check-In Failed context:');
    console.log(jsText.substring(failedIdx - 200, failedIdx + 300));
  }
  
  // Search around attendance/checkin
  const attIdx = jsText.indexOf('attendance/checkin');
  if (attIdx !== -1) {
    console.log('\nattendance/checkin context:');
    console.log(jsText.substring(attIdx - 300, attIdx + 500));
  }
  
  // Search around "get-location-na"
  const locIdx = jsText.indexOf('get-location-na');
  if (locIdx !== -1) {
    console.log('\nget-location-na context:');
    console.log(jsText.substring(locIdx - 100, locIdx + 400));
  }
  
  await browser.close();
})();
