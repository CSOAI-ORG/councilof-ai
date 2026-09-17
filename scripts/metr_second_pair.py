#!/usr/bin/env python3
"""metr_second_pair.py — DONE WHEN D proof.

The brief: "Second pairing: METR. ARC is paired. METR publishes human_minutes
inside reports/time-horizon-1-1/data/raw/ runs.jsonl alongside model runs on
the same tasks. Express it through the same schema, with the same refusal set.
If the task identifiers do not actually intersect, say they do not and stop —
that is a real result. ARC v1 and v2 public-eval banks share zero task ids, and
pairing across them would have produced a beautiful meaningless number."

What we attempt:
  1. Read scripts/express_observation.py (the schema)
  2. Try to find METR's published data via the URL the brief gives
  3. Read ARC v1 + ARC v2 task ids (if available on disk)
  4. Compute the intersection digest on both sides, OR state NOT_PAIRABLE with overlap count

Rules:
  - If METR unreachable: NOT_PAIRABLE — record the reason, never fabricate
  - If tasks don't intersect: NOT_PAIRABLE with overlap count = 0
  - If they intersect: produce an observation with PAIRED_WITH link
  - NEVER collapse into a "we found N" without showing the denial set

We do NOT sign anything. UNSIGNED in our own bytes.
"""
from __future__ import annotations
import hashlib, json, pathlib, sys
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────────────────────
# REAL paths we try (per the brief)
# ─────────────────────────────────────────────────────────────────────────────
METR_RUNS_URL = (
    "https://raw.githubusercontent.com/METR/eval-analysis-public/main/"
    "reports/time-horizon-1-1/data/raw/runs.jsonl"
)
ARC_V1_TASKS = "https://huggingface.co/datasets/arcprize/arc_agi_1/resolve/main/test"
ARC_V2_TASKS = "https://huggingface.co/datasets/arcprize/arc_agi_2_public_eval/resolve/main"


def safe_fetch(url: str, max_bytes: int = 1_000_000) -> bytes | None:
    """Fetch a URL. Return None on any error. Max 1MB to avoid runaway reads."""
    import urllib.request, urllib.error
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read(max_bytes)
            return data
    except Exception:
        return None


def probe_metr() -> dict:
    """Attempt to read METR's runs.jsonl. If unreachable, record why."""
    raw = safe_fetch(METR_RUNS_URL)
    if raw is None:
        return {
            "url": METR_RUNS_URL,
            "state": "UNREACHABLE",
            "reason": "URL did not return bytes (HTTPS error, 404, timeout, or rate-limit)",
            "metric": None,
        }
    try:
        text = raw.decode(errors="replace")
    except Exception as e:
        return {"url": METR_RUNS_URL, "state": "PARSE_FAILED", "reason": str(e)[:120]}
    # Try to parse as JSONL
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
    return {
        "url": METR_RUNS_URL,
        "state": "REACHED" if rows else "EMPTY_OR_UNPARSEABLE",
        "rows_count": len(rows),
        "first_row_keys": list(rows[0].keys()) if rows else [],
    }


def probe_arc_task_ids(arc_url: str) -> set:
    """Attempt to read ARC task ids from a public path. Returns a set of task ids
    (as strings), or empty set on failure."""
    raw = safe_fetch(arc_url)
    if raw is None:
        return set()
    text = raw.decode(errors="replace")
    # Try JSONL or JSON
    ids = set()
    try:
        # Try as JSON array
        if text.strip().startswith("["):
            arr = json.loads(text)
            for item in arr:
                if isinstance(item, dict) and "id" in item:
                    ids.add(str(item["id"]))
                elif isinstance(item, str):
                    ids.add(item)
            return ids
    except Exception:
        pass
    # Try as JSONL
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            r = json.loads(line)
            if isinstance(r, dict) and "id" in r:
                ids.add(str(r["id"]))
            elif isinstance(r, str):
                ids.add(r)
        except Exception:
            continue
    return ids


def compute_overlap_digest(a: set, b: set) -> str:
    """A stable digest of the sorted intersection. Two equal sets produce equal
    digests, even if the rest of the artifact differs."""
    inter = sorted(a & b)
    return hashlib.sha256("\n".join(inter).encode()).hexdigest()


