#!/usr/bin/env python3
"""Read-only settlement ledger reconciler for the estate's x402 payTo (TUI-4 lane).

Two independent views of the same rail are measured and then RECONCILED, never
merged:

  * ON-CHAIN — every USDC ``Transfer(address,address,uint256)`` event whose
    recipient is the estate payTo on Base (chain 8453), read with chunked
    ``eth_getLogs`` from an ordered endpoint list. The scan is bounded
    [FLOOR_BLOCK, pinned finalized block]; the floor and its justification are
    part of the output, and anything below the floor is UNSCANNED, not absent.
  * OFF-CHAIN — GET /api/revenue, the estate's own KV-backed count of
    facilitator-confirmed settlements.

The two are EXPECTED to be able to differ, legitimately: a facilitator-settled
KV row can exist whose fulfilment later failed; a raw Transfer can arrive that
never went through the gateway at all. Disagreement is therefore REPORTED per
field (AGREE / DISAGREE / UNVERIFIABLE), never silently reconciled.

Anchor discipline (copied from scripts/erc8004_census.py): an endpoint is
trusted for this scan only after it reproduces a receipt-verified KNOWN
settlement event — the 2026-09-11 self-settlement recorded in
``public/interop/x402-self-settlement-2026-09-11.json`` (read at runtime; the
script does not re-type the hash). If the anchor transaction cannot be
confirmed in the returned logs, the scan is marked UNRELIABLE in the output —
loudly, never dropped.

Classification is evidence, not revenue: a sender in the KNOWN_INTERNAL set
(the payTo itself, wallets named in functions/api/_x402.ts, and wallets that
committed test artifacts identify as estate-controlled) is SELF_TEST; a
zero-amount transfer is ZERO_VALUE (a settlement of zero is not a purchase);
anything else non-zero is an OUTSIDE_CANDIDATE — a candidate, because an
on-chain transfer alone cannot prove it came through the gateway as a paying
customer.

This script holds no keys, signs nothing, and sends no transactions.
Standard library only.
"""
from __future__ import annotations

import hashlib
import json
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "settlement-ledger-latest.json"
UA = "csoai-tui4-settlement-ledger/1 (+https://councilof.ai)"

CHAIN_ID = 8453
USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
PAY_TO = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"
RPCS = ["https://base.gateway.tenderly.co", "https://mainnet.base.org"]
REVENUE_URL = "https://councilof.ai/api/revenue"
ANCHOR_FILE = REPO / "public/interop/x402-self-settlement-2026-09-11.json"
TUI6_GAP_FILE = REPO / "docs/tui6/base-settlement-evidence-2026-09-11.json"

# The first settlement the estate has documented (docs/product/SETTLED-DOORS
# -2026-09-06.md) sits at block 50,942,514 (2026-09-06). The scan floor is set
# below it with margin. Blocks below the floor are UNSCANNED and the output
# says so; nothing is claimed about them.
FLOOR_BLOCK = 50_900_000

# keccak256("Transfer(address,address,uint256)") — pinned constant, checked at
# runtime like the census pins its topic0, so a corrupted constant refuses the
# scan rather than silently counting the wrong event.
TRANSFER_TOPIC = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

# Evidence classification, not secret material: wallets that committed test
# artifacts identify as estate-controlled. Sources:
#   0x6ea0…43c6 — functions/api/_x402.ts KNOWN_INTERNAL_X402_WALLETS
#   0x4dB7…02B7 — docs/product/SETTLED-DOORS-2026-09-06.md ("self, throwaway")
#   0xdf61…3910 — the payer wallet for the owner-gated live-settlement test
#                 (holds 0 USDC; funding is an owner decision)
#   payTo itself — the 2026-09-11 anchor was payTo → payTo (self-settlement)
KNOWN_INTERNAL = {
    PAY_TO.lower(),
    "0x6ea00613c15f2463bc10c7188215c4fa6f4943c6",
    "0x4db7aafbe797a39cd6cc4e7aa64d970f7f6e02b7",
    "0xdf6144dbb0b7f5b52279b8ba781cfc1bd3ec3910",
}


