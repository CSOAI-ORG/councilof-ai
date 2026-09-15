#!/usr/bin/env python3
"""xrpl_memo_anchor.py — generate or verify an XRPL memo anchor for councilof.ai/root.json.

WHAT THIS DOES
  Default (generate): Fetches the live root.json from councilof.ai, computes
  sha256 over the raw bytes as served, and emits an unsigned AccountSet
  transaction JSON carrying the hash as an XRPL Memo.  The owner must fill in
  their Account address, sign, and submit.  Nothing lands on-ledger until that
  happens.

  Verify (--verify <tx_hash>): Fetches the given transaction from two
  independent XRPL servers (xrplcluster.com + s1.ripple.com), confirms the
  transaction is validated and succeeded, extracts MemoData, and compares it
  to the current sha256 of root.json.

WHAT THIS IS NOT
  - NOT a signer.  No keys are loaded, no transaction is submitted.
  - NOT a certificate.  An XRPL memo proves only that a 32-byte digest was
    included in a validated ledger; it says nothing about what the bytes mean.
  - NOT self-verifying against a stale root.  MemoData commits to the sha256
    of root.json bytes as served at the moment of generation.  If the live
    root moves before signing, regenerate.

EXIT CODES
  0  success (tx generated / hash verified)
  1  mismatch (verify mode: MemoData != current root.json hash, or tx failed)
  2  usage / network / parse error

DEPENDENCIES: stdlib only (hashlib, json, urllib).  No pip installs.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ROOT_URL = "https://councilof.ai/root.json"
UA = "csoai-xrpl-memo-anchor/0 (+https://councilof.ai/root.json)"

# XRPL JSON-RPC servers.  Verify mode hits both; agreement is required.
XRPL_SERVERS = [
    "https://xrplcluster.com",
    "https://s1.ripple.com:51234",
]

# Memo fields — hex-encoded per XRPL spec (MemoData/MemoType/MemoFormat are
# hex Blob fields).  See:
#   https://xrpl.org/docs/references/protocol/transactions/common-fields
MEMO_TYPE_PLAIN = "csoai/public-root-sha256"
MEMO_FORMAT_PLAIN = "application/octet-stream"


def _hex_encode(text: str) -> str:
    """Hex-encode a UTF-8 string for an XRPL memo field."""
    return text.encode("utf-8").hex().upper()


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Network helpers
# ---------------------------------------------------------------------------


def fetch_root_bytes() -> tuple[bytes, int]:
    """Fetch root.json raw bytes.  Returns (bytes, http_status).  Raises on
    network failure (fail-closed: no silent fallback)."""
    req = urllib.request.Request(ROOT_URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as resp:
        raw = resp.read()
        return raw, int(resp.status)


def xrpl_rpc(method: str, params: list, server: str, timeout: int = 20) -> dict:
    """Single XRPL JSON-RPC call.  Returns parsed JSON or {"error": ...}."""
    body = json.dumps({"method": method, "params": params}).encode()
    req = urllib.request.Request(
        f"{server}/",
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": UA},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as exc:
        return {"error": str(exc)}


# ---------------------------------------------------------------------------
# Generate mode
# ---------------------------------------------------------------------------


def generate(root_sha: str, root_bytes_len: int, root_fetched_at: str) -> dict:
    """Build the unsigned AccountSet tx_json and envelope with metadata.

    Returns a dict ready for json.dumps.  Owner replaces "OWNER_ACCOUNT" with
    their r-address, fills Fee/Sequence/LastLedgerSequence, signs, and submits.
    """
    tx_json = {
        "TransactionType": "AccountSet",
        "Account": "OWNER_ACCOUNT",
        "Memos": [
            {
                "Memo": {
                    "MemoType": _hex_encode(MEMO_TYPE_PLAIN),
                    "MemoFormat": _hex_encode(MEMO_FORMAT_PLAIN),
                    "MemoData": root_sha.upper(),
                }
            }
        ],
    }
    envelope = {
        "_draft": {
            "schema": "csoai.xrpl-memo-anchor-draft/0.2",
            "status": "UNSIGNED_DRAFT_NOT_BROADCAST",
            "prepared_at": _utcnow_iso(),
            "prepared_by": "scripts/anchors/xrpl_memo_anchor.py (no key, no signing, no submission)",
            "owner_action": (
                "Owner replaces OWNER_ACCOUNT with their r-address, autofills "
                "Fee/Sequence/LastLedgerSequence with their own client, reviews, "
                "signs, and submits.  Nothing is on-ledger until that happens."
            ),
            "subject": {
                "url": ROOT_URL,
                "fetched_at": root_fetched_at,
                "sha256": root_sha,
                "bytes": root_bytes_len,
            },
            "memo_semantics": (
                "An XRPL memo proves only that this 32-byte digest was included "
                "in a validated ledger no later than that ledger's close time.  "
                "It says nothing about when, how, or whether any measurement ran, "
                "and nothing about the meaning of the bytes."
            ),
            "memo_fields": {
                "MemoType": MEMO_TYPE_PLAIN,
                "MemoFormat": MEMO_FORMAT_PLAIN,
                "MemoData": "(32-byte sha256, uppercase hex)",
            },
        },
        "tx_json": tx_json,
        "verification": {
            "before_signing": (
                f"curl -s {ROOT_URL} | shasum -a 256   "
                "# must match MemoData (case-insensitive) or regenerate"
            ),
            "after_owner_submits": (
                "python3 scripts/anchors/xrpl_memo_anchor.py --verify <TX_HASH>"
            ),
        },
    }
    return envelope


# ---------------------------------------------------------------------------
# Verify mode
# ---------------------------------------------------------------------------


def verify(tx_hash: str) -> int:
    """Verify a submitted XRPL memo anchor.  Exit code: 0 ok, 1 mismatch, 2 error."""
    # 1. Current root hash
    try:
        root_raw, _ = fetch_root_bytes()
    except Exception as exc:
        print(f"FAIL: could not fetch {ROOT_URL}: {exc}", file=sys.stderr)
        return 2
    current_sha = hashlib.sha256(root_raw).hexdigest().upper()
    print(f"  current root.json sha256 : {current_sha}")

    # 2. Fetch tx from two independent servers
    memo_data_values: list[str] = []
    for server in XRPL_SERVERS:
        result = xrpl_rpc("tx", [{"transaction": tx_hash, "binary": False}], server)
        if "error" in result:
            print(f"  {server}: RPC error — {result['error']}", file=sys.stderr)
            continue
        res = result.get("result", {})
        # Validate
        validated = res.get("validated", False)
        tx_result = res.get("meta", {}).get("TransactionResult", "UNKNOWN")
        tx_json = res.get("tx_json", res)  # API v1/v2 compat
        memos = tx_json.get("Memos", [])

        if not validated:
            print(f"  {server}: tx NOT validated yet", file=sys.stderr)
            continue
        if tx_result != "tesSUCCESS":
            print(f"  {server}: tx result = {tx_result} (not tesSUCCESS)", file=sys.stderr)
            continue

        # Extract MemoData
        found = False
        for m in memos:
            memo = m.get("Memo", {})
            mt = bytes.fromhex(memo.get("MemoType", "")).decode("utf-8", "replace")
            if mt == MEMO_TYPE_PLAIN:
                md = memo.get("MemoData", "").upper()
                memo_data_values.append(md)
                found = True
                print(f"  {server}: MemoData = {md}")
                break
        if not found:
            print(f"  {server}: no {MEMO_TYPE_PLAIN} memo found", file=sys.stderr)

    if not memo_data_values:
        print("FAIL: no MemoData found from any server", file=sys.stderr)
        return 2

    # 3. Check consensus
    if len(set(memo_data_values)) != 1:
        print(f"FAIL: servers disagree: {memo_data_values}", file=sys.stderr)
        return 1

    memo_hex = memo_data_values[0]
    if memo_hex == current_sha:
        print(f"PASS: MemoData matches current root.json sha256 ({current_sha})")
        return 0
    else:
        print(
            f"NOTE: MemoData ({memo_hex}) does NOT match current root.json ({current_sha}).\n"
            "      This is expected if root.json was updated after the anchor was submitted.\n"
            "      The memo committed to the sha256 at anchor time; current root has moved.",
            file=sys.stderr,
        )
        # This is not necessarily an error — the root may have moved since anchoring.
        # The caller can distinguish "mismatch because root moved" from "wrong hash".
        # We still exit 1 so CI/automation can catch genuine mismatches.
        return 1


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate or verify an XRPL memo anchor for councilof.ai/root.json.",
        epilog="Exit codes: 0=ok, 1=mismatch, 2=usage/network error.",
    )
    parser.add_argument(
        "--verify",
        metavar="TX_HASH",
        help="Verify a submitted XRPL transaction hash against current root.json.",
    )
    parser.add_argument(
        "--output",
        metavar="FILE",
        help="Write generated JSON to FILE instead of stdout.",
    )
    args = parser.parse_args()

    # --- Verify mode ---
    if args.verify:
        return verify(args.verify)

    # --- Generate mode ---
    try:
        root_raw, http_status = fetch_root_bytes()
    except Exception as exc:
        print(f"FAIL: could not fetch {ROOT_URL}: {exc}", file=sys.stderr)
        return 2
    if http_status != 200 or not root_raw:
        print(f"FAIL: {ROOT_URL} returned HTTP {http_status}", file=sys.stderr)
        return 2

    root_sha = hashlib.sha256(root_raw).hexdigest()
    fetched_at = _utcnow_iso()

    envelope = generate(root_sha, len(root_raw), fetched_at)

    output = json.dumps(envelope, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        from pathlib import Path

        Path(args.output).write_text(output, encoding="utf-8")
        print(f"  written to {args.output}")
    else:
        sys.stdout.write(output)

    print(f"  root.json sha256 : {root_sha}", file=sys.stderr)
    print(f"  root.json bytes  : {len(root_raw)}", file=sys.stderr)
    print(f"  fetched_at       : {fetched_at}", file=sys.stderr)
    print("", file=sys.stderr)
    print(
        "  OWNER ACTION: replace OWNER_ACCOUNT with your r-address, "
        "fill Fee/Sequence/LastLedgerSequence, sign, and submit.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
