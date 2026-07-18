/*! ============================================================================
 *  SOVEREIGN KIT — drop-in AI-OS layer for any CSOAI map/app
 *  CSOAI Ltd (UK 16939677) · MIT License · v1.0 · 1 July 2026
 *  ---------------------------------------------------------------------------
 *  Adds the DEFONEOS "Sovereign" to ANY web app in ~2 lines: a governed AI-OS
 *  chat that SEES your app state, DRIVES your app via function-calling, SPEAKS
 *  (with a visible speaking state), and SIGNS every action (Ed25519 SIGIL).
 *
 *  Built once for the DEFONEOS dome — extracted here so M2 / any CSOAI product
 *  gets the sidebar, chat, voice, governance and Sovereign brain for free.
 *
 *  USAGE (minimal):
 *    <script src="/sovereign-kit.js"></script>
 *    <script>
 *      Sovereign.init({
 *        brand: 'CSOAI · YOUR APP',
 *        // 1) expose YOUR app's actions as tools the Sovereign can call:
 *        commands: {
 *          go_to:      { desc:'fly/scroll to a place', params:{q:'string'}, run:(a)=> myApp.goTo(a.q) },
 *          toggle_layer:{ desc:'toggle a layer',       params:{name:'string',on:'boolean'}, run:(a)=> myApp.layer(a.name,a.on) },
 *          open_panel: { desc:'open a panel',          params:{id:'string'}, run:(a)=> myApp.open(a.id) },
 *        },
 *        // 2) tell it what's on screen (so answers are state-aware, not blind):
 *        getContext: () => ({ view: myApp.view(), layers: myApp.activeLayers(), selected: myApp.selection() }),
 *        // 3) OPTIONAL — a real LLM brain (OpenAI-compatible). Omit = rule/echo mode.
 *        brainEndpoint: 'http://localhost:8000/v1',   // local SOV3, or any OpenAI-compatible
 *        brainModel: 'sov3-sovereign-v2',
 *        brainKey: '',                                 // stays on device
 *        // 4) OPTIONAL — a fallback intent handler when there's no brain:
 *        onCommand: (text) => myApp.parseCommand(text),   // return true if handled
 *      });
 *    </script>
 *
 *  Governance is LOCKED (the moat): every utterance + tool call is Ed25519-signed
 *  into a tamper-evident SIGIL ledger you can export/verify. Surveillance and
 *  kinetic-targeting requests are refused in the system prompt.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.Sovereign) return;

  var CFG = {};
  var LEDGER = [];              // SIGIL chain (in-memory; persisted to localStorage)
  var priv = null, pubHex = ''; // Ed25519 keypair (device-local)
  var speaking = false, lastSpoken = '';

  // ---- tiny helpers -------------------------------------------------------
  function el(tag, cls, html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }
  function hex(b){ return Array.prototype.map.call(new Uint8Array(b),function(x){return ('0'+x.toString(16)).slice(-2);}).join(''); }

  // ---- SIGIL (Ed25519 on-device signing; loads @noble/ed25519 lazily) -----
  var _ed=null, _edReady=false;
  function loadEd(){ return import('https://esm.sh/@noble/ed25519@2').then(function(m){_ed=m;_edReady=true;})
      .catch(function(){ return import('https://cdn.jsdelivr.net/npm/@noble/ed25519@2/+esm').then(function(m){_ed=m;_edReady=true;}).catch(function(){}); }); }
  function sigilInit(){ return loadEd().then(function(){ if(!_ed) return;
      var ph=localStorage.getItem('sovkit_priv'); if(ph){ priv=new Uint8Array(ph.length/2); for(var i=0;i<priv.length;i++)priv[i]=parseInt(ph.substr(i*2,2),16); }
      else { priv=crypto.getRandomValues(new Uint8Array(32)); localStorage.setItem('sovkit_priv',hex(priv)); }
      return _ed.getPublicKeyAsync(priv).then(function(pub){ pubHex=hex(pub); try{ LEDGER=JSON.parse(localStorage.getItem('sovkit_ledger')||'[]'); }catch(e){ LEDGER=[]; } }); }); }
  function sigil(action, detail){ if(!_edReady||!priv) return Promise.resolve(null);
    var prev=LEDGER.length?LEDGER[LEDGER.length-1].sig:''; var r={ i:LEDGER.length, ts:new Date().toISOString(), action:String(action||''), detail:String(detail||'').slice(0,160), prev:prev };
    return _ed.signAsync(new TextEncoder().encode(JSON.stringify(r)), priv).then(function(s){ var e={i:r.i,ts:r.ts,action:r.action,detail:r.detail,prev:r.prev,sig:hex(s),pub:pubHex}; LEDGER.push(e); if(LEDGER.length>300)LEDGER.shift(); try{localStorage.setItem('sovkit_ledger',JSON.stringify(LEDGER));}catch(_){}; return e; }); }

  // ---- UI: chat panel -----------------------------------------------------
  var log, input, panel, eqEl, subEl;
  function injectUI(){
    var css = ('.sk-panel{position:fixed;top:14px;right:14px;bottom:14px;width:300px;max-width:88vw;z-index:99998;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(10,14,24,.92),rgba(7,10,18,.9));backdrop-filter:blur(20px);border:1px solid rgba(62,240,255,.25);border-radius:16px;overflow:hidden;box-shadow:0 24px 64px -20px rgba(0,0,0,.7);font-family:Inter,system-ui,sans-serif;color:#dfe6f5;transform:translateX(calc(100% + 24px));transition:transform .3s cubic-bezier(.2,.7,.2,1)}'
      + '.sk-panel.open{transform:none}'
      + '.sk-head{display:flex;align-items:center;gap:6px;padding:11px 12px;border-bottom:1px solid rgba(255,255,255,.08)}'
      + '.sk-dot{width:8px;height:8px;border-radius:50%;background:#3ef0ff;box-shadow:0 0 10px #3ef0ff}'
      + '.sk-nm{font-weight:700;letter-spacing:1px;color:#3ef0ff;font-size:12px;flex:1}'
      + '.sk-eq{display:none;align-items:flex-end;gap:2px;height:12px}.sk-eq i{width:2.5px;background:#3ef0ff;border-radius:2px;height:4px;animation:skeq .9s ease-in-out infinite}.sk-eq i:nth-child(2){animation-delay:.15s}.sk-eq i:nth-child(3){animation-delay:.3s}@keyframes skeq{50%{height:12px}}'
      + '.sk-x{cursor:pointer;color:#8a93b2;padding:0 4px}.sk-x:hover{color:#fff}'
      + '.sk-log{flex:1;overflow-y:auto;padding:11px;display:flex;flex-direction:column;gap:8px}'
      + '.sk-msg{max-width:92%;padding:8px 11px;border-radius:12px;font-size:12.5px;line-height:1.45;word-wrap:break-word}'
      + '.sk-msg.you{align-self:flex-end;background:rgba(201,168,76,.16);border:1px solid rgba(201,168,76,.3)}'
      + '.sk-msg.sov{align-self:flex-start;background:rgba(62,240,255,.1);border:1px solid rgba(62,240,255,.22)}'
      + '.sk-msg.sov.speaking{box-shadow:0 0 0 1px rgba(62,240,255,.35),0 0 18px -4px rgba(62,240,255,.5)}'
      + '.sk-w.on{color:#fff;background:rgba(62,240,255,.28);border-radius:3px}'
      + '.sk-msg.sys{align-self:center;color:#8a93b2;font-size:10.5px}'
      + '.sk-in{display:flex;gap:6px;padding:10px;border-top:1px solid rgba(255,255,255,.08)}'
      + '.sk-in input{flex:1;padding:9px 12px;border-radius:11px;font-size:12.5px;color:#dfe6f5;background:rgba(20,26,42,.8);border:1px solid rgba(255,255,255,.12)}'
      + '.sk-in input:focus{outline:none;border-color:#3ef0ff}'
      + '.sk-mic,.sk-send{width:38px;border-radius:11px;display:grid;place-items:center;cursor:pointer;border:1px solid rgba(255,255,255,.12);background:rgba(20,26,42,.8)}'
      + '.sk-send{background:#3ef0ff;color:#06121a;font-weight:700}'
      + '.sk-tab{position:fixed;right:0;top:46%;transform:translateY(-50%);z-index:99997;writing-mode:vertical-rl;background:rgba(10,14,24,.92);border:1px solid rgba(62,240,255,.3);border-right:0;border-radius:10px 0 0 10px;padding:13px 7px;font-size:11px;font-weight:700;letter-spacing:2px;color:#3ef0ff;cursor:pointer}');
    var st=el('style'); st.textContent=css; document.head.appendChild(st);
    panel=el('div','sk-panel');
    panel.innerHTML='<div class="sk-head"><span class="sk-dot"></span><span class="sk-nm">'+esc(CFG.brand||'SOVEREIGN')+'</span><span class="sk-eq" id="skEq"><i></i><i></i><i></i><i></i></span><span class="sk-x">✕</span></div>'
      + '<div class="sk-log" id="skLog"><div class="sk-msg sys">Sovereign online · governed · every action signed. Ask me anything about this OS.</div></div>'
      + '<div class="sk-in"><span class="sk-mic" title="talk">🎙</span><input id="skInput" placeholder="talk to the Sovereign…"><span class="sk-send">➤</span></div>';
    document.body.appendChild(panel);
    var tab=el('div','sk-tab',(CFG.brand||'SOVEREIGN').split('·').pop().trim()+' ◂'); document.body.appendChild(tab);
    log=panel.querySelector('#skLog'); input=panel.querySelector('#skInput'); eqEl=panel.querySelector('#skEq'); subEl=null;
    function open(){ panel.classList.add('open'); tab.style.display='none'; } function close(){ panel.classList.remove('open'); tab.style.display='block'; }
    tab.onclick=open; panel.querySelector('.sk-x').onclick=close;
    panel.querySelector('.sk-send').onclick=function(){ ask(input.value); input.value=''; };
    input.addEventListener('keydown',function(e){ if(e.key==='Enter'){ ask(input.value); input.value=''; } });
    panel.querySelector('.sk-mic').onclick=micToggle;
    global.Sovereign._open=open;
  }
  function append(who,html){ if(!log) return null; var d=el('div','sk-msg '+who,html); log.appendChild(d); log.scrollTop=log.scrollHeight; return d; }

  // ---- voice (speak + visible speaking state + word highlight) ------------
  function bestVoice(){ try{ var v=speechSynthesis.getVoices()||[]; return v.find(function(x){return /Google UK English Female/.test(x.name);})||v.find(function(x){return /en-GB/.test(x.lang)&&/female/i.test(x.name);})||v.find(function(x){return /en/.test(x.lang);})||null; }catch(e){ return null; } }
  function setSpeaking(on,msg){ if(eqEl) eqEl.style.display=on?'inline-flex':'none'; if(msg){ if(on)msg.classList.add('speaking'); else { msg.classList.remove('speaking'); [].forEach.call(msg.querySelectorAll('.sk-w.on'),function(s){s.classList.remove('on');}); } } }
  function wrapWords(elm){ if(!elm||elm.dataset.w) return []; var spans=[],t=[],w=document.createTreeWalker(elm,NodeFilter.SHOW_TEXT,null); while(w.nextNode()){if(w.currentNode.nodeValue.trim())t.push(w.currentNode);} t.forEach(function(tn){ var f=document.createDocumentFragment(); tn.nodeValue.split(/(\s+)/).forEach(function(p){ if(!p)return; if(/^\s+$/.test(p))f.appendChild(document.createTextNode(p)); else{var s=el('span','sk-w');s.textContent=p;f.appendChild(s);spans.push(s);} }); tn.parentNode.replaceChild(f,tn); }); elm.dataset.w='1'; return spans; }
  function speak(text,msgEl){ if(CFG.voice===false||!global.speechSynthesis) return; var clean=(''+text).replace(/<[^>]+>/g,' ').replace(/[^\x00-\x7F]+/g,' ').replace(/\s+/g,' ').trim(); if(!clean) return; lastSpoken=clean.toLowerCase();
    var words=msgEl?wrapWords(msgEl):[],wi=-1; try{ var u=new SpeechSynthesisUtterance(clean); var v=bestVoice(); if(v)u.voice=v; u.onstart=function(){setSpeaking(true,msgEl);speaking=true;}; u.onboundary=function(ev){ if(ev.name&&ev.name!=='word')return; wi++; for(var i=0;i<words.length;i++)words[i].classList.toggle('on',i===wi); }; u.onend=function(){setSpeaking(false,msgEl);setTimeout(function(){speaking=false;},600);}; u.onerror=function(){setSpeaking(false,msgEl);speaking=false;}; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){} }

  // ---- STT (AWARE hands-free) ---------------------------------------------
  var rec=null, aware=false;
  function micToggle(){ var SR=global.SpeechRecognition||global.webkitSpeechRecognition; if(!SR){ append('sys','Voice input needs Chrome/Edge.'); return; }
    aware=!aware; if(aware){ if(!rec){ rec=new SR(); rec.continuous=true; rec.interimResults=false; rec.lang='en-GB';
      rec.onresult=function(e){ if(speaking) return; var t=''; for(var i=e.resultIndex;i<e.results.length;i++){ if(e.results[i].isFinal)t+=e.results[i][0].transcript; } t=t.trim(); if(t){ var ls=lastSpoken; if(ls&&ls.indexOf(t.toLowerCase())>=0) return; ask(t); } };
      rec.onend=function(){ if(aware){ try{rec.start();}catch(_){}} }; }
      try{rec.start();}catch(_){}; append('sys','🎙 listening…'); } else { try{rec.stop();}catch(_){}; } }

  // ---- brain: reads context, calls LLM, executes YOUR tools ---------------
  function tools(){ return Object.keys(CFG.commands||{}).map(function(n){ var c=CFG.commands[n]; var props={}; Object.keys(c.params||{}).forEach(function(k){ props[k]={type:(typeof c.params[k]==='string'?c.params[k]:(c.params[k].type||'string'))}; }); return {type:'function',function:{name:n,description:c.desc||n,parameters:{type:'object',properties:props}}}; }); }
  function runTool(name,args){ var c=(CFG.commands||{})[name]; if(!c||!c.run) return {ok:false,error:'unknown'}; try{ var out=c.run(args)||{ok:true}; sigil('tool:'+name, JSON.stringify(args).slice(0,80)); return out; }catch(e){ return {ok:false,error:String(e)}; } }
  function brain(text){ var ep=CFG.brainEndpoint; if(!ep) return Promise.resolve(false);
    var ctx=(CFG.getContext?CFG.getContext():{}); var sys='You are the Sovereign, a governed AI-OS for '+(CFG.brand||'this app')+'. You SEE the live state and call tools to drive the app. Refuse surveillance, kinetic-targeting, private-CCTV. Be concise and act. Every action is Ed25519-signed. LIVE STATE: '+JSON.stringify(ctx);
    var msgs=[{role:'system',content:sys},{role:'user',content:text}]; var hdr={'Content-Type':'application/json'}; if(CFG.brainKey)hdr['Authorization']='Bearer '+CFG.brainKey;
    function turn(n){ if(n>4) return Promise.resolve(true);
      return fetch(ep.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:hdr,body:JSON.stringify({model:CFG.brainModel||'sov3-sovereign-v2',messages:msgs,tools:tools(),tool_choice:'auto',temperature:.4})})
        .then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(d){ var m=d.choices&&d.choices[0]&&d.choices[0].message; if(!m) return false; msgs.push(m);
          if(m.tool_calls&&m.tool_calls.length){ m.tool_calls.forEach(function(tc){ var a={}; try{a=JSON.parse(tc.function.arguments||'{}');}catch(e){} var out=runTool(tc.function.name,a); msgs.push({role:'tool',tool_call_id:tc.id||tc.function.name,content:JSON.stringify(out)}); }); return turn(n+1); }
          if(m.content){ reply(m.content); } return true; }).catch(function(){ return false; });
    } return turn(0);
  }
  function reply(text){ var d=append('sov',text); sigil('utter',(''+text).replace(/<[^>]+>/g,'').slice(0,80)); speak(text,d); return d; }

  // ---- the one entry point ------------------------------------------------
  function ask(text){ text=(''+(text||'')).trim(); if(!text) return; if(global.Sovereign._open) global.Sovereign._open();
    append('you',esc(text)); sigil('ask',text.toLowerCase());
    brain(text).then(function(handled){ if(handled) return;
      if(CFG.onCommand){ var r=CFG.onCommand(text); if(r&&r.then){ r.then(function(ok){ if(!ok) reply('I heard you, but I have no brain endpoint wired and no local handler matched. Set brainEndpoint or onCommand.'); }); return; } if(r) return; }
      reply('I heard you. Wire a brainEndpoint (OpenAI-compatible / local SOV3) or an onCommand handler and I’ll act.');
    });
  }

  // ---- public API ---------------------------------------------------------
  global.Sovereign = {
    init: function (cfg) { CFG = cfg || {}; if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot(); return global.Sovereign; },
    ask: ask, reply: reply, speak: function(t){ speak(t); }, sigil: sigil,
    context: function(){ return CFG.getContext?CFG.getContext():{}; },
    ledger: function(){ return LEDGER.slice(); },
    _open: null, _cfg: function(){ return CFG; }
  };
  function boot(){ injectUI(); sigilInit(); if(CFG.autoOpen) setTimeout(global.Sovereign._open,600); }
})(typeof window !== 'undefined' ? window : this);
