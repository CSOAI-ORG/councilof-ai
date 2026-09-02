"""EVM permission-EVENT indexer — the history half of the provable archive.

evm_permissions.py answers "what is the permission state at block N". This
module answers "when did it change": it indexes the events that move
permission state on the same roster of tokenised-RWA contracts —

  Paused(address) / Unpaused(address)                  OpenZeppelin Pausable
  OwnershipTransferred(address,address)                OpenZeppelin Ownable
  RoleGranted(bytes32,address,address)                 OpenZeppelin AccessControl
  RoleRevoked(bytes32,address,address)
  Upgraded(address)                                    EIP-1967 / OZ proxies
  AdminChanged(address,address)
  BeaconUpgraded(address)

— from keyless PUBLIC JSON-RPC endpoints with eth_getLogs, incrementally,
rate-limited, with a committed state file so every hourly run extends the
covered range instead of re-reading it. Public endpoints cap eth_getLogs to a
few thousand blocks per call (dRPC ~5k, 1rpc 50, publicnode 403 on 2 Sep 2026),
so history accrues run by run; a deep backfill needs an archive-capable RPC
and is exactly the part that is not free to reproduce.

Outputs (all ≤3KB `public.notice` leaves, signed in GHA or not at all):
  csoai.evm.permission-event/0.1  one leaf per (token, chain) per run that
                                  found NEW events in the freshly scanned range
  csoai.evm.permission-scan/0.1   one leaf per chain per run: the covered range
                                  per contract, so absence of events over a
                                  range is itself a signed, dated statement

Vocabulary rule (binding): descriptive words only, never a judgement word
about an asset (banned list gated by scripts/provable-archive-vocab.test.ts);
never MEASURED on a leaf. Facts only. Not a rate. Not a grade.

Never raises. RPC dark → the contract's range does not advance this run and
the sidecar says so. State is returned, not written: the publisher persists it
only after the root that carries the leaves is written (see save_state).
"""
from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from . import evm_permissions as ep

SCHEMA_EVENT = "csoai.evm.permission-event/0.1"
SCHEMA_SCAN = "csoai.evm.permission-scan/0.1"
STATE_KIND = "csoai.evm.permission-events-state/0.1"
STATE_REL = Path("public") / "archive" / "evm-events" / "state.json"
SURFACE = ep.SURFACE
PAYLOAD_CAP = ep.PAYLOAD_CAP
METHOD_URL = ep.METHOD_URL

REQUEST_SPACING_S = 0.25
CHUNK_BLOCKS = 4000          # first try; halved on a range-limit error, floor 50
MIN_CHUNK = 50
MAX_CHUNKS_PER_CONTRACT = 3  # per run
MAX_LOG_REQUESTS = 80        # per run, all chains — no hammering
CONFIRMATIONS = {"ethereum": 12, "polygon": 128}
DEFAULT_CONFIRMATIONS = 32

# Where scanning starts when a contract has no state yet: a lookback in blocks,
# sized so the FIRST run covers roughly a day on every chain. Older history is
# UNMEASURED until an archive-capable endpoint is pointed at it (--from). The
# scan leaf carries scanned_from so nobody reads "no events" as "never".
LOOKBACK_BLOCKS = {
    "ethereum": 7_200, "arbitrum": 340_000, "optimism": 43_200, "polygon": 40_000,
    "base": 43_200, "bsc": 115_000, "avalanche": 43_000, "mantle": 43_200,
}

