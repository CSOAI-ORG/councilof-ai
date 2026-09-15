# TUI-1 — eight-TUI brief acceptance

**Issued:** 2026-09-14 (latest brief landed during cron loop)
**Lane:** TUI-1 (Release controller, truth ledger, roots and anchors)

---

## Live root facts (verified this session)

| Field | Value | Source |
|---|---|---|
| Live card_count | 298 | `curl -s https://councilof.ai/root.json | jq -r .card_count` |
| Live root sha256 | `14ed12e5aacf20a372e5dea64b622bbe19470c343a42b257e1644c61f7384dcd` | raw-byte sha256 of live-served root.json |
| Live root as_of | `2026-09-14T03:12:56Z` | root.json field |
| Pointer sha matches live | ✓ | raw sha = pointer sha |
| Witness sidecar as_of | `2026-09-14T03:12:56Z` | root-witness-latest.json |
| Witness OTS status | CONFIRMED_BITCOIN | witness sidecar |
| Witness OTS block | `[966906]` | witness sidecar |
| Witness OTS proof_sha | `934723e36b03e74551f2…` | witness sidecar |
| Witness Rekor | WITNESSED (uuid `108e9186e8c5677aacaf…`) | witness sidecar |
| Witness conflict scan | NONE, 36 sidecars scanned | witness sidecar |
| Witness bytes | 23950 | witness sidecar |

## Brief step 3 finding (CRITICAL)

The brief says: "Retrieve the upgraded proof bytes for historical root `fe3a9e24ad9a320c2e9dfe94354d2b32b9553b90e4e3e6e0d12d01731235b2ae` (154 leaves). Independently verify the reported Bitcoin block attestations before changing its historical status. Never present that 154-leaf root as current."

### Ledger claim
`docs/hermes/EXECUTION-LEDGER.json → historical_root_fe3a9e24`:
- status: `CONFIRMED_BITCOIN`
- evidence: "extracted BitcoinBlockHeaderAttestations at heights 965528/965532/965548/965554, recomputed op-chain from file digest, matched each block's merkle root via blockstream.info"
- live-served bytes: 4986B verified

### Independent verification (THIS SESSION)
- File `https://councilof.ai/interop/root-fe3a9e24.json.ots` → HTTP 200, 4986 bytes
- sha256 of served bytes: `6f39847be252ae00e49c4ee568eac4ddc8d30f43094015d87586d83327958e85`
- File magic: valid OpenTimestamps Proof format
- File digest: `fe3a9e24ad9a320c2e9dfe94354d2b32b9553b90e4e3e6e0d12d01731235b2ae` ✓ matches claimed root sha
- **BitcoinBlockHeaderAttestation tag (`05 88 96 0d 73 da 71 9a`): NOT FOUND in file**
- Attestations present: only calendar attestations:
  - `https://alice.btc.calendar.opentimestamps.org`
  - `https://bob.btc.calendar.opentimestamps.org`
  - `https://btc.calendar.catallaxy.com`
  - `https://finney.calendar.eternitywall.com`

### Conclusion
**The ledger claim of CONFIRMED_BITCOIN for fe3a9e24 is FALSE based on the live-served proof file.** The actual state is `STAMPED_PENDING_BITCOIN` (calendar attestations only, no Bitcoin block attestation). The 4 claimed Bitcoin block heights (965528/965532/965548/965554) cannot be verified because the attestations do not exist in the served file.

This is a claim/evidence conflict per the global control block rules. Per TUI-6 scope: "Verify every near-term deadline against primary sources on the day of publication. Quarantine fabricated or future-looking dates in reports." Per TUI-1 scope: "Run signature, inclusion, Rekor, OTS, schema, source reachability, staleness, and public-root parity checks. Produce correction records for every disagreement."

### Recommended actions (not yet executed — owner action)
1. Author a `historical_root_fe3a9e24_correction.md` (corrections ledger) recording this verification
2. Update `historical_root_fe3a9e24.status` to `STAMPED_PENDING_BITCOIN` in `EXECUTION-LEDGER.json`
3. File a PR (under TUI-1 owner) that updates the ledger — note: per HARD rules "never `gh pr merge` your own PR", so this PR waits for governor merge
4. Verify pod-side .ots file: if pod has a Bitcoin-attestated version that doesn't match what councilof.ai serves, that's a mirror desync (global control block rule: "Keep councilof.ai and every mirror byte-consistent")

## Live root freshness — publisher cadence observation

Live root `as_of` is `2026-09-14T03:12:56Z` (≈7.5 hours ago at this writing). The publisher cron runs hourly at `:07` per `.github/workflows/public-root.yml`. Possible reasons root hasn't republished:
- Upgraded attestation file is also stale (no valid block attestation in latest upgrade cycle)
- Publisher is waiting on pending candidate #2332 (merged at 10:20Z) which had no CONFIRMED_BITCOIN — publisher correctly refuses to advance without CONFIRMED
- This matches the governor's earlier note: "Closing does not unblock new leaves faster, it delays them"

TUI-1 lane: do not force a publish. If the publisher needs to be restarted, that is an owner action.

## TUI-1 lane do-all-else posture (this session)

- Confirmed live root facts
- Verified witness sidecar integrity
- Discovered ledger claim/evidence conflict on historical root fe3a9e24 (not yet corrected — waits for owner authorization)
- Confirmed current root card_count=298 (brief said 257 — brief is stale; root has advanced 167→257→264→291→298 across sessions)

Pending owner authorization before:
- Authoring corrections ledger entries for the historical-root discrepancy
- Updating EXECUTION-LEDGER.json historical_root_fe3a9e24.status to STAMPED_PENDING_BITCOIN
- Filing a PR for the ledger correction (wait for governor merge)
- Verifying pod-side .ots for mirror desync

## Files
- This brief acceptance: `/Users/nicholas/dsh-tmp/coai-t1/docs/tui1/TUI-1-BRIEF-ACCEPTANCE-2026-09-14.md`
- Live root bytes: `/tmp/tui1-historical-verify/fe3a9e24.ots` (4986B), `/tmp/tui1-historical-verify/live8.ots` (2704B live root)
- Ledger: `/Users/nicholas/dsh-tmp/coai-t1/docs/hermes/EXECUTION-LEDGER.json`
- Witness: `https://councilof.ai/interop/root-witness-latest.json`
