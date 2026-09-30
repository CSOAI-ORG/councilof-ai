#!/usr/bin/env python3
# SPDX-License-Identifier: CC0-1.0
"""sign-charter.py — sign the published charter bytes and timestamp them. OWNER-GATED.

HELD (2026-09-28): signing the charter under did:web:csoai.org#board-attestation-1 with the pod
caller token is an owner decision. This script is ready; it does nothing outward unless run with
--execute AND --owner-approval AND CSOAI_CHARTER_SIGN_APPROVED=1 in the environment.

What --execute does, in order, stopping at the first failure:
  1. Reads public/.well-known/constitutional-harness.json and requires its sha256 to equal the
     newest entry of public/.well-known/charter-amendments.json (and --expect-sha256 if given).
  2. Builds a compact envelope (the board signer caps payloads at 3 KB, and the charter is
     ~11.8 KB, so the envelope binds the bytes by sha256 rather than carrying them):
       {schema: csoai.charter-attestation/0.1, did, charter: {url, version, issued_at, sha256, bytes}, as_of}
  3. POST /api/board-sign {payload: envelope} with the pod caller token read from --token-file.
     The token is never printed, logged or written.
  4. Verifies the returned Ed25519 signature over canonical(envelope) against the key published
     in the DID document BEFORE writing anything.
  5. Writes public/.well-known/constitutional-harness.json.sig (detached attestation, JSON).
  6. Submits sha256(charter bytes) to the OpenTimestamps calendars and writes
     public/.well-known/constitutional-harness.json.ots (a PENDING proof; upgrade later).
  7. APPENDS one entry to charter-amendments.json (change SIGNATURE_ADDED). Entry 0 is never edited.

JWS. A compact JWS signs ASCII(b64url(header) + "." + b64url(payload)). /api/board-sign only signs
canonical JSON objects, so it cannot produce one; --jws exits 3 with that reason instead of
emitting something JWS-shaped that no JOSE library would verify. It needs a signing-input mode
on the board signer (owner / signing lane).

Canonical form (same as functions/_lib/cardSign.ts canonicalBytes):
  json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()

  python3 scripts/charter/sign-charter.py                   # dry run: prints the envelope and its sha256
  CSOAI_CHARTER_SIGN_APPROVED=1 python3 scripts/charter/sign-charter.py --execute \
      --owner-approval "Nick, <date>, <channel>" --token-file <path>
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
WK = REPO / "public" / ".well-known"
CHARTER = WK / "constitutional-harness.json"
LOG = WK / "charter-amendments.json"
SIG = WK / "constitutional-harness.json.sig"
OTS = WK / "constitutional-harness.json.ots"
DID = "did:web:csoai.org#board-attestation-1"
SIGN_URL = "https://councilof.ai/api/board-sign"
DID_DOC = "https://csoai.org/.well-known/did.json"
CHARTER_URL = "https://councilof.ai/.well-known/constitutional-harness.json"
CALENDARS = ["https://a.pool.opentimestamps.org", "https://b.pool.opentimestamps.org",
             "https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org"]
UA = "csoai-sign-charter/0.1"


def canon(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def envelope(raw: bytes, charter: dict, as_of: str) -> dict:
    return {
        "schema": "csoai.charter-attestation/0.1",
        "did": DID,
        "charter": {"url": CHARTER_URL, "version": charter["version"], "issued_at": charter["issued_at"],
                    "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)},
        "as_of": as_of,
    }


def board_key() -> bytes:
    req = urllib.request.Request(DID_DOC, headers={"User-Agent": UA})
    doc = json.loads(urllib.request.urlopen(req, timeout=30).read())
    for vm in doc.get("verificationMethod") or []:
        if str(vm.get("id", "")).endswith("#board-attestation-1"):
            x = vm["publicKeyJwk"]["x"]
            return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
    raise SystemExit("DID document has no #board-attestation-1")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--execute", action="store_true")
    ap.add_argument("--owner-approval", default="")
    ap.add_argument("--token-file", default="")
    ap.add_argument("--expect-sha256", default="")
    ap.add_argument("--jws", action="store_true")
    a = ap.parse_args(argv)

    if a.jws:
        print("BLOCKED: /api/board-sign signs canonical JSON objects only; a compact JWS needs the signer to sign "
              "the JWS signing input. Owner/signing-lane change required.", file=sys.stderr)
        return 3

    raw = CHARTER.read_bytes()
    charter = json.loads(raw)
    log = json.loads(LOG.read_text(encoding="utf-8"))
    head = log["entries"][-1]
    digest = hashlib.sha256(raw).hexdigest()
    if digest != head["sha256"] or (a.expect_sha256 and digest != a.expect_sha256):
        print(f"REFUSED: charter sha256 {digest} != amendment-log head {head['sha256']}"
              + (f" / expected {a.expect_sha256}" if a.expect_sha256 else ""), file=sys.stderr)
        return 1
    if SIG.exists():
        print(f"REFUSED: {SIG.relative_to(REPO)} already exists; a signature is appended once per version", file=sys.stderr)
        return 1
    env = envelope(raw, charter, now())
    body = canon(env)
    if len(body) > 3072:
        print("REFUSED: envelope exceeds the board signer's 3 KB cap", file=sys.stderr)
        return 1
    print(json.dumps({"mode": "EXECUTE" if a.execute else "DRY_RUN", "envelope": env,
                      "envelope_canonical_sha256": hashlib.sha256(body).hexdigest(), "signer": SIGN_URL,
                      "writes": [str(p.relative_to(REPO)) for p in (SIG, OTS, LOG)]}, indent=1))
    if not a.execute:
        return 0

    if os.environ.get("CSOAI_CHARTER_SIGN_APPROVED") != "1" or not a.owner_approval.strip():
        print("HELD: --execute needs --owner-approval \"<who, when, where>\" and CSOAI_CHARTER_SIGN_APPROVED=1", file=sys.stderr)
        return 3
    if not a.token_file:
        print("--token-file is required (the pod caller token; it is read, never printed)", file=sys.stderr)
        return 2
    token = Path(a.token_file).read_text(encoding="utf-8").strip()
    req = urllib.request.Request(SIGN_URL, data=json.dumps({"payload": env}).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "User-Agent": UA})
    del token
    try:
        resp = json.loads(urllib.request.urlopen(req, timeout=60).read())
    except Exception as e:  # noqa: BLE001 — never echo the request, it carries the token
        print(f"board-sign failed: {type(e).__name__}", file=sys.stderr)
        return 2
    sig_hex = str(resp.get("sig_ed25519") or "")
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    try:
        Ed25519PublicKey.from_public_bytes(board_key()).verify(bytes.fromhex(sig_hex), body)
    except Exception:  # noqa: BLE001
        print("REFUSED: returned signature does not verify under #board-attestation-1; nothing written", file=sys.stderr)
        return 1
    if resp.get("payload_sha256") != hashlib.sha256(body).hexdigest():
        print("REFUSED: signer hashed different bytes; nothing written", file=sys.stderr)
        return 1

    SIG.write_text(json.dumps({
        "schema": "csoai.detached-attestation/0.1",
        "envelope": env,
        "sig_ed25519": sig_hex,
        "did": DID,
        "signed_at": resp.get("signed_at"),
        "signer_auth": resp.get("signer_auth"),
        "verify": "Ed25519 over json.dumps(envelope, sort_keys=True, separators=(',',':'), ensure_ascii=False) under "
                  "the #board-attestation-1 key in https://csoai.org/.well-known/did.json; then sha256(charter bytes) "
                  "must equal envelope.charter.sha256.",
        "not_established": "A signature says the key holder attested these bytes on this date. It is not legislation, "
                           "certification or regulatory approval, and it grants no authority.",
    }, indent=1) + "\n", encoding="utf-8")

    ots_state = {"state": "NONE"}
    try:
        from opentimestamps.calendar import RemoteCalendar
        from opentimestamps.core.op import OpSHA256
        from opentimestamps.core.serialize import BytesSerializationContext
        from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp
        d = hashlib.sha256(raw).digest()
        ts, got = Timestamp(d), []
        for url in CALENDARS:
            try:
                ts.merge(RemoteCalendar(url).submit(d, timeout=20))
                got.append(url)
            except Exception:  # noqa: BLE001
                pass
        if got:
            ctx = BytesSerializationContext()
            DetachedTimestampFile(OpSHA256(), ts).serialize(ctx)
            OTS.write_bytes(ctx.getbytes())
            ots_state = {"state": "PENDING", "url": CHARTER_URL + ".ots", "calendars": len(got),
                         "note": "Submitted to OpenTimestamps calendars; not yet upgraded to a Bitcoin attestation."}
    except ImportError:
        ots_state = {"state": "NONE", "note": "opentimestamps library not installed; stamp not taken"}

    log["entries"].append({
        "seq": len(log["entries"]),
        "version": charter["version"],
        "issued_at": env["as_of"],
        "sha256": digest,
        "bytes": len(raw),
        "url": CHARTER_URL,
        "snapshot_url": head.get("snapshot_url"),
        "change": "SIGNATURE_ADDED",
        "changed_articles": "none; same bytes as entry %d" % head["seq"],
        "signature": {"state": "SIGNED", "url": CHARTER_URL + ".sig", "did": DID,
                      "envelope_canonical_sha256": hashlib.sha256(body).hexdigest(), "owner_approval": a.owner_approval.strip()},
        "timestamp": ots_state,
        "publication": head.get("publication"),
    })
    LOG.write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"signed": True, "sig": str(SIG.relative_to(REPO)), "ots": ots_state["state"],
                      "log_entries": len(log["entries"])}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
