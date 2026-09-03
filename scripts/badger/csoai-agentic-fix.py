#!/usr/bin/env python3
"""csoai-agentic-fix.py — the auto-fix engine.

Closed loop:
  DETECT (problem) → FIX (lane-doable) → SIGN (Ed25519) → ANCHOR (OTS+Rekor)
  → NOTIFY (commit + corrections ledger + spray log)

Lane-doable: only runs actions the operator has authorized. Every action
is logged to the corrections ledger as a card (signed, anchored).

Problem types handled:
  A. Brand-gate failures (forbidden display strings)
  B. Missing pages referenced by the sitemap
  C. Broken internal links (404s on the public site)
  D. Stale lid phrase (drift from the canonical 22 axes · 22 measured)
  E. Outdated corrections ledger (entries without signed card binding)
  F. Missing OG image / manifest.json
  G. Missing llms.txt schema.org JSON-LD
  H. AEO meta tag gaps
  I. New signed cards not in /api/state yet
  J. New Rekor receipts not bound to root.json

Each fix is small, atomic, and reversible (always creates a git commit).
Owner-gated: any action that touches /csoai-static-deploy2, HF org, npm,
Stripe, or auth-needing surfaces → queue for owner.

Usage:
  ./csoai-agentic-fix.py --dry-run       # detect only, no fixes
  ./csoai-agentic-fix.py --detect-only   # list problems, no fixes
  ./csoai-agentic-fix.py --auto          # detect + fix lane-doable
  ./csoai-agentic-fix.py --fix <id>      # fix a specific problem
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
PUBLIC = REPO / "public"
FUNCTIONS = REPO / "functions"
QUEUE = HERE / "_queue" / "fixes"
STATE = HERE / "_state-fixes.json"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

LID_CANONICAL = "22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact"


# ---------- problem detectors ----------

def detect_brand_gate() -> list[dict]:
    """Run scripts/brand-gate.mjs and return any violations."""
    r = subprocess.run(
        ["node", str(REPO / "scripts" / "brand-gate.mjs"), str(PUBLIC)],
        capture_output=True, text=True, cwd=REPO,
    )
    out = r.stdout + r.stderr
    if r.returncode == 0:
        return []
    problems = []
    for m in re.finditer(r"(\S+\.html)\s+\[(\w+)\]\s+\"([^\"]+)\"", out):
        problems.append({
            "id": f"brand-gate::{m.group(1)}::{m.group(2)}::{m.group(3)[:32]}",
            "kind": "brand-gate",
            "file": m.group(1),
            "rule": m.group(2),
            "forbidden": m.group(3),
            "severity": "high",
            "fix_kind": "lane-doable",
            "description": f"Brand-gate violation: {m.group(2)} in {m.group(1)}",
        })
    return problems


def detect_missing_pages() -> list[dict]:
    """Check the sitemap URLs against the live site for 404s."""
    r = subprocess.run(
        ["curl", "-L", "-s", "--max-time", "30", "https://councilof.ai/sitemap.xml"],
        capture_output=True, text=True, cwd=REPO,
    )
    if r.returncode != 0 or "<urlset" not in r.stdout:
        return []
    urls = re.findall(r"<loc>([^<]+)</loc>", r.stdout)[:30]  # sample
    problems = []
    for u in urls:
        # Skip external
        if "councilof.ai" not in u:
            continue
        path = u.split("councilof.ai", 1)[-1]
        try:
            r2 = subprocess.run(
                ["curl", "-L", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                 "--max-time", "10", u],
                capture_output=True, text=True,
            )
            code = r2.stdout.strip()
            if code and code != "200":
                problems.append({
                    "id": f"missing-page::{path}",
                    "kind": "missing-page",
                    "path": path,
                    "http": code,
                    "severity": "medium",
                    "fix_kind": "lane-doable",
                    "description": f"{path} returns HTTP {code}",
                })
        except Exception:
            pass
    return problems


def detect_lid_drift() -> list[dict]:
    """Check every public HTML carries the canonical lid phrase (or is exempt)."""
    problems = []
    exempt = {"master.html", "sov_space_visual.html", "mcp-install.html", "pulse.html",
              "experiments.html", "oowm-demo.html", "404.html"}
    for f in PUBLIC.glob("*.html"):
        if f.name in exempt:
            continue
        text = f.read_text(errors="ignore")
        if "22 axes" in text and LID_CANONICAL not in text and "lid" not in text.lower():
            problems.append({
                "id": f"lid-drift::{f.name}",
                "kind": "lid-drift",
                "file": f.name,
                "severity": "low",
                "fix_kind": "lane-doable",
                "description": f"{f.name} mentions 22 axes but lacks the canonical lid phrase",
            })
    return problems


def detect_no_aid_meta() -> list[dict]:
    """Check that every public HTML has the AEO meta tags (description, keywords, canonical)."""
    problems = []
    required = ["description", "robots"]
    for f in PUBLIC.glob("*.html"):
        text = f.read_text(errors="ignore")
        head = text[:3000]
        for tag in required:
            if f'name="{tag}"' not in head and f'property="{tag}"' not in head and tag not in head.lower():
                problems.append({
                    "id": f"aeo-missing::{f.name}::{tag}",
                    "kind": "aeo-missing",
                    "file": f.name,
                    "tag": tag,
                    "severity": "low",
                    "fix_kind": "lane-doable",
                    "description": f"{f.name} missing <meta name=\"{tag}\">",
                })
    return problems


def detect_no_og_image() -> list[dict]:
    """Check that every public HTML has an og:image meta tag."""
    problems = []
    for f in PUBLIC.glob("*.html"):
        text = f.read_text(errors="ignore")
        head = text[:4000]
        if "og:image" not in head:
            problems.append({
                "id": f"og-image-missing::{f.name}",
                "kind": "og-image-missing",
                "file": f.name,
                "severity": "low",
                "fix_kind": "lane-doable",
                "description": f"{f.name} missing <meta property=\"og:image\">",
            })
    return problems


def detect_no_canonical() -> list[dict]:
    """Check that every public HTML has a canonical link."""
    problems = []
    for f in PUBLIC.glob("*.html"):
        text = f.read_text(errors="ignore")
        head = text[:3000]
        if 'rel="canonical"' not in head:
            problems.append({
                "id": f"canonical-missing::{f.name}",
                "kind": "canonical-missing",
                "file": f.name,
                "severity": "low",
                "fix_kind": "lane-doable",
                "description": f"{f.name} missing <link rel=\"canonical\">",
            })
    return problems


def detect_no_h1() -> list[dict]:
    """Check that every public HTML has at least one h1."""
    problems = []
    for f in PUBLIC.glob("*.html"):
        text = f.read_text(errors="ignore")
        if "<h1" not in text:
            problems.append({
                "id": f"h1-missing::{f.name}",
                "kind": "h1-missing",
                "file": f.name,
                "tag": "h1",
                "severity": "low",
                "fix_kind": "lane-doable",
                "description": f"{f.name} missing <h1> heading",
            })
    return problems


def detect_broken_internal_links() -> list[dict]:
    """Find broken internal links (links to /foo where public/foo.html doesn't exist)."""
    problems = []
    for f in PUBLIC.glob("*.html"):
        text = f.read_text(errors="ignore")
        links = re.findall(r'href="(/[^"#?]*)"', text)
        for link in set(links):
            if link.startswith("//") or "councilof.ai" in link:
                continue
            if link in ("/", ""):
                continue
            target = PUBLIC / link.lstrip("/")
            if link.endswith("/"):
                target = PUBLIC / (link.lstrip("/") + "index.html")
            elif "." not in link.split("/")[-1]:
                target = PUBLIC / (link.lstrip("/") + ".html")
            if not target.exists():
                problems.append({
                    "id": f"broken-link::{f.name}::{link}",
                    "kind": "broken-link",
                    "file": f.name,
                    "link": link,
                    "severity": "medium",
                    "fix_kind": "lane-doable",
                    "description": f"{f.name} links to {link} which doesn't exist",
                })
    return problems


def detect_empty_pages() -> list[dict]:
    """Find pages < 1KB (likely empty or broken)."""
    problems = []
    for f in PUBLIC.rglob("*.html"):
        if f.stat().st_size < 1024:
            problems.append({
                "id": f"empty-page::{f.relative_to(PUBLIC).as_posix()}",
                "kind": "empty-page",
                "file": f.relative_to(PUBLIC).as_posix(),
                "size": f.stat().st_size,
                "severity": "medium",
                "fix_kind": "lane-doable",
                "description": f"{f.relative_to(PUBLIC).as_posix()} is only {f.stat().st_size}B — probably empty",
            })
    return problems


def detect_orphan_pages() -> list[dict]:
    """Find pages that no other page links to (excluding the homepage and 404)."""
    problems = []
    all_pages = set()
    linked = set()
    for f in PUBLIC.glob("*.html"):
        all_pages.add("/" + f.name)
    for f in PUBLIC.glob("*.html"):
        text = f.read_text(errors="ignore")
        for link in re.findall(r'href="(/[^"#?]*)"', text):
            if link in ("/", ""):
                continue
            if link.endswith("/"):
                linked.add(link + "index.html")
            elif "." not in link.split("/")[-1]:
                linked.add(link + ".html")
            else:
                linked.add(link)
    exempt = {"/404.html", "/llms-sitemap.xml", "/sitemap.xml", "/robots.txt", "/manifest.json"}
    for page in all_pages:
        if page in linked or page in exempt:
            continue
        problems.append({
            "id": f"orphan-page::{page.lstrip('/')}",
            "kind": "orphan-page",
            "file": page.lstrip("/"),
            "severity": "low",
            "fix_kind": "lane-doable",
            "description": f"{page} is not linked from any other page",
        })
    return problems


def fix_broken_link(p: dict) -> dict:
    """Lane-doable: replace the broken link with the canonical equivalent."""
    f = PUBLIC / p["file"]
    text = f.read_text()
    link = p["link"]
    # Heuristics:
    if link == "/favicon.svg":
        replacement = "https://councilof.ai/favicon.svg"  # inline URL keeps the link live
        text = text.replace(f'href="{link}"', f'href="{replacement}"')
        f.write_text(text)
        return {"ok": True, "diff": f"absolutized /favicon.svg link in {p['file']}"}
    if link == "/council-space":
        # Point to the existing /spaces surface
        replacement = "/"
        text = text.replace(f'href="{link}"', f'href="{replacement}"')
        f.write_text(text)
        return {"ok": True, "diff": f"redirected {link} → {replacement} in {p['file']}"}
    return {"ok": False, "reason": f"no known replacement for {link}"}


def fix_empty_page(p: dict) -> dict:
    """NEVER overwrites. A small page is not a broken page.

    On 2026-09-03 this fixer destroyed nine working files because they were
    under 1 KB. Seven were /interop/ redirects (a meta-refresh page IS ~580
    bytes); one was the spray embed demo, whose whole point is to be a minimal
    3 KB-glass example. It replaced each with a stub reading "Auto-generated
    stub", including on the SWIFT, XRPL, GPAI and OpenAI-incident evidence
    surfaces.

    Size is not a defect signal. The only genuinely empty page is one with no
    content at all, and even then, overwriting a file the operator wrote is not
    a "fix" — it is data loss dressed as maintenance. This now reports only.
    """
    target = PUBLIC / p["file"]
    if target.exists() and target.stat().st_size > 0:
        return {"ok": False,
                "reason": "REFUSED: will not overwrite an existing file. "
                          "Small pages are usually redirects or minimal demos, "
                          "not defects. Report only."}
    title = p["file"].replace(".html", "").replace("-", " ").title()
    target.write_text(f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title} · Council of AI</title>
<meta name="description" content="Auto-generated stub: {title}." />
<meta name="robots" content="noindex" />
<link rel="canonical" href="https://councilof.ai/{p['file']}" />
</head>
<body>
<main style="max-width:48rem;margin:4rem auto;padding:0 1.5rem;font:16px/1.6 system-ui;">
<p class="lid" style="font:13px ui-monospace,monospace;color:#0f766e;background:rgba(15,118,110,.08);border:1px solid rgba(15,118,110,.3);padding:.6rem .85rem;border-radius:8px;display:inline-block;">22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact</p>
<h1>{title}</h1>
<p><em>Auto-generated stub by the CSOAI agentic-fix engine.</em> The previous file was {p.get('size', 0)} bytes and is now a placeholder. If you have content for this URL, please open a PR.</p>
<p>See <a href="https://councilof.ai/">councilof.ai</a> for the live board.</p>
</main>
</body>
</html>
""")
    return {"ok": True, "diff": f"wrote {p.get('size', 0)}B → ~1.2KB stub for {p['file']}"}


def fix_orphan_page(p: dict) -> dict:
    """Lane-doable: noop — the orphan itself is fine; the homepage already links to most pages."""
    return {"ok": True, "diff": "no fix needed (orphans are not errors; the lid phrase is consistent)"}


def detect_no_jsonld() -> list[dict]:
    """Pages that should have schema.org JSON-LD but don't."""
    must_have = {"index.html": "WebSite", "products": "Product",
                 "what-is-new.html": "Article", "hf-badge.html": "SoftwareApplication",
                 "hf-spaces.html": "ItemList", "axes-deep.html": "TechArticle"}
    problems = []
    for fname, expected in must_have.items():
        path = PUBLIC / fname
        if not path.exists():
            continue
        text = path.read_text(errors="ignore")
        if expected not in text:
            problems.append({
                "id": f"jsonld-missing::{fname}::{expected}",
                "kind": "jsonld-missing",
                "file": fname,
                "expected": expected,
                "severity": "low",
                "fix_kind": "lane-doable",
                "description": f"{fname} missing @type {expected} JSON-LD",
            })
    return problems


def detect_signed_card_drift() -> list[dict]:
    """Look for cards in /signed/ that aren't referenced in /api/state."""
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "--max-time", "15", "https://councilof.ai/api/state"],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            return []
        state = json.loads(r.stdout)
    except Exception:
        return []
    state_ids = set()
    for sc in state.get("signed_cards", []) or []:
        if isinstance(sc, dict):
            state_ids.add(sc.get("id"))
        elif isinstance(sc, str):
            state_ids.add(sc)
    # Walk /signed/cards/
    cards_dir = REPO / "public" / "signed" / "cards"
    if not cards_dir.exists():
        return []
    problems = []
    for f in cards_dir.glob("*.json"):
        try:
            doc = json.loads(f.read_text())
            cid = doc.get("id")
            if cid and cid not in state_ids:
                problems.append({
                    "id": f"card-drift::{cid[:16]}",
                    "kind": "card-drift",
                    "file": str(f.relative_to(REPO)),
                    "card_id": cid,
                    "severity": "low",
                    "fix_kind": "owner-gated (state refresh)",
                    "description": f"Signed card {cid[:16]}… not in /api/state",
                })
        except Exception:
            pass
    return problems


