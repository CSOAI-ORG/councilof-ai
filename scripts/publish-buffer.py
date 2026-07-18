#!/usr/bin/env python3
"""Publish social posts to Buffer once BUFFER_ACCESS_TOKEN is available.

Usage:
    python3 scripts/publish-buffer.py --dry-run
    python3 scripts/publish-buffer.py --file .hive/content/social-week-2026-06-17.md
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
HOME = Path("/Users/nicholas")
ENV_FILE = ROOT / ".env.local"
BUFFER_API = "https://api.bufferapp.com/1"


def load_env() -> dict:
    env = dict(os.environ)
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                v = v.strip().strip('"').strip("'")
                env.setdefault(k, v)
    return env


def buffer_get(path: str, token: str) -> dict:
    req = urllib.request.Request(
        f"{BUFFER_API}{path}",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def buffer_post(path: str, token: str, payload: dict) -> dict:
    data = urllib.parse.urlencode(payload).encode()
    req = urllib.request.Request(
        f"{BUFFER_API}{path}",
        data=data,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def extract_posts(text: str) -> list[dict]:
    """Extract LinkedIn/Twitter posts from the markdown batch file."""
    posts = []
    # Find each post section
    sections = re.split(r"\n## Post \d+ —", text)
    for section in sections[1:]:
        title_match = re.search(r"^(.+?)\n", section)
        platform_match = re.search(r"\*\*Hook:\*\* (.+)", section)
        body_match = re.search(r"\*\*Body:\*\*\n(.+?)(?=\n---|\n\*\*Twitter|\Z)", section, re.DOTALL)
        twitter_match = re.search(r"\*\*Twitter \(280-char\):\*\*\n(.+?)(?=\n---|\Z)", section, re.DOTALL)

        title = title_match.group(1).strip() if title_match else "Untitled"
        hook = platform_match.group(1).strip() if platform_match else ""
        body = body_match.group(1).strip() if body_match else ""
        twitter = twitter_match.group(1).strip() if twitter_match else ""

        # Clean markdown blockquotes
        body = re.sub(r"^>\s?", "", body, flags=re.MULTILINE)
        twitter = re.sub(r"^>\s?", "", twitter, flags=re.MULTILINE)

        posts.append({
            "title": title,
            "hook": hook,
            "linkedin": body,
            "twitter": twitter,
        })
    return posts


def main():
    parser = argparse.ArgumentParser(description="Publish to Buffer")
    parser.add_argument("--file", type=Path, default=HOME / ".hive" / "content" / "social-week-2026-06-17.md")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be posted")
    parser.add_argument("--platform", choices=["linkedin", "twitter", "both"], default="both")
    args = parser.parse_args()

    env = load_env()
    token = env.get("BUFFER_ACCESS_TOKEN", "")

    if not token and not args.dry_run:
        print("❌ BUFFER_ACCESS_TOKEN not set")
        sys.exit(1)

    text = args.file.read_text(encoding="utf-8", errors="ignore")
    posts = extract_posts(text)
    print(f"Found {len(posts)} post(s) in {args.file}")

    if args.dry_run:
        for i, post in enumerate(posts, 1):
            print(f"\n--- Post {i}: {post['title']} ---")
            if args.platform in ("linkedin", "both"):
                print("[LinkedIn]")
                print(post["linkedin"][:300] + "...")
            if args.platform in ("twitter", "both"):
                print("[Twitter]")
                print(post["twitter"][:200] + "...")
        print("\n✅ Dry run complete")
        return

    # Get profiles
    try:
        profiles = buffer_get("/profiles.json", token)
        print(f"Found {len(profiles)} Buffer profile(s)")
    except Exception as e:
        print(f"❌ Failed to fetch Buffer profiles: {e}")
        sys.exit(1)

    for i, post in enumerate(posts, 1):
        for profile in profiles:
            service = profile.get("service", "unknown")
            if service == "twitter" and args.platform not in ("twitter", "both"):
                continue
            if service == "linkedin" and args.platform not in ("linkedin", "both"):
                continue

            text_to_post = post["twitter"] if service == "twitter" else post["linkedin"]
            payload = {
                "profile_ids[]": profile["id"],
                "text": text_to_post,
            }
            try:
                result = buffer_post("/updates/create.json", token, payload)
                print(f"✅ Post {i} queued for {service}: {result.get('id', 'no-id')}")
            except Exception as e:
                print(f"❌ Post {i} failed for {service}: {e}")


if __name__ == "__main__":
    main()
