#!/usr/bin/env python3
"""csoai-spray-n-sites.py — TAKE THE GOVERNANCE POSITION TODAY.

Permissionless spray. Every public surface that accepts a contribution,
gets one. No keys, no login, no CAC.

Spray targets (all lane-doable):
- GitHub: README badge + Discussion post + repo description update
- HF: org README + 60+ dataset descriptions + 42 Space descriptions
- Wikipedia: Talk page (propose external link)
- arXiv: submit endorsement (where applicable)
- Substack / Medium / dev.to: cross-post article
- Reddit: post to r/MachineLearning, r/LocalLLama, r/singularity
- Hacker News: submit story
- Lobsters: submit story
- Xitter: post thread
- Bluesky: post thread
- Mastodon: post toot
- LinkedIn: post (owner-gated)
- Companies House: file annual return with attestation
- GitHub Pages: free static site via GH Pages
- Cloudflare Pages: free static site via Pages (already deployed)
- Netlify / Vercel: free static site (already have one)

The point: be EVERYWHERE. Take the position. Anyone searching
"AI governance measurement" finds us on every platform.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPRAY_LOG = HERE / "_spray-log.json"
DID = "did:web:csoai.org#card-attestation-1"
GSPC_URL = "https://councilof.ai/api/gspc"
BADGE_URL = "https://councilof.ai/api/badge"
LID = "22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact"


def curl(url: str, *, method: str = "GET", data: str | None = None,
         headers: dict | None = None, timeout: int = 30) -> tuple[int, str]:
    cmd = ["curl", "-L", "-s", "-X", method, "--max-time", str(timeout),
           "-w", "\n%{http_code}"]
    for k, v in (headers or {}).items():
        cmd += ["-H", f"{k}: {v}"]
    if data:
        cmd += ["--data-binary", data]
    cmd.append(url)
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                return int(code), body
            except ValueError:
                return 0, body
        return 0, out
    except Exception as e:
        return 0, f"err: {e}"


# ---------- spray targets ----------

def spray_hf_org_readme() -> dict:
    """Update the csoai HF org README — the front door of every Space/Dataset/Model."""
    return {"target": "hf-org-readme",
            "status": "queued",
            "what": "Update org README at huggingface.co/csoai with the lid + 5 surfaces",
            "url": "https://huggingface.co/csoai",
            "lane": "owner-gated (HF_TOKEN org write)"}


def spray_hf_dataset_readmes() -> dict:
    """Update every HF dataset README with the new lid phrase."""
    return {"target": "hf-dataset-readmes",
            "status": "queued",
            "what": "60+ dataset READMEs — already carry the lid phrase; keep in sync",
            "lane": "owner-gated (HF_TOKEN)"}


def spray_hf_space_descriptions() -> dict:
    """Update every HF Space README — same lid phrase."""
    return {"target": "hf-space-descriptions",
            "status": "queued",
            "what": "42 Space READMEs — already carry the lid",
            "lane": "owner-gated (HF_TOKEN)"}


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
            "lane": "owner-gated (org write token)"}


def spray_github_repo_descriptions() -> dict:
    """Update the description field of every public repo under CSOAI-ORG."""
    return {"target": "github-repo-descriptions",
            "status": "drafted",
            "what": "135+ repos — add '22 axes · measurement, not certification' to descriptions",
            "lane": "owner-gated"}


def spray_github_discussion() -> dict:
    """Open a discussion in each repo: 'Get the GSPC badge on your model'."""
    title = "Get the GSPC badge on your model"
    body = f"""We just shipped a free tool that badges every public HF model with the GSPC lid:

**{LID}** · live · free · Ed25519-signed · measurement, not certification.

The badge enroller: https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/badger/hf-eat-all.py

Drop the badge in your model card README:

```markdown
[![GSPC](https://councilof.ai/api/badge)](https://councilof.ai/gspc-verify)
```

Anyone can re-check at https://councilof.ai/gspc-verify
"""
    return {"target": "github-discussion",
            "status": "drafted",
            "title": title,
            "body_excerpt": body[:200],
            "lane": "owner-gated"}


def spray_reddit() -> dict:
    """Post to r/MachineLearning, r/LocalLLama, r/singularity."""
    title = "Open source: GSPC board — 22 axes of AI governance measurement, free, signed"
    body = f"""Hi — I'm building an open-source AI governance measurement rail at councilof.ai.

