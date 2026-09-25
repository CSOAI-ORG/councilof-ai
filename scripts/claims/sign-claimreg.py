#!/usr/bin/env python3
"""Sign one claim registry by sidecar through POST https://councilof.ai/api/board-sign (pod caller
token, never printed), verify the Ed25519 signature against did:web:csoai.org#board-attestation-1,
run two altered-preimage controls that MUST fail, then OTS-stamp the registry and the sidecar.
Same method as scripts/census/build-mcp-remote-census-record.py sign/ots; sidecar shape as the
existing public/claims/*.signed.json. Nothing is written unless signature and controls hold.
usage: sign_claimreg.py DIR REGISTRY_ID [--token FILE]"""
import base64, collections, hashlib, json, os, pathlib, sys, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519

d = pathlib.Path(sys.argv[1]); rid = sys.argv[2]
tokf = sys.argv[4] if len(sys.argv) > 4 and sys.argv[3] == "--token" else "~/.secrets/board-sign-pod-token"
sha = lambda b: hashlib.sha256(b).hexdigest()
reg_p = d / f"{rid}.json"; raw = reg_p.read_bytes(); reg = json.loads(raw)
assert reg["registry_id"] == rid
assert reg["signature_state"].startswith("SIGNED BY SIDECAR") and f"/claims/{rid}.signed.json" in reg["signature_state"], "registry does not name its sidecar"
rest = {k: v for k, v in reg.items() if k != "registry_digest"}
assert sha(json.dumps(rest, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()) == reg["registry_digest"], "registry_digest does not reproduce (python)"
states = collections.Counter(c["state"] for c in reg["claims"])
assert dict(states) == {k: v for k, v in reg["totals"]["by_state"].items() if v} , (dict(states), reg["totals"]["by_state"])
payload = {
    "schema": "csoai.signed-artifact/0.1",
    "artifact": {"path": f"/claims/{rid}.json", "sha256": sha(raw), "schema": reg["schema"], "as_of": reg["created_utc"][:10]},
    "registry_id": rid, "registry_digest": reg["registry_digest"],
    "merkle": {"algorithm": reg["merkle"]["algorithm"], "root": reg["merkle"]["root"], "n_leaves": reg["merkle"]["tree_size"]},
    "supersedes": {"registry_id": reg["supersedes"]["registry_id"], "sha256": reg["supersedes"]["sha256"]},
    "claim_states": reg["totals"]["by_state"],
    "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
    "not_a_grade": "The signature proves these bytes were signed by the board key on the date below. It does not certify, endorse or grade anything in the registry, and it makes no statement about any party the registry names.",
}
canon = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert len(canon) <= 3072, len(canon)
tok = pathlib.Path(os.path.expanduser(tokf)).read_text().strip()
req = urllib.request.Request("https://councilof.ai/api/board-sign", data=json.dumps({"payload": payload}).encode(),
                             headers={"content-type": "application/json", "authorization": "Bearer " + tok, "user-agent": "Mozilla/5.0 csoai-pod-signer"})
r = json.load(urllib.request.urlopen(req, timeout=40)); del tok
assert r["payload_sha256"] == sha(canon), "preimage mismatch"
did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"user-agent": "Mozilla/5.0"}), timeout=20))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
pk = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
pk.verify(bytes.fromhex(r["sig_ed25519"]), canon)
print(f"{rid}: signature VERIFIES under did:web:csoai.org#board-attestation-1")
controls = {}
for name, alt in (("trailing byte appended", canon + b" "), ("registry sha256 altered", canon.replace(sha(raw).encode(), b"0" * 64))):
    assert alt != canon
    try:
        pk.verify(bytes.fromhex(r["sig_ed25519"]), alt); controls[name] = "VERIFIED (CONTROL FAILED)"
    except Exception:
        controls[name] = "rejected (control holds)"
print("controls:", controls)
if any("FAILED" in v for v in controls.values()):
    sys.exit(3)
doc = {"schema": "csoai.signed-run/0.1", "payload": payload,
       "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                     "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                     "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
       "verify": "canonicalise payload (sort_keys, separators=(',',':'), ensure_ascii=False, UTF-8); its sha256 must equal signature.payload_sha256; verify sig_ed25519 (hex) with #board-attestation-1 from https://csoai.org/.well-known/did.json. Then check payload.artifact.sha256 against the registry file's bytes, and recompute the Merkle root from the registry's claim records with scripts/claims/merkle_rfc9162.py.",
       "control_run": "the same signature over the payload plus one trailing space, and over the payload with the registry sha256 zeroed, was rejected before this file was written"}
sp = d / f"{rid}.signed.json"; sp.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
print(f"SIGNED {rid}.json sha256={sha(raw)} signed_at={r.get('signed_at')}")

from opentimestamps.calendar import RemoteCalendar
from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
cals = ["https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org", "https://finney.calendar.eternitywall.com"]
for f in (reg_p, sp):
    b = f.read_bytes(); dg = hashlib.sha256(b).digest(); ts = Timestamp(dg); got = []
    for u in cals:
        try:
            ts.merge(RemoteCalendar(u).submit(dg, timeout=30)); got.append(u)
        except Exception as e:
            print("  calendar failed", u, type(e).__name__)
    if not got:
        sys.exit(f"NOT_STAMPED {f.name}")
    ctx = BytesSerializationContext(); DetachedTimestampFile(OpSHA256(), ts).serialize(ctx)
    op = pathlib.Path(str(f) + ".ots"); op.write_bytes(ctx.getbytes())
    back = DetachedTimestampFile.deserialize(BytesDeserializationContext(op.read_bytes()))
    atts = [type(x[1]).__name__ for x in back.timestamp.all_attestations()]
    assert back.file_digest == dg and atts and all(a == "PendingAttestation" for a in atts), atts
    print(f"OTS {op.name}: {len(got)} calendars, {len(atts)} PendingAttestation, binds=True")
