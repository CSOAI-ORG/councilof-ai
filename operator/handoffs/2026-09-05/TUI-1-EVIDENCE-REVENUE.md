# Goal mode — TUI 1: evidence and revenue rails

Paste everything below into TUI 1.

```text
GOAL MODE: EVIDENCE + REVENUE RAILS. Do not work on UI or N-site adapters.

Re-verify volatile facts before acting. The canonical starting snapshot is origin/master 2bf948504db36502825871c258741c25dbf7e5bc and successful deploy run 33934320792. Ignore stale instructions to merge #1235 or to unblock a 122-commit deployment backlog.

Objective: produce one provably correct evidence-to-payment path without invented identifiers, unsupported revenue claims, or bulk changes that lack a rollback manifest.

1. Build an exact-byte OTS inventory: subject path/hash, sidecar path/hash, parser state, calendar state, Bitcoin-attested state, and whether the proof covers the current bytes. Include orphaned atom roots and every text marker named .ots. Never collapse PENDING, ORPHANED, UNKNOWN, and BITCOIN_ATTESTED.
2. Revalidate live/root security invariants: did:web keys must resolve; self-embedded keys are UNCHECKABLE; proof card_count must be enforced; the Merkle algorithm must be reproducible; learn-loop must return null identifiers for unsubmitted OTS, Rekor, or EAS work.
3. Recheck x402 against current official/reference behaviour. Do not require a settlement unless proven. Verify v1/v2 negotiation, paymentPayload.resource, accepts[], and current Bazaar discovery behaviour.
4. Separate gspc-mcp 0.2.0 from gspc-card-verifier 1.0.0. Verify registry status, ownership, version, build, tests, and tarball independently. Stage publication only; stop for npm/2FA approval.
5. Audit the claimed 308-repository funding-link rollout using a complete manifest of owned repositories, commits, failures, and rollback points. Make no further bulk changes.
6. Classify GitHub Sponsors, x402, XRPL, Drips, RapidAPI, L402, and Hugging Face as VERIFY, READY, OWNER_GATED, or UNSUPPORTED—not assumed revenue.
7. For the stale corrections ledger, never update signature.id without producing and verifying matching Ed25519 signature bytes with the estate key.
8. Preserve separate denominators for the 841-host census, 16,135-resource census, and 240-resource sample. They measure different questions and must not be merged into one percentage.

Deliver:
- EVIDENCE-REVENUE-TRUTH-2026-09-05.md
- a machine-readable status inventory
- non-vacuous tests and exact test output
- exact changed-file list
- exact owner-gate list

Work only on an owned branch. Do not merge, deploy, publish, spend, use signing keys, enable schedules, or send an external message.
```
