#!/usr/bin/env python3
# SPDX-License-Identifier: CC0-1.0
"""completion_record_verify.py — verify a csoai.completion-record/0.1 (Open Badges 3.0 / VC 2.0).

Checks, in order, and reports each one:
  shape      the strict profile schema public/schemas/csoai-completion-record-0.1.schema.json
             (needs the `jsonschema` package; reported SCHEMA_UNCHECKED, never VALID, without it)
  proof      W3C Data Integrity, cryptosuite eddsa-jcs-2022: Ed25519 over
             SHA-256(JCS(proof options + @context)) || SHA-256(JCS(record without proof)).
             The key comes from the issuer: a did:key decodes locally; did:web:csoai.org is read
             from the published DID document (--did).
  binding    proof.verificationMethod belongs to issuer.id
  completion evidence[0].publishedResultSha256 == evidence[0].reproducedResultSha256
  subject    pseudonymous: credentialSubject carries only id, type, achievement
  status     the BitstringStatusListCredential named by credentialStatus (URL, or --status-list
             FILE): its own proof must verify under the same issuer, and the bit at
             statusListIndex must be 0 (1 = REVOKED)
  test       csoaiRecord.test — a TEST record is never a real record; exit 3 unless --allow-test

Exit: 0 VALID · 1 INVALID or REVOKED · 2 UNCHECKABLE / usage · 3 VALID but TEST (without --allow-test)

  python3 tools/verify/completion_record_verify.py record.json --status-list status-list.json --allow-test
"""
from __future__ import annotations

import argparse
import base64
import copy
import gzip
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
SCHEMA_PATH = REPO / "public" / "schemas" / "csoai-completion-record-0.1.schema.json"
DEFAULT_DID = "https://csoai.org/.well-known/did.json"
UA = "csoai-completion-record-verify/0.1 (+https://councilof.ai/academy/)"
B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
MIN_BITS = 131072


