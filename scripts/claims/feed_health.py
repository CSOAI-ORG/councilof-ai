#!/usr/bin/env python3
"""CL-5 — Chainlink price-feed update cadence and deviation, read from public RPC.

The claim under maintenance is a quality claim ("proven track record of uptime, accuracy and
resilience"). What can be measured without a key, and without anyone's cooperation, is whether
a feed met ITS OWN published parameters over a window we read ourselves:

  * Chainlink publishes, keylessly, a per-network feed directory carrying each feed's
    `proxyAddress`, declared `heartbeat` (seconds) and declared deviation `threshold` (%).
    That directory supplies the denominator; we do not invent one.
  * A public archive-free RPC answers `latestRoundData()` and `getRoundData(roundId)` on the
    proxy, so the last N rounds — their answers and their `updatedAt` timestamps — are readable
    by anyone, from the chain, for nothing.

Then one predicate, stated in the feed's own terms: a feed that declares an H-second heartbeat
asserts it will publish at least every H seconds. Every consecutive gap we read is compared to
H, and the EXCESS (gap - H) is what is reported, bucketed.

The tolerance is stated rather than assumed, because the naive predicate would read as an
accusation it cannot support. A
heartbeat round is triggered once H has elapsed and is then written in a later block, so a
healthy feed's gaps sit a few seconds ABOVE H by construction: we read DAI/USD gaps of 3612 s
against a declared 3600 s. Counting those as failures would turn ordinary write latency into
an allegation. So the headline count is intervals exceeding H by more than GRACE_S, GRACE_S is
named in the output, and the zero-tolerance count is published beside it so nothing is hidden.

None of this is a statement about any window but ours, and a window with no excess does not
prove there has never been one.

Deviation is reported, not adjudicated. Chainlink's published rule is that a round is written
when EITHER the deviation threshold is crossed OR the heartbeat elapses, so an update inside
the heartbeat with sub-threshold deviation is ordinary and is NOT counted against anything.

Feeds are selected by NAME from the published directory, never by an address typed from memory,
and the selection is checked on-chain: the proxy's own `description()` must equal the directory
name, or the feed is dropped as UNIDENTIFIED. A feed we cannot identify is not measured.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone

try:
    from . import common as c
except ImportError:
    import common as c  # type: ignore

# Selectors are pinned so the harness needs no keccak dependency. test_claim_harness.py
# recomputes them with keccak wherever one is installed and fails if any drifts.
SELECTORS = {
    "latestRoundData()": "0xfeaf968c",
    "getRoundData(uint80)": "0x9a6fc8f5",
    "decimals()": "0x313ce567",
    "description()": "0x7284e416",
    "version()": "0x54fd4d50",
}

NETWORKS = {
    "ethereum-mainnet": {
        "directory": "https://reference-data-directory.vercel.app/feeds-mainnet.json",
        "rpc": ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"],
        "chain_id": 1,
    },
    "base-mainnet": {
        "directory": "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-base-1.json",
        "rpc": ["https://mainnet.base.org", "https://base-rpc.publicnode.com"],
        "chain_id": 8453,
    },
}

DEFAULT_FEEDS = ["ETH / USD", "BTC / USD", "LINK / USD", "USDC / USD", "DAI / USD"]

# A decoded round must land inside this range or the decode is treated as failed rather than
# published as data. 2020-01-01 predates every feed here; the future bound allows clock skew.
MIN_PLAUSIBLE_TS = 1577836800

#: Seconds a gap may exceed the declared heartbeat and still be ordinary write latency: the
#: round is triggered once the heartbeat has elapsed and lands in a later block. Stated, not
#: hidden; the zero-tolerance count is reported alongside.
GRACE_S = 60


def _word(data: str, i: int) -> int:
    return int(data[2 + i * 64: 2 + (i + 1) * 64] or "0", 16)


def _signed(v: int, bits: int = 256) -> int:
    return v - (1 << bits) if v >= 1 << (bits - 1) else v


def _call(rpc_urls: list[str], to: str, data: str) -> tuple[str | None, dict]:
    """eth_call against the first public node that answers. Returns (hexdata, source-record)."""
    last = {}
    for url in rpc_urls:
        r, res = c.rpc(url, "eth_call", [{"to": to, "data": data}, "latest"])
        last = c.source(r, f"eth_call {data[:10]} -> {to}")
        if r["ok"] and isinstance(res, str) and len(res) > 2:
            return res, last
    return None, last


def decode_round(hexdata: str) -> dict | None:
    """(uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)."""
    if not hexdata or len(hexdata) < 2 + 5 * 64:
        return None
    rid, ans, started, updated = _word(hexdata, 0), _signed(_word(hexdata, 1)), _word(hexdata, 2), _word(hexdata, 3)
    if updated < MIN_PLAUSIBLE_TS or updated > 4102444800:
        return None
    return {"round_id": rid, "answer_raw": ans, "started_at": started, "updated_at": updated,
            "answered_in_round": _word(hexdata, 4)}


def decode_string(hexdata: str) -> str | None:
    try:
        n = _word(hexdata, 1)
        return bytes.fromhex(hexdata[2 + 128: 2 + 128 + n * 2]).decode("utf-8")
    except Exception:
        return None


def analyse(rounds: list[dict], heartbeat_s: int, threshold_pct: float, decimals: int,
            grace_s: int = GRACE_S) -> dict:
    """Pure: the arithmetic over an ascending-by-time list of rounds. Fed planted data by the tests."""
    rs = sorted(rounds, key=lambda r: r["updated_at"])
    if len(rs) < 2:
        return {"state": "UNMEASURED", "reason": f"{len(rs)} round(s) read; an interval needs two"}
    scale = 10 ** decimals
    intervals = []
    for a, b in zip(rs, rs[1:]):
        gap = b["updated_at"] - a["updated_at"]
        pa, pb = a["answer_raw"] / scale, b["answer_raw"] / scale
        dev = abs(pb - pa) / abs(pa) * 100 if pa else None
        intervals.append({
            "from_round": a["round_id"], "to_round": b["round_id"],
            "gap_s": gap, "deviation_pct": round(dev, 6) if dev is not None else None,
            "excess_over_declared_heartbeat_s": gap - heartbeat_s,
            "over_declared_heartbeat": gap > heartbeat_s,
            "over_declared_heartbeat_beyond_grace": gap > heartbeat_s + grace_s,
            "deviation_at_or_over_declared_threshold": (dev is not None and dev >= threshold_pct),
        })
    gaps = [i["gap_s"] for i in intervals]
    excess = [i["excess_over_declared_heartbeat_s"] for i in intervals]
    misses = [i for i in intervals if i["over_declared_heartbeat_beyond_grace"]]
    buckets = {
        "within_declared_heartbeat": sum(1 for e in excess if e <= 0),
        "over_by_1_to_%ds" % grace_s: sum(1 for e in excess if 0 < e <= grace_s),
        "over_by_%ds_to_10pct_of_heartbeat" % grace_s: sum(
            1 for e in excess if grace_s < e <= max(grace_s, heartbeat_s * 0.10)),
        "over_by_more_than_10pct_of_heartbeat": sum(1 for e in excess if e > max(grace_s, heartbeat_s * 0.10)),
    }
    return {
        "state": "CLAIM_MEASURED",
        "window_start_utc": datetime.fromtimestamp(rs[0]["updated_at"], timezone.utc).isoformat().replace("+00:00", "Z"),
        "window_end_utc": datetime.fromtimestamp(rs[-1]["updated_at"], timezone.utc).isoformat().replace("+00:00", "Z"),
        "window_s": rs[-1]["updated_at"] - rs[0]["updated_at"],
        "rounds_read": len(rs),
        "intervals": len(intervals),
        "declared_heartbeat_s": heartbeat_s,
        "declared_deviation_threshold_pct": threshold_pct,
        "gap_min_s": min(gaps), "gap_max_s": max(gaps),
        "gap_mean_s": round(sum(gaps) / len(gaps), 2),
        "grace_s": grace_s,
        "excess_max_s": max(excess),
        "excess_over_grace_count": len(misses),
        "intervals_over_declared_heartbeat_zero_tolerance": sum(1 for e in excess if e > 0),
        "interval_excess_buckets": buckets,
        "pct_of_intervals_within_declared_heartbeat_plus_grace": round(
            100 * (len(intervals) - len(misses)) / len(intervals), 4),
        "intervals_at_or_over_declared_deviation_threshold": sum(
            1 for i in intervals if i["deviation_at_or_over_declared_threshold"]),
        "deviation_max_pct": max((i["deviation_pct"] for i in intervals if i["deviation_pct"] is not None), default=None),
        "intervals_exceeding_heartbeat_beyond_grace": misses[:20],
        "latest_answer": round(rs[-1]["answer_raw"] / scale, max(0, decimals - 2)),
    }


def read_feed(net: dict, entry: dict, rounds_wanted: int) -> dict:
    proxy, name = entry["proxyAddress"], entry["name"]
    rpcs, sources = net["rpc"], []
    desc_hex, s = _call(rpcs, proxy, SELECTORS["description()"])
    sources.append(s)
    on_chain_name = decode_string(desc_hex) if desc_hex else None
    if on_chain_name != name:
        return {"feed": name, "proxy": proxy, "state": "UNIDENTIFIED",
                "reason": f"proxy description() is {on_chain_name!r}, directory says {name!r}; "
                          "feed dropped rather than measured under a name it does not answer to",
                "sources": sources}
    dec_hex, s = _call(rpcs, proxy, SELECTORS["decimals()"])
    sources.append(s)
    decimals = _word(dec_hex, 0) if dec_hex else entry.get("decimals")
    latest_hex, s = _call(rpcs, proxy, SELECTORS["latestRoundData()"])
    sources.append(s)
    latest = decode_round(latest_hex) if latest_hex else None
    if not latest:
        return {"feed": name, "proxy": proxy, "state": "UNMEASURED",
                "reason": "latestRoundData() unreadable or decoded outside plausible bounds", "sources": sources}
    rounds, rid = [latest], latest["round_id"]
    for i in range(1, rounds_wanted):
        # Proxy roundId = (phaseId << 64) | aggregatorRoundId. Decrementing stays inside the
        # current phase until the aggregator's own round 0, where the call reverts and we stop.
        if (rid - i) & ((1 << 64) - 1) == 0:
            break
        data = SELECTORS["getRoundData(uint80)"] + f"{rid - i:064x}"
        hx, s = _call(rpcs, proxy, data)
        if s.get("status") != 200 or not hx:
            sources.append(dict(s, note=f"walk stopped at -{i}"))
            break
        r = decode_round(hx)
        if not r or r["updated_at"] == 0:
            break
        rounds.append(r)
    out = analyse(rounds, int(entry["heartbeat"]), float(entry["threshold"]), int(decimals))
    out.update({"feed": name, "proxy": proxy, "decimals": decimals,
                "rpc_endpoints_used": rpcs, "sources": sources[:4],
                "rounds_requested": rounds_wanted})
    return out


def run(networks: list[str] | None = None, feeds: list[str] | None = None, rounds: int = 25) -> dict:
    nets = networks or list(NETWORKS)
    want = feeds or DEFAULT_FEEDS
    results, sources = [], []
    for net_name in nets:
        net = NETWORKS[net_name]
        r, directory = c.get_json(net["directory"], timeout=90)
        sources.append(c.source(r, f"Chainlink's published feed directory for {net_name}: "
                                   "declared heartbeat and deviation threshold per feed"))
        if not r["ok"] or not isinstance(directory, list):
            results.append({"network": net_name, "state": "UNMEASURED", "reason": r["reason"]})
            continue
        # Prefer the plain reference feed over variants (SVR, Aave-specific, wrapped paths).
        by_name: dict[str, dict] = {}
        for e in directory:
            if not isinstance(e, dict) or not e.get("proxyAddress") or e.get("heartbeat") in (None, 0):
                continue
            n = e.get("name")
            if n in want and (n not in by_name or len(str(e.get("path", ""))) < len(str(by_name[n].get("path", "")))):
                by_name[n] = e
        for n in want:
            if n not in by_name:
                results.append({"network": net_name, "feed": n, "state": "UNMEASURED",
                                "reason": "not present in the published directory for this network with a declared heartbeat"})
                continue
            out = read_feed(net, by_name[n], rounds)
            out["network"], out["chain_id"] = net_name, net["chain_id"]
            results.append(out)
            # One citation per feed: which contract was read, over which public node, when.
            sources.append({"url": net["rpc"][0], "status": 200 if out.get("state") == "CLAIM_MEASURED" else None,
                            "accessed_utc": c.now_iso(), "note": (
                                f"eth_call description()/decimals()/latestRoundData()/getRoundData() on "
                                f"{out.get('proxy')} ({net_name} chain {net['chain_id']}) for {n}; "
                                f"fallback node {net['rpc'][1] if len(net['rpc']) > 1 else 'none'}")})
    measured = [r for r in results if r.get("state") == "CLAIM_MEASURED"]
    return {
        "state": "CLAIM_MEASURED" if measured else "UNMEASURED",
        "measured_at": c.now_iso(),
        "method": ("select feeds by name from Chainlink's own published per-network feed directory; confirm each "
                   "proxy on-chain by description(); read decimals(), latestRoundData() and getRoundData() back "
                   "through the current phase over public keyless RPC; compare every consecutive gap to the "
                   f"feed's DECLARED heartbeat (grace {GRACE_S}s for write latency, stated; the zero-tolerance "
                   "count is published too) and every move to its DECLARED deviation threshold"),
        "denominator": {
            "feeds_attempted": len(results),
            "feeds_measured": len(measured),
            "intervals_measured": sum(r.get("intervals", 0) for r in measured),
            "declared_parameters_from": "the feed's own published heartbeat and threshold, not a figure we chose",
        },
        "totals": {
            "grace_s": GRACE_S,
            "intervals_exceeding_declared_heartbeat_beyond_grace": sum(r.get("excess_over_grace_count", 0) for r in measured),
            "intervals_exceeding_declared_heartbeat_zero_tolerance": sum(
                r.get("intervals_over_declared_heartbeat_zero_tolerance", 0) for r in measured),
            "feeds_with_at_least_one_interval_beyond_grace": sum(
                1 for r in measured if r.get("excess_over_grace_count", 0) > 0),
            "largest_single_excess_s": max((r.get("excess_max_s", 0) for r in measured), default=None),
        },
        "feeds": results,
        "sources": sources,
        "does_not_prove": [
            "nothing outside the read window: the window is the rounds this run could read back, per feed, and is stated per feed",
            "nothing about feeds not in this selection, nor about any network not read",
            "no miss found is not the same as no miss ever; this is a sample, not the feed's whole history",
            "answer correctness is not assessed — the on-chain value is not compared to any off-chain reference price",
            "a public RPC could omit or misreport a round; the reading is only as good as the node that served it",
            f"an interval past the declared heartbeat is not an outage: the grace is {GRACE_S}s and gaps a few seconds "
            "over H are ordinary write latency, so the bucketed excess is the reading, not a pass/fail",
        ],
    }


if __name__ == "__main__":
    print(json.dumps(run(rounds=int(sys.argv[1]) if len(sys.argv) > 1 else 25), indent=1, ensure_ascii=False))