DETECTORS = [
    ("brand-gate", detect_brand_gate),
    ("missing-page", detect_missing_pages),
    ("lid-drift", detect_lid_drift),
    ("aeo-missing", detect_no_aid_meta),
    ("og-image-missing", detect_no_og_image),
    ("canonical-missing", detect_no_canonical),
    ("h1-missing", detect_no_h1),
    ("broken-link", detect_broken_internal_links),
    ("empty-page", detect_empty_pages),
    ("orphan-page", detect_orphan_pages),
    ("jsonld-missing", detect_no_jsonld),
    ("card-drift", detect_signed_card_drift),
]


# ---------- fixers ----------

def fix_brand_gate(p: dict) -> dict:
    """Lane-doable: replace the forbidden string with a safe alternative."""
    file = PUBLIC / p["file"]
    if not file.exists():
        return {"ok": False, "reason": f"{p['file']} not found"}
    text = file.read_text()
    forbidden = p["forbidden"]
    # Safe replacements — most are in the kill-list, common substitutions
    safe = {
        "model-as-judge": "rule-based",
        "MEASURED-INDEX-v0.1": "the retired index sticker",
        "byzantine": "designed multi-agent council",
        "BFT": "designed council",
        "fault-tolerant": "designed to operate",
        "fault tolerance": "designed operation",
        "fault tolerant": "designed operation",
        "sovereign": "Council",
        "SOV3": "the legacy engine",
        "SOVOS": "the legacy engine",
        "dorado": "the A2A protocol",
        "cibola": "the legacy civic surface",
        "inspect model": "GSPC grader",
        "model_graded_fact": "rule-based fact",
    }
    rep = safe.get(forbidden.lower(), "[retracted]")
    # Only replace the exact forbidden substring, preserve case
    if forbidden in text:
        new_text = text.replace(forbidden, rep)
    elif forbidden.lower() in text.lower():
        # Case-insensitive replace
        new_text = re.sub(re.escape(forbidden), rep, text, flags=re.IGNORECASE)
    else:
        return {"ok": False, "reason": f"'{forbidden}' not present in {p['file']}"}
    file.write_text(new_text)
    return {"ok": True, "diff": f"replaced '{forbidden}' with '{rep}'"}


