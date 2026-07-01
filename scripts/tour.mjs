import { chromium } from "playwright";
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1300,height:1000}});
// 1) ?demo= auto-runs GovGraph
const p=await ctx.newPage();const net=[];p.on("response",r=>{if(/api\/(chat|govern|orchestrate)/.test(r.url()))net.push(r.url().split("/api/")[1].split("?")[0]);});
await p.goto("http://localhost:4173/graph?demo=a%20hospital%20in%20Texas",{waitUntil:"domcontentloaded"});
let ok=false;for(let i=0;i<24;i++){await p.waitForTimeout(500);const t=await p.evaluate(()=>document.body.innerText);if(/United States|HIPAA|Frameworks that apply/i.test(t)){ok=true;break;}}
console.log("[graph ?demo] auto-ran:",ok,"| net:",net.join(","));
await p.close();
// 2) tour active shows card on /graph
const p2=await ctx.newPage();
await p2.goto("http://localhost:4173/",{waitUntil:"domcontentloaded"});
await p2.evaluate(()=>{localStorage.setItem("sov_tour_active","1");localStorage.setItem("sov_tour_step","1");});
await p2.goto("http://localhost:4173/graph?demo=a%20hospital%20in%20Texas",{waitUntil:"domcontentloaded"});await p2.waitForTimeout(1500);
const card=await p2.evaluate(()=>/Sovereign tour/.test(document.body.innerText));
console.log("[tour card] visible on step route:",card);
await p2.close();
// 3) invite pill appears on first visit
const p3=await ctx.newPage();
await p3.goto("http://localhost:4173/",{waitUntil:"domcontentloaded"});await p3.waitForTimeout(4200);
const invite=await p3.evaluate(()=>/Let me show you around/.test(document.body.innerText));
console.log("[invite pill] appears first visit:",invite);
await b.close();
