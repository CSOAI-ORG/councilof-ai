#!/usr/bin/env python3
"""Re-read the frozen claim baseline with the baseline reader's capture semantics.

The baseline reader (discovery_grid.py) captured at most 3,000,000 response bytes.
This reader uses the same limit and user agent. Its negative control passes a
modified observation through the exact classifier used for the real records.
Measurement only: a byte delta is not a truth, materiality or compliance verdict.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA = Path(__file__).resolve().parent
BASELINE_PATH = DATA / "claim-maintenance-baseline.json"
OUTPUT_PATH = DATA / "claim-maintenance-wave-2.json"
SUPERSEDED_PATH = DATA / "claim-maintenance-wave-1.json"
CAPTURE_LIMIT_BYTES = 3_000_000
ERROR_CAPTURE_LIMIT_BYTES = 200_000
EXPECTED_BASELINE_SHA256 = "f7a7feb2f30194880e545546bfb3405015970b66d7d25d4d8f791e85fafa9e6e"
EXPECTED_BASELINE_READER_SHA256 = "6baad383eb97b0984ce23adbc11668074ae77410d72690029376da61b75bd6ea"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
)

EXTRA_SUBJECTS = [
    {"axis": "lab-practice", "subject": "DeepSeek-R1 Repository", "url": "https://github.com/deepseek-ai/DeepSeek-R1"},
    {"axis": "lab-practice", "subject": "Alibaba Qwen2.5 Repository", "url": "https://github.com/QwenLM/Qwen2.5"},
    {"axis": "lab-practice", "subject": "Zhipu AI GLM-4 Repository", "url": "https://github.com/THUDM/GLM-4"},
    {"axis": "lab-practice", "subject": "Moonshot Kimi-k1.5 Repository", "url": "https://github.com/MoonshotAI/Kimi-k1.5"},
    {"axis": "lab-practice", "subject": "MiniMax-01 Repository", "url": "https://github.com/MiniMax-AI/MiniMax-01"},
    {"axis": "lab-practice", "subject": "Shanghai AI Lab OpenCompass", "url": "https://github.com/open-compass/opencompass"},
    {"axis": "lab-practice", "subject": "BAAI FlagEmbedding", "url": "https://github.com/FlagOpen/FlagEmbedding"},
    {"axis": "lab-practice", "subject": "NVIDIA NeMo Guardrails", "url": "https://github.com/NVIDIA/NeMo-Guardrails"},
    {"axis": "lab-practice", "subject": "OSAIA SAFE Spec", "url": "https://github.com/osaia/safe-spec"},
    {"axis": "regulator-transparency", "subject": "EU AI Office GPAI", "url": "https://digital-strategy.ec.europa.eu/en/policies/ai-office"},
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fetch(url: str, timeout: float = 15.0) -> dict[str, Any]:
    started = time.time()
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read(CAPTURE_LIMIT_BYTES)
            return {
                "status": response.status,
                "final_url": response.geturl(),
                "bytes": len(body),
                "sha256": hashlib.sha256(body).hexdigest() if body else None,
                "error": "",
                "latency_ms": round((time.time() - started) * 1000, 1),
            }
    except urllib.error.HTTPError as exc:
        body = exc.read(ERROR_CAPTURE_LIMIT_BYTES) if exc.fp else b""
        return {
            "status": exc.code,
            "final_url": url,
            "bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest() if body else None,
            "error": "http_error",
            "latency_ms": round((time.time() - started) * 1000, 1),
        }
    except Exception as exc:
        return {
            "status": 0,
            "final_url": url,
            "bytes": 0,
            "sha256": None,
            "error": type(exc).__name__,
            "latency_ms": round((time.time() - started) * 1000, 1),
        }


def classify_claim(baseline_sha256: str | None, http_status: int, observed_sha256: str | None) -> str:
    """The one outcome classifier used by real records and the negative control."""
    if http_status in (404, 410):
        return "withdrawn"
    if http_status != 200:
        return "unreachable"
    if baseline_sha256 is None:
        return "baseline_captured"
    if baseline_sha256 == observed_sha256:
        return "unchanged"
    return "changed"


def reread(item: dict[str, Any]) -> dict[str, Any]:
    observed_at = datetime.now(timezone.utc).isoformat()
    result = fetch(item["url"])
    baseline_sha256 = item.get("sha256")
    outcome = classify_claim(baseline_sha256, result["status"], result["sha256"])
    review_required = outcome in ("changed", "withdrawn")
    return {
        "axis": item.get("axis", "claim-maintenance"),
        "subject": item.get("subject"),
        "url": item["url"],
        "baseline_sha256": baseline_sha256,
        "baseline_bytes": item.get("bytes"),
        "baseline_capture_limit_bytes": CAPTURE_LIMIT_BYTES if baseline_sha256 else None,
        "observed_sha256": result["sha256"],
        "observed_bytes": result["bytes"],
        "observed_capture_limit_bytes": CAPTURE_LIMIT_BYTES,
        "observed_at": observed_at,
        "http_status": result["status"],
        "final_url": result["final_url"],
        "latency_ms": result["latency_ms"],
        "error": result["error"],
        "outcome": outcome,
        "human_adjudication_required": review_required,
        "human_adjudication_state": "PENDING_HUMAN_REVIEW" if review_required else "NOT_REQUIRED_UNCHANGED",
    }


def main() -> int:
    baseline_bytes = BASELINE_PATH.read_bytes()
    baseline_digest = hashlib.sha256(baseline_bytes).hexdigest()
    if baseline_digest != EXPECTED_BASELINE_SHA256:
        raise ValueError("frozen baseline digest changed")
    baseline = json.loads(baseline_bytes)
    if baseline.get("reader_sha256") != EXPECTED_BASELINE_READER_SHA256:
        raise ValueError("baseline reader identity changed")

    subjects = list(baseline["subjects"])
    seen_urls = {row["url"] for row in subjects}
    for extra in EXTRA_SUBJECTS:
        if extra["url"] not in seen_urls:
            subjects.append({**extra, "sha256": None, "bytes": None, "status": None})
            seen_urls.add(extra["url"])

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        records = list(pool.map(reread, subjects))

    first_valid = next(
        row for row in records
        if row["baseline_sha256"] and row["observed_sha256"] and row["http_status"] == 200
    )
    original = first_valid["observed_sha256"]
    tampered = ("0" if original[0] != "0" else "f") + original[1:]
    tampered_outcome = classify_claim(first_valid["baseline_sha256"], 200, tampered)
    got = "DIVERGENT" if tampered_outcome == "changed" else "CONSISTENT"

    counts = {
        "total_claims": len(records),
        "reachable": sum(row["http_status"] == 200 for row in records),
        "unchanged": sum(row["outcome"] == "unchanged" for row in records),
        "changed": sum(row["outcome"] == "changed" for row in records),
        "baseline_captured": sum(row["outcome"] == "baseline_captured" for row in records),
        "withdrawn": sum(row["outcome"] == "withdrawn" for row in records),
        "unreachable": sum(row["outcome"] == "unreachable" for row in records),
    }
    observed_at = datetime.now(timezone.utc).isoformat()
    document = {
        "schema": "csoai.claim-maintenance-wave/1.1",
        "axis": "claim-maintenance",
        "wave": 2,
        "baseline_file": BASELINE_PATH.name,
        "baseline_sha256": baseline_digest,
        "baseline_reader_sha256": EXPECTED_BASELINE_READER_SHA256,
        "baseline_capture_limit_bytes": CAPTURE_LIMIT_BYTES,
        "observed_capture_limit_bytes": CAPTURE_LIMIT_BYTES,
        "capture_semantics": "sha256 of the first 3,000,000 response bytes; same limit and user agent as the frozen baseline reader",
        "observed_at": observed_at,
        "authority_state": "measurement_only_not_a_certification",
        "n_subjects": len(records),
        "n_reachable": counts["reachable"],
        "meets_n30_gate": counts["reachable"] >= 30,
        "counts": counts,
        "supersedes": {
            "artifact": SUPERSEDED_PATH.name,
            "sha256": sha256(SUPERSEDED_PATH),
            "reason": "Wave 1 used a 400,000-byte re-read limit against a 3,000,000-byte baseline; its capture-mismatched comparisons are not admitted.",
        },
        "negative_control": {
            "kind": "one-claim-digest-flipped-through-production-comparator",
            "comparator": "classify_claim",
            "subject": first_valid["subject"],
            "url": first_valid["url"],
            "baseline_sha256": first_valid["baseline_sha256"],
            "original_sha256": original,
            "tampered_sha256": tampered,
            "tampered_outcome": tampered_outcome,
            "expected": "DIVERGENT",
            "got": got,
            "result": "DISCRIMINATING" if got == "DIVERGENT" else "NOT_DISCRIMINATING",
        },
        "records": records,
        "limitations": [
            "Only the first 3,000,000 response bytes are compared; a change outside that window is not observed.",
            "Dynamic HTML pages often embed per-request nonces or timestamps; a byte delta triggers human materiality adjudication and is never an automated compliance verdict.",
            "No third-party naming is published from a delta without human release approval.",
        ],
    }
    OUTPUT_PATH.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"artifact": str(OUTPUT_PATH), "observed_at": observed_at, "counts": counts, "negative_control": got}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
