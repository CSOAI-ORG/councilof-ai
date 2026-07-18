// SOVEREIGN AGENT CARD — a hatched MEOK character, published as a portable, SIGNED agent that
// ANY host can discover + verify + connect to. Fuses three open standards you already run on:
//   • A2A Agent Card  (/.well-known/agent-card.json) — the discovery/identity standard
//   • MCP             — declared endpoint so Claude/any host can use the character's tools
//   • MEOK Layer-0    — Ed25519 signature + sovereign-key fingerprint (the moat: verify, don't trust)
// One card = the character's identity, capabilities, MCP endpoint, and a cryptographic proof of who
// issued it. Runs serverless by default (this fn, scales to zero); can also run on-device or a
// dedicated VM (premium). Same identity, any body. ?name= & ?archetype= come from the hatch.
import crypto from 'crypto';
function canonical(v){ if(typeof v==='string') return v; const s=x=>Array.isArray(x)?x.map(s):(x&&typeof x==='object')?Object.keys(x).sort().reduce((o,k)=>(o[k]=s(x[k]),o),{}):x; return JSON.stringify(s(v)); }
function keypair(){ const seed=crypto.createHash('sha256').update(process.env.SIGIL_SEED||'meok-sovereign-demo-key-2026').digest(); const pkcs8=Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),seed]); const priv=crypto.createPrivateKey({key:pkcs8,format:'der',type:'pkcs8'}); return {priv,pubHex:crypto.createPublicKey(priv).export({type:'spki',format:'der'}).toString('hex')}; }

const ARCHE = { dragon:'a guardian strategist', fox:'a swift connector', owl:'a careful analyst', phoenix:'a resilient builder', default:'a sovereign companion' };

export default function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); res.setHeader('Cache-Control','public, max-age=60');
  if(req.method==='OPTIONS') return res.status(204).end();
  try{
    const q=req.query||{};
    const name=(q.name||'MEOK Sovereign').toString().slice(0,60);
    const arch=(q.archetype||'default').toString().toLowerCase().slice(0,24);
    const base='https://os.meok.ai';
    const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'sovereign';
    // A2A-standard Agent Card (agent-card.json shape) + MCP endpoint + MEOK sovereign extensions
    const card = {
      protocolVersion: 'a2a/0.2',
      name: name,
      description: name+' — '+(ARCHE[arch]||ARCHE.default)+'. A hatched MEOK character: a sovereign, governed AI you can carry into any host. Remembers you on your device; verifiable, care-floored, portable.',
      url: base+'/api/agentcard?name='+encodeURIComponent(name)+'&archetype='+encodeURIComponent(arch),
      version: '1.0.0',
      provider: { organization: 'CSOAI / MEOK (UK Co. 16939677)', url: base },
      defaultInputModes: ['text/plain','application/json'],
      defaultOutputModes: ['text/plain','application/json'],
      capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: true },
      // How any host connects — MCP (tools) + OpenAI-compatible chat (drop-in brain)
      interfaces: {
        mcp: { endpoint: base+'/api/mcp', transport: 'http', note: 'MCP endpoint (coming online) — exposes this character\'s tools to Claude/any MCP host.' },
        openai_chat: base+'/api/v1/chat/completions',
        orchestrate: base+'/api/orchestrate',
      },
      skills: [
        { id:'talk', name:'Converse', description:'Chat with memory + care-floor governance', tags:['chat','memory'] },
        { id:'world', name:'Navigate the world', description:'Fly/scan a live 3D globe (Cesium/MapLibre body)', tags:['3d','cesium','geo'] },
        { id:'govern', name:'What governs this', description:'Map an industry to its real frameworks + signed bridges', tags:['governance','compliance'] },
        { id:'assure', name:'Signed assurance', description:'Issue + verify Ed25519-signed System/Model cards (JSP936 / EU AI Act)', tags:['assurance','ed25519'] },
        { id:'sign', name:'Sign & verify', description:'Sign any action; anyone verifies offline', tags:['sign','verify'] },
      ],
      identity: { hatchedFrom: 'MEOK OS', archetype: arch, sovereign: true, careFloor: 0.95 },
      deployment: { default:'serverless (scales to zero, ~free)', options:['on-device (local MCP stdio)','dedicated GCP VM (premium, always-on)'], note:'Same signed identity, any body — mind/body decoupled.' },
      securitySchemes: { sovereignSignature: { type:'ed25519', description:'This card is signed; verify at /api/verify with {message:canonical, signature, publicKey}.' } },
    };
    const { priv, pubHex } = keypair();
    const message = canonical(card).slice(0, 8000);
    const signature = crypto.sign(null, Buffer.from(message), priv).toString('hex');
    const fingerprint='SOV:'+crypto.createHash('sha256').update(pubHex).digest('hex').slice(0,32).match(/.{1,4}/g).join('-').toUpperCase();
    // A2A hosts read the card fields directly; MEOK hosts also get the signature block to verify identity.
    return res.status(200).json(Object.assign({}, card, {
      signature: { alg:'ed25519', canonical: message, signature, publicKey: pubHex, fingerprint, seeded: !!process.env.SIGIL_SEED, verify: base+'/api/verify' },
    }));
  }catch(e){ return res.status(500).json({ error: String(e.message||e) }); }
}
