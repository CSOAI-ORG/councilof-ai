"""CPU-side measurement contracts. No model calls, Hub writes, or new credentials here."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from grader import GRADER_SHA256, read_label

SCHEMA = "csoai.gspc-auto-measure/2"
RESULTS_REPO = "csoai/gspc-auto-measure-results"
BANKS = ["csoai/gspc-mcp", "csoai/gspc-oss", "csoai/gspc-prv", "csoai/gspc-det", "csoai/gspc-art5"]
MODELS = [
    "Qwen/Qwen3-8B", "unsloth/Llama-3.2-3B-Instruct", "ibm-granite/granite-3.3-2b-instruct",
    "HuggingFaceTB/SmolLM2-1.7B-Instruct", "Qwen/Qwen2.5-7B-Instruct", "unsloth/gemma-2-9b-it",
]
PROMPT_KEYS = ["item", "scenario", "request", "text", "tool", "operation", "case", "prompt", "question"]
PROTOCOL = {"max_new_tokens": 96, "do_sample": False, "enable_thinking": False,
            "num_fewshot": 0, "prompt_format": "canonical_axis_template", "tools": False}
HERE = Path(__file__).resolve().parent


def sha256(value):
    return hashlib.sha256(value if isinstance(value, bytes) else value.encode("utf-8")).hexdigest()


def canonical_json(value):
    # Preserve the mill's whole-float -> integer rule across JSON.stringify archival drivers.
    def portable(item):
        if isinstance(item, float) and item.is_integer():
            return int(item)
        if isinstance(item, dict):
            return {key: portable(child) for key, child in item.items()}
        if isinstance(item, list):
            return [portable(child) for child in item]
        return item
    return json.dumps(portable(value), ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def load_bank(bank_id, root=HERE):
    metadata = json.loads((root / "banks.json").read_text())[bank_id]
    raw = (root / metadata["file"]).read_bytes()
    if sha256(raw) != metadata["sha256"]:
        raise ValueError("bank SHA256 mismatch; refusing to measure")
    labels = [str(x).strip().upper() for x in metadata["labels"]]
    if len(set(labels)) < 2:
        raise ValueError("a one-label task is not measurable")
    rows = []
    for idx, line in enumerate(raw.splitlines()):
        if not line.strip():
            continue
        row = json.loads(line)
        if set(row) <= {"_canary", "_note"}:
            continue
        content = next((str(row[key]) for key in PROMPT_KEYS if row.get(key)), None)
        expected = row.get("expected")
        if content is None or expected in (None, ""):
            continue
        expected = str(expected).strip().upper()
        if expected not in labels:
            raise ValueError("expected value outside published label menu")
        rows.append({"item_idx": idx, "item": row, "expected": expected,
                     "prompt": metadata["prompt_template"].replace("{item}", content)})
    if not rows:
        raise ValueError("no eligible bank rows")
    return metadata, rows


def recovery_state(history):
    """Resume after committed v2 receipts; seed legacy history without trusting reset run numbers.

    Old run counters restarted repeatedly. Count unique legacy receipts rather than their max run.
    A v2 receipt binds an explicit global sequence, which survives runtime replacement when archived.
    """
    unique_legacy = set()
    completed = {}
    next_sequence = 0
    for row in history:
        if row.get("model") not in MODELS or row.get("bank") not in BANKS:
            continue
        if row.get("schema") == SCHEMA:
            seq = row.get("sequence")
            if isinstance(seq, bool) or not isinstance(seq, int) or seq < 0 or not row.get("run_id"):
                raise ValueError("invalid v2 rotation receipt")
            if row["model"] != MODELS[seq % len(MODELS)] or row["bank"] != BANKS[seq % len(BANKS)]:
                raise ValueError("receipt does not match the declared rotation")
            receipt = {key: value for key, value in row.items() if key != "receipt_sha256"}
            if row.get("receipt_sha256") != sha256(canonical_json(receipt)):
                raise ValueError("durable receipt SHA256 mismatch")
            if seq in completed and completed[seq]["receipt_sha256"] != row["receipt_sha256"]:
                raise ValueError("conflicting durable sequence receipts")
            completed[seq] = row
            next_sequence = max(next_sequence, seq + 1)
        elif row.get("timestamp"):
            unique_legacy.add((row["model"], row["bank"], row["timestamp"], row.get("run")))
    return max(next_sequence, len(unique_legacy)), completed


def read_history():
    """Existing public results store, read-only. Failure must not silently reset to sequence zero."""
    from huggingface_hub import HfApi, hf_hub_download
    info = HfApi(token=False).dataset_info(RESULTS_REPO)
    path = hf_hub_download(RESULTS_REPO, "results.jsonl", repo_type="dataset", revision=info.sha, token=False)
    raw = Path(path).read_bytes()
    rows = [json.loads(line) for line in raw.splitlines() if line.strip()]
    return rows, {"repo": RESULTS_REPO, "revision": info.sha, "sha256": sha256(raw)}


def select_window(sequence, rows, bank_id, size=20):
    if isinstance(sequence, bool) or not isinstance(sequence, int) or sequence < 0:
        raise ValueError("sequence must be a nonnegative integer")
    if bank_id != BANKS[sequence % len(BANKS)]:
        raise ValueError("bank does not match sequence")
    # Each bank recurs every len(BANKS) calls. This needs no in-memory visit counter.
    offset = ((sequence // len(BANKS)) * size) % len(rows)
    count = min(size, len(rows))
    return offset, [rows[(offset + n) % len(rows)] for n in range(count)]


def observed_stop(token_ids, eos_ids, max_new_tokens):
    """Token observations, not a fabricated provider finish_reason."""
    eos = set(eos_ids if isinstance(eos_ids, (list, tuple, set)) else [eos_ids])
    if token_ids and token_ids[-1] in eos:
        return "eos_token"
    if len(token_ids) >= max_new_tokens:
        return "length"
    return "unknown"


def make_result(sequence, model_revision, bank_id, metadata, window, offset, outputs,
                timestamp, source_revision, history_source, runtime):
    if len(outputs) != len(window):
        raise ValueError("inference output count differs from requested item count")
    model_id = MODELS[sequence % len(MODELS)]
    items = []
    for row, output in zip(window, outputs):
        answer = output["answer"]
        label = None if output.get("error_type") else read_label(answer, metadata["labels"])
        grade = None if label is None else int(label == row["expected"])
        raw = output["raw_output"]
        items.append({"item_idx": row["item_idx"], "expected": row["expected"],
            "answer": answer, "raw_output": raw, "raw_output_sha256": sha256(raw),
            "answer_sha256": sha256(answer), "parsed_label": label,
            "parse_status": "error" if output.get("error_type") else ("valid" if label is not None else "unparsed"),
            "hit": grade == 1, "grade": grade,
            "item_sha256": sha256(canonical_json(row["item"])), "prompt": row["prompt"],
            "prompt_sha256": sha256(row["prompt"]),
            **{key: output.get(key) for key in ["rendered_prompt", "rendered_prompt_sha256", "output_token_ids",
                 "generated_tokens", "stop_reason", "stop_reason_source", "token_limit_reached", "error_type"]}})
    n_graded = sum(item["grade"] is not None for item in items)
    hits = sum(item["grade"] == 1 for item in items)
    identity = {"sequence": sequence, "model": model_id, "model_revision": model_revision,
                "bank": bank_id, "bank_sha256": metadata["sha256"], "protocol": PROTOCOL,
                "grader_sha256": GRADER_SHA256, "source_revision": source_revision}
    result = {"schema": SCHEMA, "run_id": sha256(canonical_json(identity)), "sequence": sequence,
        "run": sequence, "model": model_id, "model_revision": model_revision,
        "tokenizer_revision": model_revision, "bank": bank_id, "bank_revision": metadata["revision"],
        "bank_sha256": metadata["sha256"], "grader_sha256": GRADER_SHA256,
        "source_revision": source_revision, "timestamp": timestamp, "protocol": dict(PROTOCOL),
        "runtime": runtime, "rotation_recovered_from": history_source,
        "accuracy": round(hits / n_graded, 4) if n_graded else None,
        "accuracy_all_attempted": round(hits / len(items), 4) if items else None,
        "accuracy_denominator": "n_graded", "hits": hits, "total": len(items),
        "n_attempted": len(items), "n_graded": n_graded, "n_unparsed": len(items) - n_graded,
        "parse_rate": round(n_graded / len(items), 4) if items else None,
        "items": items, "labels": metadata["labels"], "items_window": [offset, offset + len(window)],
        "measurement_state": "UNMEASURED", "writes_board": False,
        "persistence": {"state": "returned_to_driver", "destination": RESULTS_REPO,
                        "note": "Archive this full receipt to make restart recovery durable; local files are ephemeral."}}
    result["receipt_sha256"] = sha256(canonical_json(result))
    return result


def render_result(result):
    """Keep the legacy Markdown/JSON endpoint shape for existing persistence drivers."""
    return (f"### {result['model']} on {result['bank']}\n\n"
            f"Conditional accuracy: **{result['accuracy']}** ({result['hits']}/{result['n_graded']} graded); "
            f"coverage: {result['n_graded']}/{result['n_attempted']} attempted.\n\n"
            f"Sequence {result['sequence']}. Unsigned diagnostic measurement; no board admission.\n\n"
            "Archive the full JSON receipt to the existing results dataset for restart recovery.\n\n"
            "<details><summary>per-item JSON (for the persistence driver)</summary>\n\n"
            f"```json\n{json.dumps(result, ensure_ascii=False)}\n```\n</details>")
