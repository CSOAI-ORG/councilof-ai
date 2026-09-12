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
     "rpcs": ["https://rpc.flashbots.net", "https://eth.drpc.org"],
     "floor_block": 24_339_000, "baseline": 25_000},
    {"chain": "base", "chain_id": 8453,
     "rpcs": ["https://mainnet.base.org", "https://base.gateway.tenderly.co"],
     "floor_block": 41_663_700, "baseline": 17_000},
    {"chain": "bsc", "chain_id": 56,
     "rpcs": ["https://rpc-bsc.48.club", "https://bsc-rpc.publicnode.com"],
     "floor_block": 79_027_200, "baseline": 5_000},
]

REGISTERED_TOPIC = "ca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a"


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
