#!/usr/bin/env python3
"""Instrument-controls census: which published artifacts record a control that
actually produced a negative?

Rule being measured (owner invariant 4): all-pass is not competent measurement.
An instrument that has never demonstrated a negative on a known control has
undemonstrated discriminating power, so GSPC must measure its own instruments.

Three states per artifact, in this precedence:

  DEMONSTRATED  a structured control record is present AND its observed
                verdict was negative (the control fired, a known-negative
                subject was read as negative, or an injected defect changed
                the grader's verdict as required).
  UNCHECKABLE   a control is recorded only as prose (no structured observed
                verdict this census can read), or the file cannot be parsed.
  NOT_RECORDED  no instrument control is recorded, or the recorded control
                never produced a negative, or only a flag/count is recorded.

Method, in order:
  1. Walk every JSON file in the population and ENUMERATE every field name
     that looks control-related. Every name is listed in the artifact with a
     classification, including the names that are excluded (subject-domain
     "controls" such as an issuer's custody controls, and defect
     disclosures) so the exclusions are auditable.
  2. Judge each artifact by the structured control records it carries.
  3. Run the census's own three fixtures plus one injected defect and record
     the result in the artifact. If the injected defect does not change the
     grader's verdict the census refuses to write (exit 2): a census of
     discriminating power that cannot itself fail is exactly the defect it
     measures.

Population: public/interop/*.json and public/signed/*.json (non-recursive).
The census's own output file is excluded from its population.

This file signs nothing. It reads bytes on disk and reports what they say.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA = "csoai.instrument-controls/0.1"
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GLOBS = ("public/interop/*.json", "public/signed/*.json")
DEFAULT_OUT = "public/interop/instrument-controls-census-2026-09-22.json"

STATES = ("DEMONSTRATED", "NOT_RECORDED", "UNCHECKABLE")

REASON_NO_CONTROL = "no instrument control recorded"
REASON_NEVER_NEGATIVE = "control never produced a negative"
REASON_FLAG_ONLY = "control flag or count only; no control verdict recorded"
REASON_PROSE_ONLY = (
    "control recorded as prose; no structured observed verdict for the census to read"
)
REASON_UNPARSEABLE = "file is not parseable JSON"

# Field names that look control-related. Broad on purpose: the artifact lists
# every match with a classification, so a broad net is auditable and a narrow
# one is not.
KEY_PATTERN = re.compile(
    r"control|negative|must_flag|must_not_flag|injected|defect|can_fail|canary"
    r"|tamper|known_bad|known_good|discriminat|fixture|false_positive"
    r"|false_negative|expected_(fail|verdict|state)|adversarial|red_team|refut",
    re.IGNORECASE,
)

# "controls" in the subject's domain, not controls on our instrument. An
# issuer's freeze flag or custody split is a fact we measure, not a check on
# the thing doing the measuring.
SUBJECT_DOMAIN_KEYS = {
    "control_facts",
    "control_facts_measured",
    "located_issuers_with_measured_control_facts",
    "custody_controls",
    "provenance_controls",
    "provenance-controls",
    "control_or_article",
    "robotics-control-mcp",
}
# Any key that starts with one of these is the same subject-domain family
# (e.g. provenance_controls_measured_n6 is a pointer into the provenance-controls axis).
SUBJECT_DOMAIN_PREFIXES = (
    "control_facts",
    "custody_controls",
    "provenance_controls",
    "provenance-controls",
)

# Disclosures of defects found. Honest, and adjacent to the rule, but a
# disclosed defect is not a recorded control with an observed verdict.
DEFECT_DISCLOSURE_KEYS = {
    "known_defects",
    "known_defect",
    "known_claim_defects",
    "open_defect",
    "counter_defect",
    "upstream_defects_found",
    "defects_found_in_our_own_artifacts",
    "refutation_id",
    "false_positives",
    "false_negatives",
    "the_inverse_defect_is_published",
    "public_fixture_issue",
    "third_party_connection_defect",
    "fixtures_outside_estate",
}

# Keys whose presence makes a dict a structured control record.
RECORD_KEYS = {
    "expected",
    "got",
    "passed",
    "verdict",
    "control_fired",
    "verdict_with_defect",
    "verdict_without_defect",
    "changed_as_required",
    "observed",
    "observed_verdict",
}

# Verdict tokens that count as a negative observed verdict. Exact token match
# on the whole string (case-insensitive); never a substring search in prose.
NEGATIVE_TOKENS = {
    "FAIL",
    "FAILED",
    "INVALID",
    "REJECT",
    "REJECTS",
    "REJECTED",
    "DOES_NOT_BIND",
    "NOT_BOUND",
    "UNVERIFIED",
    "BITCOIN_CLAIMED_UNVERIFIED",
    "DETECTED",
    "NOT_INCLUDED",
    "TAMPERED",
    "MISMATCH",
    "FLAGGED",
    "NEGATIVE",
}

CLASSIFICATIONS = {
    "instrument_control_record": "structured dict with an observed-verdict field; judged",
    "control_container": "dict holding control records or other fields; walked, not judged itself",
    "catalogue_not_control_record": "dict of plain strings (a list of named controls); no verdict, not judged",
    "instrument_control_prose": "string; a control described in prose with no structured verdict",
    "control_flag_or_count": "boolean or number; a flag or count with no verdict",
    "control_list": "list; items walked individually",
    "subject_domain_control": "a control in the measured subject's domain (issuer, custody, regulator); excluded",
    "defect_disclosure": "a disclosed defect or error estimate; not a control record; excluded",
    "fixture_path": "a file path naming a fixture; excluded",
    "other": "matched the name pattern but none of the shapes above; excluded",
}


# --------------------------------------------------------------------------
# Enumeration and classification
# --------------------------------------------------------------------------

def _is_record(value: Any) -> bool:
    return isinstance(value, dict) and bool(RECORD_KEYS & set(value.keys()))


def _looks_like_path(name: str) -> bool:
    return "/" in name or name.count(".") >= 2


def classify(name: str, value: Any) -> str:
    if name in SUBJECT_DOMAIN_KEYS or name.startswith(SUBJECT_DOMAIN_PREFIXES):
        return "subject_domain_control"
    if name in DEFECT_DISCLOSURE_KEYS:
        return "defect_disclosure"
    if _looks_like_path(name):
        return "fixture_path"
    if isinstance(value, dict):
        if _is_record(value):
            return "instrument_control_record"
        if value and all(isinstance(v, str) for v in value.values()):
            return "catalogue_not_control_record"
        return "control_container"
    if isinstance(value, str):
        return "instrument_control_prose"
    if isinstance(value, bool) or isinstance(value, (int, float)):
        return "control_flag_or_count"
    if isinstance(value, list):
        return "control_list"
    return "other"


def observed_negative(record: dict, *, negative_tokens: set[str] | None = None,
                      honour_control_fired: bool = True) -> tuple[bool, str]:
    """Did this structured control record observe a negative verdict?

    Returns (negative, detail). The keyword arguments exist so the census can
    inject a defect into its own grader and prove the grader changes verdict.
    """
    tokens = NEGATIVE_TOKENS if negative_tokens is None else negative_tokens

    if honour_control_fired and record.get("control_fired") is True:
        return True, "control_fired=true"

    with_defect = record.get("verdict_with_defect")
    without_defect = record.get("verdict_without_defect")
    if with_defect is not None and without_defect is not None:
        if with_defect != without_defect and record.get("changed_as_required", True) is True:
            return True, (
                f"verdict changed under injected defect: {without_defect!s} -> {with_defect!s}"
            )
        return False, "injected defect did not change the verdict"

    expected = record.get("expected")
    got = record.get("got")
    if isinstance(got, str) and got.strip().upper() in tokens:
        if expected is None or expected == got:
            return True, f"got={got} (expected={expected})"
        return False, f"got={got} but expected={expected}"

    for key in ("observed_verdict", "verdict", "observed"):
        verdict = record.get(key)
        if isinstance(verdict, str) and verdict.strip().upper() in tokens:
            return True, f"{key}={verdict}"

    return False, "no negative verdict recorded in this control"


def walk(obj: Any, path: str, matches: list[dict], judged: list[dict], *,
         negative_tokens: set[str] | None = None, honour_control_fired: bool = True) -> None:
    """Collect every control-related field (matches) and every judgeable
    control (judged). Record-ish dicts are judged and not descended into, so
    a record's own sub-fields are never counted as separate controls."""
    if isinstance(obj, dict):
        for key, value in obj.items():
            child = f"{path}.{key}"
            if KEY_PATTERN.search(key):
                kind = classify(key, value)
                matches.append({"path": child, "name": key, "classification": kind})
                if kind == "instrument_control_record":
                    neg, detail = observed_negative(
                        value, negative_tokens=negative_tokens,
                        honour_control_fired=honour_control_fired,
                    )
                    judged.append({"path": child, "kind": "record", "negative": neg, "detail": detail})
                    continue  # do not descend into a judged record
                if kind == "instrument_control_prose":
                    judged.append({"path": child, "kind": "prose", "negative": None,
                                   "detail": value[:160]})
                    continue
                if kind == "control_flag_or_count":
                    judged.append({"path": child, "kind": "flag_or_count", "negative": None,
                                   "detail": json.dumps(value)})
                    continue
                if kind in ("subject_domain_control", "defect_disclosure", "fixture_path",
                            "catalogue_not_control_record", "other"):
                    continue  # excluded families are listed but not judged or descended
            walk(value, child, matches, judged,
                 negative_tokens=negative_tokens, honour_control_fired=honour_control_fired)
    elif isinstance(obj, list):
        for i, value in enumerate(obj):
            walk(value, f"{path}[{i}]", matches, judged,
                 negative_tokens=negative_tokens, honour_control_fired=honour_control_fired)


