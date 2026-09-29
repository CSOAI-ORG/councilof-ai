#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 CSOAI Ltd
"""Declared containment (the policy prover) against observed behaviour (an observer), for one policy.

Our example; not part of OpenShell. Two questions, answered by different parties, kept apart:

  declared   Does the candidate policy stay inside an operator boundary?  Answered by OpenShell's own
             `openshell-prover check --output json` (a Z3 model of the policy). Its README says a passing
             check "does not attest that a running sandbox installed its restrictions".
  observed   Did the running system behave as the candidate policy declares?  Answered by adapter.py
             over the enforcer's own records plus an independent witness stream.

The record says what each side found. It never turns an inconclusive side into a pass:

  prover exit 3 (unsupported or inconclusive), 130 (cancelled), 2 (error), an unrecognised result,
  a coverage gap for a domain the policy uses, or an observer run with no independent witness
      -> status UNMEASURED, with the reason, and whatever the other side found still shown.
  otherwise -> status MEASURED with one finding:
      DECLARED_WITHIN_BOUNDARY__OBSERVED_CONSISTENT
      DECLARED_WITHIN_BOUNDARY__OBSERVED_DIVERGENT     (the gap the prover does not cover)
      DECLARED_EXCEEDS_BOUNDARY__OBSERVED_CONSISTENT
      DECLARED_EXCEEDS_BOUNDARY__OBSERVED_DIVERGENT

A finding is a comparison, not a grade of a policy or a sandbox.

  python3 declared_observed.py --policy P.yaml --boundary B.yaml (--prover-json J | --prover BIN)
        --enforcer-log LOG [--enforcer-log LOG ...] [--witness W.jsonl] [--out FILE]

Exit codes: 0 MEASURED and both sides agree with the declaration, 1 MEASURED with a divergence or an
exceeded boundary, 2 input error, 3 UNMEASURED.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import adapter as A  # noqa: E402

SCHEMA = "csoai.openshell.declared-vs-observed/0.1"
MEASURED, UNMEASURED = "MEASURED", "UNMEASURED"
PROVER_RESULTS = {"within_boundary": 0, "exceeds_boundary": 1, "error": 2, "unsupported": 3, "inconclusive": 3}
PROVER_SCHEMA_VERSIONS = {1}


class InputError(ValueError):
    pass


def domains_used(doc: dict) -> list[str]:
    """The prover coverage domains that this policy's declarations fall in."""
    need = []
    if doc.get("filesystem_policy") is not None:
        need.append("filesystem")
    if doc.get("landlock") is not None:
        need.append("landlock")
    if doc.get("process") is not None:
        need.append("process")
    rules = doc.get("network_policies") or {}
    if rules:
        need.append("network_l4")
    if any(ep.get("protocol") == "rest" for r in rules.values() for ep in (r.get("endpoints") or [])):
        need.append("network_rest")
    return need


def read_prover(obj: dict, process_exit: int | None = None) -> dict:
    """Validate the prover's JSON contract; anything unexpected is reported, never guessed."""
    problems = []
    if obj.get("schema_version") not in PROVER_SCHEMA_VERSIONS:
        problems.append(f"schema_version {obj.get('schema_version')!r} is not one this reader knows")
    if obj.get("check") != "boundary":
        problems.append(f"check {obj.get('check')!r} is not 'boundary'")
    result = obj.get("result")
    if result not in PROVER_RESULTS:
        problems.append(f"result {result!r} is not a documented prover result")
    elif obj.get("exit_code") != PROVER_RESULTS[result]:
        problems.append(f"exit_code {obj.get('exit_code')!r} does not match result {result!r}")
    if process_exit is not None and process_exit != obj.get("exit_code"):
        problems.append(f"process exit {process_exit} differs from the JSON exit_code {obj.get('exit_code')!r}")
    cov = (obj.get("coverage") or {}).get("domains")
    if not isinstance(cov, list):
        problems.append("coverage.domains is missing")
        cov = []
    return {"result": result, "exit_code": obj.get("exit_code"), "reason_code": obj.get("reason_code"),
            "reason": obj.get("reason"), "counterexample": obj.get("counterexample"),
            "coverage_domains": cov, "prover_version": obj.get("prover_version"),
            "schema_version": obj.get("schema_version"), "problems": problems}


def run_prover(binary: str, policy: str, boundary: str, timeout: str | None) -> tuple[dict, int]:
    cmd = [binary, "check", policy, "--boundary", boundary, "--output", "json"]
    if timeout:
        cmd += ["--timeout", timeout]
    p = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(p.stdout), p.returncode
    except json.JSONDecodeError:
        raise InputError(f"prover wrote no JSON (exit {p.returncode}): {p.stderr.strip()[:200]}")


