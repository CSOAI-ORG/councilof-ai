#!/usr/bin/env python3
"""Plan or run one existing Auto-Measure allocation and archive its complete receipt.

Uses existing workstation Hub authentication; installs no Space secret and schedules nothing.
Default is read-only planning. --run submits exactly one request. --archive resumes a saved
receipt without inference. Every write compares the exact results-repository parent commit.
"""
from __future__ import annotations

import argparse
import ast
import json
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPACE_SOURCE = ROOT / "spaces/gspc-auto-measure"
sys.path.insert(0, str(SPACE_SOURCE))
import measurement as measurement

SPACE_REPO = "csoai/gspc-auto-measure"
RESULTS_REPO = measurement.RESULTS_REPO


class ArchiveConflict(ValueError):
    pass


@dataclass
class Snapshot:
    revision: str
    raw: bytes
    rows: list


def load_snapshot(api, download):
    revision = api.dataset_info(RESULTS_REPO).sha
    raw = Path(download(RESULTS_REPO, "results.jsonl", repo_type="dataset", revision=revision)).read_bytes()
    rows = [json.loads(line) for line in raw.splitlines() if line.strip()]
    measurement.recovery_state(rows)  # reject conflicting/corrupt v2 history before any model call
    return Snapshot(revision, raw, rows)


def validate_receipt(receipt, source_commit, sequence=None, model_revision=None):
    """Rebuild every grade/hash/count from frozen bank bytes and the complete received outputs."""
    try:
        seq = receipt["sequence"]
        if sequence is not None and seq != sequence:
            raise ValueError("receipt sequence differs from the reserved sequence")
        if receipt["source_revision"] != source_commit:
            raise ValueError("Space source revision changed")
        if model_revision is not None and receipt["model_revision"] != model_revision:
            raise ValueError("model revision changed during the request")
        if receipt["schema"] != measurement.SCHEMA:
            raise ValueError("unsupported receipt schema")
        bank = measurement.BANKS[seq % len(measurement.BANKS)]
        metadata, rows = measurement.load_bank(bank)
        offset, window = measurement.select_window(seq, rows, bank)
        if len(receipt["items"]) != len(window):
            raise ValueError("partial receipt: item count differs from the complete requested window")
        output_keys = ["answer", "raw_output", "rendered_prompt", "rendered_prompt_sha256", "output_token_ids",
                       "generated_tokens", "stop_reason", "stop_reason_source", "token_limit_reached", "error_type"]
        outputs = []
        for item in receipt["items"]:
            output = {key: item[key] for key in output_keys}
            if not isinstance(output["answer"], str) or not isinstance(output["raw_output"], str):
                raise ValueError("raw output and answer must be complete strings")
            if not output["error_type"]:
                ids = output["output_token_ids"]
                if not isinstance(ids, list) or any(isinstance(i, bool) or not isinstance(i, int) for i in ids):
                    raise ValueError("missing generated token evidence")
                if output["generated_tokens"] != len(ids):
                    raise ValueError("generated token count mismatch")
                if output["stop_reason_source"] != "observed_tokens" or output["stop_reason"] not in {"eos_token", "length", "unknown"}:
                    raise ValueError("invalid stop observation")
                if output["rendered_prompt_sha256"] != measurement.sha256(output["rendered_prompt"]):
                    raise ValueError("rendered prompt hash mismatch")
            outputs.append(output)
        rebuilt = measurement.make_result(seq, receipt["model_revision"], bank, metadata, window, offset,
            outputs, receipt["timestamp"], source_commit, receipt["rotation_recovered_from"], receipt["runtime"])
        if measurement.canonical_json(rebuilt) != measurement.canonical_json(receipt):
            raise ValueError("receipt differs from frozen-bank regrade, hashes, protocol or counts")
        return receipt
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError("incomplete or malformed receipt") from exc


def allocation_seconds():
    tree = ast.parse((SPACE_SOURCE / "app.py").read_text())
    durations = [keyword.value.value for call in ast.walk(tree) if isinstance(call, ast.Call)
        and isinstance(call.func, ast.Attribute) and isinstance(call.func.value, ast.Name)
        and call.func.value.id == "spaces" and call.func.attr == "GPU"
        for keyword in call.keywords if keyword.arg == "duration" and isinstance(keyword.value, ast.Constant)]
    if durations != [120]:
        raise ValueError("existing Space allocation is not the qualified 120-second budget")
    return durations[0]


def receipt_path(receipt):
    digest = receipt["receipt_sha256"]
    return f"receipts/{digest[:2]}/{receipt['sequence']:012d}-{digest}.json"