# --------------------------------------------------------------------------
# Per-artifact judgement
# --------------------------------------------------------------------------

def judge_document(doc: Any, *, negative_tokens: set[str] | None = None,
                   honour_control_fired: bool = True) -> dict:
    matches: list[dict] = []
    judged: list[dict] = []
    walk(doc, "$", matches, judged,
         negative_tokens=negative_tokens, honour_control_fired=honour_control_fired)

    negatives = [j for j in judged if j["kind"] == "record" and j["negative"] is True]
    records = [j for j in judged if j["kind"] == "record"]
    prose = [j for j in judged if j["kind"] == "prose"]
    flags = [j for j in judged if j["kind"] == "flag_or_count"]

    if negatives:
        state, code, reason = "DEMONSTRATED", "NEGATIVE_OBSERVED", (
            f"{len(negatives)} of {len(records)} structured control(s) observed a negative"
        )
        evidence = negatives
    elif prose:
        state, code, reason = "UNCHECKABLE", "PROSE_ONLY", REASON_PROSE_ONLY
        evidence = prose
    elif records:
        state, code, reason = "NOT_RECORDED", "CONTROL_NEVER_NEGATIVE", REASON_NEVER_NEGATIVE
        evidence = records
    elif flags:
        state, code, reason = "NOT_RECORDED", "FLAG_OR_COUNT_ONLY", REASON_FLAG_ONLY
        evidence = flags
    else:
        state, code, reason = "NOT_RECORDED", "NO_CONTROL_RECORDED", REASON_NO_CONTROL
        evidence = []

    return {
        "state": state,
        "reason_code": code,
        "reason": reason,
        "controls_judged": len(judged),
        "control_fields_matched": len(matches),
        "evidence": evidence[:8],
        "_matches": matches,
    }


