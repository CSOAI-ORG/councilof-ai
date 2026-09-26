#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""Prepare (never submit) the public-log anchors for one signed measurement-capsule index.

    measurement_anchor_prepare.py rekor --index INDEX.json --out X.rekor-submission.PREPARED.json
    measurement_anchor_prepare.py xrpl  --index INDEX.json --out X.xrpl-memo.unsigned.json [--fee-drops 12]

Both read only local bytes: the index, its .signed.json sidecar, and the pinned board key below.
Nothing is sent anywhere. Creating a public log entry (Rekor) or an on-ledger memo (XRPL) is the
OWNER's act; each output names the one command the owner runs and how anyone verifies it after.

rekor: the SAME method as scripts/witness_public_root.py for the public root — a `rekord` entry
       (x509 PEM public key) over the exact Ed25519 preimage the board signed. The estate uses
       `rekord`, not `hashedrekord`, because hashedrekord does not accept a pure-Ed25519 signature
       over the message (see witness_public_root.py). The preimage is the canonical signed payload,
       which pins the index sha256 and the index root.
xrpl:  the SAME shape as scripts/anchors/xrpl_memo_anchor.py — an unsigned AccountSet from
       OWNER_ACCOUNT carrying 32-byte digests as Memos (MemoType/MemoFormat hex, MemoData the digest
       in uppercase hex): the index root and the sha256 of the index bytes. Fee in drops is stated;
       Sequence and LastLedgerSequence are left to the owner's client.
