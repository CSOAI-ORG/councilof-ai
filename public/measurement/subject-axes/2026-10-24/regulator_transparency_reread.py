#!/usr/bin/env python3
"""Measure the declared regulator-transparency checks on the frozen candidate frame.

The superseded run reused lab-oriented checks. This reader observes guidance,
registry, methodology, consultation and contact text on each captured public page.
Presence is a dated fact, never a judgement about quality, truth or compliance.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import json
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA = Path(__file__).resolve().parent
SOURCE_PATH = DATA / "regulator-transparency.json"
OUTPUT_PATH = DATA / "regulator-transparency-v2.json"
CAPTURE_LIMIT_BYTES = 3_000_000
ERROR_CAPTURE_LIMIT_BYTES = 200_000
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
)
TERMS = {
    "guidance": r"guidance|guideline|code of practice|policy framework|regulatory framework",
    "registry": r"registr(?:y|ation|er)|database|directory|public list",
    "methodology": r"methodolog|assessment method|evaluation method|regulatory approach|our approach",
    "consultation": r"consultat|call for evidence|public comment|have your say|stakeholder engagement",
    "contact": r"contact|report a concern|whistleblow|complaint|enquir|feedback",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fetch(url: str, timeout: float = 15.0) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read(CAPTURE_LIMIT_BYTES)
            return response.status, response.geturl(), body, ""
    except urllib.error.HTTPError as exc:
        return exc.code, url, exc.read(ERROR_CAPTURE_LIMIT_BYTES) if exc.fp else b"", "http_error"
    except Exception as exc:
        return 0, url, b"", type(exc).__name__


def probe(item: dict[str, Any]) -> dict[str, Any]:
    started = time.time()
    status, final_url, body, error = fetch(item["url"])
    text = body.decode("utf-8", "ignore").lower()
    checks = {name: bool(re.search(pattern, text)) for name, pattern in TERMS.items()} if status == 200 else {name: False for name in TERMS}
    return {
        "subject": item["subject"],
        "url": item["url"],
        "final_url": final_url,
        "status": status,
        "error": error,
        "bytes": len(body),
        "sha256": hashlib.sha256(body).hexdigest() if body else "",
        "capture_limit_bytes": CAPTURE_LIMIT_BYTES,
        "latency_ms": round((time.time() - started) * 1000, 1),
        "checks": checks,
        "checks_present": sum(checks.values()),
    }


def main() -> int:
    source = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    candidates = [{"subject": row["subject"], "url": row["url"]} for row in source["rows"]]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        rows = list(pool.map(probe, candidates))
    reachable = [row for row in rows if row["status"] == 200 and not row["error"]]
    independent = {row["final_url"] for row in reachable}
    observed_at = datetime.now(timezone.utc).isoformat()
    document = {
        "schema": "csoai.subject-discovery/1.1",
        "axis": "regulator-transparency",
        "kind": "discovery-grid-v2",
        "method": "regulator-presence-v1 (sha-pinned reader; not a certification)",
        "observed_at": observed_at,
        "authority_state": "measurement_only_not_a_certification",
        "n_subjects": len(rows),
        "n_reachable": len(reachable),
        "n_independent": len(independent),
        "n_http_error": sum(row["error"] == "http_error" for row in rows),
        "n_valid_min": 30,
        "meets_n30_gate": len(independent) >= 30,
        "capture_limit_bytes": CAPTURE_LIMIT_BYTES,
        "presence_check_definitions": TERMS,
        "terms": list(TERMS),
        "rows": rows,
        "supersedes": {
            "artifact": SOURCE_PATH.name,
            "sha256": sha256(SOURCE_PATH),
            "reason": "The superseded run reused lab-oriented safety, evaluations, incidents and model-card checks instead of the declared regulator construct.",
        },
        "limitations": [
            "String presence in the first 3,000,000 response bytes is not evidence of quality, truth, compliance or regulatory performance.",
            "Independent n counts distinct landed URLs among reachable rows; unreachable pages are not failures or zero scores.",
            "A dated convenience frame, not a probability sample of all regulators.",
        ],
    }
    OUTPUT_PATH.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"artifact": str(OUTPUT_PATH), "observed_at": observed_at, "n_reachable": len(reachable), "n_independent": len(independent), "terms": list(TERMS)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
