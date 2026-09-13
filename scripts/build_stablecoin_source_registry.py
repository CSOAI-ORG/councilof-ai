#!/usr/bin/env python3
"""Full-universe source-lead registry for the stablecoin index.

Extends public/interop/stablecoin-deep-2026-09/sources.json from the top-20
attestation registry to ALL 425 frozen-index identities. For every identity:

  - attestation_page: preserved from the existing hand-registered top-20 rows
    (never overwritten by inference).
  - issuer_site: the DefiLlama per-asset detail `url` field, fetched keyless
    from https://stablecoins.llama.fi/stablecoin/<id> (the list endpoint used
    for the frozen index does NOT carry url — that gap is recorded, not hidden).
  - registration_state:
      ATTESTATION_PAGE_REGISTERED — manually registered disclosure/attestation lead (top-20)
      ISSUER_SITE_REGISTERED      — third-party directory supplied issuer-site lead
      NO_SOURCE_LOCATED           — neither discoverable keyless; method note attached
  - provenance: source_id + retrieved_at for each lead.

Stdlib only. Keyless. £0. --offline reuses the previous fetch cache so the
registry can be rebuilt without network (CI/offline proof).

Usage:
  python3 scripts/build_stablecoin_source_registry.py            # live fetch
  python3 scripts/build_stablecoin_source_registry.py --offline  # reuse cache
"""
from __future__ import annotations

import argparse
import json
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

INDEX_REL = Path("public/interop/stablecoin-universe-2026-09/index.json")
SOURCES_REL = Path("public/interop/stablecoin-deep-2026-09/sources.json")
CACHE_REL = Path("public/interop/stablecoin-deep-2026-09/source-detail-cache.json")
DETAIL_URL = "https://stablecoins.llama.fi/stablecoin/"
USER_AGENT = "councilof-ai-watch/0.1"
GAP_S = 0.4  # polite spacing; keyless public endpoint


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    parser.add_argument("--offline", action="store_true")
    args = parser.parse_args()
    repo = args.repo_root.resolve()

    index = json.loads((repo / INDEX_REL).read_text())
    prior = json.loads((repo / SOURCES_REL).read_text())
    prior_by_id = {str(row["id"]): row for row in prior.get("sources") or []}

    cache_path = repo / CACHE_REL
    if args.offline:
        cache = json.loads(cache_path.read_text())
    else:
        cache = {}
        for row in index["assets"]:
            asset_id = str(row["id"])
            req = urllib.request.Request(DETAIL_URL + asset_id, headers={"User-Agent": USER_AGENT})
            try:
                with urllib.request.urlopen(req, timeout=30) as res:
                    detail = json.loads(res.read())
                cache[asset_id] = {
                    "url": detail.get("url") or None,
                    "retrieved_at": iso_now(),
                    "http": 200,
                }
            except Exception as exc:  # an unreachable source is UNCHECKABLE, never a guess
                cache[asset_id] = {"url": None, "retrieved_at": iso_now(), "http": None, "error": type(exc).__name__}
            time.sleep(GAP_S)
        cache_path.write_text(json.dumps(cache, indent=1, sort_keys=True) + "\n")

    rows = []
    for row in index["assets"]:
        asset_id = str(row["id"])
        existing = prior_by_id.get(asset_id) or {}
        detail = cache.get(asset_id) or {}
        issuer_site = detail.get("url") or existing.get("issuer_site")
        attestation_page = existing.get("attestation_page")  # hand-registered top-20 — never inferred
        if attestation_page:
            state = "ATTESTATION_PAGE_REGISTERED"
        elif issuer_site:
            state = "ISSUER_SITE_REGISTERED"
        else:
            state = "NO_SOURCE_LOCATED"
        rows.append({
            "id": asset_id,
            "name": row.get("name"),
            "symbol": row.get("symbol"),
            "attestation_page": attestation_page,
            "auditor": existing.get("auditor"),
            "cadence_claimed": existing.get("cadence_claimed"),
            # A URL supplied by a directory is a discovery lead. It becomes a
            # primary source only after the page and its publisher are checked.
            "source_of_truth": existing.get("source_of_truth") if attestation_page else None,
            "source_role": (
                "disclosure-or-attestation-lead" if attestation_page else
                "issuer-site-lead" if issuer_site else None
            ),
            "verification_state": (
                "MANUALLY_REGISTERED_UNVERIFIED" if attestation_page else
                "DIRECTORY_LEAD_UNVERIFIED" if issuer_site else
                "NO_LEAD_LOCATED"
            ),
            "issuer_site": issuer_site,
            "registration_state": state,
            "source_id": "defillama-stablecoin-detail" if detail.get("url") else None,
            "source_retrieved_at": detail.get("retrieved_at"),
            "method_note": None if state != "NO_SOURCE_LOCATED" else (
                "Frozen index list endpoint carries no url field; keyless detail endpoint returned no url; "
                "no issuer/auditor page registered. Not a failure verdict — registration pending."
            ),
        })

    counts = {
        "total": len(rows),
        "attestation_page_registered": sum(r["registration_state"] == "ATTESTATION_PAGE_REGISTERED" for r in rows),
        "issuer_site_registered": sum(r["registration_state"] == "ISSUER_SITE_REGISTERED" for r in rows),
        "no_source_located": sum(r["registration_state"] == "NO_SOURCE_LOCATED" for r in rows),
    }
    out = {
        "schema": prior.get("schema"),
        "pack": prior.get("pack"),
        "note": (
            "Source-lead registry for the full 425-identity frozen index. Registered URLs are discovery "
            "leads, not verified primary evidence. attestation_page rows are manually registered (top-20) "
            "and never inferred; issuer_site leads come from the keyless DefiLlama detail endpoint with "
            "per-row retrieval provenance. NO_SOURCE_LOCATED is explicit, never a silent blank. Rebuilt by "
            "scripts/build_stablecoin_source_registry.py."
        ),
        "registry_coverage": counts,
        "sources": rows,
    }
    (repo / SOURCES_REL).write_text(json.dumps(out, indent=2) + "\n")
    print(json.dumps(counts, sort_keys=True))


if __name__ == "__main__":
    main()
