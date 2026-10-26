#!/usr/bin/env python3
"""generate-partner-offer-docs.py — B07 + B08: partner shortlist and per-SKU offers, DERIVED.

B07 PARTNERS-SHORTLIST.md: institutions ranked by evidence density — the query is
the code (curl the live registries, count cards, take top 10).
B08 OFFER-<sku>.md: one page per SKU derived from the live probes in
docs/product/<sku>.md (recorded observations and scoped outputs). Never types a price.
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



def product_facts(sku: str, text: str) -> dict | None:
    """Read the queued H1 observation contract; never infer paid delivery."""
    known = {
        "commission-card", "evidence-bundle", "eu-ai-act-pack", "swift-bank-pack",
        "xrpl-asset-evidence", "signed-data-feed", "provider-diff-feed",
        "receipts-batch", "art50-marking-evidence",
    }
    if sku not in known:
        return None
    identities = re.findall(
        r"^`([^`\n]+)` — endpoint observations recorded on [^\n]+; "
        r"not a current-availability or delivery claim\.$", text, re.MULTILINE,
    )
    if identities != [sku]:
        return None

    def section(title: str) -> str | None:
        matches = list(re.finditer(r"^## " + re.escape(title) + r"$", text, re.MULTILINE))
        if len(matches) != 1:
            return None
        tail = text[matches[0].end():].lstrip("\n")
        end = re.search(r"^## ", tail, re.MULTILINE)
        return (tail[:end.start()] if end else tail).strip()

    door = section("402 door")
    observed = section("Unpaid preview or challenge observation")
    scope = section("Buyer and paid output scope")
    if door is None or observed is None or scope is None:
        return None
    resource = re.fullmatch(
        r"`[^`\n]+` — observed status \*\*(None|[1-5][0-9]{2})\*\*\n"
        r"\(([0-9]+) B\) — [^\n]+", door,
    )
    preview = re.fullmatch(
        r"`[^`\n]+` — status \*\*(None|[1-5][0-9]{2})\*\*, "
        r"\*\*([0-9]+) bytes\*\*, `sha256 [0-9a-f]{0,16}…`"
        r"\n\n```json\n(.*?)\n```\n\n([^\n]+)", observed, re.DOTALL,
    )
    if resource is None or preview is None:
        return None
    # A fence or heading inside a raw sample must not become an offer fact.
    if any(line.startswith("```") or line.startswith("## ") for line in preview.group(3).splitlines()):
        return None
    verdict = re.fullmatch(
        r"\*\*(UNPAID RESPONSE OBSERVED\.|PAYMENT CHALLENGE OBSERVED\.|"
        r"NOT ADVERTISED — 402 without a parseable accepts\[\]\.|UNVERIFIED\.)\*\*([^\n]*)",
        preview.group(4),
    )
    if verdict is None:
        return None
    label = verdict.group(1)
    if label == "UNPAID RESPONSE OBSERVED." and not (
        preview.group(1) == "200" and int(preview.group(2)) > 0
    ):
        return None
    if label in {"PAYMENT CHALLENGE OBSERVED.", "NOT ADVERTISED — 402 without a parseable accepts[]."} and preview.group(1) != "402":
        return None
    # Mirror the exact upstream verdict grammar; a known label alone is insufficient.
    observed_verdict = preview.group(4)
    if label == "UNPAID RESPONSE OBSERVED.":
        if observed_verdict != (
            "**UNPAID RESPONSE OBSERVED.** A non-empty response was recorded. "
            "Advertised under the existing gate; paid delivery is not established."
        ):
            return None
    elif label == "NOT ADVERTISED — 402 without a parseable accepts[].":
        if observed_verdict != (
            "**NOT ADVERTISED — 402 without a parseable accepts[].** The door answers 402 but the"
            " body does not parse as an x402 challenge with payment options, so a buyer cannot"
            " act on it."
        ):
            return None
    elif label == "UNVERIFIED.":
        if observed_verdict != (
            f"**UNVERIFIED.** Status {preview.group(1)}, {preview.group(2)} bytes —"
            " probe the door before this SKU is offered."
        ):
            return None
    else:
        challenge = re.fullmatch(
            r"\*\*PAYMENT CHALLENGE OBSERVED\.\*\* Advertised under the existing gate\. "
            r"The challenge parses as x402 v(None|[0-9]+) carrying ([1-9][0-9]*) accepts\[\] entr(y|ies)"
            r" \(([1-9][0-9]*) bytes\)\. Parsing accepts\[\] establishes payment options only\. "
            r"(?:An unpaid csoai\.preview object is present; its contents may be empty or uncheckable\. |"
            r"No csoai\.preview object was identified by this parser\. )"
            r"Neither observation establishes a paid artifact, a new measurement or buyer acceptance\.",
            observed_verdict,
        )
        if challenge is None or challenge.group(4) != preview.group(2):
            return None
        if challenge.group(3) != ("y" if challenge.group(2) == "1" else "ies"):
            return None
    boundary = "Payment, returned artifact bytes, verification, receipt by the buyer and acceptance remain separate."
    if "Source scope: [" not in scope or not scope.endswith(boundary):
        return None
    return {
        "preview_status": preview.group(1), "preview_bytes": preview.group(2),
        "resource_status": resource.group(1), "resource_bytes": resource.group(2),
        "observation": preview.group(4), "scope": scope,
    }


def offer_doc(sku: str, text: str) -> str:
    facts = product_facts(sku, text)
    if facts is None:
        facts = {
            "preview_status": "UNVERIFIED", "preview_bytes": "UNVERIFIED",
            "resource_status": "UNVERIFIED", "resource_bytes": "UNVERIFIED",
            "observation": "**UNVERIFIED.** The source document does not match the supported recorded-observation contract.",
            "scope": "No source-qualified output scope was carried into this offer. Inspect the source document and resolve its contract before requesting payment.",
        }
    return "\n".join([
        f"# Offer — {sku}", "",
        f"> Derived from recorded endpoint observations in docs/product/{sku}.md; this is not a current-availability or paid-delivery claim.",
        "> Review payment terms in the actual challenge before any paid request.", "",
        "| recorded fact | value |", "|---|---|",
        f"| preview status | {facts['preview_status']} |",
        f"| preview bytes | {facts['preview_bytes']} |",
        f"| resource status | {facts['resource_status']} |",
        f"| resource bytes | {facts['resource_bytes']} |", "",
        facts["observation"], "",
        "## Buyer and paid output scope", facts["scope"], "",
        "## Verify and request",
        f"Verification is free at {BASE}/gspc-verify. Check each record's supported format, signing status and stated limits; signature validity and root inclusion are separate.",
        "Review the unpaid preview or challenge first. Payment options do not establish availability, paid delivery, a new measurement or buyer acceptance.",
        "Owner approves any send; no mass-send.", "",
    ])


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
        offer = offer_doc(sku, text)
        (OUT / f"OFFER-{sku}.md").write_text(offer)
        print(f"  ✓ OFFER-{sku}.md (recorded observation; inspect source scope)")


if __name__ == "__main__":
    main()
