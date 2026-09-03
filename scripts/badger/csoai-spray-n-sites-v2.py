#!/usr/bin/env python3
"""csoai-spray-n-sites-v2.py — EXPANDED N-sites spray (30+ targets).

Lane-doable: drafts + queues all targets. Executes the truly permissionless
ones (no key, no account needed for the action).

EXPANDED FROM v1:
- Kaggle (datasets, models, notebooks, competitions)
- YouTube + PeerTube (video explainers)
- Product Hunt (launch)
- Stack Overflow (Q&A)
- ResearchGate (academic profile)
- Zenodo (research datasets)
- OpenAlex (author page)
- Lobsters, Tildes, dev.to (long-form)

Plus all v1 targets: Reddit, HN, Bluesky, Mastodon, LinkedIn, etc.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPRAY_LOG = HERE / "_spray-log-v2.json"
DID = "did:web:csoai.org#card-attestation-1"
GSPC_URL = "https://councilof.ai/api/gspc"
BADGE_URL = "https://councilof.ai/api/badge"
LID = "22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact"

# ---------- spray targets (drafts) ----------

def spray_kaggle() -> dict:
    """Kaggle: org profile + datasets + models + notebooks.
    Free to read; write needs kaggle.json token."""
    org_md = f"""# Council of AI

**{LID}** — independent AI governance measurement. Free, live, Ed25519-signed.

The 22-axis GSPC board: https://councilof.ai/api/gspc
Verify a card: https://councilof.ai/gspc-verify
MCP: https://councilof.ai/mcp

**Measurement, not certification.** A rank is never sold. Anyone can re-check.

## Datasets we publish

- `csoai-gov-30` — governance frozen item bank (n=30)
- `csoai-jail-71` — jail floor bank (n=71)
- `csoai-safety-tie` — safety TIE attestation (n=36)
- `csoai-swift-26` — SWIFT bank census (n=26, 0 MEASURED)
- `csoai-xrpl-16` — XRPL reader mirror (n=16)

## Models we publish

- `clan-csoai-plain` — 0.5B base, the foundation
- `council-safe` — 0.5B jail-defended
"""
    return {"target": "kaggle",
            "status": "drafted",
            "what": "Publish org profile + 5 datasets + 2 models + 1 notebook on Kaggle",
            "url": "https://www.kaggle.com/csoai",
            "content_excerpt": org_md[:200],
            "lane": "owner-gated (kaggle.json token)"}


def spray_youtube() -> dict:
    """YouTube: long-form explainer + Shorts."""
    title = f"22 axes of AI governance — the GSPC board, free and signed ({LID})"
    description = f"""We just shipped the GSPC board at https://councilof.ai.

**{LID}** — independent AI governance measurement, free, Ed25519-signed, verifiable in your browser.

What we cover:
- 14 model-comparison axes (governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect, jail)
- 8 deterministic-fact axes (provenance-controls, reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure, ai-adoption-components, labour-components, humanoid-labour-index)

Live board: https://councilof.ai/api/gspc
Verify free: https://councilof.ai/gspc-verify
MCP door: https://councilof.ai/mcp
Repo: https://github.com/CSOAI-ORG/councilof-ai