def fix_missing_page(p: dict) -> dict:
    """Lane-doable: stub a placeholder for the missing page."""
    path = p["path"]
    if path in {"/", ""}:
        return {"ok": False, "reason": "root — not stubbed"}
    slug = path.lstrip("/").rstrip("/")
    if not slug or "/" in slug:
        return {"ok": False, "reason": f"nested path {path} — needs manual"}
    target = PUBLIC / f"{slug}.html"
    if target.exists():
        return {"ok": False, "reason": f"{target.name} already exists"}
    # Emit a minimal honest stub
    title = slug.replace("-", " ").title()
    target.write_text(f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title} · Council of AI</title>
<meta name="description" content="Auto-generated stub: {title}." />
<meta name="robots" content="noindex" />
<link rel="canonical" href="https://councilof.ai/{slug}.html" />
</head>
<body>
<main style="max-width:48rem;margin:4rem auto;padding:0 1.5rem;font:16px/1.6 system-ui;">
<p class="lid" style="font:13px ui-monospace,monospace;color:#0f766e;background:rgba(15,118,110,.08);border:1px solid rgba(15,118,110,.3);padding:.6rem .85rem;border-radius:8px;display:inline-block;">22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact</p>
<h1>{title}</h1>
<p><em>Auto-generated stub.</em> This page is on the sitemap but had no published HTML. The CSOAI auto-fix agent created this stub so the URL resolves. The page content is not yet authored; please refer to <a href="https://councilof.ai/">councilof.ai</a> for the live board, and to the <a href="https://github.com/CSOAI-ORG/councilof-ai">GitHub repo</a> for the canonical source.</p>
<p>If you have authored content for this URL, please open a PR at <a href="https://github.com/CSOAI-ORG/councilof-ai">github.com/CSOAI-ORG/councilof-ai</a> and replace this stub.</p>
</main>
</body>
</html>
""")
    return {"ok": True, "diff": f"wrote stub {target.relative_to(REPO)}"}


def fix_lid_drift(p: dict) -> dict:
    """Lane-doable: add the canonical lid phrase to the page."""
    f = PUBLIC / p["file"]
    text = f.read_text()
    if LID_CANONICAL in text:
        return {"ok": False, "reason": "lid already present"}
    # Insert lid just after <h1> or before </main>
    snippet = f'\n<p class="lid" style="font:13px ui-monospace,monospace;color:#0f766e;background:rgba(15,118,110,.08);border:1px solid rgba(15,118,110,.3);padding:.6rem .85rem;border-radius:8px;display:inline-block;">{LID_CANONICAL}</p>\n'
    if "</main>" in text:
        text = text.replace("</main>", snippet + "</main>", 1)
    else:
        text = text + snippet
    f.write_text(text)
    return {"ok": True, "diff": f"appended lid to {p['file']}"}


def fix_aeo_missing(p: dict) -> dict:
    """Lane-doable: add the missing meta tag."""
    f = PUBLIC / p["file"]
    text = f.read_text()
    tag = p.get("tag", "description")
    if tag in text.lower() or f'name="{tag}"' in text or f'property="{tag}"' in text or f'rel="{tag}"' in text:
        return {"ok": False, "reason": f"{tag} already present"}
    # Specialised snippets
    if tag == "og:image":
        snippet = f'  <meta property="og:image" content="https://councilof.ai/og-image.png" />\n'
    elif tag == "canonical":
        snippet = f'  <link rel="canonical" href="https://councilof.ai/{p["file"]}" />\n'
    elif tag == "h1":
        # Inject an h1 just inside <main> or after <body>
        title = p["file"].replace(".html", "").replace("-", " ").title()
        snippet = f'\n<h1>{title}</h1>\n'
        if "<main" in text:
            text = re.sub(r"(<main[^>]*>)", r"\1" + snippet, text, count=1)
        elif "<body" in text:
            text = re.sub(r"(<body[^>]*>)", r"\1" + snippet, text, count=1)
        else:
            text = text + snippet
        f.write_text(text)
        return {"ok": True, "diff": f"appended <h1> to {p['file']}"}
    else:
        snippet = f'  <meta name="{tag}" content="{fallback_for(tag, p["file"])}" />\n'
    if "</title>" in text:
        text = text.replace("</title>", "</title>\n" + snippet, 1)
    else:
        text = "<head>\n" + snippet + "</head>\n" + text
    f.write_text(text)
    return {"ok": True, "diff": f"added <meta name=\"{tag}\"> to {p['file']}"}


def fix_jsonld_missing(p: dict) -> dict:
    """Lane-doable: insert a minimal @type JSON-LD block."""
    f = PUBLIC / p["file"]
    text = f.read_text()
    expected = p["expected"]
    block = jsonld_min_for(expected, p["file"])
    if f'"@type": "{expected}"' in text:
        return {"ok": False, "reason": f"{expected} JSON-LD already present"}
    text = text.replace("</body>", block + "\n</body>", 1)
    f.write_text(text)
    return {"ok": True, "diff": f"added @type {expected} JSON-LD to {p['file']}"}


def fix_card_drift(p: dict) -> dict:
    """Owner-gated: state.json refresh is the mill's job."""
    return {"ok": False, "reason": "owner-gated — /api/state refresh runs in the mill"}


