#!/usr/bin/env python3
"""csoai-sections-cdfgh.py — execute 300-MOVES C, D, F, G, H in one pass.

C. Treasuries/RWA: rwa-trex, rwa-buidl doors + rwa-registry
D. Banks: bank-registry from REAL data (bank-complete / bank-pack jsonl)
F. US: nist-ai-rmf, nist-ai-600-1, sec-ai-guidance doors
G. UK: uk-ai-bill, ico-ai-guidance doors (uk-gdpr exists)
H. x402/A2A: x402-receipts-index + a2a-engine-cards (12 engines)
"""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WK = ROOT / "public" / ".well-known"
INTEROP = ROOT / "public" / "interop"
QUEUE = ROOT / "scripts" / "badger" / "_queue"

ENGINES = [
    "anthropic", "openai", "google", "meta", "mistral", "nvidia",
    "microsoft", "asi-evolve", "oswao", "huggingface", "gspc", "council-os",
]


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def write_door(slug: str, name: str, desc: str, extra: dict | None = None) -> bool:
    path = WK / f"{slug}.json"
    if path.exists():
        return False
    door = {
        "schema": "csoai.well-known/0.1",
        "slug": slug,
        "name": name,
        "description": desc,
        "as_of": now(),
    }
    if extra:
        door.update(extra)
    path.write_text(json.dumps(door, indent=2))
    return True


def load_jsonl_rows(dirname: str, limit: int = 4000) -> list[dict]:
    rows = []
    d = QUEUE / dirname
    if not d.exists():
        return rows
    for f in sorted(d.glob("*.jsonl")):
        for line in f.open():
            try:
                rows.append(json.loads(line))
            except Exception:
                continue
            if len(rows) >= limit:
                return rows
    return rows


