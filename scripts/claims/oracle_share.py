#!/usr/bin/env python3
"""CL-3 — oracle share of DeFi TVL, from DeFiLlama's keyless public endpoints.

What is measurable without a key. `GET https://api.llama.fi/protocols` returns every protocol
DeFiLlama tracks with its current `tvl`, and SOME of those records carry an `oracles` array
naming the oracle(s) the protocol uses. That array is the only oracle attribution DeFiLlama
serves for free. `GET https://api.llama.fi/oracles` — the full oracle-TVS breakdown behind the
defillama.com/oracles page — answers HTTP 402 "Upgrade to the paid API plan", so it is recorded
as paid and dropped, never worked around.

What that means for the claim. The denominator matters more than the numerator here. If the
free attribution covers only a small slice of tracked DeFi TVL, then no share computed over it
can settle a claim about "the majority of decentralized finance" in either direction, and this
module says so in `settles` / `does_not_settle` rather than publishing a percentage that reads
like an answer.

Two numerators, because a protocol may name several oracles:
  * `any_attribution` credits a protocol's whole TVL to EVERY oracle it names. The shares sum
    to more than 100% and it is an upper bound per oracle.
  * `sole_oracle` credits a protocol only where it names exactly one oracle. Shares are
    disjoint and it is a lower bound per oracle.
A claim of majority would have to survive the LOWER bound; both are published.
"""
from __future__ import annotations

import json
import sys

try:
    from . import common as c
except ImportError:  # run as a script
    import common as c  # type: ignore

PROTOCOLS_URL = "https://api.llama.fi/protocols"
ORACLES_URL = "https://api.llama.fi/oracles"


def compute(protocols: list[dict]) -> dict:
    """Pure: the arithmetic, so a test can feed it a planted population."""
    tracked = [p for p in protocols if isinstance(p.get("tvl"), (int, float)) and p["tvl"] > 0]
    tvl_all = sum(p["tvl"] for p in tracked)
    attributed = [p for p in tracked if isinstance(p.get("oracles"), list) and p["oracles"]]
    tvl_attr = sum(p["tvl"] for p in attributed)
    any_share: dict[str, float] = {}
    sole_share: dict[str, float] = {}
    for p in attributed:
        names = [str(o) for o in p["oracles"]]
        for nme in names:
            any_share[nme] = any_share.get(nme, 0.0) + p["tvl"]
        if len(set(names)) == 1:
            sole_share[names[0]] = sole_share.get(names[0], 0.0) + p["tvl"]
    tvl_sole = sum(sole_share.values())

    def table(d: dict[str, float], denom: float) -> list[dict]:
        return [{"oracle": k, "tvl_usd": round(v, 2), "pct_of_attributed_tvl": round(100 * v / denom, 4) if denom else None}
                for k, v in sorted(d.items(), key=lambda kv: -kv[1])]

    return {
        "protocols_tracked_with_positive_tvl": len(tracked),
        "tvl_usd_all_tracked_protocols": round(tvl_all, 2),
        "protocols_carrying_an_oracles_field": len(attributed),
        "tvl_usd_with_oracle_attribution": round(tvl_attr, 2),
        "attribution_coverage_pct_of_tracked_tvl": round(100 * tvl_attr / tvl_all, 4) if tvl_all else None,
        "tvl_usd_attributed_to_exactly_one_oracle": round(tvl_sole, 2),
        "any_attribution_upper_bound": table(any_share, tvl_attr),
        "sole_oracle_lower_bound": table(sole_share, tvl_attr),
    }


def share_of(result: dict, oracle: str) -> dict:
    up = next((r for r in result["any_attribution_upper_bound"] if r["oracle"] == oracle), None)
    lo = next((r for r in result["sole_oracle_lower_bound"] if r["oracle"] == oracle), None)
    return {
        "oracle": oracle,
        "upper_bound_pct_of_attributed_tvl": up["pct_of_attributed_tvl"] if up else 0.0,
        "lower_bound_pct_of_attributed_tvl": lo["pct_of_attributed_tvl"] if lo else 0.0,
        "upper_bound_tvl_usd": up["tvl_usd"] if up else 0.0,
        "lower_bound_tvl_usd": lo["tvl_usd"] if lo else 0.0,
        "pct_of_all_tracked_defi_tvl_upper_bound": round(
            100 * (up["tvl_usd"] if up else 0.0) / result["tvl_usd_all_tracked_protocols"], 6)
        if result["tvl_usd_all_tracked_protocols"] else None,
    }


def run(oracle: str = "Chainlink") -> dict:
    sources, dropped = [], []
    paid = c.get(ORACLES_URL, timeout=30)
    sources.append(c.source(paid, "the full oracle-TVS breakdown"))
    if c.needs_payment(paid):
        dropped.append({"url": ORACLES_URL, "status": paid["status"],
                        "reason": "paid plan required; recorded and dropped, not worked around",
                        "body_first_120": paid["body"][:120].decode("utf-8", "replace")})
    r, data = c.get_json(PROTOCOLS_URL, timeout=180)
    sources.append(c.source(r, "free protocol list; some records carry an `oracles` array"))
    if not r["ok"] or not isinstance(data, list):
        return {"state": "UNMEASURED", "reason": f"{PROTOCOLS_URL}: {r['reason']}",
                "sources": sources, "paid_sources_dropped": dropped}
    res = compute(data)
    subject = share_of(res, oracle)
    coverage = res["attribution_coverage_pct_of_tracked_tvl"] or 0.0
    return {
        "state": "CLAIM_MEASURED",
        "measured_at": c.now_iso(),
        "method": ("sum `tvl` per oracle named in each protocol's `oracles` array from "
                   "GET https://api.llama.fi/protocols (keyless), two ways: crediting every named "
                   "oracle (upper bound) and crediting only protocols that name exactly one (lower bound)"),
        "window": "a single point reading of DeFiLlama's current TVL values at measured_at; not a time series",
        "denominator": {
            "claim_denominator_would_be": "all of decentralized finance",
            "available_denominator": "DeFiLlama-tracked protocols that carry an `oracles` field",
            "coverage_pct_of_tracked_defi_tvl": coverage,
        },
        "result": res,
        "subject": subject,
        "settles": [
            f"{oracle}'s share of the TVL that DeFiLlama's free endpoint attributes to any oracle: "
            f"between {subject['lower_bound_pct_of_attributed_tvl']}% (sole-oracle) and "
            f"{subject['upper_bound_pct_of_attributed_tvl']}% (any-attribution)",
            f"that free oracle attribution covers {coverage}% of the USD TVL DeFiLlama tracks",
        ],
        "does_not_settle": [
            ("whether the claim's own subject — the majority of decentralized finance — is powered by "
             f"{oracle}: the free attribution covers {coverage}% of tracked DeFi TVL, so a share computed "
             "over it is a share of that slice and of nothing wider"),
            "TVL is not the only measure of DeFi; a share of TVL is not a share of usage, volume or contracts",
            "protocols with no `oracles` field may still use an oracle; absence in the dataset is not absence in fact",
            "the paid /oracles endpoint may show a different and wider breakdown; it was not purchased",
        ],
        "sources": sources,
        "paid_sources_dropped": dropped,
    }


if __name__ == "__main__":
    print(json.dumps(run(sys.argv[1] if len(sys.argv) > 1 else "Chainlink"), indent=1, ensure_ascii=False))
