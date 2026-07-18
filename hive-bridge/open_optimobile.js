const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  // account switcher entry; if logged in this shows the switch/add UI
  await p.goto('https://github.com/login',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
  await p.bringToFront();
  console.log('opened bridge tab →', p.url());
  await b.close(); // leave tab open
})();
