// /api/slack — Slack slash command (e.g. /sovereign what governs a bank). Slack POSTs a form body with
// `text`. We ask the governed Sovereign and reply in-channel. No stored bot token needed for the basic
// slash reply. For production, verify X-Slack-Signature with env SLACK_SIGNING_SECRET (noted below).
function parseForm(s){ const o={}; (s||'').split('&').forEach(kv=>{ const i=kv.indexOf('='); if(i>0){ o[decodeURIComponent(kv.slice(0,i))]=decodeURIComponent(kv.slice(i+1).replace(/\+/g,' ')); } }); return o; }
export default async function handler(req, res){
  if(req.method!=='POST') return res.status(200).json({ service:'MEOK Sovereign — Slack slash command',
    setup:'Slack app → Slash Commands → /sovereign → Request URL https://os.meok.ai/api/slack. (Prod: verify X-Slack-Signature with SLACK_SIGNING_SECRET.)' });
  let b=req.body;
  if(typeof b==='string') b=parseForm(b);
  else if(b && typeof b==='object' && !b.text && Object.keys(b).length===0){ b=parseForm(''); }
  b=b||{};
  const text=(b.text||'').toString();
  if(!text) return res.status(200).json({ response_type:'ephemeral', text:'Ask me something, e.g. `/sovereign what governs a bank`' });
  try{
    const base='https://'+(req.headers.host||'os.meok.ai');
    const d=await (await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:text,persona:'You are the user’s Sovereign — warm, brief, honest.',register:'plain',tier:'medium'})})).json();
    const answer=d.response||d.say||'I’m here — try again.';
    return res.status(200).json({ response_type:'in_channel', text:'🐉 '+answer });
  }catch(e){ return res.status(200).json({ response_type:'ephemeral', text:'hiccup — try again' }); }
}
