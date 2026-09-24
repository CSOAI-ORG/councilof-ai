#!/usr/bin/env python3
"""Sign the effect-binding server-probe run via POST /api/board-sign (pod caller token).
Writes effect-binding-server-probe-2026-09-22.signed.json beside the artifact. Never prints the token.
Verifies the returned signature locally against the DID document before writing."""
import json, hashlib, sys, urllib.request, base64, datetime
from cryptography.hazmat.primitives.asymmetric import ed25519
ART="/workspace/lanes/out/effect-binding-server-2026-09-22/effect-binding-server-probe-2026-09-22.json"
LOG="/workspace/lanes/out/effect-binding-server-2026-09-22/probe.log.jsonl"
tok=open("/workspace/secrets/board-sign-pod-token").read().strip()
art_b=open(ART,'rb').read(); d=json.loads(art_b)
def sha(b): return hashlib.sha256(b).hexdigest()
tp=d["third_party"]["counts"]; v=tp["verdict_distribution"]; oc=tp["outcomes"]
payload={
 "schema":"csoai.effect-binding-server-run/0.1",
 "axis":"effect-binding","board_slot":23,"ruling_ref":"council-os/ADR-002-axis-23-effect-binding.md",
 "kind":"deterministic-facts","status":"MEASURED",
 "n":d["n"],"n_unit":d["n_unit"],
 "as_of":d["as_of"],
 "artifact":{"path":"/interop/effect-binding-server-probe-2026-09-22.json","sha256":sha(art_b),
             "mirror":"https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main/public/interop/effect-binding-server-probe-2026-09-22.json"},
 "raw_log":{"path":"public/interop/effect-binding-server-probe-2026-09-22.log.jsonl (HF mirror only)","sha256":sha(open(LOG,'rb').read())},
 "verdicts":{k:v[k] for k in ("BINDS","PARTIAL","DOES_NOT_BIND")},
 "tried":tp["tried"],"dropped":{k:oc[k] for k in ("UNCHECKABLE","UNREACHABLE","NO_TOOLS","NO_READONLY_TOOL")},
 "signer":"did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token; the PKCS8 never left Cloudflare)",
 "not_a_grade":"A signature proves these bytes were signed by the board key; it does not prove any claim inside the artifact beyond what its instrument measured (SCITT rule).",
}
print("payload keys:", list(payload)); print("verdicts:", payload["verdicts"])
canon=json.dumps(payload,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
assert len(canon)<=3072, len(canon)
req=urllib.request.Request("https://councilof.ai/api/board-sign",data=json.dumps({"payload":payload}).encode(),
    headers={"content-type":"application/json","authorization":"Bearer "+tok,"user-agent":"Mozilla/5.0 csoai-pod-signer"})
try:
    r=json.load(urllib.request.urlopen(req,timeout=40))
except urllib.error.HTTPError as e:
    print("HTTP",e.code,e.read()[:300]); sys.exit(2)
print({k:r[k] for k in r if k!="sig_ed25519"})
assert r["payload_sha256"]==sha(canon), ("preimage mismatch", r["payload_sha256"], sha(canon))
did=json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json",headers={"user-agent":"Mozilla/5.0"}),timeout=20))
x=[m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
pk=ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x+"=="))
pk.verify(bytes.fromhex(r["sig_ed25519"]),canon); print("signature VERIFIES under did:web:csoai.org#board-attestation-1")
try:
    pk.verify(bytes.fromhex(r["sig_ed25519"]),canon+b" "); print("CONTROL FAILED"); sys.exit(3)
except Exception: print("control: altered preimage does NOT verify (grader can fail)")
out={"schema":"csoai.signed-run/0.1","payload":payload,"signature":{"did":r["did"],"alg":"Ed25519","sig_ed25519":r["sig_ed25519"],"payload_sha256":r["payload_sha256"],"canonical":"JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)","signer_auth":r.get("signer_auth"),"signed_at":r.get("signed_at")},
     "verify":"canonicalise payload as above, sha256 must equal signature.payload_sha256, verify sig_ed25519 (hex) with the #board-attestation-1 key in https://csoai.org/.well-known/did.json"}
p="/workspace/lanes/out/effect-binding-server-2026-09-22/effect-binding-server-probe-2026-09-22.signed.json"
open(p,"w").write(json.dumps(out,indent=2,ensure_ascii=False)+"\n"); print("wrote",p)
