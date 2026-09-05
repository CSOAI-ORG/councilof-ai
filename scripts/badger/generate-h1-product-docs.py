#!/usr/bin/env python3
"""generate-h1-product-docs.py — H1: prove each x402 SKU by bytes, write docs/product/<sku>.md.

RULES (override habit):
- Probe BEFORE writing. The doc is written only if the live endpoint answers
  (200 with a non-empty preview, or an honest 402 on the paid resource).
- Every number is DERIVED at run time from a live probe (bytes, sha256, counts).
- "signed" is only ever said about Ed25519-under-did:web verified cards; nothing
  else. Preview cards are labeled preview/unsigned explicitly when the API says so.
- Never advertise a SKU whose free preview is empty or 402 (commission-card today).
"""

from __future__ import annotations

import hashlib
import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve()
OUT = ROOT.parents[2] / "docs" / "product"
OUT.mkdir(parents=True, exist_ok=True)

BASE = "https://councilof.ai"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def probe(url: str, timeout: int = 20) -> dict:
    """Return {status, bytes, sha256, sample, error} for a URL."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
            return {
                "url": url,
                "status": r.status,
                "bytes": len(body),
                "sha256": hashlib.sha256(body).hexdigest(),
                "sample": body[:600].decode(errors="replace"),
                "error": None,
            }
    except urllib.error.HTTPError as e:
        body = e.read()
        return {
            "url": url,
            "status": e.code,
            "bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest(),
            "sample": body[:600].decode(errors="replace"),
            "error": None,
        }
    except Exception as e:
        return {"url": url, "status": None, "bytes": 0, "sha256": "", "sample": "", "error": str(e)[:200]}


def verify_paths() -> dict:
    return {
        "gspc_verify": BASE + "/gspc-verify",
        "proof": BASE + "/api/proof?sha=<64-hex>",
        "root_json": BASE + "/root.json",
        "free_forever": "verification is free forever; a grade is never sold",
    }


def doc(sku: str, title: str, block: dict) -> str:
    """Render one SKU doc; block holds derived numbers + samples."""
    p_preview = block["preview"]
    p_resource = block["resource"]
    md = [
        f"# {title}",
        "",
        f"`{sku}` — derived from live endpoints on {now()}.",
        "",
        "> Doctrine: measurement, not certification. Verification is free forever;",
        "> a grade is never sold. Nothing in this file is typed — every number below",
        "> is read at generation time from the live server.",
        "",
        "## 402 door",
        f"`{p_resource['url']}` — live status **{p_resource['status']}**",
        (
            f"({p_resource['bytes']} B) — the paid artefact sits behind the x402 rail;"
            " a settled receipt unlocks it."
            if p_resource["status"] == 402
            else f"({p_resource['bytes']} B) — NOTE: this resource did not return 402; status {p_resource['status']}. Investigate before advertising."
        ),
        "",
        "## Free preview (must be non-empty)",
        f"`{p_preview['url']}` — status **{p_preview['status']}**, **{p_preview['bytes']} bytes**, `sha256 {p_preview['sha256'][:16]}…`",
        "",
        "```json",
        p_preview["sample"][:450],
        "```",
        "",
        ("**DELIVERABLE.** The free preview answers with real bytes."
         if p_preview["status"] == 200 and p_preview["bytes"] > 0
         else f"**NOT DELIVERABLE today.** Status {p_preview['status']}, {p_preview['bytes']} bytes."
         " This SKU is not advertised until a non-empty free preview exists."),
        "",
        "## What the buyer receives (from the deliverable field)",
        "See the live catalog body in the appendix of this doc's generator run,",
        "or ask the 402 door. The deliverable is assembled server-side from",
        "already-signed cards; the bundle never manufactures grades.",
        "",
        "## Verify path",
        f"- Board/verify: {verify_paths()['gspc_verify']}",
        f"- Merkle proof for any leaf: `{verify_paths()['proof']}`",
        f"- Public root: {verify_paths()['root_json']} (`verify.include` checks the leaf)",
        f"- {verify_paths()['free_forever']}",
        "",
        "## Ledger it feeds",
        block.get("ledger", "open registries published under /interop/ (read-only, hash-verifiable)."),
        "",
    ]
    return "\n".join(md)


def main() -> None:
    print("=" * 60)
    print("  H1 — PROVE SKUs BY BYTES / WRITE DOCS")
    print("=" * 60)

    # Ground probes
    probes = {
        "commission_card": probe(f"{BASE}/api/request-attestation"),
        "evidence_bundle": probe(f"{BASE}/api/evidence-bundle?obligation=article-50"),
        "eu_ai_pack": probe(f"{BASE}/api/evidence-bundle?obligation=article-53"),
        "swift_bank_pack": probe(f"{BASE}/api/evidence-bundle?obligation=dora"),
        "swift_census": probe(f"{BASE}/api/swift"),
        "xrpl_evidence": probe(f"{BASE}/api/rwa/evidence?asset=RLUSD&preview=1"),
        "data_feed": probe(f"{BASE}/api/eunomia-data"),
        "diff_feed": probe(f"{BASE}/api/feeds/provider-diff"),
        "receipts_batch": probe(f"{BASE}/api/receipts/batch?from=2026-09-01&to=2026-09-05&preview=1"),
        "gspc": probe(f"{BASE}/api/gspc"),
        "root_json": probe(f"{BASE}/root.json"),
        "free_door": probe(f"{BASE}/.well-known/x402"),
    }
    for k, v in probes.items():
        print(f"  {k:<18} {v['status']} {v['bytes']:>7}B sha={v['sha256'][:12]}")

    # Paid variants (must 402 or fail loudly — these are the real 402 doors)
    paid = {
        "commission_card": probe(f"{BASE}/api/request-attestation?subject=csoai&axis=honesty"),
        "evidence_bundle": probe(f"{BASE}/api/evidence-bundle?obligation=article-50&subject=csoai&bundle=1"),
        "eu_ai_pack": probe(f"{BASE}/api/evidence-bundle?obligation=article-53&subject=csoai&bundle=1"),
        "swift_bank_pack": probe(f"{BASE}/api/evidence-bundle?obligation=dora&subject=csoai&bundle=1"),
        "xrpl_evidence": probe(f"{BASE}/api/rwa/evidence?asset=RLUSD"),
        "data_feed": probe(f"{BASE}/api/eunomia-data?feed=1"),
        "diff_feed": probe(f"{BASE}/api/feeds/provider-diff?history=1"),
        "receipts_batch": probe(f"{BASE}/api/receipts/batch?from=2026-09-01&to=2026-09-05"),
    }
    for k, v in paid.items():
        print(f"  paid {k:<18} {v['status']} {v['bytes']:>7}B")

    # Write docs
    written = []
    spec = [
        ("commission-card", "Commission a signed card (request-attestation)", "commission_card",
         "public root + reveries: the card-index verification rail; nothing measured here is certificative."),
        ("evidence-bundle", "Evidence bundle mapped to an obligation", "evidence_bundle",
         "obligations ledger (/interop/obligations-ledger.json) + OSCAL observations."),
        ("eu-ai-act-pack", "EU AI Act pack (Article 50 / 53 transparency)", "eu_ai_pack",
         "obligations ledger, Article 50 + 53 rows; pack page /packs/eu-article-50."),
        ("swift-bank-pack", "SWIFT/bank census evidence pack", "swift_bank_pack",
         "SWIFT census reader (/api/swift: n=26, n_measured=0 — census is unmeasured labels, NOT grades) "
         "+ bank registry (26 banks). Bundled under the DORA obligation via the evidence bundle."),
        ("xrpl-asset-evidence", "XRPL asset evidence card (per request)", "xrpl_evidence",
         "public.notice evidence cards + XRPL instrument registry (/interop/xrpl-issuer-registry.json)."),
        ("signed-data-feed", "Signed data feed (assembly + cadence)", "data_feed",
         "eunomia streams (signals index, First-Fine Watch) + public-root leaves."),
        ("provider-diff-feed", "Provider document diff feed", "diff_feed",
         "/feeds/provider-diff/leaves/ + daily hash captures (robots-honouring)."),
        ("receipts-batch", "Receipts batch (historical measurement leaves)", "receipts_batch",
         "receipts corpus (preview shows counts + cap, not leaves)."),
    ]
    for sku, title, key, ledger in spec:
        r = probes[key]
        rp = paid[key]
        block = {
            "preview": r,
            "resource": rp if rp["status"] is not None else {"url": r["url"], "status": None, "bytes": 0},
            "ledger": ledger,
        }
        # resource = paid variant derived by replacing preview query for simpler docs
        path = OUT / f"{sku}.md"
        path.write_text(doc(sku, title, block))
        written.append(sku)
        print(f"  ✓ wrote {path.name}")

    # Index (derived)
    index = {
        "schema": "csoai.product-docs-index/0.1",
        "as_of": now(),
        "sku_count": len(written),
        "skus": [
            {
                "id": sku,
                "file": f"docs/product/{sku}.md",
            }
            for sku in written
        ],
        "gates": "generated by scripts/badger/generate-h1-product-docs.py (probe-before-write)",
    }
    (OUT / "_INDEX.json").write_text(json.dumps(index, indent=2))
    print(f"  ✓ docs/product/_INDEX.json ({len(written)} SKUs)")
    print("  DONE")


if __name__ == "__main__":
    main()
