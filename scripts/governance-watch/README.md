# Public-source governance watch

Read-only technical monitoring for Council of AI legal/contact surfaces and the official sources listed in `sources.json`. Observations are not legal approval, certification, membership decisions, signing authority, or email-delivery proof.

## Qualification and execution

Requires Python 3.9+ and curl. No third-party Python dependencies.

```sh
python3 -m unittest discover -s scripts/governance-watch -p 'test_*.py' -v
python3 scripts/governance-watch/governance_watch.py --out /approved/private/evidence-directory --summary
```

Use an explicitly approved private output directory. Never commit runs, source snapshots, notifications or internal review records. A successful execution without `--summary` is silent when there is no new finding. The program does not send messages: the existing review task consumes its evidence. This directory and its CI workflow install no scheduler.

## Evidence semantics

HTTPS GET follows redirects to a terminal response with TLS verification enabled. Missing or invalid content is retried. HTTP 403/429, transport failures and access challenges remain UNVERIFIED, not asserted origin outages. JSON, security.txt and selected document identities are validated beyond HTTP status. DID observations concern public key material, never key custody.

Normalized document content is compared alongside retained compressed source bytes and unsigned SHA-256 checksums. Normalizer revisions start a new comparison baseline rather than manufacturing source changes. Content changes enter a materiality-review queue, not an automatic legal-change declaration. Known notification identities and open review items persist; absence in a subsequent observation does not close an issue. Archive banners and join invitations are checked together, including banners outside main content.

Atomic writes and a process lock protect report state. No credentials, inbox access, complaint submission, DNS edits, legal-text changes, membership acceptance or automated governance decisions are performed. Source snapshots are private research evidence, not a permission to republish third-party material.

## Scope and authority

OSAIA/Linux Foundation membership is not endorsement, SAFE compact participation or project adoption. Cloudflare for Startups is a programme, not a partnership. OIN and LOT coverage must be interpreted under their respective agreements; neither provides blanket patent immunity. A compliance mapping is not compliance certification.

The source list is not a claim that every controlling agreement is public or that all material changes are detected. Signed/private agreements and legal decisions remain with the authorized legal/governance owners. Publishing this code does not amend Terms, Privacy, Disclaimers, licences, memberships or commitments. The qualification suite is offline and does not contact monitored services.

## Runtime status and interrupted evidence commits

Version 0.2.1 performs small write/fsync probes in the normal system temporary directory and selected private evidence directory before collecting sources. It removes only its own disposable probes. It does not clean storage, change TMPDIR, relocate the monitor, change permissions or retry on another host.

Exit 0 means the collection/report path completed; individual source results may still be UNVERIFIED. Exit 3 reports INCOMPLETE for local I/O or invalid configuration/evidence. Exit 4 reports SKIPPED_BUSY when another process holds the collector lock. Failure notices are JSON on stderr with fresh_report_accepted=false and origin_outage_established=false. They omit exception messages to avoid exposing private paths. Capture exit status and both output streams; silence alone is not successful monitoring. A tool timeout is an unknown execution outcome, not permission to start a duplicate.

The immutable report and checksum are written first, notifications.json next, and latest.json last. A notification-write failure cannot advance latest.json. A failure between the final two writes leaves a detectable mismatch; the next run stops for owner-controlled reconciliation instead of resetting history or silently suppressing alerts. The pair is not a multi-file atomic transaction. No automated evidence repair is provided.

Retained latest.json remains historical after a failed run. Compare its timestamp with the actual invocation and require an observed successful result before claiming recovery. Repository release does not update an installed collector, authorize new pins, or prove current source collection. Use the existing deployment and monitoring owners; do not create another scheduler.