def archive_receipt(api, download, snapshot, receipt, add_operation):
    """Atomic append preserving results.jsonl, plus a uniquely named immutable receipt file."""
    next_sequence, completed = measurement.recovery_state(snapshot.rows)
    seq = receipt["sequence"]
    existing = completed.get(seq)
    if existing and existing["receipt_sha256"] != receipt["receipt_sha256"]:
        raise ArchiveConflict("a different complete receipt already owns this sequence")
    if not existing and seq != next_sequence:
        raise ArchiveConflict(f"next durable sequence is {next_sequence}, received {seq}; no inference retry performed")
    if api.dataset_info(RESULTS_REPO).sha != snapshot.revision:
        raise ArchiveConflict("results parent changed before archive; retain receipt and re-plan archive-only")
    line = (measurement.canonical_json(receipt) + "\n").encode("utf-8")
    raw = snapshot.raw if existing else snapshot.raw + (b"\n" if snapshot.raw and not snapshot.raw.endswith(b"\n") else b"") + line
    path = receipt_path(receipt)
    from huggingface_hub.errors import EntryNotFoundError
    existing_file = None
    try:
        existing_file = Path(download(RESULTS_REPO, path, repo_type="dataset", revision=snapshot.revision)).read_bytes()
    except (EntryNotFoundError, FileNotFoundError):
        pass
    if existing_file is not None and existing_file != line:
        raise ArchiveConflict("immutable receipt filename already contains different bytes")
    if existing and existing_file is not None:
        return {"state": "already_archived", "repo": RESULTS_REPO, "commit": snapshot.revision,
                "sequence": seq, "receipt_path": path, "receipt_sha256": receipt["receipt_sha256"],
                "receipt_file_sha256": measurement.sha256(line), "results_jsonl_sha256": measurement.sha256(raw),
                "model_calls": 0, "writes_board": False}
    operations = [] if existing else [add_operation(path_in_repo="results.jsonl", path_or_fileobj=raw)]
    if existing_file is None:
        operations.append(add_operation(path_in_repo=path, path_or_fileobj=line))
    try:
        commit = api.create_commit(repo_id=RESULTS_REPO, repo_type="dataset", parent_commit=snapshot.revision,
            commit_message=f"Archive unsigned diagnostic sequence {seq}: {receipt['n_graded']}/{receipt['n_attempted']} graded",
            operations=operations)
    except Exception as exc:
        # No blind retry: a transport error can mean the commit actually succeeded.
        raise ArchiveConflict(f"archive commit not confirmed ({type(exc).__name__}); re-plan archive-only") from exc
    for name, expected in [("results.jsonl", raw), (path, line)]:
        actual = Path(download(RESULTS_REPO, name, repo_type="dataset", revision=commit.oid)).read_bytes()
        if measurement.sha256(actual) != measurement.sha256(expected):
            raise ValueError("archive readback hash mismatch; retain the local receipt")
    return {"state": "repaired_archive" if existing else "archived", "repo": RESULTS_REPO, "commit": commit.oid,
            "previous_commit": snapshot.revision, "receipt_path": path, "receipt_sha256": receipt["receipt_sha256"],
            "receipt_file_sha256": measurement.sha256(line), "results_jsonl_sha256": measurement.sha256(raw),
            "sequence": seq, "n_graded": receipt["n_graded"], "n_attempted": receipt["n_attempted"],
            "writes_board": False}