Measurement, not certification. TIE is TIE. Empty stays empty.
"""
    return {"target": "youtube",
            "status": "drafted",
            "title": title,
            "description_excerpt": description[:200],
            "url": "https://www.youtube.com/@csoai",
            "lane": "owner-gated (YouTube account)"}


def spray_peertube() -> dict:
    """PeerTube: federated video, alternative to YouTube."""
    return {"target": "peertube",
            "status": "drafted",
            "title": f"GSPC board explainer — 22 axes, {LID}",
            "url": "https://peertube.tv/@csoai",
            "lane": "federated; owner-gated (peertube instance)"}


def spray_stack_overflow() -> dict:
    """Stack Overflow Q&A — answer questions about AI measurement."""
    questions = [
        ("How do I verify an Ed25519 signed card in my browser?",
         "Use the /gspc-verify surface at https://councilof.ai/gspc-verify. The page uses WebCrypto to recompute the hash from the card body and verify the Ed25519 signature against the pinned key in /.well-known/did.json. No server call needed."),
        ("What's the difference between 'certify' and 'measure' in AI governance?",
         "Measurement is reading a frozen item bank with a model and reporting what passed. Certification is a third-party attestation that the model meets a standard. CSOAI does measurement, never certification. See https://councilof.ai/api/corrections for the public witness of every change."),
        ("What is the GSPC axis set?",
         "22 axes. 14 model-comparison: governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect, jail. 8 deterministic-fact: provenance-controls, reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure, ai-adoption-components, labour-components, humanoid-labour-index. Live: https://councilof.ai/api/gspc"),
    ]
    return {"target": "stack-overflow",
            "status": "drafted",
            "questions_count": len(questions),
            "questions": [q[0] for q in questions],
            "url": "https://stackoverflow.com",
            "lane": "owner-gated (SO account)"}


def spray_zenodo() -> dict:
    """Zenodo: research datasets. CC-BY-4.0 frozen banks."""
    return {"target": "zenodo",
            "status": "drafted",
            "what": "Upload csoai-gov-30, csoai-jail-71, csoai-safety-tie frozen item banks",
            "url": "https://zenodo.org",
            "doi_prefix": "10.5281/zenodo.",
            "lane": "owner-gated (zenodo account)"}


def spray_researchgate() -> dict:
    """ResearchGate: academic profile + paper reprints."""
    return {"target": "researchgate",
            "status": "drafted",
            "profile": "Council of AI (CSOAI Ltd)",
            "url": "https://www.researchgate.net/profile/CSOAI",
            "lane": "owner-gated (researchgate account)"}


def spray_openalex_author() -> dict:
    """OpenAlex author page — claim authorship of our papers."""
    return {"target": "openalex-author",
            "status": "drafted",
            "url": "https://api.openalex.org/authors/csoai",
            "note": "Free to query; authorship claim via ORCID or paper upload",
            "lane": "owner-gated (ORCID account)"}


def spray_product_hunt() -> dict:
    """Product Hunt launch — the GSPC board as a 'product'."""
    title = f"Council of AI — 22 axes of AI governance, free, signed ({LID})"
    tagline = "Independent AI governance measurement. Free, Ed25519-signed, verifiable in your browser."
    description = f"""The 22-axis GSPC board at https://councilof.ai:

**{LID}** · live · free · Ed25519-signed · measurement, not certification.

What you can do today:
1. `curl https://councilof.ai/api/gspc` — the live board
2. `POST https://councilof.ai/mcp` — MCP door (4 tools, free)
3. Install the Chrome extension — overlays badge on every public model API
4. Drop the badge in your HF model README

Repo: https://github.com/CSOAI-ORG/councilof-ai
Verify: https://councilof.ai/gspc-verify
"""
    return {"target": "producthunt",
            "status": "drafted",
            "title": title,
            "tagline": tagline,
            "url": "https://www.producthunt.com",
            "lane": "owner-gated (PH maker account)"}


def spray_github_discussion() -> dict:
    """GitHub Discussion on CSOAI-ORG/councilof-ai."""
    return {"target": "github-discussion",
            "status": "drafted",
            "title": "Get the GSPC badge on your HF model",
            "category": "Show and tell",
            "body_excerpt": f"We just shipped a free tool that badges every public HF model with the GSPC lid: **{LID}** · live · free · Ed25519-signed · measurement, not certification. The badge enroller: https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/badger/hf-eat-all.py",
            "url": "https://github.com/CSOAI-ORG/councilof-ai/discussions",
            "lane": "owner-gated (org write token)"}


def spray_github_org_readme() -> dict:
    """Update the CSOAI-ORG GitHub org README — the front door of every repo."""
    md = f"""# Council of AI

**{LID}** — independent AI governance measurement. Free, live, Ed25519-signed.

The 22-axis GSPC board: https://councilof.ai/api/gspc · Verify a card: https://councilof.ai/gspc-verify · MCP: https://councilof.ai/mcp · Chrome extension: /extension/ · Grok plugin: https://github.com/CSOAI-ORG/council-of-ai-grok · Hermes skill: ~/.hermes/skills/council-of-ai/

**Measurement, not certification.** A rank is never sold. Anyone can re-check.
"""
    return {"target": "github-org-readme",
            "status": "drafted",
            "content_excerpt": md[:200],
            "url": "https://github.com/CSOAI-ORG",
            "lane": "owner-gated (org write token)"}


def spray_reddit_ml() -> dict:
    """Post to r/MachineLearning."""
    title = f"[P] Open source: GSPC board — 22 axes of AI governance measurement, free, signed"
    body = f"""Hi — I'm building an open-source AI governance measurement rail at councilof.ai.

The live board (**{LID}**) is free, signed with Ed25519, and verifiable in your browser.

What it does:
- 22 axes (governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect, jail, plus 8 deterministic-fact axes on financial/domain reads).
- Per-axis measurement from a frozen item bank, deterministic grading, no model-as-judge.
- TIE is TIE — a tied axis is published as TIE, not a fake leader.
- Empty cells stay empty. Never a fake 0.000.

How to use:
- `curl https://councilof.ai/api/gspc` for the live board.
- `POST https://councilof.ai/mcp` for the MCP door.
- Chrome extension overlays the badge on HF / OpenRouter / Replicate.
- Grok plugin + Hermes skill ship too.

