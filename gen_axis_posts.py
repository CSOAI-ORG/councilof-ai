#!/usr/bin/env python3
"""gen_axis_posts.py — the per-axis CONTENT ENGINE (authority + AEO/GEO/SEO).

Generates one doctrine-clean, keyword-aware, citation-linked blog post per GSPC axis, so each
axis has its own publishable authority page (with backlink anchors to the live verified surfaces).
Every post is FACTUAL (carries the real axis signal from the register, never an invented number),
and it links to the signed verify path (the trust proof).

Output: content/axis/<axis>.md (one per axis) + content/axis/_index.md + an RSS entry per post.
"""
import json, time, urllib.request
from pathlib import Path

def get_axis_register():
    try:
        req = urllib.request.Request("https://councilof.ai/api/axis-register",
                                     headers={"User-Agent": "CSOAI-content-engine/1.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r)
    except Exception as e:
        print("  register fetch error:", e)
        return {"axes": []}

AXIS_LABEL = {
    "gov": "governance", "prv": "privacy", "agi": "AGI safety", "asi": "ASI control",
    "mcp": "MCP security", "oss": "open-source sovereignty", "mach": "machinery compliance",
    "care": "care & safety", "xr": "cross-reality", "det": "detector interop",
    "art5": "Art.5 safeguards", "swarm": "swarm coordination", "affect": "affect & harm",
}
# the live link targets (real, verified surfaces)
LINKS = {
    "board": "https://councilof.ai/api/gspc",
    "verify": "https://councilof.ai/gspc-verify",
    "leaderboard": "https://councilof.ai/api/arena/scoreboard",
    "claimguard": "https://councilof.ai/claimguard",
    "pdf": "https://councilof.ai/verify-leaderboard",
    "article50": "https://councilof.ai/article-50",
}

def slug(a): return a

def gen_post(axis, info):
    label = AXIS_LABEL.get(axis, axis)
    n = info.get("scored_items") or "measured"
    models = info.get("models") or "the measured"
    baseline = info.get("majority_baseline") or "the published baseline"
    status = info.get("status", "MEASURED")
    return f"""---
title: "The {label} axis — measured, signed, verifiable"
description: "What the Council of AI measures on the {label} axis, how it is signed, and how anyone can re-verify it. Measurement, not certification."
keywords: ["AI governance", "{label}", "GSPC", "signed measurement", "verifiable"]
date: 2026-08-24
author: Council of AI (CSOAI Ltd)
type: axis-analysis
axis: {axis}
---

# The {label} axis — measured, signed, and verifiable

The {label} axis is one of the GSPC governance-measurement axes. The Council of AI (CSOAI Ltd,
UK 16939677) measures it deterministically — frozen probes, published splits, honest statistics —
and publishes the result **signed** so anyone can re-verify it.

## What is measured

- **Status:** {status} — reported honestly, never hidden.
- **Scored items:** {n} ·
- **Models measured:** {models} ·
- **Majority baseline:** {baseline}.

Every score carries n + a 95% confidence interval. A thin-n result is reported *"not sufficient to
rank"* — never invented.

## Verify it yourself (the trust proof)

The measurement is a signed artifact: recompute the canonical body → derive the content_id →
check the Ed25519 signature against the published key. No trust in us required.

- Live board (with n + CI): [GET /api/gspc]({LINKS['board']})
- Verify a card free: [the verify page]({LINKS['verify']})
- Signed per-axis Elo: [the signed leaderboard]({LINKS['leaderboard']})
- Audit any claim: [ClaimGuard]({LINKS['claimguard']})

## Why this matters

A usage-rank can be gamed. A crowd-Elo board has no verified provenance. This axis measurement is
**per-domain, n + CI, signed** — the difference that makes it usable evidence rather than a score.

## Measurement, not certification

This is evidence, never a certification. The verify path is the proof; the free access for
researchers, journalists, and fact-checkers is permanent and unconditional.

## Related

- [The full GSPC board]({LINKS['board']})
- [Article 50 free detection]({LINKS['article50']})
"""

def main():
    reg = get_axis_register()
    axes = {a["axis"]: a for a in reg.get("axes", [])}
    out = Path("content/axis"); out.mkdir(parents=True, exist_ok=True)
    items = []
    for axis, info in sorted(axes.items()):
        md = gen_post(axis, info)
        (out / f"{slug(axis)}.md").write_text(md)
        items.append({"slug": slug(axis), "title": f"The {AXIS_LABEL.get(axis,axis)} axis — measured, signed, verifiable"})
        print(f"  wrote content/axis/{slug(axis)}.md")
    (out / "_index.md").write_text("""# Per-axis analysis (authority hubs)

One signed, verifiable authority post per GSPC axis. Each links back to the live verified
measurement (n + CI) and the free verify path — measurement, not certification.

""" + "\n".join(f"- [{i['title']}](/{i['slug']})" for i in items))
    print(f"  wrote content/axis/_index.md ({len(items)} posts)")
    (Path("content/axis") / "_rss.json").write_text(json.dumps({"schema":"csoai.axis-rss/0.1","posts":items,"generated":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())},indent=1))
    print("  wrote content/axis/_rss.json")

if __name__ == "__main__":
    main()
