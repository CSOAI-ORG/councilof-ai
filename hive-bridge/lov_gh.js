const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p=>p.url().includes('a6fd6317'));
  if(!page){console.log('project page not open');await b.close();return;}
  await page.bringToFront();
  try{ await page.getByText(/GitHub/).first().click({timeout:5000}); await page.waitForTimeout(2500);}catch(e){console.log('github click:',e.message.split('\n')[0]);}
  await page.screenshot({path:'/tmp/hive_shots/lov_github_connect.png'}).catch(()=>{});
  const opts = await page.$$eval('button,a,[role=button],input,select,h2,h3,p', els=>[...new Set(els.map(e=>(e.innerText||e.getAttribute('placeholder')||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<70))]);
  console.log('connect screen:', JSON.stringify(opts.filter(o=>/git|repo|connect|create|authorize|install|csoai|org|account|reconnect|branch|sync|disconnect/i.test(o)).slice(0,25)));
  await b.close();
})();
