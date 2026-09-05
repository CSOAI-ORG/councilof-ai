#!/usr/bin/env python3
"""hf-eat-all.py — bring the GSPC badge to every public model on HuggingFace.

Lane-doable: only writes unsigned UNMEASURED cards to local + uploads them
as CSOAI org datasets (writes_board=false). The live GSPC board remains
the source of truth; this script only publishes "this model exists, it
has not been measured yet" badges. MEASURED only after VALID signed card.

Usage:
  ./hf-eat-all.py --dry-run                    # show plan, no upload
  ./hf-eat-all.py --limit 1000                 # first 1k text-gen models
  ./hf-eat-all.py --limit 1000 --pipeline text-generation
  ./hf-eat-all.py --upload                     # actually upload to HF
  ./hf-eat-all.py --pipeline image-text-to-text --limit 500
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent
HF_API = "https://huggingface.co/api/models"
BOARD_URL = "https://councilof.ai/api/gspc"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
CSOAI_ORG = "csoai"
MAX_PAYLOAD = 3072  # signed-card ceiling


def http_get(url: str, *, headers: dict | None = None, timeout: int = 15):
    """GET with JSON parse + 3-attempt retry on 5xx. Returns (body, link_header)."""
    # A caller-supplied User-Agent still wins; this is only the default. urllib's
    # own default identifies as "Python-urllib/3.x", which our /api/gspc bot rule
    # 403s (measured: no-UA 200, browser-UA 200, Python-urllib 403).
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "csoai-hf-eat-all (+https://councilof.ai)",
        **(headers or {}),
    })
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = json.loads(r.read().decode("utf-8"))
                link = r.headers.get("Link", "") or r.headers.get("link", "")
                return body, link
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (404, 403, 400):
                # 400 = bad cursor; caller should stop pagination
                return None, ""
            time.sleep(1.5 * (attempt + 1))
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"GET {url} failed after 3 tries: {last}")


def parse_next_cursor(link_header: str) -> str | None:
    """Extract the cursor=... from an RFC 5988 Link header rel='next'."""
    if not link_header:
        return None
    # rel="next" <...cursor=...>; rel="next"
    for chunk in link_header.split(","):
        chunk = chunk.strip()
        if 'rel="next"' not in chunk and "rel=next" not in chunk:
            continue
        # chunk looks like '<https://...?cursor=eyI...>; rel="next"'
        url_part = chunk.split(";", 1)[0].strip()
        if url_part.startswith("<") and url_part.endswith(">"):
            url_part = url_part[1:-1]
        # parse the cursor query param
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(url_part).query)
        cur = qs.get("cursor", [None])[0]
        if cur:
            return cur
    return None


def list_models(*, pipeline: str | None, limit: int, cursor: str | None = None,
                sort: str = "downloads", direction: int = -1) -> tuple[list[dict], str | None]:
    """Fetch one page of models. Returns (rows, next_cursor)."""
    params = {"limit": min(limit, 100), "full": "false", "sort": sort,
              "direction": direction}
    if pipeline:
        params["filter"] = pipeline
    if cursor:
        params["cursor"] = cursor
    url = f"{HF_API}?{urllib.parse.urlencode(params)}"
    rows, link = http_get(url)
    if rows is None:
        return [], None
    return rows, parse_next_cursor(link)


def canonical_payload(slug: str, *, axes_status: str = "UNMEASURED") -> dict:
    """The unsigned card body that the badger publishes. Status is always
    UNMEASURED because no measurement has been performed yet — a listing
    is not a measurement. The live board is the only MEASURED source.
    """
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": "did:web:csoai.org#card-attestation-1",
        "as_of": now,
        "subject": {
            "kind": "model",
            "hub": "huggingface",
            "slug": slug,
        },
        "totals": {
            "axes_evaluated": 0,
            "measured_axes": 0,
            "unmeasured_axes": 14,
            "withheld_axes": 0,
            "public_count": "0 axes · 0 measured (UNMEASURED — listing only)",
        },
        "axes": [],
        "notes": [
            "Card produced by the HF badge enroller. Status is UNMEASURED.",
            "Listing is not measurement. Live board is the authority: GET " + BOARD_URL,
            "Verify a card: https://councilof.ai/gspc-verify (free, no account)",
            "Measurement, not certification. Never claim MEASURED until VALID signed card.",
        ],
        "links": {
            "live_board": BOARD_URL,
            "verify": "https://councilof.ai/gspc-verify",
            "how_to_verify": "https://councilof.ai/signed/HOW-TO-VERIFY.md",
        },
    }


def plan(*, pipeline: str | None, limit: int) -> list[str]:
    """Walk the HF model list and yield slugs until we hit `limit`."""
    out: list[str] = []
    cursor = None
    page = 0
    while len(out) < limit:
        rows, cursor = list_models(pipeline=pipeline, limit=limit, cursor=cursor)
        if not rows:
            break
        page += 1
        for r in rows:
            slug = r.get("id") or r.get("modelId")
            if slug:
                out.append(slug)
            if len(out) >= limit:
                break
        if not cursor:
            break
    return out[:limit]


def main():
    ap = argparse.ArgumentParser(description="GSPC badge enroller for HuggingFace models.")
    ap.add_argument("--limit", type=int, default=100, help="Max models to badge.")
    ap.add_argument("--pipeline", type=str, default="text-generation",
                    choices=["text-generation", "text2text-generation",
                             "conversational", "image-text-to-text", None],
                    help="HF pipeline tag to filter on.")
    ap.add_argument("--dry-run", action="store_true", help="Plan only, do not write.")
    ap.add_argument("--upload", action="store_true",
                    help="Actually upload unsigned cards to a HF dataset under the "
                         f"{CSOAI_ORG} org. Requires HF_TOKEN in the env.")
    ap.add_argument("--out-dir", type=str, default=str(HERE / "_queue"),
                    help="Where to write the unsigned card JSONL before any upload.")
    args = ap.parse_args()

    print(f"=== HF GSPC BADGE ENROLLER ===")
    print(f"  limit       : {args.limit}")
    print(f"  pipeline    : {args.pipeline or '(all)'}")
    print(f"  dry-run     : {args.dry_run}")
    print(f"  upload      : {args.upload}")
    print(f"  out-dir     : {args.out_dir}")
    print()

    slugs = plan(pipeline=args.pipeline, limit=args.limit)
    print(f"Planned: {len(slugs)} models")
    if slugs[:5]:
        print(f"  first 5: {slugs[:5]}")
        print(f"  last 1 : {slugs[-1]}")
    print()

    if args.dry_run:
        print("(dry-run) no cards written.")
        return 0

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    jsonl_path = out / f"badge-{args.pipeline or 'all'}-{stamp}.jsonl"

    n_written = 0
    n_skipped = 0
    too_big = 0
    with open(jsonl_path, "w") as f:
        for slug in slugs:
            payload = canonical_payload(slug)
            blob = json.dumps(payload, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                too_big += 1
                n_skipped += 1
                continue
            f.write(blob + "\n")
            n_written += 1

    print(f"=== Summary ===")
    print(f"  planned    : {len(slugs)}")
    print(f"  written    : {n_written}")
    print(f"  skipped    : {n_skipped} ({too_big} > 3KB ceiling)")
    print(f"  jsonl      : {jsonl_path}")
    print(f"  size       : {jsonl_path.stat().st_size} bytes")
    print()

    if args.upload:
        print("Uploading is intentionally NOT wired in this script.")
        print("Reason: writes to the csoai HF org require an HF_TOKEN with repo.write;")
        print("the badger should be run inside the existing mill_hub_queue.py cron path")
        print("so the same gates (size, schema, kind=hub-listing) apply. Owner gate: HF_TOKEN.")
        print("Lane-doable next step: copy the jsonl into harness/gspc-top100/queue/ and let")
        print("the existing cron sign + upload it.")
    else:
        print("(not uploading — pass --upload to plan the upload step explicitly.)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
