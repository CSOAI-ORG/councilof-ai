# Public proof incident archive — 2026-09-04

These files were removed from the served `public/` tree without changing their
bytes. They remain in Git as incident evidence.

- Two atom roots included quarantined COSE/XRPL queue leaves. Their adjacent
  `.ots` files also commit different digests than the root files beside them.
- Twenty-five files named `.ots` are plain-text `OTS PENDING` markers, not
  OpenTimestamps detached proofs.
- One historical root proof had no locally recoverable target or immutable
  witness-sidecar binding. Its metadata and proof are preserved together.
- The former live Layer 0 manifest called 335 cards anchored while listing only
  pending OTS receipts and planned Rekor/EAS work. It is preserved here and the
  public path is now a discovery pointer to the exact-byte root witness.

None of these files is a valid public proof. A pending, parseable OTS stamp is
still not a Bitcoin anchor. The authorised `public-root` GitHub Actions workflow
must create the next signed root and exact-byte witness set.

See `manifest.json` for the original served paths and SHA-256 digests.