def decide(prover: dict, observed: dict, need: list[str]) -> tuple[str, str | None, list[str]]:
    """(status, finding, reasons). Reasons explain every UNMEASURED; they are empty for MEASURED."""
    reasons = []
    if prover["problems"]:
        reasons.append("PROVER_OUTPUT_UNRECOGNISED: " + "; ".join(prover["problems"]))
    res = prover["result"]
    if res in ("unsupported", "inconclusive"):
        reasons.append(f"PROVER_{res.upper()}: {prover.get('reason_code') or '-'}: {prover.get('reason') or '-'}")
    elif res == "error":
        reasons.append(f"PROVER_ERROR: {prover.get('reason') or '-'}")
    gap = [d for d in need if d not in prover["coverage_domains"]]
    if gap:
        reasons.append(f"COVERAGE_GAP: the policy uses {gap}, which the prover's coverage.domains does not list")
    if observed["result"] == A.UNMEASURED:
        reasons.append("NO_INDEPENDENT_OBSERVER: the observer run has no witnessed row; the enforcer's word alone "
                       "cannot show what happened")
    if reasons:
        return UNMEASURED, None, reasons
    side_d = {"within_boundary": "DECLARED_WITHIN_BOUNDARY", "exceeds_boundary": "DECLARED_EXCEEDS_BOUNDARY"}[res]
    side_o = {A.CONSISTENT: "OBSERVED_CONSISTENT", A.DIVERGENT: "OBSERVED_DIVERGENT"}[observed["result"]]
    return MEASURED, f"{side_d}__{side_o}", []


def build(policy: str, boundary: str, prover_obj: dict, prover_exit: int | None, enforcer_logs: list[str],
          witness: str | None, strict: bool = False, prover_source: str = "json file") -> dict:
    doc = A.load_policy(policy)
    A.load_policy(boundary)  # the boundary must itself be a valid policy
    enforcer, estats = A.load_enforcer(enforcer_logs)
    wit = A.load_witness(witness)
    rows = A.compare(doc, enforcer, wit)
    summary = A.summarise(rows, strict)
    prover = read_prover(prover_obj, prover_exit)
    need = domains_used(doc)
    status, finding, reasons = decide(prover, summary, need)
    return {
        "schema": SCHEMA,
        "status": status,
        "finding": finding,
        "unmeasured_reasons": reasons,
        "declared": {"by": "openshell-prover (OpenShell's policy prover)", "source": prover_source,
                     "domains_policy_uses": need, **{k: v for k, v in prover.items() if k != "problems"},
                     "limit": "the prover compares configuration; it does not attest that a running sandbox "
                              "installed its restrictions"},
        "observed": {"by": f"{A.ADAPTER_NAME} {A.ADAPTER_VERSION}", "result": summary["result"],
                     "rows": summary["rows"], "witnessed_rows": summary["witnessed_rows"],
                     "counts": summary["counts"], "codes": summary["codes"],
                     "enforcer_lines": estats["lines"], "enforcer_records_parsed": estats["parsed"]},
        "inputs": {"policy_sha256": A.sha256_file(policy), "boundary_sha256": A.sha256_file(boundary),
                   "prover_json_sha256": A.sha256_bytes(A._canon(prover_obj)),
                   "enforcer_logs": estats["files"], "witness_sha256": A.sha256_file(witness) if witness else None},
        "openshell_pin": A.OPENSHELL_PIN,
        "not_a_grade": "A comparison between a declaration and an observation, not a grade.",
    }


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--policy", required=True)
    p.add_argument("--boundary", required=True)
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--prover-json", help="saved output of `openshell-prover check --output json`")
    g.add_argument("--prover", help="path to the openshell-prover binary; run it now")
    p.add_argument("--prover-timeout")
    p.add_argument("--enforcer-log", action="append", default=[])
    p.add_argument("--witness")
    p.add_argument("--strict", action="store_true")
    p.add_argument("--out")
    a = p.parse_args(argv)
    try:
        if a.prover:
            obj, code = run_prover(a.prover, a.policy, a.boundary, a.prover_timeout)
            src = "live run"
        else:
            obj, code, src = A._read_json(a.prover_json), None, "json file"
        rec = build(a.policy, a.boundary, obj, code, a.enforcer_log, a.witness, a.strict, src)
    except (A.PolicyError, InputError, OSError, ValueError, json.JSONDecodeError) as e:
        print(f"input error: {e}", file=sys.stderr)
        return 2
    text = json.dumps(rec, indent=1, ensure_ascii=False) + "\n"
    if a.out:
        with open(a.out, "w", encoding="utf-8") as fh:
            fh.write(text)
    print(f"STATUS {rec['status']}  finding={rec['finding']}  prover={rec['declared']['result']}  "
          f"observed={rec['observed']['result']}")
    for r in rec["unmeasured_reasons"]:
        print(f"  unmeasured: {r}")
    if rec["status"] == UNMEASURED:
        return 3
    return 0 if rec["finding"] == "DECLARED_WITHIN_BOUNDARY__OBSERVED_CONSISTENT" else 1


if __name__ == "__main__":
    sys.exit(main())
