# SAFE v1.0 port — prepared contribution, 26 October 2026

Status: **CSOAI working document.** No pull request has been submitted to the Open Secure AI
Alliance, and nothing here claims the Alliance has adopted anything. Two issue comments have been
posted to the Alliance's own tracker (issues #32 and #72, on 26 October 2026), and the citable form of
this contribution is published on our own surface; neither is a submission of the patch and neither is
adoption. This is the successor to `SAFE-RFC-CLOSURE-MATRIX-20261007.md`, which was written against
the RFC before the specification was approved.

## What changed upstream, and what it means for our three open items

Verified at source on 26 October 2026 against `github.com/OpenSecureAIAlliance/RFCs` (which now
redirects to `OpenSecureAIAlliance/wg-safe`):

| Fact | Verified how |
|---|---|
| `SAFE.md` (20,094 bytes) now exists beside the superseded `rfc-safe-proposal.md` (7,773 bytes) | repository contents listing |
| Issue **#32** (discriminating power) is open, filed by CSOAI-ORG on 2026-09-17; **3 comments** (2 ours, 2026-09-07 and 2026-10-26) | issue API, re-read 26 Oct |
| Issue **#72** (continuous claim maintenance) is open, filed by CSOAI-ORG on 2026-10-07; **4 comments** (2 ours, 2026-10-26; one from the Alliance's QSAFP-Core, 2026-10-26) | issue API, re-read 26 Oct |
| PR **#64** is open, not a draft, base `main`, 3 commits, **+24/-0**, one file: `rfc-safe-proposal.md` | pull request API |
| The approved `SAFE.md` contains none of: `discriminat`, `negative control`, `insufficient_evidence`, `not_applicable`, `claim maintenance` | full-text read of the file |

The last row is the finding that matters. **Our PR #64 still modifies the superseded
`rfc-safe-proposal.md`,** while the approved specification is `SAFE.md`. The approved file already
has a serving-path row, already uses the four labels in prose — "using pass, fail, insufficient
evidence or not applicable" — and already requires a reproducible verification method to state its
"failure behavior, known systematic error classes and measurement uncertainty". What it does not
carry is the semantics: it never separates an evidence-delivery failure from an underlying control
failure, and it never requires a method to prove it can fail.

## Where we actually stand on the three moves

Two of the three were further along than a reading of our public contributions would suggest, and
one is further along than we have published anywhere.

**Move 1 — port PR #64 to the approved specification.** The patch is written and verified:
`SAFE-v1.0-port.patch` is based on the approved `SAFE.md` — not on the superseded draft — and
`verify-patch-applies.sh` proves both halves of that claim (it applies to the approved file at a
pinned upstream commit, and it is *rejected* against the superseded draft). What is **not** done is the
upstream pull request: the text is ready, and opening it needs a co-author with a normal GitHub
account, which is the owner's to choose.

> **Stale wording — published 26 October 2026, quoted unchanged.** The paragraph above. On
> 27 October 2026 its second half was found **not to have been established by the control that was
> cited**, and the control was corrected. The claim itself is now established and established
> properly; what was wrong was the instrument, not the patch.
>
> **What the control actually did.** It placed the superseded draft *beside* the approved file and
> ran `git apply --check` in that directory. `git apply` resolves its file from the patch header
> (`+++ b/SAFE.md`), so the control re-tested the **approved** file and passed for the wrong
> reason: it was vacuous. The failure it produced was a finding about the control, not about the
> patch.
>
> **What the control does now.** The draft's bytes are placed **under the patch's own target file
> name**, where the patch is rejected. The superseded draft contains none of the patch's anchors —
> no `## Review Framework`, no control-layer table, no `## The Compact` — which is *why* it is
> rejected. A second control (one anchor line mutated ⇒ rejected) shows the check reads bytes
> rather than a file name, and a corrupted-pin run exits non-zero, so the instrument can fail.
> Run on 27 October 2026: **PASS** — applies to the approved file at the pinned commit, rejected
> against the superseded draft, rejected against a mutated anchor.

**Move 2 — an executable discriminating-power profile.** The *vocabulary* already existed and was
already published: `NOT_DISCRIMINATING` is a first-class state in the OASF capability enumerations
and in the six evidence-event states, and `safe-reverification-record-v0.1.schema.json` already
carries a required `negative_control` whose `observed` field says, in its own description, that
"PASS means the test accepted a case built to fail: the test is broken". What did not exist was
anything executable. That is now built — see below.

