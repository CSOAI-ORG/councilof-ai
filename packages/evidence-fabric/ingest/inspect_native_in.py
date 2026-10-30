#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Inspect native log -> evidence events.

Inspect (UK AI Safety Institute, MIT) documents its log with top-level `status`, `eval`, `results` and `samples`.
This reads THAT shape. The older `global_eval_in.py` reads a `tasks[]` document, so a native Inspect export
produces no events there; this module is the native path, not a replacement for the other harness formats.

State rules, all of them about not inventing certainty:
- status is not "success"  -> UNMEASURED. An aborted or errored run is not a result, however many samples exist.
- no per-sample rows        -> UNCHECKABLE. A headline accuracy cannot be recounted from a summary alone.
- any sample without the scorer's value -> UNCHECKABLE. A partial recount is not a recount.
- declared accuracy x total disagrees with our recount -> DIVERGENT.
- the negative control (one sample score flipped) does not change the recount -> NOT_DISCRIMINATING.

We hold no scorer and change no sample: the event records a recount of the log's own bytes.
"""
import argparse
import copy
import hashlib
import json
import os
import sys
from typing import Any, Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402


def _first_scorer(doc: Dict[str, Any]) -> Optional[str]:
    scores = ((doc.get("results") or {}).get("scores") or [])
    for s in scores:
        if isinstance(s, dict) and s.get("name"):
            return str(s["name"])
    samples = doc.get("samples") or []
    for sample in samples:
        if isinstance(sample, dict):
            for name in (sample.get("scores") or {}):
                return str(name)
    return None


# Inspect's built-in scorers return letter grades, not numbers: C correct, I incorrect, P partial, N unanswered.
# Reading only numbers made a real log unreadable (UNCHECKABLE) — found by running the adapter against an actual
# .eval file produced by inspect_ai 0.3.259.
_LETTERS = {"C": 1.0, "I": 0.0, "P": 0.5, "N": 0.0}


def _value(entry: Any) -> Optional[float]:
    if isinstance(entry, dict):
        entry = entry.get("value")
    if isinstance(entry, str):
        return _LETTERS.get(entry.strip().upper())
    if isinstance(entry, bool):
        return 1.0 if entry else 0.0
    if isinstance(entry, (int, float)):
        return float(entry)
    return None


def recount(samples: List[Any], scorer: str) -> Optional[Dict[str, int]]:
    """Count pass/fail from the samples' own score values. None when any row cannot be read."""
    passed = failed = 0
    for sample in samples:
        if not isinstance(sample, dict):
            return None
        v = _value((sample.get("scores") or {}).get(scorer))
        if v is None:
            return None
        if v >= 0.5:
            passed += 1
        else:
            failed += 1
    if passed + failed == 0:
        return None
    return {"passed": passed, "failed": failed, "total_evaluated": passed + failed}


def flip_one(samples: List[Any], scorer: str) -> List[Any]:
    out = copy.deepcopy(samples)
    for sample in out:
        scores = sample.get("scores") if isinstance(sample, dict) else None
        if not isinstance(scores, dict) or scorer not in scores:
            continue
        v = _value(scores[scorer])
        if v is None:
            continue
        flipped = 0.0 if v >= 0.5 else 1.0
        if isinstance(scores[scorer], dict):
            scores[scorer] = {**scores[scorer], "value": flipped}
        else:
            scores[scorer] = flipped
        return out
    return out


def load_eval_log(path: str) -> Dict[str, Any]:
    """Read a real Inspect .eval archive into the native document shape this module ingests.

    Inspect writes a zip: header.json (status, eval, results), samples/*.json (per-sample scores). Nothing is
    reinterpreted here — scores are passed through as the scorer wrote them.
    """
    # Upstream guidance is explicit: use the Log File API rather than reading the archive by hand
    # (inspect.aisi.org.uk/eval-logs.html). The zip reader stays as a dependency-free fallback; the API is preferred
    # whenever inspect_ai is importable.
    try:
        from inspect_ai.log import read_eval_log  # type: ignore

        log = read_eval_log(path)
        results = getattr(log, "results", None)
        scores = []
        for sc in (getattr(results, "scores", None) or []):
            acc = (getattr(sc, "metrics", None) or {}).get("accuracy")
            scores.append({"name": getattr(sc, "name", None),
                           "metrics": {"accuracy": {"value": getattr(acc, "value", None)}}})
        samples = []
        for smp in (getattr(log, "samples", None) or []):
            samples.append({"id": getattr(smp, "id", None),
                            "scores": {k: {"value": getattr(v, "value", None)}
                                       for k, v in (getattr(smp, "scores", None) or {}).items()}})
        ev = getattr(log, "eval", None)
        return {
            "version": getattr(log, "version", None),
            "status": getattr(log, "status", None),
            "eval": {"task": getattr(ev, "task", None), "model": getattr(ev, "model", None)},
            "results": {"total_samples": getattr(results, "total_samples", None), "scores": scores},
            "samples": samples,
        }
    except Exception:
        pass
    import zipfile
    with zipfile.ZipFile(path) as z:
        header = json.loads(z.read("header.json"))
        samples = []
        for name in sorted(n for n in z.namelist() if n.startswith("samples/") and n.endswith(".json")):
            samples.append(json.loads(z.read(name)))
    return {
        "version": header.get("version"),
        "status": header.get("status"),
        "eval": header.get("eval") or {},
        "results": header.get("results") or {},
        "samples": samples,
    }


