#!/usr/bin/env python3
"""Build one compact, unsigned card candidate from reproduced HF evidence.

This is a deterministic admission boundary, not a signer. It refuses mutable
revisions, partial samples and non-exact reproduction. The output stays
CANDIDATE/REPRODUCED until GitHub OIDC reaches the pinned card signer.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

HEX40 = re.compile(r"^[0-9a-f]{40}$")
HEX64 = re.compile(r"^[0-9a-f]{64}$")
MAX_SIGNED_BODY_BYTES = 3072


def canonical(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def require_hex(value: object, pattern: re.Pattern[str], name: str) -> str:
    if not isinstance(value, str) or not pattern.fullmatch(value):
        raise ValueError(f"{name} is not an immutable digest")
    return value


def build_candidate(evidence_path: Path) -> dict:
    raw = evidence_path.read_bytes()
    evidence = json.loads(raw)
    reproduction = evidence.get("reproduction") or {}
    lineage = evidence.get("lineage") or {}
    bank = evidence.get("bank") or {}
    runtime = evidence.get("runtime") or {}
    if evidence.get("state") != "REPRODUCED" or reproduction.get("exact_match") is not True:
        raise ValueError("evidence is not an exact REPRODUCED run")
    if int(evidence.get("n") or 0) < 30:
        raise ValueError("n<30 cannot enter measurement-card admission")

    model_revision = require_hex(lineage.get("hub_revision"), HEX40, "model_revision")
    bank_revision = require_hex(bank.get("hub_revision"), HEX40, "bank_revision")
    lineage_id = require_hex(evidence.get("lineage_id"), HEX64, "lineage_id")
    weight_manifest = require_hex(lineage.get("weight_manifest_sha256"), HEX64, "weight_manifest_sha256")
    tokenizer_manifest = require_hex(lineage.get("tokenizer_manifest_sha256"), HEX64, "tokenizer_manifest_sha256")
    bank_file_sha = require_hex(bank.get("file_sha256"), HEX64, "bank_file_sha256")
    responses_sha = require_hex(evidence.get("responses_sha256"), HEX64, "responses_sha256")

    body = {
        "kind": "gspc.measurement-card",
        "issuer": "CSOAI Ltd (UK 16939677)",
        "brand": "Council of AI",
        "axis": f"gspc-{evidence['axis']}",
        "model": lineage["hub_model"],
        "model_revision": model_revision,
        "lineage_id": lineage_id,
        "weight_manifest_sha256": weight_manifest,
        "tokenizer_manifest_sha256": tokenizer_manifest,
        "bank": bank["hub_dataset"],
        "bank_revision": bank_revision,
        "bank_file": bank["file"],
        "bank_file_sha256": bank_file_sha,
        "bank_id": require_hex(evidence.get("bank_id"), HEX64, "bank_id"),
        "n": int(evidence["n"]),
        "hits": int(evidence["hits"]),
        "accuracy": float(evidence["accuracy"]),
        "responses_sha256": responses_sha,
        "evidence_sha256": hashlib.sha256(raw).hexdigest(),
        "measured_at": evidence["measured_at"],
        "runtime": {
            "gpu": runtime.get("gpu"),
            "torch": runtime.get("torch"),
            "transformers": runtime.get("transformers"),
            "dtype": runtime.get("dtype"),
        },
        "admission_state": "REPRODUCED",
        "reproduction_exact": True,
        "reproduction_kind": reproduction.get("kind"),
        "independent_provider": reproduction.get("independent_provider") is True,
        "status": "CANDIDATE",
        "public_framing": "Measurement, not certification. One pinned lineage, one frozen axis, n=30.",
        "verify": "https://councilof.ai/gspc-verify",
    }
    if len(canonical(body)) > MAX_SIGNED_BODY_BYTES:
        raise ValueError("candidate body exceeds 3KB signing cap")
    return {
        "schema": "csoai.measurement-card-candidate/1",
        "body": body,
        "signature": None,
        "did_intended": "did:web:csoai.org#card-attestation-1",
        "writes_board": False,
        "not_a_certificate": True,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("evidence", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    candidate = build_candidate(args.evidence)
    output = args.output or (
        Path("public/interop/mill-cards-unsigned")
        / f"unsigned-{candidate['body']['axis']}-{candidate['body']['lineage_id'][:12]}.json"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(candidate, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "state": "CANDIDATE",
        "admission_state": "REPRODUCED",
        "lineage_id": candidate["body"]["lineage_id"],
        "output": str(output),
        "signed": False,
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
