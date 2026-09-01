#!/usr/bin/env python3
"""verify_any_card.py — one standalone verifier for every signed-card shape in the estate.

Zero estate imports. Zero network calls. Pure stdlib + a single Ed25519 primitive.
Run it in an empty venv against a downloaded artifact and it works.

It detects the shape, reconstructs that shape's signed preimage, and checks the
signature. It reports what it actually verified, never a bare boolean: a
`"signed": true` field in an artifact is a claim by the producer, not evidence, and
this tool ignores such fields entirely.

Shapes handled (see CARD-SHAPES-AND-REPRODUCIBILITY.md for the full inventory):

  A  gspc-card        {alg, body, id, preimage, pubkey, signature}
                      preimage = canonical JSON of body; hex key + hex sig
                      id must equal sha256(preimage)
                      If preimage_rule or canon is "jcs-rfc8785", the preimage is RFC 8785
                      JCS (sibling _jcs.py, else harness/arena/jcs.py). Missing JCS is
                      UNCHECKABLE — never a silent fallback to v1 json.dumps.

  B  axis-signal      {...fields..., content_id, signature:{alg,pubkey,sig,...}}
                      content_id = sha256(canonical JSON of body-minus-integrity-fields)
                      signature is over the content_id HEX STRING (ASCII), not the body.
                      Both links must hold or the body is not bound to the signature.

  C  custody-attested {...fields..., custody_attestation:{public_key_hex,sig_b64,...}}
                      preimage = canonical JSON of payload minus custody_attestation;
                      signature is over those bytes directly.

  D  DSSE            {payloadType, payload(b64), signatures:[{keyid,sig}]}
                      preimage = DSSE PAE("DSSEv1", payloadType, payload)

Exit code 0 only if every artifact verified. Any failure, unknown shape, or
unverifiable field exits non-zero.

Usage:
    python3 verify_any_card.py card.json [more.json ...]
    python3 verify_any_card.py --dir public/signed/cards
    python3 verify_any_card.py --expect-key <hex-or-b64> card.json   # pin the signer
"""
import argparse
import base64
import binascii
import hashlib
import importlib.util
import json
import os
import sys

# --- Ed25519 verify: prefer stdlib-adjacent libs, else a self-contained fallback ----
_BACKEND = None
try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

    def ed25519_verify(pub: bytes, sig: bytes, msg: bytes) -> bool:
        try:
            Ed25519PublicKey.from_public_bytes(pub).verify(sig, msg)
            return True
        except Exception:
            return False

    _BACKEND = "cryptography"
except ImportError:  # pragma: no cover - exercised in the clean-room run
    try:
        import nacl.signing
        import nacl.exceptions

        def ed25519_verify(pub: bytes, sig: bytes, msg: bytes) -> bool:
            try:
                nacl.signing.VerifyKey(pub).verify(msg, sig)
                return True
            except Exception:
                return False

        _BACKEND = "pynacl"
    except ImportError:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from _ed25519_pure import verify as _pure_verify  # type: ignore

        def ed25519_verify(pub: bytes, sig: bytes, msg: bytes) -> bool:
            return _pure_verify(pub, sig, msg)

        _BACKEND = "pure-python"


def canonical(obj, ensure_ascii=True) -> bytes:
    """Canonical JSON as the estate's shapes declare it: sorted keys, no whitespace.

    ensure_ascii is a REAL fork, not a detail. The estate's shapes disagree:
      - shape A declares `json.dumps(body, sort_keys=True, separators=(',',':'))`,
        which takes Python's default ensure_ascii=True (non-ASCII -> \\uXXXX).
      - shapes B and C were produced with ensure_ascii=False (raw UTF-8).
    All 150 shape-A bodies are pure ASCII so the fork never bites them, but 2 of 20
    shape-B artifacts and the shape-C board contain non-ASCII and can ONLY be
    verified with ensure_ascii=False.

    This function is therefore always used via canonical_both(), which tries each
    and reports which one the artifact actually requires.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=ensure_ascii).encode("utf-8")


def canonical_match(obj, want_hex):
    """Return (matched_bytes, variant_label) for whichever canonicalisation hashes to
    want_hex, or (None, None). Never guesses -- an artifact that matches neither is
    reported as unverified, not quietly passed."""
    for ea, label in ((True, "ensure_ascii=True"), (False, "ensure_ascii=False")):
        b = canonical(obj, ea)
        if hashlib.sha256(b).hexdigest() == want_hex:
            return b, label
    return None, None


def _load_jcs():
    """RFC 8785 canonicalize, or None.

    Stranger kit: sibling tools/_jcs.py. This repo: harness/arena/jcs.py.
    Missing is UNCHECKABLE — never treat a jcs-rfc8785 card as v1.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = (
        os.path.join(here, "_jcs.py"),
        os.path.join(os.path.dirname(here), "harness", "arena", "jcs.py"),
    )
    for path in candidates:
        if not os.path.isfile(path):
            continue
        spec = importlib.util.spec_from_file_location("_csoai_jcs", path)
        if spec is None or spec.loader is None:
            continue
        mod = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(mod)
        except Exception:
            continue
        fn = getattr(mod, "canonicalize", None)
        if callable(fn):
            return fn
    return None


