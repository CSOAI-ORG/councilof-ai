#!/usr/bin/env python3
"""Retired learn-loop producer.

The former implementation generated demonstration interactions and presented
SHA-256-derived placeholders as Ed25519 signatures, OpenTimestamps proofs,
Rekor entries, EAS attestations, and 33/33 council votes. Those outputs are
incident evidence, not measurements or receipts.

This tombstone intentionally performs no reads, writes, signing, voting,
training, anchoring, or queue creation. A replacement may be introduced only
after it uses the canonical measurement-card signer, independently evaluated
votes, real external receipts, consented training intake, and the atom-root
admission ceremony.
"""

from __future__ import annotations

import json

QUARANTINED_GENERATOR = True
EXIT_UNAVAILABLE = 78


def main() -> int:
    print(
        json.dumps(
            {
                "schema": "csoai.learn-loop-producer/0.2",
                "status": "UNAVAILABLE_FAIL_CLOSED",
                "reason": "retired-placeholder-producer",
                "writes": 0,
                "signatures": 0,
                "votes": 0,
                "receipts": 0,
            },
            sort_keys=True,
        )
    )
    return EXIT_UNAVAILABLE


if __name__ == "__main__":
    raise SystemExit(main())
