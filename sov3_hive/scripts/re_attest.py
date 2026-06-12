"""
re_attest.py — re-run every chain entry through the 4 REAL hives.

The original 48 entries are attested with placeholder hives (no live backend
probes). This script takes each, runs it through the 4 real hives, and
emits a new "real-hive-anchored" attestation. The original stays in the
chain as provenance; the new one is the canonical version.
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

sys.path.insert(0, "/Users/nicholas/clawd")
from sov3_hive.core.federation import Federation, AttestationKind
from sov3_hive.core.real_hives import all_4_real_hives


REAL_HIVES = all_4_real_hives()
FEDERATION = Federation(
    log_path="/Users/nicholas/clawd/sov3-hive/data/csoai_attestations.jsonl",
    use_real_hives=True,
)
FEDERATION.hives = REAL_HIVES
from sov3_hive.core.horus import HorusHive
FEDERATION.horus = HorusHive(REAL_HIVES, secret=FEDERATION.secret)


def re_attest_one(orig: Dict[str, Any]) -> Dict[str, Any]:
    probes = {hid: hive.ping() for hid, hive in REAL_HIVES.items()}
    new_claim = dict(orig.get("claim", {}))
    new_claim["_re_attestation"] = {
        "original_id": orig.get("attestation_id"),
        "original_hash": orig.get("attestation_hash"),
        "original_subject": orig.get("subject"),
        "original_kind": orig.get("kind"),
        "re_attested_at": time.time(),
        "real_hive_probes": {
            hid: {"status": p.last_status,
                  "latency_ms": round(p.last_latency_ms, 1)}
            for hid, p in probes.items()
        },
    }
    new_a = FEDERATION.attest(
        kind=AttestationKind.ARCHITECTURE,
        subject=f"re-attested/{orig.get('subject', 'unknown')}",
        claim=new_claim,
        submitter="csoai-horus",
    )
    return {
        "original_id": orig.get("attestation_id"),
        "new_id": new_a.attestation_id,
        "original_hash": orig.get("attestation_hash"),
        "new_hash": new_a.attestation_hash,
        "horus_verdict": new_a.status,
        "horus_leader": new_a.meta_leader,
        "horus_confidence": new_a.meta_confidence,
        "real_hives_live": sum(1 for p in probes.values() if p.last_status == "ok"),
        "real_hives_total": len(probes),
    }


def main(log_path: str = "/Users/nicholas/clawd/sov3-hive/data/csoai_attestations.jsonl",
         out_path: str = "/Users/nicholas/clawd/sov3-hive/data/csoai_re_attested.jsonl",
         max_entries: int = 200) -> Dict[str, Any]:
    if os.path.exists(out_path):
        os.remove(out_path)

    original = []
    with open(log_path) as f:
        for line in f:
            if line.strip():
                original.append(json.loads(line))

    print(f"=== Re-attesting {len(original)} chain entries through 4 real hives ===")
    results: List[Dict[str, Any]] = []
    certified = degraded = failed = 0
    started = time.time()

    for i, orig in enumerate(original[:max_entries], 1):
        try:
            r = re_attest_one(orig)
            results.append(r)
            if r["horus_verdict"] == "certified":
                certified += 1
            else:
                degraded += 1
            with open(out_path, "a") as f:
                f.write(json.dumps(r) + "\n")
        except Exception as e:
            failed += 1
            results.append({"original_id": orig.get("attestation_id"),
                            "error": f"{type(e).__name__}: {e}"})

        if i % 10 == 0 or i == len(original):
            print(f"  [{i:3d}/{len(original)}] certified={certified} degraded={degraded} "
                  f"failed={failed} elapsed={time.time()-started:.1f}s")

    elapsed = time.time() - started
    return {
        "total_original": len(original),
        "re_attested": len(results),
        "certified": certified, "degraded": degraded, "failed": failed,
        "elapsed_seconds": round(elapsed, 2),
        "rate_per_second": round(len(results) / max(elapsed, 0.1), 2),
        "out_log": out_path,
    }


if __name__ == "__main__":
    summary = main()
    print("=" * 60)
    print("RE-ATTESTATION SUMMARY")
    print("=" * 60)
    for k, v in summary.items():
        print(f"  {k:20s} {v}")
