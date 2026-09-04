# Witness-receipt placeholder incident — 2026-09-04

The retired `harvest-witness-receipts.py` fetched a fixed list of JSON URLs and
labelled each response `VERIFIED` without verifying a Rekor inclusion proof or
parsing and binding an OpenTimestamps proof to exact artifact bytes. When a
response had no digest field, the producer substituted the literal value `?`.

All 48 queue files are retained byte-for-byte in `queue/`. Every one of their
384 records carries `measurement.status = VERIFIED` with `digest = "?"`. They
are incident evidence only: they are not admissible witness receipts,
measurements, signatures, or anchors and must not be republished.

The producer now exits 78 and writes nothing. It has also been removed from the
1000x and improvement operator paths. Any replacement must bind an exact
64-hex artifact digest to locally verified Rekor/OTS evidence and pass a
separate reviewed admission ceremony.
