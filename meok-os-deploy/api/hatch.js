// MEOK HATCH (meok.hatch.v1) — hatch a sovereign AI as a portable, signed mini-OS.
// A NEW composite agent TYPE, not a new transport. Fuses four things that live apart today into
// ONE offline-verifiable signed artifact you can carry into any host:
//   • A2A Agent Card  (identity/discovery)         — rides the A2A standard
//   • MCP endpoint     (tools/usage)               — rides MCP
//   • Letta .af state  (persona + memory + tools)  — rides the open Agent File format
//   • MEOK Layer-0     (Ed25519 sovereign signature + governance) — the part nobody else has
// The AGENT (persona, memory, policy, identity, tool contract) lives INSIDE the hatch and is
// portable + signed. The MODEL is pluggable (host model via MCP, or on-device llamafile/Ollama)
// — weights are NOT embedded (honest: too big for serverless/edge). "AI inside the container" = the
// mind is inside; the model is any body. Differentiator vs Sigstore/AGNTCY (keyless CA/OIDC):
// SOVEREIGN, self-owned, OFFLINE-verifiable key + embedded governance. Formerly "SAP" (renamed to
// avoid the SAP SE clash). ?format=af → Letta import · ?format=oasf → AGNTCY-shaped + sovereign ext.
import crypto from 'crypto';
import { CARE_FLOOR, BFT_SIZE, BFT_VOTE_THRESHOLD, BFT_QUORUM, CARE_VETO, HARD_STOPS, FRAMEWORKS, ARCHE, DEFAULT_NAME } from './_shared/constants.mjs';
function canonical(v){ if(typeof v==='string') return v; const s=x=>Array.isArray(x)?x.map(s):(x&&typeof x==='object')?Object.keys(x).sort().reduce((o,k)=>(o[k]=s(x[k]),o),{}):x; return JSON.stringify(s(v)); }
function keypair(){ const seed=crypto.createHash('sha256').update(process.env.SIGIL_SEED||'meok-sovereign-demo-key-2026').digest(); const pkcs8=Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),seed]); const priv=crypto.createPrivateKey({key:pkcs8,format:'der',type:'pkcs8'}); return {priv,pubHex:crypto.createPublicKey(priv).export({type:'spki',format:'der'}).toString('hex')}; }
// The 22-strong legacy-bridge family: a legacy/COBOL/SAP/HL7 system speaks its native protocol →
// the matching bridge translates it to MCP/A2A (Layer-0) → a Hatch mounts on it → that system now
// has a signed, governed, AI-aware agent INSIDE it. `?bridge=cobol` fronts a Hatch onto that bridge.
const BRIDGES={ cobol:'COBOL/CICS mainframe', iso20022:'ISO 20022 payments', swift:'SWIFT MT↔MX', hl7:'HL7 v2', fhir:'HL7 FHIR', as400:'IBM AS/400', sap:'SAP RFC', oracle:'Oracle EBS', scada:'SCADA/Modbus/OPC-UA', edi:'EDI X12', fix:'FIX protocol', mqtt:'MQTT/IoT', cics:'IBM CICS', acord:'ACORD insurance', nacha:'NACHA ACH', iso8583:'ISO 8583 cards', sip:'SIP telecom', tax:'tax e-filing', gs1:'GS1 supply-chain', mismo:'MISMO mortgage', dlms:'DLMS/COSEM meters' };

