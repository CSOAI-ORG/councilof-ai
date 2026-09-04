# Public proof incident archive — 2026-09-04

These files were removed from the served `public/` tree and remain in Git as
incident evidence. Their exact bytes are preserved except for the former Layer
0 manifest, whose internal infrastructure hostname was intentionally replaced
in the incident copy. The manifest pins both the stored redacted bytes and the
pre-redaction SHA-256 digest. A semantic projection digest confirms that all
other historical JSON content is unchanged after excluding the hostname field
and the two added quarantine/redaction notices; the confidential value is not
reproduced here.

- Two atom roots included quarantined COSE/XRPL queue leaves. Their adjacent
  `.ots` files also commit different digests than the root files beside them.
- Twenty-five files named `.ots` are plain-text `OTS PENDING` markers, not
  OpenTimestamps detached proofs.
- One historical root proof had no locally recoverable target or immutable
  witness-sidecar binding. Its metadata and proof are preserved together.
- The former live Layer 0 manifest called 335 cards anchored while listing only
  pending OTS receipts and planned Rekor/EAS work. The public path is now a
  discovery pointer to the exact-byte root witness. Its incident copy retains
  those invalid historical claims but declares the hostname replacement, the
  two notice additions, and its pre-redaction digest.

None of these files is a valid public proof. A pending, parseable OTS stamp is
still not a Bitcoin anchor. The authorised `public-root` GitHub Actions workflow
must create the next signed root and exact-byte witness set.

See `manifest.json` for the original served paths, stored SHA-256 digests, and
the explicit redaction provenance.
