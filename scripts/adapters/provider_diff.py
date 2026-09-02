"""Provider-diff staged leaves -> public-root leaves (file reader, no network).

Reads public/feeds/provider-diff/leaves/card-*-unsigned.json — the directory
scripts/watch/provider_watch.py stages into (one leaf per detected change,
kind csoai.diff.provider-terms/0.1, plus one daily summary leaf) — and hands
each valid atom to publish_public_root.py as a public.notice leaf. The writer
signs it in GHA (public-root.yml) or halts; nothing here signs.

Same contract as staged_leaves.py, same validator (`_check`): card-v0,
public.notice, unsigned, <= 3072-byte canonical payload, sha256 == sha256
(canonical payload), no verdict word, https source_urls. Never raises — a bad
file is skipped with a reason in the sidecar and the hourly root proceeds.

A leaf here attests one thing: the normalised bytes at a public URL differed
between two captures. Not what changed, not why, not whether it matters.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

try:
    from adapters.staged_leaves import SURFACE, _check
except ModuleNotFoundError:  # run directly as a script rather than imported by the publisher
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from adapters.staged_leaves import SURFACE, _check

LEAVES_REL = ("public", "feeds", "provider-diff", "leaves")
KINDS = ("csoai.diff.provider-terms/0.1", "csoai.diff.provider-terms.daily/0.1")


def collect(repo_root: Path | None = None) -> dict[str, Any]:
    root = repo_root or Path(__file__).resolve().parents[2]
    base = root.joinpath(*LEAVES_REL)
    leaves: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []
    seen: set[str] = set()
    n_files = 0
    if base.is_dir():
        for path in sorted(base.glob("card-*-unsigned.json")):
            n_files += 1
            rel = path.name
            try:
                card = json.loads(path.read_text(encoding="utf-8"))
            except Exception as e:  # never halt the root on a bad staged file
                skipped.append({"file": rel, "reason": f"json {type(e).__name__}"})
                continue
            if not isinstance(card, dict):
                skipped.append({"file": rel, "reason": "not an object"})
                continue
            reason = _check(card)
            if reason:
                skipped.append({"file": rel, "reason": reason})
                continue
            if (card.get("payload") or {}).get("kind") not in KINDS:
                skipped.append({"file": rel, "reason": f"kind {(card.get('payload') or {}).get('kind')!r} not a provider-diff kind"})
                continue
            if card["sha256"] in seen:
                skipped.append({"file": rel, "reason": "duplicate payload sha256"})
                continue
            seen.add(card["sha256"])
            leaves.append(
                {
                    "surface": SURFACE,
                    "subject": str(card["subject"]),
                    "as_of": str(card["as_of"]),
                    "source_urls": list(card["source_urls"]),
                    "payload": card["payload"],
                    "unmeasured": [str(x) for x in (card.get("unmeasured") or [])],
                    "tags": [str(x) for x in (card.get("tags") or [])],
                }
            )
    return {
        "leaves": leaves,
        "sidecar": {
            "dir": "/".join(LEAVES_REL),
            "n_files": n_files,
            "n_leaves": len(leaves),
            "n_skipped": len(skipped),
            "skipped": skipped[:20],
            "note": (
                "Hash-only provider document diffs, staged unsigned by scripts/watch/provider_watch.py; "
                "signed only by the public-root writer in GHA. A leaf attests that bytes at a URL changed "
                "between two captures — nothing about what or why. Content never stored. Not a grade."
            ),
        },
    }


if __name__ == "__main__":
    out = collect()
    print(json.dumps({"n_leaves": len(out["leaves"]), "sidecar": out["sidecar"]}, indent=1, ensure_ascii=False))
    raise SystemExit(1 if out["sidecar"]["n_skipped"] else 0)
