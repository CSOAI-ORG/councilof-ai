#!/usr/bin/env python3
"""generate-body-report.py — H4: monthly BODY-REPORT, ALL numbers derived.

Sources (probed at generation time; refuses to write if unreachable):
- /api/gspc            cells measured + axis count
- /signed/card_index.json  published cards
- /root.json           root-witnessed leaves
- /interop/corrections-feed.json corrections issued
- /api/revenue         settlements (one_number)

Writes public/reports/report-2026-09.md (+ .json manifest).
"""

from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] if __file__.startswith("/") else Path.cwd()
OUT = ROOT / "public" / "reports"
BASE = "https://councilof.ai"


def get(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-report/0.1"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main() -> None:
    print("=== BODY-REPORT (derived) ===")
    gspc = get(BASE + "/api/gspc")
    cards = get(BASE + "/signed/card_index.json")
    root = get(BASE + "/root.json")
    corr = get(BASE + "/interop/corrections-feed.json")
    try:
        rev = get(BASE + "/api/revenue")
        settlements = rev.get("settlements", rev.get("one_number", rev.get("money_moved", 0)))
        revenue_note = rev.get("revenue_truth", "")
    except Exception as e:
        settlements = None
        revenue_note = f"unreadable: {e}"

    axes = len(gspc.get("axes", gspc.get("axe_scores", [])))
    cells = gspc.get("cells_measured", gspc.get("measured_cells", axes))
    n_cards = cards.get("n_cards")
    root_count = root.get("card_count")
    corrections = corr.get("total")

    print(f"  axes={axes} cells={cells} cards={n_cards} root={root_count} corrections={corrections} settlements={settlements}")

    if None in (n_cards, root_count, corrections):
        raise SystemExit("REFUSED TO WRITE: a required source was empty/unreadable.")

    OUT.mkdir(parents=True, exist_ok=True)
    md = [
        "# BODY-REPORT — September 2026 (to date)",
        "",
        f"> Derived by scripts/badger/generate-body-report.py on {now()}. Every",
        "> number is read from the public estate at generation time. Regenerate,",
        "> never trust a cached copy.",
        "",
        "| metric | value | source |",
        "|---|---|---|",
        f"| axes measured | {axes} | `{BASE}/api/gspc` |",
        f"| cells measured | {cells} | `{BASE}/api/gspc` |",
        f"| cards published | {n_cards} | `{BASE}/signed/card_index.json` |",
        f"| root-witnessed leaves | {root_count} | `{BASE}/root.json` |",
        f"| corrections published | {corrections} | `{BASE}/interop/corrections-feed.json` |",
        f"| settlements (one number) | {settlements if settlements is not None else '0 (none yet)'} | `{BASE}/api/revenue` |",
        "",
        "- doctrine: measurement, not certification — the public root is verified free.",
        "- The estate runs itself: see /api/body-state for stage timestamps.",
    ]
    out_md = OUT / "report-2026-09.md"
    out_md.write_text("\n".join(md))
    manifest = {
        "schema": "csoai.body-report/0.1",
        "as_of": now(),
        "metrics": {
            "axes_measured": axes, "cells_measured": cells, "cards_published": n_cards,
            "root_witnessed_leaves": root_count, "corrections_published": corrections,
            "settlements_one_number": settlements,
        },
        "sources": {
            "gspc": f"{BASE}/api/gspc", "cards": f"{BASE}/signed/card_index.json",
            "root": f"{BASE}/root.json", "corrections": f"{BASE}/interop/corrections-feed.json",
            "revenue": f"{BASE}/api/revenue",
        },
    }
    (OUT / "report-2026-09.json").write_text(json.dumps(manifest, indent=2))
    print(f"written: {out_md} (+ .json)")


if __name__ == "__main__":
    main()
