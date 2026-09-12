#!/usr/bin/env python3
"""erc8004_census.py — count ERC-8004 ("Trustless Agents") Identity Registry registrations.

G4.6 of the TUI-4 "ROOTS & IDENTITY" V3 brief. Counts `Registered` events on
Ethereum mainnet, Base, and BSC via PUBLIC read-only JSON-RPC endpoints.
Measurement of a public counter, never certification; a registration count is
not a measurement of anything about the agents themselves.

Primary sources pinned (not guessed):

  * Registry addresses — official contract registry,
    github.com/erc-8004/erc-8004-contracts README ("Contract Addresses"):
    the Identity Registry singleton is 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
    on Ethereum mainnet, Base mainnet AND BSC mainnet (same CREATE2 vanity
    address). Matches the estate's own door file
    public/.well-known/erc-8004-registries.json (whose verification_state is
    honestly NOT_INDEPENDENTLY_VERIFIED — this script's eth_getCode probe is
    exactly the probe that file prescribes).
  * Event — EIP-8004 spec text (eips.ethereum.org/EIPS/eip-8004,
    "Registration" section): `event Registered(uint256 indexed agentId,
    string agentURI, address indexed owner)`. Topic0 =
    keccak256("Registered(uint256,string,address)"). The keccak
    implementation (pycryptodome) is sanity-pinned at runtime against the
    universally-known ERC-721 Transfer topic
    0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef;
    if that pin fails the script refuses to run rather than scan the wrong
    topic.
  * Deployment-floor blocks — arXiv:2606.26028v2 (empirical ERC-8004 study),
    Table 1 data-collection windows, start blocks chosen there to precede
    the earliest deployment: ETH 24,339,000 · BSC 79,027,200 ·
    Base 41,663,700. Used as scan floors (approximate, stated honestly).

Method: eth_getCode (deployment probe) then chunked eth_getLogs over the
Registered topic, floor block -> head. Public RPCs each enforce their own
limits (pinned empirically 2026-09-12: publicnode 403s eth_getLogs entirely;
drpc free plan caps a call at 10k blocks; mainnet.base.org at 2k;
bsc-dataseed rate-limits). The script therefore carries an ORDERED RPC LIST
per chain and walks it: chunks start at 10k and HALVE on any RPC error,
floor 500; if a chain's current RPC still fails at the floor the scan moves
to the next RPC, and the row records which endpoint actually served.
Registration count = number of matching log entries. A chain with no
bytecode at the address is NO_DEPLOYMENT_FOUND; total failure across every
endpoint is an honest UNCHECKABLE row — NEVER a 0.

Output: one JSON array of rows
  {chain, contract, from_block, to_block, registrations, method, rpc, as_of,
   baseline_delta}
with baseline_delta against the TUI-4 V3 brief's 2026-09-11 baselines
(Ethereum ~25k, Base ~17k, BSC ~5k — approximate figures from the brief, not
from this tool).

Run:  uv run --with pycryptodome python3 scripts/erc8004_census.py
      [--rpc ethereum=URL ...] [--json]

Live run (2026-09-12) is pasted at the bottom of this file.
"""
from __future__ import annotations

import argparse
import binascii
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

UA = "csoai-erc8004-census/1 (+https://councilof.ai)"
IDENTITY_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"

CHAINS = [
    {"chain": "ethereum", "chain_id": 1,
     # flashbots: getLogs whitelisted to 100k-block ranges (pinned 2026-09-12).
     # drpc free rejects getLogs on this contract even under its 10k "limit".
     "rpcs": ["https://rpc.flashbots.net", "https://eth.drpc.org"],
     "floor_block": 24_339_000, "baseline": 25_000},
    {"chain": "base", "chain_id": 8453,
     # mainnet.base.org: 2k-block range cap; tenderly: 1k cap. Halving finds it.
     "rpcs": ["https://mainnet.base.org", "https://base.gateway.tenderly.co"],
     "floor_block": 41_663_700, "baseline": 17_000},
    {"chain": "bsc", "chain_id": 56,
     # BSC public endpoints probed 2026-09-12: publicnode answers probes but 403s
     # getLogs; dataseed/defibit/ninicoin return "limit exceeded" even for 500-block
     # ranges; 48.club serves RECENT windows (22 events in the last 5k blocks) but
     # prunes deep history ("header not found" at 79M). Full-history BSC census is
     # UNCHECKABLE permissionlessly today — use --recent-blocks for an honest window,
     # or a free BscScan-family API key / own archive node (Nick's call).
     "rpcs": ["https://rpc-bsc.48.club", "https://bsc-rpc.publicnode.com"],
     "floor_block": 79_027_200, "baseline": 5_000},
]

ERC721_TRANSFER_TOPIC = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"