def main() -> None:
    print("=" * 60)
    print("  300-MOVES C + D + F + G + H")
    print("=" * 60)
    print()

    # ---- C. RWA / Treasuries ----
    print("[C] RWA / TREASURIES DOORS...")
    c_new = 0
    if write_door("rwa-trex", "T-REX — Tokenized Receivables (ERC-3643)",
                  "Permissioned tokenized receivables on Base/ETH; ERC-3643 standard.", {"standard": "ERC-3643", "x402_sku": "rwa-evidence"}):
        c_new += 1
        print(f"  ✓ rwa-trex.json")
    if write_door("rwa-buidl", "BlackRock BUIDL — Tokenized US Treasuries",
                  "$500M+ tokenized treasury fund; the canonical institutional RWA benchmark.", {"asset": "US Treasuries", "x402_sku": "rwa-evidence"}):
        c_new += 1
        print(f"  ✓ rwa-buidl.json")
    if write_door("rwa-registry", "RWA Registry — Tokenized Treasury Universe",
                  "$26T US Treasuries outstanding; tokenized treasuries = the next $1T. Registers every RWA evidence card."):
        c_new += 1
        print(f"  ✓ rwa-registry.json")
    print(f"  C new doors: {c_new}")

    # ---- D. Banks from real data ----
    print()
    print("[D] BANK REGISTRY (REAL DATA)...")
    rows = load_jsonl_rows("bank-complete") + load_jsonl_rows("bank-pack")
    bank_map: dict[str, dict] = {}
    for r in rows:
        subj = r.get("subject") or {}
        meas = r.get("measurement") or {}
        name = subj.get("bank") or r.get("bank") or r.get("name")
        if not name:
            continue
        key = name if isinstance(name, str) else str(name)
        if key not in bank_map:
            bank_map[key] = {
                "bank": key,
                "country": subj.get("country"),
                "bank_kind": subj.get("bank_kind"),
                "records": 0,
                "chains": set(),
                "stablecoins": set(),
                "statuses": set(),
            }
        b = bank_map[key]
        b["records"] += 1
        if subj.get("chain"):
            b["chains"].add(subj["chain"])
        if subj.get("stablecoin"):
            b["stablecoins"].add(f"{subj['stablecoin']} ({subj.get('stablecoin_issuer', '?')})")
        if meas.get("status"):
            b["statuses"].add(meas["status"])
    banks = sorted(bank_map.values(), key=lambda b: -b["records"])
    for b in banks:
        b["chains"] = sorted(b["chains"])
        b["stablecoins"] = sorted(b["stablecoins"])
        b["statuses"] = sorted(b["statuses"])
    (INTEROP / "bank-registry.json").write_text(json.dumps({
        "schema": "csoai.bank-registry/0.2",
        "as_of": now(),
        "principle": "Every bank covered by the census is a signed evidence opportunity. Bank × chain × stablecoin matrix.",
        "total_banks": len(banks),
        "total_records": sum(b["records"] for b in banks),
        "banks": banks[:100],
    }, indent=2))
    print(f"  ✓ interop/bank-registry.json — {len(banks)} banks, {sum(b['records'] for b in banks)} records")
    # Top-8 bank doors
    for b in banks[:8]:
        slug = f"bank-{b['bank'].lower().replace(' ', '-').replace('.', '')[:24]}"
        if write_door(slug, f"Bank census — {b['bank']}",
                      f"Census evidence for {b['bank']} ({b['country']}) — {b['banks_kind'] if False else b['bank_kind']}."
                      f" {b['records']} records, chains: {', '.join(b['chains'])}.",
                      {"x402_sku": "swift-bank-pack"}):
            print(f"  ✓ {slug}.json")

    # ---- F. US ----
    print()
    print("[F] US DOORS...")
    f_new = 0
    for slug, name, desc, sku in [
        ("nist-ai-rmf", "NIST AI RMF 1.0", "US AI Risk Management Framework — Govern/Map/Measure/Manage.", "standard-nist-ai-rmf"),
        ("nist-ai-600-1", "NIST AI 600-1 (GenAI Profile)", "Generative AI Profile for the NIST AI RMF.", "standard-nist-ai-rmf"),
        ("sec-ai-guidance", "SEC AI Guidance", "US SEC guidance on AI disclosure for public companies.", "standard-sec-ai"),
    ]:
        if write_door(slug, name, desc, {"x402_sku": sku}):
            f_new += 1
            print(f"  ✓ {slug}.json")
    print(f"  F new doors: {f_new}")

    # ---- G. UK ----
    print()
    print("[G] UK DOORS...")
    g_new = 0
    for slug, name, desc, sku in [
        ("uk-ai-bill", "UK AI Bill", "UK AI legislation in Parliament — frontier + transparency duties.", "standard-uk-ai"),
        ("ico-ai-guidance", "ICO AI Guidance", "UK Information Commissioner's Office AI accountability framework.", "standard-gdpr"),
    ]:
        if write_door(slug, name, desc, {"x402_sku": sku}):
            g_new += 1
            print(f"  ✓ {slug}.json")
    print(f"  G new doors: {g_new}")

    # ---- H. x402 receipts + A2A engine cards ----
    print()
    print("[H] X402 RECEIPTS INDEX + A2A ENGINE CARDS...")
    (INTEROP / "x402-receipts-index.json").write_text(json.dumps({
        "schema": "csoai.x402-receipts-index/0.1",
        "as_of": now(),
        # OWNER RULING 2026-09-06: no prices on any page. An amount appears ONLY inside a
        # resource's own 402 challenge (accepts[].amount) — never in a catalog, never in prose,
        # never here. The shipped artefact already had its price_usdc fields stripped; this
        # producer still carried them, so the next run would have put them back on a public
        # surface. Fixing the artefact without the producer is not fixing it.
        "principle": "Each SKU below is a paid artefact behind an x402 door. Amounts live only in that door's 402 challenge. Verification is free forever and a grade is never sold.",
        "settlement": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
        # swift-bank-pack is GONE, not silently repriced: /api/swift answers 200 with
        # kind "reader" — a free census, never a 402 — so there is no door to buy it through.
        # A SKU whose door does not exist is an offer we cannot honour. Opening a SWIFT door is
        # a product decision with a deliverable attached; it is not mine to invent, and listing
        # it meanwhile is the overclaim.
        "skus": [
            {"sku": "commission-card", "door": "/api/request-attestation"},
            {"sku": "evidence-bundle", "door": "/api/evidence-bundle?obligation=<id>&subject=<model>&bundle=1"},
            {"sku": "signed-data-feed", "door": "/api/eunomia-data"},
            {"sku": "xrpl-asset-evidence", "door": "/api/rwa/evidence"},
            {"sku": "provider-diff-feed", "door": "/api/feeds/provider-diff"},
            {"sku": "receipts-batch", "door": "/api/receipts/batch"},
            {"sku": "eu-ai-act-pack", "door": "/api/evidence-bundle?obligation=article-50|article-53&subject=<model>&bundle=1"},
        ],
    }, indent=2))
    print(f"  ✓ interop/x402-receipts-index.json (7 SKUs, each with a door; no amounts)")

    (INTEROP / "a2a-engine-cards.json").write_text(json.dumps({
        "schema": "csoai.a2a-engine-cards/0.1",
        "as_of": now(),
        "principle": "Every engine is a discoverable A2A agent card.",
        "agents": [
            {
                "engine": e,
                "agent_card": f"https://councilof.ai/.well-known/{e}.json",
                "a2a_discovery": f"https://councilof.ai/.well-known/agents/{e}.json",
                "mcp": f"https://councilof.ai/mcp/{e}.json",
            }
            for e in ENGINES
        ],
    }, indent=2))
    print(f"  ✓ interop/a2a-engine-cards.json ({len(ENGINES)} engines)")

    print()
    print("=" * 60)
    print("  C+D+F+G+H complete")
    print("=" * 60)


if __name__ == "__main__":
    main()
