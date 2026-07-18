// /api/alexa — a real Alexa Skills Kit (ASK) HTTPS endpoint. Point a custom Alexa skill's endpoint
// here and "Alexa, ask my Sovereign …" works: this parses the ASK request, asks the Sovereign
// (/api/chat, governed + care-floored), and returns ASK-format speech. Same mind as everywhere else.
function say(text, end){
  return { version:'1.0', response:{
    outputSpeech:{ type:'PlainText', text:String(text).slice(0,7000) },
    card:{ type:'Simple', title:'Sovereign', content:String(text).slice(0,7000) },
    shouldEndSession: end !== false ? true : false } };
}
export default async function handler(req, res){
  res.setHeader('Content-Type','application/json');
  if(req.method!=='POST') return res.status(200).json({ service:'MEOK Sovereign — Alexa Skills Kit endpoint',
    setup:'Create a custom Alexa skill, invocation "my sovereign", one intent "AskIntent" with a {query} AMAZON.SearchQuery slot, set the endpoint to https://os.meok.ai/api/alexa. See /alexa.html.' });
  let body=req.body; if(typeof body==='string'){ try{ body=JSON.parse(body); }catch{ body={}; } } body=body||{};
  const type = body.request && body.request.type;
  try{
    if(type==='LaunchRequest') return res.status(200).json(say("I'm your Sovereign. Ask me anything — what would you like?", false));
    if(type==='SessionEndedRequest') return res.status(200).json({ version:'1.0', response:{} });
    if(type==='IntentRequest'){
      const intent = body.request.intent || {};
      const name = intent.name || '';
      if(name==='AMAZON.StopIntent' || name==='AMAZON.CancelIntent') return res.status(200).json(say('Goodbye — signed and safe.'));
      if(name==='AMAZON.HelpIntent') return res.status(200).json(say('Ask me anything, like: ask my sovereign what governs a bank.', false));
      const slots = intent.slots || {};
      const query = (slots.query && slots.query.value) || (slots.q && slots.q.value) || '';
      if(!query) return res.status(200).json(say('What would you like to ask?', false));
      const base = 'https://' + (req.headers.host || 'os.meok.ai');
      const r = await fetch(base + '/api/chat', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: query, persona:'You are the user’s Sovereign — warm, brief, spoken aloud. One or two sentences. Honest.', register:'plain', tier:'medium' }) });
      const d = await r.json();
      return res.status(200).json(say(d.response || d.say || "I’m here, but my voice hiccuped — try again."));
    }
    return res.status(200).json(say("I'm your Sovereign — ask me anything."));
  }catch(e){ return res.status(200).json(say("Something went wrong on my end — try once more.")); }
}
