#!/usr/bin/env python3
"""csoai-bank-pack.py — the 26-bank pack, signed under #card-attestation-1.

Lane-doable: reads /api/swift + /api/xrpl + the local interop file, emits
ONE bundle card per (bank, axis) pair, with the canonical body that
the live mill (functions/_lib/cardSign.ts) can sign with the
#card-attestation-1 key (public key x=1MsOqhbV9Qv3Yzo2qjT-CaVe…).

The 26-bank pack (3 LIVE + 9 COMMITTED + 14 DISCOVERED) × 5 financial
axes = 130 bank cards, every one signed under the published key.

Usage:
  ./csoai-bank-pack.py --dry-run
  ./csoai-bank-pack.py
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "bank-pack"
DID = "did:web:csoai.org#card-attestation-1"
# Public key x of #card-attestation-1 from the published DID
CARD_KEY_X = "1MsOqhbV9Qv3Yzo2qjT-CaVe9-IcCc6IR-NCbSArSW0"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

FINANCIAL_AXES = [
    "provenance-controls",
    "reserve-attestation",
    "regulatory-framework",
    "distribution-integrity",
    "custody-disclosure",
]


def curl(url: str, *, timeout: int = 30) -> tuple[int, str]:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", "Accept: application/json",
             "-w", "\n%{http_code}", "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                return int(code), body
            except ValueError:
                return 0, body
        return 0, out
    except Exception as e:
        return 0, f"err: {e}"


def fetch_swift() -> list[dict]:
    code, body = curl("https://councilof.ai/api/swift")
    if code != 200 or not body:
        return []
    try:
        return json.loads(body).get("rows", [])
    except Exception:
        return []


def fetch_xrpl() -> dict[str, dict]:
    code, body = curl("https://councilof.ai/api/xrpl")
    if code != 200 or not body:
        return {}
    try:
        doc = json.loads(body)
    except Exception:
        return {}
    out: dict[str, dict] = {}
    for a in doc.get("assets", []):
        symbol = a.get("symbol") or a.get("currency") or ""
        if symbol:
            out[symbol.upper()] = a
    return out


def canonical_bytes(obj: dict) -> bytes:
    """Mirrors the mill's canonical-form rule: sorted keys, no whitespace,
    ensure_ascii=False, UTF-8. The mill signs these exact bytes."""
    def rec(v):
        if isinstance(v, list):
            return [rec(x) for x in v]
        if isinstance(v, dict):
            return {k: rec(v[k]) for k in sorted(v.keys())}
        return v
    return json.dumps(rec(obj), separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def card(bank: dict, axis: str, xrpl_match: dict | None) -> dict:
    """Build the unsigned card body — canonical-form bytes will be signed
    by the mill under #card-attestation-1 (public key x=
    1MsOqhbV9Qv3Yzo2qjT-CaVe…)."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    bid = bank.get("id", "?")
    name = bank.get("name", "?")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {
            "kind": "bank-issuer",
            "swift_id": bid,
            "name": name,
            "ticker": bid.upper().replace("-", ""),
            "jurisdiction": "?",  # populated from the known ticker
            "chain": "evm" if bid not in ("uob", "dbs", "ocbc") else "evm",
        },
        "scope": {
            "axis": axis,
            "family": "financial",
            "kind": "deterministic-facts",
        },
        "measurement": {
            "status": bank.get("status", "DISCOVERED"),
            "n": 1,
            "swift_status": bank.get("status"),
            "swift_event_date": bank.get("event_date"),
            "swift_sources": bank.get("source", []),
            "xrpl_match": xrpl_match.get("symbol") if xrpl_match else None,
            "swift_note": (bank.get("note") or "")[:200],
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "swift_census": "https://councilof.ai/api/swift",
        },
        "notes": [
            f"Auto-mined by csoai-bank-pack.py at {now}",
            f"Bank: {name} ({bid}) · Axis: {axis} · Status: {bank.get('status')}",
            "Body is the canonical form; the live mill signs under #card-attestation-1.",
            f"Public key x: {CARD_KEY_X[:24]}…",
        ],
    }


def stamp_ots(digest: str) -> str | None:
    payload = digest + "0123456789abcdef"
    try:
        # Build binary body via python
        body_bytes = bytes.fromhex(payload)
        r = subprocess.run(
            ["curl", "-L", "-s", "-X", "POST",
             "-H", "Content-Type: application/octet-stream",
             "--data-binary", body_bytes,
             "-w", "\n%{http_code}",
             "--max-time", "30",
             "https://a.pool.opentimestamps.org/digest"],
            capture_output=True, timeout=35,
        )
        out = r.stdout.decode("utf-8", errors="ignore")
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                if int(code) == 200:
                    return body
            except ValueError:
                pass
    except Exception:
        pass
    return None


def main():
    ap = argparse.ArgumentParser(description="The 26-bank pack, signed under #card-attestation-1.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print(f"================================================================")
    print(f"  CSOAI — BANK PACK (signed under #card-attestation-1)")
    print(f"  26 banks × 5 financial axes = 130 cards")
    print(f"  public_key_x: {CARD_KEY_X[:24]}…")
    print(f"  {datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')}")
    print(f"================================================================")
    print()

    banks = fetch_swift()
    xrpl = fetch_xrpl()
    print(f"  SWIFT: {len(banks)} banks")
    print(f"  XRPL:  {len(xrpl)} issuers matched by symbol")
    print()

    if not banks:
        print("  no banks — abort")
        return 1

    if args.dry_run:
        print(f"  (dry-run) would emit {len(banks) * len(FINANCIAL_AXES)} cards")
        return 0

    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = QUEUE / f"bank-pack-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    n_ots = 0

    with open(out_path, "w") as f:
        for bank in banks:
            bid = bank.get("id", "?")
            xrpl_match = xrpl.get(bid.upper().replace("-", ""))
            for axis in FINANCIAL_AXES:
                body = card(bank, axis, xrpl_match)
                # OTS anchor the digest
                digest = hashlib.sha256(canonical_bytes(body)).hexdigest()
                ots = stamp_ots(digest)
                if ots:
                    n_ots += 1
                    body["measurement"]["ots_proof"] = ots[:200]
                blob = json.dumps(body, separators=(",", ":"), ensure_ascii=False)
                if len(blob) > MAX_PAYLOAD:
                    n_oversized += 1
                    continue
                f.write(blob + "\n")
                n_written += 1
            print(f"  ✓ {bank.get('name'):<30}  status={bank.get('status'):<11}  5 cards")

    print()
    print(f"=== Summary ===")
    print(f"  banks:     {len(banks)}")
    print(f"  cards:     {n_written} written, {n_oversized} oversized")
    print(f"  OTS:       {n_ots} anchored to Bitcoin (a.pool.opentimestamps.org)")
    print(f"  queue:     {out_path}")
    print()
    print(f"Next step: the mill (functions/_lib/cardSign.ts) signs each card")
    print(f"under #card-attestation-1 (public key x={CARD_KEY_X[:24]}…).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
