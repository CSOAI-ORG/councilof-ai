#!/usr/bin/env python3
"""csoai-master-catalog.py — THE MASTER CATALOG.

Lane-doable: walks every catalog/list/index/manifest in the estate,
merges them into one master catalog with cross-references, and emits
a single JSON + Markdown file that shows what we have + what's missing.

Catalogs mined:
  - public/catalog.json (the storefront)
  - public/ecosystem.json (23 regulators)
  - public/.well-known/* (44 discovery docs)
  - public/openapi.json (66 paths)
  - public/llms.txt + llms-sitemap.xml
  - public/root.json (signed root)
  - public/subdomains/* (7 subdomain pages)
  - functions/api/*.ts (the endpoints)
  - scripts/badger/_queue/* (the harvested atoms)
  - public/sitemap.xml (the index)

Output:
  - scripts/badger/_queue/master-catalog/master-catalog.json
  - scripts/badger/_queue/master-catalog/master-catalog.md
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent.parent / "public"
OUT = HERE / "_queue" / "master-catalog"
DID = "did:web:csoai.org#card-attestation-1"


def main():
    ap = argparse.ArgumentParser(description="Master catalog hunter.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — MASTER CATALOG (every list, index, manifest)")
    print("================================================================")
    print()

    OUT.mkdir(parents=True, exist_ok=True)

    catalog = {
        "kind": "csoai.master-catalog",
        "issuer": DID,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "catalogs": {},
        "surfaces": {},
        "queue": {},
        "totals": {},
    }

    # 1. Storefront catalog
    p = PUBLIC / "catalog.json"
    if p.exists():
        c = json.loads(p.read_text())
        catalog["catalogs"]["storefront"] = {
            "path": "public/catalog.json",
            "schema": c.get("schema"),
            "n_products": len(c.get("products", [])),
            "products": [pr["id"] for pr in c.get("products", [])],
        }
        print(f"  ✓ storefront: {len(c.get('products', []))} products")

    # 2. Ecosystem (regulators)
    p = PUBLIC / "ecosystem.json"
    if p.exists():
        c = json.loads(p.read_text())
        catalog["catalogs"]["ecosystem"] = {
            "path": "public/ecosystem.json",
            "n_regulators": c.get("count", 0),
            "regulators": [r["id"] for r in c.get("regulators", [])],
        }
        print(f"  ✓ ecosystem: {c.get('count')} regulators")

    # 3. Discovery docs
    wk = PUBLIC / ".well-known"
    discovery = sorted([f.name for f in wk.glob("*.json")])
    catalog["catalogs"]["discovery"] = {
        "path": "public/.well-known/*.json",
        "n_docs": len(discovery),
        "docs": discovery,
    }
    print(f"  ✓ discovery: {len(discovery)} docs at /.well-known/")

    # 4. OpenAPI
    p = PUBLIC / "openapi.json"
    if p.exists():
        c = json.loads(p.read_text())
        paths = c.get("paths", {})
        catalog["catalogs"]["openapi"] = {
            "path": "public/openapi.json",
            "n_paths": len(paths),
            "paths": sorted(paths.keys()),
        }
        print(f"  ✓ openapi: {len(paths)} paths")

    # 5. llms.txt + sitemap
    p = PUBLIC / "llms.txt"
    if p.exists():
        catalog["catalogs"]["llms_txt"] = {"path": "public/llms.txt", "size_b": p.stat().st_size}
        print(f"  ✓ llms.txt: {p.stat().st_size}B")
    p = PUBLIC / "llms-sitemap.xml"
    if p.exists():
        catalog["catalogs"]["llms_sitemap"] = {"path": "public/llms-sitemap.xml", "size_b": p.stat().st_size}
        print(f"  ✓ llms-sitemap.xml: {p.stat().st_size}B")

    # 6. Root
    p = PUBLIC / "root.json"
    if p.exists():
        c = json.loads(p.read_text())
        catalog["catalogs"]["root"] = {
            "path": "public/root.json",
            "as_of": c.get("as_of"),
            "card_count": c.get("card_count"),
            "merkle_root": (c.get("merkle_root") or "")[:16] + "…",
            "signed": bool(c.get("sig_ed25519")),
        }
        print(f"  ✓ root.json: {c.get('card_count')} cards, signed={bool(c.get('sig_ed25519'))}")

    # 7. Subdomains
    sd = PUBLIC / "subdomains"
    if sd.exists():
        subs = sorted([f.name for f in sd.iterdir() if f.is_dir()])
        catalog["catalogs"]["subdomains"] = {
            "path": "public/subdomains/*/",
            "n": len(subs),
            "slugs": subs,
        }
        print(f"  ✓ subdomains: {len(subs)} (proofs, issuance, verifier, marketplace, blog, press, dashboards)")

    # 8. The queue — every harvester's atoms
    q = HERE / "_queue"
    if q.exists():
        queue_dirs = [d for d in q.iterdir() if d.is_dir()]
        for d in sorted(queue_dirs):
            files = sorted(d.glob("*.jsonl"))
            if not files:
                continue
            n = sum(sum(1 for _ in open(f)) for f in files)
            catalog["queue"][d.name] = {
                "n_files": len(files),
                "n_atoms": n,
            }
        print(f"  ✓ queue: {len(catalog['queue'])} harvester dirs, "
              f"{sum(s['n_atoms'] for s in catalog['queue'].values())} total atoms")

    # 9. Functions — the endpoints
    fn_dir = HERE.parent.parent / "functions" / "api"
    if fn_dir.exists():
        endpoints = sorted([f.stem for f in fn_dir.glob("*.ts") if not f.stem.startswith("_") and not f.stem.endswith(".test")])
        catalog["surfaces"]["functions"] = {
            "path": "functions/api/*.ts",
            "n": len(endpoints),
            "endpoints": endpoints,
        }
        print(f"  ✓ functions: {len(endpoints)} endpoints")

    # 10. Sitemap
    p = PUBLIC / "sitemap.xml"
    if p.exists():
        body = p.read_text()
        catalog["surfaces"]["sitemap"] = {
            "path": "public/sitemap.xml",
            "n_urls": body.count("<url>"),
        }
        print(f"  ✓ sitemap.xml: {body.count('<url>')} URLs")

    # Totals
    catalog["totals"] = {
        "n_catalogs": len(catalog["catalogs"]),
        "n_discovery_docs": len(discovery),
        "n_openapi_paths": len(catalog["catalogs"].get("openapi", {}).get("paths", [])),
        "n_functions": len(catalog["surfaces"].get("functions", {}).get("endpoints", [])),
        "n_sitemap_urls": catalog["surfaces"].get("sitemap", {}).get("n_urls", 0),
        "n_subdomains": len(catalog["catalogs"].get("subdomains", {}).get("slugs", [])),
        "n_regulators": catalog["catalogs"].get("ecosystem", {}).get("n_regulators", 0),
        "n_products": catalog["catalogs"].get("storefront", {}).get("n_products", 0),
        "n_queue_atoms": sum(s["n_atoms"] for s in catalog["queue"].values()),
        "n_queue_dirs": len(catalog["queue"]),
    }

    # Emit
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    json_path = OUT / f"master-catalog-{stamp}.json"
    md_path = OUT / f"master-catalog-{stamp}.md"
    json_path.write_text(json.dumps(catalog, indent=2, sort_keys=True))

    # Markdown version
    md = []
    md.append("# CSOAI — Master Catalog")
    md.append("")
    md.append(f"Generated: {catalog['as_of']}")
    md.append("")
    md.append("## Totals")
    md.append("")
    for k, v in catalog["totals"].items():
        md.append(f"- **{k}**: {v}")
    md.append("")
    md.append("## Catalogs")
    md.append("")
    for name, c in catalog["catalogs"].items():
        md.append(f"### {name}")
        if isinstance(c, dict):
            for k, v in c.items():
                if k == "paths" and isinstance(v, list):
                    md.append(f"- **{k}**: {len(v)} items")
                elif k in ("docs", "regulators", "products", "slugs") and isinstance(v, list):
                    md.append(f"- **{k}**: {', '.join(v[:8])}{'…' if len(v) > 8 else ''}")
                else:
                    md.append(f"- **{k}**: {v}")
        md.append("")
    md.append("## Surfaces")
    md.append("")
    for name, s in catalog["surfaces"].items():
        md.append(f"### {name}")
        if isinstance(s, dict):
            for k, v in s.items():
                if k == "endpoints" and isinstance(v, list):
                    md.append(f"- **{k}**: {len(v)} ({', '.join(v[:5])}…)")
                else:
                    md.append(f"- **{k}**: {v}")
        md.append("")
    md.append("## Queue (every harvester)")
    md.append("")
    for d, s in sorted(catalog["queue"].items(), key=lambda x: -x[1]["n_atoms"]):
        md.append(f"- **{d}**: {s['n_atoms']} atoms in {s['n_files']} files")
    md.append("")
    md.append("---")
    md.append("")
    md.append("Doctrine: measurement, not certification. Anyone can re-check.")
    md_path.write_text("\n".join(md))

    print()
    print(f"  JSON: {json_path.relative_to(HERE.parent.parent)}")
    print(f"  MD:   {md_path.relative_to(HERE.parent.parent)}")
    print()
    print(f"  TOTAL: {catalog['totals']['n_catalogs']} catalogs, "
          f"{catalog['totals']['n_discovery_docs']} discovery docs, "
          f"{catalog['totals']['n_openapi_paths']} openapi paths, "
          f"{catalog['totals']['n_functions']} functions, "
          f"{catalog['totals']['n_sitemap_urls']} sitemap URLs, "
          f"{catalog['totals']['n_queue_atoms']} queued atoms")
    return 0


if __name__ == "__main__":
    sys.exit(main())
