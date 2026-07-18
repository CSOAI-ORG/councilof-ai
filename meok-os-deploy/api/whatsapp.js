// /api/whatsapp — WhatsApp Cloud API webhook. GET = Meta's verification handshake; POST = inbound
// messages. Needs env: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_VERIFY_TOKEN. Asks the governed
// Sovereign and replies. Same mind + care-floor.
export default async function handler(req, res){
  // Meta webhook verification
  if(req.method==='GET'){
    const p=req.query||{};
    if(p['hub.mode']==='subscribe' && p['hub.verify_token']===process.env.WHATSAPP_VERIFY_TOKEN){
      return res.status(200).send(p['hub.challenge']||'');
    }
    return res.status(200).json({ service:'MEOK Sovereign — WhatsApp Cloud API webhook',
      setup:'Meta app → WhatsApp → set callback https://os.meok.ai/api/whatsapp + verify token = env WHATSAPP_VERIFY_TOKEN; set WHATSAPP_TOKEN + WHATSAPP_PHONE_ID.' });
  }
  if(req.method!=='POST') return res.status(200).json({ok:true});
  let b=req.body; if(typeof b==='string'){ try{ b=JSON.parse(b); }catch{ b={}; } } b=b||{};
  try{
    const val=b.entry&&b.entry[0]&&b.entry[0].changes&&b.entry[0].changes[0]&&b.entry[0].changes[0].value;
    const m=val&&val.messages&&val.messages[0];
    const from=m&&m.from; const text=m&&m.text&&m.text.body;
    if(!from||!text) return res.status(200).json({ok:true,skipped:true});
    const base='https://'+(req.headers.host||'os.meok.ai');
    const d=await (await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:text,persona:'You are the user’s Sovereign — warm, brief, honest.',register:'plain',tier:'medium'})})).json();
    const answer=d.response||d.say||'I’m here — try again.';
    const TOKEN=process.env.WHATSAPP_TOKEN, PHONE=process.env.WHATSAPP_PHONE_ID;
    if(TOKEN && PHONE && !TOKEN.startsWith('REPLACE')){
      await fetch('https://graph.facebook.com/v18.0/'+PHONE+'/messages',{method:'POST',
        headers:{'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'},
        body:JSON.stringify({messaging_product:'whatsapp',to:from,text:{body:answer}})});
    }
    return res.status(200).json({ok:true});
  }catch(e){ return res.status(200).json({ok:false,error:String(e.message||e).slice(0,120)}); }
}