def load_release(api, download, revision):
    release = json.loads(Path(download(SPACE_REPO, "SOURCE_REVISION.json", repo_type="space", revision=revision)).read_text())
    # The operator uses exactly the same grading/receipt contract as the target Space.
    for path in ["measurement.py", "grader.py", "banks.json", "app.py", "inference.py"]:
        if measurement.sha256((SPACE_SOURCE / path).read_bytes()) != release["files"][path]:
            raise ValueError("local receipt validator differs from the pinned Space; use its source revision")
    for bank in measurement.BANKS:
        measurement.load_bank(bank)
    return release


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--run", action="store_true", help="submit exactly one current ZeroGPU request and archive it")
    mode.add_argument("--archive", type=Path, help="archive a saved bundle without inference")
    parser.add_argument("--expected-space-revision", help="required for --run; copied from the reviewed plan")
    parser.add_argument("--expected-results-parent", help="optional caller guard; always checked again before archive")
    parser.add_argument("--timeout-seconds", type=int, default=240)
    parser.add_argument("--out-dir", type=Path, default=Path("auto-measure-receipts"))
    args = parser.parse_args()
    if args.run and not args.expected_space_revision:
        parser.error("--run requires --expected-space-revision from a read-only plan")
    if not 1 <= args.timeout_seconds <= 600:
        parser.error("timeout must be between 1 and 600 seconds")
    from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download
    api = HfApi()  # existing workstation authentication; no secret is printed or moved
    snapshot = load_snapshot(api, hf_hub_download)
    if args.expected_results_parent and snapshot.revision != args.expected_results_parent:
        raise ArchiveConflict("results parent differs from the caller's reviewed plan")
    if args.archive:
        bundle = json.loads(args.archive.read_text())
        release = load_release(api, hf_hub_download, bundle["space_revision"])
        receipt = validate_receipt(bundle["receipt"], release["commit"], bundle["sequence"], bundle["model_revision"])
        evidence = archive_receipt(api, hf_hub_download, snapshot, receipt, CommitOperationAdd)
        args.out_dir.mkdir(parents=True, exist_ok=True)
        (args.out_dir / f"archive-{receipt['receipt_sha256']}.json").write_text(json.dumps(evidence, indent=2) + "\n")
        print(json.dumps(evidence))
        return
    space_revision = api.space_info(SPACE_REPO).sha
    if args.expected_space_revision and space_revision != args.expected_space_revision:
        raise ValueError("Space revision differs from the caller's reviewed plan")
    release = load_release(api, hf_hub_download, space_revision)
    runtime = api.get_space_runtime(SPACE_REPO)
    if args.run and runtime.stage != "RUNNING":
        raise ValueError("Space is not RUNNING; no model request submitted")
    sequence, _ = measurement.recovery_state(snapshot.rows)
    model = measurement.MODELS[sequence % len(measurement.MODELS)]
    model_revision = api.model_info(model).sha
    bank = measurement.BANKS[sequence % len(measurement.BANKS)]
    metadata, rows = measurement.load_bank(bank)
    _, window = measurement.select_window(sequence, rows, bank)
    plan = {"mode": "run_once" if args.run else "read_only_plan", "space": SPACE_REPO,
            "driver_sha256": measurement.sha256(Path(__file__).read_bytes()),
            "space_revision": space_revision, "source_commit": release["commit"], "results_parent": snapshot.revision,
            "sequence": sequence, "model": model, "model_revision": model_revision,
            "bank": bank, "bank_revision": metadata["revision"], "bank_sha256": metadata["sha256"],
            "grader_sha256": measurement.GRADER_SHA256, "max_gpu_seconds": allocation_seconds(),
            "space_stage": runtime.stage, "requested_items": len(window), "item_indices": [row["item_idx"] for row in window],
            "client_timeout_seconds": args.timeout_seconds, "new_hardware": False, "recurring_schedule": False}
    print(json.dumps(plan), flush=True)
    if not args.run:
        return
    args.out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    bundle_path = args.out_dir / f"sequence-{sequence:012d}-{stamp}.json"
    (args.out_dir / f"attempt-{sequence:012d}-{stamp}.json").write_text(json.dumps(plan, indent=2) + "\n")
    from gradio_client import Client
    client = Client(SPACE_REPO, verbose=False, analytics_enabled=False,
                    httpx_kwargs={"timeout": args.timeout_seconds})
    job = client.submit(sequence, api_name="/measure_at")
    try:
        receipt = job.result(timeout=args.timeout_seconds)
    except TimeoutError:
        job.cancel()
        raise RuntimeError("one request timed out; cancellation requested; no archive or inference retry performed") from None
    bundle = {**plan, "receipt": receipt}
    # Save before parsing/validation and before any archive write. Every response remains reviewable.
    bundle_path.write_text(json.dumps(bundle, ensure_ascii=False, indent=2) + "\n")
    if isinstance(receipt, str):
        receipt = json.loads(receipt)
        bundle["receipt"] = receipt
        bundle_path.write_text(json.dumps(bundle, ensure_ascii=False, indent=2) + "\n")
    if api.space_info(SPACE_REPO).sha != space_revision:
        raise ValueError(f"Space revision moved during inference; receipt retained at {bundle_path}")
    validate_receipt(receipt, release["commit"], sequence, model_revision)
    evidence = archive_receipt(api, hf_hub_download, snapshot, receipt, CommitOperationAdd)
    evidence.update({"submitted_space_requests": 1, "local_bundle": str(bundle_path)})
    (args.out_dir / f"archive-{receipt['receipt_sha256']}.json").write_text(json.dumps(evidence, indent=2) + "\n")
    print(json.dumps(evidence), flush=True)
    if receipt["n_graded"] == 0:
        raise SystemExit("Archive succeeded, but no labels were graded; native inference acceptance remains incomplete")


if __name__ == "__main__":
    main()