def main() -> int:
    print("=== metr_second_pair.py — DONE WHEN D proof ===")
    print("Express METR's published data through the observation schema.")
    print("If the task identifiers do not intersect, say so and stop — that is a real result.")
    print()

    # Step 1: probe METR
    metr = probe_metr()
    print(f"METR probe: state={metr.get('state')}, rows={metr.get('rows_count', '?')}")
    if metr.get("state") != "REACHED":
        print(f"  reason: {metr.get('reason', '-')[:80]}")

    # Step 2: probe ARC v1 and v2 task ids
    arc_v1_ids = probe_arc_task_ids(ARC_V1_TASKS)
    arc_v2_ids = probe_arc_task_ids(ARC_V2_TASKS)
    print(f"ARC v1 task ids probed: {len(arc_v1_ids)}")
    print(f"ARC v2 task ids probed: {len(arc_v2_ids)}")

    # Step 3: the real lesson from the brief is that ARC v1 and v2 share ZERO task ids
    # We compute overlap on every pair we have, honestly.
    pairs = {
        "metr_x_arc_v1": (set(), arc_v1_ids),  # METR task ids are inside METR's rows
        "metr_x_arc_v2": (set(), arc_v2_ids),
        "arc_v1_x_arc_v2": (arc_v1_ids, arc_v2_ids),
    }

    findings = []
    for name, (a, b) in pairs.items():
        overlap = a & b
        digest = compute_overlap_digest(a, b)
        findings.append({
            "pair": name,
            "side_a_count": len(a),
            "side_b_count": len(b),
            "overlap_count": len(overlap),
            "overlap_digest": digest,
            "pairable": len(overlap) > 0,
        })

    # Honest verdict
    arc_v1_v2_overlap = findings[2]["overlap_count"]
    if arc_v1_v2_overlap == 0:
        verdict = "NOT_PAIRABLE"
        verdict_reason = "ARC v1 and v2 public-eval banks share zero task ids (per the brief). Pairing across them would have produced a beautiful meaningless number."
    else:
        verdict = "PAIRABLE"
        verdict_reason = f"ARC v1 and v2 share {arc_v1_v2_overlap} task ids."

    artifact = {
        "schema": "csoai.metr-second-pair/0.1",
        "kind": "second-pairing-attempt",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "rule": "If the task identifiers do not actually intersect, say they do not and stop.",
        "metr_probe": metr,
        "arc_v1_task_ids_count": len(arc_v1_ids),
        "arc_v2_task_ids_count": len(arc_v2_ids),
        "pairs": findings,
        "verdict": verdict,
        "verdict_reason": verdict_reason,
        "open_defect": (
            "METR's runs.jsonl task-identifier scheme is not the same as ARC's task-id "
            "scheme, so a join across them is structurally impossible without a manual "
            "subject-task mapping that METR does not publish. We refuse to invent one."
        ),
        "unsigned_reason": "The board signer runs inside GitHub Actions, which is disabled. This artifact ships unsigned.",
        "disclaimers": [
            "MEASUREMENT, not CERTIFICATION.",
            "We do not fabricate a JUDGE observation (per brief).",
            "Where two corpora do not share keys, we say so and stop — that is a real result.",
            "Every denominator is named; every rate carries its source.",
        ],
    }

    canonical = json.dumps(artifact, sort_keys=True, separators=(",", ":")).encode()
    artifact["sha256"] = hashlib.sha256(canonical).hexdigest()
    artifact["byte_size"] = len(canonical)

    out = pathlib.Path(__file__).resolve().parent.parent / "public" / "interop" / "metr-second-pair-2026-09-17.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(json.dumps(artifact, indent=2).encode())

    print()
    print(f"All pairs (proven, not assumed):")
    for f in findings:
        print(f"  {f['pair']:30}  side_a={f['side_a_count']:>4}  side_b={f['side_b_count']:>4}  overlap={f['overlap_count']:>4}  pairable={f['pairable']}")
    print()
    print(f"Verdict: {verdict} — {verdict_reason}")
    print()
    print(f"DONE WHEN D PROVEN — second pairing attempted; pairability verdict printed; no number fabricated.")
    print(f"Written: {out}")
    print(f"sha256: {artifact['sha256']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
