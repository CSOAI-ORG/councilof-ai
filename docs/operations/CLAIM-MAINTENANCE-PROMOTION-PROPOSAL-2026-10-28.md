# Promotion proposal — `claim-maintenance` from DECLARED-UNMEASURED to MEASURED

*2026-10-28. The evidence is done and verified. What is left is one ruling.*

## The rule, and whether the slot meets it

The board's own Measure ruling of 2026-10-16 (`functions/api/_gspc_axes_d.ts`):

> *"Each is a DECLARED SLOT: kind 'declared-slot', status UNMEASURED, n 0 … An axis becomes
> MEASURED for its subject only with a frozen, sha-pinned method or bank, n_valid >= 30, passing
> the gate (queued in bank-next-version). Never a zero score: n 0 means nothing measured, and a
> declared slot joins no mean, no lid leader and no separation tally."*

| condition | state | evidence |
|---|---|---|
| A frozen, sha-pinned method | **MET** | Claim Maintenance spec v0.2, 2026-09-25, published at <https://councilof.ai/spec/claim-maintenance/v0.2/>, with its reference implementation pinned by sha256 in `public/spec/claim-maintenance/v0.2/reference/manifest.json` |
| n_valid ≥ 30 | **MET** | the wave re-read **182** captured claims and **174** were read (`n_valid = 174`) |
| A published, dated observation | **MET** | `public/interop/claim-maintenance-wave-2026-10-28.json`, with every register pinned by its own sha256 |
| The gate | **the owner's call** | see below |

## The wave

`scripts/measurements/claim-maintenance-wave.mjs` re-reads every captured claim's source and
recomputes the visible-text digest with the **spec's own extractor**, imported from
`scripts/claim-capture.mjs` — not re-implemented, so the wave is the same measurement as the
captures it compares to.

| outcome | n | meaning |
|---|---|---|
| UNCHANGED | 12 | the visible-text digest is the same as at capture |
| CHANGED | 110 | the page's visible text changed |
| WITHDRAWN | 52 | the claim's verbatim text is no longer served at its source |
| UNREACHABLE | 8 | the source could not be fetched at all |
| **n_valid** | **174** | 182 − 8 unreachable |

Six withdrawals were checked by hand against the spec's extractor: for each, neither the full
claim nor its first six words appear in the page's visible text.

## The one thing the method cannot decide — and why that is an owner's ruling, not a bug

The slot's task wording has **five** outcomes: *"still served unchanged, changed with disclosure,
changed silently, withdrawn or unreachable"*. The wave settles four of them.

**"Changed with disclosure" versus "changed silently" has no rule.** The published spec v0.2
defines disclosure at the **artifact** level (§10.3 — a `conflicts` array on the artefact) and
defines no rule for whether a **source** disclosed its own edit. So every CHANGED row is recorded
as `CHANGED_DISCLOSURE_NOT_DECIDABLE`, with the reason attached, and the test asserts that no row
ever claims a verdict the method cannot decide.

**This is the ruling to make.** Three ways to close it, in the estate's own order of preference:

1. **Split the axis.** Promote `claim-maintenance` on the four outcomes the evidence settles, and
   carry the disclosure split as a **separate declared slot** with its own bench
   (*"pending a published rule for source-disclosed edits"*). The axis's number is then true, and
   the gap stays visible. The subject family gains a slot; the 33 becomes 34.
2. **Define the rule and re-run.** Publish what counts as a source disclosure — a dated
   changelog entry, a version bump, a correction notice the claim's own page links to — and the
   wave settles five outcomes. One more day after the ruling.
3. **Publish the axis on four outcomes and say so in its own note.** The axis measures
   "unchanged / changed / withdrawn / unreachable" and states that the disclosure split is not
   part of the measurement. Cheapest, and the note carries the limit.

**Recommendation: option 3**, then option 2 when a rule exists. Option 1 is the most honest
(absence is a result) but it changes the axis count, which is the owner's ruling on 2026-10-16.

## What the axis entry would become

The 10 subject axes are all built by one helper, and every one of them is a declared slot. A
MEASURED subject axis would be the **first of its kind**, which is why this is a ruling and not a
mechanical edit:

```ts
// in functions/api/_gspc_axes_d.ts — the shape, for the owner to accept or amend
{
  axis: "claim-maintenance",
  family: "subject",
  kind: "measured-subject",            // NEW kind: today every subject axis is "declared-slot"
  applies_to: "claimed-subjects",
  bench: "claim-maintenance v0.2 re-read wave",
  task: "at each scheduled re-read, is a captured public claim still served unchanged, changed, "
      + "withdrawn or unreachable; says nothing about whether the claim is true",
  n: 174,                               // n_valid, read off the wave — never typed
  status: "MEASURED",
  method_status: "meets-rule",
  method: "claim-maintenance v0.2",
  method_sha: "<sha256 of the spec's reference manifest>",
  bank: "public/interop/claim-maintenance-wave-2026-10-28.json",
  bank_sha256: "<sha256 of the wave file>",
  hue: 290,
  colour: "hsl(290 10% 55%)",
  note: "n_valid 174 of 182 captured claims, re-read 2026-10-28 with the spec's own visible-text "
      + "extractor. Counts per outcome, never a ranking, and never a statement that a claim is true. "
      + "The disclosure split ('changed with disclosure' vs 'changed silently') is NOT part of this "
      + "measurement: the published spec defines disclosure at the artefact level and not for a source's "
      + "own edit, so those claims are recorded as CHANGED_DISCLOSURE_NOT_DECIDABLE.",
}
```

## What changes on the board when it is promoted

| | before | after |
|---|---|---|
| slots | 33 | 33 (or 34 with option 1) |
| measured | 23 | 24 |
| unmeasured | 10 | 9 |
| the lid | 23 measured of 33 axes | 24 measured of 33 axes |
| `public_count` | derived | derived (never typed) |
| separation | unaffected | a subject axis joins no mean, no lid leader and no separation tally — unchanged by the ruling |

The counts are **derived, never typed** (`/api/state` says so in its own bytes), so the promotion
is a change to one axis entry and the derived counts follow.

## What is NOT claimed

- **Not that any claim is true.** A re-read says what was served today.
- **Not that a subject did anything wrong.** 52 withdrawals say the text is no longer served; they
  say nothing about why, and the wave records no allegation.
- **Not a ranking.** The axis reports counts per outcome, never an order.
- **Not the disclosure split.** See above.
