#!/usr/bin/env python3
"""Classify a downloaded runpod-signing artifact for runpod-land.yml.

The workflow used to do this inline in shell + a heredoc, which meant the five
outcomes it promises (#2256) had no fixtures in CI. This script is that logic,
unchanged in meaning, with tests in scripts/test_runpod_land_classify.py.

Outcomes (printed as `outcome=<X>` and `cards=<n>`, GitHub-output style):
  ARTIFACT_DOWNLOAD_FAILED  the staged dir does not exist or is empty   (exit 1)
  MANIFEST_MISSING          download present, no manifest.json anywhere  (exit 1)
  MANIFEST_INVALID          manifest.json unreadable or files not a list  (exit 1)
  MANIFEST_FS_MISMATCH      manifest card list != card files on disk      (exit 1)
  NO_WORK_CONFIRMED         manifest present and both agree on 0 cards    (exit 0)
  ARTIFACT_READY            manifest present and both agree on n>0 cards  (exit 0)

Nothing here reads secrets, signs, or writes the board.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


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


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--staged", required=True, help="directory `gh run download` wrote into")
    ap.add_argument("--github-output", default=None, help="append outcome=/cards= lines here (GITHUB_OUTPUT)")
    a = ap.parse_args(argv)
    outcome, n, detail = classify(Path(a.staged))
    lines = f"outcome={outcome}\ncards={n}\n"
    if a.github_output:
        with open(a.github_output, "a", encoding="utf-8") as fh:
            fh.write(lines)
    sys.stdout.write(lines)
    print(detail, file=sys.stderr)
    return 0 if outcome in ("ARTIFACT_READY", "NO_WORK_CONFIRMED") else 1


if __name__ == "__main__":
    raise SystemExit(main())