def dsse_pae(payload_type: str, payload: bytes) -> bytes:
    """DSSE Pre-Authentication Encoding, per the DSSE spec."""
    t = payload_type.encode("utf-8")
    return b"DSSEv1 %d %s %d %s" % (len(t), t, len(payload), payload)


def _key_bytes(s: str) -> bytes:
    """Accept a key as 64-char hex or as base64. Ed25519 public keys are 32 bytes."""
    s = s.strip()
    try:
        b = binascii.unhexlify(s)
        if len(b) == 32:
            return b
    except Exception:
        pass
    b = base64.b64decode(s, validate=False)
    if len(b) != 32:
        raise ValueError(f"not a 32-byte Ed25519 public key: {s[:16]}...")
    return b


def _sig_bytes(s: str) -> bytes:
    s = s.strip()
    try:
        b = binascii.unhexlify(s)
        if len(b) == 64:
            return b
    except Exception:
        pass
    b = base64.b64decode(s, validate=False)
    if len(b) != 64:
        raise ValueError("not a 64-byte Ed25519 signature")
    return b


# ---------------------------------------------------------------------------
# shape detection
# ---------------------------------------------------------------------------
def detect(d):
    if not isinstance(d, dict):
        return None
    if "payloadType" in d and "payload" in d and "signatures" in d:
        return "D"
    if "custody_attestation" in d:
        return "C"
    if {"alg", "body", "id", "signature", "pubkey"} <= set(d):
        return "A"
    if "content_id" in d and isinstance(d.get("signature"), dict):
        return "B"
    return None


class Result:
    def __init__(self, path, shape):
        self.path, self.shape = path, shape
        self.checks = []   # (name, ok, detail)
        self.key = None

    def add(self, name, ok, detail=""):
        self.checks.append((name, bool(ok), detail))
        return ok

    @property
    def ok(self):
        return bool(self.checks) and all(c[1] for c in self.checks)


def verify_A(d, r):
    body, sig, pub = d["body"], d["signature"], d["pubkey"]
    rule = d.get("preimage_rule") or d.get("canon")
    if rule == "jcs-rfc8785":
        jcs_fn = _load_jcs()
        if jcs_fn is None:
            r.add(
                "JCS canonicaliser available",
                False,
                "UNCHECKABLE: jcs-rfc8785 card but no sibling _jcs.py "
                "(and no harness/arena/jcs.py). Not a v1 fallback.",
            )
            return r
        raw = jcs_fn(body)
        pre = raw if isinstance(raw, bytes) else raw.encode("utf-8")
        hid = hashlib.sha256(pre).hexdigest()
        r.add(
            "id == sha256(JCS body)",
            hid == d["id"],
            f"{d['id'][:16]}..." if hid == d["id"] else "JCS digest does not match id",
        )
        if hid != d["id"]:
            return r
        k = _key_bytes(pub)
        r.key = binascii.hexlify(k).decode()
        r.add("Ed25519 sig over JCS body", ed25519_verify(k, _sig_bytes(sig), pre))
        return r
    pre, variant = canonical_match(body, d["id"])
    r.add("id == sha256(canonical body)", pre is not None,
          f"{d['id'][:16]}... via {variant}" if pre else "matches NEITHER canonicalisation")
    if pre is None:
        return r
    if isinstance(d.get("preimage"), str):
        r.add("declared preimage recipe is the one used",
              "sort_keys=True" in d["preimage"] and "(',',':')" in d["preimage"].replace('"', "'"),
              d["preimage"][:48] + "...")
    k = _key_bytes(pub)
    r.key = binascii.hexlify(k).decode()
    r.add("Ed25519 sig over canonical body", ed25519_verify(k, _sig_bytes(sig), pre))
    return r


def verify_B(d, r):
    sig = d["signature"]
    body = {k: v for k, v in d.items() if k not in ("content_id", "signature")}
    # link 1: body -> content_id.  Without this the signature binds nothing.
    pre, variant = canonical_match(body, d["content_id"])
    r.add("content_id == sha256(canonical body)", pre is not None,
          f"{d['content_id'][:16]}... via {variant}" if pre
          else "matches NEITHER canonicalisation")
    k = _key_bytes(sig["pubkey"])
    r.key = binascii.hexlify(k).decode()
    # link 2: content_id -> signature. Signed over the ASCII hex, not the body bytes.
    r.add("Ed25519 sig over content_id hex string",
          ed25519_verify(k, _sig_bytes(sig["sig"]), d["content_id"].encode("ascii")))
    return r