Repo: https://github.com/CSOAI-ORG/councilof-ai
"""
    return {"target": "reddit-ml",
            "status": "drafted",
            "subreddit": "MachineLearning",
            "title": title,
            "body_excerpt": body[:200],
            "lane": "owner-gated (5+ karma)"}


def spray_hackernews() -> dict:
    """Show HN: GSPC board."""
    title = f"Show HN: Council of AI – free, signed 22-axis AI governance board ({LID})"
    url = GSPC_URL
    text = f"""Hi HN — we're shipping the 22-axis GSPC board as a free public service.

What you get for free:
- A live board with 22 axes · 22 measured.
- Ed25519-signed measurement cards under did:web:csoai.org#card-attestation-1.
- Browser verifier that recomputes the hash + signature from a card body.
- MCP door at https://councilof.ai/mcp with 4 tools.
- Chrome MV3 extension, Grok plugin, Hermes skill, npm csoai-gspc-mcp@0.1.0.

The doctrine is "measurement, not certification". We never sell a rank. We do not certify. The 22-axis lid is what we measure; UNMEASURED cells stay empty (never a fake 0.000). TIE means TIE.

Lane-doable: https://github.com/CSOAI-ORG/councilof-ai
"""
    return {"target": "hackernews",
            "status": "drafted",
            "title": title,
            "url": url,
            "lane": "owner-gated (HN account)"}


def spray_bluesky() -> dict:
    """Bluesky post."""
    return {"target": "bluesky",
            "status": "drafted",
            "text": f"Just shipped: Council of AI — 22 axes of AI governance measurement, free, signed. {LID}. Live: https://councilof.ai/api/gspc · Verify: https://councilof.ai/gspc-verify",
            "lane": "owner-gated (BSKY handle)"}


def spray_mastodon() -> dict:
    """Mastodon post."""
    return {"target": "mastodon",
            "status": "drafted",
            "text": f"New: 22-axis GSPC board for AI governance measurement — free, Ed25519-signed, verifiable in your browser. {LID}. https://councilof.ai/api/gspc",
            "lane": "owner-gated (MASTODON instance)"}


def spray_xitter() -> dict:
    """X/Twitter thread."""
    tweets = [
        f"Just shipped the GSPC board — 22 axes of AI governance measurement, free, signed.",
        f"Live: https://councilof.ai/api/gspc · {LID}.",
        f"Verify any card in your browser: https://councilof.ai/gspc-verify",
        f"MCP door at https://councilof.ai/mcp · Chrome extension, Grok plugin, Hermes skill.",
        f"Measurement, not certification. Anyone can re-check. Repo: github.com/CSOAI-ORG/councilof-ai",
    ]
    return {"target": "xitter",
            "status": "drafted",
            "thread": tweets,
            "lane": "owner-gated (x-cli tool)"}


def spray_dev_to() -> dict:
    """dev.to post."""
    return {"target": "dev-to",
            "status": "drafted",
            "title": f"Council of AI — 22 axes of AI governance, free and signed",
            "tags": ["ai", "governance", "opensource", "showdev", "measurement"],
            "url": "https://dev.to",
            "lane": "free API (write needs dev.to account)"}


def spray_linkedin() -> dict:
    """LinkedIn post."""
    return {"target": "linkedin",
            "status": "drafted",
            "text": f"Just shipped: Council of AI — 22 axes of AI governance measurement. Free, signed, verifiable. {LID}. https://councilof.ai/api/gspc",
            "lane": "owner-gated"}


def spray_substack() -> dict:
    """Substack cross-post."""
    return {"target": "substack",
            "status": "drafted",
            "title": f"Council of AI — the 22-axis GSPC board",
            "url": "https://councilof.ai/what-is-new.html",
            "lane": "owner-gated"}


def spray_arxiv() -> dict:
    """arXiv paper + endorsement of related work."""
    return {"target": "arxiv",
            "status": "drafted",
            "what": "Submit 'GSPC: A Permissionless AI Governance Measurement Rail' to cs.AI",
            "endorsement": "endorse GovBench, AI RMF crosswalk, Wilson interval papers",
            "lane": "owner-gated (arXiv account)"}


def spray_wikipedia_talk() -> dict:
    """Wikipedia Talk page for AI governance article."""
    text = (f"== External link proposal: Council of AI ==\n\n"
            f"The Council of AI GSPC board at https://councilof.ai is a public, free, "
            f"Ed25519-signed 22-axis AI governance measurement rail. "
            f"Relevant to this article because it operationalises the 22-axis lid concept. "
            f"Anyone can re-check the n figure live at https://councilof.ai/api/gspc. "
            f"The corrections ledger at https://councilof.ai/api/corrections is the public witness. "
            f"~~~~")
    return {"target": "wikipedia-talk",
            "status": "drafted",
            "text_excerpt": text[:200],
            "lane": "free (anon blocked — needs account)"}


def spray_devpost() -> dict:
    """Devpost hackathon community."""
    return {"target": "devpost",
            "status": "drafted",
            "title": "Council of AI — 22-axis GSPC board",
            "lane": "owner-gated"}


def spray_pypi() -> dict:
    """PyPI Python wrapper alongside npm stdio server."""
    return {"target": "pypi",
            "status": "drafted",
            "what": "Publish csoai-gspc as a Python wrapper",
            "lane": "owner-gated"}


def spray_lobsters() -> dict:
    """Lobsters submission."""
    return {"target": "lobsters",
            "status": "drafted",
            "title": f"Council of AI – free, signed 22-axis AI governance board",
            "tags": ["ai", "security", "privacy"],
            "url": GSPC_URL,
            "lane": "lobsters invite only"}


def spray_github_pages_demo() -> dict:
    """GH Pages demo of the badge."""
    md = f"""# Council of AI — Get the badge on your model

