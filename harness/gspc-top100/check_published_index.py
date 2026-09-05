#!/usr/bin/env python3
"""Fail if a PUBLISHED gspc-hub-cards index row disagrees with its signed card body.

Why this exists
---------------
Issue #1155 was fixed in `mill_index_row()` on 2026-09-02 and covered by unit
tests. It stayed live anyway: the 82 rows already on the Hub had been written by
the OLD code and nothing ever rebuilt them. Every row said MEASURED; every card
body said UNMEASURED with `unmeasured: ["signed-pending-verify"]`.

A unit test proves the generator is honest. It cannot prove the published bytes
came from the honest generator. Only fetching them can. That is this check.

The card body is authoritative. A valid signature over a body that says
UNMEASURED means the card genuinely is UNMEASURED — an index row may never
upgrade it. An index that overrides a signature is worse than an unsigned
index, because the signature is what invites trust.

Exit 0 = every published row mirrors its body. Exit 1 = drift (with the rows).
Exit 2 = could not check (network/HTTP). Never silently pass on a fetch failure:
UNCHECKABLE is not VALID.
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

REPO = "csoai/gspc-hub-cards"
BASE = f"https://huggingface.co/datasets/{REPO}/resolve/main/mill-cards/"
INDEXES = ["INDEX", "INDEX-safety", "INDEX-art5-affect", "INDEX-empty3"]
TIMEOUT = 45


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-hub-index-drift"})
    return urllib.request.urlopen(req, timeout=TIMEOUT).read()


def main() -> int:
    rows: list[tuple[str, dict]] = []
    try:
        for name in INDEXES:
            body = fetch(BASE + name + ".jsonl").decode()
            for line in body.splitlines():
                if line.strip():
                    rows.append((name, json.loads(line)))
    except (urllib.error.URLError, OSError, json.JSONDecodeError) as exc:
        print(f"UNCHECKABLE: could not read published indexes: {exc}", file=sys.stderr)
        return 2

    if not rows:
        print("UNCHECKABLE: published indexes are empty", file=sys.stderr)
        return 2

    def load(item: tuple[str, dict]):
        name, row = item
        try:
            return name, row, json.loads(fetch(row["card_url"]).decode())
        except Exception as exc:  # noqa: BLE001 - reported, never swallowed
            return name, row, {"__err__": str(exc)}

    with ThreadPoolExecutor(max_workers=8) as pool:
        loaded = list(pool.map(load, rows))

    unreadable = [(n, r) for n, r, c in loaded if "__err__" in c]
    if unreadable:
        for name, row in unreadable[:10]:
            print(f"UNCHECKABLE: {name}: cannot read card {row.get('card_sha256')}", file=sys.stderr)
        return 2

    drift = []
    for name, row, card in loaded:
        body = card.get("body") if isinstance(card.get("body"), dict) else {}
        body_status = str(body.get("status") or "").upper()
        row_status = str(row.get("status") or "").upper()
        if body_status and row_status != body_status:
            drift.append((name, row, body_status, row_status))

    if drift:
        print(f"[FAIL] {len(drift)} of {len(rows)} published index rows contradict their signed card body.\n")
        for name, row, body_status, row_status in drift[:20]:
            print(
                f"  {name}: {row.get('model')} / {row.get('axis')}\n"
                f"    index says {row_status}, signed body says {body_status}\n"
                f"    {row.get('card_url')}"
            )
        if len(drift) > 20:
            print(f"  ... and {len(drift) - 20} more")
        print(
            "\nFix by REGENERATING the index through mill_index_row() and re-uploading.\n"
            "Never edit a signed card to agree with an index."
        )
        return 1

    print(f"[OK] {len(rows)} published index rows all mirror their signed card body.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
