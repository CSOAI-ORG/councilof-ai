# GSPC watchdog corpus — are we measuring all the public watchdogs and incident databases?

*2026-10-30. Produced by `harness/watchdogs/run_watchdogs.py` against
`harness/watchdogs/sources.json`. Every number below is read off bytes; nothing is typed.*

## The question, answered with a denominator

"Are we measuring all the public watchdogs and incident databases?" cannot be answered by
listing what we read. It needs a **denominator** — every source we have heard of — and a
**numerator** — the ones we actually read.

- **Denominator:** the corpus, `harness/watchdogs/sources.json`, 13 sources, each with the feed
  we would read, the field we would count, and why it matters. It is frozen: no timestamps, so
  its digest is a claim about the corpus rather than the moment it was read.
  sha256 `7ae0c77120da03e6e3ad2b7d…`
- **Numerator:** one read of each source, graded from the HTTP answer and the shape of the
  bytes. **No model judges another model**, and no judgement call is smuggled in as a grade.

## The coverage matrix

**10 of 13 sources ingested, 419,034 records counted.**

| source | kind | grade | records | the source's own date |
|---|---|---|---:|---|
| `cisa-kev` | known-exploited | **INGESTED** | 1,764 | 2026-10-29 |
| `cisa-advisories` | advisory-feed | **INGESTED** | 30 | 2026-10-29 |
| `nvd-api` | vuln-advisory | **INGESTED** | 416,951 | — |
| `osv-query` | vuln-advisory | **INGESTED** | 43 | 2026-09-10 |
| `github-advisory` | vuln-advisory | **INGESTED** | 100 | 2026-10-29 |
| `cve-services` | vuln-advisory | **INGESTED** | 1 | 2021-12-10 |
| `deps-dev` | dependency-fact | **INGESTED** | 1 | 2018-04-09 |
| `huggingface` | registry | **INGESTED** | 100 | 2026-10-29 |
| `scorecard` | supply-chain | **INGESTED** | 3 | 2026-10-19 |
| `owasp-llm-top10` | standard | **INGESTED** | 1 | — |
| `haveibeenpwned` | breach | **CREDENTIAL_REQUIRED** | — | 401 |
| `nvd-bulk` | vuln-advisory | **NO_SUCH_SOURCE** | — | 404 |
| `owasp-agentic` | standard | **NO_SUCH_SOURCE** | — | 404 |

Grades: `INGESTED` 10 · `REACHABLE_UNSHAPED` 0 · `CREDENTIAL_REQUIRED` 1 · `NO_SUCH_SOURCE` 2 ·
`UNREACHABLE` 0.

## The answer: no, and the gaps are now published

Before this corpus existed, the estate could say it read GitHub Advisories and Have I Been
Pwned. It could not say what it did **not** read, because the denominator did not exist. Now it
can, and the three gaps are specific:

1. **`haveibeenpwned` — 401, credential required.** The one public breach database wants an API
   key we do not hold. That is a measurement, not an excuse: the absence of breach signal is
   a real gap in the estate's coverage, and it is closed by a key, not by a code change.
2. **`nvd-bulk` — 404.** The NVD bulk CVE feed is not at the path this corpus declared. A full
   ingest would need the correct year-qualified feed URLs; the API works and carries the same
   record set, so this is a throughput gap rather than a coverage gap.
3. **`owasp-agentic` — 404.** The estate still links the OWASP agentic Top 10 in two places and
   **that link is stale**. A gap that is declared is a gap that is visible; this one was an
   invisible stale link until the corpus read it.

## What the corpus found about US, in the first run

The grade caught two mistakes of ours before it could publish them, which is the point of
grading from bytes:

- The CISA KEV entry declared its array as `catalog`. It is `vulnerabilities`. The grade
  reported `REACHABLE_UNSHAPED` — a working source, read wrongly — and the fix was a corpus
  correction, not a silent regrade.
- The CISA advisory feed is RSS, not JSON. Reading it as JSON reported a working feed as
  unshaped until the runner learned XML.

Neither would have been visible in a list of "sources we read".

## Absence is not zero

A source that did not answer leaves the denominator. It is never counted as zero records and
never counted as an empty result: an unread source is an unread source. The `records` field is
`null` for every source that did not answer, and the record count sums only the rows that
answered.

## What this is not

- **Not a certification, a score or a rank.** A source that answered is REACHED, not trusted.
  A source that answered with 416,951 CVEs is not thereby a good source.
- **Not a claim of completeness.** The corpus is the denominator *we know about*. A source
  neither of us has heard of is not in it, and the corpus is a published list precisely so
  that anyone can add to it.
- **Not a board cell.** This is an instrument and a measurement, not an axis. Registering it as
  one is the next decision, and it is the owner's: an axis that counts "how many public
  watchdogs do we read" is a governance measurement about the estate, not a model-comparison
  axis, and it does not belong beside `governance` or `safety` on a model's row.

## Where it goes next

This corpus is the watchdog half of the daily signal index: the consolidation the owner asked
for is GSPC's own signals (33 axes, the signed card corpus, the root) **plus** this corpus's
per-source rows — each with a content digest, a date, and a grade. That index is what the
Charter venue publishes, and what SAFE/LFX/ISAB read. The chain from here:

1. this corpus → per-source rows in the mill's per-item format, so the watchdog signal joins the
   GSPC fact table and the daily index rather than sitting beside it;
2. the daily index → the Constitutional Harness Charter artefact, which is the venue the owner
   ruled on;
3. the charter → the human gate: the axis-specialists registry's `human_gate` (HOLD, and
   `approval_may_be_inferred: false`) plus the corrections ledger, so a human decides and the
   decision is recorded rather than inferred.

Step 1 and 2 are the next two commits of this lane. Step 3 is where the 33 axis specialists and
the MEOK staff join: they are the ones who read the index and decide, and the estate's own
rule is that their approval is never inferred from silence.

## Reproducing this

```
python3 harness/watchdogs/run_watchdogs.py --out public/interop/gspc-watchdog-corpus-2026-10-30.json
python3 -m pytest -q harness/watchdogs/test_run_watchdogs.py     # 8 passed
```

The run reads the network and the corpus does not. Two runs of the corpus read at different
moments may count different records; the corpus digest does not move.
