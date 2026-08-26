import { chromium } from 'playwright-core';
const BASE='http://localhost:5301';
const b=await chromium.launch(); const p=await (await b.newContext()).newPage();
for (const r of process.argv.slice(2)) {
  await p.goto(BASE+r,{waitUntil:'networkidle',timeout:45000}); await p.waitForTimeout(1500);
  const links=await p.evaluate(()=>[...document.querySelectorAll('main a[href], a[href]')].map(a=>`${(a.innerText||'').trim().replace(/\s+/g,' ').slice(0,55)}  ->  ${a.getAttribute('href')}`));
  console.log(`##### ${r}`); console.log([...new Set(links)].join('\n'));
}
await b.close();