**Move 3 — a maintained-claim companion profile.** A published schema and a working model already
exist: `public/spec/claim-maintenance/v0.2/` carries the claim-artifact schema, and
`SAFE-HITL-CLAIM-MAINTENANCE-BINDING.md` carries the trigger model, the state machine and the
separation of authority from evidence. **More than that, the lifecycle is already running in
production on our own board**, and that fact is the strongest thing we can put in front of the
Alliance — see the worked example below.

## What this commit adds

One module, inside the canonical Council monorepo. No new repository.

| File | What it is |
|---|---|
| `SAFE-v1.0-port.patch` | A unified diff against the approved `SAFE.md`. Four hunks. Applyable as-is. |
| `safe-review-outcome-v0.1.schema.json` | Machine-readable review outcome: evidence-delivery state, underlying control outcome and layer attribution as three separate records. |
| `safe-discriminating-power-v0.1.schema.json` | Machine-readable discriminating power: a must-pass control, a must-fail control, and the derived path. |
| `test_discriminating_power.py` | The executable profile. Reproduces the one-option-answer-menu failure shape and proves the harness can itself detect an instrument that cannot fail. |
| `examples/discriminating-power-*.json` | Three worked records: DISCRIMINATING, NOT_DISCRIMINATING, INSUFFICIENT_EVIDENCE. |
| `examples/review-outcome-*.json` | Three worked records: a control that failed, an established delivery failure, and an unresolved absence. |
| `examples/example-stale-signed-board-freeze.json` | The real worked example for move 3. |

`validate_examples.py` now routes each example to the schema its `profile` names, and every example
is mutated into a record its profile forbids. Every one of those mutations must be rejected.

## The worked example: the living board against its stale signed freeze

This is the concrete instance of the lifecycle the Alliance would be being asked to adopt.

- The **signed board freeze** — `https://councilof.ai/signed/gspc-board.signed.json`, keyed
  `did:web:csoai.org#gspc-board-22axis-2026`, witnessed in the Rekor transparency log at index
  2687278151 — states **23 axes · 23 measured**.
- The **living board** — `https://councilof.ai/api/gspc` — states **33 axes · 23 measured**.
- The freeze's own pointer, `public/interop/gspc-board-freeze-pointer.json`, carries
  `relying_party_status.state = "SUPERSEDED_KNOWN_CLAIM_DEFECT"`, names the living board as
  `current_authority`, and says not to use it as current authority.

So a signed, verifiable, externally witnessed claim went out of currency, and the estate records
that **in a machine-readable field on the artefact itself** rather than leaving a reader to work it
out. The two numbers are two different boards at two different observation times — not a
disagreement about one board — and the record says so.

The comparison has a real designed-to-fail control: the same extraction run against a real
document that is not the board does not report the board's figures. That control was executed to
produce the record, not asserted.

Note what the example is *not*. The freeze separates no leader and never did; the separation line
belongs to the living board, which reports 0 of 14 model-comparison axes separated a leader, 7 TIE
and 7 UNTESTED. Nothing in the example authorises any action, and no current measurement can
authorise one.

## The prepared contribution

`SAFE-v1.0-port.patch` proposes four changes to `SAFE.md`:

1. **Review Framework** — the evidence-delivery state, the underlying control outcome and the
   attribution of a failure to a layer become three separate records; evidence that did not arrive
   cannot produce a pass or a fail.
2. **Review Framework table** — an *Evidence delivery* row, so the layer is tagged rather than
   inferred.
3. **From Lessons to Controls** — the reproducible verification method must carry evidence that it
   can produce its intended negative outcome: a control that must pass and a control that must fail
   under the same configuration.
4. **A new "Maintained Claims" section** — an optional companion profile. It obliges nothing and
   requires no particular claim format.

The patch is deliberately small. It is easier for a maintainer to review four paragraphs than a
rewrite, and a rewrite of an approved specification is the wrong thing to ask for.

## How the patch was verified against the approved specification

A patch that "applies to SAFE.md" is a claim about bytes, so it is checked as bytes.
`verify-patch-applies.sh` in this directory is the check, and it is runnable by a stranger:

