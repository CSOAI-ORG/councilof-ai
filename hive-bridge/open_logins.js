const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const urls = ['https://github.com/login','https://vercel.com/login','https://dashboard.stripe.com/login'];
  for (const u of urls) {
    const p = await ctx.newPage();
    await p.goto(u,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
    await p.bringToFront().catch(()=>{});
    console.log('opened tab →', u);
  }
  await b.close(); // detaches, leaves tabs open
})();