def judge_file(path: Path, *, negative_tokens: set[str] | None = None,
               honour_control_fired: bool = True) -> dict:
    raw = path.read_bytes()
    row: dict[str, Any] = {
        "file": None,  # filled by caller with the population-relative path
        "bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
    }
    try:
        doc = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        row.update({
            "schema": None,
            "state": "UNCHECKABLE",
            "reason_code": "UNPARSEABLE",
            "reason": f"{REASON_UNPARSEABLE}: {type(exc).__name__}",
            "controls_judged": 0,
            "control_fields_matched": 0,
            "evidence": [],
            "_matches": [],
        })
        return row
    schema = None
    if isinstance(doc, dict):
        for key in ("schema", "schema_version", "$schema", "kind"):
            if isinstance(doc.get(key), str):
                schema = doc[key]
                break
    row["schema"] = schema
    row.update(judge_document(doc, negative_tokens=negative_tokens,
                              honour_control_fired=honour_control_fired))
    return row


# --------------------------------------------------------------------------
# Self-controls: the census's own fixtures and one injected defect
# --------------------------------------------------------------------------

FIXTURE_NEGATIVE = {
    "schema": "csoai.fixture/0.1",
    "controls": {
        "control:known_bad": {"expected": "FAIL", "got": "FAIL", "passed": True},
        "control:known_good": {"expected": "PASS", "got": "PASS", "passed": True},
    },
}
FIXTURE_POSITIVE_ONLY = {
    "schema": "csoai.fixture/0.1",
    "negative_control": {"probed": 3, "live": 3, "verdict": "3 of 3 answered; the node was reachable"},
}
FIXTURE_PROSE = {
    "schema": "csoai.fixture/0.1",
    "proven": {"control": "one byte flipped in a body that verifies -> INVALID"},
}
FIXTURE_NONE = {"schema": "csoai.fixture/0.1", "rows": [{"n": 1}]}


