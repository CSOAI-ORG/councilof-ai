const { chromium } = require("@playwright/test");
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1200,height:820}});
  await p.goto("http://127.0.0.1:4173/os",{waitUntil:"load"}); await p.waitForTimeout(1000);
  async function cmd(s){ await p.fill("#chatIn",s); await p.press("#chatIn","Enter"); await p.waitForTimeout(300); return await p.evaluate(()=>document.body.className); }
  const pro=await cmd("show me the pro view");
  const orb=await cmd("minimise to an orb");
  const council=await cmd("open the council");
  const simple=await cmd("make it simple and clean");
  await p.fill("#chatIn","make the theme calmer"); await p.press("#chatIn","Enter"); await p.waitForTimeout(300);
  const calm=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--accent").trim());
  console.log("pro="+pro+" | orb="+orb+" | council="+council+" | simple="+simple+" | calmAccent="+calm);
  await b.close();
})().catch(e=>console.log("ERR "+e.message));