"""
import argparse, base64, hashlib, json, pathlib, sys, time

BOARD_DID = "did:web:csoai.org#board-attestation-1"
# Pinned in functions/_lib/cardVerify.ts PINNED_ANCHORS; cross-check against https://csoai.org/.well-known/did.json.
BOARD_PUB_HEX = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170"
REKOR = "https://rekor.sigstore.dev"


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha(b):
    return hashlib.sha256(b).hexdigest()


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def load(index_path):
    ip = pathlib.Path(index_path)
    raw = ip.read_bytes()
    idx = json.loads(raw)
    sp = ip.with_name(ip.stem + ".signed.json")
    s = json.loads(sp.read_text())
    payload, sig = s["payload"], s["signature"]
    pre = canon(payload)
    checks = {
        "payload_sha256_matches": sha(pre) == sig["payload_sha256"],
        "payload_pins_index_bytes": payload["artifact"]["sha256"] == sha(raw),
        "payload_index_root_matches_index": payload.get("index_root") == idx.get("index_root"),
        "signer_is_board_key": sig.get("did") == BOARD_DID,
    }
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.hazmat.primitives import serialization
    pk = Ed25519PublicKey.from_public_bytes(bytes.fromhex(BOARD_PUB_HEX))
    try:
        pk.verify(bytes.fromhex(sig["sig_ed25519"]), pre)
        checks["ed25519_verifies_under_pinned_board_key"] = True
    except Exception:
        checks["ed25519_verifies_under_pinned_board_key"] = False
    for name, alt in (("trailing byte", pre + b" "), ("index root altered", pre.replace(idx["index_root"].encode(), b"0" * 64))):
        try:
            pk.verify(bytes.fromhex(sig["sig_ed25519"]), alt)
            checks[f"control_{name}"] = "VERIFIED (CONTROL FAILED)"
        except Exception:
            checks[f"control_{name}"] = "rejected (control holds)"
    pem = pk.public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
    if not all(v is True for k, v in checks.items() if not k.startswith("control_")) or any("FAILED" in str(v) for v in checks.values()):
        sys.exit(f"REFUSED: local checks failed {checks}")
    return ip, raw, idx, sp, s, pre, pem, checks


def rekor(a):
    ip, raw, idx, sp, s, pre, pem, checks = load(a.index)
    body = {"apiVersion": "0.0.1", "kind": "rekord", "spec": {
        "data": {"content": base64.b64encode(pre).decode()},
        "signature": {"format": "x509", "content": base64.b64encode(bytes.fromhex(s["signature"]["sig_ed25519"])).decode(),
                      "publicKey": {"content": base64.b64encode(pem).decode()}}}}
    out = pathlib.Path(a.out)
    entry_out = str(out).replace(".rekor-submission.PREPARED.json", ".rekor-entry.json")
    doc = {
        "schema": "csoai.rekor-submission-prepared/0.1",
        "status": "PREPARED_NOT_SUBMITTED",
        "prepared_at": now(),
        "prepared_by": "scripts/measurement_anchor_prepare.py rekor (no key, no network, no submission)",
        "why_not_submitted": "A Rekor entry is a new public transparency-log entry; creating one is reserved for the owner.",
        "subject": {"index": str(ip), "index_sha256": sha(raw), "index_schema": idx.get("schema"), "index_root": idx.get("index_root"),
                    "n_capsules_total": idx.get("n_capsules_total"), "signed_sidecar": str(sp),
                    "signed_at": s["signature"].get("signed_at")},
        "method": "rekord (x509 PEM) over the exact Ed25519 preimage the board signed — same as scripts/witness_public_root.py rekor_upload(); "
                  "hashedrekord is not used because it does not accept a pure-Ed25519 signature over the message",
        "preimage": {"what": "canonical JSON of the signed payload (sort_keys, separators , :, UTF-8)", "sha256": sha(pre), "bytes": len(pre),
                     "pins": {"index_sha256": s["payload"]["artifact"]["sha256"], "index_root": s["payload"].get("index_root")}},
        "public_key": {"did": BOARD_DID, "raw_hex": BOARD_PUB_HEX, "pem_sha256": sha(pem)},
        "local_checks": checks,
        "what_rekor_would_record": "the sha256 of the preimage, the signature and the public key, with an inclusion proof and integrated time. "
                                   "Rekor does not retain the preimage content for rekord entries; the index stays private until published.",
        "body": body,
        "owner_command": (f"python3 -c \"import json,sys;json.dump(json.load(open(sys.argv[1]))['body'],sys.stdout)\" {out} | "
                          f"curl -sS -X POST {REKOR}/api/v1/log/entries -H 'Content-Type: application/json' -H 'Accept: application/json' "
                          f"--data-binary @- | tee {entry_out}"),
        "after_submission_verify": [
            f"a 201 returns {{<uuid>: entry}}; a 409 means the same entry already exists (Location names it) — witness_public_root.py treats both as WITNESSED",
            f"curl -sS {REKOR}/api/v1/log/entries/<uuid> and check: body.spec.data.hash.value == {sha(pre)}",
            "and the entry's verification.inclusionProof / signedEntryTimestamp verify with rekor-cli verify --uuid <uuid>",
        ],
        "limits": "Rekor proves these bytes and this signature existed no later than the integrated time. It says nothing about what the capsules measured, and it is not a certification.",
    }
    out.write_text(json.dumps(doc, indent=1) + "\n")
    print(json.dumps({"out": str(out), "preimage_sha256": sha(pre), "checks": "all pass"}))


def xrpl(a):
    ip, raw, idx, sp, s, pre, pem, checks = load(a.index)
    hx = lambda t: t.encode().hex().upper()
    memos = [("csoai/measurement-capsule-index-root", idx["index_root"]),
             ("csoai/measurement-capsule-index-sha256", sha(raw))]
    tx = {"TransactionType": "AccountSet", "Account": "OWNER_ACCOUNT", "Fee": str(a.fee_drops),
          "Memos": [{"Memo": {"MemoType": hx(t), "MemoFormat": hx("application/octet-stream"), "MemoData": d.upper()}} for t, d in memos]}
    out = pathlib.Path(a.out)
    doc = {
        "_draft": {
            "schema": "csoai.xrpl-memo-anchor-draft/0.2",
            "status": "UNSIGNED_DRAFT_NOT_BROADCAST",
            "prepared_at": now(),
            "prepared_by": "scripts/measurement_anchor_prepare.py xrpl (no key, no signing, no submission)",
            "spec_followed": "scripts/anchors/xrpl_memo_anchor.py (AccountSet + hex Memo fields, MemoData = 32-byte sha256 uppercase hex)",
            "owner_action": "Replace OWNER_ACCOUNT with the owner's r-address; let the owner's own client autofill Sequence and "
                            "LastLedgerSequence; review; sign; submit. Nothing is on-ledger until then.",
            "fee": {"drops": a.fee_drops, "xrp": a.fee_drops / 1_000_000, "note": "reference base fee is 10 drops; 12 leaves headroom for load"},
            "subject": {"index": str(ip), "index_schema": idx.get("schema"), "index_sha256": sha(raw), "index_root": idx["index_root"],
                        "index_signed_payload_sha256": s["signature"]["payload_sha256"], "n_capsules_total": idx.get("n_capsules_total")},
            "memo_fields": [{"MemoType": t, "MemoFormat": "application/octet-stream", "MemoData": d} for t, d in memos],
            "local_checks": checks,
            "memo_semantics": "An XRPL memo proves only that these 32-byte digests were included in a validated ledger no later than that ledger's close time. It says nothing about what the capsules measured.",
            "verification_recipe": [
                "1. Recompute: sha256sum <index.json> == memo csoai/measurement-capsule-index-sha256; "
                "the reference verifier (capsule lane, `verify --file <index.json>`) recomputes index_root (RFC 6962 over every capsule id) == memo csoai/measurement-capsule-index-root.",
                "2. Fetch the transaction from two independent servers and require agreement: "
                "curl -s -X POST https://xrplcluster.com/ -d '{\"method\":\"tx\",\"params\":[{\"transaction\":\"<TX_HASH>\"}]}' and the same against https://s1.ripple.com:51234/.",
                "3. Require validated == true and meta.TransactionResult == tesSUCCESS; Account == the owner's published r-address.",
                "4. Hex-decode each Memo.MemoType; MemoData (uppercase hex) must equal the recomputed digests from step 1.",
                "5. The ledger close_time bounds WHEN; the board signature in the .signed.json sidecar bounds WHO. Neither is a grade.",
            ],
        },
        "tx_json": tx,
    }
    out.write_text(json.dumps(doc, indent=1) + "\n")
    print(json.dumps({"out": str(out), "memos": len(memos), "fee_drops": a.fee_drops}))


if __name__ == "__main__":
    p = argparse.ArgumentParser(); sp = p.add_subparsers(dest="cmd", required=True)
    r = sp.add_parser("rekor"); r.add_argument("--index", required=True); r.add_argument("--out", required=True)
    x = sp.add_parser("xrpl"); x.add_argument("--index", required=True); x.add_argument("--out", required=True)
    x.add_argument("--fee-drops", type=int, default=12)
    a = p.parse_args(); {"rekor": rekor, "xrpl": xrpl}[a.cmd](a)