def registered_topic() -> str:
    """keccak256 of the EIP-8004 spec event string, with a runtime sanity pin."""
    from Crypto.Hash import keccak
    k = keccak.new(digest_bits=256)
    k.update(b"Transfer(address,address,uint256)")
    if k.hexdigest() != ERC721_TRANSFER_TOPIC:
        raise SystemExit("keccak sanity pin failed (ERC-721 Transfer topic mismatch) — refusing to scan")
    k = keccak.new(digest_bits=256)
    k.update(b"Registered(uint256,string,address)")
    return k.hexdigest()


def rpc_call(rpc: str, method: str, params: list, timeout: int = 60):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = urllib.request.Request(rpc, data=body, method="POST",
                                 headers={"Content-Type": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        out = json.loads(r.read())
    if "error" in out:
        raise RuntimeError(f"{method} RPC error {out['error'].get('code')}: {out['error'].get('message')}")
    return out["result"]


def census_chain(chain: dict, topic0: str, as_of: str, delay: float = 0.05,
                 recent_blocks: int | None = None) -> dict:
    row = {"chain": chain["chain"], "contract": IDENTITY_REGISTRY,
           "from_block": chain["floor_block"], "to_block": None, "registrations": None,
           "method": "eth_getCode deployment probe; chunked eth_getLogs over "
                     "Registered(uint256,string,address) topic0, floor->head; "
                     "ordered public-RPC fallback list, chunk halving on error",
           "rpc": None, "as_of": as_of}
    rpcs = chain["rpcs"]
    # Deployment probe + head: first endpoint that answers both.
    head = None
    probe_errors = []
    for rpc in rpcs:
        try:
            code = rpc_call(rpc, "eth_getCode", [IDENTITY_REGISTRY, "latest"])
            if code in ("0x", "0x0", ""):
                return row | {"status": "NO_DEPLOYMENT_FOUND", "rpc": rpc,
                              "reason": "no bytecode at the canonical Identity Registry address on this chain"}
            head = int(rpc_call(rpc, "eth_blockNumber", []), 16)
            break
        except Exception as exc:
            probe_errors.append(f"{rpc}: {type(exc).__name__} {str(exc)[:80]}")
    if head is None:
        return row | {"status": "UNCHECKABLE",
                      "reason": "deployment probe failed on every endpoint: " + " | ".join(probe_errors)}
    row["to_block"] = head
    if chain["floor_block"] is None:  # --recent-blocks window mode
        chain["floor_block"] = max(0, head - recent_blocks + 1)
        row["from_block"] = chain["floor_block"]
        row["window"] = {"mode": "RECENT-WINDOW", "recent_blocks": recent_blocks,
                         "note": "NOT full history — an honest window for chains where no "
                                 "public archive endpoint serves deep getLogs"}
    # Log scan: halve on error; at the chunk floor, back off and RETRY the same
    # endpoint (public rate limits are per-minute, not per-lifetime) before
    # moving to the next RPC, which RESUMES from the block already reached.
    import time
    total = 0
    start = chain["floor_block"]
    served_by = None
    for rpc in rpcs:
        chunk = 10_000  # halving finds each endpoint's real cap (flashbots 100k,
                        # mainnet.base.org 2k, tenderly 1k — all pinned 2026-09-12)
        retries = 0
        try:
            while start <= head:
                end = min(start + chunk - 1, head)
                try:
                    logs = rpc_call(rpc, "eth_getLogs", [{
                        "address": IDENTITY_REGISTRY,
                        "topics": ["0x" + topic0],
                        "fromBlock": hex(start), "toBlock": hex(end)}], timeout=90)
                    total += len(logs)
                    start = end + 1
                    served_by = rpc
                    retries = 0
                    if chunk < 10_000:
                        chunk = min(chunk * 2, 10_000)  # recover after a retry shrink
                    if delay:
                        time.sleep(delay)
                except Exception:
                    if chunk > 500:
                        chunk //= 2  # range/result cap: halve and retry
                        continue
                    retries += 1
                    if retries > 3:
                        raise  # this endpoint is done; resume on the next one
                    time.sleep(3 * retries)  # rate limit: back off, same endpoint
            break  # full range scanned on this endpoint
        except Exception:
            continue  # resume the range on the next endpoint
    if served_by is None or start <= head:
        row["status"] = "UNCHECKABLE"
        row["reason"] = f"eth_getLogs failed on every endpoint; scanned to block {start - 1} of {head}"
        if total:
            row["partial_registrations_below_failure"] = total
        return row
    row["registrations"] = total
    row["status"] = "MEASURED"
    row["rpc"] = served_by
    return row


def with_baseline(row: dict) -> dict:
    base = next(c["baseline"] for c in CHAINS if c["chain"] == row["chain"])
    if isinstance(row.get("registrations"), int) and "window" not in row:
        row["baseline_delta"] = {
            "baseline_2026_09_11_brief_approx": base,
            "observed_minus_baseline": row["registrations"] - base,
            "note": "baseline is the brief's approximate figure, not a measurement by this tool",
        }
    elif isinstance(row.get("registrations"), int):
        row["baseline_delta"] = {"baseline_2026_09_11_brief_approx": base,
                                 "observed_minus_baseline": None,
                                 "note": "recent-window count is NOT comparable to a full-history "
                                         "baseline — delta withheld on purpose"}
    else:
        row["baseline_delta"] = {"baseline_2026_09_11_brief_approx": base,
                                 "observed_minus_baseline": None,
                                 "note": "no observation — UNCHECKABLE never collapses to 0"}
    return row


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--rpc", action="append", default=[],
                    help="override an RPC, e.g. --rpc ethereum=https://...")
    ap.add_argument("--json", action="store_true", help="machine output only")
    ap.add_argument("--delay", type=float, default=0.05,
                    help="politeness delay between chunk calls (seconds); raise it if a "
                         "public endpoint rate-limits mid-scan")
    ap.add_argument("--recent-blocks", type=int, default=None,
                    help="WINDOW MODE: scan only [head-N, head] instead of full history. "
                         "Honest label for chains where no public archive endpoint exists; "
                         "the row's window field says exactly what was measured.")
    ap.add_argument("--floor", action="append", default=[],
                    help="override a floor block, e.g. --floor base=42600000 (resume)")
    args = ap.parse_args()
    chains = [dict(c) for c in CHAINS]
    for override in args.floor:
        name, _, blk = override.partition("=")
        hit = next((c for c in chains if c["chain"] == name), None)
        if not hit or not blk.isdigit():
            ap.error("--floor must be one of ethereum=/base=/bsc=BLOCK")
        hit["floor_block"] = int(blk)
    if args.recent_blocks:
        for c in chains:
            c["floor_block"] = None  # resolved to head-N inside census_chain
    for override in args.rpc:
        name, _, url = override.partition("=")
        hit = next((c for c in chains if c["chain"] == name), None)
        if not hit or not url:
            ap.error(f"--rpc must be one of {[c['chain'] for c in chains]}=URL")
        hit["rpcs"] = [url]  # an explicit override replaces the fallback list

    topic0 = registered_topic()
    as_of = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = [with_baseline(census_chain(c, topic0, as_of, delay=args.delay,
                                       recent_blocks=args.recent_blocks)) for c in chains]
    print(json.dumps({"kind": "csoai.erc8004-census/0.1", "as_of": as_of,
                      "registered_topic0": "0x" + topic0,
                      "scope": "count of public Registered events; not a measurement of the agents; never a certification",
                      "rows": rows}, indent=1, ensure_ascii=False))
    return 0 if all(r["status"] in ("MEASURED", "NO_DEPLOYMENT_FOUND") for r in rows) else 2


if __name__ == "__main__":
    sys.exit(main())



# ---------------------------------------------------------------------------
# LIVE RUNS — real output, pasted verbatim (see each as_of for its timestamp).
# ---------------------------------------------------------------------------
# FULL-HISTORY RUN (floor->head each chain)
# $ uv run --with pycryptodome python3 scripts/erc8004_census.py --delay 0.15
#
# {
#  "kind": "csoai.erc8004-census/0.1",
#  "as_of": "2026-09-12T12:34:04Z",
#  "registered_topic0": "0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a",
#  "scope": "count of public Registered events; not a measurement of the agents; never a certification",
#  "rows": [
#   {
#    "chain": "ethereum",
#    "contract": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
#    "from_block": 24339000,
#    "to_block": 25961361,
#    "registrations": 8,
#    "method": "eth_getCode deployment probe; chunked eth_getLogs over Registered(uint256,string,address) topic0, floor->head; ordered public-RPC fallback list, chunk halving on error",
#    "rpc": "https://rpc.flashbots.net",
#    "as_of": "2026-09-12T12:34:04Z",
#    "status": "MEASURED",
#    "baseline_delta": {
#     "baseline_2026_09_11_brief_approx": 25000,
#     "observed_minus_baseline": -24992,
#     "note": "baseline is the brief's approximate figure, not a measurement by this tool"
#    }
#   },
#   {
#    "chain": "base",
#    "contract": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
#    "from_block": 41663700,
#    "to_block": 51213604,
#    "registrations": 86149,
#    "method": "eth_getCode deployment probe; chunked eth_getLogs over Registered(uint256,string,address) topic0, floor->head; ordered public-RPC fallback list, chunk halving on error",
#    "rpc": "https://mainnet.base.org",
#    "as_of": "2026-09-12T12:34:04Z",
#    "status": "MEASURED",
#    "baseline_delta": {
#     "baseline_2026_09_11_brief_approx": 17000,
#     "observed_minus_baseline": 69149,
#     "note": "baseline is the brief's approximate figure, not a measurement by this tool"
#    }
#   },
#   {
#    "chain": "bsc",
#    "contract": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
#    "from_block": 79027200,
#    "to_block": 121464121,
#    "registrations": null,
#    "method": "eth_getCode deployment probe; chunked eth_getLogs over Registered(uint256,string,address) topic0, floor->head; ordered public-RPC fallback list, chunk halving on error",
#    "rpc": null,
#    "as_of": "2026-09-12T12:34:04Z",
#    "status": "UNCHECKABLE",
#    "reason": "eth_getLogs failed on every endpoint; scanned to block 79027199 of 121464121",
#    "baseline_delta": {
#     "baseline_2026_09_11_brief_approx": 5000,
#     "observed_minus_baseline": null,
#     "note": "no observation — UNCHECKABLE never collapses to 0"
#    }
#   }
#  ]
# }
#
# RECENT-WINDOW RUN (last 100k blocks per chain)
# $ uv run --with pycryptodome python3 scripts/erc8004_census.py --recent-blocks 100000 --delay 0.1
#
# {
#  "kind": "csoai.erc8004-census/0.1",
#  "as_of": "2026-09-12T13:47:37Z",
#  "registered_topic0": "0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a",
#  "scope": "count of public Registered events; not a measurement of the agents; never a certification",
#  "rows": [
#   {
#    "chain": "ethereum",
#    "contract": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
#    "from_block": 25861730,
#    "to_block": 25961729,
#    "registrations": 8,
#    "method": "eth_getCode deployment probe; chunked eth_getLogs over Registered(uint256,string,address) topic0, floor->head; ordered public-RPC fallback list, chunk halving on error",
#    "rpc": "https://rpc.flashbots.net",
#    "as_of": "2026-09-12T13:47:37Z",
#    "window": {
#     "mode": "RECENT-WINDOW",
#     "recent_blocks": 100000,
#     "note": "NOT full history — an honest window for chains where no public archive endpoint serves deep getLogs"
#    },
#    "status": "MEASURED",
#    "baseline_delta": {
#     "baseline_2026_09_11_brief_approx": 25000,
#     "observed_minus_baseline": null,
#     "note": "recent-window count is NOT comparable to a full-history baseline — delta withheld on purpose"
#    }
#   },
#   {
#    "chain": "base",
#    "contract": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
#    "from_block": 51115760,
#    "to_block": 51215759,
#    "registrations": 393,
#    "method": "eth_getCode deployment probe; chunked eth_getLogs over Registered(uint256,string,address) topic0, floor->head; ordered public-RPC fallback list, chunk halving on error",
#    "rpc": "https://mainnet.base.org",
#    "as_of": "2026-09-12T13:47:37Z",
#    "window": {
#     "mode": "RECENT-WINDOW",
#     "recent_blocks": 100000,
#     "note": "NOT full history — an honest window for chains where no public archive endpoint serves deep getLogs"
#    },
#    "status": "MEASURED",
#    "baseline_delta": {
#     "baseline_2026_09_11_brief_approx": 17000,
#     "observed_minus_baseline": null,
#     "note": "recent-window count is NOT comparable to a full-history baseline — delta withheld on purpose"
#    }
#   },
#   {
#    "chain": "bsc",
#    "contract": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
#    "from_block": 121364532,
#    "to_block": 121464531,
#    "registrations": 364,
#    "method": "eth_getCode deployment probe; chunked eth_getLogs over Registered(uint256,string,address) topic0, floor->head; ordered public-RPC fallback list, chunk halving on error",
#    "rpc": "https://rpc-bsc.48.club",
#    "as_of": "2026-09-12T13:47:37Z",
#    "window": {
#     "mode": "RECENT-WINDOW",
#     "recent_blocks": 100000,
#     "note": "NOT full history — an honest window for chains where no public archive endpoint serves deep getLogs"
#    },
#    "status": "MEASURED",
#    "baseline_delta": {
#     "baseline_2026_09_11_brief_approx": 5000,
#     "observed_minus_baseline": null,
#     "note": "recent-window count is NOT comparable to a full-history baseline — delta withheld on purpose"
#    }
#   }
#  ]
# }
#
# Read of the numbers (measurement, never certification):
#   - ETH 8 total (all in the final ~7k blocks before head) vs the brief's ~25k
#     baseline: the baseline almost certainly refers to an earlier/testnet registry,
#     not this canonical singleton. 0 events in 20,000,000..24,338,999 (probed).
#   - Base 86,149 total is where the singleton actually lives; window 393/100k blocks.
#   - BSC full history is UNCHECKABLE with public endpoints today; window 364/100k
#     blocks via 48.club proves the chain is active. Archive path = BscScan key or
#     own node (Nick's call).