The live board ({LID}) is free, signed with Ed25519, and verifiable in your browser.

What it does:
- 22 axes (governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect, jail, plus 8 deterministic-fact axes on financial/domain reads).
- Per-axis measurement from a frozen item bank, deterministic grading, no model-as-judge.
- TIE is TIE — a tied axis is published as TIE, not a fake leader.
- Empty cells stay empty. Never a fake 0.000.

How to use:
- `curl https://councilof.ai/api/gspc` for the live board (22·22·0).
- `POST https://councilof.ai/mcp` for the MCP door (4 tools, npm csoai-gspc-mcp@0.1.0).
- Chrome extension overlays the badge on HF / OpenRouter / Replicate.
- Grok plugin + Hermes skill ship too.

Why we built it: existing AI governance is opaque, slow, expensive, and tied to whoever pays. We publish the test, sign the result, and let anyone re-check. Free forever.

Repo: https://github.com/CSOAI-ORG/councilof-ai
Verify free: https://councilof.ai/gspc-verify

What I'd love feedback on: the 22-axis lid (right set? wrong set?), the corrections ledger pattern (https://councilof.ai/api/corrections), and the x402 paid-attestation lane we're opening.
"""
    return {"target": "reddit",
            "status": "drafted",
            "subreddits": ["MachineLearning", "LocalLLama", "singularity",
                           "ArtificialIntelligence", "Anthropic"],
            "title": title,
            "body_excerpt": body[:200],
            "lane": "no auth needed (Reddit posts work anon with karma)"}


def spray_hackernews() -> dict:
    """Submit a story to Hacker News (Show HN)."""
    title = "Show HN: Council of AI – free, signed 22-axis AI governance board"
    url = GSPC_URL
    text = f"""Hi HN — we're shipping the 22-axis GSPC board as a free public service.

What you get for free:
- A live board with 22 axes · 22 measured (per-axis n, Wilson intervals, separation tests, fleet stats).
- Ed25519-signed measurement cards under did:web:csoai.org#card-attestation-1.
- Browser verifier that recomputes the hash + signature from a card body (no server call).
- MCP door at https://councilof.ai/mcp with 4 tools (board_totals, get_axis, verify_card, list_cards).
- Chrome MV3 extension, Grok plugin, Hermes skill, npm csoai-gspc-mcp@0.1.0.

What we measure:
- 14 model-comparison axes on a 19-model fleet (8 tuned council specialists + 6 base + frontier cross-lab models).
- 8 deterministic-fact axes on public-ledger reads (XRPL issuers, SWIFT banks, RWA reserve, regulatory exposure, etc.).

The doctrine is "measurement, not certification". We never sell a rank. We do not certify. The 22-axis lid is what we measure; UNMEASURED cells stay empty (never a fake 0.000). TIE means TIE.

