#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Global & China Open-Source Evaluation Harness JSON + Native UK AISI Inspect -> evidence events.

Supports structured per-sample evaluation logs from:
- OpenCompass (Shanghai AI Lab / InternLM, Apache-2.0 — used across DeepSeek, Qwen, GLM, Yi, InternLM, Hunyuan, StepFun)
- BAAI FlagEval / C-Eval (Beijing Academy of Artificial Intelligence)
- EleutherAI lm-evaluation-harness (MIT)
- UK AISI inspect_ai (MIT) — both `tasks[]` wrapper and native Inspect export (`eval` / `results` / `samples`)

    python3 ingest/global_eval_in.py EVAL_RUN.json --read-at 2026-10-24T05:50:00Z > events.jsonl

Rules:
1. Summary-only files without per-sample rows (`samples[]`) emit `UNCHECKABLE` (`value = None`): a headline
   benchmark number without sample-level evidence is never promoted to an observed measurement.
2. Aborted or incomplete native Inspect runs (`status != "success"`) emit `UNMEASURED` (`value = None`).
3. When `samples[]` are present, `observed` is our deterministic recount of `passed`, `failed`, and `total` over
   the sample rows, compared against `declared` (`declared_passed`, `declared_total`, or `declared_accuracy`).
4. Built-in negative control (`one-sample-verdict-flipped`): flips one sample's `passed` verdict in a copy and
   checks that the recount notices the difference.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import sys
from typing import Any, Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402

HARNESS_HOLDERS = {
    "opencompass": "third_party:open-compass/opencompass",
    "flageval": "third_party:flagopen/flageval",
    "lm-eval": "third_party:eleutherai/lm-evaluation-harness",
    "inspect_ai": "third_party:ukgovernmentbeis/inspect_ai",
    "inspect": "third_party:uk-aisi/inspect",
}


def _sample_passed(sample: Dict[str, Any], scorer_name: Optional[str] = None) -> Optional[bool]:
    if "passed" in sample and isinstance(sample["passed"], bool):
        return sample["passed"]
    if "correct" in sample and isinstance(sample["correct"], bool):
        return sample["correct"]
    if "exact_match" in sample and isinstance(sample["exact_match"], (int, float)):
        return float(sample["exact_match"]) >= 1.0
    if "score" in sample and isinstance(sample["score"], (int, float)):
        thr = float(sample.get("threshold", 1.0))
        return float(sample["score"]) >= thr
    # Native UK AISI Inspect sample shape: `scores: {<scorer>: {"value": "C" | "I" | 1.0 | 0.0 | true | false}}`
    scores = sample.get("scores")
    if isinstance(scores, dict) and scores:
        key = scorer_name if (scorer_name and scorer_name in scores) else next(iter(scores.keys()))
        sc_obj = scores.get(key)
        val = sc_obj.get("value") if isinstance(sc_obj, dict) else sc_obj
        if isinstance(val, bool):
            return val
        if isinstance(val, (int, float)):
            return float(val) >= float(sample.get("threshold", 1.0))
        if isinstance(val, str):
            u = val.strip().upper()
            if u in ("C", "CORRECT", "PASS", "PASSED", "TRUE", "1"):
                return True
            if u in ("I", "INCORRECT", "FAIL", "FAILED", "FALSE", "0"):
                return False
    return None


