#!/usr/bin/env python3
"""Prepare a fresh public OWM snapshot without becoming a production writer.

The OWM cycle runs every 30 minutes, but councilof.ai deploys only through the
repository's single GHA production writer. This helper decides when a fresh
scheduler snapshot is worth landing in source:

  * always when measurement/evidence semantics changed;
  * otherwise only after MAX_INTERVAL_S, so timestamps stay fresh without
    creating a deploy every cycle;
  * never when the candidate is older/equal, malformed, leaks host paths, or
    its typed counts do not re-derive.

It writes only the requested target path when --apply is present. It performs
no network calls, signing, Git operations or deploys.
"""
import argparse
import copy
import datetime as dt
import hashlib
import json
import os
import pathlib
import re
import sys

SCHEMA = "csoai.owm-snapshot/0.1"
STATES = {"CONSISTENT", "INCONSISTENT", "SINGLE_SURFACE", "UNCHECKABLE", "UNMEASURED"}
STAGE_STATES = {"LIVE", "STAGED", "MISSING"}
HOST_PATH = re.compile(r"(?:/home/|/Users/|/workspace/|/evac-bulk/|root@)")
DEFAULT_MAX_INTERVAL_S = 4 * 60 * 60


def parse_time(value):
    if not isinstance(value, str):
        raise ValueError("generated_at missing")
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def validate(snapshot):
    errors = []
    if snapshot.get("schema") != SCHEMA:
        errors.append("schema")
    try:
        parse_time(snapshot.get("generated_at"))
    except (TypeError, ValueError):
        errors.append("generated_at")

    subjects = snapshot.get("subjects")
    stages = snapshot.get("stages")
    counts = snapshot.get("counts")
    if not isinstance(subjects, list):
        subjects = []
        errors.append("subjects")
    if not isinstance(stages, list):
        stages = []
        errors.append("stages")
    if not isinstance(counts, dict):
        counts = {}
        errors.append("counts")

    by_state = {k: 0 for k in STATES}
    for row in subjects:
        state = row.get("state") if isinstance(row, dict) else None
        if state not in STATES:
            errors.append("subject_state")
        else:
            by_state[state] += 1
        if state not in {"UNMEASURED", "UNCHECKABLE"} and not row.get("evidence_sha256"):
            errors.append("subject_evidence")

    by_stage = {k: 0 for k in STAGE_STATES}
    for row in stages:
        state = row.get("status") if isinstance(row, dict) else None
        if state not in STAGE_STATES:
            errors.append("stage_status")
        else:
            by_stage[state] += 1

    if counts.get("subjects") != len(subjects):
        errors.append("count_subjects")
    if counts.get("stages") != len(stages):
        errors.append("count_stages")
    if counts.get("by_state") != by_state:
        errors.append("count_by_state")
    if counts.get("by_stage_status") != by_stage:
        errors.append("count_by_stage")

    sig = snapshot.get("signature")
    if not isinstance(sig, dict) or sig.get("state") != "UNSIGNED":
        errors.append("signature_boundary")

    if HOST_PATH.search(json.dumps(snapshot, ensure_ascii=False)):
        errors.append("host_path_leak")

    return sorted(set(errors))


def as_multiset(value):
    """Every list compares as a multiset: re-ordering rows is not a change.

    The cycle builds subjects, stages and components from dict and registry iteration, so their order can move
    between runs while their contents do not. An order-sensitive comparison would land a "semantic_change" (and
    a deploy) for a pure re-ordering. Nothing here is order-sensitive; a field that ever is must opt in by name.
    """
    if isinstance(value, dict):
        return {k: as_multiset(v) for k, v in value.items()}
    if isinstance(value, list):
        return sorted((as_multiset(v) for v in value), key=canonical)
    return value


def semantic_projection(snapshot):
    """Remove cadence-only fields; retain evidence, states, claims and dependencies (lists as multisets)."""
    x = copy.deepcopy(snapshot)
    x.pop("generated_at", None)
    x.pop("run_id", None)
    for row in x.get("subjects", []):
        row.pop("next_check", None)
    for stage in x.get("stages", []):
        for comp in stage.get("components", []):
            comp.pop("newest_output", None)
            comp.pop("missed_cycles", None)
    head = x.get("events_head")
    if isinstance(head, dict):
        head.pop("appended_this_cycle", None)
    return as_multiset(x)


def decide(source, target=None, max_interval_s=DEFAULT_MAX_INTERVAL_S):
    errors = validate(source)
    if errors:
        return {"publish": False, "state": "FAILED", "reason": "invalid_source:" + ",".join(errors)}

    source_at = parse_time(source["generated_at"])
    source_sem = sha256(canonical(semantic_projection(source)))
    if target is None:
        return {"publish": True, "state": "READY", "reason": "target_missing",
                "source_semantic_sha256": source_sem}

    target_errors = validate(target)
    if target_errors:
        return {"publish": True, "state": "READY", "reason": "replace_invalid_target",
                "target_errors": target_errors, "source_semantic_sha256": source_sem}

    target_at = parse_time(target["generated_at"])
    if source_at <= target_at:
        return {"publish": False, "state": "HELD", "reason": "candidate_not_newer",
                "source_generated_at": source["generated_at"], "target_generated_at": target["generated_at"]}

    target_sem = sha256(canonical(semantic_projection(target)))
    age_s = int((source_at - target_at).total_seconds())
    if source_sem != target_sem:
        reason = "semantic_change"
        publish = True
    elif age_s >= max_interval_s:
        reason = "freshness_refresh"
        publish = True
    else:
        reason = "cadence_only"
        publish = False

    return {"publish": publish, "state": "READY" if publish else "HELD", "reason": reason,
            "age_s": age_s, "source_semantic_sha256": source_sem,
            "target_semantic_sha256": target_sem,
            "source_generated_at": source["generated_at"], "target_generated_at": target["generated_at"]}


def load(path):
    return json.loads(pathlib.Path(path).read_text())


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True)
    ap.add_argument("--target", required=True)
    ap.add_argument("--max-interval-s", type=int, default=DEFAULT_MAX_INTERVAL_S)
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args(argv)

    source_path = pathlib.Path(args.source)
    target_path = pathlib.Path(args.target)
    source = load(source_path)
    target = load(target_path) if target_path.exists() else None
    result = decide(source, target, args.max_interval_s)
    result["source_sha256"] = sha256(source_path.read_bytes())

    if args.apply and result["publish"]:
        target_path.parent.mkdir(parents=True, exist_ok=True)
        tmp = target_path.with_name(target_path.name + ".tmp")
        tmp.write_bytes(source_path.read_bytes())
        os.replace(tmp, target_path)
        result["written"] = str(target_path)
        result["target_sha256"] = sha256(target_path.read_bytes())
    elif args.apply:
        result["written"] = None

    print(json.dumps(result, sort_keys=True))
    return 0 if result["state"] != "FAILED" else 1


if __name__ == "__main__":
    sys.exit(main())