def self_controls() -> dict:
    """Run the fixtures through the judge, then inject a defect into the judge
    and require the DEMONSTRATED fixture to stop being DEMONSTRATED."""
    fixtures = {
        "fixture_negative_control": (FIXTURE_NEGATIVE, "DEMONSTRATED"),
        "fixture_positive_only_control": (FIXTURE_POSITIVE_ONLY, "NOT_RECORDED"),
        "fixture_prose_control": (FIXTURE_PROSE, "UNCHECKABLE"),
        "fixture_no_control": (FIXTURE_NONE, "NOT_RECORDED"),
    }
    controls = {}
    for name, (doc, expected) in fixtures.items():
        got = judge_document(doc)
        controls[name] = {
            "expected": expected,
            "got": got["state"],
            "reason_code": got["reason_code"],
            "passed": got["state"] == expected,
        }
    without = judge_document(FIXTURE_NEGATIVE)["state"]
    with_defect = judge_document(FIXTURE_NEGATIVE, negative_tokens=set(),
                                 honour_control_fired=False)["state"]
    grader_can_fail = {
        "injected_defect": (
            "NEGATIVE_TOKENS emptied and control_fired ignored: the judge can no "
            "longer recognise any negative verdict"
        ),
        "control": "fixture_negative_control",
        "verdict_without_defect": without,
        "verdict_with_defect": with_defect,
        "changed_as_required": without == "DEMONSTRATED" and with_defect != "DEMONSTRATED",
    }
    return {
        "controls": controls,
        "all_fixtures_passed": all(c["passed"] for c in controls.values()),
        "grader_can_fail": grader_can_fail,
    }


# --------------------------------------------------------------------------
# Census
# --------------------------------------------------------------------------

def collect_population(root: Path, globs: tuple[str, ...], exclude: Path | None) -> list[Path]:
    files: list[Path] = []
    for pattern in globs:
        files.extend(sorted(root.glob(pattern)))
    out: list[Path] = []
    for f in files:
        if not f.is_file():
            continue
        if exclude is not None and f.resolve() == exclude.resolve():
            continue
        out.append(f)
    return out


