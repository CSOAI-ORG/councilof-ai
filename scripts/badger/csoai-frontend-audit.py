#!/usr/bin/env python3
"""csoai-frontend-audit.py — audit every public HTML page as end user.

Lane-doable: walks every /public/*.html page, checks:
  1. HTTP 200 (live)
  2. <title> present
  3. <h1> present
  4. <meta description> present
  5. OG tags (og:title, og:description, og:image)
  6. JSON-LD (schema.org)
  7. Canonical URL
  8. AEO markers (Organization, WebSite, SoftwareApplication, Dataset)
  9. Lid phrase present
  10. No locked words (certification, conformity mark, etc.) outside legitimate context

Each page gets a score 0-10. Pages below 8 are flagged for improvement.

The audit treats every page as if a stranger — a journalist, a regulator,
a vendor evaluating CSOAI — is the end user.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent.parent / "public"
OUT = HERE / "_queue" / "frontend-audit"
DID = "did:web:csoai.org#card-attestation-1"

# Markers we want every page to have
AEO_TYPES = ["Organization", "WebSite", "SoftwareApplication", "Dataset", "Person"]
LID_PHRASE = "22 axes · 22 measured"


def fetch(url: str, timeout: int = 15) -> tuple[int, str]:
    """Fetch a URL and return (status_code, body)."""
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-w", "\n%{http_code}",
             "-H", "User-Agent: csoai-frontend-audit",
             "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
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


def check_page(url: str, path: str) -> dict:
    """Check a single page against the 10 end-user criteria."""
    code, body = fetch(url)
    if code != 200:
        return {
            "url": url, "path": path,
            "live": False, "http_code": code,
            "score": 0, "issues": [f"HTTP {code} — not live"],
        }

    issues = []
    score = 10

    # 2. <title>
    if "<title" not in body or "<title></title>" in body or "<title >" in body:
        issues.append("missing <title>")
        score -= 1

    # 3. <h1>
    h1_match = re.search(r"<h1[^>]*>([^<]+)</h1>", body)
    if not h1_match:
        issues.append("missing <h1>")
        score -= 1

    # 4. <meta description>
    if not re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'][^"\']+', body):
        issues.append("missing or empty meta description")
        score -= 1

    # 5. OG tags
    og_tags = re.findall(r'og:(\w+)\s+content=["\']([^"\']+)["\']', body)
    if not og_tags:
        issues.append("missing OG tags")
        score -= 1

    # 6. JSON-LD
    jsonld_blocks = re.findall(r'"@type":\s*"([^"]+)"', body)
    if not jsonld_blocks:
        issues.append("missing JSON-LD schema")
        score -= 1
    elif not any(t in jsonld_blocks for t in AEO_TYPES):
        issues.append(f"JSON-LD has no AEO types ({', '.join(AEO_TYPES)})")
        score -= 0.5

    # 7. Canonical URL
    if not re.search(r'<link[^>]+rel=["\']canonical["\']', body):
        issues.append("missing canonical URL")
        score -= 0.5

    # 8. AEO markers
    aeo_hits = [t for t in AEO_TYPES if t in jsonld_blocks]
    if len(aeo_hits) < 2:
        issues.append(f"only {len(aeo_hits)} AEO markers (want ≥2)")

    # 9. Lid phrase
    if LID_PHRASE not in body:
        issues.append("missing lid phrase")
        score -= 0.5

    # 10. No forbidden words (in user-facing surface, not interop evidence)
    body_lower = body.lower()
    bad_words = ["conformity mark", "buy a score", "start certification"]
    for w in bad_words:
        if w in body_lower:
            issues.append(f"contains forbidden word: {w}")
            score -= 2

    # Bonus checks
    has_view_transitions = "view-transitions" in body
    has_dark_mode = "dark" in body or "theme" in body

    return {
        "url": url, "path": path,
        "live": True, "http_code": code,
        "score": max(0, score),
        "issues": issues,
        "checks": {
            "title": "<title" in body,
            "h1": bool(h1_match),
            "h1_text": h1_match.group(1)[:80] if h1_match else None,
            "meta_description": 'name="description"' in body,
            "og_tags": len(og_tags),
            "jsonld_types": list(set(jsonld_blocks)),
            "canonical": 'rel="canonical"' in body,
            "aeo_markers": aeo_hits,
            "lid_phrase": LID_PHRASE in body,
            "view_transitions": has_view_transitions,
            "dark_mode": has_dark_mode,
            "size_kb": round(len(body) / 1024, 1),
        },
    }


def main():
    ap = argparse.ArgumentParser(description="Audit every public page.")
    ap.add_argument("--limit", type=int, default=20)
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — FRONT-END AUDIT (as end user)")
    print("================================================================")
    print()

    OUT.mkdir(parents=True, exist_ok=True)

    pages = sorted(PUBLIC.glob("*.html"))[:args.limit]
    results = []
    n_perfect = 0
    n_ok = 0
    n_fail = 0

    for page in pages:
        url = f"https://councilof.ai/{page.name}"
        result = check_page(url, page.name)
        results.append(result)
        if result["score"] >= 9:
            n_perfect += 1
            tag = "✓"
        elif result["score"] >= 6:
            n_ok += 1
            tag = "⚠"
        else:
            n_fail += 1
            tag = "✗"
        issues_str = ", ".join(result["issues"][:3]) if result["issues"] else "perfect"
        print(f"  {tag} {result['score']:>4.1f}/10  {page.name:<40} {result['http_code']} {result.get('size_kb', '?')}KB  {issues_str[:80]}")

    print()
    print(f"  perfect (≥9): {n_perfect}/{len(results)}")
    print(f"  ok (6-9):     {n_ok}/{len(results)}")
    print(f"  fail (<6):    {n_fail}/{len(results)}")

    # Emit the report
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report = {
        "kind": "csoai.frontend-audit",
        "issuer": DID,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "n_pages": len(results),
        "n_perfect": n_perfect,
        "n_ok": n_ok,
        "n_fail": n_fail,
        "average_score": round(sum(r["score"] for r in results) / max(1, len(results)), 2),
        "results": results,
        "next_actions": [
            f"Improve the {n_fail} pages scoring <6",
            "Add lid phrase + JSON-LD + canonical to every page",
            "Add a11y checks (alt text, aria-label)",
            "Build the audit into the preflight gate",
        ],
    }
    out_path = OUT / f"frontend-audit-{stamp}.json"
    out_path.write_text(json.dumps(report, indent=2, sort_keys=True))
    print()
    print(f"  report: {out_path}")
    print(f"  average score: {report['average_score']}/10")
    return 0


if __name__ == "__main__":
    sys.exit(main())
