// /api/telegram — Telegram Bot webhook. Set it with:
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://os.meok.ai/api/telegram
// Needs env TELEGRAM_BOT_TOKEN (from @BotFather). Receives updates, asks the governed Sovereign,
// replies in-chat. Same mind + care-floor as everywhere.
export default async function handler(req, res){
  if(req.method!=='POST') return res.status(200).json({ service:'MEOK Sovereign — Telegram webhook',
    setup:'@BotFather → new bot → set env TELEGRAM_BOT_TOKEN → setWebhook to https://os.meok.ai/api/telegram' });
  const TOKEN=process.env.TELEGRAM_BOT_TOKEN;
  let b=req.body; if(typeof b==='string'){ try{ b=JSON.parse(b); }catch{ b={}; } } b=b||{};
  const msg=b.message||b.edited_message||{};
  const chatId=msg.chat&&msg.chat.id; const text=(msg.text||'').toString();
  if(!chatId||!text) return res.status(200).json({ok:true, skipped:true});
  try{
    const base='https://'+(req.headers.host||'os.meok.ai');
    const d=await (await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:text,persona:'You are the user’s Sovereign — warm, brief, honest.',register:'plain',tier:'medium'})})).json();
    const answer=d.response||d.say||'I’m here — try again.';
    if(TOKEN && !TOKEN.startsWith('REPLACE')){
      await fetch('https://api.telegram.org/bot'+TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:chatId,text:answer})});
    }
    return res.status(200).json({ok:true});
  }catch(e){ return res.status(200).json({ok:false,error:String(e.message||e).slice(0,120)}); }
}
