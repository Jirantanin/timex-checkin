const { chromium } = require('playwright');

const EMPLOYEE_ID = '61019';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://timex.techsoftholding.co.th/login');
  await page.waitForTimeout(2000);
  
  // ดูโครงสร้าง form
  const html = await page.content();
  
  // หา input fields ทั้งหมด
  const inputs = await page.locator('input').all();
  console.log('Inputs count:', inputs.length);
  
  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i];
    const name = await inp.getAttribute('name');
    const id = await inp.getAttribute('id');
    const type = await inp.getAttribute('type');
    const placeholder = await inp.getAttribute('placeholder');
    const className = await inp.getAttribute('class');
    console.log(`Input ${i}: name=${name}, id=${id}, type=${type}, placeholder=${placeholder}`);
    console.log(`  class=${className}`);
  }
  
  // หา buttons
  const buttons = await page.locator('button').all();
  console.log('\nButtons count:', buttons.length);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].innerText();
    const type = await buttons[i].getAttribute('type');
    console.log(`Button ${i}: "${text}", type=${type}`);
  }
  
  // ลองดู form
  const form = await page.locator('form').all();
  console.log('\nForms count:', form.length);
  
  await browser.close();
})();