def transfer_topic() -> str:
    if len(TRANSFER_TOPIC) != 64:
        raise SystemExit("Transfer topic constant malformed — refusing to scan")
    bytes.fromhex(TRANSFER_TOPIC)
    return TRANSFER_TOPIC


def rpc_call(rpc: str, method: str, params: list, timeout: int = 60):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    request = urllib.request.Request(
        rpc, data=body, method="POST",
        headers={"Content-Type": "application/json", "User-Agent": UA},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        result = json.loads(response.read())
    if "error" in result:
        error = result["error"]
        raise RuntimeError(f"{method} RPC error {error.get('code')}: {error.get('message')}")
    if "result" not in result:
        raise RuntimeError(f"{method} response omits result")
    return result["result"]


def _quantity(value, label: str) -> int:
    if not isinstance(value, str) or not value.startswith("0x"):
        raise ValueError(f"{label} is not a hex quantity")
    return int(value, 16)


def _finality_block(rpc: str) -> dict:
    observed = _quantity(rpc_call(rpc, "eth_chainId", []), "eth_chainId")
    if observed != CHAIN_ID:
        raise ValueError(f"eth_chainId mismatch: expected {CHAIN_ID}, got {observed}")
    errors = []
    for tag in ("finalized", "safe"):
        try:
            block = rpc_call(rpc, "eth_getBlockByNumber", [tag, False])
            if not isinstance(block, dict):
                raise ValueError(f"{tag} returned no block")
            number = _quantity(block.get("number"), f"{tag}.number")
            block_hash = block.get("hash")
            if not isinstance(block_hash, str) or len(block_hash) != 66:
                raise ValueError(f"{tag}.hash is not 32-byte hex")
            return {"tag": tag, "number": number, "hash": block_hash.lower()}
        except Exception as exc:
            errors.append(f"{tag}: {type(exc).__name__} {str(exc)[:100]}")
    raise RuntimeError("no finalized/safe block: " + " | ".join(errors))


def _topic_address(topic: str) -> str:
    return "0x" + topic[-40:].lower()


def _validated_transfer_logs(logs, start: int, end: int) -> list[dict]:
    """Reject anything that is not exactly a USDC Transfer to payTo inside the
    requested range. A malformed answer fails the scan; it is never trimmed
    into looking valid."""
    if not isinstance(logs, list):
        raise ValueError("eth_getLogs result is not a list")
    out = []
    for event in logs:
        if not isinstance(event, dict):
            raise ValueError("log entry is not an object")
        if (event.get("address") or "").lower() != USDC.lower():
            raise ValueError("log address differs from the USDC contract")
        topics = event.get("topics")
        if not isinstance(topics, list) or len(topics) != 3:
            raise ValueError("Transfer log does not carry exactly 3 topics")
        if topics[0].lower() != "0x" + TRANSFER_TOPIC:
            raise ValueError("log topic0 differs from Transfer")
        if _topic_address(topics[2]) != PAY_TO.lower():
            raise ValueError("log recipient differs from payTo")
        number = _quantity(event.get("blockNumber"), "log.blockNumber")
        if number < start or number > end:
            raise ValueError("RPC returned a log outside the requested block range")
        out.append({
            "tx": event.get("transactionHash"),
            "block": number,
            "from": _topic_address(topics[1]),
            "to": _topic_address(topics[2]),
            "amount_atomic": str(int(event.get("data", "0x0"), 16)),
        })
    return out


def _logs_for_range(rpc: str, start: int, end: int, timeout: int = 90) -> list[dict]:
    logs = rpc_call(rpc, "eth_getLogs", [{
        "address": USDC,
        "topics": ["0x" + transfer_topic(), None,
                   "0x" + "0" * 24 + PAY_TO[2:].lower()],
        "fromBlock": hex(start), "toBlock": hex(end),
    }], timeout=timeout)
    return _validated_transfer_logs(logs, start, end)


def _anchor_check(rpc: str, anchor: dict) -> str | None:
    """Receipt-verify the known settlement tx, then require the endpoint's log
    index to reproduce it. Returns None on pass, else a refusal reason."""
    tx, blk = anchor["tx"], anchor["block"]
    receipt = rpc_call(rpc, "eth_getTransactionReceipt", [tx], timeout=45)
    if not isinstance(receipt, dict):
        return f"anchor tx {tx[:18]}… has no receipt at this endpoint"
    if receipt.get("status") != "0x1":
        return f"anchor tx {tx[:18]}… receipt status is not 0x1"
    if _quantity(receipt.get("blockNumber"), "receipt.blockNumber") != blk:
        return f"anchor tx block mismatch: receipt not in documented block {blk}"
    seen = False
    for log in receipt.get("logs") or []:
        topics = log.get("topics") or []
        if ((log.get("address") or "").lower() == USDC.lower() and len(topics) == 3
                and topics[0].lower() == "0x" + TRANSFER_TOPIC
                and _topic_address(topics[2]) == PAY_TO.lower()):
            seen = True
    if not seen:
        return f"anchor tx receipt carries no USDC Transfer to payTo"
    logs = _logs_for_range(rpc, blk, blk, timeout=45)
    if any(e["tx"] and e["tx"].lower() == tx.lower() for e in logs):
        return None
    return (f"integrity anchor failed: endpoint returned {len(logs)} matching "
            f"Transfers for known-settlement block {blk} but not "
            f"receipt-verified tx {tx[:18]}… — index silently incomplete")


def scan_onchain(anchor: dict, as_of: str) -> dict:
    row = {
        "chain": "base", "chain_id": CHAIN_ID, "contract": USDC, "pay_to": PAY_TO,
        "from_block": FLOOR_BLOCK, "to_block": None, "to_block_hash": None,
        "finality_tag": None, "as_of": as_of,
        "window_note": (
            f"bounded scan from block {FLOOR_BLOCK} (below the first documented "
            "settlement at 50,942,514 with margin). Blocks below the floor are "
            "UNSCANNED; no claim is made about them."
        ),
        "anchor": anchor, "endpoint_probes": [], "events": [],
    }
    pinned = None
    endpoint_errors = []
    for rpc in RPCS:
        try:
            finality = _finality_block(rpc)
            refusal = _anchor_check(rpc, anchor)
            probe = {"rpc": rpc, "finality": finality,
                     "anchor": "PASS" if refusal is None else f"REFUSED: {refusal}"}
            row["endpoint_probes"].append(probe)
            if refusal is None:
                pinned = finality
                break
        except Exception as exc:
            endpoint_errors.append(f"{rpc}: {type(exc).__name__} {str(exc)[:160]}")
            row["endpoint_probes"].append(
                {"rpc": rpc, "status": "UNCHECKABLE",
                 "reason": f"{type(exc).__name__}: {str(exc)[:160]}"})
    if pinned is None:
        row["status"] = "UNRELIABLE"
        row["reason"] = ("no endpoint both identified as Base and reproduced the "
                         "anchor settlement: " + " | ".join(endpoint_errors or
                         [p.get("anchor", "?") for p in row["endpoint_probes"]]))
        return row

    row["to_block"] = pinned["number"]
    row["to_block_hash"] = pinned["hash"]
    row["finality_tag"] = pinned["tag"]
    rpc = next(p["rpc"] for p in row["endpoint_probes"] if p.get("anchor") == "PASS")

    events: list[dict] = []
    cursor = FLOOR_BLOCK
    chunk = 2_000
    retries = 0
    try:
        while cursor <= pinned["number"]:
            end = min(cursor + chunk - 1, pinned["number"])
            try:
                events.extend(_logs_for_range(rpc, cursor, end))
                cursor = end + 1
                retries = 0
                if chunk < 2_000:
                    chunk = min(chunk * 2, 2_000)
                time.sleep(0.05)
            except Exception:
                if chunk > 1_000:
                    chunk //= 2
                    continue
                retries += 1
                if retries > 3:
                    raise
                time.sleep(0.2 * retries)
    except Exception as exc:
        row["status"] = "UNRELIABLE"
        row["reason"] = (f"scan stopped before block {cursor} of pinned "
                         f"{pinned['number']}: {type(exc).__name__} {str(exc)[:160]}")
        if events:
            row["partial_events_below_failure"] = events
        return row

    # Anchor must be inside the scan result, not just the endpoint's answers.
    if not any(e["tx"] and e["tx"].lower() == anchor["tx"].lower() for e in events):
        row["status"] = "UNRELIABLE"
        row["reason"] = ("the anchor settlement tx is absent from the completed "
                         "scan — the index is silently incomplete for this range")
        row["partial_events_below_failure"] = events
        return row

    row["events"] = events
    row["status"] = "MEASURED"
    return row


def classify(events: list[dict]) -> tuple[list[dict], dict]:
    rows, self_atomic, outside_atomic = [], 0, 0
    outside_payers, zero_value = set(), 0
    for e in events:
        amount = int(e["amount_atomic"])
        if e["from"] in KNOWN_INTERNAL:
            cls = "SELF_TEST"
            self_atomic += amount
        elif amount == 0:
            cls = "ZERO_VALUE"
            zero_value += 1
        else:
            cls = "OUTSIDE_CANDIDATE"
            outside_atomic += amount
            outside_payers.add(e["from"])
        rows.append({"tx": e["tx"], "block": e["block"], "from": e["from"],
                     "amount_atomic": e["amount_atomic"], "class": cls})
    return rows, {
        "self_atomic": self_atomic,
        "outside_atomic": outside_atomic,
        "outside_distinct_payers": len(outside_payers),
        "zero_value_transfers": zero_value,
        "total_events": len(events),
    }


def fetch_revenue() -> dict:
    request = urllib.request.Request(REVENUE_URL, headers={"User-Agent": UA,
                                                           "accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read()
            doc = json.loads(body)
    except Exception as exc:
        return {"status": "UNCHECKABLE", "url": REVENUE_URL,
                "error": f"{type(exc).__name__}: {str(exc)[:200]}"}
    one = doc.get("one_number") or {}
    settled = doc.get("settled_usdc") or {}
    return {
        "status": "OK", "url": REVENUE_URL, "payload_sha256": hashlib.sha256(body).hexdigest(),
        "one_number": {k: one.get(k) for k in (
            "status", "all_time", "last_30d", "settlements", "self_settlements",
            "settled_usdc_atomic", "zero_value_settlements")},
        "settled_usdc_count": settled.get("count"),
    }


def reconcile(onchain: dict, revenue: dict) -> dict:
    """Per-field verdicts. KV-settlement rows (facilitator-confirmed, non-self,
    non-zero) and raw Transfer events can legitimately differ — a settle whose
    fulfilment failed, or a transfer that never touched the gateway — so
    DISAGREE is a report, not an accusation, and nothing is silently adjusted."""
    def verdict(field: str, chain_value, api_value) -> dict:
        if onchain.get("status") != "MEASURED":
            return {"field": field, "verdict": "UNVERIFIABLE",
                    "chain_value": None, "api_value": api_value,
                    "why": "on-chain scan is UNRELIABLE"}
        if revenue.get("status") != "OK" or (revenue.get("one_number") or {}).get("status") != "MEASURED":
            return {"field": field, "verdict": "UNVERIFIABLE",
                    "chain_value": chain_value, "api_value": api_value,
                    "why": "/api/revenue is not MEASURED"}
        agree = chain_value == api_value
        return {"field": field,
                "verdict": "AGREE" if agree else "DISAGREE",
                "chain_value": chain_value, "api_value": api_value,
                "why": None if agree else (
                    "raw Transfer events and facilitator-settled KV rows can "
                    "legitimately differ (fulfilment failure after settle, or a "
                    "transfer not via the gateway); reported, never reconciled silently")}

    totals = onchain.get("totals") or {}
    one = revenue.get("one_number") or {}
    return {
        "settled_usdc_atomic": verdict("settled_usdc_atomic",
                                       totals.get("outside_atomic"),
                                       one.get("settled_usdc_atomic")),
        "distinct_nonself_payers": verdict("distinct_nonself_payers",
                                           totals.get("outside_distinct_payers"),
                                           one.get("all_time")),
    }


def main() -> int:
    as_of = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        anchor_doc = json.loads(ANCHOR_FILE.read_text())
        anchor = {"tx": anchor_doc["settlement"]["transaction"],
                  "block": anchor_doc["settlement"]["block"],
                  "source": "public/interop/x402-self-settlement-2026-09-11.json"}
    except Exception as exc:
        anchor = None
        anchor_error = f"{type(exc).__name__}: {str(exc)[:200]}"

    if anchor is None:
        onchain = {"status": "UNRELIABLE",
                   "reason": f"anchor file unreadable: {anchor_error} — no scan is "
                             "trusted without its known-settlement anchor"}
        totals = {}
        rows = []
    else:
        onchain = scan_onchain(anchor, as_of)
        rows, totals = classify(onchain.get("events") or [])
        onchain["totals"] = totals

    revenue = fetch_revenue()
    reconciliation = reconcile(onchain, revenue)

    outside_rows = [r for r in rows if r["class"] == "OUTSIDE_CANDIDATE"]
    out = {
        "kind": "csoai.tui4-settlement-ledger/0.1",
        "as_of": as_of,
        "scope": ("read-only reconciliation of raw USDC Transfers to the estate payTo "
                  "against /api/revenue KV settlements; no keys, no transactions; "
                  "SELF_TEST is never revenue; disagreement is reported, never reconciled"),
        "onchain": {k: v for k, v in onchain.items() if k != "events"},
        "rows": rows,
        "offchain_revenue": revenue,
        "reconciliation": reconciliation,
    }
    # The TUI-6 lane recorded the outside-settlement tx hash as NOT_EXTRACTABLE
    # on 2026-09-11 (Basescan V1 deprecated, Blockscout 422). A raw-log scan
    # needs no explorer: any outside non-zero transfer found here extracts it.
    if outside_rows:
        out["tui6_gap_resolution"] = {
            "gap_file": "docs/tui6/base-settlement-evidence-2026-09-11.json",
            "recorded_as": "NOT_EXTRACTABLE — Basescan V1 deprecated, Blockscout 422",
            "extracted_transactions": [
                {"tx": r["tx"], "block": r["block"], "from": r["from"],
                 "amount_atomic": r["amount_atomic"]} for r in outside_rows],
        }
    elif TUI6_GAP_FILE.exists():
        out["tui6_gap_resolution"] = {
            "gap_file": "docs/tui6/base-settlement-evidence-2026-09-11.json",
            "note": "no outside non-zero transfer found in this scan window; the "
                    "tx hash the TUI-6 lane could not extract does not appear as a "
                    "USDC Transfer to payTo on Base within the scanned range",
        }
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"TUI-4 settlement ledger @ {as_of}")
    print(f"  on-chain scan : {onchain.get('status')} "
          f"[{onchain.get('from_block')} → {onchain.get('to_block')}] "
          f"events={len(rows)}")
    for r in rows:
        print(f"    {r['class']:<18} {r['amount_atomic']:>10} atomic  {r['tx']}")
    print(f"  totals        : {totals}")
    print(f"  /api/revenue  : {revenue.get('status')} "
          f"one_number={revenue.get('one_number')}")
    for name, rec in reconciliation.items():
        print(f"  reconcile {name:<26}: {rec['verdict']} "
              f"(chain={rec['chain_value']} api={rec['api_value']})")
    print(f"  → {OUT}")
    return 0 if onchain.get("status") == "MEASURED" else 2


if __name__ == "__main__":
    raise SystemExit(main())