def verify_C(d, r):
    ca = d["custody_attestation"]
    body = {k: v for k, v in d.items() if k != "custody_attestation"}
    pre, variant = canonical_match(body, ca["content_id"])
    r.add("content_id == sha256(canonical payload minus attestation)", pre is not None,
          f"{ca['content_id'][:16]}... via {variant}" if pre
          else "matches NEITHER canonicalisation")
    if pre is None:
        return r
    k = _key_bytes(ca["public_key_hex"])
    r.key = binascii.hexlify(k).decode()
    if isinstance(ca.get("keyid"), str) and ca["keyid"].startswith("sha256:"):
        r.add("keyid == sha256(public key)",
              "sha256:" + hashlib.sha256(k).hexdigest() == ca["keyid"])
    r.add("Ed25519 sig over canonical payload", ed25519_verify(k, _sig_bytes(ca["sig_b64"]), pre))
    return r


def verify_D(d, r, expect_key=None):
    payload = base64.b64decode(d["payload"])
    pae = dsse_pae(d["payloadType"], payload)
    r.add("payload is valid JSON", _is_json(payload), f"{len(payload)} bytes")
    sigs = d["signatures"]
    r.add("envelope carries >=1 signature", len(sigs) >= 1)
    any_ok = False
    for i, s in enumerate(sigs):
        # DSSE carries a keyid, not the key. The key must come from outside the
        # envelope -- that is the point of keyid. We can only verify if given one.
        if expect_key is None:
            r.add(f"signature[{i}] verifiable", False,
                  "UNVERIFIABLE: DSSE carries keyid only; pass --expect-key with the "
                  f"public key for keyid={str(s.get('keyid'))[:16]}...")
            continue
        k = _key_bytes(expect_key)
        r.key = binascii.hexlify(k).decode()
        if s.get("keyid"):
            r.add(f"signature[{i}] keyid == sha256(supplied key)",
                  hashlib.sha256(k).hexdigest() == s["keyid"])
        ok = ed25519_verify(k, _sig_bytes(s["sig"]), pae)
        any_ok = any_ok or ok
        r.add(f"signature[{i}] Ed25519 over DSSE PAE", ok)
    return r


def _is_json(b):
    try:
        json.loads(b)
        return True
    except Exception:
        return False


VERIFIERS = {"A": verify_A, "B": verify_B, "C": verify_C}
SHAPE_NAMES = {"A": "gspc-card (raw canonical body)",
               "B": "axis-signal (sig over content_id hex)",
               "C": "custody-attested (sig over canonical payload)",
               "D": "DSSE (sig over PAE)"}


def verify_file(path, expect_key=None):
    with open(path, "rb") as fh:
        d = json.loads(fh.read())
    shape = detect(d)
    r = Result(path, shape)
    if shape is None:
        r.add("recognised shape", False, "UNKNOWN SHAPE - not verified")
        return r
    if shape == "D":
        verify_D(d, r, expect_key)
    else:
        VERIFIERS[shape](d, r)
    if expect_key is not None and shape != "D" and r.key:
        try:
            r.add("signer key == --expect-key",
                  r.key == binascii.hexlify(_key_bytes(expect_key)).decode())
        except Exception:
            r.add("signer key == --expect-key", False, "bad --expect-key")
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--dir")
    ap.add_argument("--expect-key", help="pin the expected signer public key (hex or b64)")
    ap.add_argument("--quiet", action="store_true", help="one line per artifact")
    a = ap.parse_args()

    paths = list(a.paths)
    if a.dir:
        paths += [os.path.join(a.dir, f) for f in sorted(os.listdir(a.dir))
                  if f.endswith(".json")]
    if not paths:
        ap.error("nothing to verify")

    print(f"# ed25519 backend: {_BACKEND}")
    bad = 0
    counts = {}
    for p in paths:
        r = verify_file(p, a.expect_key)
        counts[r.shape] = counts.get(r.shape, 0) + 1
        if not r.ok:
            bad += 1
        if a.quiet:
            print(f"{'PASS' if r.ok else 'FAIL'}  shape={r.shape}  {os.path.basename(p)}")
        else:
            print(f"\n{os.path.basename(p)}")
            print(f"  shape {r.shape}: {SHAPE_NAMES.get(r.shape, 'UNKNOWN')}")
            for name, ok, detail in r.checks:
                print(f"    [{'ok' if ok else 'XX'}] {name}" + (f"  ({detail})" if detail else ""))
            print(f"  => {'VERIFIED' if r.ok else 'NOT VERIFIED'}")

    print(f"\n{len(paths)} artifact(s); shapes seen: "
          + ", ".join(f"{k}x{v}" for k, v in sorted(counts.items(), key=lambda x: str(x[0]))))
    print(f"{len(paths) - bad} verified, {bad} failed")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
