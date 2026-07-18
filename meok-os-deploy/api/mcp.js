// Lean MCP server (Streamable-HTTP / JSON-RPC 2.0) — makes a hatched MEOK character a real MCP
// server that Claude or ANY MCP host can connect to. One serverless function; scales to zero.
// Exposes the character's tools (talk, govern, sign, verify, agent_card) backed by the existing
// sovereign endpoints. This is the "hatch = portable MCP agent" made concrete.
// The character's persona travels WITH the MCP: name + archetype make meok_talk answer IN CHARACTER on
// any host (Claude, ChatGPT-with-MCP, a browser OS). Passed per-call, or defaulted from ?name/?archetype
// on the connect URL, so one hatched character = one portable, in-character agent.
const personaFor = (name, arc) => {
  const n = (name||'').toString().slice(0,60) || 'the Sovereign';
  const a = (arc||'').toString().slice(0,60) || 'sovereign companion';
  return `You are ${n}, a ${a} — the end user's own sovereign AI, bonded to them. Speak in first person, warm and plain, honest about limits. Everything you do is signed on the user's device and refusable; their data stays theirs. Never fabricate. Answer concisely.`;
};
const TOOLS = [
  { name:'meok_talk', description:'Talk to the user\'s own sovereign MEOK character (governed, care-floored, in-character).', inputSchema:{ type:'object', properties:{ message:{type:'string'}, name:{type:'string', description:'the character\'s name (persona)'}, archetype:{type:'string', description:'the character\'s archetype'} }, required:['message'] } },
  { name:'meok_remember', description:'Mint a SIGNED, portable memory episode bonded to the user (Ed25519). The memory is theirs and travels across AI platforms. For a persistent on-device memory graph, add the local meok-sovereign-memory-mcp.', inputSchema:{ type:'object', properties:{ fact:{type:'string', description:'the thing to remember'}, owner:{type:'string', description:'did:csoai:<user> or a handle the memory is bonded to'}, importance:{type:'number'} }, required:['fact'] } },
  { name:'meok_govern', description:'What governs an industry — real frameworks + signed legacy bridges.', inputSchema:{ type:'object', properties:{ industry:{type:'string', description:'e.g. "a bank", "hospital", "lender"'} }, required:['industry'] } },
  { name:'meok_sign', description:'Ed25519-sign any action/payload (returns signature + publicKey).', inputSchema:{ type:'object', properties:{ payload:{} }, required:['payload'] } },
  { name:'meok_verify', description:'Verify a MEOK signature offline.', inputSchema:{ type:'object', properties:{ message:{type:'string'}, signature:{type:'string'}, publicKey:{type:'string'} }, required:['message','signature','publicKey'] } },
  { name:'meok_agent_card', description:'Get this character\'s signed A2A agent card (identity + capabilities).', inputSchema:{ type:'object', properties:{ name:{type:'string'}, archetype:{type:'string'} } } },
];
const jrpc = (id, result) => ({ jsonrpc:'2.0', id, result });
const jerr = (id, code, message) => ({ jsonrpc:'2.0', id, error:{ code, message } });

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); res.setHeader('Access-Control-Allow-Methods','POST, GET, OPTIONS');
  if(req.method==='OPTIONS') return res.status(204).end();
  const base = 'https://' + (req.headers.host || 'os.meok.ai');
  if(req.method==='GET') return res.status(200).json({ service:'MEOK Sovereign MCP', transport:'streamable-http (JSON-RPC 2.0 over POST)', tools:TOOLS.map(t=>t.name), note:'POST JSON-RPC: initialize · tools/list · tools/call. Connect from any MCP host.' });
  let body=req.body; if(typeof body==='string'){ try{ body=JSON.parse(body); }catch{ body={}; } } body=body||{};
  const { id=null, method, params={} } = body;
  // the hatched character's identity rides on the connect URL (?name=&archetype=) so the whole session speaks in-character
  const q=req.query||{}; if(q.name) params._name=q.name; if(q.archetype) params._arc=q.archetype;
  try{
    if(method==='initialize') return res.status(200).json(jrpc(id, { protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:'meok-sovereign', version:'1.0.0' } }));
    if(method==='notifications/initialized' || method==='notifications/cancelled') return res.status(200).json({ jsonrpc:'2.0' });
    if(method==='ping') return res.status(200).json(jrpc(id, {}));
    if(method==='tools/list') return res.status(200).json(jrpc(id, { tools:TOOLS }));
    if(method==='tools/call'){
      const name=params.name, a=params.arguments||{}; let text='';
      const call=async(path,opt)=>{ const r=await fetch(base+path, opt); return r.json(); };
      if(name==='meok_talk'){ const persona=personaFor(a.name||params._name, a.archetype||params._arc); const d=await call('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:String(a.message||''),persona,register:'plain'})}); text=d.response||d.say||JSON.stringify(d); }
      else if(name==='meok_remember'){ const episode={ type:'meok.memory.v1', fact:String(a.fact||'').slice(0,2000), owner:String(a.owner||'did:csoai:anon'), importance:(typeof a.importance==='number'?a.importance:0.6), ts:new Date().toISOString() }; const d=await call('/api/sign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload:episode})}); text=JSON.stringify({ remembered:episode.fact, owner:episode.owner, signed:true, signature:d.signature, publicKey:d.publicKey, fingerprint:d.fingerprint, note:'Signed & portable — this memory is yours across any AI platform. Add the local meok-sovereign-memory-mcp for a persistent on-device graph.' }); }
      else if(name==='meok_govern'){ const d=await call('/api/govern?q='+encodeURIComponent(a.industry||'')); text=(d.matched?('Governs a '+d.industry+': ')+ (d.frameworks||[]).map(f=>f.name).join(', '):'general frameworks: '+((d.frameworks||[]).map(f=>f.name).join(', '))); }
      else if(name==='meok_sign'){ const d=await call('/api/sign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload:a.payload})}); text=JSON.stringify({signature:d.signature, publicKey:d.publicKey, fingerprint:d.fingerprint, canonical:d.canonical}); }
      else if(name==='meok_verify'){ const d=await call('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:a.message,signature:a.signature,publicKey:a.publicKey})}); text=d.valid?'VALID — authentic & untampered':'REJECTED — signature does not match'; }
      else if(name==='meok_agent_card'){ const d=await call('/api/agentcard?name='+encodeURIComponent(a.name||'MEOK Sovereign')+'&archetype='+encodeURIComponent(a.archetype||'default')); text=JSON.stringify(d); }
      else return res.status(200).json(jerr(id, -32602, 'unknown tool: '+name));
      return res.status(200).json(jrpc(id, { content:[{ type:'text', text: String(text).slice(0,8000) }] }));
    }
    return res.status(200).json(jerr(id, -32601, 'method not found: '+method));
  }catch(e){ return res.status(200).json(jerr(id, -32603, String(e.message||e))); }
}