def fetch(src: str) -> bytes:
    if src.startswith(("https://", "http://")):
        req = urllib.request.Request(src, headers={"User-Agent": UA, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read()
    return Path(src).read_bytes()


def _check_jcs_domain(v, at="$"):
    if isinstance(v, float):
        raise ValueError(f"JCS: non-integer number at {at} is outside this profile")
    if isinstance(v, dict):
        for k, x in v.items():
            if not k.isascii():
                raise ValueError(f"JCS: non-ASCII key at {at}")
            _check_jcs_domain(x, f"{at}.{k}")
    elif isinstance(v, list):
        for i, x in enumerate(v):
            _check_jcs_domain(x, f"{at}[{i}]")


def jcs(v) -> bytes:
    """RFC 8785 for this profile's value space (ASCII keys, integers, no floats)."""
    _check_jcs_domain(v)
    return json.dumps(v, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def b58decode(s: str) -> bytes:
    n = 0
    for c in s:
        i = B58.find(c)
        if i < 0:
            raise ValueError("base58: bad character")
        n = n * 58 + i
    raw = n.to_bytes((n.bit_length() + 7) // 8, "big") if n else b""
    pad = len(s) - len(s.lstrip("1"))
    return b"\x00" * pad + raw


def key_from_did_key(did: str) -> bytes:
    m = re.match(r"^did:key:z([1-9A-HJ-NP-Za-km-z]+)", did)
    if not m:
        raise ValueError("not a did:key")
    b = b58decode(m.group(1))
    if len(b) != 34 or b[:2] != b"\xed\x01":
        raise ValueError("did:key is not Ed25519")
    return b[2:]


def key_from_did_web(vm: str, did_src: str) -> bytes:
    doc = json.loads(fetch(did_src))
    frag = "#" + vm.split("#", 1)[1]
    for m in doc.get("verificationMethod") or []:
        if str(m.get("id", "")).endswith(frag):
            x = (m.get("publicKeyJwk") or {})["x"]
            return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
    raise KeyError(f"DID document has no {frag}")


def issuer_id(doc: dict) -> str:
    iss = doc.get("issuer")
    return iss.get("id") if isinstance(iss, dict) else str(iss or "")


def resolve_key(doc: dict, did_src: str) -> bytes:
    vm = str((doc.get("proof") or {}).get("verificationMethod") or "")
    iss = issuer_id(doc)
    if not vm.startswith(iss + "#"):
        raise ValueError("proof.verificationMethod does not belong to the issuer")
    if iss.startswith("did:key:"):
        if vm != f"{iss}#{iss[len('did:key:'):]}":
            raise ValueError("did:key verificationMethod must be <did>#<multibase>")
        return key_from_did_key(iss)
    if iss == "did:web:csoai.org":
        return key_from_did_web(vm, did_src)
    raise ValueError(f"issuer {iss!r} is not an accepted issuer")


def hash_data(doc: dict) -> bytes:
    proof = dict(doc["proof"])
    proof.pop("proofValue", None)
    unsecured = {k: v for k, v in doc.items() if k != "proof"}
    if "@context" in proof and proof["@context"] != unsecured.get("@context"):
        raise ValueError("proof @context differs from the document @context")
    if "@context" in unsecured:
        proof["@context"] = unsecured["@context"]
    return hashlib.sha256(jcs(proof)).digest() + hashlib.sha256(jcs(unsecured)).digest()


def verify_proof(doc: dict, pub: bytes) -> tuple[str, str]:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

    p = doc.get("proof")
    if not isinstance(p, dict) or p.get("type") != "DataIntegrityProof" or p.get("cryptosuite") != "eddsa-jcs-2022":
        return "INVALID", "proof is not a DataIntegrityProof / eddsa-jcs-2022"
    if p.get("proofPurpose") != "assertionMethod":
        return "INVALID", "proofPurpose must be assertionMethod"
    pv = str(p.get("proofValue") or "")
    if not pv.startswith("z"):
        return "INVALID", "proofValue is not multibase base58btc"
    try:
        sig = b58decode(pv[1:])
        data = hash_data(doc)
    except ValueError as e:
        return "UNCHECKABLE", str(e)
    try:
        Ed25519PublicKey.from_public_bytes(pub).verify(sig, data)
    except Exception:  # noqa: BLE001
        return "INVALID", "Ed25519 signature does not verify over the eddsa-jcs-2022 hashData"
    return "VALID", "eddsa-jcs-2022 proof verifies"


def schema_check(doc: dict) -> dict:
    try:
        import jsonschema
    except ImportError:
        return {"state": "SCHEMA_UNCHECKED", "reason": "jsonschema package not installed"}
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    errs = sorted(jsonschema.Draft202012Validator(schema).iter_errors(doc), key=lambda e: list(e.absolute_path))
    if errs:
        return {"state": "INVALID", "errors": [f"{'/'.join(map(str, e.absolute_path)) or '$'}: {e.message}"[:300] for e in errs[:10]]}
    return {"state": "VALID", "schema": schema["$id"]}


def status_check(doc: dict, status_src: str | None, did_src: str) -> dict:
    cs = doc.get("credentialStatus") or {}
    url = cs.get("statusListCredential")
    try:
        idx = int(cs.get("statusListIndex"))
        sl = json.loads(fetch(status_src or url))
    except Exception as e:  # noqa: BLE001
        return {"state": "UNCHECKABLE", "reason": f"status list unreadable: {type(e).__name__}", "list": status_src or url}
    if sl.get("id") != url:
        return {"state": "INVALID", "reason": "status list id does not match credentialStatus.statusListCredential"}
    if "BitstringStatusListCredential" not in (sl.get("type") or []):
        return {"state": "INVALID", "reason": "not a BitstringStatusListCredential"}
    if issuer_id(sl) != issuer_id(doc):
        return {"state": "INVALID", "reason": "status list issuer differs from the record issuer"}
    try:
        verdict, why = verify_proof(sl, resolve_key(sl, did_src))
    except Exception as e:  # noqa: BLE001
        return {"state": "UNCHECKABLE", "reason": f"status list key: {e}"}
    if verdict != "VALID":
        return {"state": verdict, "reason": f"status list proof: {why}"}
    subj = sl.get("credentialSubject") or {}
    if subj.get("statusPurpose") != cs.get("statusPurpose"):
        return {"state": "INVALID", "reason": "statusPurpose mismatch"}
    enc = str(subj.get("encodedList") or "")
    try:
        if not enc.startswith("u"):
            raise ValueError("encodedList is not multibase base64url")
        bits = gzip.decompress(base64.urlsafe_b64decode(enc[1:] + "=" * (-len(enc[1:]) % 4)))
        if len(bits) * 8 < MIN_BITS:
            raise ValueError("status list below the 131,072-entry minimum")
        bit = (bits[idx >> 3] >> (7 - (idx & 7))) & 1
    except Exception as e:  # noqa: BLE001
        return {"state": "UNCHECKABLE", "reason": f"encodedList: {e}"}
    return {"state": "REVOKED" if bit else "NOT_REVOKED", "index": idx, "list": url, "list_proof": "VALID"}


def verify(doc: dict, *, did_src: str = DEFAULT_DID, status_src: str | None = None) -> dict:
    r: dict = {"tool": "csoai-completion-record-verify/0.1", "record_id": doc.get("id")}
    r["shape"] = schema_check(doc)
    try:
        pub = resolve_key(doc, did_src)
        verdict, why = verify_proof(doc, pub)
    except Exception as e:  # noqa: BLE001
        verdict, why = "UNCHECKABLE", f"key: {e}"
    r["proof"] = {"state": verdict, "detail": why, "issuer": issuer_id(doc),
                  "verificationMethod": (doc.get("proof") or {}).get("verificationMethod")}
    ev = (doc.get("evidence") or [{}])[0] or {}
    pub_h, rep_h = ev.get("publishedResultSha256"), ev.get("reproducedResultSha256")
    r["completion"] = {"state": "REPRODUCED" if pub_h and pub_h == rep_h else "NOT_REPRODUCED",
                       "measurementRef": ev.get("measurementRef"), "published": pub_h, "reproduced": rep_h}
    extra = sorted(set((doc.get("credentialSubject") or {}).keys()) - {"id", "type", "achievement"})
    r["subject"] = {"state": "PSEUDONYMOUS" if not extra else "IDENTIFYING_FIELDS_PRESENT",
                    "id": (doc.get("credentialSubject") or {}).get("id"), "extra_fields": extra}
    r["status"] = status_check(doc, status_src, did_src)
    r["test"] = bool((doc.get("csoaiRecord") or {}).get("test"))
    r["not_established"] = ("A VALID record says the issuer key signed these bytes and the subject's result hash equalled "
                            "the published result hash. It does not certify competence or conformity, and it is not an "
                            "endorsement of the subject or of any system.")
    return r


def exit_code(r: dict, allow_test: bool) -> int:
    if r["proof"]["state"] == "INVALID" or r["shape"]["state"] == "INVALID":
        return 1
    if r["completion"]["state"] != "REPRODUCED" or r["subject"]["state"] != "PSEUDONYMOUS":
        return 1
    if r["status"]["state"] in ("REVOKED", "INVALID"):
        return 1
    if r["proof"]["state"] != "VALID" or r["status"]["state"] != "NOT_REVOKED" or r["shape"]["state"] != "VALID":
        return 2
    if r["test"] and not allow_test:
        return 3
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Verify a csoai.completion-record/0.1 (OB 3.0 / VC 2.0, eddsa-jcs-2022).")
    ap.add_argument("record", help="record file or https URL")
    ap.add_argument("--did", default=DEFAULT_DID, help="DID document for did:web:csoai.org issuers")
    ap.add_argument("--status-list", help="status list credential file/URL (default: the URL the record names)")
    ap.add_argument("--allow-test", action="store_true", help="exit 0 for a VALID TEST record")
    ap.add_argument("--tamper-control", action="store_true", help="also verify a copy with one evidence byte changed; it must be INVALID")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    try:
        doc = json.loads(fetch(a.record))
    except Exception as e:  # noqa: BLE001
        print(f"record unreadable: {type(e).__name__}", file=sys.stderr)
        return 2
    r = verify(doc, did_src=a.did, status_src=a.status_list)
    code = exit_code(r, a.allow_test)
    if a.tamper_control:
        t = copy.deepcopy(doc)
        t["evidence"][0]["reproductionMethod"] = t["evidence"][0].get("reproductionMethod", "") + " "
        tr = verify(t, did_src=a.did, status_src=a.status_list)
        r["tamper_control"] = {"state": "DETECTED" if tr["proof"]["state"] == "INVALID" else "NOT_DETECTED",
                               "tampered_proof": tr["proof"]["state"]}
        if r["tamper_control"]["state"] != "DETECTED":
            code = 1
    r["exit_code"] = code
    if a.json:
        print(json.dumps(r, indent=1))
    else:
        print(f"record      {r['record_id']}{'  [TEST]' if r['test'] else ''}")
        print(f"shape       {r['shape']['state']}")
        print(f"proof       {r['proof']['state']}  ({r['proof']['detail']}; issuer {r['proof']['issuer']})")
        print(f"completion  {r['completion']['state']}")
        print(f"subject     {r['subject']['state']}")
        print(f"status      {r['status']['state']}")
        if "tamper_control" in r:
            print(f"tamper      {r['tamper_control']['state']}")
        print(f"exit        {code}")
    return code


if __name__ == "__main__":
    sys.exit(main())
