#!/usr/bin/env python3
"""Merge mill-out rows into HF2200.lock.json. n_measured is counted from models[].status."""
from __future__ import annotations

import json
import sys
from pathlib import Path

MEASURED_STATUSES = frozenset({"practice-mill", "MEASURED"})

PREFERRED_TAGS = frozenset(
    {
        "text-generation",
        "image-text-to-text",
        "any-to-any",
        "text2text-generation",
        "feature-extraction",
        "sentence-similarity",
        "fill-mask",
        "text-classification",
        "token-classification",
        "translation",
        "question-answering",
    }
)


def apply_mill(lock: dict, mill: dict) -> dict:
    measured = {
        row.get("slug"): row
        for row in mill.get("rows") or []
        if row.get("slug") and row.get("status")
    }
    as_of = mill.get("as_of")
    for m in lock.get("models") or []:
        slug = m.get("slug")
        row = measured.get(slug)
        if not row:
            continue
        cur = m.get("status") or "UNMEASURED"
        st = row.get("status")
        if cur in MEASURED_STATUSES:
            continue
        if st == "practice-mill":
            m["status"] = "practice-mill"
            m["last_mill"] = as_of
            if row.get("n") is not None:
                m["n"] = row["n"]
        elif st == "UNCHECKABLE":
            m["status"] = "UNCHECKABLE"
            m["last_mill"] = as_of
            reason = row.get("reason") or ""
            if reason:
                m["reason"] = reason[:200]
    lock["n_locked"] = len(lock.get("models") or [])
    lock["n_measured"] = sum(
        1
        for m in (lock.get("models") or [])
        if (m.get("status") or "UNMEASURED") in MEASURED_STATUSES
    )
    return lock


def rebuild_provider_hosted_lock(lock: dict, candidates: list[dict], n: int = 2200) -> dict:
    """Keep practice-mill rows. Fill remaining slots with provider-hosted
    candidates, chat-like tags first. n_measured is counted, never asserted."""
    keep = [
        dict(m)
        for m in (lock.get("models") or [])
        if (m.get("status") or "") in MEASURED_STATUSES and m.get("slug")
    ]
    have = {m["slug"] for m in keep}
    pref: list[dict] = []
    rest: list[dict] = []
    for c in candidates:
        slug = c.get("id") or c.get("slug")
        if not slug or slug in have:
            continue
        have.add(slug)
        row = {
            "slug": slug,
            "queue_rank": 0,
            "downloads_at_queue": int(c.get("downloads") or 0),
            "pipeline_tag": c.get("pipeline_tag") or "",
            "status": "UNMEASURED",
            "card_id": "",
            "reason_in": "Inference Providers hosted; mixed-download unserved rows dropped",
            "providers_live": list(c.get("providers") or []),
        }
        if row["pipeline_tag"] in PREFERRED_TAGS:
            pref.append(row)
        else:
            rest.append(row)
    models = keep + (pref + rest)[: max(0, n - len(keep))]
    for i, m in enumerate(models, 1):
        m["queue_rank"] = i
    out = dict(lock)
    out["models"] = models
    out["n_locked"] = len(models)
    out["n_target"] = n
    out["n_measured"] = sum(
        1 for m in models if (m.get("status") or "") in MEASURED_STATUSES
    )
    out["queue_subset"] = "inference-providers-hosted"
    out["note"] = (
        "HF2200 keeps already-measured practice-mill rows and fills to n with "
        "Hub models that list a live Inference Provider. Rows with empty mapping "
        "were UNCHECKABLE on the mixed-download lock and could not 200. "
        "n_measured is counted from practice-mill. writes_board false."
    )
    return out


def apply_dir(lock: dict, root: Path) -> dict:
    for p in sorted(root.rglob("hf_inf_*.json")):
        mill = json.loads(p.read_text())
        apply_mill(lock, mill)
    return lock


def main() -> int:
    lock_path = Path(sys.argv[1])
    mill_root = Path(sys.argv[2])
    lock = json.loads(lock_path.read_text())
    apply_dir(lock, mill_root)
    lock_path.write_text(json.dumps(lock, indent=2) + "\n")
    print("n_measured", lock["n_measured"], "n_locked", lock["n_locked"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
