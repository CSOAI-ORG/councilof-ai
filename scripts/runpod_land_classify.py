#!/usr/bin/env python3
"""Download and classify a runpod-signing artifact for runpod-land.yml.

The workflow used to do this inline in shell + a heredoc, which meant the
outcomes it promises (#2256) had no fixtures in CI. This script is that logic,
with tests in scripts/test_runpod_land_classify.py.

Download outcomes (only with --download-run-id; every one exits 1):
  ARTIFACT_DOWNLOAD_AUTH_FAILED        401/403 credentials — never retried, fail loudly
  ARTIFACT_NOT_FOUND                   run or artifact absent — never retried. The intake
                                       uploads with if-no-files-found: error, so absence is
                                       never evidence of "no work"
  ARTIFACT_DOWNLOAD_TRANSIENT_EXHAUSTED  5xx / 429 / rate limit / network error persisted
                                       through the bounded retries
  ARTIFACT_DOWNLOAD_FAILED             unrecognised gh error, or nothing written
                                       (also: staged dir missing or empty)

Classification outcomes (printed as `outcome=<X>`, `cards=<n>`, `reason=<one line>`):
  MANIFEST_MISSING          download present, no manifest.json anywhere  (exit 1)
  MANIFEST_INVALID          manifest.json unreadable or files not a list  (exit 1)
  MANIFEST_FS_MISMATCH      manifest card list != card files on disk      (exit 1)
  NO_WORK_CONFIRMED         manifest present and both agree on 0 cards    (exit 0)
  ARTIFACT_READY            manifest present and both agree on n>0 cards  (exit 0)

--status-json keeps two timestamps apart, because they answer different questions:
  last_successful_intake_at       the intake run's completion time, recorded only when
                                  its artifact downloaded AND classified as READY/NO_WORK
  last_successful_publication_at  set only by --record-publication after the PR opens
A NO_WORK or failed land therefore never looks like a publication.

Nothing here reads secrets, signs, or writes the board.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

OK_OUTCOMES = ("ARTIFACT_READY", "NO_WORK_CONFIRMED")

# Order matters: GitHub answers a primary/secondary rate limit with HTTP 403, which
# must be retried, not reported as a credential failure.
_RATE_LIMIT = re.compile(r"rate limit|HTTP 429|abuse detection", re.I)
_AUTH = re.compile(r"HTTP 40[13]\b|Bad credentials|Resource not accessible|requires authentication|gh auth login|authentication token", re.I)
_NOT_FOUND = re.compile(r"HTTP 404\b|no artifact matches|no valid artifacts|artifact has expired|expired artifact", re.I)
_TRANSIENT = re.compile(
    r"HTTP 5\d\d\b|timed? ?out|timeout|connection (reset|refused|closed)|unexpected EOF|\bEOF\b|TLS handshake|"
    r"temporary failure|no such host|network is unreachable|i/o timeout|stream error|broken pipe",
    re.I,
)


def now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def classify_download_error(stderr: str) -> str:
    """Map gh stderr to AUTH / NOT_FOUND / TRANSIENT / UNKNOWN."""
    if _RATE_LIMIT.search(stderr):
        return "TRANSIENT"
    if _AUTH.search(stderr):
        return "AUTH"
    if _NOT_FOUND.search(stderr):
        return "NOT_FOUND"
    if _TRANSIENT.search(stderr):
        return "TRANSIENT"
    return "UNKNOWN"


def _one_line(text: str, limit: int = 300) -> str:
    return re.sub(r"\s+", " ", text).strip()[:limit]


def download(
    run_id: str,
    repo: str,
    dest: Path,
    *,
    attempts: int = 4,
    base_delay: float = 5.0,
    runner: Callable[..., subprocess.CompletedProcess] = subprocess.run,
    sleep: Callable[[float], None] = time.sleep,
) -> tuple[str, str, int]:
    """Return (outcome, reason, attempts_used). outcome is DOWNLOADED or a failure outcome."""
    if attempts < 1:
        raise ValueError("attempts must be >= 1")
    cmd = ["gh", "run", "download", str(run_id), "--repo", repo, "-p", "runpod-signing-*", "-D", str(dest)]
    last = ""
    for attempt in range(1, attempts + 1):
        if dest.exists():
            shutil.rmtree(dest)  # a partial earlier attempt must not be counted
        dest.mkdir(parents=True)
        proc = runner(cmd, capture_output=True, text=True)
        err = _one_line((proc.stderr or "") + " " + (proc.stdout or ""))
        if proc.returncode == 0:
            if not any(dest.iterdir()):
                return "ARTIFACT_DOWNLOAD_FAILED", f"gh exited 0 but wrote nothing into {dest}", attempt
            return "DOWNLOADED", f"downloaded on attempt {attempt}", attempt
        kind = classify_download_error(err)
        last = f"attempt {attempt}/{attempts}: {err or 'gh exited ' + str(proc.returncode) + ' with no output'}"
        if kind == "AUTH":
            return "ARTIFACT_DOWNLOAD_AUTH_FAILED", f"credentials rejected — {last}", attempt
        if kind == "NOT_FOUND":
            return "ARTIFACT_NOT_FOUND", f"run or runpod-signing artifact absent (not proof of an empty intake) — {last}", attempt
        if kind == "UNKNOWN":
            return "ARTIFACT_DOWNLOAD_FAILED", f"unrecognised gh error, not retried — {last}", attempt
        if attempt < attempts:
            sleep(base_delay * (2 ** (attempt - 1)))
    return "ARTIFACT_DOWNLOAD_TRANSIENT_EXHAUSTED", f"transient error persisted through {attempts} attempts — {last}", attempts


def _card_files(staged: Path) -> list[Path]:
    return sorted(p for p in staged.rglob("*.json") if p.is_file() and "cards" in p.parts[:-1] and p.parent.name == "cards")


def _manifest_cards(manifest: dict) -> list[str] | None:
    files = manifest.get("files")
    if not isinstance(files, list):
        return None
    paths = [f if isinstance(f, str) else f.get("path") if isinstance(f, dict) else None for f in files]
    return [p for p in paths if isinstance(p, str) and (p.startswith("cards/") or "/cards/" in p) and p.endswith(".json")]


def classify(staged: Path) -> tuple[str, int, str]:
    """Return (outcome, card_count, detail)."""
    if not staged.is_dir() or not any(staged.iterdir()):
        return "ARTIFACT_DOWNLOAD_FAILED", 0, "staged dir missing or empty — not proof of an empty intake"
    manifests = sorted(p for p in staged.rglob("manifest.json") if p.is_file())
    if not manifests:
        return "MANIFEST_MISSING", 0, "download completed but no manifest.json was present — refusing to call the intake empty"
    try:
        manifest = json.loads(manifests[0].read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        return "MANIFEST_INVALID", 0, f"manifest.json unreadable: {exc}"
    if not isinstance(manifest, dict):
        return "MANIFEST_INVALID", 0, "manifest.json is not an object"
    listed = _manifest_cards(manifest)
    if listed is None:
        return "MANIFEST_INVALID", 0, "manifest.files must be a list"
    on_disk = _card_files(staged)
    if len(listed) != len(on_disk):
        return "MANIFEST_FS_MISMATCH", len(on_disk), f"manifest/filesystem card mismatch: manifest={len(listed)} filesystem={len(on_disk)}"
    n = len(on_disk)
    head = {k: manifest.get(k) for k in ("schema", "run_id", "run_attempt", "intake_revision", "head_sha")}
    if n == 0:
        return "NO_WORK_CONFIRMED", 0, f"manifest confirms 0 cards {head}"
    return "ARTIFACT_READY", n, f"{n} cards {head}"


def _load_status(path: Path) -> dict:
    if path.is_file():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def _write_status(path: Path, status: dict) -> None:
    path.write_text(json.dumps(status, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--staged", help="directory `gh run download` writes/wrote into")
    ap.add_argument("--github-output", default=None, help="append outcome=/cards=/reason= lines here (GITHUB_OUTPUT)")
    ap.add_argument("--download-run-id", default=None, help="download runpod-signing-* from this intake run first (bounded retry)")
    ap.add_argument("--repo", default=None, help="owner/name for --download-run-id")
    ap.add_argument("--attempts", type=int, default=4)
    ap.add_argument("--retry-delay-seconds", type=float, default=5.0)
    ap.add_argument("--intake-completed-at", default="", help="completion time of the (successful) intake run")
    ap.add_argument("--status-json", default=None, help="write/merge the per-run status record here")
    ap.add_argument("--record-publication", action="store_true", help="only stamp last_successful_publication_at into --status-json")
    ap.add_argument("--pr-url", default="")
    a = ap.parse_args(argv)

    if a.record_publication:
        if not a.status_json or not a.pr_url:
            ap.error("--record-publication needs --status-json and --pr-url")
        path = Path(a.status_json)
        status = _load_status(path)
        if status.get("outcome") != "ARTIFACT_READY":
            print(f"refusing to record a publication for outcome {status.get('outcome')!r}", file=sys.stderr)
            return 1
        status["last_successful_publication_at"] = now_utc()
        status["publication_pr_url"] = a.pr_url
        _write_status(path, status)
        return 0

    if not a.staged:
        ap.error("--staged is required")
    staged = Path(a.staged)
    attempts_used = 0
    if a.download_run_id:
        if not a.repo:
            ap.error("--download-run-id needs --repo")
        dl, reason, attempts_used = download(
            a.download_run_id, a.repo, staged, attempts=a.attempts, base_delay=a.retry_delay_seconds
        )
        if dl == "DOWNLOADED":
            outcome, n, reason = classify(staged)
        else:
            outcome, n = dl, 0
    else:
        outcome, n, reason = classify(staged)

    reason = _one_line(reason, 500)
    lines = f"outcome={outcome}\ncards={n}\nreason={reason}\n"
    if a.github_output:
        with open(a.github_output, "a", encoding="utf-8") as fh:
            fh.write(lines)
    sys.stdout.write(lines)
    ok = outcome in OK_OUTCOMES
    if not ok:
        print(f"::error title=runpod-land {outcome}::{reason}", file=sys.stderr)

    if a.status_json:
        _write_status(Path(a.status_json), {
            "schema": "csoai.runpod-land-status/0.1",
            "intake_run_id": a.download_run_id,
            "outcome": outcome,
            "cards": n,
            "reason": reason,
            "download_attempts": attempts_used,
            "classified_at": now_utc(),
            "last_successful_intake_at": (a.intake_completed_at or None) if ok else None,
            "last_successful_publication_at": None,
        })
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
