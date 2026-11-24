#!/usr/bin/env python3
"""
publish.py — publish the daily report trio to the public HF dataset
csoai/gspc-daily-reports under reports/YYYY-MM-DD/.

    publish.py --dir OUT [YYYY-MM-DD]

22 Nov 2026: moved into the repository from the report host (it read the script's own folder, and it uploaded an
unsigned report when the signing key was absent). It now publishes only a report that check_report.py passed:
OUT/report-check-<date>.json must say PASS and signature VERIFIES, must pin the exact .json bytes, and (24 Nov 2026)
must have been made under the pinned board key, did:web:csoai.org#board-attestation-1 (never a pull-request
dry run's throwaway key).

Token: HF_TOKEN env var, else the stored token file ~/.cache/huggingface/token.
No token -> exit 2, honest refusal (never published unsigned-by-auth, never faked).

The dataset is created public if it does not exist. Files are uploaded to
reports/<date>/daily-report-<date>.{md,json,sig} plus report-check-<date>.json. After upload each file's
resolve URL is checked for HTTP 200 and the result printed honestly.
"""

import argparse
import hashlib
import json
import os
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_report  # noqa: E402  (the pinned board key)

REPO_ID = "csoai/gspc-daily-reports"
FILES = ("md", "json", "sig")


def get_token():
    tok = (os.environ.get("HF_TOKEN") or "").strip()
    if tok:
        return tok, "env HF_TOKEN"
    tf = Path(os.path.expanduser("~/.cache/huggingface/token"))
    if tf.exists() and tf.read_text().strip():
        return tf.read_text().strip(), f"stored token file {tf}"
    return None, None


def resolve_url(date: str, name: str) -> str:
    return (f"https://huggingface.co/datasets/{REPO_ID}"
            f"/resolve/main/reports/{date}/{name}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="the folder generate_daily_report.py --out wrote")
    ap.add_argument("date", nargs="?", default=None)
    a = ap.parse_args()
    root = Path(a.dir)
    if a.date:
        date = a.date.strip()
    else:
        cands = sorted(root.glob("daily-report-*.json"))
        if not cands:
            print("NO_REPORT — no daily-report-*.json found; run generate_daily_report.py first")
            return 2
        date = cands[-1].stem.replace("daily-report-", "")

    files = [root / f"daily-report-{date}.{ext}" for ext in FILES]
    missing = [p.name for p in files if not p.exists()]
    if missing:
        print(f"NO_REPORT — missing {missing}; nothing published")
        return 2

    chk_p = root / f"report-check-{date}.json"
    if not chk_p.exists():
        print(f"NOT_CHECKED — no {chk_p.name}; run check_report.py first. Nothing published.")
        return 2
    chk = json.loads(chk_p.read_text())
    json_sha = hashlib.sha256((root / f"daily-report-{date}.json").read_bytes()).hexdigest()
    key = chk.get("key") or {}
    board_key = key.get("did") == check_report.BOARD_DID and key.get("public_key_hex") == check_report.BOARD_PUB_HEX
    if (chk.get("result") != "PASS" or chk.get("signature") != "VERIFIES" or chk.get("report_json_sha256") != json_sha
            or not board_key):
        print(f"REFUSED — the check says result={chk.get('result')} signature={chk.get('signature')} "
              f"pins_these_bytes={chk.get('report_json_sha256') == json_sha} "
              f"under_the_board_key={board_key}; nothing published")
        return 3
    files.append(chk_p)

    token, token_src = get_token()
    if not token:
        print("NO_HF_TOKEN — not published (honest). Set HF_TOKEN or store a token in "
              "~/.cache/huggingface/token. Nothing was fabricated.")
        return 2

    try:
        from huggingface_hub import HfApi
    except ImportError:
        print("NO_HFHUB — huggingface_hub not importable; pip install huggingface_hub")
        return 2

    api = HfApi(token=token)
    print(f"Publishing {len(files)} file(s) for {date} to dataset {REPO_ID} "
          f"(token: {token_src})")
    api.create_repo(repo_id=REPO_ID, repo_type="dataset", private=False, exist_ok=True)

    for p in files:
        path_in_repo = f"reports/{date}/{p.name}"
        api.upload_file(path_or_fileobj=str(p), path_in_repo=path_in_repo,
                        repo_id=REPO_ID, repo_type="dataset")
        print(f"  uploaded {path_in_repo}")

    print("Verification (HTTP status of public resolve URLs):")
    ok = True
    for p in files:
        url = resolve_url(date, p.name)
        try:
            req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0 csoai-daily-report/0.1"})
            with urllib.request.urlopen(req, timeout=30) as r:
                status = r.status
        except Exception as e:
            status = f"ERROR {type(e).__name__}: {e}"
        good = status == 200
        ok = ok and good
        print(f"  {'OK ' if good else 'FAIL'} {status} {url}")

    print(f"Dataset page: https://huggingface.co/datasets/{REPO_ID}"
          f"/tree/main/reports/{date}")
    return 0 if ok else 3


if __name__ == "__main__":
    sys.exit(main())
