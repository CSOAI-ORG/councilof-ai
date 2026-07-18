const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  const sites = [
    ['Vercel','https://vercel.com/dashboard',/login|sign up|continue with/i],
    ['Lovable','https://lovable.dev/projects',/sign in|log in|get started free/i],
    ['GitHub','https://github.com/settings/profile',/sign in to github/i],
    ['Stripe','https://dashboard.stripe.com/',/sign in|email/i],
  ];
  for (const [name,url,re] of sites) {
    try {
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForTimeout(2500);
      const u = page.url(); const txt = (await page.title())+' '+u;
      const out = re.test(txt) || /login|signin|sign-in|accounts\.google/i.test(u);
      console.log(`${out?'❌ LOGGED OUT':'✅ logged in '} ${name.padEnd(8)} → ${u.slice(0,70)}`);
    } catch(e){ console.log(`⚠️  ${name} ${e.message.split('\n')[0].slice(0,60)}`); }
  }
  await page.close(); await b.close();
})();
