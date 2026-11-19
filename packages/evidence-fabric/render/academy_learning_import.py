#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Validate local Academy self-study events and render an existing learning review.

No account, central store, new schema, identity assertion or authority is created.
The supplied evaluation card is an explicitly chosen report context, not inferred
evidence that the learner used that card. Keep the original unsigned events.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from event import build, check_renderable, jcs
from render import learning_review_report as R

STUDY_DIR = R.REPO / "public/academy/exercises"
METHOD = "academy-verify-card-self-study"
MAX_STUDY_BYTES = 128 * 1024
LIMITS = [
    "Unsigned local self-study responses; identity, human presence, consent to research and competence are not established.",
    "Public practice tasks and reference choices are inspectable; they are not blinded or held-out study material.",
    "First response means first in this local session only. Local timestamps and content hashes are not trusted attestations.",
    "Task difficulty and transfer are not independently calibrated. These answers do not establish learning gains or execution authority.",
]
SESSION = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
TIME = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")


def definition():
    content = R.strict_json(R.read_bounded(STUDY_DIR / "study-content.json"))
    manifest = R.strict_json(R.read_bounded(STUDY_DIR / "exercises.json"))
    if content.get("version") != "1" or content.get("exercise_id") != "verify-card" or manifest.get("schema") != "csoai.academy-exercises/0.1":
        raise ValueError("unsupported Academy self-study definition")
    exercise = next((e for e in manifest["exercises"] if e["id"] == content["exercise_id"]), None)
    if exercise is None:
        raise ValueError("existing verify-card exercise is missing")
    tasks = [dict(t, case_sha256=R.sha(jcs({"prompt": t["prompt"], "choices": t["choices"]}))) for t in content["tasks"]]
    if [t["phase"] for t in tasks] != ["PRE", "PRE", "POST", "POST", "TRANSFER", "TRANSFER"]:
        raise ValueError("unsupported phase sequence")
    if len({t["case_sha256"] for t in tasks}) != len(tasks):
        raise ValueError("repeated presented case content")
    return {"content": content, "tasks": tasks,
            "lesson_revision": "sha256:" + R.sha(jcs({"content": content, "exercise": exercise})),
            "rubric_sha256": R.sha(jcs(content["rubric"]))}


def source_event(d, payload, at):
    return build(
        subject={"kind": "web_page", "locator": "https://councilof.ai/academy/exercises/#self-study"},
        claim={"text": "A local self-study interaction was supplied; human participation and learning are not established.",
               "source_url": "https://councilof.ai/academy/exercises/study-content.json",
               "source_sha256": payload["case_sha256"] if payload["kind"] == "RESPONSE" else d["lesson_revision"][7:],
               "read_at": at},
        method={"id": METHOD, "version": "1", "holder": "csoai"},
        declared=None, observed={"academy_self_study": payload}, state="PARTIAL", value=None,
        limits=LIMITS,
    )


def validate_study(raw, *, as_of):
    clock = R.stamp(as_of)
    if len(raw) > MAX_STUDY_BYTES:
        raise ValueError("self-study input exceeds byte limit")
    values = R.strict_json(raw)
    d = definition()
    if not isinstance(values, list) or not 1 <= len(values) <= len(d["tasks"]) + 2:
        raise ValueError("bounded self-study event array required")
    session, count, lesson, previous = None, 0, False, None
    rows = []
    for index, ev in enumerate(values):
        check_renderable(ev)
        observed = ev.get("observed")
        p = observed.get("academy_self_study") if isinstance(observed, dict) else None
        if (not isinstance(p, dict) or not isinstance(p.get("session_ref"), str)
                or not SESSION.fullmatch(p["session_ref"])
                or p.get("data_origin") not in {"SUPPLIED_REFERENCE", "SYNTHETIC"}):
            raise ValueError("unsupported session or data origin")
        if p.get("lesson_revision") != d["lesson_revision"] or p.get("rubric_sha256") != d["rubric_sha256"]:
            raise ValueError("lesson or rubric version changed; retain the original export")
        identity = (p["session_ref"], p["data_origin"])
        if session is None:
            session = identity
        if identity != session:
            raise ValueError("mixed sessions or data origins")
        at = ev.get("claim", {}).get("read_at")
        if not isinstance(at, str) or not TIME.fullmatch(at):
            raise ValueError("millisecond UTC timestamp required")
        when = R.stamp(at)
        if when > clock or previous is not None and when <= previous:
            raise ValueError("future or out-of-order self-study event")
        previous = when
        expected = {"kind": p.get("kind"), "session_ref": p["session_ref"],
                    "data_origin": p["data_origin"], "lesson_revision": d["lesson_revision"],
                    "rubric_sha256": d["rubric_sha256"]}
        if index == 0:
            if p.get("kind") != "START":
                raise ValueError("session start required")
        elif p.get("kind") == "LESSON_CONTINUE":
            if count != 2 or lesson:
                raise ValueError("lesson must follow the two before responses exactly once")
            lesson = True
        elif p.get("kind") == "RESPONSE":
            if count >= len(d["tasks"]) or count >= 2 and not lesson:
                raise ValueError("responses must follow lesson and phase order")
            task = d["tasks"][count]
            selected = p.get("selected_index")
            if selected is not None and (type(selected) is not int or not 0 <= selected < len(task["choices"])):
                raise ValueError("invalid selected response")
            label = "ABSTAIN" if selected is None else "PASS" if selected == task["reference_choice"] else "FAIL"
            expected.update(task_id=task["id"], phase=task["phase"], case_sha256=task["case_sha256"],
                            selected_index=selected, attempt=1, response_label=label)
            count += 1
            rows.append(ev)
        else:
            raise ValueError("unknown or repeated self-study step")
        if jcs(p) != jcs(expected) or jcs(ev) != jcs(source_event(d, expected, at)):
            raise ValueError("altered self-study event, answer score or content binding")
    return d, values, rows


