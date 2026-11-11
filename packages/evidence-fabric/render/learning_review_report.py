#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Render a validated evaluation card and retained events into a learning review.

This is a derived view, not a new card schema, store, grader or authority service.
No network, model call, signing, enrolment, training or publication is performed.
Human identities are deliberately not inferred from names, roles or signatures.

API: build_report(card_bytes, event_bytes=b'[]', as_of=UTC_TIMESTAMP,
                  ai_tools=(), proposed_decisions=()) -> dict (includes markdown).
The CLI accepts an existing card and a JSON array or JSONL of existing events.
Only the narrow observed.evaluation_review / observed.learning_assessment
metadata described in LEARNING-REVIEW.md is analysed; other events are counted
as supplemental, without republishing their text or claiming they support a card.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import html
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import stat
import sys

HERE = Path(__file__).resolve().parent
FABRIC = HERE.parent
REPO = FABRIC.parents[1]
sys.path.insert(0, str(FABRIC))
from event import check_renderable, jcs  # Existing canonical validator.
from render.axis_referee_review import content_ref, stamp, strict_json

VERSION = "learning-review-report/2"
MAX_BYTES = 2 * 1024 * 1024
MAX_EVENTS = 10000
HEADINGS = ("Executive Summary", "Data", "Experiments", "Results",
            "What you learned", "Next steps", "AI tools used")
HEX = re.compile(r"^[0-9a-f]{64}$")
REVIEW_FIELDS = frozenset({
    "card_sha256", "case_id", "case_sha256", "source_group", "split",
    "rubric_sha256", "candidate_id", "candidate_revision", "trial_id",
    "reference_label", "candidate_label", "reference_origin",
})
ASSESSMENT_FIELDS = frozenset({
    "card_sha256", "participant_ref", "phase", "case_sha256", "source_group",
    "rubric_sha256", "lesson_revision", "form_id", "response_label", "data_origin",
})
ORIGINS = {"SYNTHETIC", "SUPPLIED_REFERENCE", "HUMAN_DECLARED"}
REFERENCE_LABELS = {"PASS", "FAIL", "ABSTAIN", "UNRESOLVED", "MISSING"}
CANDIDATE_LABELS = {"PASS", "FAIL", "ABSTAIN", "INVALID", "MISSING"}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def _text(value, name, maximum=300):
    if (not isinstance(value, str) or not value.strip() or len(value) > maximum
            or any(ord(c) < 32 for c in value)):
        raise ValueError(f"bounded single-line {name} required")
    return value


def _digest(value, name):
    if not isinstance(value, str) or not HEX.fullmatch(value):
        raise ValueError(f"full SHA-256 required for {name}")
    return value


