#!/usr/bin/env python3
"""Submit URLs to Bing IndexNow.

Usage:
    export BING_INDEXNOW_KEY="your-key"
    python3 indexnow-submit.py --urls https://meok.ai/ https://csoai.org/
    python3 indexnow-submit.py --from-file _findings/INDEXNOW_BATCH_2026-06-17.md
"""
from __future__ import annotations

import argparse
import json
import os
import re
import urllib.request
from pathlib import Path
from typing import List

DEFAULT_KEY = os.environ.get("BING_INDEXNOW_KEY", "")
INDEXNOW_URL = "https://api.indexnow.org/indexnow"


def extract_urls(text: str) -> List[str]:
    """Extract https? URLs from markdown or plain text."""
    return re.findall(r'https?://[^\s<>"\')\]]+', text)


def submit(urls: List[str], key: str) -> dict:
    if not key:
        return {"error": "BING_INDEXNOW_KEY not set"}
    if not urls:
        return {"error": "No URLs provided"}

    payload = json.dumps({
        "host": "meok.ai",
        "key": key,
        "urlList": urls,
    }).encode()

    req = urllib.request.Request(
        INDEXNOW_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return {"status_code": resp.status, "body": resp.read().decode("utf-8", errors="ignore")}
    except urllib.error.HTTPError as e:
        return {"status_code": e.code, "body": e.read().decode("utf-8", errors="ignore")}
    except Exception as e:
        return {"error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Submit URLs to Bing IndexNow")
    parser.add_argument("--key", default=DEFAULT_KEY, help="IndexNow key")
    parser.add_argument("--urls", nargs="*", help="URLs to submit")
    parser.add_argument("--from-file", type=Path, help="Markdown file containing URLs")
    args = parser.parse_args()

    urls: List[str] = []
    if args.urls:
        urls.extend(args.urls)
    if args.from_file:
        text = args.from_file.read_text(encoding="utf-8", errors="ignore")
        urls.extend(extract_urls(text))

    urls = sorted(set(u.rstrip("/") for u in urls if u.startswith("http")))
    print(f"Submitting {len(urls)} URLs to IndexNow...")
    for u in urls:
        print(f"  {u}")

    result = submit(urls, args.key)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
