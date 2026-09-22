#!/usr/bin/env python3
"""board_sign.py — sign a small JSON payload with the board key via POST /api/board-sign.

The PKCS8 never leaves Cloudflare. A pod holds only a caller token (read from a file,
never printed). The endpoint signs the canonical bytes of `payload` with
did:web:csoai.org#board-attestation-1 and returns {did, sig_ed25519 (hex), payload_sha256}.

Canonical bytes = JSON.stringify of the key-sorted object, UTF-8 (functions/_lib/cardSign.ts
canonicalBytes). Python reproduces that with json.dumps(sort_keys, compact separators,
ensure_ascii=False) PROVIDED int-valued floats are emitted as ints (JS has no 1.0) — so
`norm()` is applied to every body before it is hashed, signed or written.

Every signature returned here is verified locally against the DID document before it is
used, and an altered-preimage control proves the verifier can fail. Payload limit 3 KB.
"""
import base64, hashlib, json, math, sys, urllib.request

DID_URL = "https://csoai.org/.well-known/did.json"
SIGN_URL = "https://councilof.ai/api/board-sign"
BOARD_KID = "did:web:csoai.org#board-attestation-1"
MAX_PAYLOAD = 3072


def norm(o):
    """int-valued floats -> int, so Python canonical bytes == JS JSON.stringify bytes."""
    if isinstance(o, float):
        if not math.isfinite(o):
            raise ValueError("NaN/Infinity not allowed in canonical JSON")
        return int(o) if o.is_integer() else o
    if isinstance(o, dict):
        return {k: norm(v) for k, v in o.items()}
    if isinstance(o, list):
        return [norm(v) for v in o]
    return o


def canonical(obj) -> bytes:
    return json.dumps(norm(obj), sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def assert_ascii(obj, what="signed body"):
    """The browser/edge verifier renders content_id cards with ensure_ascii=True while the
    board signer uses JSON.stringify (non-ASCII literal). They agree only on ASCII bodies, so
    a non-ASCII body is refused here rather than shipped with two different preimages."""
    c = canonical(obj)
    if not c.isascii():
        raise SystemExit(f"GATE: {what} contains non-ASCII characters; the two canonical forms would diverge")
    return c


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load_did_doc(path=None):
    if path:
        return json.load(open(path))
    req = urllib.request.Request(DID_URL, headers={"user-agent": "Mozilla/5.0 csoai-arena-signer"})
    return json.load(urllib.request.urlopen(req, timeout=20))


def board_pubkey(did_doc, kid=BOARD_KID):
    from cryptography.hazmat.primitives.asymmetric import ed25519
    frag = kid.split("#", 1)[1]
    for vm in did_doc.get("verificationMethod", []):
        if vm.get("id") == kid or vm.get("id", "").endswith("#" + frag):
            x = vm["publicKeyJwk"]["x"]
            return ed25519.Ed25519PublicKey.from_public_bytes(
                base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)))
    raise SystemExit(f"GATE: {kid} not in DID document")


def verify_board_sig(payload, sig_hex, did_doc):
    """Raises cryptography.exceptions.InvalidSignature on failure."""
    board_pubkey(did_doc).verify(bytes.fromhex(sig_hex), canonical(payload))


def sign_payload(payload, token_file, did_doc=None, url=SIGN_URL):
    """Returns the signature block. Verifies before returning; runs the altered-preimage control."""
    from cryptography.exceptions import InvalidSignature
    canon = canonical(payload)
    if len(canon) > MAX_PAYLOAD:
        raise SystemExit(f"GATE: payload is {len(canon)} bytes > {MAX_PAYLOAD}; sign an envelope instead")
    tok = open(token_file).read().strip()
    req = urllib.request.Request(url, data=json.dumps({"payload": norm(payload)}).encode(),
                                 headers={"content-type": "application/json",
                                          "authorization": "Bearer " + tok,
                                          "user-agent": "Mozilla/5.0 csoai-pod-signer"})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=40))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"board-sign HTTP {e.code}: {e.read()[:300]!r}")
    want = sha256_hex(canon)
    if r.get("payload_sha256") != want:
        raise SystemExit(f"preimage mismatch: signer hashed {r.get('payload_sha256')}, we canonicalised {want}")
    if r.get("did") != BOARD_KID:
        raise SystemExit(f"unexpected signer {r.get('did')!r}")
    did_doc = did_doc or load_did_doc()
    verify_board_sig(payload, r["sig_ed25519"], did_doc)
    try:
        board_pubkey(did_doc).verify(bytes.fromhex(r["sig_ed25519"]), canon + b" ")
        raise SystemExit("CONTROL FAILED: altered preimage verified")
    except InvalidSignature:
        pass
    return {
        "alg": "Ed25519",
        "did": BOARD_KID,
        "sig_ed25519": r["sig_ed25519"],
        "payload_sha256": r["payload_sha256"],
        "signer_auth": r.get("signer_auth"),
        "signed_at": r.get("signed_at"),
        "canonical": "JSON.stringify of key-sorted object, UTF-8; int-valued floats as ints "
                     "(functions/_lib/cardSign.ts canonicalBytes)",
        "verify": "sha256(canonical preimage) == payload_sha256; Ed25519 verify sig_ed25519 (hex) "
                  "over the canonical preimage bytes with the #board-attestation-1 key in " + DID_URL,
    }


if __name__ == "__main__":
    # smoke: sign a tiny object and verify; never prints the token
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    sig = sign_payload({"probe": "board_sign smoke", "n": 1}, sys.argv[1])
    print(json.dumps({k: v for k, v in sig.items() if k != "sig_ed25519"}, indent=1))
    print("signature verifies under", BOARD_KID, "; altered-preimage control fails as it must")