def _verifier():
    path = REPO / "scripts/evaluation_card_verify.py"
    spec = importlib.util.spec_from_file_location("learning_card_verifier", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _card(raw, clock):
    card = strict_json(raw)
    if not isinstance(card, dict):
        raise ValueError("existing evaluation card object required")
    verifier = _verifier()
    try:
        result = verifier.verify(card)
    except (TypeError, KeyError, OverflowError) as exc:
        raise ValueError("malformed evaluation card") from exc
    except OSError as exc:
        raise ValueError("evaluation-card validator dependencies are unavailable") from exc
    if result["state"] != "VALID":
        raise ValueError("evaluation card " + result["state"] + ": " + "; ".join(result["faults"]))
    suite = card["suite"]
    if suite["items_held_out"] > suite["items_total"]:
        raise ValueError("held-out count exceeds suite denominator")
    if card["result"]["state"] == "UNMEASURED" and card["result"].get("value") is not None:
        raise ValueError("unmeasured card cannot carry a result value")
    arms = card["arms"]
    ids = [a["id"] for a in arms]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate evaluation arm")
    by_id = {a["id"]: a for a in arms}
    partitions = set()
    for row in card["result"].get("per_arm", []):
        key = (row["arm_id"], row.get("partition"))
        if key in partitions or row["arm_id"] not in by_id:
            raise ValueError("duplicate or unknown result arm/partition")
        if row["items"] > by_id[row["arm_id"]]["items"]:
            raise ValueError("result partition exceeds its arm denominator")
        partitions.add(key)
    for name in ("as_of", "published_at"):
        if stamp(card["provenance"][name]) > clock:
            raise ValueError("card provenance is later than report time")
    if stamp(card["provenance"]["as_of"]) > stamp(card["provenance"]["published_at"]):
        raise ValueError("card publication predates its measurement")
    return card, verifier


def _events(raw, clock):
    if not isinstance(raw, bytes) or len(raw) > MAX_BYTES:
        raise ValueError("bounded event bytes required")
    if raw.lstrip().startswith(b"["):
        values = strict_json(raw)
    else:
        values = [strict_json(line) for line in raw.splitlines() if line.strip()]
    if not isinstance(values, list) or len(values) > MAX_EVENTS:
        raise ValueError("bounded event list required")
    unique, content, duplicates, captures = {}, {}, 0, 0
    for ev in values:
        check_renderable(ev)
        read_at = ev["claim"].get("read_at")
        if read_at is not None and stamp(read_at) > clock:
            raise ValueError("future event relative to report")
        digest = ev["claim"].get("source_sha256")
        if digest is not None:
            _digest(digest, "event source")
        eid = ev["event_id"]
        if eid in unique:
            duplicates += 1
            continue
        unique[eid] = ev
        key = content_ref(ev)
        if key in content:
            captures += 1
            # Capture-only repeats cannot select a different study chronology
            # by changing input order. Keep the earliest dated representation.
            prior = content[key]
            old_time = prior["claim"].get("read_at")
            new_time = ev["claim"].get("read_at")
            if (new_time is not None and (old_time is None or stamp(new_time) < stamp(old_time))
                    or new_time == old_time and eid < prior["event_id"]):
                content[key] = ev
        else:
            content[key] = ev
    return values, unique, [content[k] for k in sorted(content)], duplicates, captures


def _bound_payload(ev, field, fields, card_hash):
    observed = ev.get("observed")
    if not isinstance(observed, dict) or field not in observed:
        return None
    row = observed[field]
    if not isinstance(row, dict) or set(row) != fields:
        raise ValueError(f"unknown or missing {field} fields")
    for key, value in row.items():
        _text(value, key)
    for name in ("card_sha256", "case_sha256", "rubric_sha256"):
        _digest(row[name], name)
    if row["card_sha256"] != card_hash:
        raise ValueError("review/assessment belongs to different card bytes")
    if ev["claim"].get("source_sha256") != row["case_sha256"]:
        raise ValueError("case revision differs from canonical source digest")
    if ev["claim"].get("read_at") is None:
        raise ValueError("dated review/assessment event required")
    return dict(row, event_id=ev["event_id"], read_at=ev["claim"]["read_at"])


def _wilson(successes, total, *, independent):
    if not total:
        return {"state": "UNAVAILABLE", "lower": None, "upper": None,
                "reason": "NO_REFERENCE_ITEMS"}
    if not independent:
        return {"state": "UNAVAILABLE", "lower": None, "upper": None,
                "reason": "REPEATED_CASES_OR_SOURCE_GROUPS_REQUIRE_CLUSTERED_ANALYSIS"}
    z = 1.959963984540054
    p = successes / total
    divisor = 1 + z * z / total
    center = (p + z * z / (2 * total)) / divisor
    half = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / divisor
    return {"state": "DESCRIPTIVE_WILSON_95", "lower": max(0.0, center - half),
            "upper": min(1.0, center + half),
            "assumption": "Distinct declared source groups treated as independent; not authenticated."}


def _rate(successes, rows):
    count = len(rows)
    independent = (len({r["case_sha256"] for r in rows}) == count
                   and len({r["source_group"] for r in rows}) == count)
    return {"numerator": successes, "denominator": count,
            "value": successes / count if count else None,
            "interval": _wilson(successes, count, independent=independent)}


def _calibration(events, card_hash):
    rows, trials, references, cases, split_groups, split_cases = [], set(), {}, {}, {}, {}
    for ev in events:
        row = _bound_payload(ev, "evaluation_review", REVIEW_FIELDS, card_hash)
        if row is None:
            continue
        if (row["split"] not in {"TRAIN", "DEV", "TEST"}
                or row["reference_origin"] not in ORIGINS
                or row["reference_label"] not in REFERENCE_LABELS
                or row["candidate_label"] not in CANDIDATE_LABELS):
            raise ValueError("unknown review split, origin or label")
        if row["source_group"] in split_groups and split_groups[row["source_group"]] != row["split"]:
            raise ValueError("source-family overlap across train/development/test")
        if row["case_sha256"] in split_cases and split_cases[row["case_sha256"]] != row["split"]:
            raise ValueError("case-byte overlap across train/development/test")
        split_groups[row["source_group"]] = row["split"]
        split_cases[row["case_sha256"]] = row["split"]
        case_key = row["case_id"]
        if case_key in cases and cases[case_key] != row["case_sha256"]:
            raise ValueError("case id has conflicting source revisions")
        cases[case_key] = row["case_sha256"]
        reference_key = (row["case_sha256"], row["rubric_sha256"], row["reference_origin"])
        if reference_key in references and references[reference_key] != row["reference_label"]:
            raise ValueError("conflicting reference labels require adjudication")
        references[reference_key] = row["reference_label"]
        trial_key = (row["candidate_id"], row["candidate_revision"], row["rubric_sha256"], row["trial_id"])
        if trial_key in trials:
            raise ValueError("duplicate candidate trial identity")
        trials.add(trial_key)
        rows.append(row)
    groups = defaultdict(list)
    for row in rows:
        key = tuple(row[k] for k in ("candidate_id", "candidate_revision", "rubric_sha256", "split", "reference_origin"))
        groups[key].append(row)
    results = []
    for key, batch in sorted(groups.items()):
        failures = [r for r in batch if r["reference_label"] == "FAIL"]
        passes = [r for r in batch if r["reference_label"] == "PASS"]
        binary = [r for r in batch if r["reference_label"] in {"PASS", "FAIL"}
                  and r["candidate_label"] in {"PASS", "FAIL"}]
        counts = {
            "true_positive": sum(r["reference_label"] == "FAIL" and r["candidate_label"] == "FAIL" for r in binary),
            "false_negative": sum(r["reference_label"] == "FAIL" and r["candidate_label"] == "PASS" for r in binary),
            "true_negative": sum(r["reference_label"] == "PASS" and r["candidate_label"] == "PASS" for r in binary),
            "false_positive": sum(r["reference_label"] == "PASS" and r["candidate_label"] == "FAIL" for r in binary),
        }
        results.append(dict(zip(("candidate_id", "candidate_revision", "rubric_sha256", "split", "reference_origin"), key),
            trials=len(batch), distinct_cases=len({r["case_sha256"] for r in batch}),
            distinct_source_groups=len({r["source_group"] for r in batch}),
            binary_pairs=len(binary), reference_label_counts=dict(sorted(Counter(r["reference_label"] for r in batch).items())),
            candidate_label_counts=dict(sorted(Counter(r["candidate_label"] for r in batch).items())),
            confusion=counts,
            failure_detection=_rate(counts["true_positive"], failures),
            correct_acceptance=_rate(counts["true_negative"], passes),
            decision_coverage=_rate(len(binary), failures + passes)))
    return {
        "state": "SUPPLIED_LABEL_COMPARISON" if rows else "NOT_ESTABLISHED",
        "reference_authentication": "NOT_ESTABLISHED", "human_calibration": "NOT_ESTABLISHED",
        "input_rows": len(rows), "distinct_cases": len({r["case_sha256"] for r in rows}),
        "rows_by_declared_origin": dict(sorted(Counter(r["reference_origin"] for r in rows).items())),
        "groups": results, "event_ids": sorted(r["event_id"] for r in rows),
        "split_check": "DECLARED_SOURCE_AND_CASE_DISJOINTNESS_ONLY" if rows else "NO_REVIEW_ROWS",
        "interpretation": "FAIL is the positive class. Non-binary candidate outputs remain in reference-class denominators; they are not successful decisions. Confusion counts cover binary pairs only.",
        "limits": ["Provided labels are not authenticated human judgments or ground truth.",
                   "Semantic near-duplicates and undisclosed training, retrieval or memory contamination are not detected.",
                   "Intervals are descriptive and conditional on the declared sample independence; they do not establish improvement or statistical separation."],
    }, rows


def _before_after(events, card_hash, review_rows):
    rows, identities = [], set()
    training_groups = {r["source_group"] for r in review_rows if r["split"] == "TRAIN"}
    for ev in events:
        row = _bound_payload(ev, "learning_assessment", ASSESSMENT_FIELDS, card_hash)
        if row is None:
            continue
        if (row["phase"] not in {"PRE", "POST", "TRANSFER", "RETENTION"}
                or row["response_label"] not in CANDIDATE_LABELS
                or row["data_origin"] not in {"SYNTHETIC", "SUPPLIED_REFERENCE"}):
            raise ValueError("unknown assessment phase, label or origin")
        key = (row["participant_ref"], row["phase"], row["case_sha256"])
        if key in identities:
            raise ValueError("duplicate participant/phase/case assessment")
        identities.add(key)
        rows.append(row)
    participants = defaultdict(list)
    for row in rows:
        participants[row["participant_ref"]].append(row)
    paired, transferred, issues = 0, 0, Counter()
    for batch in participants.values():
        pre = [r for r in batch if r["phase"] == "PRE"]
        post = [r for r in batch if r["phase"] == "POST"]
        transfer = [r for r in batch if r["phase"] == "TRANSFER"]
        retention = [r for r in batch if r["phase"] == "RETENTION"]
        if not pre or not post:
            issues["MISSING_PRE_OR_POST"] += 1
            continue
        pair_issues = set()
        if len({r["rubric_sha256"] for r in batch}) != 1:
            pair_issues.add("RUBRIC_CHANGED")
        if len({r["lesson_revision"] for r in batch}) != 1:
            pair_issues.add("LESSON_REVISION_CHANGED")
        if len({r["data_origin"] for r in batch}) != 1:
            pair_issues.add("ORIGIN_CHANGED")
        if {r["case_sha256"] for r in pre} & {r["case_sha256"] for r in post}:
            pair_issues.add("REUSED_PRE_POST_CASES")
        if max(stamp(r["read_at"]) for r in pre) >= min(stamp(r["read_at"]) for r in post):
            pair_issues.add("PRE_POST_CHRONOLOGY_NOT_ESTABLISHED")
        if any(r["source_group"] in training_groups for r in post):
            pair_issues.add("TRANSFER_SOURCE_OVERLAPS_TRAINING")
        if pair_issues:
            issues.update(pair_issues)
        else:
            paired += 1
        later_issues = set()
        if not transfer:
            later_issues.add("MISSING_TRANSFER")
        else:
            earlier_cases = {r["case_sha256"] for r in pre + post}
            if earlier_cases & {r["case_sha256"] for r in transfer}:
                later_issues.add("REUSED_TRANSFER_CASES")
            if max(stamp(r["read_at"]) for r in post) >= min(stamp(r["read_at"]) for r in transfer):
                later_issues.add("POST_TRANSFER_CHRONOLOGY_NOT_ESTABLISHED")
            if any(r["source_group"] in training_groups for r in transfer):
                later_issues.add("TRANSFER_SOURCE_OVERLAPS_TRAINING")
            if not pair_issues and not later_issues:
                transferred += 1
        if retention:
            earlier = pre + post + transfer
            if {r["case_sha256"] for r in earlier} & {r["case_sha256"] for r in retention}:
                later_issues.add("REUSED_RETENTION_CASES")
            if max(stamp(r["read_at"]) for r in earlier) >= min(stamp(r["read_at"]) for r in retention):
                later_issues.add("RETENTION_CHRONOLOGY_NOT_ESTABLISHED")
        issues.update(later_issues)
    return {
        "state": "STRUCTURALLY_PAIRED_UNVERIFIED" if paired else "NOT_ESTABLISHED",
        "assessment_rows": len(rows), "declared_participant_handles": len(participants),
        "structurally_paired_handles": paired,
        "structurally_paired_transfer_handles": transferred,
        "phase_counts": dict(sorted(Counter(r["phase"] for r in rows).items())),
        "phase_response_label_counts": {
            phase: dict(sorted(Counter(r["response_label"] for r in rows if r["phase"] == phase).items()))
            for phase in sorted({r["phase"] for r in rows})
        },
        "issues": dict(sorted(issues.items())), "event_ids": sorted(r["event_id"] for r in rows),
        "authenticated_human_count": None, "human_learning_gain": None,
        "retention_gain": None, "readiness": "HOLD_FOR_QUALIFIED_HUMAN_STUDY",
        "requirements": ["Authenticated participants and recorded consent for this study",
                         "Qualified reference reviewers and frozen scoring rubric",
                         "Rights-cleared, unseen transfer cases separated from teaching and tuning",
                         "Predeclared pairing, missingness, timing and analysis rules"],
        "limits": ["Participant handles, phase labels and correct answers do not prove human participation.",
                   "Structural pairing does not establish comparable task difficulty, causation or human learning.",
                   "Distinct declared transfer cases do not establish that their content was unseen or held out; public practice content remains inspectable."],
    }


def _md(value):
    text = html.escape(str(value), quote=False).replace("\r", " ").replace("\n", " ")
    return re.sub(r"([\\`*_{}\[\]()#+.!|])", r"\\\1", text)


def _value(value):
    return "not recorded" if value is None else _md(value)


def _table(headers, rows):
    return "\n".join(["| " + " | ".join(headers) + " |",
                       "| " + " | ".join("---" for _ in headers) + " |"]
                      + ["| " + " | ".join(_value(v) for v in row) + " |" for row in rows])


def _disclosures(ai_tools, event_ids):
    if not isinstance(ai_tools, (list, tuple)) or len(ai_tools) > 30:
        raise ValueError("bounded AI disclosure list required")
    result = []
    for entry in ai_tools:
        if not isinstance(entry, dict) or set(entry) - {"name", "version", "role", "evidence_event_ids"} or not {"name", "version", "role"} <= set(entry):
            raise ValueError("AI disclosure requires name, version and role")
        row = {k: _text(entry[k], k, 500) for k in ("name", "version", "role")}
        refs = entry.get("evidence_event_ids", [])
        if (not isinstance(refs, list) or len(refs) > 100 or
                any(not isinstance(eid, str) or eid not in event_ids for eid in refs)):
            raise ValueError("unknown AI disclosure event reference")
        row["evidence_event_ids"] = sorted(set(refs))
        row["status"] = "DECLARED_NOT_INDEPENDENTLY_VERIFIED"
        result.append(row)
    return result


def build_report(card_bytes, event_bytes=b"[]", *, as_of, ai_tools=(), proposed_decisions=()):
    """Return a deterministic, privacy-minimised view of retained input bytes.

    Authentication is not a caller option. The current renderer never verifies
    identities/signatures or reports human-calibrated or human-learning gains.
    It computes only explicitly supplied label comparisons, with that boundary.
    """
    clock = stamp(as_of)
    card, verifier = _card(card_bytes, clock)
    values, events, contents, duplicates, captures = _events(event_bytes, clock)
    card_hash = sha(card_bytes)
    calibration, review_rows = _calibration(contents, card_hash)
    before_after = _before_after(contents, card_hash, review_rows)
    disclosures = _disclosures(ai_tools, set(events))
    if not isinstance(proposed_decisions, (list, tuple)) or len(proposed_decisions) > 30:
        raise ValueError("bounded proposed-decision list required")
    proposals = [_text(x, "proposed decision", 1000) for x in proposed_decisions]
    arms = card["arms"]
    denominator = {
        "items_total": card["suite"]["items_total"], "items_held_out_declared": card["suite"]["items_held_out"],
        "answered_by_model_declared": sum(a["answered_by_model"] for a in arms),
        "answered_by_rule_declared": sum(a["answered_by_rule"] for a in arms),
        "unattributed_or_other_answers": sum(a["items"] - a["answered_by_model"] - a["answered_by_rule"] for a in arms),
        "raw_events": len(values), "unique_event_ids": len(events),
        "duplicate_event_wrappers": duplicates, "capture_only_repeats": captures,
        "unique_event_contents": len(contents),
        "review_rows": calibration["input_rows"], "assessment_rows": before_after["assessment_rows"],
        "authenticated_human_participants": None,
    }
    linked = set(calibration["event_ids"]) | set(before_after["event_ids"])
    limitations = list(card.get("limitations", [])) + list(card["not_established"])
    failure_classes = card.get("limitation_taxonomy", {}).get("classes", [])
    event_refs = [{"event_id": eid, "method_id": ev["method"]["id"],
                   "method_version": ev["method"]["version"], "state": ev["state"],
                   "source_sha256": ev["claim"].get("source_sha256"),
                   "source_read_at": ev["claim"].get("read_at"),
                   "relationship": "EXPLICIT_CARD_BOUND_METADATA" if eid in linked else "SUPPLEMENTAL_NOT_ASSERTED_AS_SUPPORT",
                   "signature_verification": "NOT_PERFORMED"}
                  for eid, ev in sorted(events.items())]
    source_paths = [Path(__file__), REPO / "scripts/evaluation_card_verify.py",
                    FABRIC / "event.py", HERE / "axis_referee_review.py",
                    verifier.SCHEMA_BY_VERSION[verifier.card_version(card)]]
    report = {
        "projection_kind": "LEARNING_REVIEW_REPORT", "renderer_version": VERSION, "as_of": as_of,
        "bindings": {"card_id": card["id"], "card_sha256": card_hash,
                     "events_sha256": sha(event_bytes), "event_refs": event_refs,
                     "item_ledger": {"declared": card.get("item_ledger"), "verification": "NOT_PERFORMED_BY_RENDERER"},
                     "implementation_sha256": {str(p.relative_to(REPO)): sha(p.read_bytes()) for p in source_paths}},
        "card_validation": "VALID", "validation_scope": "STRUCTURE_AND_INVARIANTS_NOT_TRUTH_OR_REEXECUTION",
        "denominators": denominator, "calibration": calibration, "before_after": before_after,
        "failure_classes": failure_classes, "ai_tools": disclosures,
        "proposed_decisions": [{"text": p, "state": "PROPOSED_NOT_ADOPTED"} for p in proposals],
        "authority": {"human_identity": "NOT_ESTABLISHED", "reviewer_competence": "NOT_ESTABLISHED",
                      "independent_review": "NOT_ESTABLISHED", "model_training_performed": False,
                      "gspc_measurement_created": False, "execution_authorized": False,
                      "publication_authorized": False, "charter_adopted": False},
    }
    sections = []
    sections.append({"heading": HEADINGS[0], "body":
        f"The retained card **{_md(card['title'])}** reports **{_md(card['result']['state'])}** for {_md(card['subject']['id'])} ({_md(card['subject']['version'])}). "
        "The existing card validator accepted its structure and invariants. This review does not rerun the measurement or authenticate its producer.\n\n"
        f"Reported measurement time: {_md(card['provenance']['as_of'])}. Publication time: {_md(card['provenance']['published_at'])}.\n\n"
        f"Card claim boundary, as supplied: {_md(card['claim_boundary'])}"})
    data = f"Suite: {_md(card['suite']['id'])}, version {_md(card['suite']['version'])}. Declared item total: **{denominator['items_total']}**; declared held-out items: **{denominator['items_held_out_declared']}**. This count does not verify isolation from training, retrieval, memory or tuning.\n\n"
    data += _table(["Arm", "Kind", "Items", "Model answered", "Rule answered", "Other / unattributed"],
        [(a["id"], a["kind"], a["items"], a["answered_by_model"], a["answered_by_rule"], a["items"] - a["answered_by_model"] - a["answered_by_rule"]) for a in arms])
    data += f"\n\nEvents: {len(values)} supplied; {len(events)} unique identities; {duplicates} duplicate wrappers; {captures} capture-only repeats. "
    data += f"Explicit review rows: {calibration['input_rows']}; assessment rows: {before_after['assessment_rows']}. Authenticated human participant count: **NOT_ESTABLISHED**.\n\nSources declared by the card:\n\n"
    data += "\n".join("- " + _md(url) for url in card["provenance"]["source_urls"])
    if card.get("item_ledger"):
        ledger = card["item_ledger"]
        data += "\n\nDeclared item ledger: " + _md(ledger["path"]) + "; SHA-256 `" + ledger["sha256"] + "`. "
        data += "The renderer does not open or verify that ledger; its pointer is retained as supplied."
    data += f"\n\nInput SHA-256: card `{card_hash}`; events `{sha(event_bytes)}`. Event bodies, names and participant handles are not republished."
    sections.append({"heading": HEADINGS[1], "body": data})
    experiments = f"Instrument: {_md(card['instrument']['name'])}, version {_md(card['instrument']['version'])}, kind {_md(card['instrument']['kind'])}. "
    experiments += f"The source card reports reproduction state **{_md(card['reproduction']['state'])}**. No reproduction command is executed by this report.\n\n"
    if card["reproduction"].get("command"):
        experiments += "Recorded command: " + _md(card["reproduction"]["command"]) + ".\n\n"
    if card["reproduction"].get("reason"):
        experiments += "Recorded reproduction limitation: " + _md(card["reproduction"]["reason"]) + ".\n\n"
    experiments += f"Calibration groups retain candidate, revision, rubric, split and reference origin separately. Split check: **{_md(calibration['split_check'])}**. Source-family declarations are not proof that all leakage has been excluded."
    sections.append({"heading": HEADINGS[2], "body": experiments})
    result = f"Card result, as reported: **{_value(card['result'].get('value'))} {_value(card['result'].get('unit'))}**. "
    result += "No new overall score is computed from other evidence types.\n\n"
    per_arm = card["result"].get("per_arm", [])
    if per_arm:
        result += _table(["Arm", "Partition", "Items", "Reported value", "Unit"],
                         [(r["arm_id"], r.get("partition"), r["items"], r["value"], r.get("unit", card["result"].get("unit"))) for r in per_arm]) + "\n\n"
    else:
        result += "Per-arm result values: **NOT_RECORDED**.\n\n"
    result += "Calibration: **" + calibration["state"] + "**; authenticated human calibration: **NOT_ESTABLISHED**.\n\n"
    for group in calibration["groups"]:
        result += f"Candidate {_md(group['candidate_id'])} / {_md(group['candidate_revision'])}; {_md(group['split'])}; {_md(group['reference_origin'])}; rubric `{group['rubric_sha256']}`. "
        result += f"{group['trials']} trials, {group['distinct_cases']} distinct cases, {group['binary_pairs']} binary pairs.\n\n"
        result += _table(["Metric", "Numerator", "Denominator", "Value", "95% lower", "95% upper", "Interval state"],
                         [(name, group[name]["numerator"], group[name]["denominator"], group[name]["value"],
                           group[name]["interval"]["lower"], group[name]["interval"]["upper"], group[name]["interval"]["state"])
                          for name in ("failure_detection", "correct_acceptance", "decision_coverage")]) + "\n\n"
        result += _table(["Binary-pair outcome", "Count"], sorted(group["confusion"].items())) + "\n\n"
        result += "Candidate outcomes: " + _md(json.dumps(group["candidate_label_counts"], sort_keys=True)) + "; reference outcomes: " + _md(json.dumps(group["reference_label_counts"], sort_keys=True)) + ".\n\n"
        interval_reasons = sorted({metric["interval"].get("reason", metric["interval"].get("assumption", ""))
                                   for metric in (group["failure_detection"], group["correct_acceptance"], group["decision_coverage"])})
        result += "Interval interpretation: " + "; ".join(_md(reason) for reason in interval_reasons) + ".\n\n"
    result += calibration["interpretation"] + "\n\n"
    result += f"Before/after readiness: **{before_after['state']}**. Structurally paired participant handles: {before_after['structurally_paired_handles']}. Handles with separate ordered transfer responses: {before_after['structurally_paired_transfer_handles']}. Human learning and retention gains: **NOT_ESTABLISHED**."
    if before_after["assessment_rows"]:
        result += "\n\nDeclared assessment phases: " + _md(json.dumps(before_after["phase_counts"], sort_keys=True)) + ". "
        result += "Pairing issues: " + _md(json.dumps(before_after["issues"], sort_keys=True)) + "."
        result += "\n\nSupplied response labels by phase (descriptive counts, not authenticated learner results):\n\n"
        result += _table(["Phase", "PASS", "FAIL", "ABSTAIN", "INVALID", "MISSING"],
                         [(phase, *(counts.get(label, 0) for label in ("PASS", "FAIL", "ABSTAIN", "INVALID", "MISSING")))
                          for phase, counts in before_after["phase_response_label_counts"].items()])
        result += "\n\nDistinct task digests and ordered phase labels do not establish unseen or held-out transfer content."
    if failure_classes:
        result += "\n\n" + _table(["Declared limitation class", "Present", "Source justification"],
                                  [(r["class"], r["present"], r["justification"]) for r in failure_classes])
    else:
        result += "\n\nFormal failure-class taxonomy: **NOT_RECORDED in this card**."
    sections.append({"heading": HEADINGS[3], "body": result})
    learning = "This derived view reconciles declared answer attribution and retained evidence identities. Any computed label agreement is conditional on supplied reference labels; it does not establish their truth or human provenance.\n\n"
    learning += "Retained source limitations and claims not established:\n\n" + "\n".join("- " + _md(x) for x in limitations)
    learning += "\n\nPractice points, model calls, synthetic participants and verified human outcomes are separate quantities. This report awards no rank, appointment or execution permission."
    sections.append({"heading": HEADINGS[4], "body": learning})
    next_steps = "Proposed steps remain review decisions, with no automatic adoption, training or publication.\n\n"
    next_steps += "\n".join("- " + _md(x) for x in proposals) if proposals else "- Review the retained failure cases and missing evidence before selecting a change."
    next_steps += "\n\nHuman-study readiness requirements:\n\n" + "\n".join("- " + _md(x) for x in before_after["requirements"])
    sections.append({"heading": HEADINGS[5], "body": next_steps})
    disclosure = "No AI model is invoked by this renderer. AI roles in the underlying work are separate declarations and are not inferred from report generation.\n\n"
    disclosure += (_table(["Declared tool", "Version", "Role", "Verification"],
                          [(r["name"], r["version"], r["role"], r["status"]) for r in disclosures])
                   if disclosures else "Underlying AI tools and roles: **NOT_RECORDED**. This does not mean none were used.")
    disclosure += "\n\nStructural verification uses the existing evaluation-card validator and canonical evidence-event validator. Human identity, reviewer competence, independent acceptance and source truth remain **NOT_ESTABLISHED**."
    sections.append({"heading": HEADINGS[6], "body": disclosure})
    report["sections"] = sections
    report["projection_sha256"] = sha(jcs(report))
    report["markdown"] = render_markdown(report)
    return report


def render_markdown(report):
    """Render this module's derived report; never fetch or execute its sources."""
    if (not isinstance(report, dict) or report.get("renderer_version") != VERSION
            or [s.get("heading") for s in report.get("sections", [])] != list(HEADINGS)):
        raise ValueError("complete seven-section derived report required")
    body = {k: v for k, v in report.items() if k not in {"projection_sha256", "markdown"}}
    if report.get("projection_sha256") != sha(jcs(body)):
        raise ValueError("derived report bytes changed; rebuild from source inputs")
    return "# Evaluation and learning review\n\n" + "\n\n".join(
        "## " + s["heading"] + "\n\n" + s["body"] for s in report["sections"]
    ) + "\n"


def read_bounded(path):
    path = Path(path)
    if any(p.is_symlink() for p in (path, *path.parents)):
        raise ValueError("symlink input refused")
    fd = os.open(path, os.O_RDONLY | os.O_NONBLOCK | getattr(os, "O_NOFOLLOW", 0))
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_BYTES:
            raise ValueError("bounded regular input file required")
        with os.fdopen(fd, "rb") as handle:
            fd = None
            raw = handle.read(MAX_BYTES + 1)
    finally:
        if fd is not None:
            os.close(fd)
    if len(raw) > MAX_BYTES:
        raise ValueError("input exceeds byte limit")
    return raw


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--card", required=True)
    parser.add_argument("--events")
    parser.add_argument("--as-of", required=True)
    parser.add_argument("--ai-tools", help="JSON array with name, version, role and optional evidence_event_ids")
    parser.add_argument("--proposed-decisions", help="JSON array of proposed, unadopted decisions")
    parser.add_argument("--format", choices=("markdown", "json"), default="markdown")
    parser.add_argument("--output", help="New local file; existing files are never overwritten")
    args = parser.parse_args(argv)
    try:
        report = build_report(read_bounded(args.card), read_bounded(args.events) if args.events else b"[]",
                              as_of=args.as_of,
                              ai_tools=strict_json(read_bounded(args.ai_tools)) if args.ai_tools else (),
                              proposed_decisions=strict_json(read_bounded(args.proposed_decisions)) if args.proposed_decisions else ())
        out = report["markdown"] if args.format == "markdown" else json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
        if args.output:
            output = Path(args.output)
            if any(p.is_symlink() for p in (output, *output.parents)):
                raise ValueError("symlink output refused")
            with output.open("x", encoding="utf-8") as handle:
                handle.write(out)
        else:
            print(out, end="")
        return 0
    except (ValueError, TypeError, OSError, KeyError, RecursionError) as exc:
        print(json.dumps({"state": "REJECTED", "reason": str(exc)}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
