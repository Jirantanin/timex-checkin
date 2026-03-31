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
  
  // Find the check-in function - look for "IN" and "OUT" around attendance
  // The snippet shows: N=async R=>{const Z=R==="IN"?"เข้างาน":"ออกงาน";if(!co
  const inIdx = jsText.indexOf('R==="IN"?"เข้างาน":"ออกงาน"');
  if (inIdx !== -1) {
    console.log('Check-in function context:');
    console.log(jsText.substring(inIdx - 50, inIdx + 800));
  }
  
  await browser.close();
})();
