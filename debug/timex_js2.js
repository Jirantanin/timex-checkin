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
  
  // Get JS file
  const jsRes = await page.request.get('https://timex.techsoftholding.co.th/assets/index-q1Z95YI-.js');
  const jsText = await jsRes.text();
  
  console.log('JS length:', jsText.length);
  
  // Search for checkin-related strings
  const searchTerms = ['attendance/checkin', 'checkin', 'latitude', 'longitude', 'Already checked', 'Check-In Failed'];
  
  for (const term of searchTerms) {
    const idx = jsText.indexOf(term);
    if (idx !== -1) {
      console.log(`\nFound "${term}" at ${idx}:`);
      console.log(jsText.substring(Math.max(0, idx-100), idx+300));
    }
  }
  
  await browser.close();
})();