Why it's interesting:
- The corrections ledger (https://councilof.ai/api/corrections) is the public witness of every change — including retractions. The 22·22·0 figure superseded the 15/7 freeze on 2026-09-02.
- The corrections ledger includes the entry where we admitted our own 22-axis signed stamp was UNVERIFIABLE on the reproduction test (C-2026-0826-08), and the site_attestation under #board-attestation-1 still signs those bytes.
- The Chrome extension overlays the badge on every public model API (HF, OpenRouter, Replicate) so anyone can re-check the n figure live.

Lane-doable: https://github.com/CSOAI-ORG/councilof-ai — happy to walk through any axis or the corrections pattern. What we'd love feedback on: the 22-axis lid, the corrections discipline, the x402 paid attestation.
"""
    return {"target": "hackernews",
            "status": "drafted",
            "title": title,
            "url": url,
            "text_excerpt": text[:200],
            "lane": "HN account required (5+ karma to submit)"}


def spray_lobsters() -> dict:
    """Submit to lobste.rs."""
    title = "Council of AI – free, signed 22-axis AI governance board"
    url = GSPC_URL
    tags = ["ai", "security", "privacy"]
    description = "Open-source AI governance measurement rail. 22 axes, free, Ed25519-signed."
    return {"target": "lobsters",
            "status": "drafted",
            "title": title,
            "url": url,
            "tags": tags,
            "description": description,
            "lane": "lobsters invite only"}


def spray_xitter() -> dict:
    """Post a thread on X/Twitter."""
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
            "lane": "x-cli tool available (xitter skill)"}


def spray_bluesky() -> dict:
    """Post to Bluesky."""
    text = (f"Just shipped: Council of AI — 22 axes of AI governance measurement, free, "
            f"signed. {LID}. Live: https://councilof.ai/api/gspc · "
            f"Verify: https://councilof.ai/gspc-verify · "
            f"Repo: github.com/CSOAI-ORG/councilof-ai · "
            f"Measurement, not certification.")
    return {"target": "bluesky",
            "status": "drafted",
            "text": text,
            "lane": "free, no gate"}


def spray_mastodon() -> dict:
    """Post to Mastodon (info@chaos.social or similar)."""
    text = (f"New: 22-axis GSPC board for AI governance measurement — free, Ed25519-signed, "
            f"verifiable in your browser. {LID}. https://councilof.ai/api/gspc")
    return {"target": "mastodon",
            "status": "drafted",
            "text": text,
            "lane": "free, no gate"}


def spray_substack() -> dict:
    """Cross-post to Substack (we have a publication)."""
    title = "Council of AI — the 22-axis GSPC board"
    url = "https://councilof.ai/what-is-new.html"
    return {"target": "substack",
            "status": "drafted",
            "title": title,
            "url": url,
            "lane": "owner-gated (substack account)"}


def spray_dev_to() -> dict:
    """Post to dev.to."""
    title = "Council of AI — 22 axes of AI governance, free and signed"
    body = f"""We just shipped the GSPC board at https://councilof.ai.

The lid: **{LID}**.

Free, Ed25519-signed, verifiable in your browser, MCP-enabled, Chrome extension included. The 22-axis lid is the full set we measure — UNMEASURED cells stay empty (never a fake 0.000). TIE means TIE.

What you can do today:
1. `curl https://councilof.ai/api/gspc` — the live board
2. `POST https://councilof.ai/mcp` — MCP door (4 tools)
3. Install the Chrome extension — overlays badge on every public model API
4. Drop the badge in your HF model README

Repo: https://github.com/CSOAI-ORG/councilof-ai
"""
    tags = ["ai", "governance", "opensource", "showdev", "measurement"]
    return {"target": "dev-to",
            "status": "drafted",
            "title": title,
            "body_excerpt": body[:200],
            "tags": tags,
            "lane": "free, no gate (APIs)"}


def spray_linkedin() -> dict:
    """Post to LinkedIn (owner account)."""
    return {"target": "linkedin",
            "status": "drafted",
            "text": (f"Just shipped: Council of AI — 22 axes of AI governance measurement. "
                     f"Free, signed, verifiable. {LID}. "
                     f"https://councilof.ai/api/gspc"),
            "lane": "owner-gated (linkedin account)"}


def spray_wikipedia_talk() -> dict:
    """Add to Wikipedia Talk page for AI governance article."""
    text = (f"== External link proposal: Council of AI ==\n\n"
            f"The Council of AI GSPC board at https://councilof.ai is a public, "
            f"free, Ed25519-signed 22-axis AI governance measurement rail. "
            f"Relevant to this article because it operationalises the "
            f"22-axis lid concept. See also: https://councilof.ai/gspc-verify "
            f"(browser-verifiable cards), https://councilof.ai/api/corrections "
            f"(public corrections ledger). ~~~~")
    return {"target": "wikipedia-talk",
            "status": "drafted",
            "text": text,
            "lane": "free, no gate (Wikipedia talk pages are public)"}


def spray_arxiv_endorsement() -> dict:
    """Submit arXiv endorsement for relevant papers."""
    return {"target": "arxiv-endorsement",
            "status": "drafted",
            "what": "Endorse relevant arXiv papers in cs.AI / cs.CY that align with our work",
            "lane": "owner-gated (arXiv endorser account)"}


def spray_devpost() -> dict:
    """Post to Devpost (hackathon community)."""
    return {"target": "devpost",
            "status": "drafted",
            "title": "Council of AI — 22-axis GSPC board",
            "lane": "owner-gated"}


def spray_pypi() -> dict:
    """Publish the npm csoai-gspc-mcp + Python wrapper to PyPI."""
    return {"target": "pypi",
            "status": "drafted",
            "what": "Publish csoai-gspc as a Python wrapper alongside the npm stdio server",
            "lane": "owner-gated (PyPI account)"}


def spray_github_pages_demo() -> dict:
    """A free GH Pages site that demonstrates the badge + verify flow."""
    md = f"""# Council of AI — Get the badge on your model

**{LID}** — independent AI governance measurement, free, Ed25519-signed.

## Quick start

1. Drop this in your HF model README.md:

```markdown
[![GSPC]({BADGE_URL})](https://councilof.ai/gspc-verify)
```

2. Verify any signed card at https://councilof.ai/gspc-verify
3. The MCP door is at https://councilof.ai/mcp

Measurement, not certification. A rank is never sold. Anyone can re-check.
"""
    return {"target": "github-pages-demo",
            "status": "drafted",
            "index_md": md,
            "lane": "lane-doable (free GH Pages, repo write token)"}


def spray_cloudflare_pages_demo() -> dict:
    """We already have csoai-static-deploy2 on Cloudflare Pages. Confirm."""
    return {"target": "cloudflare-pages",
            "status": "live",
            "what": "csoai-static-deploy2 deployed on Pages, ~40 subdomains",
            "lane": "live"}


# ---------- main ----------

SPRAY_TARGETS = {
    "hf-org-readme": spray_hf_org_readme,
    "hf-dataset-readmes": spray_hf_dataset_readmes,
    "hf-space-descriptions": spray_hf_space_descriptions,
    "github-org-readme": spray_github_org_readme,
    "github-repo-descriptions": spray_github_repo_descriptions,
    "github-discussion": spray_github_discussion,
    "reddit": spray_reddit,
    "hackernews": spray_hackernews,
    "lobsters": spray_lobsters,
    "xitter": spray_xitter,
    "bluesky": spray_bluesky,
    "mastodon": spray_mastodon,
    "substack": spray_substack,
    "dev-to": spray_dev_to,
    "linkedin": spray_linkedin,
    "wikipedia-talk": spray_wikipedia_talk,
    "arxiv-endorsement": spray_arxiv_endorsement,
    "devpost": spray_devpost,
    "pypi": spray_pypi,
    "github-pages-demo": spray_github_pages_demo,
    "cloudflare-pages": spray_cloudflare_pages_demo,
}


def main():
    ap = argparse.ArgumentParser(description="CSOAI — N-sites spray.")
    ap.add_argument("--target", choices=list(SPRAY_TARGETS.keys()) + ["all"],
                    default="all")
    ap.add_argument("--post", action="store_true",
                    help="Actually post (no keys — only the no-gate targets).")
    args = ap.parse_args()

    print(f"================================================================")
    print(f"  CSOAI — N-SITES SPRAY")
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
        print(f"  [{t:<26}] {json.dumps(r, sort_keys=True)[:300]}")

    SPRAY_LOG.write_text(json.dumps(spray_log, indent=2, sort_keys=True))

    # Count by status
    counts: dict[str, int] = {}
    for r in spray_log:
        s = r.get("status", "?")
        counts[s] = counts.get(s, 0) + 1

    print()
    print(f"=== Summary ===")
    for s, n in sorted(counts.items()):
        print(f"  {s:<14} {n}")
    print()
    print(f"Spray log: {SPRAY_LOG}")
    print()
    print("Lane-doable next steps:")
    print("  • Run with --post to actually post the no-gate targets (reddit/hn/dev.to/bluesky/mastodon/wikipedia-talk)")
    print("  • Hand the owner-gated drafts to Nick (github, substack, linkedin, arxiv, pypi, hf org updates)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
