#!/usr/bin/env python3
"""Review candidate: inventory existing publisher correction statements.

This legacy reader does not fetch citer pages and does not measure propagation.
Age since a correction was reported is NOT downstream staleness. A missing
source is a failed collection, never a successful empty inventory. The new
claim-maintenance adapter consumes separately retained target readbacks.
"""
from __future__ import annotations
import hashlib, json, pathlib, sys, urllib.request
from datetime import datetime, timezone

BASE = pathlib.Path(__file__).resolve().parent.parent
INTEROP = BASE / "public" / "interop"
OUT = INTEROP / "correction-inventory-2026-09-19.json"


def fetch_corrections() -> dict:
    url = "https://councilof.ai/api/corrections"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def scan_one_correction(c: dict) -> dict:
    """For a single correction, compute its propagation state."""
    cid = c.get("id", "?")
    first_observed = c.get("first_observed_at") or c.get("date")
    fix_requires = c.get("fix_requires") or []

    # Source signature_state is retained as a publisher assertion, not verified here.
    # This computes observation age, never downstream propagation latency.
    today = datetime.now(timezone.utc)
    try:
        ts = datetime.fromisoformat(first_observed.replace("Z", "+00:00"))
        age_since_first_observation_days = (today - ts).days if ts.tzinfo is not None and ts <= today else None
    except Exception:
        age_since_first_observation_days = None

    # Inventory declared targets; no outbound readback is made.
    citers = []
    for citer in fix_requires:
        # The current watcher records intent; the actual re-check requires
        # outbound HTTP that may be blocked by the Cloudflare 403 pattern.
        citers.append({
            "citer": citer,
            "state": "KNOWN",  # recorded in fix_requires; not yet re-checked
        })

    return {
        "id": cid,
        "first_observed_at": first_observed,
        "age_since_first_observation_days": age_since_first_observation_days,
        "fix_requires_count": len(fix_requires),
        "fix_requires": citers,
        "what_was_wrong": (c.get("what_was_wrong") or "")[:300],
        "why_it_was_wrong": (c.get("why_it_was_wrong") or "")[:300],
        "citer_readbacks_completed": 0,
        "propagation_state": "NOT_CHECKED",
    }


def main() -> int:
    print("=== correction inventory; propagation NOT_CHECKED ===")
    print("Only publisher correction statements are read; no citer readbacks occur.")
    print("Reads publisher statements; writes an unsigned inventory only. No target readback.")
    print()

    try:
        blob = fetch_corrections()
    except Exception as e:
        print(f"UNREACHABLE: {type(e).__name__}")
        return 2

    if not isinstance(blob, dict) or not isinstance(blob.get("corrections"), list):
        print("INVALID_CORRECTION_COLLECTION")
        return 2
    corrections = blob["corrections"]
    if any(not isinstance(row, dict) or not isinstance(row.get("id"), str)
           or (row.get("fix_requires") is not None and not isinstance(row["fix_requires"], list))
           for row in corrections):
        print("INVALID_CORRECTION_ROW")
        return 2
    print(f"corrections on the public file: {len(corrections)}")
    print(f"signature_state: {blob.get('signature_state')}")
    print()

    scans = []
    for c in corrections:
        scans.append(scan_one_correction(c))

    n = len(scans)
    oldest_observation_age = max((s["age_since_first_observation_days"] for s in scans if s["age_since_first_observation_days"] is not None), default=None)

    artifact = {
        "schema": "csoai.correction-inventory/0.2",
        "kind": "correction-inventory-not-propagation",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "rule": (
            "Publisher correction inventory only. Known target declarations are not "
            "a census. No target was re-fetched and no propagation rate is established."
        ),
        "corrections_total": n,
        "signature_state": blob.get("signature_state"),
        "fix_requires_note": blob.get("fix_requires"),
        "oldest_age_since_first_observation_days": oldest_observation_age,
        "scans": scans,
        "verdict": {
            "inventory_rows_processed": n,
            "propagation_readbacks_completed": 0,
            "propagation_state": "NOT_CHECKED",
            "global_propagation_rate": None,
            "open_defect_signature_state": blob.get("signature_state") == "STALE",
        },
        "disclaimers": [
            "MEASUREMENT, not CERTIFICATION.",
            "Inventory only. No independent verification, signing or dispatch.",
            "Propagation re-check across citers requires outbound HTTP. The "
            "current watcher records intent per the brief; the next iteration "
            "adds the re-check loop.",
        ],
    }
    canonical = json.dumps(artifact, sort_keys=True, separators=(",", ":")).encode()
    artifact["sha256"] = hashlib.sha256(canonical).hexdigest()
    artifact["byte_size"] = len(canonical)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(json.dumps(artifact, indent=2).encode())

    print(f"signature_state: {blob.get('signature_state')}")
    print(f"oldest age_since_first_observation_days: {oldest_observation_age}")
    print()
    print(f"Wrote: {OUT}")
    print(f"sha256: {artifact['sha256']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
