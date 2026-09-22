---
license: cc-by-4.0
tags:
- opentimestamps
- bitcoin
- provenance
- attestation
---

# Trust-chain freshness

Two things in the Council of AI estate go out of date on their own, and this dataset is the
receipt that somebody keeps checking them.

## 1. OpenTimestamps proofs

An OpenTimestamps stamp is created instantly and carries only a *pending* calendar attestation.
Hours later the calendar's commitment lands in a Bitcoin block — but the published `.ots` file
only says so once the completed path is fetched back and the file rewritten. Nothing does that on
its own, so proofs sit reading "pending" long after they are attested, and the publisher looks
*weaker* than the evidence it holds.

`runs/run-<date>.jsonl` has one row per published proof: its state before the run, its state
after, and the Bitcoin block heights if it is attested.

- `before_state` / `after_state` — `PENDING`, `BITCOIN`, or `NOT_A_PROOF`
- `after_blocks` — Bitcoin block heights carried by the proof bytes
- `rewritten` — whether this run changed the file

`manifest/manifest-<date>.json` is the site's own manifest, rebuilt by its producer from the bytes
on disk rather than edited to agree with anything. `ots/` is an archive of the proof files
themselves.

**What "BITCOIN" means here, exactly:** the proof bytes carry a `BitcoinBlockHeaderAttestation`,
parsed by python-opentimestamps. It is not a check of that block header against a Bitcoin node —
`ots verify` with a node does that, separately. A pending proof is a submitted request, not
evidence of a time. Neither is called "anchored".

**Upgrading is additive.** It merges the completed path back onto the *same* commitment: the same
message digest, the same operations tree. No subject file and no signed payload is altered. A
proof whose calendar has not completed is not rewritten, and keeps saying pending.

## 2. The corrections ledger signature

`https://councilof.ai/api/corrections` publishes every claim this estate got wrong. Its own
Ed25519 signature is checked on every request against `did:web:csoai.org#board-attestation-1`, and
this loop re-derives that check independently from the served bytes.
`corrections-signature-<date>.json` is that result, including the case where it does not verify.

Measurement, not certification. `UNMEASURED` and `UNCHECKABLE` are first-class states and are
never printed as a pass.

Produced by `scripts/pod-loops/trust-chain.sh` in `CSOAI-ORG/councilof-ai`.
CC-BY-4.0 — Council of AI (CSOAI Ltd, UK Companies House 16939677).