# eth_getLogs endpoints in preference order. dRPC answered 5k-block ranges on
# 2 Sep 2026; official chain RPCs follow; publicnode/1rpc are last (403 / 50).
LOG_RPCS: dict[str, list[str]] = {
    "ethereum": ["https://eth.drpc.org", "https://cloudflare-eth.com", "https://ethereum-rpc.publicnode.com"],
    "arbitrum": ["https://arbitrum.drpc.org", "https://arb1.arbitrum.io/rpc", "https://arbitrum-one-rpc.publicnode.com"],
    "optimism": ["https://optimism.drpc.org", "https://mainnet.optimism.io", "https://optimism-rpc.publicnode.com"],
    "polygon": ["https://polygon.drpc.org", "https://polygon-rpc.com", "https://polygon-bor-rpc.publicnode.com"],
    "base": ["https://base.drpc.org", "https://mainnet.base.org", "https://base-rpc.publicnode.com"],
    "bsc": ["https://bsc.drpc.org", "https://bsc-dataseed.bnbchain.org", "https://bsc-rpc.publicnode.com"],
    "avalanche": ["https://avalanche.drpc.org", "https://api.avax.network/ext/bc/C/rpc", "https://avalanche-c-chain-rpc.publicnode.com"],
    "mantle": ["https://mantle.drpc.org", "https://rpc.mantle.xyz", "https://mantle-rpc.publicnode.com"],
}

# topic0 = keccak256(signature). Constants are pinned here and re-derived by
# keccak256() below in the tests, so a typo cannot silently index nothing.
EVENTS: list[dict[str, Any]] = [
    {"name": "Paused", "sig": "Paused(address)", "topic": "0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258",
     "indexed": [], "data": ["account"]},
    {"name": "Unpaused", "sig": "Unpaused(address)", "topic": "0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa",
     "indexed": [], "data": ["account"]},
    {"name": "OwnershipTransferred", "sig": "OwnershipTransferred(address,address)",
     "topic": "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0",
     "indexed": ["previousOwner", "newOwner"], "data": []},
    {"name": "RoleGranted", "sig": "RoleGranted(bytes32,address,address)",
     "topic": "0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d",
     "indexed": ["role", "account", "sender"], "data": []},
    {"name": "RoleRevoked", "sig": "RoleRevoked(bytes32,address,address)",
     "topic": "0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b",
     "indexed": ["role", "account", "sender"], "data": []},
    {"name": "Upgraded", "sig": "Upgraded(address)", "topic": "0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b",
     "indexed": ["implementation"], "data": []},
    {"name": "AdminChanged", "sig": "AdminChanged(address,address)",
     "topic": "0x7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f",
     "indexed": [], "data": ["previousAdmin", "newAdmin"]},
    {"name": "BeaconUpgraded", "sig": "BeaconUpgraded(address)", "topic": "0x1cf3b03a6cf19fa2baba4df148e9dcabedea7f8a5c07840e207e5c089be95d3e",
     "indexed": ["beacon"], "data": []},
]
TOPIC_TO_EVENT = {e["topic"]: e for e in EVENTS}

ALWAYS_UNMEASURED = [
    "events before scanned_from (public eth_getLogs is range-capped; archive endpoint needed)",
    "events emitted by a separate registry/pauser/allowlist contract rather than the token address",
    "reorgs deeper than the confirmation margin",
]


# ----------------------------------------------------------------------------- keccak-256 (pure python)
# Used by the tests to re-derive every topic0 from its signature. Kept in the
# module so the constants and the derivation live together.
_RC = [
    0x0000000000000001, 0x0000000000008082, 0x800000000000808A, 0x8000000080008000,
    0x000000000000808B, 0x0000000080000001, 0x8000000080008081, 0x8000000000008009,
    0x000000000000008A, 0x0000000000000088, 0x0000000080008009, 0x000000008000000A,
    0x000000008000808B, 0x800000000000008B, 0x8000000000008089, 0x8000000000008003,
    0x8000000000008002, 0x8000000000000080, 0x000000000000800A, 0x800000008000000A,
    0x8000000080008081, 0x8000000000008080, 0x0000000080000001, 0x8000000080008008,
]
_ROT = [[0, 36, 3, 41, 18], [1, 44, 10, 45, 2], [62, 6, 43, 15, 61], [28, 55, 25, 21, 56], [27, 20, 39, 8, 14]]
_M64 = (1 << 64) - 1


