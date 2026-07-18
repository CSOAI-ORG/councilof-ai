// /api/ask — the universal one-call integration primitive. GET or POST, returns the Sovereign's
// answer as JSON (or text/plain with ?format=text). CORS-open, no secret needed — so ANY automation
// (Zapier, IFTTT, Make, iOS Shortcuts, a smart-home hub, a webhook, plain curl) can reach the governed
// Sovereign in one line. Same mind + care-floor as everywhere else; picks the OWEM tier you ask for.
export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();

  let q='', tier='medium', persona=null, format='json';
  if(req.method==='GET'){
    const p=req.query||{};
    q=(p.q||p.message||p.text||'').toString();
    tier=(p.tier||'medium').toString();
    persona=p.persona?String(p.persona):null;
    format=(p.format||'json').toString();
  } else {
    let b=req.body; if(typeof b==='string'){ try{ b=JSON.parse(b); }catch{ b={}; } } b=b||{};
    q=(b.q||b.message||b.text||'').toString();
    tier=(b.tier||'medium').toString();
    persona=b.persona?String(b.persona):null;
    format=(b.format||'json').toString();
  }
  q=q.slice(0,2000);
  if(!q){
    const help={ service:'MEOK Sovereign — universal ask endpoint',
      usage:'GET /api/ask?q=your+question[&tier=small|medium|large][&format=text]  ·  or POST {q, tier, persona}',
      example:'https://os.meok.ai/api/ask?q=what%20governs%20a%20bank&format=text',
      note:'CORS-open, no key. Governed + care-floored. The same Sovereign as Claude/web/Siri/Alexa.' };
    if(format==='text'){ res.setHeader('Content-Type','text/plain; charset=utf-8'); return res.status(200).send('Ask me anything: /api/ask?q=...'); }
    return res.status(200).json(help);
  }
  try{
    const base='https://'+(req.headers.host||'os.meok.ai');
    const r=await fetch(base+'/api/chat',{ method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message:q, tier:(['small','medium','large'].includes(tier)?tier:'medium'),
        persona: persona || 'You are the user’s Sovereign — warm, brief, honest. Answer plainly.', register:'plain' }) });
    const d=await r.json();
    const answer=d.response||d.say||"I’m here — try again.";
    if(format==='text'){ res.setHeader('Content-Type','text/plain; charset=utf-8'); return res.status(200).send(answer); }
    return res.status(200).json({ ok:true, answer, model:d.model||null, tier:d.tier||tier, governed:true });
  }catch(e){
    if(format==='text'){ res.setHeader('Content-Type','text/plain; charset=utf-8'); return res.status(200).send('hiccup — try again'); }
    return res.status(200).json({ ok:false, answer:'hiccup — try again', error:String(e.message||e).slice(0,120) });
  }
}
