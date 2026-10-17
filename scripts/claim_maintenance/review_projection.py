#!/usr/bin/env python3
"""Rank an existing lexical claim inventory for human review; never decide a claim."""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

PRIORITY = {"ENDORSEMENT", "ACCREDITATION", "PRIORITY_CLAIM", "PRODUCTION_ASSURANCE", "REGULATORY_STATUS", "STANDARDS_STATUS"}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def source_context(row, root):
    """Annotate recognized structured fields; never infer a verdict from a word hit."""
    if root is None or not row["path"].endswith(".json"):
        return "UNINSPECTED"
    base = Path(root).resolve()
    path = (base / row["path"]).resolve()
    if not path.is_relative_to(base) or not path.is_file() or path.stat().st_size > 2_000_000:
        return "SOURCE_UNAVAILABLE"
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
        line = lines[row["line"] - 1]
        data = json.loads("\n".join(lines))
    except (OSError, UnicodeError, ValueError, IndexError, TypeError):
        return "SOURCE_UNAVAILABLE"
    token = row["matched_text"].casefold()
    if isinstance(data, dict):
        exclusions = data.get("explicitly_not")
        if isinstance(exclusions, list) and any(isinstance(x, str) and token in x.casefold() and json.dumps(x, ensure_ascii=False) in line for x in exclusions):
            return "EXPLICIT_EXCLUSION"
        records = data.get("claims")
        if isinstance(records, list):
            for record in records:
                if not isinstance(record, dict) or record.get("status") != "retired":
                    continue
                claim = record.get("claim")
                if (isinstance(claim, str) and token in claim.casefold()
                    and json.dumps(claim, ensure_ascii=False) in line
                    and ('"status": "retired"' in line or next(
                        (part.strip().rstrip(",") for part in lines[row["line"]:row["line"] + 4]
                         if part.strip().startswith('"status":')), None) == '"status": "retired"')):
                    return "RETIRED_CLAIM_TEXT"
    return "STRUCTURED_CONTEXT_UNRESOLVED"


def project(inventory, limit=50, source_root=None):
    if inventory.get("schema") != "csoai.claim-maintenance-dogfood/0.1":
        raise ValueError("unsupported inventory schema")
    content_id = inventory.get("content_hash")
    source = {k: v for k, v in inventory.items() if k != "content_hash"}
    if not isinstance(content_id, str) or hashlib.sha256(canonical(source)).hexdigest() != content_id:
        raise ValueError("inventory content hash mismatch")
    rows = inventory.get("findings")
    if not isinstance(rows, list) or len(rows) != inventory.get("review_candidates"):
        raise ValueError("inventory findings count mismatch")
    if not isinstance(limit, int) or limit < 0:
        raise ValueError("limit must be nonnegative")
    buckets = {"priority_context": [], "ordinary_context": [], "negation_context": []}
    seen = set()
    duplicates = 0
    mirror_locations = 0
    for row in rows:
        if not isinstance(row, dict) or not all(k in row for k in ("path", "line", "rule", "matched_text", "finding_id", "negation_nearby")):
            raise ValueError("malformed finding")
        key = (row["path"], row["line"], row["rule"], row["matched_text"].casefold())
        if key in seen:
            duplicates += 1
            continue
        seen.add(key)
        if "/mirrors/" in row["path"]:
            mirror_locations += 1
        bucket = "negation_context" if row["negation_nearby"] else ("priority_context" if row["rule"] in PRIORITY else "ordinary_context")
        buckets[bucket].append({k: row[k] for k in ("finding_id", "path", "line", "rule", "matched_text", "negation_nearby")})
    ordered = sorted(buckets["priority_context"], key=lambda r: ("/mirrors/" in r["path"], r["path"], r["line"], r["rule"]))
    sample = [{**r, "source_context": source_context(r, source_root)} for r in ordered[:limit]]
    return {
        "schema": "csoai.claim-review-projection/0.1",
        "source_content_hash": content_id,
        "source_observed_at": inventory.get("observed_at"),
        "raw_candidates": len(rows),
        "unique_locations": len(seen),
        "duplicate_locations": duplicates,
        "mirror_locations": mirror_locations,
        "bucket_counts": {name: len(value) for name, value in buckets.items()},
        "priority_sample": sample,
        "priority_sample_truncated": len(ordered) > limit,
        "review_state": "HUMAN_REVIEW_REQUIRED",
        "claim_boundary": "Lexical triage only. Negation and generated or historical context are retained; no finding is suppressed, validated, corrected, published or licensed automatically.",
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("input", type=Path)
    ap.add_argument("--limit", type=int, default=50)
    ap.add_argument("--source-root", type=Path, help="read-only source tree for structured context annotations")
    args = ap.parse_args()
    print(json.dumps(project(json.loads(args.input.read_text()), args.limit, args.source_root), ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
