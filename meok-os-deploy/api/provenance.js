// MEOK PROVENANCE — sign any research claim into an offline-verifiable record.
// The moat ON TOP of Claude Science / any workbench: they make results *reproducible*; a MEOK
// provenance record makes a claim + its source *sovereignly signed and verifiable offline, forever*.
// POST/GET {claim, source, kind, evidence} → Ed25519-signed record. Verify at /api/verify or in-browser.
// Provenance ≠ truth: this attests WHO asserted WHAT, WITH WHICH SOURCE, and that it wasn't tampered —
// it does NOT certify the claim is correct. That honesty is the point.
import crypto from 'crypto';
function canonical(v){ if(typeof v==='string') return v; const s=x=>Array.isArray(x)?x.map(s):(x&&typeof x==='object')?Object.keys(x).sort().reduce((o,k)=>(o[k]=s(x[k]),o),{}):x; return JSON.stringify(s(v)); }
function keypair(){ const seed=crypto.createHash('sha256').update(process.env.SIGIL_SEED||'meok-sovereign-demo-key-2026').digest(); const pkcs8=Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),seed]); const priv=crypto.createPrivateKey({key:pkcs8,format:'der',type:'pkcs8'}); return {priv,pubHex:crypto.createPublicKey(priv).export({type:'spki',format:'der'}).toString('hex')}; }

export default function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();
  try{
    const src = req.method==='POST' ? (req.body||{}) : (req.query||{});
    const claim  = (src.claim  || 'A research claim').toString().slice(0,2000);
    const source = (src.source || '').toString().slice(0,500);   // DOI / URL / dataset id
    const kind   = (src.kind   || 'general').toString().slice(0,40); // paper|compound|trial|dataset|general
    const evidence = (src.evidence || '').toString().slice(0,2000);
    const asserter = (src.asserter || 'CSOAI / MEOK Labs').toString().slice(0,120);
    const base='https://os.meok.ai';
    const record = {
      spec:'meok.provenance.v1',
      type:'sovereign research-provenance record',
      claim, source, kind, evidence, asserter,
      attests:'WHO asserted WHAT + WITH WHICH SOURCE + integrity (not tampered). Provenance != truth: does NOT certify the claim is correct.',
      governance:{ careFloor:0.95, hardStops:['no fabricated sources','no claim-as-fact without source'] },
      rides:'sign the artifacts a workbench (e.g. Claude Science) produces — reproducible + now offline-verifiable, forever.',
      provider:'CSOAI / MEOK (UK Co. 16939677)',
    };
    const { priv, pubHex } = keypair();
    const message = canonical(record).slice(0,8000);
    const signature = crypto.sign(null, Buffer.from(message), priv).toString('hex');
    const sha256 = crypto.createHash('sha256').update(message).digest('hex');
    const fingerprint='SOV:'+crypto.createHash('sha256').update(pubHex).digest('hex').slice(0,32).match(/.{1,4}/g).join('-').toUpperCase();
    return res.status(200).json({ ok:true, provenance:record,
      signature:{ alg:'ed25519', canonical:message, signature, publicKey:pubHex, sha256, fingerprint, seeded:!!process.env.SIGIL_SEED, verify:base+'/api/verify' },
      note:'MEOK provenance record — Ed25519-signed, offline-verifiable. Verify at /api/verify or in-browser (Web Crypto). Provenance attests assertion+source+integrity, NOT truth.' });
  }catch(e){ return res.status(500).json({ ok:false, error:String(e.message||e) }); }
}
