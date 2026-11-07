// Existing public signed outputs only. No keys, payments, auth changes or deployment.
import { createHash, createPublicKey, verify } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base = fileURLToPath(new URL('.', import.meta.url));
const digest = b => createHash('sha256').update(b).digest('hex');
const canonical = o => o === null || typeof o !== 'object' ? JSON.stringify(o)
  : Array.isArray(o) ? '[' + o.map(canonical).join(',') + ']'
  : '{' + Object.keys(o).sort().map(k => JSON.stringify(k)+':'+canonical(o[k])).join(',') + '}';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = base+'edge-'+stamp;
await mkdir(output, { recursive:false });
async function get(url, name) {
  const r = await fetch(url, { redirect:'error', signal:AbortSignal.timeout(20000),
    headers:{'User-Agent':'CSOAI-owned-evidence-check/1'} });
  const bytes = Buffer.from(await r.arrayBuffer());
  if (bytes.length > 2000000) throw new Error('response exceeds read bound');
  await writeFile(output+'/'+name+'.json', bytes, {flag:'wx'});
  const record = {url,http_status:r.status,bytes:bytes.length,sha256:digest(bytes),
    observed_at:new Date().toISOString(),server_date:r.headers.get('date'),cache_age:r.headers.get('age')};
  if (!r.ok) return {record,body:null};
  return {record,body:JSON.parse(bytes.toString('utf8'))};
}
const did = await get('https://csoai.org/.well-known/did.json','did');
const kid = 'did:web:csoai.org#board-attestation-1';
const vm = did.body?.verificationMethod?.find(m => m.id===kid);
if (!vm?.publicKeyJwk || vm.publicKeyJwk.kty!=='OKP' || vm.publicKeyJwk.crv!=='Ed25519') throw new Error('expected published verification key unavailable');
const key = createPublicKey({key:vm.publicKeyJwk,format:'jwk'});
const rows=[];
for (const path of ['/api/methodology','/api/cross','/api/benchmark-quality','/api/gspc']) {
  try {
    const {record,body} = await get('https://councilof.ai'+path,path.split('/').at(-1));
    if (!body) { rows.push({...record,state:'UNCHECKABLE_HTTP'}); continue; }
    const field = body.site_attestation ? 'site_attestation' : body.signature ? 'signature' : null;
    const att = field ? body[field] : null;
    if (!att?.sig || typeof att.sig!=='string') { rows.push({...record,state:'NO_SUPPORTED_SIGNATURE',signature_field:field}); continue; }
    if (att.signer!==kid || att.alg!=='Ed25519' || !/^[a-f0-9]{128}$/i.test(att.sig)) {
      rows.push({...record,state:'UNSUPPORTED_SIGNER_OR_ENCODING'}); continue;
    }
    const payload = structuredClone(body); delete payload[field];
    const bytes = Buffer.from(canonical(payload)); const sig = Buffer.from(att.sig,'hex');
    const valid = verify(null,bytes,key,sig);
    const changed = Buffer.from(sig); changed[0]^=1;
    const rejectsChangedSignature = !verify(null,bytes,key,changed);
    rows.push({...record,state:valid?'VALID':'INVALID',signature_field:field,
      signer:kid,preimage_sha256:digest(bytes),signature_negative_control_rejected:rejectsChangedSignature,
      embedded_key_matches_did:att.public_key_x===vm.publicKeyJwk.x,
      source_as_of:body.as_of ?? body.assessed_on ?? null,
      scope:'Integrity of this served payload only; not a new underlying evaluation or proof of current signing time'});
  } catch(e) { rows.push({url:'https://councilof.ai'+path,state:'UNCHECKABLE',error:e.name+': '+e.message}); }
}
const report={schema:'csoai.edge-signing-observation/1',observed_at:new Date().toISOString(),
  did:did.record,verification_method:kid,public_key_sha256:digest(Buffer.from(vm.publicKeyJwk.x,'base64url')),
  records:rows,private_keys_read:0,payments:0,signing_configuration_changed:false,
  github_used:false,output_directory:output};
await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
await writeFile(base+'edge-latest-location.txt',output+'\n');
console.log(JSON.stringify(report,null,2));