// ArkForge (meok-ai) live trust score — env-gated so it NEVER blocks/forks the public edge.
// Set MEOK_AI_URL to the deployed backend; we fetch GET {MEOK_AI_URL}/trust/score/{entity}
// (tiers: unverified→bronze→silver→gold→platinum→diamond) and carry it INTO the signed Hatch.
async function fetchTrust(entity){
  const base=process.env.MEOK_AI_URL; if(!base) return { source:'local', tier:'unverified', score:null, note:'meok-ai not wired (set MEOK_AI_URL) — identity still Ed25519-signed here' };
  try{ const ctl=new AbortController(); const to=setTimeout(()=>ctl.abort(),1500);
    const r=await fetch(base.replace(/\/$/,'')+'/trust/score/'+encodeURIComponent(entity),{signal:ctl.signal}); clearTimeout(to);
    if(!r.ok) throw new Error('http '+r.status); const d=await r.json();
    return { source:'meok-ai/arkforge', tier:d.tier||'unverified', score:(typeof d.score==='number'?d.score:null), entity, note:'live ArkForge trust score (Ed25519 receipt chain)' };
  }catch(e){ return { source:'local', tier:'unverified', score:null, note:'meok-ai unreachable ('+String(e.message||e)+') — degraded to local, identity still signed' }; }
}

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); res.setHeader('Cache-Control','public, max-age=60');
  if(req.method==='OPTIONS') return res.status(204).end();
  try{
    const q=req.query||{}; const name=(q.name||'MEOK Sovereign').toString().slice(0,60); const arch=(q.archetype||'default').toString().toLowerCase().slice(0,24);
    const bridge=(q.bridge||'').toString().toLowerCase().slice(0,24); const bridgeLabel=BRIDGES[bridge]||null;
    const base='https://os.meok.ai'; const persona=name+' — '+(ARCHE[arch]||ARCHE.default)+(bridgeLabel?'. Fronts a '+bridgeLabel+' system through Layer-0 (signed, governed, AI-aware).':'. Sovereign, governed, remembers you on your device.');
    const tools=[
      {name:'meok_talk',desc:'converse (governed, care-floored)'},
      {name:'meok_govern',desc:'what governs an industry → frameworks + bridges'},
      {name:'meok_sign',desc:'Ed25519-sign an action'},
      {name:'meok_verify',desc:'verify a signature offline'},
    ];
    if(bridgeLabel){ tools.push({name:'legacy_call',desc:'call the '+bridgeLabel+' system through its Layer-0 bridge (every call signed + care-floored)'},{name:'legacy_translate',desc:'translate native '+bridge+' messages ↔ modern JSON/MCP'}); }
    const af_state = {
      version: '0.1', agent_type: 'memgpt_agent', name,
      system: 'You are '+persona+' You never take harmful action (care floor 0.95); hard stops are immutable.',
      memory: { blocks: [ {label:'persona', value: persona, limit:2000}, {label:'human', value:'(learned on the user\'s device)', limit:2000} ] },
      tools: tools.map(t=>({name:t.name, description:t.desc})),
      llm_config: { model:'BYO', note:'model provided by host (MCP/MRTR) or on-device (llamafile/ollama); weights not embedded' },
      messages: [],
    };
    const pkg = {
      spec: 'meok.hatch.v1',
      type: 'meok-hatch · portable AI-OS (sovereign governance profile)',
      tagline: 'Hatch a sovereign AI as a portable, signed mini-OS — the new way.',
      // HONEST positioning: NOT a new protocol. Portable signed agent packages are already being
      // standardized (AGNTCY/Linux Foundation: OASF records as OCI artifacts, Sigstore-signed, DID/VC).
      // A MEOK Hatch is the SOVEREIGN, OFFLINE-verifiable, GOVERNED profile that rides those standards.
      positioning: 'Sovereign, offline-verifiable, governed profile that rides the emerging agent standards — not a replacement for them.',
      interop: ['a2a-agent-card', 'mcp/2024-11-05', 'letta/agent-file(.af)', 'agntcy/OASF(OCI)-compatible', 'w3c-did/vc (roadmap)'],
      differs_from: { 'AGNTCY/Sigstore': 'they sign keyless via a CA/OIDC (Fulcio) — online trust root; we self-own an offline Ed25519 key', 'Letta .af': 'we add a signature + governance', 'AIP/arxiv proposals': 'shipped, not a paper' },
      agent: { name, archetype: arch, description: persona, version:'1.0.0', provider:'CSOAI / MEOK (UK Co. 16939677)' },
      state: af_state,
      brain: {
        orchestrator: 'Sovereign OLM (Mamba-2 SSD) + SOV3 — reconciles the two brains, talks to the user',
        left: { role:'reasoning · analysis · tools · governance', online:['groq/llama-3.3-70b','anthropic/claude','openai/gpt'], offline:['ollama/llama3.1','llamafile/qwen2.5'], default:'online, offline-capable' },
        right:{ role:'creativity · vision · voice · the world', online:['anthropic/claude','image/voice APIs'], offline:['on-device VLM','local TTS (Piper/Kokoro)'], default:'hybrid' },
        modes:['offline (on-device only)','online (hosted)','hybrid (offline-first, online fallback)'],
        note:'the hatch carries the ROUTING + model choices (the "which brain, online or offline"); the weights are pluggable per host.',
      },
      boot: {
        os: base+'/', world3d: base+'/earth3d.html', photoreal: base+'/earth3d-photoreal.html',
        character: base+'/character.html', renderer:'Cesium / MapLibre (body)', shell:'MEOK OS (Sovereign dock + apps + globe)',
        note:'a portable sovereign mini-OS: identity+brain+governance travel signed; the OS/3D body is fetched + rendered by the host (browser/desktop/VM).',
      },
      governance: { careFloor: CARE_FLOOR, council:{ size:BFT_SIZE, voteThreshold:BFT_VOTE_THRESHOLD, careVeto:CARE_VETO }, hardStops:HARD_STOPS, frameworks:FRAMEWORKS, note:`canonical constants — aligned with meok-ai backend (council ${BFT_QUORUM})` },
      interfaces: { agentCard: base+'/api/agentcard?name='+encodeURIComponent(name)+'&archetype='+encodeURIComponent(arch), mcp: base+'/api/mcp', openai_chat: base+'/api/v1/chat/completions', onDeviceRunner: base+'/runner/meok-sap-runner.mjs', provenance: base+'/api/provenance', verify: base+'/api/verify' },
      model_policy: { embedded: false, sources:['host model via MCP','on-device llamafile/ollama','hosted API'], reason:'weights too large for serverless/edge — the AGENT (mind+brain-routing+body-refs) is portable, the MODEL is pluggable' },
      runnable: ['serverless (default, scale-to-zero)','on-device (local MCP stdio + offline brain)','dedicated VM (premium, always-on)'],
      // LEGACY → LAYER-0 → HATCH: any COBOL/SAP/HL7/… system attaches through its bridge and gains a
      // signed, governed, AI-aware agent inside it. This is the "safe AI inside the legacy system" play.
      legacy: bridgeLabel ? { fronts: bridgeLabel, bridgeKey: bridge, protocol_in:'native '+bridge, protocol_out:'MCP/A2A (Layer-0)', every_action:'Ed25519-signed + care-floored (safe)', bridgeFamily: base+'/api/govern' }
        : { available: Object.keys(BRIDGES), how:'add ?bridge=<key> (e.g. cobol, sap, hl7) → the Hatch fronts that legacy system through Layer-0', note:'22-bridge family; the legacy system keeps running — the Hatch adds signed, governed AI awareness on top' },
    };
    const entity = (bridge?bridge+':':'')+name+'#'+arch;   // ArkForge entity id
    pkg.trust = await fetchTrust(entity);
    const { priv, pubHex } = keypair();
    const message = canonical(pkg).slice(0, 8000);
    const signature = crypto.sign(null, Buffer.from(message), priv).toString('hex');
    const sha256 = crypto.createHash('sha256').update(message).digest('hex');
    const fingerprint='SOV:'+crypto.createHash('sha256').update(pubHex).digest('hex').slice(0,32).match(/.{1,4}/g).join('-').toUpperCase();
    if((q.format||'').toString().toLowerCase()==='af'){ return res.status(200).json(af_state); }  // Letta import
    if((q.format||'').toString().toLowerCase()==='oasf'){ return res.status(200).json({
      schema_version:'0.3.1 (OASF-compatible draft — verify vs spec.dir.agntcy.org)', name, version:'1.0.0',
      description: persona, authors:['CSOAI / MEOK (UK Co. 16939677)'],
      skills: tools.map(t=>({ class_name:t.name, description:t.desc })),
      locators:[ {type:'mcp', url: base+'/api/mcp'}, {type:'a2a', url: base+'/api/agentcard?name='+encodeURIComponent(name)}, {type:'runner', url: base+'/runner/meok-sap-runner.mjs'} ],
      extensions:[ { name:'meok.sovereign-governance.v1', data:{ signing:'ed25519 (self-owned, OFFLINE-verifiable — NOT keyless/CA)', fingerprint, careFloor:0.95, hardStops:['no harm','no unvoted autonomy','no covert surveillance'], verify: base+'/api/verify', canonical: message, signature, publicKey: pubHex } } ],
      note:'OASF-shaped MEOK Hatch + a sovereign-governance extension: offline-verifiable identity + embedded governance on top of AGNTCY/A2A.',
    }); }
    return res.status(200).json({ ok:true, hatch:pkg, package:pkg, signature:{ alg:'ed25519', canonical:message, signature, publicKey:pubHex, sha256, fingerprint, seeded:!!process.env.SIGIL_SEED, verify: base+'/api/verify' },
      note:'MEOK Hatch — hatch a sovereign AI as a portable, signed mini-OS. Rides AGNTCY(OASF)+A2A+MCP+.af, adds offline-verifiable sovereign+governed identity. AGENT inside+signed; MODEL pluggable. Verify at /api/verify; ?format=af (Letta) · ?format=oasf (AGNTCY).' });
  }catch(e){ return res.status(500).json({ ok:false, error:String(e.message||e) }); }
}
