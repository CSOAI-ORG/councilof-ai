#!/usr/bin/env python3
"""Reproduce one pinned Tracr README example; never score or admit an axis.

Freeze a prospective finite input set before importing or running Tracr. Run in an
isolated environment containing the upstream dependencies. No downloaded weights,
API model calls, training, signature or board mutation. This is a scoped example
reproduction, not a replication of the paper's experiments or 39 independent groups.
"""
import argparse
import datetime as dt
import hashlib
import importlib.metadata
import itertools
import json
import os
from pathlib import Path
import platform
import subprocess
import sys

COMMIT = "9ce2b8c82b6ba10e62e86cf6f390e7536d4fd2cd"
SOURCE = f"https://github.com/google-deepmind/tracr/blob/{COMMIT}/README.md"
SELF = Path(__file__).resolve()


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def encoded(value):
    return (json.dumps(value, sort_keys=True, indent=2) + "\n").encode()


def write_new(p, value):
    with Path(p).open("xb") as f:
        f.write(encoded(value))


def check_source(source):
    def git(*args):
        return subprocess.check_output(["git", "-C", str(source), *args], text=True).strip()
    if git("rev-parse", "HEAD") != COMMIT or git("diff", "HEAD", "--name-only"):
        raise ValueError("upstream commit or tracked source differs from the pinned example")
    # Confirm the worktree's tracked bytes, including staged and unstaged changes.
    return {p: digest((source / p).read_bytes()) for p in git("ls-files").splitlines() if (source / p).is_file()}


def bank():
    return [{"id": f"reverse-{n}-{i:02d}", "input": list(values), "expected": ["BOS", *reversed(values)],
             "identity_is_discriminating": list(values) != list(reversed(values))}
            for n in range(1, 4) for i, values in enumerate(itertools.product((1, 2, 3), repeat=n), 1)]


def environment():
    return {"python": platform.python_version(), "platform": platform.platform(),
            "packages": dict(sorted((d.metadata["Name"], d.version) for d in importlib.metadata.distributions()))}


def freeze(directory, source, install_report):
    source_hashes = check_source(source)
    directory.mkdir(mode=0o700)
    spec = {"schema": "csoai.tracr-example-input/0.1", "frozen_at": now(), "upstream_commit": COMMIT,
            "source_url": SOURCE, "source_sha256": source_hashes, "method_sha256": digest(SELF.read_bytes()),
            "environment": environment(), "install_report_sha256": digest(install_report.read_bytes()),
            "input_bank": bank(), "model": {"compiler_bos": "BOS", "vocab": [1, 2, 3], "max_seq_len": 5, "device": "cpu"},
            "acceptance": {"exact_reverse_cases": 39, "wrong_identity_cases_rejected": 24},
            "scope": "Published README reverse example on all 39 length-1-to-3 inputs over {1,2,3}; a convenience finite domain, not a population estimate.",
            "admission_eligible": False, "review_state": "UNREVIEWED_EXPERIMENT"}
    write_new(directory / "input.json", spec)
    with (directory / "install-report.json").open("xb") as f:
        f.write(install_report.read_bytes())
    return {"input_sha256": digest(encoded(spec)), "cases": 39, "discriminating_negative_cases": 24}


def load_input(directory):
    raw = (directory / "input.json").read_bytes()
    spec = json.loads(raw)
    if spec["method_sha256"] != digest(SELF.read_bytes()) or spec["input_bank"] != bank():
        raise ValueError("method or input bank changed after freeze")
    if spec["upstream_commit"] != COMMIT or spec["acceptance"] != {"exact_reverse_cases": 39, "wrong_identity_cases_rejected": 24} or spec["admission_eligible"] is not False:
        raise ValueError("prospective acceptance or authority changed")
    if spec["install_report_sha256"] != digest((directory / "install-report.json").read_bytes()):
        raise ValueError("install report changed")
    return spec, digest(raw)


def evaluate_rows(spec, rows):
    expected = spec["input_bank"]
    if len(rows) != len(expected) or len({r["id"] for r in rows}) != len(expected):
        raise ValueError("missing or duplicate experiment rows")
    correct = negative = 0
    for case, row in zip(expected, rows):
        if row["id"] != case["id"] or row["input"] != case["input"]:
            raise ValueError("experiment membership mismatch")
        correct += row["reverse_output"] == case["expected"]
        negative += case["identity_is_discriminating"] and row["identity_output"] != case["expected"]
    return {"cases": len(rows), "exact_reverse_cases": correct, "wrong_identity_cases_rejected": negative,
            "non_discriminating_identity_cases": sum(not c["identity_is_discriminating"] for c in expected)}


