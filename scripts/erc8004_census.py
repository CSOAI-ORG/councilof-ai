#!/usr/bin/env python3
"""Fail-closed ERC-8004 Identity Registry event census.

The reader counts public ``Registered(uint256,string,address)`` events on
Ethereum, Base, and BSC. It proves chain identity with ``eth_chainId`` and
pins every observation to a ``finalized`` or ``safe`` block number *and hash*.
It never falls back to ``latest``. A no-bytecode observation is returned as
``NO_DEPLOYMENT_FOUND`` only after every configured endpoint has been tried,
identified as the expected chain, reached a finality-tagged block, and reported
no bytecode there. Any mixed/error state is ``UNCHECKABLE``.

The output measures registry events only. Registration is not evidence of an
agent's quality, safety, ownership, activity, or endorsement.

EMPTY RESULT IS NOT ABSENCE — measured incident 2026-09-12: rpc.flashbots.net
passed chain-id, finality-pin, getCode, and every log-shape check while
silently returning 8 events for a range that a receipt-verified, archive-
complete endpoint (Tenderly public gateway) proves contains 50,783. A node
with a partially pruned log index answers `[]` without error. The counter
against this class is the KNOWN-EVENT INTEGRITY ANCHOR below: a
receipt-verified (block, tx) pair per chain; before an endpoint's scan is
trusted it must return that exact event in that exact block when the block
is inside the scan range. flashbots fails the anchor on full-history scans
and is demoted, not deleted — the incident is documented in its comment.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from datetime import datetime, timezone
from typing import Optional

UA = "csoai-erc8004-census/2 (+https://councilof.ai)"
IDENTITY_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"

CHAINS = [
    {"chain": "ethereum", "chain_id": 1,
     # Tenderly public gateway: proven archive-complete (returned the anchor event
     # flashbots missed; 50,783 events full-history, 2026-09-12). 1k-block chunks.
     # flashbots: SILENTLY INCOMPLETE historical log index — measured 2026-09-12
     # (8 of 50,783 events; receipt-verified anchor event absent from its answers).
     # Retained only for windows where the integrity anchor can check it.
     "rpcs": ["https://gateway.tenderly.co/public/mainnet", "https://rpc.flashbots.net"],
     "floor_block": 24_339_000, "baseline": 25_000},
    {"chain": "base", "chain_id": 8453,
     "rpcs": ["https://base.gateway.tenderly.co", "https://mainnet.base.org"],
     "floor_block": 41_663_700, "baseline": 17_000},
    {"chain": "bsc", "chain_id": 56,
     # 48.club serves only the last ~984k blocks (pruning boundary measured
     # 2026-09-12); deep history returns "header not found". BSC full history
     # remains UNCHECKABLE permissionlessly: publicnode 403s getLogs, the
     # dataseed family refuses even 500-block ranges. Path: BscScan-family key
     # or an own archive node (owner decision).
     "rpcs": ["https://rpc-bsc.48.club", "https://bsc-rpc.publicnode.com"],
     "floor_block": 79_027_200, "baseline": 5_000},
]

REGISTERED_TOPIC = "ca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a"

# Known-event integrity anchors: receipt-verified (block, tx) pairs, one per
# chain, each confirmed via eth_getTransactionReceipt 2026-09-12 (status=1, a
# Registered log at the registry address in that exact block). An endpoint
# that cannot return the anchor event when its block is inside the scan range
# has a silently-incomplete index and is never trusted for that scan.
KNOWN_EVENTS = {
    "ethereum": {"block": 25_883_771,
                 "tx": "0x335580236be755ca8a81d4f2b475ff92a13d5e847324af844fff86b3fbf1f88b"},
    "base": {"block": 51_210_127,
             "tx": "0xb691ea1d0d9896484bd22bbb4d6deb4f60a1024a772792cc5e259e76d4f6f0db"},
    "bsc": {"block": 121_474_133,
            "tx": "0xf6b252be793676c3e1b2210f4a25ad0b654c10fd38b43ad246f96b08ca58ebb3"},
}


def registered_topic() -> str:
    """Pinned keccak256("Registered(uint256,string,address)") topic0.

    Keeping the primary-source-derived constant removes a runtime crypto
    package from this read-only reader. Tests bind the exact value and RPC logs
    are rejected unless their topic0 matches it byte-for-byte.
    """
    if len(REGISTERED_TOPIC) != 64:
        raise SystemExit("Registered topic constant malformed — refusing to scan")
    bytes.fromhex(REGISTERED_TOPIC)
    return REGISTERED_TOPIC


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


def _finality_block(rpc: str, expected_chain_id: int) -> dict:
    observed_chain_id = _quantity(rpc_call(rpc, "eth_chainId", []), "eth_chainId")
    if observed_chain_id != expected_chain_id:
        raise ValueError(
            f"eth_chainId mismatch: expected {expected_chain_id}, got {observed_chain_id}"
        )
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
            bytes.fromhex(block_hash[2:])
            return {"tag": tag, "number": number, "hash": block_hash.lower()}
        except Exception as exc:
            errors.append(f"{tag}: {type(exc).__name__} {str(exc)[:100]}")
    raise RuntimeError("no finalized/safe block: " + " | ".join(errors))


def _probe_endpoint(rpc: str, chain: dict) -> dict:
    finality = _finality_block(rpc, chain["chain_id"])
    code = rpc_call(rpc, "eth_getCode", [IDENTITY_REGISTRY, hex(finality["number"])])
    if not isinstance(code, str) or not code.startswith("0x"):
        raise ValueError("eth_getCode result is malformed")
    return {
        "rpc": rpc, "chain_id": chain["chain_id"], "finality": finality,
        "code_present": code not in ("0x", "0x0", ""),
    }


def _same_pinned_block(rpc: str, chain_id: int, pinned: dict) -> None:
    got_chain = _quantity(rpc_call(rpc, "eth_chainId", []), "eth_chainId")
    if got_chain != chain_id:
        raise ValueError(f"wrong chain: expected {chain_id}, got {got_chain}")
    block = rpc_call(rpc, "eth_getBlockByNumber", [hex(pinned["number"]), False])
    if not isinstance(block, dict) or (block.get("hash") or "").lower() != pinned["hash"]:
        raise ValueError("endpoint cannot reproduce the pinned block hash")
    code = rpc_call(rpc, "eth_getCode", [IDENTITY_REGISTRY, hex(pinned["number"])])
    if code in ("0x", "0x0", ""):
        raise ValueError("registry bytecode absent at the pinned block")


def _validated_logs(logs, topic0: str, start: int, end: int) -> int:
    if not isinstance(logs, list):
        raise ValueError("eth_getLogs result is not a list")
    for event in logs:
        if not isinstance(event, dict):
            raise ValueError("log entry is not an object")
        if (event.get("address") or "").lower() != IDENTITY_REGISTRY.lower():
            raise ValueError("log address differs from the registry")
        topics = event.get("topics")
        if not isinstance(topics, list) or not topics or topics[0].lower() != "0x" + topic0:
            raise ValueError("log topic0 differs from Registered")
        number = _quantity(event.get("blockNumber"), "log.blockNumber")
        if number < start or number > end:
            raise ValueError("RPC returned a log outside the requested block range")
    return len(logs)


def _integrity_anchor_check(rpc: str, chain_name: str, topic0: str,
                            start: int, stop: int) -> Optional[str]:
    """Known-event anchor: if the anchor block is inside [start, stop], the
    endpoint MUST return that exact event in that exact block. Returns None on
    pass, or a refusal reason. If the anchor is outside the scan range the
    check cannot run — that is reported by the caller, not hidden."""
    anchor = KNOWN_EVENTS.get(chain_name)
    if anchor is None:
        return None  # no anchor defined for this chain
    blk = anchor["block"]
    if not (start <= blk <= stop):
        return None
    logs = rpc_call(rpc, "eth_getLogs", [{
        "address": IDENTITY_REGISTRY, "topics": ["0x" + topic0],
        "fromBlock": hex(blk), "toBlock": hex(blk),
    }], timeout=45)
    for event in logs:
        if (event.get("transactionHash") or "").lower() == anchor["tx"].lower():
            return None
    return (f"integrity anchor failed: endpoint returned {len(logs)} Registered "
            f"events for known-event block {blk} but not receipt-verified tx "
            f"{anchor['tx'][:18]}… — index silently incomplete for this range")


def census_chain(chain: dict, topic0: str, as_of: str, delay: float = 0.05,
                 recent_blocks: Optional[int] = None) -> dict:
    row = {
        "chain": chain["chain"], "chain_id": chain["chain_id"],
        "contract": IDENTITY_REGISTRY, "from_block": chain["floor_block"],
        "to_block": None, "to_block_hash": None, "finality_tag": None,
        "registrations": None, "as_of": as_of,
        "method": (
            "eth_chainId; eth_getBlockByNumber(finalized then safe); block hash pin; "
            "eth_getCode at pinned block; chunked eth_getLogs over Registered topic0"
        ),
        "endpoint_probes": [],
    }
    successful_probes = []
    for rpc in chain["rpcs"]:
        try:
            probe = _probe_endpoint(rpc, chain)
            row["endpoint_probes"].append(probe)
            successful_probes.append(probe)
        except Exception as exc:
            row["endpoint_probes"].append({
                "rpc": rpc, "status": "UNCHECKABLE",
                "reason": f"{type(exc).__name__}: {str(exc)[:160]}",
            })

    deployments = [p for p in successful_probes if p["code_present"]]
    if not deployments:
        all_endpoints_no_code = (
            len(successful_probes) == len(chain["rpcs"])
            and all(not p["code_present"] for p in successful_probes)
        )
        if all_endpoints_no_code:
            return row | {
                "status": "NO_DEPLOYMENT_FOUND",
                "reason": "every configured endpoint matched eth_chainId, supplied finalized/safe identity, and reported no bytecode",
            }
        return row | {
            "status": "UNCHECKABLE",
            "reason": "no endpoint proved a deployment; at least one configured fallback was uncheckable, so absence is not claimed",
        }

    pinned = deployments[0]["finality"]
    row["to_block"] = pinned["number"]
    row["to_block_hash"] = pinned["hash"]
    row["finality_tag"] = pinned["tag"]
    start = chain["floor_block"]
    if recent_blocks is not None:
        if recent_blocks <= 0:
            return row | {"status": "UNCHECKABLE", "reason": "recent_blocks must be positive"}
        start = max(0, pinned["number"] - recent_blocks + 1)
        row["from_block"] = start
        row["window"] = {
            "mode": "RECENT-WINDOW", "recent_blocks": recent_blocks,
            "note": "not full history; count is bounded by the pinned finalized/safe block",
        }
    if start > pinned["number"]:
        return row | {"status": "UNCHECKABLE", "reason": "configured floor is above the pinned observation block"}

    total = 0
    cursor = start
    segments = []
    failures = []
    for rpc in chain["rpcs"]:
        try:
            _same_pinned_block(rpc, chain["chain_id"], pinned)
        except Exception as exc:
            failures.append(f"{rpc}: identity/pin refusal: {type(exc).__name__} {str(exc)[:100]}")
            continue
        try:
            refusal = _integrity_anchor_check(rpc, chain["chain"], topic0,
                                              start, pinned["number"])
        except Exception as exc:
            refusal = f"anchor check error: {type(exc).__name__} {str(exc)[:80]}"
        if refusal:
            failures.append(f"{rpc}: {refusal}")
            continue
        anchor = KNOWN_EVENTS.get(chain["chain"])
        if anchor and not (start <= anchor["block"] <= pinned["number"]):
            row["anchor_note"] = (
                "known-event anchor block is outside this scan range; endpoint "
                "completeness for this scan is UNVERIFIED (no silent-[] trap check)"
            )
        chunk = 10_000
        retries = 0
        segment_start = cursor
        try:
            while cursor <= pinned["number"]:
                end = min(cursor + chunk - 1, pinned["number"])
                try:
                    logs = rpc_call(rpc, "eth_getLogs", [{
                        "address": IDENTITY_REGISTRY,
                        "topics": ["0x" + topic0],
                        "fromBlock": hex(cursor), "toBlock": hex(end),
                    }], timeout=90)
                    total += _validated_logs(logs, topic0, cursor, end)
                    cursor = end + 1
                    retries = 0
                    if chunk < 10_000:
                        chunk = min(chunk * 2, 10_000)
                    if delay:
                        time.sleep(delay)
                except Exception:
                    if chunk > 500:
                        chunk //= 2
                        continue
                    retries += 1
                    if retries > 3:
                        raise
                    if delay:
                        time.sleep(max(delay, 0.05) * retries)
            segments.append({"rpc": rpc, "from_block": segment_start,
                             "to_block": pinned["number"]})
            break
        except Exception as exc:
            if cursor > segment_start:
                segments.append({"rpc": rpc, "from_block": segment_start,
                                 "to_block": cursor - 1})
            failures.append(f"{rpc}: scan stopped before {cursor}: {type(exc).__name__} {str(exc)[:100]}")

    row["rpc_segments"] = segments
    if cursor <= pinned["number"]:
        row["status"] = "UNCHECKABLE"
        row["reason"] = (
            f"all identity-checked endpoints exhausted at block {cursor - 1} of "
            f"pinned {pinned['number']}: " + " | ".join(failures)
        )
        if total:
            row["partial_registrations_below_failure"] = total
        return row
    row["registrations"] = total
    row["status"] = "MEASURED"
    return row


def with_baseline(row: dict, chain: dict) -> dict:
    base = chain["baseline"]
    if isinstance(row.get("registrations"), int) and "window" not in row:
        row["baseline_delta"] = {
            "baseline_2026_09_11_brief_approx": base,
            "observed_minus_baseline": row["registrations"] - base,
            "note": "baseline is approximate prior context, not a measurement by this tool",
        }
    else:
        row["baseline_delta"] = {
            "baseline_2026_09_11_brief_approx": base,
            "observed_minus_baseline": None,
            "note": "withheld because the row is a window, absence, or uncheckable",
        }
    return row


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--rpc", action="append", default=[])
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--delay", type=float, default=0.05)
    parser.add_argument("--recent-blocks", type=int)
    parser.add_argument("--floor", action="append", default=[])
    args = parser.parse_args()
    chains = [dict(c) for c in CHAINS]
    for override in args.floor:
        name, sep, value = override.partition("=")
        hit = next((c for c in chains if c["chain"] == name), None)
        if not sep or hit is None or not value.isdigit():
            parser.error("--floor must be ethereum=/base=/bsc=BLOCK")
        hit["floor_block"] = int(value)
    for override in args.rpc:
        name, sep, url = override.partition("=")
        hit = next((c for c in chains if c["chain"] == name), None)
        if not sep or hit is None or not url:
            parser.error("--rpc must be ethereum=/base=/bsc=URL")
        hit["rpcs"] = [url]

    topic0 = registered_topic()
    as_of = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = [with_baseline(census_chain(c, topic0, as_of, args.delay, args.recent_blocks), c)
            for c in chains]
    print(json.dumps({
        "kind": "csoai.erc8004-census/0.2", "as_of": as_of,
        "registered_topic0": "0x" + topic0,
        "scope": "public Registered-event counts only; never an agent verdict or certification",
        "rows": rows,
    }, indent=1, ensure_ascii=False))
    return 0 if all(r["status"] in ("MEASURED", "NO_DEPLOYMENT_FOUND") for r in rows) else 2


if __name__ == "__main__":
    raise SystemExit(main())

# ---------------------------------------------------------------------------
# CORRECTED LIVE MEASUREMENT (2026-09-12, tool v0.2 + integrity anchors).
# $ uv run python3 scripts/erc8004_census.py --delay 0.1
# ---------------------------------------------------------------------------
# {
#  "kind": "csoai.erc8004-census/0.2",
#  "as_of": "2026-09-12T16:31:57Z",
#  "registered_topic0": "0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a",
#  "scope": "public Registered-event counts only; never an agent verdict or certification",
#  "rows": [
#   {
#    "chain": "ethereum",
#    "chain_id": 1,
#    "contract": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
#    "from_block": 24339000,
#    "to_block": 25962471,
#    "to_block_hash": "0x4734c823202e78ab404af6131fa3aa3f89b839ae1a456f6553f31356a4b66ca6",
#    "finality_tag": "finalized",
#    "registrations": 50783,
#    "as_of": "2026-09-12T16:31:57Z",
#    "method": "eth_chainId; eth_getBlockByNumber(finalized then safe); block hash pin; eth_getCode at pinned block; chunked eth_getLogs over Registered topic0",
#    "endpoint_probes": [
#     {
#      "rpc": "https://gateway.tenderly.co/public/mainnet",
#      "chain_id": 1,
#      "finality": {
#       "tag": "finalized",
#       "number": 25962471,
#       "hash": "0x4734c823202e78ab404af6131fa3aa3f89b839ae1a456f6553f31356a4b66ca6"
#      },
#      "code_present": true
#     },
#     {
#      "rpc": "https://rpc.flashbots.net",
#      "chain_id": 1,
#      "finality": {
#       "tag": "finalized",
#       "number": 25962471,
#       "hash": "0x4734c823202e78ab404af6131fa3aa3f89b839ae1a456f6553f31356a4b66ca6"
#      },
#      "code_present": true
#     }
#    ],
#    "rpc_segments": [
#     {
#      "rpc": "https://gateway.tenderly.co/public/mainnet",
#      "from_block": 24339000,
#      "to_block": 25962471
#     }
#    ],
#    "status": "MEASURED",
#    "baseline_delta": {
#     "baseline_2026_09_11_brief_approx": 25000,
#     "observed_minus_baseline": 25783,
#     "note": "baseline is approximate prior context, not a measurement by this tool"
#    }
#   },
#   {
#    "chain": "base",
#    "chain_id": 8453,
#    "contract": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
#    "from_block": 41663700,
#    "to_block": 51220190,
#    "to_block_hash": "0xbf7aa7e572251d1212da0c49a43a5f743e98d09b74c80de0b07fa36c8cc0df67",
#    "finality_tag": "finalized",
#    "registrations": 86263,
#    "as_of": "2026-09-12T16:31:57Z",
#    "method": "eth_chainId; eth_getBlockByNumber(finalized then safe); block hash pin; eth_getCode at pinned block; chunked eth_getLogs over Registered topic0",
#    "endpoint_probes": [
#     {
#      "rpc": "https://base.gateway.tenderly.co",
#      "chain_id": 8453,
#      "finality": {
#       "tag": "finalized",
#       "number": 51220190,
#       "hash": "0xbf7aa7e572251d1212da0c49a43a5f743e98d09b74c80de0b07fa36c8cc0df67"
#      },
#      "code_present": true
#     },
#     {
#      "rpc": "https://mainnet.base.org",
#      "chain_id": 8453,
#      "finality": {
#       "tag": "finalized",
#       "number": 51220190,
#       "hash": "0xbf7aa7e572251d1212da0c49a43a5f743e98d09b74c80de0b07fa36c8cc0df67"
#      },
#      "code_present": true
#     }
#    ],
#    "rpc_segments": [
#     {
#      "rpc": "https://base.gateway.tenderly.co",
#      "from_block": 41663700,
#      "to_block": 51220190
#     }
#    ],
#    "status": "MEASURED",
#    "baseline_delta": {
#     "baseline_2026_09_11_brief_approx": 17000,
#     "observed_minus_baseline": 69263,
#     "note": "baseline is approximate prior context, not a measurement by this tool"
#    }
#   },
#   {
#    "chain": "bsc",
#    "chain_id": 56,
#    "contract": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
#    "from_block": 79027200,
#    "to_block": 121500166,
#    "to_block_hash": "0x08441cbc69f0e12e666860ef6a3b28c582590e3b89cf70519d105bb12dfba7a4",
#    "finality_tag": "finalized",
#    "registrations": null,
#    "as_of": "2026-09-12T16:31:57Z",
#    "method": "eth_chainId; eth_getBlockByNumber(finalized then safe); block hash pin; eth_getCode at pinned block; chunked eth_getLogs over Registered topic0",
#    "endpoint_probes": [
#     {
#      "rpc": "https://rpc-bsc.48.club",
#      "chain_id": 56,
#      "finality": {
#       "tag": "finalized",
#       "number": 121500166,
#       "hash": "0x08441cbc69f0e12e666860ef6a3b28c582590e3b89cf70519d105bb12dfba7a4"
#      },
#      "code_present": true
#     },
#     {
#      "rpc": "https://bsc-rpc.publicnode.com",
#      "chain_id": 56,
#      "finality": {
#       "tag": "finalized",
#       "number": 121500167,
#       "hash": "0x628a986028d075e770c52a1c4bca0e0f19487cd4d7c705af0377eb245b552e65"
#      },
#      "code_present": true
#     }
#    ],
#    "rpc_segments": [],
#    "status": "UNCHECKABLE",
#    "reason": "all identity-checked endpoints exhausted at block 79027199 of pinned 121500166: https://rpc-bsc.48.club: scan stopped before 79027200: RuntimeError eth_getLogs RPC error -32000: header not found | https://bsc-rpc.publicnode.com: anchor check error: HTTPError HTTP Error 403: Forbidden",
#    "baseline_delta": {
#     "baseline_2026_09_11_brief_approx": 5000,
#     "observed_minus_baseline": null,
#     "note": "withheld because the row is a window, absence, or uncheckable"
#    }
#   }
#  ]
# }
#
# Provenance reconciliation (registry singleton 0x8004A169...9a432):
#   - Etherscan: ERC1967Proxy, contract creation at ETH block 24,339,871.
#   - First Registered event measured at ETH block 24,339,925 — 54 blocks after
#     creation; the singleton's history is continuous from deployment.
#   - ETH 50,783 vs the 2026-09-11 brief's ~25k baseline: baseline is stale or
#     refers to earlier/non-singleton registries; the count above is the
#     canonical singleton, anchor-checked.
#   - Base: 86,263 (Tenderly, anchor-checked) reproduces 86,149 measured six
#     hours earlier via mainnet.base.org — two independent providers agree.
#   - BSC: full history UNCHECKABLE permissionlessly (see CHAINS comment);
#     recent-window mode measured 175 registrations in 50k blocks (48.club).
#   - Anchor txs (public receipts): ETH 0x335580236be7…f1f88b @ 25,883,771;
#     Base 0xb691ea1d0d98…d4f6f0db @ 51,210,127; BSC 0xf6b252be7936…a58ebb3 @ 121,474,133.