def _rol(v: int, n: int) -> int:
    n %= 64
    return ((v << n) | (v >> (64 - n))) & _M64 if n else v


def _keccak_f(a: list[list[int]]) -> list[list[int]]:
    for rc in _RC:
        c = [a[x][0] ^ a[x][1] ^ a[x][2] ^ a[x][3] ^ a[x][4] for x in range(5)]
        d = [c[(x - 1) % 5] ^ _rol(c[(x + 1) % 5], 1) for x in range(5)]
        a = [[a[x][y] ^ d[x] for y in range(5)] for x in range(5)]
        b = [[0] * 5 for _ in range(5)]
        for x in range(5):
            for y in range(5):
                b[y][(2 * x + 3 * y) % 5] = _rol(a[x][y], _ROT[x][y])
        a = [[b[x][y] ^ ((~b[(x + 1) % 5][y]) & b[(x + 2) % 5][y] & _M64) for y in range(5)] for x in range(5)]
        a[0][0] ^= rc
    return a


def keccak256(data: bytes) -> bytes:
    rate = 136
    buf = bytearray(data)
    buf.append(0x01)
    while len(buf) % rate:
        buf.append(0)
    buf[-1] |= 0x80
    a = [[0] * 5 for _ in range(5)]
    for off in range(0, len(buf), rate):
        for i in range(rate // 8):
            a[i % 5][i // 5] ^= int.from_bytes(buf[off + 8 * i: off + 8 * i + 8], "little")
        a = _keccak_f(a)
    out = b""
    for y in range(5):
        for x in range(5):
            out += a[x][y].to_bytes(8, "little")
    return out[:32]


def topic_of(signature: str) -> str:
    return "0x" + keccak256(signature.encode("ascii")).hex()


# ----------------------------------------------------------------------------- state
def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def empty_state() -> dict[str, Any]:
    return {"kind": STATE_KIND, "as_of": None, "method": METHOD_URL, "chains": {}}


def load_state(root: Path) -> dict[str, Any]:
    p = root / STATE_REL
    try:
        doc = json.loads(p.read_text(encoding="utf-8"))
        if doc.get("kind") == STATE_KIND and isinstance(doc.get("chains"), dict):
            return doc
    except Exception:
        pass
    return empty_state()


def save_state(root: Path, state: dict[str, Any]) -> Path | None:
    """Publisher hook, called only after the root carrying this run's leaves is written."""
    try:
        p = root / STATE_REL
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(state, indent=1, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
        return p
    except Exception:
        return None


# ----------------------------------------------------------------------------- decode
def _addr(word: str) -> str:
    w = word[2:] if word.startswith("0x") else word
    return "0x" + w[-40:].lower()


def decode_log(log: dict[str, Any]) -> dict[str, Any] | None:
    topics = log.get("topics") or []
    if not topics:
        return None
    ev = TOPIC_TO_EVENT.get(str(topics[0]).lower())
    if not ev:
        return None
    args: dict[str, str] = {}
    for i, name in enumerate(ev["indexed"]):
        if i + 1 < len(topics):
            t = str(topics[i + 1]).lower()
            args[name] = t if name == "role" else _addr(t)
    data = str(log.get("data") or "0x")[2:]
    for i, name in enumerate(ev["data"]):
        word = data[64 * i: 64 * (i + 1)]
        if len(word) == 64:
            args[name] = _addr(word)
    try:
        return {
            "event": ev["name"],
            "block": int(log["blockNumber"], 16),
            "tx": str(log.get("transactionHash") or "").lower(),
            "log_index": int(log.get("logIndex", "0x0"), 16),
            "args": args,
        }
    except Exception:
        return None


# ----------------------------------------------------------------------------- scan
def _get_logs(transport: ep.Transport, url: str, address: str, frm: int, to: int) -> tuple[list[dict[str, Any]] | None, str | None]:
    """(logs, None) on success; (None, reason) on failure. reason 'range' means shrink the chunk."""
    req = [{"jsonrpc": "2.0", "id": 1, "method": "eth_getLogs",
            "params": [{"address": address, "fromBlock": hex(frm), "toBlock": hex(to), "topics": [list(TOPIC_TO_EVENT.keys())]}]}]
    out = transport(url, req)
    if not out or not isinstance(out[0], dict):
        return None, "dark"
    if "error" in out[0]:
        msg = str((out[0].get("error") or {}).get("message", "")).lower()
        return None, "range" if any(k in msg for k in ("range", "limit", "block", "too many", "exceed")) else "error"
    res = out[0].get("result")
    if not isinstance(res, list):
        return None, "error"
    return res, None


def scan_contract(row: dict[str, Any], safe_to: int, st: dict[str, Any], transport: ep.Transport,
                  budget: dict[str, int], spacing: float, log_rpcs: list[str] | None = None) -> dict[str, Any]:
    chain = row["chain"]
    addr = row["address"].lower()
    frm = int(st.get("next_block") or 0)
    if not frm:
        frm = max(0, safe_to - LOOKBACK_BLOCKS.get(chain, 7_200))
        st["scanned_from"] = frm
    chunk = int(st.get("chunk") or CHUNK_BLOCKS)
    urls = list(log_rpcs or LOG_RPCS.get(chain) or ep.CHAINS[chain]["rpcs"])
    events: list[dict[str, Any]] = []
    rpc_used: str | None = None
    reason: str | None = None
    chunks_done = 0
    start = frm
    while chunks_done < MAX_CHUNKS_PER_CONTRACT and frm <= safe_to and budget["left"] > 0:
        to = min(frm + chunk - 1, safe_to)
        got: list[dict[str, Any]] | None = None
        for url in urls:
            if budget["left"] <= 0:
                break
            budget["left"] -= 1
            logs, why = _get_logs(transport, url, addr, frm, to)
            time.sleep(spacing) if spacing else None
            if logs is not None:
                got, rpc_used = logs, url
                break
            if why == "range" and chunk > MIN_CHUNK:
                chunk = max(MIN_CHUNK, chunk // 2)
                to = min(frm + chunk - 1, safe_to)
                continue
            reason = why
        if got is None:
            break
        for lg in got:
            d = decode_log(lg)
            if d:
                events.append(d)
        frm = to + 1
        chunks_done += 1
        reason = None
    events.sort(key=lambda e: (e["block"], e["log_index"]))
    if chunks_done:
        st["next_block"] = frm
        st["chunk"] = chunk
        st["events_total"] = int(st.get("events_total") or 0) + len(events)
        st["chunks_done"] = int(st.get("chunks_done") or 0) + chunks_done
        if events:
            st["last_event_block"] = events[-1]["block"]
        st["last_rpc"] = ep._host(rpc_used) if rpc_used else None
        st["symbol"] = row["symbol"]
    return {"from": start, "to": frm - 1 if chunks_done else None, "events": events, "rpc": rpc_used,
            "chunks": chunks_done, "reason": reason, "advanced": bool(chunks_done)}


# ----------------------------------------------------------------------------- leaves
def event_leaf(row: dict[str, Any], scan: dict[str, Any], st: dict[str, Any], block: dict[str, Any]) -> dict[str, Any]:
    chain = row["chain"]
    subject = f"evm-events:{row['symbol']}:{chain}"
    evs = list(scan["events"])
    payload: dict[str, Any] = {
        "schema": SCHEMA_EVENT,
        "subject": subject,
        "symbol": row["symbol"],
        "product": row["product"],
        "chain": chain,
        "chain_id": ep.CHAINS[chain]["chain_id"],
        "address": row["address"].lower(),
        "range": {"from": scan["from"], "to": scan["to"]},
        "scanned_from": st.get("scanned_from"),
        "head": {"block": block["number"], "block_hash": block.get("hash"), "block_time": ep._iso(block["timestamp"])},
        "rpc": ep._host(scan["rpc"]) if scan["rpc"] else None,
        "n_events": len(evs),
        "events": evs,
        "absent": sorted({e["name"] for e in EVENTS} - {e["event"] for e in evs}),
        "unmeasured": list(ALWAYS_UNMEASURED),
        "attests": (
            f"permission events emitted by this address in blocks {scan['from']}..{scan['to']} on {chain}, "
            f"as answered by the named public RPC; discrete, point-in-time; not a rate, not a grade, not an opinion"
        ),
        "method": METHOD_URL,
    }
    truncated = 0
    while len(ep.canonical_bytes(payload)) > PAYLOAD_CAP and payload["events"]:
        payload["events"] = payload["events"][:-1]
        truncated += 1
        payload["truncated"] = truncated
    while len(ep.canonical_bytes(payload)) > PAYLOAD_CAP and len(payload["unmeasured"]) > 1:
        payload["unmeasured"] = payload["unmeasured"][:-1]
    return {
        "surface": SURFACE,
        "subject": f"{subject} permission events {scan['from']}..{scan['to']}",
        "as_of": payload["head"]["block_time"],
        "source_urls": [scan["rpc"], row["source"]] if scan["rpc"] else [row["source"]],
        "payload": payload,
        "unmeasured": payload["unmeasured"],
        "tags": ["framework:evm", "reg.tag:public-ledger", f"chain:{chain}", "coverage:permission-events", f"subject:{row['symbol']}"],
    }


def scan_leaf(chain: str, rows_scanned: list[dict[str, Any]], block: dict[str, Any]) -> dict[str, Any] | None:
    """One coverage leaf per chain per run: which ranges were read, and how many events each held."""
    rows = [r for r in rows_scanned if r["chain"] == chain]
    if not rows:
        return None
    head = {"block": block["number"], "block_hash": block.get("hash"), "block_time": ep._iso(block["timestamp"])}
    payload: dict[str, Any] = {
        "schema": SCHEMA_SCAN,
        "subject": f"evm-events:scan:{chain}",
        "chain": chain,
        "chain_id": ep.CHAINS[chain]["chain_id"],
        "head": head,
        "n_contracts": len(rows),
        "coverage": [{k: r[k] for k in ("subject", "from", "to", "events_new", "events_total", "scanned_from", "rpc")} for r in rows],
        "unmeasured": list(ALWAYS_UNMEASURED[:1]),
        "attests": (
            f"the block ranges of each roster contract on {chain} that this run read with eth_getLogs for the "
            "listed permission events, and how many it found; absence in a range is stated only for that range"
        ),
        "method": METHOD_URL,
    }
    dropped = 0
    while len(ep.canonical_bytes(payload)) > PAYLOAD_CAP and payload["coverage"]:
        payload["coverage"] = payload["coverage"][:-1]
        dropped += 1
        payload["truncated"] = dropped
    return {
        "surface": SURFACE,
        "subject": f"evm-events:scan:{chain} coverage at block {block['number']}",
        "as_of": head["block_time"],
        "source_urls": sorted({f"https://{r['rpc']}" for r in rows if r.get("rpc")}) or [METHOD_URL],
        "payload": payload,
        "unmeasured": payload["unmeasured"],
        "tags": ["framework:evm", "reg.tag:public-ledger", f"chain:{chain}", "coverage:permission-events"],
    }


# ----------------------------------------------------------------------------- entry
def collect(root: Path | None = None, transport: ep.Transport | None = None, state: dict[str, Any] | None = None,
            spacing: float = REQUEST_SPACING_S, only: str | None = None,
            log_rpcs: dict[str, list[str]] | None = None, max_requests: int = MAX_LOG_REQUESTS) -> dict[str, Any]:
    """Adapter entry point. Never raises. Returns {"leaves", "state", "sidecar"}.

    `state` is the NEW state to persist via save_state() after the root is written;
    it is never written here.
    """
    leaves: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    rows = ep.roster(only)
    st_all = state if state is not None else (load_state(root) if root else empty_state())
    st_all = json.loads(json.dumps(st_all))  # never mutate the caller's copy
    coverage: list[dict[str, Any]] = []
    blocks: dict[str, dict[str, Any] | None] = {}
    budget = {"left": max_requests}
    try:
        tr = transport or ep.default_transport()
        for chain in sorted({r["chain"] for r in rows}):
            try:
                blocks[chain] = ep.fetch_block(chain, tr, spacing)
            except Exception as e:  # pragma: no cover
                blocks[chain] = None
                failures.append({"chain": chain, "reason": f"block {type(e).__name__}"})
        for row in rows:
            chain = row["chain"]
            b = blocks.get(chain)
            subject = f"evm-events:{row['symbol']}:{chain}"
            if not b:
                failures.append({"subject": subject, "reason": "chain dark"})
                continue
            safe_to = b["number"] - CONFIRMATIONS.get(chain, DEFAULT_CONFIRMATIONS)
            st = st_all["chains"].setdefault(chain, {}).setdefault(row["address"].lower(), {})
            try:
                scan = scan_contract(row, safe_to, st, tr, budget, spacing, (log_rpcs or {}).get(chain))
            except Exception as e:
                failures.append({"subject": subject, "reason": f"scan {type(e).__name__}"})
                continue
            if not scan["advanced"]:
                failures.append({"subject": subject, "reason": scan["reason"] or ("budget" if budget["left"] <= 0 else "nothing to scan")})
                continue
            coverage.append({
                "subject": subject, "chain": chain, "from": scan["from"], "to": scan["to"],
                "events_new": len(scan["events"]), "events_total": st.get("events_total", 0),
                "scanned_from": st.get("scanned_from"), "rpc": ep._host(scan["rpc"]) if scan["rpc"] else None,
            })
            if scan["events"]:
                leaves.append(event_leaf(row, scan, st, b))
        for chain in sorted(blocks):
            b = blocks[chain]
            sl = scan_leaf(chain, coverage, b) if b else None
            if sl:
                leaves.append(sl)
        st_all["as_of"] = now_iso()
    except Exception as e:  # never halt the root
        failures.append({"adapter": "evm_permission_events", "reason": type(e).__name__})
        leaves = []
    return {
        "leaves": leaves,
        "state": st_all,
        "sidecar": {
            "schema": SCHEMA_EVENT,
            "n_leaves": len(leaves),
            "n_contracts_scanned": len(coverage),
            "n_roster": len(rows),
            "requests_used": max_requests - budget["left"],
            "chains": {c: ({"block": b["number"], "rpc": ep._host(b["rpc"])} if b else {"status": "dark"}) for c, b in blocks.items()},
            "failures": failures[:40],
            "note": (
                "Permission events (pause, ownership, roles, proxy upgrades) indexed incrementally from keyless "
                "public eth_getLogs, range-capped and rate-limited. History before scanned_from is unmeasured. "
                "Leaves signed only by the public-root writer in GHA. Not a rate. Not a grade. Not MEASURED."
            ),
        },
    }


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="EVM permission-event indexer (dry: prints, never writes state)")
    ap.add_argument("--only", default=os.environ.get("EVM_PERMISSIONS_ONLY"))
    ap.add_argument("--write-state", action="store_true", help="persist state (publisher does this normally)")
    args = ap.parse_args()
    root = Path(__file__).resolve().parents[2]
    out = collect(root, only=args.only)
    print(json.dumps({"n_leaves": len(out["leaves"]), "sidecar": out["sidecar"]}, indent=1, ensure_ascii=False))
    for leaf in out["leaves"]:
        print(leaf["payload"]["subject"], len(ep.canonical_bytes(leaf["payload"])), "B")
    if args.write_state:
        print("state ->", save_state(root, out["state"]))
