#!/usr/bin/env python3
"""Fetch and cache the evidence bytes for the benchmark-quality register.

Read-only. Never more than FETCH_BUDGET GETs per publisher, robots.txt included.
Every fetch is written to scripts/fixtures/benchmark-quality/<publisher>/<key>.body
with a sibling <key>.meta.json carrying the URL, the final URL after redirects, the
status, the response headers, the fetch date and the SHA-256 of the body.

The register NEVER reads the network. It reads only these files. That is what makes
`register.py --check` a drift check rather than a second opinion.

    python3 scripts/benchmark_quality/fetch.py            # fetch everything missing
    python3 scripts/benchmark_quality/fetch.py --publisher epoch-ai
    python3 scripts/benchmark_quality/fetch.py --plan     # print the plan, fetch nothing
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
FIXTURES = ROOT / "scripts" / "fixtures" / "benchmark-quality"

FETCH_BUDGET = 3  # GETs per publisher, robots.txt included. Hard cap.
UA = "csoai-benchmark-quality-register/1.0 (+https://councilof.ai/interop/benchmark-quality/; read-only; contact nicholas@csoai.org)"

# ── THE FETCH PLAN ────────────────────────────────────────────────────────────────
# Three artifacts per publisher, in this order and no more:
#   robots  — the crawl policy, read BEFORE anything else, and itself evidence (O4).
#   board   — the surface a reader lands on to see results.
#   machine — the enumerating index or machine-readable channel. Chosen as an INDEX
#             query (HF /api/datasets?search=, GitHub /search/repositories?q=) rather
#             than a path we invented, because a 404 on a guessed URL is evidence
#             about the guess, not about the publisher.
PLAN: dict[str, dict] = {
    "lmarena": {
        "name": "LMArena (arena.ai)",
        "board_kind": "html",
        "fetch": [
            ("robots", "https://lmarena.ai/robots.txt"),
            ("board", "https://lmarena.ai/leaderboard"),
            ("machine", "https://huggingface.co/api/datasets?search=lmarena&full=true&limit=50"),
        ],
    },
    "vals-ai": {
        "name": "Vals AI",
        "board_kind": "html",
        "fetch": [
            ("robots", "https://www.vals.ai/robots.txt"),
            ("board", "https://www.vals.ai/"),
            ("machine", "https://huggingface.co/api/datasets?search=vals-ai&full=true&limit=50"),
        ],
    },
    "helm-crfm": {
        "name": "HELM (Stanford CRFM)",
        "board_kind": "html",
        "fetch": [
            ("robots", "https://crfm.stanford.edu/robots.txt"),
            ("board", "https://crfm.stanford.edu/helm/"),
            ("machine", "https://api.github.com/search/repositories?q=helm+user:stanford-crfm&sort=stars"),
        ],
    },
    "epoch-ai": {
        "name": "Epoch AI",
        "board_kind": "html",
        "fetch": [
            ("robots", "https://epoch.ai/robots.txt"),
            ("board", "https://epoch.ai/data/ai-benchmarking-dashboard"),
            ("machine", "https://api.github.com/search/repositories?q=user:epoch-research&sort=stars"),
        ],
    },
    "artificial-analysis": {
        "name": "Artificial Analysis",
        "board_kind": "html",
        "fetch": [
            ("robots", "https://artificialanalysis.ai/robots.txt"),
            ("board", "https://artificialanalysis.ai/leaderboards/models"),
            ("machine", "https://huggingface.co/api/datasets?search=artificialanalysis&full=true&limit=50"),
        ],
    },
    "scale-seal": {
        "name": "Scale AI SEAL",
        "board_kind": "html",
        "fetch": [
            ("robots", "https://scale.com/robots.txt"),
            ("board", "https://scale.com/leaderboard"),
            ("machine", "https://huggingface.co/api/datasets?search=scale-seal&full=true&limit=50"),
        ],
    },
    "uk-aisi-inspect": {
        "name": "UK AI Security Institute (Inspect)",
        "board_kind": "html",
        "fetch": [
            ("robots", "https://inspect.aisi.org.uk/robots.txt"),
            ("board", "https://inspect.aisi.org.uk/"),
            ("machine", "https://api.github.com/search/repositories?q=inspect+user:UKGovernmentBEIS&sort=stars"),
        ],
    },
    # ── THE EIGHTH ROW. Ourselves, graded by the same predicates, on the same
    # budget, from the same kind of bytes. See SELF_ASSESSED in register.py: the row
    # is marked self_assessed=true everywhere it appears and is never counted as an
    # independent measurement of us.
    "council-of-ai": {
        "name": "Council of AI (CSOAI Ltd) — SELF-ASSESSED",
        "board_kind": "html",
        "self_assessed": True,
        "fetch": [
            ("robots", "https://councilof.ai/robots.txt"),
            ("board", "https://councilof.ai/board"),
            ("machine", "https://huggingface.co/api/datasets?search=csoai&full=true&limit=50"),
        ],
    },
}


def sh(url: str, out: pathlib.Path) -> dict:
    hdr = out.with_suffix(".headers")
    proc = subprocess.run(
        ["curl", "-sS", "-L", "-m", "45", "--compressed",
         "-A", UA, "-D", str(hdr), "-o", str(out), "-w",
         "%{http_code}\t%{url_effective}\t%{content_type}\t%{size_download}\t%{num_redirects}", url],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        return {"error": f"curl exit {proc.returncode}: {proc.stderr.strip()[:400]}"}
    code, eff, ctype, size, redirs = (proc.stdout.split("\t") + [""] * 5)[:5]
    body = out.read_bytes()
    # TWO BYTE COUNTS, BECAUSE THEY DIFFER AND ONLY ONE IS THE EVIDENCE.
    # We send Accept-Encoding, so curl's %{size_download} is the COMPRESSED transfer size
    # while the file on disk is the DECODED body. Recording only the wire count (as the
    # first version did) gave artifacts whose stated `bytes` was 624,653 against a 5,139,029
    # byte file — an auditor comparing our sha256 to `wc -c` would have found a mismatch and
    # been right to distrust the whole record. The hash covers the decoded bytes, which are
    # the bytes every predicate is evaluated against and the bytes committed to this repo.
    return {
        "status": int(code) if code.isdigit() else None,
        "url_effective": eff,
        "content_type": ctype,
        "bytes_on_the_wire": int(size) if size.isdigit() else None,
        "bytes_decoded": len(body),
        "hash_covers": "the decoded body as written to <key>.body — verify with: shasum -a 256 <key>.body",
        "redirects": int(redirs) if redirs.isdigit() else 0,
        "sha256": hashlib.sha256(body).hexdigest(),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--publisher")
    ap.add_argument("--key", help="fetch only this artifact key (robots|board|machine)")
    ap.add_argument("--plan", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    today = _dt.date.today().isoformat()
    for pid, spec in PLAN.items():
        if a.publisher and pid != a.publisher:
            continue
        if len(spec["fetch"]) > FETCH_BUDGET:
            print(f"REFUSED {pid}: plan has {len(spec['fetch'])} fetches, budget is {FETCH_BUDGET}", file=sys.stderr)
            return 2
        d = FIXTURES / pid
        d.mkdir(parents=True, exist_ok=True)
        for key, url in spec["fetch"]:
            if a.key and key != a.key:
                continue
            body = d / f"{key}.body"
            meta = d / f"{key}.meta.json"
            if a.plan:
                print(f"{pid}\t{key}\t{url}")
                continue
            if meta.exists() and not a.force:
                print(f"cached  {pid}/{key}")
                continue
            print(f"FETCH   {pid}/{key}  {url}")
            r = sh(url, body)
            hdr = body.with_suffix(".headers")
            r.update({"publisher": pid, "key": key, "url_requested": url, "fetched": today,
                      "user_agent": UA,
                      "response_headers_file": hdr.name if hdr.exists() else None,
                      "body_file": body.name})
            meta.write_text(json.dumps(r, indent=2, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
