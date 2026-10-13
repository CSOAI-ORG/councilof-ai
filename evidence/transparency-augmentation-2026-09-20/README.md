# Transparency-augmentation experiment — Sigstore + OpenTimestamps — 2026-09-20

Reversible experiment on **non-secret test artifacts**: can existing CSOAI artifacts
gain independently checkable publication evidence from Sigstore and OpenTimestamps,
without replacing the estate Ed25519 signatures and without overstating timestamp
guarantees? Answer: yes, with gates — see `RECOMMENDATION.md`. Layer-by-layer
evidence boundaries: `THREAT-BOUNDARY.md`. Measurement, never certification.

## Layout

```
fixtures/
  card-00a52180-measurement-card.json   copy of public/signed/cards/00a52180…3c9.json (844 B)
  rekor-log-pubkey.pem                  Rekor production log key (fetched, transcripted)
  fixture-ed25519-baseline.txt          fixture re-verified against pinned estate key: VALID
sigstore/
  rekor-selftest.txt                    scripts/rekor_inclusion_verify.py --selftest (pass)
  rekor-pubkey-fetch.txt                log pubkey fetch transcript
  rekor-entry-verify-offline.txt        offline verify of committed entry: 4/4 VALID;
                                        --verify-root INVALID (entry covers preimage, F1)
  rekor-live-readback.txt               sidecar logIndex cross-checked against live API
  rekor-proof-index-investigation.txt   committed file vs live entry diff
  rekor-leaf-analysis.txt               leaf hashes; uuid tail == leaf sha256
  rekor-canonicalization-test.txt       virtual index ≠ proof index (F2), decisive test
  keyless-blocker.txt                   no ambient OIDC; personal-OAuth declined; UNCHECKABLE
ots/
  card-00a52180-measurement-card.json.ots       detached proof, PENDING (3 calendars)
  ots-stamp-batch-2026-09-17.json               batch sidecar (as_of 2026-09-20; F4 name quirk)
  ots-stamp-fixture.txt / ots-verify-pending.txt
  ots-verify-confirmed-root.txt         production proof: digest binding OK; `ots verify`
                                        needs a Bitcoin node (F3)
  ots-blockheader-readback.txt          block 967093 header byte-identical to sidecar
.venv/                                isolated tooling (opentimestamps-client 0.7.2, sigstore 4.5.0)
```

## Rerun (another operator, from repo root)

```bash
B=evidence/transparency-augmentation-2026-09-20
uv venv $B/.venv -q && uv pip install -p $B/.venv/bin/python -q opentimestamps-client sigstore

# Sigstore / Rekor (offline from committed material)
python3 scripts/rekor_inclusion_verify.py --selftest
python3 scripts/rekor_inclusion_verify.py --offline \
  --entry-file public/interop/rekor-root-dedb49d0.json \
  --pubkey-file $B/fixtures/rekor-log-pubkey.pem --verify-root public/root.json
# expect: overall INVALID — the root_hash check fails BY DESIGN (F1); the four
# inclusion checks must be VALID. Read THREAT-BOUNDARY.md before interpreting.

# OTS pending (fixture created by this experiment)
$B/.venv/bin/ots info  $B/ots/card-00a52180-measurement-card.json.ots
$B/.venv/bin/ots verify -f $B/fixtures/card-00a52180-measurement-card.json \
     $B/ots/card-00a52180-measurement-card.json.ots   # expect "Pending confirmation" ×3

# OTS confirmed (production root)
$B/.venv/bin/ots info public/interop/root-dedb49d0.json.ots   # digest binding, offline
# ots verify additionally needs a local Bitcoin node (F3)

# Lifecycle completion (hours after stamping)
$B/.venv/bin/python scripts/ots-upgrade.py $B/ots/card-00a52180-measurement-card.json.ots

# Keyless bundle leg (UNCHECKABLE here): requires GHA OIDC — gate S1 in RECOMMENDATION.md
```

## Provenance of external fetches

All network reads are transcripted with UTC retrieval times: Rekor log pubkey and
entries (`rekor.sigstore.dev`), block header (`blockstream.info`). Calendar
submissions carried only the 32-byte sha256 of the non-secret fixture. No
credentials, keys, or personal data left this machine.
