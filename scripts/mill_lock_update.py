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
            reason = row.get("reason") or ""
            if "429" in reason:
                # Rate-limit is not a measurement and not a terminal miss.
                continue
            m["status"] = "UNCHECKABLE"
            m["last_mill"] = as_of
            if reason:
                m["reason"] = reason[:200]
    lock["n_locked"] = len(lock.get("models") or [])
    lock["n_measured"] = sum(
        1
        for m in (lock.get("models") or [])
        if (m.get("status") or "UNMEASURED") in MEASURED_STATUSES
    )
    return lock


def restore_original_membership(original: dict, overlays: list[dict]) -> dict:
    """Restore the download-ranked HF2200 2200-row membership.

    Criterion 2 is coverage of those rows, not a replacement fleet.
    Overlay practice-mill / UNCHECKABLE only for original slugs. Never
    insert injected slugs. n_measured is counted. Practice-mill is not
    downgraded.
    """
    by: dict[str, dict] = {}
    for ov in overlays:
        for m in ov.get("models") or []:
            slug = m.get("slug")
            if not slug:
                continue
            st = m.get("status") or "UNMEASURED"
            prev = by.get(slug)
            if prev and (prev.get("status") or "") in MEASURED_STATUSES:
                continue
            if st in MEASURED_STATUSES or st == "UNCHECKABLE":
                by[slug] = m
    models: list[dict] = []
    for m in original.get("models") or []:
        slug = m.get("slug")
        row = dict(m)
        ov = by.get(slug) if slug else None
        if ov:
            st = ov.get("status") or "UNMEASURED"
            if st in MEASURED_STATUSES:
                row["status"] = st
                if ov.get("last_mill"):
                    row["last_mill"] = ov["last_mill"]
                if ov.get("n") is not None:
                    row["n"] = ov["n"]
            elif st == "UNCHECKABLE":
                row["status"] = "UNCHECKABLE"
                if ov.get("reason"):
                    row["reason"] = ov["reason"][:200]
        models.append(row)
    out = dict(original)
    out["models"] = models
    out["n_locked"] = len(models)
    out["n_target"] = original.get("n_target") or len(models)
    out["n_measured"] = sum(
        1
        for m in models
        if (m.get("status") or "UNMEASURED") in MEASURED_STATUSES
    )
    out["membership"] = "hf2200-download-ranked"
    out["writes_board"] = original.get("writes_board", False)
    out["enters_board_means"] = original.get("enters_board_means", False)
    return out


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


def stamp_zero_providers(lock: dict, fetch_live, as_of: str) -> dict:
    """Record leftover UNMEASURED rows with empty Hub mapping.

    n_measured is not incremented. Empty mapping is not a 200 and not a score.
    Rows with a live provider stay millable UNMEASURED.
    """
    n_zero = 0
    n_live = 0
    for m in lock.get("models") or []:
        if (m.get("status") or "UNMEASURED") != "UNMEASURED":
            continue
        slug = m.get("slug")
        if not slug:
            continue
        live = [p for p in (fetch_live(slug) or []) if p]
        if live:
            m["providers_live"] = live
            n_live += 1
            continue
        m["providers_live"] = []
        m["unmeasured_reason"] = "no live Inference Provider"
        m["zero_provider_as_of"] = as_of
        n_zero += 1
    lock["n_unmeasured_zero_provider"] = n_zero
    lock["n_unmeasured_with_live_provider"] = n_live
    lock["zero_provider_scan_as_of"] = as_of
    lock["n_measured"] = sum(
        1
        for m in (lock.get("models") or [])
        if (m.get("status") or "UNMEASURED") in MEASURED_STATUSES
    )
    return lock


def apply_dir(lock: dict, root: Path) -> dict:
    for p in sorted(root.rglob("hf_inf_*.json")):
        mill = json.loads(p.read_text())
        apply_mill(lock, mill)
    return lock


def fetch_live_from_hub(slug: str, token: str) -> list[str]:
    """Hub inferenceProviderMapping. Empty list means no live provider."""
    import urllib.parse
    import urllib.request

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from mill_window import live_providers  # noqa: E402

    q = urllib.parse.urlencode({"expand[]": "inferenceProviderMapping"})
    url = (
        "https://huggingface.co/api/models/"
        + urllib.parse.quote(slug, safe="/")
        + "?"
        + q
    )
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "csoai-mill-zero-provider",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        meta = json.loads(r.read())
    return live_providers(meta.get("inferenceProviderMapping") or {})


def main() -> int:
    if len(sys.argv) >= 2 and sys.argv[1] == "--stamp-zero":
        import os
        from datetime import datetime, timezone

        lock_path = Path(sys.argv[2])
        tok = (os.environ.get("HF_TOKEN") or os.environ.get("HF_INFERENCE_TOKEN") or "").strip()
        if not tok:
            print("HF_TOKEN empty — refuse to stamp (would mark live rows as zero)")
            return 1
        lock = json.loads(lock_path.read_text())
        as_of = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        from concurrent.futures import ThreadPoolExecutor, as_completed

        slugs = [
            m.get("slug")
            for m in (lock.get("models") or [])
            if m.get("slug") and (m.get("status") or "UNMEASURED") == "UNMEASURED"
        ]
        live_map: dict[str, list[str]] = {}
        with ThreadPoolExecutor(max_workers=20) as ex:
            futs = {ex.submit(fetch_live_from_hub, s, tok): s for s in slugs}
            for fut in as_completed(futs):
                s = futs[fut]
                try:
                    live_map[s] = fut.result()
                except Exception:
                    live_map[s] = []

        stamp_zero_providers(lock, lambda slug: live_map.get(slug, []), as_of)
        lock_path.write_text(json.dumps(lock, indent=2) + "\n")
        print(
            "n_measured",
            lock["n_measured"],
            "n_zero_provider",
            lock.get("n_unmeasured_zero_provider"),
            "n_unmeasured_live",
            lock.get("n_unmeasured_with_live_provider"),
        )
        return 0
    lock_path = Path(sys.argv[1])
    mill_root = Path(sys.argv[2])
    lock = json.loads(lock_path.read_text())
    apply_dir(lock, mill_root)
    if len(sys.argv) >= 4:
        orig = json.loads(Path(sys.argv[3]).read_text())
        lock = restore_original_membership(orig, [lock])
        print(
            "MEMBERSHIP_RESTORED n_measured",
            lock["n_measured"],
            "n_locked",
            lock["n_locked"],
        )
    lock_path.write_text(json.dumps(lock, indent=2) + "\n")
    print("n_measured", lock["n_measured"], "n_locked", lock["n_locked"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
