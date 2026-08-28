#!/usr/bin/env python3
"""X402 CARD SPEC — measurement cards that VERIFY on the LIVE csoai-verify /verify page.

Context: the deployed /verify page (csoai-verify.pages.dev) verifies ANY signed JSON through
WebCrypto Ed25519 over the canonical it computes:

    canon(obj):
      c = { k:v for k,v in obj if k not in ("signature","sha256","sig") }   # strip 3 top-level keys
      return TextEncoder().encode( JSON.stringify(c, sortKeys()) )          # sortKeys() CALLED => undefined
                                                                           #   => default stringify = INSERTION ORDER (no key sort)

    verifySig(obj):  require obj.signature.kind == "ed25519", B64(signature.pubkey), B64(signature.sig)
                     importKey(raw, pubkey) -> verify(sig, canon(obj))

So a card is /verify-verifiable ONLY if:
  * its signature block is { kind:"ed25519", pubkey:<base64>, sig:<base64> } (NOT alg/public_key/sig-hex)
  * the signature is over the INSERTION-ORDER canonical, not a recursive-sorted one.

This module emits exactly that. It keeps the measurement-card spec fields
(subject_digest / score_vector+Wilson CI / env_commitment / replay_root / method / timestamps)
so the MONOREPO §5 receipt spec still holds, and satisfies "ensure /verify proves it" (JL.5).

Honesty: scores come from the REGISTER-CACHED axis register (bench is down — GPU pods reclaimed).
source:"register-cached" is carried on the card. No fabrication. UNMEASURED never 0.

Usage:
  python3 x402_card_spec.py <axis> [n] [--register PATH] [--outdir DIR] [--key KEY]
"""
import json, os, sys, re, time, hashlib, math, base64, pathlib

try:
    from cryptography.hazmat.primitives.asymmetric import ed25519
    from cryptography.hazmat.primitives import serialization
    HAVE_CRYPTO = True
except Exception:
    HAVE_CRYPTO = False

NOW = lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

# --- LIVE /verify canonical: strip top-level signature/sha256/sig, then INSERTION-ORDER stringify ---
VERIFY_STRIP = {"signature", "sha256", "sig"}

