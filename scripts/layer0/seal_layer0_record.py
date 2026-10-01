#!/usr/bin/env python3
"""seal_layer0_record.py - a detached board-key seal for one Layer 0 record, without touching its bytes.

WHY DETACHED. A Layer 0 record's OpenTimestamps proof commits to the record's exact bytes. Writing a
signature INTO the record would change those bytes and orphan a Bitcoin-attested proof. So the seal is
a separate file, <record>.seal.json, whose body names the record by sha256 and whose signature is the
board key's (did:web:csoai.org#board-attestation-1) over that body. scripts/verify_signed.py verifies
it (style B-DID); scripts/layer0/verify_layer0_records.py checks that it names the bytes on disk.

TWO MODES.
  --rehearse            throwaway Ed25519 key + a throwaway DID document, written under --out-dir.
                        Proves the seal verifies, that an altered seal fails, and that a seal over
                        other bytes is refused. Gives no estate authority and signs nothing real.
  --sign --token-file   POST /api/board-sign with the caller token (read from the file, never
                        printed), verify the returned signature against the live DID document, run
                        the altered-preimage control, then write <record>.seal.json beside the record.
                        OWNER-GATED for Layer 0 records: the Layer 0 ceremony checklist makes
                        production signing an owner step. Run it only on the owner's say-so.

    python3 scripts/layer0/seal_layer0_record.py --rehearse public/interop/layer0-ceremony-2026-09-03.json --out-dir /tmp/l0
    python3 scripts/layer0/seal_layer0_record.py --sign --token-file ~/.secrets/board-sign-pod-token public/interop/layer0-ceremony-2026-09-03.json
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE.parent / "arena"))

import verify_layer0_records as v  # noqa: E402

BOARD_KID = "did:web:csoai.org#board-attestation-1"
REHEARSAL_KID = "did:web:csoai.org#layer0-rehearsal-throwaway"


def canonical(obj) -> bytes:
    import board_sign
    return board_sign.canonical(obj)


def seal_body(root: Path, record: Path) -> dict:
    root = root.resolve()
    resolved_record = record.resolve()
    try:
        rel = str(resolved_record.relative_to(root))
    except ValueError as exc:
        raise SystemExit("GATE: Layer 0 record must be inside the declared root") from exc
    b = record.read_bytes()
    d = json.loads(b)
    proofs = v.ots_sidecars(root, rel)
    ots = v.ots_state(b, proofs[0]) if proofs else {"state": "NONE"}
    body = {
        "schema": "csoai.layer0-seal/0.1",
        "kind": "layer0.detached-seal",
        "subject": "/" + rel[len("public/"):],
        "subject_sha256": v.sha256_hex(b),
        "subject_bytes": len(b),
        "subject_as_of": d.get("as_of") if isinstance(d, dict) else None,
        "subject_schema": d.get("schema") if isinstance(d, dict) else None,
        "ots": {k: ots[k] for k in ("state", "bitcoin_heights", "proof_sha256") if k in ots},
        "what_this_seal_is": "The board key's signature over a body that names these exact record bytes by sha256. "
                             "It binds the key to the bytes as published.",
        "what_this_seal_is_not": "It does not re-run, re-probe or re-attest anything inside the record, and it does "
                                 "not say the record's facts are current at signing time. Not a grade.",
        "verify": "python3 scripts/verify_signed.py <this file>; then sha256(<subject bytes>) must equal subject_sha256.",
    }
    if canonical(body) != canonical(json.loads(json.dumps(body))) or not canonical(body).isascii():
        raise SystemExit("GATE: seal body must be ASCII JSON with a stable canonical form")
    if len(canonical(body)) > 3072:
        raise SystemExit("GATE: seal body exceeds the 3 KB signer cap")
    return body


def assemble(body: dict, sig_block: dict) -> dict:
    return {"content_id": hashlib.sha256(canonical(body)).hexdigest(), **body, "signature": sig_block}


def rehearse(root: Path, record: Path, out_dir: Path) -> int:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization

    out_dir.mkdir(parents=True, exist_ok=True)
    key = Ed25519PrivateKey.generate()
    raw = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    did_doc = {"id": "did:web:csoai.org", "note": "THROWAWAY rehearsal document - not the estate DID",
               "verificationMethod": [{"id": REHEARSAL_KID, "type": "JsonWebKey2020", "controller": "did:web:csoai.org",
                                       "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519",
                                                        "x": base64.urlsafe_b64encode(raw).rstrip(b"=").decode()}}]}
    did_path = out_dir / "rehearsal.did.json"
    did_path.write_text(json.dumps(did_doc))
    body = seal_body(root, record)
    pre = canonical(body)
    seal = assemble(body, {"alg": "Ed25519", "did": REHEARSAL_KID, "sig_ed25519": key.sign(pre).hex(),
                           "payload_sha256": hashlib.sha256(pre).hexdigest(), "signed_at": "REHEARSAL"})
    seal_path = out_dir / (record.name + ".seal.json")
    seal_path.write_text(json.dumps(seal, indent=1) + "\n")
    rec_bytes = record.read_bytes()
    results = {"verifies": v.verify_seal(rec_bytes, seal_path, str(did_path))["state"]}
    tampered = dict(seal, subject_bytes=seal["subject_bytes"] + 1)
    tpath = out_dir / "tampered.seal.json"
    tpath.write_text(json.dumps(tampered))
    results["altered_seal"] = v.verify_seal(rec_bytes, tpath, str(did_path))["state"]
    results["other_bytes"] = v.verify_seal(rec_bytes + b" ", seal_path, str(did_path))["state"]
    ok = results == {"verifies": "VERIFIES_AGAINST_DID", "altered_seal": "INVALID", "other_bytes": "INVALID"}
    print(json.dumps({"rehearsal": results, "pass": ok, "seal_bytes": len(pre), "seal": str(seal_path)}))
    return 0 if ok else 1


def sign(root: Path, record: Path, token_file: str) -> int:
    import board_sign

    body = seal_body(root, record)
    did_doc = board_sign.load_did_doc()
    sig = board_sign.sign_payload(body, token_file, did_doc=did_doc)  # verifies + altered-preimage control
    seal = assemble(body, sig)
    seal_path = record.with_name(record.name + ".seal.json")
    seal_path.write_text(json.dumps(seal, indent=1) + "\n")
    import tempfile
    tmp = tempfile.NamedTemporaryFile("w", suffix=".did.json", delete=False)
    json.dump(did_doc, tmp)
    tmp.close()
    got = v.verify_seal(record.read_bytes(), seal_path, tmp.name)
    print(json.dumps({"seal": str(seal_path), "state": got["state"], "signer": got.get("signer")}))
    return 0 if got["state"] == "VERIFIES_AGAINST_DID" else 1


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("record")
    ap.add_argument("--root", default=".")
    m = ap.add_mutually_exclusive_group(required=True)
    m.add_argument("--rehearse", action="store_true")
    m.add_argument("--sign", action="store_true")
    ap.add_argument("--out-dir", default="layer0-seal-rehearsal")
    ap.add_argument("--token-file")
    a = ap.parse_args(argv)
    root = Path(a.root).resolve()
    record = (root / a.record).resolve() if not Path(a.record).is_absolute() else Path(a.record)
    if a.rehearse:
        return rehearse(root, record, Path(a.out_dir))
    if not a.token_file:
        raise SystemExit("--sign needs --token-file")
    return sign(root, record, a.token_file)


if __name__ == "__main__":
    sys.exit(main())
