#!/usr/bin/env node
/** Derive a same-site copy of the owned verifier. No signing, fetching or downloaded-code execution. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SOURCE='scripts/verify_receipt.py';
export const OUTPUT='public/verifier/verify_receipt.py';
export const MANIFEST='public/verifier/receipt-toolkit.json';
export const GUIDE='public/verifier/receipt-toolkit.md';
const SITE='https://councilof.ai';
const digest=b=>createHash('sha256').update(b).digest('hex');
function regular(root,relative){
 const full=path.join(root,relative);let walked=path.resolve(root);
 for(const part of relative.split('/')){walked=path.join(walked,part);if(fs.lstatSync(walked).isSymbolicLink())throw new Error('Symlink not permitted: '+relative);}
 const stat=fs.statSync(full);if(!stat.isFile()||stat.size>256000)throw new Error('Not a bounded regular source: '+relative);
 return fs.readFileSync(full);
}
export function derive(root=ROOT){
 const code=regular(root,SOURCE);
 if(!code.includes(Buffer.from('def verify_one('))||!code.includes(Buffer.from('if __name__ == "__main__":')))throw new Error('Unexpected source verifier');
 const sourceHash=digest(code);
 const guide=`# Verify an x402 offer or receipt without GitHub\n\nThis is an exact same-site copy of Council of AI's existing Python checker. It checks an Ed25519 JWS offer or receipt; it is not interchangeable with the card-v0 checker, GSPC measurement-card checker or population-content verifier.\n\n## Download and inspect\n\n\`\`\`sh\ncurl --fail --silent --show-error --proto '=https' --output verify_receipt.py ${SITE}/verifier/verify_receipt.py\ncurl --fail --silent --show-error --proto '=https' --output receipt-toolkit.json ${SITE}/verifier/receipt-toolkit.json\npython3 -c 'import hashlib,json,pathlib; m=json.loads(pathlib.Path("receipt-toolkit.json").read_text()); b=pathlib.Path("verify_receipt.py").read_bytes(); assert len(b)==m["artifact"]["bytes"] and hashlib.sha256(b).hexdigest()==m["artifact"]["sha256"]; print("Downloaded bytes match the manifest")'\n\`\`\`\n\nInspect the downloaded code before running it. The checksum is an integrity check against this same-site manifest, not an independent authentication of the website, source organisation or payment. No curl-to-shell pipeline is required.\n\n## Dependency\n\nPython 3.9 or newer and the cryptography package. Use your own isolated environment and dependency policy; the download performs no package installation. The checker has no API-token or wallet requirement.\n\n## Verify an already saved artifact\n\n\`\`\`sh\npython3 verify_receipt.py --file saved-receipts.json\n\`\`\`\n\nThe default command makes one public DID-document read from https://csoai.org/.well-known/did.json. It does not call the server verification endpoint and does not make a payment. To replay offline against a DID document already retained and trusted under your policy:\n\n\`\`\`sh\npython3 verify_receipt.py --file saved-receipts.json --did "file://$(pwd)/did.json"\n\`\`\`\n\nOffline replay establishes validity under those retained key bytes, not that the key is currently published. Keep the key-document retrieval time and digest with your evidence.\n\n## Result boundary\n\nExit 0 is VALID under the supplied DID key and this checker's payload rules; exit 1 is INVALID; exit 2 is UNDETERMINED. A malformed outer JSON file may raise an input error; that is not a successful verification. Signature validity does not establish payment settlement, asset transfer, receipt freshness, replay protection, the truth of a measurement or customer acceptance. The optional --check-chain requires the chosen RPC to match the signed EIP-155 network and return the same transaction hash with successful mined execution. Reverted execution returns exit 1. Pending or missing receipts, unavailable RPC, wrong network, malformed responses, or a missing transaction reference return exit 2: a valid signature alone cannot make that requested chain check pass. It makes at most two read-only RPC calls per artifact, with bounded responses, no redirects or retries. This is not a transfer amount/asset/payer/payee, finality, replay-protection or customer-delivery check. Omit the flag for signature-only replay, including privacy-minimal receipts.\n\n## Separate verifiers\n\n- card-v0 payloads: ${SITE}/verifier/card-v0-verify.mjs\n- GSPC measurement cards: ${SITE}/verifier/gspc-verify.mjs\n- Claim Maintenance artifacts: ${SITE}/spec/claim-maintenance/v0.1/reference/claim-capture.mjs\n\nSource checksum: sha256:${sourceHash}. The build checks that this public copy is byte-identical to ${SOURCE}; no production signing key is accessed.\n`;
 const manifest={schema:'csoai.public-receipt-toolkit/1.0',artifact:{url:SITE+'/verifier/verify_receipt.py',source_path:SOURCE,bytes:code.length,sha256:sourceHash,exact_source_copy:true},guide:{url:SITE+'/verifier/receipt-toolkit.md',bytes:Buffer.byteLength(guide),sha256:digest(Buffer.from(guide))},runtime:{python:'>=3.9',external_dependency:'cryptography',dependency_install_performed:false},scope:{format:'x402 Offer & Receipt compact JWS',algorithm:'Ed25519',default_key_document:'https://csoai.org/.well-known/did.json',saved_key_document_supported:true,signature_replay_requires_wallet:false,signature_replay_requires_API_key:false,default_signature_check_public_DID_reads:1,chain_check_profile:'eip155-receipt-status/1.1',chain_check:{rpc_network_must_match_signed_network:true,transaction_hash_must_match:true,execution_status_must_equal:1,unknown_exit:2,reverted_exit:1,maximum_read_only_RPC_calls_per_artifact:2,transfer_details_verified:false,finality_verified:false},payment_verified:false,receipt_freshness_verified:false,measurement_truth_verified:false,source_identity_independently_verified:false},related_verifiers:{card_v0:SITE+'/verifier/card-v0-verify.mjs',gspc_card:SITE+'/verifier/gspc-verify.mjs',claim_artifact:SITE+'/spec/claim-maintenance/v0.1/reference/claim-capture.mjs'},generation:'Deterministic from owned source bytes. Manifest is not signed or independently trusted.'};
 return new Map([[OUTPUT,code],[GUIDE,Buffer.from(guide)],[MANIFEST,Buffer.from(JSON.stringify(manifest,null,2)+'\n')]]);
}
export function render(root=ROOT,check=false){
 const expected=derive(root);
 for(const [rel,want] of expected){
  const target=path.join(root,rel);
  if(check){const have=regular(root,rel);if(!have.equals(want))throw new Error('Public verifier drift: '+rel);}
  else {fs.mkdirSync(path.dirname(target),{recursive:true});if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw new Error('Refuse symlink output');const temp=target+'.'+process.pid+'.tmp';fs.writeFileSync(temp,want);fs.renameSync(temp,target);}
 }
 return {state:check?'SOURCE_PARITY_VERIFIED':'GENERATED',files:expected.size,source_sha256:digest(expected.get(OUTPUT)),network_requests:0,production_signatures:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(render(ROOT,process.argv.includes('--check'))));}catch(e){console.error(e.message);process.exitCode=1;}
}
