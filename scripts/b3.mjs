import { chromium } from "playwright";
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1300,height:1050}});
// 1) Watchdog ingest
const p=await ctx.newPage();
await p.goto("http://localhost:4173/watchdog-map",{waitUntil:"domcontentloaded"});await p.waitForTimeout(900);
await p.getByText("Pull live signals",{exact:false}).click({force:true});
let ing="";for(let i=0;i<44;i++){await p.waitForTimeout(500);const t=await p.evaluate(()=>document.body.innerText);const m=t.match(/Ingested (\d+) live signals/);if(m){ing=m[0];break;}if(/\[live signal\]/.test(t)){ing="live-signal-in-feed";break;}}
console.log("[watchdog] ingest:",ing||"FAILED");
await p.close();
// 2) Onboard final-step tour button (select profile + skip)
const p2=await ctx.newPage();
await p2.goto("http://localhost:4173/start",{waitUntil:"domcontentloaded"});await p2.waitForTimeout(700);
await p2.getByText("Start →",{exact:false}).first().click({force:true}).catch(()=>{});
await p2.waitForTimeout(400);
await p2.getByText("Skip",{exact:true}).click({force:true}).catch(()=>{});
await p2.waitForTimeout(500);
const hasBtn=await p2.evaluate(()=>/Show me around first/.test(document.body.innerText));
console.log("[onboard] final-step tour handoff button:",hasBtn);
await b.close();