def recount_samples(samples: List[Dict[str, Any]], scorer_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if not isinstance(samples, list) or len(samples) == 0:
        return None
    passed = 0
    failed = 0
    unscored = 0
    for s in samples:
        if not isinstance(s, dict):
            unscored += 1
            continue
        verdict = _sample_passed(s, scorer_name=scorer_name)
        if verdict is None:
            unscored += 1
        elif verdict:
            passed += 1
        else:
            failed += 1
    total = passed + failed
    if total == 0:
        return None
    return {
        "passed": passed,
        "failed": failed,
        "unscored": unscored,
        "total_evaluated": total,
    }


def flip_one_sample(samples: List[Dict[str, Any]], scorer_name: Optional[str] = None) -> List[Dict[str, Any]]:
    mutated = copy.deepcopy(samples)
    for s in mutated:
        if not isinstance(s, dict):
            continue
        verdict = _sample_passed(s, scorer_name=scorer_name)
        if verdict is not None:
            s["passed"] = not verdict
            s.pop("correct", None)
            s.pop("exact_match", None)
            s.pop("score", None)
            s.pop("scores", None)
            break
    return mutated


def _ingest_native_inspect(
    doc: Dict[str, Any],
    *,
    sha: str,
    read_at: str,
    source_url: Optional[str] = None,
) -> List[Dict[str, Any]]:
    eval_block = doc.get("eval") if isinstance(doc.get("eval"), dict) else {}
    task_name = str(eval_block.get("task") or doc.get("task") or "unnamed-task")
    model_id = str(eval_block.get("model") or doc.get("model") or "unspecified-model")
    status = str(doc.get("status") or "success").lower()
    ver = str(doc.get("version") or "2")

    results = doc.get("results") if isinstance(doc.get("results"), dict) else {}
    scores_list = results.get("scores") if isinstance(results.get("scores"), list) else []
    scorer_name: Optional[str] = None
    declared_acc: Optional[float] = None
    if scores_list and isinstance(scores_list[0], dict):
        first_sc = scores_list[0]
        scorer_name = str(first_sc.get("name") or first_sc.get("scorer") or "match")
        metrics = first_sc.get("metrics") if isinstance(first_sc.get("metrics"), dict) else {}
        for m_name in ("accuracy", "mean", "pass_at_1"):
            if isinstance(metrics.get(m_name), dict) and isinstance(metrics[m_name].get("value"), (int, float)):
                declared_acc = float(metrics[m_name]["value"])
                break
            if isinstance(metrics.get(m_name), (int, float)):
                declared_acc = float(metrics[m_name])
                break

    samples = doc.get("samples")
    declared_total = int(
        results.get("completed_samples")
        or results.get("total_samples")
        or (len(samples) if isinstance(samples, list) else 0)
    )
    declared = {
        "task": task_name,
        "model": model_id,
        "status": status,
        "scorer": scorer_name,
        "declared_accuracy": declared_acc,
        "declared_total": declared_total,
    }

    if status != "success":
        state = "UNMEASURED"
        value = None
        observed: Dict[str, Any] = {
            "status": status,
            "reason": f"native Inspect log status is '{status}' (not 'success')",
        }
        nc = {
            "id": "one-sample-verdict-flipped",
            "expected": "DIVERGENT",
            "got": "NOT_RUN",
        }
    else:
        recounted = recount_samples(samples, scorer_name=scorer_name) if isinstance(samples, list) else None
        if recounted is None:
            state = "UNCHECKABLE"
            value = None
            observed = {
                "samples_present": False,
                "reason": "native Inspect log lacks scoreable sample rows",
            }
            nc = {
                "id": "one-sample-verdict-flipped",
                "expected": "DIVERGENT",
                "got": "NOT_RUN",
            }
        else:
            ctl = recount_samples(flip_one_sample(samples, scorer_name=scorer_name), scorer_name=scorer_name)
            ctl_div = (
                ctl is not None
                and (ctl["passed"] != recounted["passed"] or ctl["failed"] != recounted["failed"])
            )
            obs_acc = recounted["passed"] / recounted["total_evaluated"]
            declared_passed = (
                round(declared_acc * declared_total)
                if (declared_acc is not None and declared_total > 0)
                else recounted["passed"]
            )
            acc_matches = (
                declared_acc is not None
                and abs(obs_acc - declared_acc) <= 1e-6
                and declared_total == recounted["total_evaluated"]
                and recounted["unscored"] == 0
            )
            if not ctl_div:
                state = "NOT_DISCRIMINATING"
                value = None
                nc = {
                    "id": "one-sample-verdict-flipped",
                    "expected": None,
                    "got": "CONSISTENT",
                }
            elif acc_matches:
                state = "CONSISTENT"
                value = obs_acc
                nc = {
                    "id": "one-sample-verdict-flipped",
                    "expected": "DIVERGENT",
                    "got": "DIVERGENT",
                }
            else:
                state = "DIVERGENT"
                value = None
                nc = {
                    "id": "one-sample-verdict-flipped",
                    "expected": "DIVERGENT",
                    "got": "DIVERGENT",
                }
            observed = {
                "passed": recounted["passed"],
                "failed": recounted["failed"],
                "total_evaluated": recounted["total_evaluated"],
                "recount_of": f"samples[].scores.{scorer_name or 'default'}.value",
                "declared_passed": declared_passed,
            }

    return [
        E.build(
            subject={
                "kind": "model_run",
                "locator": f"inspect-log:{task_name}/{model_id}",
                "declared_by": f"inspect {ver} log sha256:{sha}",
            },
            claim={
                "text": (
                    f"Inspect reports {task_name} on {model_id} at accuracy {declared_acc} "
                    f"over {declared_total} samples (status {status})."
                ),
                "source_url": source_url,
                "source_sha256": sha,
                "read_at": read_at,
            },
            method={
                "id": "inspect-native-recount",
                "version": ver,
                "code_sha256": None,
                "holder": "third_party:uk-aisi/inspect",
            },
            declared=declared,
            observed=observed,
            state=state,
            value=value,
            negative_control=nc,
            limits=[
                "Inspect holds the task and the scorer; this event recounts the log's own bytes and writes no sample.",
                "A recount does not establish that the model ran as claimed, that the benchmark is uncontaminated, or that the system is safe.",
            ],
        )
    ]


def ingest(
    raw: bytes,
    *,
    read_at: str,
    source_url: Optional[str] = None,
) -> List[Dict[str, Any]]:
    doc = json.loads(raw.decode("utf-8"))
    sha = hashlib.sha256(raw).hexdigest()

    # Native UK AISI Inspect export shape (`eval`, `results`, `samples` at top level)
    if not doc.get("tasks") and isinstance(doc.get("eval"), dict):
        return _ingest_native_inspect(doc, sha=sha, read_at=read_at, source_url=source_url)

    harness = str(doc.get("harness") or "opencompass").lower()
    harness_ver = str(doc.get("harness_version") or doc.get("version") or "unknown")
    holder = HARNESS_HOLDERS.get(harness, f"third_party:{harness}")
    model_id = str(doc.get("model") or doc.get("model_name") or "unspecified-model")
    tasks = doc.get("tasks") or []
    out: List[Dict[str, Any]] = []

    for task in tasks:
        task_id = str(task.get("task_id") or task.get("dataset") or "unnamed-task")
        declared_passed = task.get("declared_passed")
        declared_total = task.get("declared_total")
        declared = {
            "harness": harness,
            "task_id": task_id,
            "model": model_id,
            "declared_passed": declared_passed,
            "declared_total": declared_total,
            "declared_accuracy": task.get("declared_accuracy"),
        }
        samples = task.get("samples")
        recounted = recount_samples(samples) if isinstance(samples, list) else None

        if recounted is None:
            state = "UNCHECKABLE"
            value = None
            observed: Dict[str, Any] = {
                "samples_present": False,
                "reason": "summary-only record without per-sample evaluation rows; headline accuracy is not recounted",
            }
            nc = {
                "id": "one-sample-verdict-flipped",
                "expected": "DIVERGENT",
                "got": "NOT_RUN",
            }
        else:
            ctl = recount_samples(flip_one_sample(samples))
            ctl_div = (
                ctl is not None
                and (ctl["passed"] != recounted["passed"] or ctl["failed"] != recounted["failed"])
            )
            match = (
                declared_passed is not None
                and declared_total is not None
                and int(declared_passed) == recounted["passed"]
                and int(declared_total) == recounted["total_evaluated"]
                and recounted["unscored"] == 0
            )
            if not ctl_div:
                state = "NOT_DISCRIMINATING"
                value = None
                nc = {
                    "id": "one-sample-verdict-flipped",
                    "expected": None,
                    "got": "CONSISTENT",
                }
            elif match:
                state = "CONSISTENT"
                value = recounted["passed"] / recounted["total_evaluated"]
                nc = {
                    "id": "one-sample-verdict-flipped",
                    "expected": "DIVERGENT",
                    "got": "DIVERGENT",
                }
            else:
                state = "DIVERGENT"
                value = None
                nc = {
                    "id": "one-sample-verdict-flipped",
                    "expected": "DIVERGENT",
                    "got": "DIVERGENT",
                }
            observed = {
                **recounted,
                "recount_matches_declared": match,
            }

        out.append(
            E.build(
                subject={
                    "kind": "model_run",
                    "locator": f"eval-run:{harness}:{model_id}#{task_id}",
                    "declared_by": f"{harness} {harness_ver} report sha256:{sha}",
                },
                claim={
                    "text": (
                        f"{harness} ({harness_ver}) task {task_id} on {model_id} declares "
                        f"passed={declared_passed}/{declared_total}."
                    ),
                    "source_url": source_url,
                    "source_sha256": sha,
                    "read_at": read_at,
                },
                method={
                    "id": f"{harness}-sample-recount",
                    "version": harness_ver,
                    "code_sha256": None,
                    "holder": holder,
                },
                declared=declared,
                observed=observed,
                state=state,
                value=value,
                negative_control=nc,
                limits=[
                    f"Model: {model_id}, task: {task_id}. Result describes only the evaluated sample set in {harness}.",
                    "Summary-only benchmark claims without sample logs remain UNCHECKABLE.",
                    "Measurement only: a recounted benchmark rate is never a safety certification or grade.",
                ],
            )
        )
    return out


def main(argv: Optional[List[str]] = None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("report")
    ap.add_argument("--read-at", required=True)
    ap.add_argument("--source-url")
    a = ap.parse_args(argv)
    with open(a.report, "rb") as f:
        raw = f.read()
    for ev in ingest(raw, read_at=a.read_at, source_url=a.source_url):
        sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