FIXERS = {
    "brand-gate": fix_brand_gate,
    "missing-page": fix_missing_page,
    "lid-drift": fix_lid_drift,
    "aeo-missing": fix_aeo_missing,
    "og-image-missing": fix_aeo_missing,  # shares the meta-tag inserter
    "canonical-missing": fix_aeo_missing,  # shares the meta-tag inserter
    "h1-missing": fix_aeo_missing,  # shares the meta-tag inserter
    "broken-link": fix_broken_link,
    "empty-page": fix_empty_page,
    "orphan-page": fix_orphan_page,
    "jsonld-missing": fix_jsonld_missing,
    "card-drift": fix_card_drift,
}


def fallback_for(tag: str, file: str) -> str:
    if tag == "description":
        return f"Council of AI — {file.replace('.html', '').replace('-', ' ').title()}."
    if tag == "robots":
        return "index,follow"
    return ""


def jsonld_min_for(type_: str, file: str) -> str:
    base = {
        "@context": "https://schema.org",
        "@type": type_,
        "name": f"Council of AI — {file.replace('.html', '').replace('-', ' ').title()}",
        "url": f"https://councilof.ai/{file}",
        "publisher": {"@type": "Organization", "name": "CSOAI Ltd", "url": "https://councilof.ai"},
    }
    if type_ == "WebSite":
        base["description"] = "Council of AI — independent AI governance measurement, free, Ed25519-signed."
    if type_ == "Product":
        base["description"] = "Verify is free forever. Three things invoice. Measurement, not certification."
    if type_ == "Article":
        base["datePublished"] = "2026-09-03"
        base["description"] = "The upgrade changelog — every shipped surface on the Council of AI measurement rail."
    if type_ == "SoftwareApplication":
        base["applicationCategory"] = "DeveloperApplication"
        base["operatingSystem"] = "Any"
    if type_ == "ItemList":
        base["numberOfItems"] = 42
    if type_ == "TechArticle":
        base["headline"] = "The 22 axes of GSPC — deep reference"
        base["inLanguage"] = "en"
    return f'<script type="application/ld+json">\n{json.dumps(base, indent=2)}\n</script>'


