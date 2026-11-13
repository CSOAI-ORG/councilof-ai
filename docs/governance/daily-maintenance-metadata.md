# Bounded maintenance metadata in the existing daily product

Status: source candidate, 7 November 2026. This is an unsigned derived view of already-public committed metadata. It is not a new evidence-event schema, decision ledger, scheduler, source monitor, measurement, legal assessment or permission to act.

## Existing producer and store

The existing `scripts/build-daily-signal.mjs` reads the regulatory clock, benchmark card matrix, claim-maintenance register and reviewed mapping inputs. This change adds an optional `maintenance_metadata` field to **future** `csoai.daily-signal/0.1` source reports in `public/reports/daily-signal/`. The existing `scripts/build-daily-product.mjs` renders it into the same archive index, HTML and Markdown. Historical dated JSON is retained unchanged; reports without the field show metadata unavailable.

The scheduled `.github/workflows/reg-watch.yml` daily-evidence-product job remains the only report publication schedule (06:45 UTC). The new offline tests run in that job and the existing required test registry. Outputs still use the existing report path allowlist and normal branch/PR release. No extra output directory, cron, event ledger or authority path is added. A previously generated same-day source report cannot be silently rewritten to add this field: the existing immutable-report check holds it for a reviewed correction or a later report day.

## Two public sources, limited fields

Only the exact source paths already read by the daily builder qualify:

- `public/signed/card-matrix.json`: known counts, bounded benchmark-axis identifiers/counts and the source's declared last measurement dates. These are benchmark corpus axes, **not** governance-board axes. No accuracy ranking, model name, raw answer or card body is copied.
- `public/spec/claim-maintenance/register.json`: known aggregate counts/state totals, declared register time, most recent declared subject read and scheduled-read time. No subject name, claim text, source URL, private outcome row or identity is copied. The register does not supply a last measurement time; that field remains null.

For these source reads, the builder opens only regular, non-symlink files using nonblocking/no-follow flags and a bounded four-MiB buffer, including a sentinel for files that grow while being read. Oversized or unsafe inputs fail the build rather than creating a misleading report. Unsupported schemas or paths produce unavailable metadata; no substitute source is selected. Projection rows have bounded counts and array lengths, strict field allowlists and safe date parsing. Invalid retained projections are unavailable.

## Three different comparisons

Each source retains its original byte SHA-256 and a digest of its parsed JSON content. The selected metadata projection has a separate digest:

1. Same bytes and same selected metadata: `UNCHANGED`, with no new review candidate.
2. Changed bytes but unchanged parsed content: `BYTES_CHANGED_METADATA_UNCHANGED` (for example whitespace or object-key order). No source-content change is inferred.
3. Changed parsed content with unchanged selected metadata: `SOURCE_CONTENT_CHANGED_METADATA_UNCHANGED`, with a source-scope review candidate. A change outside selected metadata is not hidden or called harmless.
4. Changed selected metadata or source availability: `METADATA_CHANGED`, with a pending source-review candidate.

Candidate identities bind the role and previous/current content and metadata digests, rather than the daily report date. Repeating the same snapshot therefore does not create another candidate. These are unsigned review plans. They do not authenticate a source, invalidate a canonical record, send a referral, grant rights, run a tool or establish that a legal/factual claim changed. Domain-specific dependency admission remains separate.

Source rights stay `UNKNOWN`; issuer verification and measurement freshness remain unassessed. Declared source dates are qualified against the containing report day, including per-axis dates; future dates are labelled `FUTURE_SOURCE_DECLARATION`. Moving the report date cannot silently refresh a measurement. The date-consistency qualification is outside the semantic digest so ordinary daily passage does not manufacture a source change.

## Relationship to existing maintenance

`packages/evidence-fabric/maintain.py` and `ops/maintain-cron.sh` already implement separate day-7/day-30/day-90 signed-batch re-reads, with private signing and storage. `scripts/claims/maintenance_due.py` owns the existing claim scheduler. This report change invokes neither runner and copies no private batch or outcome source. Where the public register reports scheduled-read outcomes, the report carries their aggregate metadata only and retains their unsigned/publisher-reported limit.

## Validation and adoption

Run:

```sh
node --test scripts/daily-maintenance-metadata.node-test.mjs scripts/build-daily-signal.node-test.mjs scripts/build-daily-product.node-test.mjs
```

The suite covers the three actual retained 4–6 November source reports, unchanged-history preservation, default-source byte bindings and declared old dates, changed selected metadata, changed unprojected content, byte-only changes, repeated no-change, malformed/rehashed authority and date mutations, future dates, oversized sources and links. No network, model, signer, private runtime or payment is used.

Before publication, use the repository's protected checks and normal deployment. Then inspect one newly generated source report and its rendered product, check all source/digest/date links, and demonstrate an independent reader recovering the same bounded comparison. Passing local source tests does not establish scheduler health or production adoption.
