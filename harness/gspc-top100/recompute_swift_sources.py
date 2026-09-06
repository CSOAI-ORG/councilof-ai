#!/usr/bin/env python3
"""Recompute every SWIFT row's n by FETCHING the public sources named on its card.

PHASE C asks that each fact be recomputed from the public source named on the card, with
n printed per card. /api/swift derives n from source keys that RESOLVE IN THE TAPE'S
sources{} map -- which proves the key is not a typo, and nothing else. This fetches the
URLs behind them, which is the part that can actually rot.

THREE STATES, and the middle one is the whole point. A URL that does not answer is not a
dead source: it may be a source this network cannot reach. Measured 2026-09-06,
swift.com's press release timed out -- and so did https://www.swift.com/ itself, so the
DOMAIN is unreachable from here, not the article. That is UNCHECKABLE. Recording it as
DEAD would retire a real citation on the strength of our own egress.

Result on the live tape: 4 of 5 named sources answered 200, 1 UNCHECKABLE. Every one of
the 26 rows still carries at least one LIVE source; 14 cite the unreachable one, and all
14 carry a second that answers. Per-row n is 1 or 2, so no row is near the quotable
threshold of 30 and all 26 remain UNMEASURED -- now because the sources were fetched,
rather than because nobody looked.

Exit 0 = every row keeps at least one live source. Exit 1 = some row has none.
Exit 2 = the tape could not be read.
"""
from __future__ import annotations

import argparse
import collections
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TAPE = ROOT / "public" / "interop" / "swift-census.json"
UA = {"User-Agent": "Mozilla/5.0 (compatible; csoai-swift-source-recompute/1)"}


def probe(url: str, timeout: int) -> tuple[str, str]:
    """LIVE / DEAD / UNCHECKABLE for one source URL.

    A 4xx is the page telling us it is gone: DEAD. A timeout or a DNS failure is our
    side failing to ask, and is confirmed against the domain root before being called
    anything at all.
    """
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout)
        return ("LIVE", str(r.status)) if r.status == 200 else ("DEAD", str(r.status))
    except urllib.error.HTTPError as e:
        return ("DEAD", f"HTTP {e.code}") if 400 <= e.code < 500 else ("UNCHECKABLE", f"HTTP {e.code}")
    except Exception as e:
        # Is the whole host unreachable, or just this path? Only the second is the source's fault.
        try:
            host = "/".join(url.split("/")[:3]) + "/"
            urllib.request.urlopen(urllib.request.Request(host, headers=UA), timeout=timeout)
            return "DEAD", f"path unreachable ({type(e).__name__}) while the host answered"
        except Exception:
            return "UNCHECKABLE", f"host unreachable ({type(e).__name__})"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--timeout", type=int, default=35)
    args = ap.parse_args()
    try:
        tape = json.loads(TAPE.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        print(f"UNCHECKABLE: cannot read the tape: {exc}", file=sys.stderr)
        return 2

    sources = tape.get("sources") or {}
    state: dict[str, str] = {}
    print("named sources:")
    for key, meta in sources.items():
        url = meta.get("url") if isinstance(meta, dict) else str(meta)
        st, detail = probe(str(url), args.timeout)
        state[key] = st
        print(f"  {st:12} {key:24} {detail:12} {str(url)[:64]}")

    rows = tape.get("rows") or []
    dist = collections.Counter()
    unsupported = []
    touching_unchecked = 0
    for r in rows:
        keys = r.get("source") or []
        live = sum(1 for k in keys if state.get(k) == "LIVE")
        unck = sum(1 for k in keys if state.get(k) == "UNCHECKABLE")
        dist[live] += 1
        touching_unchecked += unck > 0
        if live == 0:
            unsupported.append((r.get("name"), keys))

    print(f"\nrows: {len(rows)}")
    print(f"  per-row n (live sources): {dict(sorted(dist.items()))}")
    print(f"  rows citing an UNCHECKABLE source: {touching_unchecked}")
    print(f"  rows with NO live source:          {len(unsupported)}")
    for name, keys in unsupported:
        print(f"    {name}: {keys}")
    quotable = sum(1 for n in dist.elements() if n >= 30)
    print(f"  rows at n>=30 (quotable):          {quotable} of {len(rows)}")
    print(
        "\nn here counts SOURCES THAT ANSWERED, not measurements. No row is near 30, so "
        "every row stays UNMEASURED — and now because the sources were fetched rather "
        "than because nobody looked."
    )
    if unsupported:
        print("\n[FAIL] a row whose every source is unreachable carries no public evidence at all.")
        return 1
    print("\n[OK] every row keeps at least one source that answered.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
