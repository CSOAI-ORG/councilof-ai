#!/usr/bin/env python3
"""Retired witness-receipt card harvester.

The former producer treated any JSON returned from a fixed URL list as a
verified witness binding. Missing digest fields became the literal value ``?``
while the resulting card still claimed ``measurement.status = VERIFIED``.
It did not verify Rekor inclusion, parse an OpenTimestamps proof, or bind either
witness to exact local bytes.

Historical outputs are preserved as non-admissible incident evidence under
``evidence/incidents/2026-09-04-witness-receipt-placeholders``. A replacement
must consume the reviewed root sidecar and prove exact Rekor/OTS bindings; until
then this entry point always fails closed and writes nothing.
"""
from __future__ import annotations

import sys


EXIT_UNAVAILABLE = 78


def main() -> int:
    print(
        "UNAVAILABLE_FAIL_CLOSED: witness receipt harvesting is retired; "
        "no verified Rekor/OTS binding producer is configured"
    )
    print("writes: 0; signatures: 0; receipts: 0")
    return EXIT_UNAVAILABLE


if __name__ == "__main__":
    raise SystemExit(main())
