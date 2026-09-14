#!/usr/bin/env python3
"""Offline admission for HF Jobs mill cards.

The verifier consumes the exact frozen bank and item transcript from the same
staging artifact.  It performs no network access and signs nothing.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "harness" / "gspc-top100"))
from mill_hub_queue import (  # noqa: E402
    ITEM_EVIDENCE_SCHEMA, MILL_INSTRUMENT, axis_prompt, canonical_body_bytes,
    load_bank, read_label,
)

RECEIPT_SCHEMA = "csoai.mill-evidence-admission/0.2"
SHA256 = re.compile(r"^[0-9a-f]{64}$")
REVISION = re.compile(r"^[0-9a-f]{40,64}$")
ITEM_KEYS = {
    "schema", "i", "axis", "model", "model_hf_revision", "bank_sha256",
    "bank_dataset", "bank_revision", "provider_route", "prompt",
    "prompt_sha256", "expected", "raw_output", "raw_output_sha256",
    "observed", "ok", "elapsed_ms",
}
EVIDENCE_KEYS = {
    "schema", "items_file", "items_sha256", "bank_file", "bank_sha256",
    "bank_dataset", "bank_revision", "model_hf_revision", "instrument_sha256",
}


class EvidenceError(ValueError):
    pass


def require(ok: bool, message: str) -> None:
    if not ok:
        raise EvidenceError(message)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()


def safe_file(directory: Path, name: object, pattern: str) -> Path:
    require(isinstance(name, str) and re.fullmatch(pattern, name) is not None, "unsafe evidence filename")
    path = directory / name
    require(not path.is_symlink() and path.is_file(), f"evidence file absent: {name}")
    return path


def validate_bundle(body: dict, directory: Path) -> dict:
    ev = body.get("evidence")
    require(isinstance(ev, dict) and set(ev) == EVIDENCE_KEYS, "current evidence fields required")
    require(ev["schema"] == ITEM_EVIDENCE_SCHEMA, "legacy or unknown evidence schema")
    require(bool(SHA256.fullmatch(str(ev["items_sha256"]))), "bad items digest")
    require(bool(SHA256.fullmatch(str(ev["bank_sha256"]))), "bad bank digest")
    require(bool(REVISION.fullmatch(str(ev["bank_revision"]))), "bank revision is not immutable")
    require(bool(REVISION.fullmatch(str(ev["model_hf_revision"]))), "model revision is not immutable")
    require(isinstance(ev["bank_dataset"], str) and "/" in ev["bank_dataset"], "bank dataset missing")
    require(ev["instrument_sha256"] == sha(canonical(MILL_INSTRUMENT)), "instrument pin mismatch")

    items_path = safe_file(directory, ev["items_file"], r"items-[a-z0-9-]{1,12}-[0-9a-f]{12}\.jsonl")
    bank_path = safe_file(directory, ev["bank_file"], r"bank-[a-z0-9-]{1,12}-[0-9a-f]{12}\.jsonl")
    items_raw, bank_raw = items_path.read_bytes(), bank_path.read_bytes()
    require(sha(items_raw) == ev["items_sha256"], "items digest mismatch")
    require(sha(bank_raw) == ev["bank_sha256"], "bank digest mismatch")
    require(items_raw.endswith(b"\n") and items_raw, "items JSONL is incomplete")

    bank = load_bank(bank_path)
    labels = [str(expected).strip().upper() for _, expected in bank]
    rows = []
    for i, line in enumerate(items_raw.splitlines(keepends=True)):
        require(line.endswith(b"\n") and line != b"\n", "blank or partial item row")
        try:
            row = json.loads(line)
        except Exception as error:
            raise EvidenceError("invalid item JSON") from error
        require(isinstance(row, dict) and set(row) == ITEM_KEYS, "item fields differ from v0.2")
        require(canonical(row) + b"\n" == line, "item row is not canonical")
        require(row["schema"] == ITEM_EVIDENCE_SCHEMA and row["i"] == i, "item sequence/schema mismatch")
        for field in ("axis", "model"):
            require(row[field] == body[field], f"item {field} mismatch")
        for field in ("model_hf_revision", "bank_sha256", "bank_dataset", "bank_revision"):
            require(row[field] == ev[field], f"item {field} pin mismatch")
        require(i < len(bank), "more result rows than frozen bank items")
        expected_prompt = axis_prompt(body["axis"], bank[i][0], labels)
        expected = labels[i]
        require(row["prompt"] == expected_prompt, "sent prompt differs from frozen bank")
        require(row["prompt_sha256"] == sha(expected_prompt.encode()), "prompt digest mismatch")
        require(row["expected"] == expected, "expected label differs from frozen bank")
        require(isinstance(row["raw_output"], str), "raw output missing")
        require(row["raw_output_sha256"] == sha(row["raw_output"].encode()), "raw output digest mismatch")
        require(isinstance(row["provider_route"], str) and (
            row["provider_route"].startswith("hf-router:") or
            row["provider_route"].startswith("openrouter:")
        ), "exact provider route missing")
        require(isinstance(row["elapsed_ms"], int) and not isinstance(row["elapsed_ms"], bool) and row["elapsed_ms"] >= 0,
                "elapsed time missing")
        observed = read_label(row["raw_output"], labels)
        require(row["observed"] == observed, "observed label does not recompute")
        ok = None if observed is None else observed == expected
        require(row["ok"] is ok, "grade does not recompute")
        rows.append(row)

    answered = [row for row in rows if row["observed"] is not None]
    correct = sum(row["ok"] is True for row in rows)
    require(len(answered) == body.get("n"), "card denominator does not recompute")
    expected_accuracy = round(correct / len(answered), 4) if answered else None
    if isinstance(expected_accuracy, float) and expected_accuracy.is_integer():
        expected_accuracy = int(expected_accuracy)
    require(body.get("accuracy") == expected_accuracy, "card accuracy does not recompute")
    return {
        "items": len(rows), "answered": len(answered), "correct": correct,
        "accuracy": expected_accuracy,
        "provider_routes": sorted({row["provider_route"] for row in rows}),
    }


def admit(wrap: dict, staged: Path, evidence_dir: Path) -> dict:
    body = wrap.get("body")
    require(isinstance(body, dict), "card body missing")
    require(wrap.get("id") == sha(canonical_body_bytes(body)), "source card id mismatch")
    summary = validate_bundle(body, staged)
    ev = body["evidence"]
    evidence_dir.mkdir(parents=True, exist_ok=True)
    for key in ("items_file", "bank_file"):
        source = staged / ev[key]
        (evidence_dir / ev[key]).write_bytes(source.read_bytes())
    receipt = {
        "schema": RECEIPT_SCHEMA,
        "state": "VERIFIED_ADMISSION",
        "source_card_id": wrap["id"],
        "source_body": body,
        "items_sha256": ev["items_sha256"],
        "bank_sha256": ev["bank_sha256"],
        "summary": summary,
    }
    raw = json.dumps(receipt, indent=2, sort_keys=True).encode() + b"\n"
    digest = sha(raw)
    name = f"admission-{digest[:12]}.json"
    (evidence_dir / name).write_bytes(raw)
    return {"schema": RECEIPT_SCHEMA, "file": name, "sha256": digest}


def validate_admission(wrap: dict, evidence_dir: Path) -> dict:
    admission = wrap.get("admission")
    require(isinstance(admission, dict) and admission.get("schema") == RECEIPT_SCHEMA, "current admission receipt required")
    path = safe_file(evidence_dir, admission.get("file"), r"admission-[0-9a-f]{12}\.json")
    raw = path.read_bytes()
    require(sha(raw) == admission.get("sha256"), "admission receipt digest mismatch")
    receipt = json.loads(raw)
    require(receipt.get("schema") == RECEIPT_SCHEMA and receipt.get("state") == "VERIFIED_ADMISSION",
            "admission receipt state/schema mismatch")
    source_body = receipt.get("source_body")
    require(isinstance(source_body, dict), "receipt source body missing")
    require(receipt.get("source_card_id") == sha(canonical_body_bytes(source_body)), "receipt card binding mismatch")
    require(wrap.get("id") == receipt["source_card_id"], "wrapper differs from admitted source card")
    require(wrap.get("body") == source_body, "source body changed after admission")
    summary = validate_bundle(source_body, evidence_dir)
    require(receipt.get("items_sha256") == source_body["evidence"]["items_sha256"]
            and receipt.get("bank_sha256") == source_body["evidence"]["bank_sha256"]
            and receipt.get("summary") == summary, "receipt does not bind verified evidence")
    return receipt


def validate_signed_admission(wrap: dict, evidence_dir: Path) -> dict:
    """Validate the signed body as the sole allowed transformation of an admitted source."""
    body = wrap.get("body")
    require(isinstance(body, dict), "signed body missing")
    admission = body.get("admission")
    require(isinstance(admission, dict), "signed admission binding missing")
    path = safe_file(evidence_dir, admission.get("file"), r"admission-[0-9a-f]{12}\.json")
    raw = path.read_bytes()
    require(sha(raw) == admission.get("sha256") and admission.get("schema") == RECEIPT_SCHEMA,
            "signed admission receipt digest/schema mismatch")
    receipt = json.loads(raw)
    source = {"id": receipt.get("source_card_id"), "body": receipt.get("source_body"), "admission": admission}
    validate_admission(source, evidence_dir)
    expected = dict(receipt["source_body"])
    n = int(expected.get("n") or 0)
    expected["status"] = "MEASURED" if n >= 30 else "UNMEASURED"
    expected["unmeasured"] = [] if n >= 30 else ["n<30 unquotable"]
    expected["signature_state"] = "SIGNED"
    expected["admission"] = admission
    require(body == expected, "signed body differs from admitted signer transformation")
    return receipt
