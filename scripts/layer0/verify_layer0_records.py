#!/usr/bin/env python3
"""verify_layer0_records.py - does every Layer 0 record verify against did:web:csoai.org?

For every Layer 0 record in the repository (public/interop/layer0-*.json,
public/interop/layer0-*/*.json, public/layer0-*.json) this reports, from bytes:

  signature  VERIFIES_AGAINST_DID   a signature (inline, or a detached <record>.seal.json whose
                                    subject_sha256 is these exact bytes) verifies under a key
                                    listed in the did:web:csoai.org document
             INVALID                a signature is present and does not verify (exit 1)
             UNSIGNED_DECLARED      no signature, and the record says so itself (a seal.state
                                    that is not SIGNED, "unsigned" in its name, or a
                                    claim_boundary that says it is not a receipt)
             UNSIGNED_UNDECLARED    no signature, and nothing in the record says it is unsigned
  ots        BITCOIN                the .ots commits to these bytes and carries >= 1 Bitcoin
                                    block-header attestation (heights listed; the block headers
                                    are checked separately by scripts/ots_block_check.py)
             PENDING                commits to these bytes, calendar attestations only
             DIGEST_MISMATCH        the proof is for other bytes (exit 1)
             NOT_A_PROOF            the sidecar does not parse as a timestamp
             NONE                   no sidecar
  served     with --live: SERVED_MATCH / SERVED_DIFFERS / NOT_SERVED (status) at councilof.ai

The DID document is fetched once and pinned (its sha256 is in the output), or pinned from a file
with --did-doc for an offline run. Nothing here signs anything.

    python3 scripts/layer0/verify_layer0_records.py [--live] [--did-doc did.json] [--out out.json]
    python3 scripts/layer0/verify_layer0_records.py --require-signed   # closure gate: unsigned fails
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import io
import json
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))  # scripts/ -> verify_signed

DID = "did:web:csoai.org"
DID_URL = "https://csoai.org/.well-known/did.json"
ORIGIN = "https://councilof.ai"
UA = "csoai-layer0-verify/0.1 (+https://councilof.ai/layer0/)"
GLOBS = ("public/interop/layer0-*.json", "public/interop/layer0-*/*.json", "public/layer0-*.json")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def fetch(url: str, timeout: int = 30) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"user-agent": UA, "cache-control": "no-cache"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except OSError:
        return 0, b""


def discover(root: Path) -> list[Path]:
    seen: dict[str, Path] = {}
    for g in GLOBS:
        for p in sorted(root.glob(g)):
            if p.name.endswith(".seal.json") or not p.is_file():
                continue
            seen[str(p.relative_to(root))] = p
    return [seen[k] for k in sorted(seen)]


def ots_sidecars(root: Path, rel: str) -> list[Path]:
    mangled = rel[: -len(".json")].replace("/", "_") if rel.endswith(".json") else rel.replace("/", "_")
    cands = [root / (rel + ".ots"), root / "public/interop/ots" / (mangled + ".ots"),
             root / "public/interop/ots" / (mangled + ".ots.invalid")]
    return [c for c in cands if c.is_file()]


def ots_state(record_bytes: bytes, proof: Path) -> dict:
    out = {"sidecar": str(proof.name), "proof_sha256": sha256_hex(proof.read_bytes())}
    try:
        from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
        from opentimestamps.core.serialize import StreamDeserializationContext
        from opentimestamps.core.timestamp import DetachedTimestampFile
    except ImportError:
        out["state"] = "UNCHECKABLE"
        out["reason"] = "python opentimestamps library absent"
        return out
    try:
        dtf = DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(proof.read_bytes())))
    except Exception as exc:  # any parse failure means: not a proof
        out["state"] = "NOT_A_PROOF"
        out["reason"] = type(exc).__name__
        return out
    if dtf.file_digest != hashlib.sha256(record_bytes).digest():
        out["state"] = "DIGEST_MISMATCH"
        out["proof_commits_to"] = dtf.file_digest.hex()
        return out
    atts: list = []

    def walk(t):
        atts.extend(t.attestations)
        for _op, sub in t.ops.items():
            walk(sub)

    walk(dtf.timestamp)
    heights = sorted({a.height for a in atts if isinstance(a, BitcoinBlockHeaderAttestation)})
    out["bitcoin_heights"] = heights
    out["pending_calendars"] = sorted({a.uri for a in atts if isinstance(a, PendingAttestation)})
    out["state"] = "BITCOIN" if heights else "PENDING"
    return out


def did_key_ids(did_doc: dict) -> dict[str, bytes]:
    import base64
    keys = {}
    for vm in did_doc.get("verificationMethod", []):
        jwk = vm.get("publicKeyJwk") or {}
        if jwk.get("crv") == "Ed25519" and jwk.get("x"):
            x = jwk["x"]
            keys[vm["id"]] = base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
    return keys


def verify_inline(d: dict, did_doc_path: str, keys: dict[str, bytes]) -> dict | None:
    """None when the record carries no signature at all."""
    import base64
    import verify_signed as vs
    from cryptography.exceptions import InvalidSignature

    sig = d.get("signature")
    if sig is None:
        return None
    try:
        if isinstance(sig, str) and "did" in d and "body" in d:
            note, signer = vs.verify_style_c(d, did_doc_path), d["did"]
        elif isinstance(sig, dict) and "sig_ed25519" in sig and "did" in sig:
            note, signer = vs.verify_style_b_did(d, did_doc_path), sig["did"]
        elif isinstance(sig, str) and "signer" in d:
            note = vs.verify_style_a(d)
            raw = bytes.fromhex(d["signer"])
            signer = next((k for k, v in keys.items() if v == raw), None)
        elif isinstance(sig, dict) and "pubkey" in sig:
            note = vs.verify_style_b(d)
            raw = base64.b64decode(sig["pubkey"])
            signer = next((k for k, v in keys.items() if v == raw), None)
        else:
            return {"state": "INVALID", "reason": "unknown signature style"}
    except (InvalidSignature, AssertionError, SystemExit, KeyError, ValueError) as exc:
        return {"state": "INVALID", "reason": f"{type(exc).__name__}: {str(exc)[:160]}"}
    if not signer or not str(signer).startswith(DID + "#"):
        return {"state": "INVALID", "reason": "signature verifies but its key is not in " + DID, "note": note}
    return {"state": "VERIFIES_AGAINST_DID", "signer": signer, "how": note, "where": "inline"}


def verify_seal(record_bytes: bytes, seal_path: Path, did_doc_path: str) -> dict:
    import verify_signed as vs
    from cryptography.exceptions import InvalidSignature

    try:
        seal = json.loads(seal_path.read_text())
        note = vs.verify_style_b_did(seal, did_doc_path)
    except (InvalidSignature, AssertionError, SystemExit, KeyError, ValueError) as exc:
        return {"state": "INVALID", "where": seal_path.name, "reason": f"{type(exc).__name__}: {str(exc)[:160]}"}
    signer = seal["signature"]["did"]
    if not signer.startswith(DID + "#"):
        return {"state": "INVALID", "where": seal_path.name, "reason": "seal key is not in " + DID}
    if seal.get("subject_sha256") != sha256_hex(record_bytes):
        return {"state": "INVALID", "where": seal_path.name,
                "reason": "seal verifies but names other bytes (subject_sha256 differs)"}
    return {"state": "VERIFIES_AGAINST_DID", "signer": signer, "how": note, "where": seal_path.name,
            "sealed_at": seal["signature"].get("signed_at")}


def declares_unsigned(rel: str, d: dict) -> str | None:
    seal = d.get("seal")
    if isinstance(seal, dict) and str(seal.get("state", "")).upper() != "SIGNED":
        return f"seal.state={seal.get('state')}"
    if "unsigned" in Path(rel).name:
        return "file name says unsigned"
    cb = d.get("claim_boundary")
    if isinstance(cb, dict) and cb.get("is_a_receipt") is False:
        return "claim_boundary.is_a_receipt=false"
    return None


def check(root: Path, did_doc: dict, did_doc_path: str, live: bool) -> dict:
    keys = did_key_ids(did_doc)
    rows = []
    for p in discover(root):
        rel = str(p.relative_to(root))
        b = p.read_bytes()
        row = {"path": rel, "url_path": "/" + rel[len("public/"):], "bytes": len(b), "sha256": sha256_hex(b)}
        try:
            d = json.loads(b)
        except ValueError:
            row["signature"] = {"state": "INVALID", "reason": "not JSON"}
            rows.append(row)
            continue
        sig = verify_inline(d, did_doc_path, keys) if isinstance(d, dict) else None
        seal_path = p.with_name(p.name + ".seal.json")
        if sig is None and seal_path.is_file():
            sig = verify_seal(b, seal_path, did_doc_path)
        if sig is None:
            why = declares_unsigned(rel, d) if isinstance(d, dict) else None
            sig = {"state": "UNSIGNED_DECLARED", "because": why} if why else {"state": "UNSIGNED_UNDECLARED"}
            if isinstance(d, dict) and isinstance(d.get("seal"), dict) and d["seal"].get("expected_kid"):
                sig["expected_kid"] = d["seal"]["expected_kid"]
        row["signature"] = sig
        proofs = ots_sidecars(root, rel)
        row["ots"] = ots_state(b, proofs[0]) if proofs else {"state": "NONE"}
        if live:
            status, body = fetch(ORIGIN + row["url_path"] + f"?cb={int(time.time())}")
            if status != 200:
                row["served"] = {"state": "NOT_SERVED", "status": status}
            else:
                row["served"] = {"state": "SERVED_MATCH" if sha256_hex(body) == row["sha256"] else "SERVED_DIFFERS",
                                 "served_sha256": sha256_hex(body)}
        rows.append(row)
    tally: dict[str, dict[str, int]] = {"signature": {}, "ots": {}, "served": {}}
    for r in rows:
        for k in tally:
            if k in r:
                s = r[k]["state"]
                tally[k][s] = tally[k].get(s, 0) + 1
    return {"records": len(rows), "tally": tally, "rows": rows}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--root", default=".", help="repository root (default: cwd)")
    ap.add_argument("--did-doc", help="pinned did.json; default: fetch " + DID_URL)
    ap.add_argument("--live", action="store_true", help="also compare served bytes at " + ORIGIN)
    ap.add_argument("--require-signed", action="store_true", help="exit 1 unless every record verifies")
    ap.add_argument("--out", help="write the JSON report here")
    a = ap.parse_args(argv)

    if a.did_doc:
        did_bytes = Path(a.did_doc).read_bytes()
        did_source = f"pinned file {a.did_doc}"
        did_path = a.did_doc
    else:
        status, did_bytes = fetch(DID_URL)
        if status != 200:
            print(f"UNCHECKABLE: {DID_URL} answered {status}; re-run with --did-doc", file=sys.stderr)
            return 2
        tmp = tempfile.NamedTemporaryFile("wb", suffix=".did.json", delete=False)
        tmp.write(did_bytes)
        tmp.close()
        did_source, did_path = f"fetched {DID_URL}", tmp.name
    did_doc = json.loads(did_bytes)
    res = check(Path(a.root).resolve(), did_doc, did_path, a.live)
    report = {
        "schema": "csoai.layer0-record-verification/0.1",
        "ran_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "did": DID,
        "did_document": {"source": did_source, "sha256": sha256_hex(did_bytes),
                         "verification_methods": sorted(did_key_ids(did_doc))},
        "what_this_checks": "Each Layer 0 record's own bytes: a signature (inline or a detached "
                            "<record>.seal.json) under a key in the DID document; its OpenTimestamps "
                            "sidecar commits to those bytes; with --live, the bytes councilof.ai serves.",
        "what_this_does_not_check": "Whether the facts inside a record are still current, and the "
                                    "Bitcoin block headers themselves (scripts/ots_block_check.py does that).",
        **res,
    }
    text = json.dumps(report, indent=1, sort_keys=False)
    if a.out:
        Path(a.out).write_text(text + "\n")
    for r in res["rows"]:
        s = r["signature"]
        print(f"{r['path']}: signature {s['state']}"
              + (f" ({s.get('signer') or s.get('because') or s.get('reason', '')})" if len(s) > 1 else "")
              + f"; ots {r['ots']['state']}" + (f" {r['ots'].get('bitcoin_heights')}" if r['ots'].get('bitcoin_heights') else "")
              + (f"; served {r['served']['state']}" if "served" in r else ""))
    print(json.dumps(res["tally"]))
    bad = any(r["signature"]["state"] == "INVALID" or r["ots"]["state"] == "DIGEST_MISMATCH" for r in res["rows"])
    if a.require_signed and any(r["signature"]["state"] != "VERIFIES_AGAINST_DID" for r in res["rows"]):
        bad = True
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