```
bash docs/standards/osaia-safe-reverification/verify-patch-applies.sh
```

It fetches the upstream file at a pinned commit, checks the digest against a pinned value, and
then runs `git apply --check`:

| Pin | Value |
|---|---|
| repository | `OpenSecureAIAlliance/wg-safe` (the RFCs repository now redirects here) |
| commit | `ba76bac74c251926cb3d14bc363e0443b5959007` — "Add SAFE.md", 2026-10-22T02:04:22Z |
| git blob | `327805a8178a003a3d5112b612262ffab90627f2` |
| bytes | 20,094 |
| sha256 | `4b7c6e69e849d46f5aa990f50db45952f9262d70dd27397ee1315c77c4776c16` |

The script carries **two negative controls**, and the controls are the point. A check that can
only pass proves nothing; this one fails in both directions.

1. **The superseded draft.** The same patch, applied to the bytes of the superseded
   `rfc-safe-proposal.md` at the same commit, must be **rejected**. The draft's bytes are placed
   **under the patch's own target file name** — and that detail is the control. `git apply`
   resolves its file from the patch header, so a check run in a directory that still holds the
   approved `SAFE.md` re-tests the approved file and passes for the wrong reason.
2. **A mutated anchor.** One context line of the approved file is changed and the patch must then
   be **rejected**. This is the sensitivity control: the check reads the bytes at the anchor, not
   merely the presence of a file with the right name.

If the patch stops applying to the approved specification, starts applying to the superseded
draft, or survives a changed anchor, the script exits non-zero. A corrupted-pin run also exits
non-zero, which is how the instrument is shown to be able to fail.

Last run: **PASS** on 27 October 2026 — applies to `SAFE.md` at the pinned commit, rejected against
the superseded draft, rejected against a mutated anchor. That is a statement about applicability at
a time. It is not review, not acceptance, and not adoption; SAFE has adopted none of this.

> **Correction — 27 October 2026.** The 26 October 2026 version of this section described a single
> negative control against the superseded draft and reported a passing run. That control was
> **vacuous** (see the Move 1 correction above): it re-tested the approved file. The claim it was
> cited for was true; the instrument that claimed it was not. The controls above are the corrected
> ones, and the 26 October 2026 wording is superseded by them.

## How this gets submitted, and what is owner-only

CSOAI's GitHub account is restricted, so anything it opens is invisible to a logged-out reader.
That is why our own citable form is published on `councilof.ai` rather than in the repository. The
practical route for the patch is the same one the existing contribution documents already state: a
co-author with a normal GitHub account opens the pull request, carries the DCO `Signed-off-by`
line with their own name and email, and lists CSOAI as co-author with CSOAI's own sign-off. **No
text depends on who posts it.**

Owner-only, and not done here:

1. **Decide whether to submit the patch at all.** The four hunks are the owner's call.
2. **Choose the co-author**, if any. This needs a person.

Done, and recorded here so the next reader does not have to guess:

3. **The citable form is published** — `public/contributions/osaia-safe-v1.0-port-2026-10-26.md`,
   carrying the full four-hunk patch, the executable discriminating-power profile and the worked
   example, so a logged-out reader can check them on `councilof.ai` exactly as they can check the
   earlier discriminating-power contribution.
4. **The follow-ups on #32 and #72 are posted** — 26 October 2026, comment `6413473177` on #32 and
   comment `6413473687` on #72, each linking the citable form and this pull request. They were
   posted as comments, not as a patch submission, and they say so.

Still outstanding, and owner-only: **the upstream pull request itself.** Nothing has been
submitted to the Alliance for approval; #64 remains open against the superseded draft.

## What this is not

- SAFE has **not** adopted any of this. #32 and #72 are open issues; #64 is an open pull request
  against a superseded file. None of that is adoption and none of it should be described as such.
- GSPC is **not** made mandatory for SAFE. It is an optional verifier and an optional reference
  implementation.
- The synthetic corpus in `test_discriminating_power.py` reproduces a failure *shape*. It names no
  real incident, model, deployment or subject, and it is not a production measurement.
- Nothing here turns a current pipeline failure into a reportable SAFE case. The reporting compact
  is the compact, and our own operational incidents are not automatically in scope for it.

Licence: Apache-2.0, as the rest of this module.
