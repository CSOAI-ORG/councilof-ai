import { chromium } from "playwright";
const b=await chromium.launch();const p=await(await b.newContext()).newPage();
const net=[];p.on("response",r=>{if(/api\/(health|tools)/.test(r.url()))net.push(r.status());});
await p.goto("http://localhost:4173/status",{waitUntil:"domcontentloaded"});
let t="";for(let i=0;i<20;i++){await p.waitForTimeout(500);t=await p.evaluate(()=>document.body.innerText);if(/CONNECTED/.test(t))break;}
console.log("SOV3 CONNECTED:",/SOV3 brain - CONNECTED/.test(t));
console.log("version v3.0.0:",/v3\.0\.0/.test(t));
console.log("surface meok/csoai/defoneos:",/meok/.test(t)&&/defoneos/.test(t));
console.log("protocols (sign/verify/govern/avatar/social):",["Sign","Verify","Govern","Avatar","Social","Legacy Bridge"].filter(x=>t.includes(x)).length+"/6");
console.log("orchestrator live:",/Orchestrator/.test(t));
console.log("governed tools 377:",/377/.test(t));
console.log("net:",net.join(","));
await b.close();
