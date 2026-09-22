# CSOAI capture and delivery threat model

Exact-byte integrity, publisher attribution, source truth, Bitcoin timestamping and paid delivery are separate states. No state substitutes for another.

Implemented: immutable snapshots, source-response hashes, stable identities, RFC 9162 shape, strict bounds/completeness checks, tamper controls, exact serialized proof leaves, complete/partial coverage, unreviewed change events, public revision-pinned releases, anonymous readback, stale/corrupt delivery rejection, pinned SSH identity, bounded requests/storage, no payment simulation passed off as revenue.

Capture roots now have detached Ed25519 signatures under a dedicated self-published capture key. This is not the board key and not independently verified corporate identity. Original root files retain their capture-time UNSIGNED label; detached signatures are subsequent evidence, not an edit to the original record.

Residual risks: a source can lie consistently; hashes alone do not prevent source substitution; no independent economic truth corroboration has been performed. As_of is publisher asserted; Bitcoin timestamping establishes prior existence, not the true observation time. Pending receipts remain pending. Snapshot roots do not establish append-only log consistency or rule out different roots shown to different people.

Partial windows and request errors cannot establish deletion. Daily collection misses transient edits. A separate 100-subject watchlist is revisited on a bounded schedule. Price/supply/TVL thresholds generate review candidates, not findings or risk scores.

Production has population endpoints absent from remote master. Reconciliation is required before deployment; otherwise established live functionality could disappear. A population integration patch is supplied rather than overwriting current production.

Payment verification requires settlement evidence, network/token/amount/recipient checks, and binding to the delivered artifact. Wallet address alone does not prove that a payer is independent. The buyer verifier reports CONTENT_VERIFIED_NOT_PAYMENT_VERIFIED.

Minute-resolution dispatch is not whole-internet recrawling. Idle ticks make no external requests. No wall, access control, robots exclusion, rate limit or paid service is bypassed. New adapters require an identified source, allowed use, bounded cadence, stable IDs and schema tests before activation.

References: RFC 9162 sections 2.1.1 and 2.1.3.2; RFC 9309; OpenTimestamps client and protocol documentation.