def execute(directory, source):
    spec, input_sha = load_input(directory)
    if spec["source_sha256"] != check_source(source) or spec["environment"] != environment():
        raise ValueError("source or environment differs from freeze")
    write_new(directory / "STARTED.json", {"started_at": now(), "input_sha256": input_sha})
    started = now()
    os.environ["JAX_PLATFORMS"] = "cpu"
    os.environ["OMP_NUM_THREADS"] = "1"
    os.environ["OPENBLAS_NUM_THREADS"] = "1"
    sys.path.insert(0, str(source))
    import jax
    from tracr.rasp import rasp
    from tracr.compiler import compiling
    if any(d.platform != "cpu" for d in jax.devices()):
        raise ValueError("CPU-only experiment")
    length = rasp.SelectorWidth(rasp.Select(rasp.tokens, rasp.tokens, rasp.Comparison.TRUE))
    opposite_index = length - rasp.indices - 1
    reverse = rasp.Aggregate(rasp.Select(rasp.indices, opposite_index, rasp.Comparison.EQ), rasp.tokens)
    settings = {"vocab": {1, 2, 3}, "max_seq_len": 5, "compiler_bos": "BOS"}
    reverse_model = compiling.compile_rasp_to_model(reverse, **settings)
    # An explicit wrong selector produces identity through an actual attention
    # layer. Bare rasp.tokens has no compilable layers in the pinned compiler.
    identity = rasp.Aggregate(rasp.Select(rasp.indices, rasp.indices, rasp.Comparison.EQ), rasp.tokens)
    identity_model = compiling.compile_rasp_to_model(identity, **settings)
    rows = []
    with (directory / "outputs.jsonl").open("x") as f:
        for case in spec["input_bank"]:
            tokens = ["BOS", *case["input"]]
            row = {"id": case["id"], "input": case["input"],
                   "reverse_output": reverse_model.apply(tokens).decoded,
                   "identity_output": identity_model.apply(tokens).decoded}
            # Preserve observations; never replace them with expected answers.
            row = json.loads(json.dumps(row, default=lambda v: v.item()))
            f.write(json.dumps(row, sort_keys=True) + "\n"); f.flush(); rows.append(row)
    if spec["source_sha256"] != check_source(source) or spec["environment"] != environment():
        raise ValueError("source or environment changed during run")
    counts = evaluate_rows(spec, rows)
    reproduced = all(counts[k] == v for k, v in spec["acceptance"].items())
    report = {"schema": "csoai.tracr-example-result/0.1", "started_at": started, "completed_at": now(),
              "input_sha256": input_sha, "outputs_sha256": digest((directory / "outputs.jsonl").read_bytes()),
              "counts": counts, "status": "EXAMPLE_REPRODUCED" if reproduced else "EXAMPLE_NOT_REPRODUCED",
              "device": "cpu", "upstream_commit": COMMIT, "source_url": SOURCE, "admission_eligible": False,
              "axes_promoted": 0, "review_state": "AWAITING_INDEPENDENT_REVIEW", "scope": spec["scope"],
              "limit": "One published example, one implementation and one machine. No paper-wide result, cross-harness fidelity, external endpoint identity, population claim or axis admission."}
    write_new(directory / "result.json", report)
    return report


def replay(directory):
    spec, input_sha = load_input(directory)
    report = json.loads((directory / "result.json").read_bytes())
    raw = (directory / "outputs.jsonl").read_bytes()
    if report["input_sha256"] != input_sha or report["outputs_sha256"] != digest(raw) or report["admission_eligible"] is not False or report["axes_promoted"] != 0:
        raise ValueError("result binding or authority mismatch")
    rows = [json.loads(line) for line in raw.splitlines()]
    counts = evaluate_rows(spec, rows)
    state = "EXAMPLE_REPRODUCED" if all(counts[k] == v for k, v in spec["acceptance"].items()) else "EXAMPLE_NOT_REPRODUCED"
    if report["counts"] != counts or report["status"] != state:
        raise ValueError("result does not reproduce from retained observations")
    return {"replayed_cases": len(rows), "status": state, "counts": counts, "axes_promoted": 0}


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("command", choices=["freeze", "run", "replay"])
    p.add_argument("directory", type=Path)
    p.add_argument("--source", type=Path)
    p.add_argument("--install-report", type=Path)
    args = p.parse_args()
    if args.command == "freeze":
        value = freeze(args.directory, args.source.resolve(), args.install_report)
    elif args.command == "run":
        value = execute(args.directory, args.source.resolve())
    else:
        value = replay(args.directory)
    print(json.dumps(value, sort_keys=True))
