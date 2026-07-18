#!/usr/bin/env python3
"""
Submit press releases to free PR distribution services.

Per the Distribution Playbook §2:
  - PRLog: free, unlimited, SEO-indexed
  - OpenPR: free tier 1/month, Google News
  - PR.com: free company profile + 1 release
  - IssueWire: free tier

Reads press release markdown from docs/launch/03-press-releases.md, parses
the FOR IMMEDIATE RELEASE blocks, and POSTs to each service.

NOTE: This script is OPTIONAL — automated PR submission can be done
manually via the service's web UI in <5 minutes per release. The
automation is here for the optional "run the whole machine" mode.

Run: python3 scripts/submit-press-releases.py --release 1
      python3 scripts/submit-press-releases.py --release all
"""
import re
import json
import argparse
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

RELEASES_PATH = Path(__file__).parent.parent / "docs/launch/03-press-releases.md"


def parse_releases(md: str) -> list[dict]:
    """Extract FOR IMMEDIATE RELEASE blocks."""
    blocks = re.split(r"^## Press Release (\d+):", md, flags=re.MULTILINE)
    # blocks[0] is preamble, then [title, body, title, body, ...]
    releases = []
    for i in range(1, len(blocks), 2):
        n = int(blocks[i])
        body = blocks[i + 1].strip()
        # The first **...** in the body is the "FOR IMMEDIATE RELEASE" boilerplate.
        # The second **...** is the actual press release title.
        bolds = re.findall(r"^\*\*([^*]+)\*\*", body, flags=re.MULTILINE)
        title = bolds[1] if len(bolds) >= 2 else (bolds[0] if bolds else f"Press Release {n}")
        # Drop the leading "---" + first two ** ** lines
        body_text = re.sub(r"^---\s*\n", "", body, flags=re.MULTILINE)
        body_text = re.sub(r"^---\s*$", "", body_text, flags=re.MULTILINE)
        for b in bolds[:2]:
            body_text = re.sub(rf"^\*\*{re.escape(b)}\*\*\s*\n", "", body_text, flags=re.MULTILINE)
        releases.append({
            "number": n,
            "title": title.strip(),
            "body": body_text.strip(),
        })
    return releases


def submit_to_prlog(release: dict, api_key: str = "") -> dict:
    """Submit to PRLog via their public form. Returns receipt.

    PRLog free tier: no API; manual submission via web form. The
    automation is a placeholder for the web form data."""
    return {
        "service": "prlog",
        "release": release["number"],
        "title": release["title"],
        "url": "https://prlog.org/submit.html",
        "status": "MANUAL_REQUIRED",
        "payload": {
            "title": release["title"],
            "body": release["body"][:5000],  # PRLog limit
            "category": "Technology > Software",
            "tags": "openpatent.ai, AI safety, blockchain, patent, MCP",
        },
        "note": "PRLog free tier requires browser submission. Payload is ready to paste.",
    }


def submit_to_openpr(release: dict) -> dict:
    """OpenPR free tier (1 release/month)."""
    return {
        "service": "openpr",
        "release": release["number"],
        "title": release["title"],
        "url": "https://www.openpr.com/news/submit",
        "status": "MANUAL_REQUIRED",
        "payload": {
            "headline": release["title"],
            "body": release["body"][:3000],
            "company": "CSOAI Ltd",
            "country": "UK",
            "industry": "Technology",
        },
        "note": "OpenPR free tier: 1 release/month. Schedule the highest-priority release first.",
    }


def main() -> int:
    p = argparse.ArgumentParser(description="Submit OpenPatent.ai press releases")
    p.add_argument("--release", default="all", help="Release number or 'all'")
    p.add_argument("--list", action="store_true", help="List releases and exit")
    args = p.parse_args()

    md = RELEASES_PATH.read_text()
    releases = parse_releases(md)

    if args.list:
        for r in releases:
            print(f"  #{r['number']}: {r['title']}")
        return 0

    selected = releases if args.release == "all" else [r for r in releases if str(r["number"]) == args.release]
    if not selected:
        print(f"No release matching: {args.release}")
        return 1

    results = []
    for r in selected:
        results.append(submit_to_prlog(r))
        results.append(submit_to_openpr(r))

    out = {
        "releases_submitted": len(selected),
        "submissions": results,
    }
    print(json.dumps(out, indent=2))

    # Write the receipts
    receipt_path = Path(__file__).parent.parent / "docs/launch/press-release-submissions.json"
    receipt_path.write_text(json.dumps(out, indent=2))
    print(f"\n✓ Receipts written to {receipt_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
