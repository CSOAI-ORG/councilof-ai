#!/usr/bin/env python3
"""verify_signed.py — portable stranger-verifiable signature checker (MOVES #61-62).

One tool, both estate signature styles, zero trust, zero network:
  style A (living board):  {"signature": hex, "signer": hex-pub, "sig_input": ...}
                            canonical = board minus signature/signer/signed/sig_input
  style B (signals/cards): {"content_id": sha256hex, "signature": {"sig": b64,
                            "pubkey": b64, "content_id": ...}}
                            canonical = json.dumps(body sans content_id/signature,
                            sort_keys, compact) -> sha256 == content_id -> Ed25519
  style C (mill cards):     {"alg": "Ed25519", "body": {...}, "id": sha256hex,
                            "preimage_rule": "sha256(canonical body)",
                            "signature": hex, "did": "did:web:HOST#KEYID"}
                            canonical = compact(body) -> sha256 == id; the Ed25519
                            signature is over those canonical BODY BYTES, not the digest.
                            The public key is resolved from the did:web document, so
                            style C is the one style that touches the network. Pin it
                            offline with --did-doc <did.json> to keep the zero-network
                            property (e.g. in CI, or to verify against a key as-of a date).

Usage: python3 verify_signed.py <artifact.json> [--did-doc <did.json>]
Exit 0 = signature VALID (content matches bytes on disk); 1 = INVALID/unknown style.
"""
import base64, hashlib, json, sys
from pathlib import Path
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives import serialization

SIG_FIELDS = ("signature", "signer", "signed", "sig_input")


def canonical(obj, compact=False):
    # Roadmap #1 (RFC 8785): v2 cards carry canon:"jcs-rfc8785" — pinned canonical bytes
    # = Python rfc8785.dumps output (the estate signing stack). Legacy cards (absent field)
    # use the v1 rules below. NEVER re-sign v1 cards; dispatch on the field only.
    if isinstance(obj, dict) and obj.get("canon") == "jcs-rfc8785":
        try:
            from rfc8785 import dumps as jcs
            return (jcs(obj).decode() if isinstance(jcs(obj), bytes) else jcs(obj)).encode()
        except ImportError:
            raise SystemExit("GATE: card declares canon:jcs-rfc8785 but verifier lacks "
                             "the rfc8785 library (pip install rfc8785) — refusing to guess.")
    if compact:  # style B (signals/cards): emit_signals canonical
        return json.dumps(obj, sort_keys=True, separators=(",", ":"),
                          ensure_ascii=False).encode()
    # style A (living board): sign_board canonical — default separators + ensure_ascii=True
    return json.dumps(obj, sort_keys=True).encode()


def verify_style_a(d):
    key = Ed25519PublicKey.from_public_bytes(bytes.fromhex(d["signer"]))
    body = {k: v for k, v in d.items() if k not in SIG_FIELDS}
    digest = hashlib.sha256(canonical(body)).digest()
    key.verify(bytes.fromhex(d["signature"]), digest)
    return "style-A (living board): Ed25519 over sha256(canonical minus signature fields)"


def verify_style_b(d):
    sig = d["signature"]
    key = Ed25519PublicKey.from_public_bytes(base64.b64decode(sig["pubkey"]))
    body = {k: v for k, v in d.items() if k not in ("content_id", "signature")}
    cid = hashlib.sha256(canonical(body, compact=True)).hexdigest()
    assert cid == d["content_id"], "content_id mismatch (canonical changed!)"
    key.verify(base64.b64decode(sig["sig"]), cid.encode())
    return "style-B (signal/card): Ed25519 over canonical content_id"


