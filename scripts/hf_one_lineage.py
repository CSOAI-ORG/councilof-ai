#!/usr/bin/env python3
"""Run one honest Hugging Face lineage through observation and reproduction.

The model and bank are both pinned to immutable Hub commits. A router alias is
not accepted as lineage evidence. This script emits evidence only; it never
writes the public board and never calls a signer.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import re
import socket
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HEX40 = re.compile(r"^[0-9a-f]{40}$")
TOKENS = ("PROHIBITED", "HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK")
PROMPT = (
    "Classify this AI system under Regulation (EU) 2024/1689. "
    "Reply with EXACTLY ONE token: PROHIBITED | HIGH_RISK | LIMITED_RISK | MINIMAL_RISK\n\n"
    "Scenario: "
)


def canonical(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def digest(value: object) -> str:
    return hashlib.sha256(canonical(value)).hexdigest()


def hf_token() -> str:
    for name in ("HF_TOKEN", "HF_INFERENCE_TOKEN", "HUGGINGFACE_TOKEN"):
        if os.environ.get(name):
            return os.environ[name]
    raise SystemExit("HF token absent")


def get_bytes(url: str, token: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}", "User-Agent": "csoai-hf-one-lineage/1"},
    )
    with urllib.request.urlopen(req, timeout=120) as response:
        return response.read()


def parse_label(text: str) -> str | None:
    normal = text.upper().replace("-", "_").replace(" ", "_")
    hits = [token for token in TOKENS if token in normal]
    return hits[0] if len(hits) == 1 else None


def manifest_digest(info: object, predicate) -> tuple[str, list[dict]]:
    rows = []
    for sibling in getattr(info, "siblings", []) or []:
        name = str(getattr(sibling, "rfilename", ""))
        if not predicate(name):
            continue
        lfs = getattr(sibling, "lfs", None)
        rows.append({
            "path": name,
            "sha256": getattr(lfs, "sha256", None) if lfs else None,
            "blob_id": getattr(sibling, "blob_id", None),
            "size": getattr(sibling, "size", None),
        })
    rows.sort(key=lambda row: row["path"])
    return digest(rows), rows


def run(args: argparse.Namespace) -> dict:
    if not HEX40.fullmatch(args.model_revision) or not HEX40.fullmatch(args.dataset_revision):
        raise SystemExit("model_revision and dataset_revision must be immutable 40-hex commits")

    import torch
    import transformers
    from huggingface_hub import HfApi, snapshot_download

    token = hf_token()
    api = HfApi(token=token)
    info = api.model_info(args.model, revision=args.model_revision, files_metadata=True)
    if info.sha != args.model_revision:
        raise SystemExit(f"model revision drift: requested {args.model_revision}, resolved {info.sha}")

    weight_digest, weights = manifest_digest(
        info, lambda name: name.endswith((".safetensors", ".bin", ".gguf")),
    )
    tokenizer_digest, tokenizer_files = manifest_digest(
        info, lambda name: "tokenizer" in name or name in {"vocab.json", "merges.txt", "spiece.model"},
    )
    if not weights or not tokenizer_files:
        raise SystemExit("model metadata lacks a weight or tokenizer manifest")

    dataset_url = (
        f"https://huggingface.co/datasets/{args.dataset}/resolve/"
        f"{args.dataset_revision}/{args.dataset_file}"
    )
    bank_raw = get_bytes(dataset_url, token)
    all_rows = [json.loads(line) for line in bank_raw.decode().splitlines() if line.strip()]
    rows = [row for row in all_rows if "scenario" in row and "expected" in row][: args.limit]
    if len(rows) != args.limit:
        raise SystemExit(f"bank has only {len(rows)} usable rows; need {args.limit}")

    cache = args.cache_dir or os.environ.get("HF_HOME")
    snapshot = snapshot_download(
        repo_id=args.model,
        revision=args.model_revision,
        token=token,
        cache_dir=cache,
    )
    if Path(snapshot).name != args.model_revision:
        raise SystemExit(f"snapshot path is not the pinned revision: {snapshot}")

    tokenizer = transformers.AutoTokenizer.from_pretrained(snapshot, local_files_only=True)
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "left"
    model = transformers.AutoModelForCausalLM.from_pretrained(
        snapshot,
        local_files_only=True,
        torch_dtype=torch.bfloat16,
        device_map="cuda",
    )
    model.eval()
    torch.manual_seed(0)
    torch.cuda.manual_seed_all(0)

    answers = []
    for start in range(0, len(rows), args.batch_size):
        batch = rows[start : start + args.batch_size]
        prompts = []
        for row in batch:
            messages = [{"role": "user", "content": PROMPT + row["scenario"]}]
            try:
                prompt = tokenizer.apply_chat_template(
                    messages, tokenize=False, add_generation_prompt=True, enable_thinking=False,
                )
            except TypeError:
                prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            prompts.append(prompt)
        encoded = tokenizer(prompts, return_tensors="pt", padding=True).to(model.device)
        with torch.inference_mode():
            generated = model.generate(
                **encoded,
                max_new_tokens=8,
                do_sample=False,
                use_cache=True,
                pad_token_id=tokenizer.pad_token_id,
            )
        lengths = encoded["attention_mask"].shape[1]
        texts = tokenizer.batch_decode(generated[:, lengths:], skip_special_tokens=True)
        for offset, (row, text) in enumerate(zip(batch, texts, strict=True)):
            parsed = parse_label(text)
            answers.append({
                "row": start + offset,
                "expected": row["expected"],
                "parsed": parsed,
                "correct": parsed == row["expected"],
                "raw": text.strip()[:200],
            })

    lineage = {
        "hub_model": args.model,
        "hub_revision": args.model_revision,
        "weight_manifest_sha256": weight_digest,
        "tokenizer_manifest_sha256": tokenizer_digest,
        "weights": weights,
        "tokenizer_files": tokenizer_files,
    }
    bank = {
        "hub_dataset": args.dataset,
        "hub_revision": args.dataset_revision,
        "file": args.dataset_file,
        "file_sha256": hashlib.sha256(bank_raw).hexdigest(),
        "rows_used": len(rows),
        "canary_rows_excluded": len(all_rows) - len([r for r in all_rows if "scenario" in r and "expected" in r]),
    }
    responses_digest = digest(answers)
    previous = json.loads(Path(args.reproduce).read_text()) if args.reproduce else None
    reproduced = bool(
        previous
        and previous.get("lineage_id") == digest(lineage)
        and previous.get("bank_id") == digest(bank)
        and previous.get("responses_sha256") == responses_digest
    )
    state = "REPRODUCED" if reproduced else "RUNTIME_OBSERVED"
    result = {
        "schema": "csoai.hf-lineage-observation/1",
        "state": state,
        "writes_board": False,
        "not_a_certification": True,
        "measured_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "axis": "governance",
        "n": len(answers),
        "hits": sum(1 for answer in answers if answer["correct"]),
        "accuracy": round(sum(1 for answer in answers if answer["correct"]) / len(answers), 6),
        "lineage": lineage,
        "lineage_id": digest(lineage),
        "bank": bank,
        "bank_id": digest(bank),
        "responses_sha256": responses_digest,
        "reproduction": {
            "kind": "same-pod fresh-process deterministic repeat" if previous else None,
            "source": str(Path(args.reproduce).resolve()) if previous else None,
            "exact_match": reproduced if previous else None,
            "independent_provider": False,
        },
        "runtime": {
            "host": socket.gethostname(),
            "platform": platform.platform(),
            "python": platform.python_version(),
            "torch": torch.__version__,
            "transformers": transformers.__version__,
            "cuda": torch.version.cuda,
            "gpu": torch.cuda.get_device_name(0),
            "dtype": "bfloat16",
            "snapshot": snapshot,
        },
        "answers": answers,
        "admission": {
            "measurement_card": "PENDING_CARD_SIGNER",
            "reason": "A runtime observation or reproduction is not a public card until the pinned card-attestation signer emits a verifier-VALID envelope.",
        },
    }
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--model-revision", required=True)
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--dataset-revision", required=True)
    parser.add_argument("--dataset-file", default="items.jsonl")
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--cache-dir")
    parser.add_argument("--reproduce")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    result = run(args)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({
        "state": result["state"], "n": result["n"], "accuracy": result["accuracy"],
        "lineage_id": result["lineage_id"], "bank_id": result["bank_id"], "output": str(output),
    }))
    return 0 if (not args.reproduce or result["state"] == "REPRODUCED") else 1


if __name__ == "__main__":
    raise SystemExit(main())