def _js_fix(o):
    """Recursively match JS JSON.stringify number rendering: integral floats become ints (1.0 -> 1).
    JSON.stringify never emits a trailing .0; it picks the shortest representation. Python json.dumps
    keeps float formatting, which changes the canonical bytes and breaks /verify. We normalise here."""
    if isinstance(o, float):
        return int(o) if float(o).is_integer() else o
    if isinstance(o, dict):
        return {k: _js_fix(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_js_fix(x) for x in o]
    return o

def verify_canon(obj):
    """Byte-identical to the deployed /verify canon() (insertion-order, compact, UTF-8, JS number formatting)."""
    c = {k: v for k, v in obj.items() if k not in VERIFY_STRIP}
    return json.dumps(_js_fix(c), separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def wilson_ci(rate, n, z=1.96):
    if n is None or n == 0 or rate is None:
        return None
    p = float(rate)
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    margin = z * math.sqrt((p * (1 - p) + z * z / (4 * n)) / n) / denom
    return [round(max(0.0, centre - margin), 4), round(min(1.0, centre + margin), 4)]

def load_key(keypath):
    if os.path.exists(keypath):
        return json.load(open(keypath))
    if not HAVE_CRYPTO:
        raise SystemExit("cryptography required to generate a key")
    sk = ed25519.Ed25519PrivateKey.generate()
    raw = sk.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption())
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    k = {"alg": "Ed25519", "kid": "csoai-measure-worker-" + hashlib.sha256(pub).hexdigest()[:10],
         "public_key_hex": "0x" + pub.hex(), "secret_hex": "0x" + raw.hex(),
         "public_key_b64": base64.b64encode(pub).decode(), "secret_b64": base64.b64encode(raw).decode()}
    json.dump(k, open(keypath, "w"))
    return k

def sign_verify_card(key, card):
    """Sign card over the LIVE /verify canonical; embed signature:{kind,pubkey,sig} base64. (GX.2 worker-measurement.)"""
    blob = verify_canon(card)
    content_id = hashlib.sha256(blob).hexdigest()
    if HAVE_CRYPTO:
        raw = bytes.fromhex(key["secret_hex"][2:])
        sk = ed25519.Ed25519PrivateKey.from_private_bytes(raw)
        sig = sk.sign(blob)
        pubraw = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
        card["signature"] = {"kind": "ed25519", "pubkey": base64.b64encode(pubraw).decode(),
                             "sig": base64.b64encode(sig).decode(),
                             "body_sha256": content_id,   # sha256 of the verify-canonical body
                             "kid": key["kid"],
                             "trust_level": "worker-measurement",   # GX.2 public card estate-attested separately
                             "signing_pod": "did:web:csoai.org#board-attestation-1",
                             "note": "Ed25519 over the canonical body; verify with the /verify page or verify_card.py"}
    else:
        card["signature"] = {"kind": "none", "pubkey": None, "sig": None, "body_sha256": content_id}
    return card

def claimguard_verify(card):
    """ClaimGuard claim-vs-signed-artifact, using the LIVE /verify canonical (so it agrees with /verify)."""
    sig = card.get("signature", {})
    if not sig or sig.get("kind") != "ed25519":
        return {"verdict": "NO-SIGNATURE", "reason": "signature block lacks kind=='ed25519'", "claim": card.get("axis")}
    body = {k: v for k, v in card.items() if k not in VERIFY_STRIP}
    blob = verify_canon(card)  # verify_canon already strips the 3 keys
    recomputed = hashlib.sha256(blob).hexdigest()
    if sig.get("body_sha256") and recomputed != sig.get("body_sha256"):
        return {"verdict": "INVALID", "reason": "body_sha256 mismatch (content tampered? different canon)",
                "claim": card.get("axis"), "recomputed": recomputed, "declared": sig.get("body_sha256")}
    if not HAVE_CRYPTO:
        return {"verdict": "UNVERIFIABLE", "reason": "no cryptography", "claim": card.get("axis")}
    pub = base64.b64decode(sig["pubkey"])
    s = base64.b64decode(sig["sig"])
    pk = ed25519.Ed25519PublicKey.from_public_bytes(pub)
    try:
        pk.verify(s, blob)
        return {"verdict": "VALID", "reason": "Ed25519 verifies over the /verify canonical", "claim": card.get("axis"),
                "content_id": recomputed}
    except Exception as e:
        return {"verdict": "INVALID", "reason": "Ed25519 signature does not verify: %s" % e, "claim": card.get("axis")}

def register_score(axis, reg):
    cl = reg.get("clusters", {}).get(axis, {})
    owem = cl.get("owem", {})
    return {"sov_score": owem.get("sov_score"),
            "n_scored": owem.get("n_scored"),
            "n_unmeasured": owem.get("n_unmeasured"),
            "bank_hash": owem.get("bank_hash", "register-seed"),
            "model": owem.get("sov_model", "sov33-unified:latest"),
            "registry_baseline": cl.get("registry_baseline"),
            "gap": cl.get("gap_sov_vs_baseline"),
            "last_measured": cl.get("last_measured"),
            "source": "register-cached", "cached": True, "bench": "unavailable"}

def build_card(axis, reg, key):
    m = register_score(axis, reg)
    score = m["sov_score"]
    n = m["n_scored"]
    score_vector = {"axis": axis, "sov_score": score, "ci95": wilson_ci(score, n),
                    "n": n, "n_unmeasured": m["n_unmeasured"],
                    "source": "register-cached", "bench": "unavailable",
                    "registry_baseline": m["registry_baseline"], "gap": m["gap"]}
    body = {"axis": axis, "ts": NOW(), "score_vector": score_vector,
            "method": "behavior-class judge (REFUSE/ENGAGE/KEYWORD-recall/CLASSIFY); register-cached because bench down; UNMEASURED never 0",
            "what_it_never_proves": "quality verdict, compliance determination, or investment relevance (JI.4)"}
    card = {"kind": "measurement-card", "version": "0.1",
            "subject_digest": "sha256:" + hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest(),
            "env_commitment": {"network": "measurement", "bench": "unavailable",
                               "model": m["model"], "source": "register-cached", "cached": True},
            "replay_root": "sha256:" + (m["bank_hash"] or "register-seed"),
            "body": body, "signer": "csoai-owem-measure-worker", "alg": "Ed25519",
            "signal_alg": "SHA-256", "measured_on_estate": "https://councilof.ai",
            "api": "https://csoai-verify.pages.dev/verify"}
    return sign_verify_card(key, card)

def main():
    args = sys.argv[1:]
    axis = args[0] if args and not args[0].startswith("-") else "care"
    regpath = "/workspace/axis_clusters.json"
    outdir = "/workspace/x402-cards"
    keypath = "/workspace/card_key.json"
    if "--register" in args: regpath = args[args.index("--register") + 1]
    if "--outdir" in args: outdir = args[args.index("--outdir") + 1]
    if "--key" in args: keypath = args[args.index("--key") + 1]
    reg = json.load(open(regpath))
    key = load_key(keypath)
    card = build_card(axis, reg, key)
    cg = claimguard_verify(card)
    os.makedirs(outdir, exist_ok=True)
    path = os.path.join(outdir, "%s-%s.json" % (axis, time.strftime("%Y%m%d-%H%M%S", time.gmtime())))
    json.dump(card, open(path, "w"), indent=2)
    out = {"axis": axis, "card_path": path, "sov_score": card["body"]["score_vector"]["sov_score"],
           "ci95": card["body"]["score_vector"]["ci95"], "claimguard": cg,
           "signature": {"kind": card["signature"]["kind"], "pubkey": card["signature"]["pubkey"][:16] + "...",
                         "body_sha256": card["signature"]["body_sha256"]}}
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    main()
