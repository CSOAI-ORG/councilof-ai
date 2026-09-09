# Exact-card OTS maintenance

This is a local maintenance command, not a publisher or new root ceremony.
It consumes the reviewed `csoai.exact-card-ots-preparation/1` manifest, whose
SHA-256 must be retained independently. It never stamps missing proofs, signs
cards, submits payments, or claims Bitcoin verification from an attestation tag.

Requires the existing official `opentimestamps` Python library. No dependency
installation, schedule, or network call is performed by the default command.

## Offline check (safe default)

From the repository root:

```sh
python3 scripts/ots-upgrade.py \
  --manifest /path/to/reviewed-bundle/manifest.json \
  --manifest-sha256 "REPLACE_WITH_INDEPENDENTLY_RETAINED_SHA256" \
  --dry-run
```

All paths, exact card bytes, manifest bytes and detached proof digest bindings
are checked before any upgrade is possible. An absent proof stays `ABSENT`.
An invalid proof, symlink, traversal, changed card or manifest mismatch stops the
entire batch. `OFFLINE_DRY_RUN` makes no requests and writes no output directory.

## After publication, initial stamping and explicit operator review

The initial timestamp submission is separate. First compare deployed signed-card
bytes with the preparation manifest and obtain the original detached proofs.
Only then run:

```sh
python3 scripts/ots-upgrade.py \
  --manifest /path/to/reviewed-bundle/manifest.json \
  --manifest-sha256 "REPLACE_WITH_INDEPENDENTLY_RETAINED_SHA256" \
  --upgrade --max-requests 8 --timeout 10 \
  --output-dir /private/tmp/csoai-ots-upgrade-reviewed-run-001
```

The output directory must not exist. Use a new name for every run. Network work
is GET-only to four fixed HTTPS calendars (a.pool, b.pool, alice, bob); redirects
and unadmitted calendars are refused. Duplicate commitment requests are reused
across the batch; newly returned calendar URLs are not chased. Request count and
timeout are bounded. Originals are checked again before staging, closing a
source-change race. Source card and proof files are never overwritten.

Changed proofs are saved in `candidates/cards/`; exact prior bytes are retained
in `originals/cards/`. `report.json` binds both with SHA-256, paths, states and
issues. The pinned input manifest is copied unchanged. Unchanged/absent proofs
have no candidate path. A network failure keeps the pending state and is recorded;
exit zero means the maintenance report was produced, not that anchoring succeeded.

## What the states mean

- `ABSENT`: no detached proof exists; this command does not create one.
- `STAMPED_PENDING_BITCOIN`: the proof binds the file and carries a calendar
  attestation, not a verified Bitcoin timestamp.
- `BITCOIN_ATTESTATION_UNVERIFIED`: the proof carries a Bitcoin block attestation;
  this command has **not** validated it against the Bitcoin chain.
- `NO_KNOWN_ATTESTATION`: binding parses but no recognized timestamp attestation
  is present. Do not describe it as anchored.

`chain_verified` is always false here. Validate an accepted candidate with the
official `ots verify -f <original-card> <candidate.ots>` against a trusted
read-only Bitcoin node. Retain that independent verification result. Do not use
`--no-bitcoin` for a check that will be called chain-verified. No Bitcoin node is
provisioned by this command. Publication remains a separate reviewed action.

The old positional `scripts/ots-upgrade.py <proof>` interface is retained for
compatibility, including its legacy in-place behavior. This reviewed per-card
route must use `--manifest`; it does not call the legacy upgrader or `card_root.py`.

Offline regression tests:

```sh
python3 -m unittest discover -s scripts -p test_ots_maintenance.py -v
```

Tests use official synthetic operation graphs and mocked calendar responses.
Synthetic Bitcoin tags are deliberately unverified; no real chain claim is made.
