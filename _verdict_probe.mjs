import { chromium } from 'playwright-core';
const BASE='http://localhost:5301';
const SCENARIOS=[
 'A bakery uses AI to suggest cupcake flavours to customers.',
 'A government builds a social scoring system that ranks all citizens by trustworthiness.',
 'An employer uses AI emotion recognition to monitor workers at their desks.',
];
const b=await chromium.launch();
for (const s of SCENARIOS){
  const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
  let chat='(no /api/chat call)';
  p.on('response', async r=>{ if(r.url().includes('/api/chat')){ try{ const j=JSON.parse(await r.text()); chat=(j.answer||j.reply||'').slice(0,300);}catch(e){chat='<parse fail>';} } });
  await p.goto(BASE+'/gspc-arena',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(5000);
  await p.locator('textarea').first().fill(s);
  await p.getByRole('button',{name:/Run experiment/i}).click({force:true});
  await p.waitForTimeout(32000);
  const t=await p.evaluate(()=>document.body.innerText);
  const m=t.match(/Council verdict:[^\n]*/);
  const cl=t.match(/Classifying the system[^\n]*/);
  const rg=t.match(/Applicable regimes detected:[^\n]*/);
  console.log('\n############ SCENARIO: '+s);
  console.log('API /api/chat SAID : '+chat.replace(/\n/g,' '));
  console.log('UI  '+(cl?cl[0]:'-'));
  console.log('UI  '+(rg?rg[0]:'-'));
  console.log('UI  VERDICT SHOWN  : '+(m?m[0]:'(none found)'));
  await p.context().close();
}
await b.close();
