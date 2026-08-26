# Mine Harness — councilof.ai estate measurement CI

Lives in the monorepo per owner directive 2026-08-23 ("get all work onto mono repo
harness and volumes — we work from there, not the MacBook"). Canonical copies also
mirror to the RunPod RAG volume (`/workspace/RAG/mac-migrate/mine-harness`) every
15 min via `com.meok.mac-work-mirror`.

## Contents

- `test_mine.py` — 23 mine checks (ingest, signatures, honesty, hygiene, replication,
  canon coverage). On this machine the run is **22 passed · 0 failed · 1 unmeasurable**:
  the INTERNAL-ONLY mapping check needs `csoai-static-deploy2/SOVOS/c2pa-catapult/
  gspc-c2pa-mapping.json`, which is not present, so it is skipped and counted as
  unmeasurable — never as a pass. The suite used to crash there, so T6 and T7 never ran.
- `e2e_test.py` — 18-surface live scoreboard (councilof.ai + csoai.org + HF/zenodo/openalex).
- `mine_ci.sh` — CI wrapper. Every number in its banner is read from the run that just
  happened; it previously printed a hardcoded "tests 23/23 · coverage 14/14" regardless
  of outcome. A count it cannot read prints as `unknown` and fails the gate.
- `tsr_status.py` — parses an RFC 3161 TimeStampResp and reports what it actually says.
  `--anchor <file>` audits a `kernel-anchor.json` and exits non-zero if the recorded
  status is not the status the bytes carry.
- `cards/` — 335 signed measurement cards + MANIFEST. `cards/kernel-anchor.json` records
  `tsa.status: "err"`: the 50-byte freetsa.org response is an ASN.1 rejection
  (PKIStatus 2, badDataFormat), not a timestamp token. **There is no external timestamp
  anchor.** Do not present one.
- `auto_sweep.py`, `carder.py` — mining/card pipeline tools. `auto_sweep.py --selftest`
  proves its recency filter fires; it previously admitted every model.

## Run

```bash
python3 test_mine.py          # 22 passed · 0 failed · 1 unmeasurable on this machine
python3 e2e_test.py           # 18/18 when canonical build is live
bash mine_ci.sh               # combined; counts derived from the run
python3 auto_sweep.py --selftest
python3 tsr_status.py --selftest
python3 tsr_status.py --anchor cards/kernel-anchor.json
```

## Doctrine

- Measurement, not certification.
- `unmeasured`, `unverifiable` and `err` are first-class published statuses. Prefer any
  of them to a fabricated success, and never let a count or a status be decided by
  anything other than the run it describes.
- Guards against live (councilof.ai) will FAIL during the lane's direct-deploy
  clobber window; re-verify against the canonical deployment URL.
