const {chromium}=require('playwright');
const B=process.argv[2]||'https://os.meok.ai';
const APPS=["king","council","fleet","hives","one","chars","watchdog","revenue","runway","coord","atlas","truth","archive","execute","protocol0","labs","meokearth","archetypes","investor","distro","stack","olm","ops","delboy","guardian","aware","family","work","map","sigil","assurance","claw","smb","setup","social","bridges","temples","leaderboard","minds"];
(async()=>{
  const br=await chromium.launch();
  const ctx=await br.newContext({viewport:{width:1280,height:800}});
  // skip onboarding
  await ctx.addInitScript(()=>{ try{localStorage.setItem('meok_welcomed','1');localStorage.setItem('meok_sov_name','Sophia');localStorage.setItem('meok_archetype','guardian');}catch(e){} });
  const p=await ctx.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push('PE:'+String(e).slice(0,70)));
  p.on('console',m=>{ if(m.type()==='error'){ const t=m.text(); if(!/127.0.0.1|localhost|ERR_|CORS/.test(t)) errs.push(t.slice(0,70)); }});
  await p.goto(B,{waitUntil:'networkidle',timeout:30000}); await p.waitForTimeout(2500);
  let empty=0, broke=0;
  const results=[];
  for(const id of APPS){
    const before=errs.length;
    let r;
    try{
      r=await p.evaluate((id)=>{ try{ if(typeof openApp!=='function') return {ok:false,why:'no openApp'}; openApp(id); const wins=document.querySelectorAll('.win,.window,[data-win]'); const last=wins[wins.length-1]; const txt=last?(last.innerText||'').trim():''; return {ok:true,len:txt.length,head:txt.slice(0,30).replace(/\n/g,' ')}; }catch(e){ return {ok:false,why:String(e.message).slice(0,50)}; } }, id);
    }catch(e){ r={ok:false,why:String(e.message).slice(0,50)}; }
    await p.waitForTimeout(250);
    const newErr=errs.length-before;
    if(!r.ok){ broke++; console.log(`  ✗ ${id}: ${r.why}`); }
    else if(r.len<15){ empty++; console.log(`  ⚠ ${id}: empty (${r.len} chars)`); }
    else if(newErr>0){ broke++; console.log(`  ✗ ${id}: ${newErr} console err`); }
    // else silent pass
  }
  console.log(`\n  ${APPS.length} apps · ${broke} broke · ${empty} empty · ${APPS.length-broke-empty} clean`);
  console.log('  total non-local console errors:', errs.length? errs.slice(0,3).join(' | ') : 'NONE');
  await p.screenshot({path:__dirname+'/shots/20-apps-open.png'});
  await br.close();
})();