def ingest(raw: bytes, *, read_at: Optional[str] = None, source_url: Optional[str] = None) -> List[Dict[str, Any]]:
    doc = json.loads(raw.decode("utf-8"))
    sha = hashlib.sha256(raw).hexdigest()
    ev = doc.get("eval") or {}
    task = str(ev.get("task") or doc.get("task") or "unnamed-task")
    model = str(ev.get("model") or doc.get("model") or "unspecified-model")
    status = str(doc.get("status") or "unknown").lower()
    results = doc.get("results") or {}
    samples = doc.get("samples") or []
    scorer = _first_scorer(doc)
    declared_total = results.get("total_samples", results.get("completed_samples"))
    accuracy = None
    for s in results.get("scores") or []:
        if isinstance(s, dict) and str(s.get("name")) == scorer:
            accuracy = _value(((s.get("metrics") or {}).get("accuracy") or {}).get("value"))
    base = dict(
        subject={"kind": "model_run", "locator": f"inspect-log:{task}/{model}", "declared_by": f"inspect {doc.get('version', 'unknown')} log sha256:{sha}"},
        claim={"text": f"Inspect reports {task} on {model} at accuracy {accuracy} over {declared_total} samples (status {status}).",
               "source_url": source_url, "source_sha256": sha, "read_at": read_at},
        method={"id": "inspect-native-recount", "version": str(doc.get("version") or "unknown"), "code_sha256": None, "holder": "third_party:uk-aisi/inspect"},
        declared={"task": task, "model": model, "status": status, "scorer": scorer,
                  "declared_accuracy": accuracy, "declared_total": declared_total},
    )
    limits = ["Inspect holds the task and the scorer; this event recounts the log's own bytes and writes no sample.",
              "A recount does not establish that the model ran as claimed, that the benchmark is uncontaminated, or that the system is safe."]
    if status != "success":
        return [E.build(**base, observed={"samples_present": bool(samples), "reason": f"log status is {status!r}; an incomplete run is not a result"},
                        state="UNMEASURED", value=None,
                        negative_control={"id": "one-sample-verdict-flipped", "expected": None, "got": "NOT_RUN"}, limits=limits)]
    if not isinstance(samples, list) or not samples or scorer is None:
        return [E.build(**base, observed={"samples_present": False, "reason": "summary-only log without recountable sample rows"},
                        state="UNCHECKABLE", value=None,
                        negative_control={"id": "one-sample-verdict-flipped", "expected": None, "got": "NOT_RUN"}, limits=limits)]
    observed = recount(samples, scorer)
    if observed is None:
        return [E.build(**base, observed={"samples_present": True, "reason": f"a sample row carries no readable {scorer} value"},
                        state="UNCHECKABLE", value=None,
                        negative_control={"id": "one-sample-verdict-flipped", "expected": None, "got": "NOT_RUN"}, limits=limits)]
    control = recount(flip_one(samples, scorer), scorer)
    discriminates = control is not None and (control["passed"] != observed["passed"] or control["failed"] != observed["failed"])
    declared_passed = round(accuracy * declared_total) if (accuracy is not None and isinstance(declared_total, int)) else None
    match = declared_passed is not None and isinstance(declared_total, int) and declared_passed == observed["passed"] and declared_total == observed["total_evaluated"]
    state = ("CONSISTENT" if match else "DIVERGENT") if discriminates else "NOT_DISCRIMINATING"
    value = (observed["passed"] / observed["total_evaluated"]) if (state == "CONSISTENT" and observed["total_evaluated"]) else None
    return [E.build(**base,
                    observed={**observed, "recount_of": f"samples[].scores.{scorer}.value", "declared_passed": declared_passed},
                    state=state, value=value,
                    negative_control={"id": "one-sample-verdict-flipped", "expected": "DIVERGENT", "got": "DIVERGENT" if discriminates else "CONSISTENT"},
                    limits=limits)]


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("log", help="a .eval archive or a JSON document")
    ap.add_argument("--source-url")
    ap.add_argument("--read-at")
    a = ap.parse_args(argv)
    if a.log.endswith(".eval"):
        doc = load_eval_log(a.log)
        events = ingest(json.dumps(doc).encode(), read_at=a.read_at, source_url=a.source_url)
    else:
        events = ingest(open(a.log, "rb").read(), read_at=a.read_at, source_url=a.source_url)
    for ev in events:
        sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