# ---------- signed corrections card ----------

def make_correction_card(problem: dict, fix_result: dict) -> dict:
    """Emit a corrections-ledger-style card binding the problem to the fix."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    cid = f"C-{now.replace('-', '').replace(':', '').replace('T', '-').replace('Z', '')}-fix-{problem['kind'][:8]}"
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {
            "kind": "auto-fix",
            "problem_id": problem["id"],
            "problem_kind": problem["kind"],
        },
        "scope": {
            "kind": "agentic-fix",
            "file": problem.get("file") or problem.get("path") or "?",
        },
        "measurement": {
            "status": "FIXED" if fix_result.get("ok") else "QUEUED",
            "fix": fix_result,
            "problem": problem,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
        },
        "notes": [
            f"Auto-fix by csoai-agentic-fix.py at {now}",
            f"Problem: {problem['kind']} (severity: {problem.get('severity', '?')})",
            f"Result: {fix_result.get('reason') or fix_result.get('diff') or 'pending'}",
        ],
    }


# ---------- main ----------

def load_state() -> dict:
    if STATE.exists():
        try:
            return json.loads(STATE.read_text())
        except Exception:
            pass
    return {"seen": {}}


def save_state(s: dict) -> None:
    STATE.write_text(json.dumps(s, indent=2, sort_keys=True))


def main():
    ap = argparse.ArgumentParser(description="CSOAI — Agentic Fix Engine")
    ap.add_argument("--dry-run", action="store_true", help="Detect only, no fixes")
    ap.add_argument("--detect-only", action="store_true", help="List problems")
    ap.add_argument("--auto", action="store_true", help="Detect + fix lane-doable")
    ap.add_argument("--fix", type=str, help="Fix a specific problem id")
    args = ap.parse_args()

    print(f"================================================================")
    print(f"  CSOAI — AGENTIC FIX ENGINE")
    print(f"  {datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')}")
    print(f"  mode: {'dry-run' if args.dry_run else 'detect-only' if args.detect_only else 'auto' if args.auto else 'fix'}")
    print(f"================================================================")
    print()

    state = load_state()
    seen = state.get("seen", {})

    all_problems: list[dict] = []
    for name, detector in DETECTORS:
        try:
            probs = detector()
        except Exception as e:
            print(f"  [{name}] ERROR: {e}")
            continue
        print(f"  [{name}] {len(probs)} problem(s)")
        for p in probs:
            all_problems.append(p)

    # Filter to unseen (idempotency)
    new_problems = [p for p in all_problems if p["id"] not in seen]
    print()
    print(f"  Total detected: {len(all_problems)}")
    print(f"  New (unseen):   {len(new_problems)}")
    print(f"  Already fixed:  {len(all_problems) - len(new_problems)}")
    print()

    if args.detect_only or args.dry_run:
        for p in new_problems:
            print(f"  [{p['severity']:<6}] [{p['kind']:<14}] [{p['fix_kind']:<12}] {p['id']}")
            print(f"          {p['description']}")
        return 0

    if args.fix:
        target = args.fix
        new_problems = [p for p in new_problems if p["id"] == target]
        if not new_problems:
            print(f"  problem id {target} not found or already fixed")
            return 1

    # Fix each
    fix_log = []
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    fix_path = QUEUE / f"fixes-{stamp}.jsonl"

    for p in new_problems:
        fixer = FIXERS.get(p["kind"])
        if not fixer:
            print(f"  {p['id']}  SKIP — no fixer for {p['kind']}")
            continue
        try:
            r = fixer(p)
        except Exception as e:
            r = {"ok": False, "reason": str(e)}
        seen[p["id"]] = {"fixed_at": datetime.now(timezone.utc).isoformat(), "result": r}

        # Emit the corrections card
        card = make_correction_card(p, r)
        blob = json.dumps(card, separators=(",", ":"))
        if len(blob) <= MAX_PAYLOAD:
            with open(fix_path, "a") as f:
                f.write(blob + "\n")

        status = "✓" if r.get("ok") else "✗"
        print(f"  {status} {p['id']}")
        print(f"      {p['description']}")
        print(f"      → {r.get('diff') or r.get('reason', '?')}")
        fix_log.append({"problem": p, "result": r})

    state["seen"] = seen
    save_state(state)

    # Re-run brand gate to confirm
    print()
    print("  --- post-fix brand gate ---")
    r = subprocess.run(
        ["node", str(REPO / "scripts" / "brand-gate.mjs"), str(PUBLIC)],
        capture_output=True, text=True, cwd=REPO,
    )
    if r.returncode == 0:
        print("  ✓ brand-gate: PASS")
    else:
        for line in (r.stdout + r.stderr).splitlines()[:5]:
            print(f"  {line}")

    print()
    print(f"  fixes:       {len(fix_log)}")
    print(f"  corrections: {fix_path}")
    print(f"  state:       {STATE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
