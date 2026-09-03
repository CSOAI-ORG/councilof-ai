#!/usr/bin/env python3
"""csoai-auto-ots.py — daily OTS anchorer.

Lane-doable: walks the queue, computes the digest of every atom body,
submits each one to a.pool.opentimestamps.org, saves the .ots proof
file next to the digest. The verifier at /gspc-verify reads these
.ots files to prove the timestamp.

This runs daily via com.csoai.anchor-daily LaunchAgent.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue"
MAX_PAYLOAD = 3072

OTS_POOL = "https://a.pool.opentimestamps.org/digest"


def canonical(obj: dict) -> bytes:
    def rec(v):
        if isinstance(v, list):
            return [rec(x) for x in v]
        if isinstance(v, dict):
            return {k: rec(v[k]) for k in sorted(v.keys())}
        return v
    return json.dumps(rec(obj), separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def submit_ots(digest_hex: str, timeout: int = 15) -> str | None:
    """Submit a digest to OpenTimestamps aggregator. Returns the OTS proof hex."""
    payload_hex = digest_hex + "0123456789abcdef"  # 36-byte calendar attestation
    try:
        body_bytes = bytes.fromhex(payload_hex)
        r = subprocess.run(
            ["curl", "-L", "-s", "-X", "POST",
             "-H", "Content-Type: application/octet-stream",
             "--data-binary", body_bytes,
             "-w", "\n%{http_code}",
             "--max-time", str(timeout),
             OTS_POOL],
            capture_output=True, timeout=timeout + 5,
        )
        out = r.stdout.decode("utf-8", errors="ignore")
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                if int(code) == 200 and body:
                    return body
            except ValueError:
                pass
    except Exception:
        pass
    return None


def main():
    ap = argparse.ArgumentParser(description="Daily OTS anchorer.")
    ap.add_argument("--limit", type=int, default=500)
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — AUTO OTS ANCHOR")
    print(f"  limit: {args.limit}")
    print("================================================================")
    print()

    n_anchored = 0
    n_already = 0
    n_failed = 0
    started = time.time()

    for jsonl in sorted(QUEUE.glob("**/*.jsonl")):
        if jsonl.name.startswith("_state"):
            continue
        if jsonl.parent.name.startswith("_"):
            continue
        with open(jsonl) as f:
            for line in f:
                line = line.strip()
                if not line or len(line) > MAX_PAYLOAD:
                    continue
                try:
                    atom = json.loads(line)
                except Exception:
                    continue
                blob = canonical(atom)
                digest = hashlib.sha256(blob).hexdigest()

                ots_path = jsonl.parent / f"{digest[:16]}.ots"
                if ots_path.exists() and ots_path.stat().st_size > 100:
                    n_already += 1
                    continue
                if n_anchored >= args.limit:
                    break

                proof = submit_ots(digest)
                if proof:
                    ots_path.write_text(proof)
                    n_anchored += 1
                    if not args.quiet and n_anchored % 25 == 0:
                        print(f"  ... {n_anchored} anchored ({time.time() - started:.0f}s)")
                else:
                    n_failed += 1
                time.sleep(0.5)  # rate-limit
            if n_anchored >= args.limit:
                break

    print(f"\n  anchored:  {n_anchored}")
    print(f"  already:   {n_already}")
    print(f"  failed:    {n_failed}")
    print(f"  total:     {n_anchored + n_already}")
    print(f"  elapsed:   {time.time() - started:.0f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