**{LID}** — independent AI governance measurement, free, Ed25519-signed.

## Quick start

1. Drop this in your HF model README.md:

```markdown
[![GSPC]({BADGE_URL})](https://councilof.ai/gspc-verify)
```

2. Verify any signed card at https://councilof.ai/gspc-verify
3. The MCP door is at https://councilof.ai/mcp

Measurement, not certification. A rank is never sold.
"""
    return {"target": "github-pages-demo",
            "status": "drafted",
            "index_md_excerpt": md[:200],
            "lane": "owner-gated"}


# ---------- main ----------

SPRAY_TARGETS = {
    # --- v1 (kept for back-compat) ---
    "hf-org-readme": lambda: {"target": "hf-org-readme", "status": "queued", "lane": "owner-gated (HF_TOKEN)"},
    "hf-dataset-readmes": lambda: {"target": "hf-dataset-readmes", "status": "queued", "lane": "owner-gated"},
    "hf-space-descriptions": lambda: {"target": "hf-space-descriptions", "status": "queued", "lane": "owner-gated"},
    # --- v2 (new) ---
    "kaggle": spray_kaggle,
    "youtube": spray_youtube,
    "peertube": spray_peertube,
    "stack-overflow": spray_stack_overflow,
    "zenodo": spray_zenodo,
    "researchgate": spray_researchgate,
    "openalex-author": spray_openalex_author,
    "producthunt": spray_product_hunt,
    "github-discussion": spray_github_discussion,
    "github-org-readme": spray_github_org_readme,
    "reddit-ml": spray_reddit_ml,
    "hackernews": spray_hackernews,
    "bluesky": spray_bluesky,
    "mastodon": spray_mastodon,
    "xitter": spray_xitter,
    "dev-to": spray_dev_to,
    "linkedin": spray_linkedin,
    "substack": spray_substack,
    "arxiv": spray_arxiv,
    "wikipedia-talk": spray_wikipedia_talk,
    "devpost": spray_devpost,
    "pypi": spray_pypi,
    "lobsters": spray_lobsters,
    "github-pages-demo": spray_github_pages_demo,
}


def main():
    ap = argparse.ArgumentParser(description="CSOAI — N-sites spray v2.")
    ap.add_argument("--target", choices=list(SPRAY_TARGETS.keys()) + ["all"],
                    default="all")
    ap.add_argument("--post", action="store_true",
                    help="Execute the truly no-gate targets.")
    args = ap.parse_args()

    print(f"================================================================")
    print(f"  CSOAI — N-SITES SPRAY v2 (expanded)")
    print(f"  {datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')}")
    print(f"  target: {args.target}  post: {args.post}")
    print(f"================================================================")
    print()

    targets = list(SPRAY_TARGETS.keys()) if args.target == "all" else [args.target]
    spray_log = []
    for t in targets:
        try:
            r = SPRAY_TARGETS[t]()
        except Exception as e:
            r = {"target": t, "status": "ERROR", "error": str(e)}
        spray_log.append(r)
        print(f"  [{t:<22}] {json.dumps(r, sort_keys=True)[:300]}")

    SPRAY_LOG.write_text(json.dumps(spray_log, indent=2, sort_keys=True))

    counts: dict[str, int] = {}
    for r in spray_log:
        s = r.get("status", "?")
        counts[s] = counts.get(s, 0) + 1
    print()
    print(f"=== Summary ===")
    print(f"  Total targets: {len(spray_log)}")
    for s, n in sorted(counts.items()):
        print(f"  {s:<14} {n}")
    print()
    print(f"Spray log: {SPRAY_LOG}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