def import_events(card_bytes, study_bytes, *, as_of):
    # Validate the supplied card before deriving any context-bound record.
    R._card(card_bytes, R.stamp(as_of))
    _, originals, rows = validate_study(study_bytes, as_of=as_of)
    derived = []
    for ev in rows:
        p = ev["observed"]["academy_self_study"]
        metadata = {
            "card_sha256": R.sha(card_bytes), "participant_ref": p["session_ref"],
            "phase": p["phase"], "case_sha256": p["case_sha256"],
            "source_group": "academy-public-record-meaning-practice-v1",
            "rubric_sha256": p["rubric_sha256"], "lesson_revision": p["lesson_revision"],
            "form_id": p["task_id"], "response_label": p["response_label"], "data_origin": p["data_origin"],
        }
        derived.append(build(
            subject=ev["subject"],
            claim={"text": "A retained self-study response is attached to an explicitly supplied evaluation-card context.",
                   "source_sha256": p["case_sha256"], "read_at": ev["claim"]["read_at"]},
            method={"id": "academy-self-study-context-import", "version": "1", "holder": "csoai",
                    "code_sha256": R.sha(Path(__file__).read_bytes())},
            declared={"card_context": "SUPPLIED_NOT_ASSERTED_AS_THE_TASK_SOURCE"},
            observed={"learning_assessment": metadata, "source_event_id": ev["event_id"],
                      "source_export_sha256": R.sha(study_bytes)},
            state="PARTIAL", value=None,
            limits=LIMITS + ["The supplied card is report context; this import does not prove that a participant saw or used that card."],
        ))
    # Retain original canonical records, including START and lesson interaction;
    # the renderer keeps their digests but does not republish participant handles.
    return originals + derived


def build_report(card_bytes, study_bytes, *, as_of, ai_tools=()):
    events = import_events(card_bytes, study_bytes, as_of=as_of)
    return R.build_report(card_bytes, jcs(events), as_of=as_of, ai_tools=ai_tools,
        proposed_decisions=[
            "Retain the original unsigned self-study export alongside this report; the supplied evaluation card is report context only.",
            "Treat the bundled public practice tasks as inspectable material, not unseen or blinded transfer evidence.",
            "Use distinct reviewed, rights-cleared and unseen tasks with authenticated consenting participants before making a human learning claim.",
        ])


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--card", required=True, help="Existing validated evaluation card chosen as report context")
    parser.add_argument("--study", required=True, help="Original browser self-study event array")
    parser.add_argument("--as-of", required=True)
    parser.add_argument("--ai-tools", help="Optional JSON declarations with name, version and role; absence means not recorded")
    parser.add_argument("--format", choices=("markdown", "json", "events"), default="markdown")
    parser.add_argument("--output", help="New output file; existing paths are not overwritten")
    args = parser.parse_args(argv)
    try:
        card, study = R.read_bounded(args.card), R.read_bounded(args.study)
        if args.format == "events":
            out = json.dumps(import_events(card, study, as_of=args.as_of), ensure_ascii=False, indent=2, allow_nan=False) + "\n"
        else:
            report = build_report(card, study, as_of=args.as_of,
                                  ai_tools=R.strict_json(R.read_bounded(args.ai_tools)) if args.ai_tools else ())
            out = report["markdown"] if args.format == "markdown" else json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
        if args.output:
            path = Path(args.output)
            if any(p.is_symlink() for p in (path, *path.parents)):
                raise ValueError("symlink output refused")
            with path.open("x", encoding="utf-8") as handle:
                handle.write(out)
        else:
            print(out, end="")
        return 0
    except (ValueError, TypeError, OSError, KeyError, RecursionError) as exc:
        print(json.dumps({"state": "REJECTED", "reason": str(exc)}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