def _resolve_did_web(did_url, did_doc_path=None):
    """did:web:HOST[:path...]#KEYID -> Ed25519 public key bytes.

    Returns (key_bytes, source) so the caller can tell the reader where trust came from.
    """
    did, _, frag = did_url.partition("#")
    if did_doc_path:
        doc = json.loads(Path(did_doc_path).read_text())
        source = f"pinned file {did_doc_path}"
    else:
        if not did.startswith("did:web:"):
            raise SystemExit(f"GATE: unsupported DID method in {did_url!r} — refusing to guess.")
        parts = did[len("did:web:"):].split(":")
        host = parts[0].replace("%3A", ":")
        url = ("https://" + host + "/.well-known/did.json" if len(parts) == 1
               else "https://" + host + "/" + "/".join(parts[1:]) + "/did.json")
        import urllib.request, urllib.error
        # Explicit UA: the default urllib agent is 403'd by bot protection in front
        # of the DID host, which would look like "key missing" rather than "blocked".
        req = urllib.request.Request(url, headers={"User-Agent": "csoai-verify_signed/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                doc = json.loads(r.read())
        except urllib.error.HTTPError as e:
            raise SystemExit(f"UNCHECKABLE: DID document {url} returned HTTP {e.code}. "
                             "Fetch it another way and re-run with --did-doc <did.json>.")
        except OSError as e:
            raise SystemExit(f"UNCHECKABLE: could not reach {url} ({e}). "
                             "Re-run with --did-doc <did.json> to verify offline.")
        source = f"network fetch {url}"
    for vm in doc.get("verificationMethod", []):
        if vm.get("id") == did_url or vm.get("id", "").endswith("#" + frag):
            jwk = vm.get("publicKeyJwk", {})
            if jwk.get("crv") != "Ed25519":
                raise SystemExit(f"GATE: key {frag} is {jwk.get('crv')}, not Ed25519.")
            x = jwk["x"]
            return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)), source
    raise SystemExit(f"GATE: no verificationMethod {frag!r} in the DID document ({source}).")


def verify_style_c(d, did_doc_path=None):
    rule = d.get("preimage_rule")
    if rule != "sha256(canonical body)":
        raise SystemExit(f"GATE: unknown preimage_rule {rule!r} — refusing to guess.")
    if d.get("alg") != "Ed25519":
        raise SystemExit(f"GATE: unknown alg {d.get('alg')!r} — refusing to guess.")
    body_bytes = canonical(d["body"], compact=True)
    computed = hashlib.sha256(body_bytes).hexdigest()
    assert computed == d["id"], (
        f"id mismatch: card says {d['id'][:16]}..., bytes hash to {computed[:16]}... "
        "(the body was edited after signing)")
    pub, source = _resolve_did_web(d["did"], did_doc_path)
    # The signature covers the canonical body bytes themselves, NOT sha256 of them.
    Ed25519PublicKey.from_public_bytes(pub).verify(bytes.fromhex(d["signature"]), body_bytes)
    return (f"style-C (mill card): Ed25519 over canonical body bytes; id commits to "
            f"the whole body; key from {source}")


def main():
    args = sys.argv[1:]
    did_doc = None
    if "--did-doc" in args:
        i = args.index("--did-doc")
        did_doc = args[i + 1]
        del args[i:i + 2]
    if len(args) != 1:
        print(__doc__); return 1
    d = json.loads(Path(args[0]).read_text())
    # Three-state doctrine: an artifact that declares itself unverifiable is reported
    # as UNCHECKABLE, not silently retried until some reading happens to pass.
    if d.get("verifiable") is False or d.get("verification_state") == "UNVERIFIABLE":
        print(f"UNCHECKABLE — artifact declares verification_state="
              f"{d.get('verification_state', 'UNVERIFIABLE')!r}")
        if d.get("unverifiable_note"):
            print(f"  note: {d['unverifiable_note'][:200]}")
        return 2
    try:
        if isinstance(d.get("signature"), str) and "did" in d and "body" in d:
            note = verify_style_c(d, did_doc)
        elif isinstance(d.get("signature"), str) and "signer" in d:
            note = verify_style_a(d)
        elif isinstance(d.get("signature"), dict) and "pubkey" in d["signature"]:
            note = verify_style_b(d)
        else:
            print("UNKNOWN SIGNATURE STYLE"); return 1
    except InvalidSignature:
        print("INVALID — signature does not verify over the bytes on disk")
        return 1
    except AssertionError as e:
        print(f"INVALID — {e}")
        return 1
    if "did" in d and "body" in d:
        signer = d["did"]
    elif "signer" in d:
        signer = d["signer"][:16]
    else:
        signer = base64.b64encode(base64.b64decode(d["signature"]["pubkey"]))[:16].decode()
    print(f"VALID — {note}\n  signer: {signer}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
