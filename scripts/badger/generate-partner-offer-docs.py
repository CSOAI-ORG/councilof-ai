#!/usr/bin/env python3
"""generate-partner-offer-docs.py — B07 + B08: partner shortlist and per-SKU offers, DERIVED.

B07 PARTNERS-SHORTLIST.md: institutions ranked by evidence density — the query is
the code (curl the live registries, count cards, take top 10).
B08 OFFER-<sku>.md: one page per SKU derived from the live probes in
docs/product/<sku>.md (deliverable status). Never types a price.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] if __file__.startswith("/") else Path.cwd()
OUT = ROOT / "docs" / "product"
BASE = "https://councilof.ai"


def get(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-partners/0.1"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def main() -> None:
    print("=== B07/B08 derived docs ===")

    # B08 reads only local docs; B07 probes three live registries. Regenerating an offer page
    # should not cost self-probes — the governor caps a lane at 20 an hour (G5) and this script
    # was silently spending three of them to rewrite files it could rewrite offline.
    b08_only = "--b08-only" in sys.argv
    if b08_only:
        print("  --b08-only: skipping B07 (no network, no self-probes)")

    # B07 — evidence density from live registries
    bank = {} if b08_only else get(BASE + "/api/bank-complete")
    banks = sorted(bank.get("banks", []), key=lambda b: -(b.get("records") or 0))[:10]
    xrpl = {} if b08_only else get(BASE + "/interop/xrpl-issuer-registry.json")
    issuers = sorted(xrpl.get("issuers", []), key=lambda i: -(i.get("evidence_cards") or 0))[:10]
    diff = {} if b08_only else get(BASE + "/api/feeds/provider-diff")
    targets = diff.get("targets", [])
    prov = {}
    for t in targets:
        p = t.get("provider_name") or t.get("provider")
        prov.setdefault(p, {"surfaces": 0, "changes": 0})
        prov[p]["surfaces"] += 1
        prov[p]["changes"] += t.get("n_changes") or 0
    aiprov = sorted(prov.items(), key=lambda kv: (-kv[1]["changes"], -kv[1]["surfaces"]))[:10]

    md = [
        "# PARTNERS-SHORTLIST — first 10 by evidence density (B07)",
        "",
        f"> Derived by scripts/badger/generate-partner-offer-docs.py on {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}.",
        "> Query = the code below; rerun after any registry change. Owner sends; no mass-send.",
        "",
        "## Banks (census evidence records — query: GET /api/bank-complete, sort by records desc, top 10)",
        "",
        "| bank | records | kind | chain |",
        "|---|---|---|---|",
    ]
    for b in banks:
        chains = ", ".join((b.get("chains") or [])[:2])
        md.append(f"| {b.get('bank')} | {b.get('records')} | {b.get('bank_kind')} | {chains} |")

    md += ["", "## AI providers (diff-feed churn — query: GET /api/feeds/provider-diff, top by changes)", "", "| provider | surfaces | changes since capture |", "|---|---|---|"]
    for p, s in aiprov:
        md.append(f"| {p} | {s['surfaces']} | {s['changes']} |")

    md += ["", "## XRPL issuers (evidence cards — query: /interop/xrpl-issuer-registry.json)", "", "| issuer | evidence cards | holders |", "|---|---|---|"]
    for i in issuers:
        md.append(f"| {i.get('name')} | {i.get('evidence_cards')} | {i.get('holder_count')} |")

    md += [
        "",
        "## Sequence for the owner (draft)",
        "1. Pick one partner from each row set (start with one bank + one AI provider).",
        "2. I hand over the signed diff for their waterline (provider-diff-feed, delta since receipt).",
        "3. No mass send: one recipient, one receipt, one signed delta.",
    ]
    if b08_only:
        # Without the B07 probes every table above is empty, and writing that would REPLACE a
        # real shortlist with a blank one. Skip the write; --b08-only means offer docs only.
        print("  – PARTNERS-SHORTLIST.md untouched (--b08-only: no data was fetched to write it)")
    else:
        (OUT / "PARTNERS-SHORTLIST.md").write_text("\n".join(md))
        print(f"  ✓ PARTNERS-SHORTLIST.md ({len(banks)} banks / {len(aiprov)} providers / {len(issuers)} issuers)")

    # B08 — one-page offer per SKU derived from the live probe facts in docs/product/<sku>.md
    SKUS = [
        "commission-card", "evidence-bundle", "eu-ai-act-pack", "swift-bank-pack",
        "xrpl-asset-evidence", "signed-data-feed", "provider-diff-feed", "receipts-batch",
        # 8 conformant Bazaar hosts are mapped to art50-marking-evidence and it has no offer page.
        # The door is live. This entry emits one as soon as docs/product/art50-marking-evidence.md
        # exists; until then the loop prints "! missing — skip", which is the honest state.
        "art50-marking-evidence",
    ]
    for sku in SKUS:
        f = OUT / f"{sku}.md"
        if not f.exists():
            print(f"  ! {sku}.md missing — skip")
            continue
        text = f.read_text()
        # derived facts: status + bytes from the doc's preview line
        m = re.search(r"status \*\*(\d+)\*\*, \*\*(\d+) bytes\*\*", text)
        status, bytes_n = (m.group(1), m.group(2)) if m else ("?", "?")
        mres = re.search(r"live status \*\*(\d+)\*\*", text)
        res_status = mres.group(1) if mres else "?"
        # A PAID DOOR ANSWERS 402. That is the door working, not the door failing.
        # This line used to read: 200 and bytes>0 -> deliverable, ELSE "NOT DELIVERABLE today".
        # Every correctly-behaving x402 door therefore came out NOT DELIVERABLE, because a 402
        # challenge is not a 200. It published that verdict about commission-card, which is the
        # SKU 95 of the 394 conformant Bazaar hosts are mapped to in csoai/x402-bazaar-conformance,
        # and SKU-INDEX repeated it. Probed with the `subject` its own bazaar extension declares
        # REQUIRED, that door returns the signed cards, their hashes and corpus_as_of in the FREE
        # preview. Conflating "the preview is free and returns 200" with "the door can deliver"
        # is what produced a false negative about our own product.
        if status == "200" and int(bytes_n) > 0:
            deliverable = "FREE PREVIEW returns content; paid artefact at the 402"
        elif status == "402":
            deliverable = "PAID DOOR — the free preview IS the 402 challenge; settle unlocks the artefact"
        elif status == "?":
            deliverable = "UNKNOWN — the source doc records no probe; run the probe that writes it"
        else:
            deliverable = f"UNEXPECTED — preview returned {status}; probe the door before offering it"
        offer = [
            f"# Offer — {sku}",
            "",
            f"> One page. Derived from live probes ({BASE}); full description: docs/product/{sku}.md.",
            "> Prices are quoted at the 402 door — never here.",
            "",
            "| fact | value |",
            "|---|---|",
            f"| free preview | HTTP {status} · {bytes_n} B |",
            f"| paid door | HTTP {res_status} (settle unlocks) |",
            f"| deliverable | {deliverable} |",
            "",
            "## What you receive",
            f"The artefact described in docs/product/{sku}.md: signed cards, assembled server-side from",
            "already-signed evidence — never a manufactured grade. Verification is free forever",
            "((https://councilof.ai/gspc-verify); every leaf checks against the public root.",
            "",
            "## Ask",
            f"Request the free preview now; the paid artefact follows at the 402 with the price in the",
            "door. Owner approves the send; I do not mass-send.",
            "",
        ]
        (OUT / f"OFFER-{sku}.md").write_text("\n".join(offer))
        print(f"  ✓ OFFER-{sku}.md ({deliverable[:40]})")


if __name__ == "__main__":
    main()