def build_census(root: Path, files: list[Path], *, globs: tuple[str, ...],
                 excluded_self: str | None) -> dict:
    rows: list[dict] = []
    field_names: dict[str, dict] = {}
    for f in files:
        row = judge_file(f)
        rel = f.relative_to(root).as_posix() if f.is_relative_to(root) else f.as_posix()
        row["file"] = rel
        row["corpus"] = rel.split("/")[1] if rel.startswith("public/") and "/" in rel[7:] else rel.split("/")[0]
        for m in row.pop("_matches"):
            entry = field_names.setdefault(m["name"], {
                "name": m["name"], "classification": m["classification"],
                "occurrences": 0, "files": set(),
            })
            entry["occurrences"] += 1
            entry["files"].add(rel)
            if entry["classification"] != m["classification"]:
                entry.setdefault("also_classified_as", set()).add(m["classification"])
        rows.append(row)

    rows.sort(key=lambda r: r["file"])
    names_out = []
    for entry in sorted(field_names.values(), key=lambda e: (-e["occurrences"], e["name"])):
        item = {
            "name": entry["name"],
            "classification": entry["classification"],
            "occurrences": entry["occurrences"],
            "n_files": len(entry["files"]),
            "files": sorted(entry["files"])[:12],
        }
        if "also_classified_as" in entry:
            item["also_classified_as"] = sorted(entry["also_classified_as"])
        names_out.append(item)

    totals = {s: sum(1 for r in rows if r["state"] == s) for s in STATES}
    by_reason: dict[str, int] = {}
    by_corpus: dict[str, dict[str, int]] = {}
    for r in rows:
        by_reason[r["reason_code"]] = by_reason.get(r["reason_code"], 0) + 1
        by_corpus.setdefault(r["corpus"], {s: 0 for s in STATES})[r["state"]] += 1
    totals["by_reason_code"] = dict(sorted(by_reason.items()))
    totals["by_corpus"] = by_corpus
    totals["n"] = len(rows)
    totals["demonstrated_files"] = [r["file"] for r in rows if r["state"] == "DEMONSTRATED"]
    totals["uncheckable_files"] = [r["file"] for r in rows if r["state"] == "UNCHECKABLE"]
    totals["never_negative_files"] = [
        r["file"] for r in rows if r["reason_code"] == "CONTROL_NEVER_NEGATIVE"
    ]
    totals["flag_only_files"] = [
        r["file"] for r in rows if r["reason_code"] == "FLAG_OR_COUNT_ONLY"
    ]

    selfc = self_controls()

    return {
        "schema": SCHEMA,
        "signed": False,
        "unsigned_reason": (
            "This census is a build-time read of bytes on disk. It signs nothing "
            "and nothing signs it; its sha256 rows let a reader re-derive it."
        ),
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "what_this_is": (
            "For every artifact in the population: does it record a control on its "
            "own instrument whose observed verdict was negative? Three states, "
            "DEMONSTRATED / NOT_RECORDED / UNCHECKABLE."
        ),
        "what_this_is_not": [
            "Not a grade of the artifacts' subjects. A NOT_RECORDED artifact may be correct; the census says only that its instrument has not shown it can say no.",
            "Not a claim that a DEMONSTRATED instrument is accurate. One negative on one control is the floor of discriminating power, not a measure of it.",
            "Not a signature or a witness. signed:false.",
            "Not a search of prose. A control described in a sentence is UNCHECKABLE to this census even when a human would read it as a negative.",
        ],
        "rule": (
            "DEMONSTRATED requires a recorded control whose observed verdict was "
            "negative. A control that never produced a negative is NOT_RECORDED "
            f"with reason '{REASON_NEVER_NEGATIVE}'."
        ),
        "state_meanings": {
            "DEMONSTRATED": "a structured control record observed a negative (control fired, known-negative read as negative, or an injected defect changed the verdict)",
            "NOT_RECORDED": "no instrument control recorded, or recorded control never produced a negative, or only a flag/count is recorded",
            "UNCHECKABLE": "control recorded only as prose, or file unparseable",
        },
        "negative_verdict_tokens": sorted(NEGATIVE_TOKENS),
        "record_keys": sorted(RECORD_KEYS),
        "population": {
            "globs": list(globs),
            "n": len(rows),
            "by_corpus": {c: sum(v.values()) for c, v in by_corpus.items()},
            "excluded_self": excluded_self,
        },
        "field_names_matched": {
            "pattern": KEY_PATTERN.pattern,
            "n_distinct": len(names_out),
            "classifications": CLASSIFICATIONS,
            "excluded_subject_domain_keys": sorted(SUBJECT_DOMAIN_KEYS),
            "excluded_subject_domain_prefixes": list(SUBJECT_DOMAIN_PREFIXES),
            "excluded_defect_disclosure_keys": sorted(DEFECT_DISCLOSURE_KEYS),
            "names": names_out,
        },
        "totals": totals,
        "self_controls": selfc,
        "rows": rows,
    }


def write_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=path.name, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=False) + "\n")
    os.replace(tmp, path)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--root", default=str(ROOT))
    ap.add_argument("--out", default=DEFAULT_OUT, help="output path relative to --root")
    ap.add_argument("--glob", action="append", dest="globs",
                    help="population glob relative to --root (repeatable)")
    ap.add_argument("--dry-run", action="store_true", help="print totals, write nothing")
    args = ap.parse_args(argv)

    root = Path(args.root).resolve()
    out = (root / args.out).resolve()
    globs = tuple(args.globs) if args.globs else DEFAULT_GLOBS
    files = collect_population(root, globs, exclude=out)
    if not files:
        print(f"population empty under {root} for {globs}", file=sys.stderr)
        return 2

    census = build_census(root, files, globs=globs,
                          excluded_self=out.relative_to(root).as_posix() if out.is_relative_to(root) else str(out))

    selfc = census["self_controls"]
    if not selfc["all_fixtures_passed"] or not selfc["grader_can_fail"]["changed_as_required"]:
        print("REFUSED: the census's own controls did not behave; nothing written",
              file=sys.stderr)
        print(json.dumps(selfc, indent=2), file=sys.stderr)
        return 2

    t = census["totals"]
    summary = {
        "n": t["n"],
        "DEMONSTRATED": t["DEMONSTRATED"],
        "NOT_RECORDED": t["NOT_RECORDED"],
        "UNCHECKABLE": t["UNCHECKABLE"],
        "by_reason_code": t["by_reason_code"],
        "demonstrated_files": t["demonstrated_files"],
        "uncheckable_files": t["uncheckable_files"],
        "never_negative_files": t["never_negative_files"],
        "field_names_distinct": census["field_names_matched"]["n_distinct"],
        "self_controls": selfc,
    }
    if args.dry_run:
        print(json.dumps(summary, indent=2))
        return 0
    write_atomic(out, census)
    summary["wrote"] = out.relative_to(root).as_posix() if out.is_relative_to(root) else str(out)
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
