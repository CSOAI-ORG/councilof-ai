import { chromium } from "playwright";
const b=await chromium.launch();const p=await(await b.newContext({viewport:{width:1280,height:1000}})).newPage();
const net=[];p.on("response",r=>{if(/api\/(chat|govern)/.test(r.url()))net.push(r.url().split("/api/")[1].split("?")[0]);});
await p.goto("http://localhost:4173/globe",{waitUntil:"domcontentloaded"});await p.waitForTimeout(900);
const inp=p.locator("input").first();await inp.click();await inp.pressSequentially("what governs a hospital AI in Germany?",{delay:4});await inp.press("Enter");
let sel="",ans="";for(let i=0;i<26;i++){await p.waitForTimeout(500);const t=await p.evaluate(()=>document.body.innerText);ans=t;sel=(t.match(/EU AI Act|GDPR/)||[""])[0];if(/Governance stack|high.?risk|EU AI Act/i.test(t)&&/hospital|healthcare|risk|Act/i.test(t)&&t.length>500)break;}
console.log("globe selected EU pin:",/EU AI Act|Brussels|Transparency 2 Aug/i.test(ans));
console.log("Sovereign answered:",net.join(",")||"(none)");
const a=(ans.split("Ask the Sovereign about the world")[1]||"").slice(0,200).replace(/\n+/g," ").trim();
console.log("answer snippet:",a.slice(0,160));
await b.close();
