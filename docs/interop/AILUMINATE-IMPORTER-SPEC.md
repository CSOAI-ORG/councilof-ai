# AILuminate → GSPC importer specification v0.1

**Document class:** interop specification. **Status:** draft-implemented-doctrine · **Date:** 2026-09-11.
**Public page:** `/gspc-vs-ailuminate`. **Binding doctrine:** `client/src/lib/twoSpeed.ts`
(`ailuminate` pin) and `client/src/lib/playbookAudit.ts` (`ailuminate-bind`).

---

## 0. The three nevers (binding)

1. **Never a 23rd axis.** ADR-001 fixes the board at 22 (14 GSPC + 8 financial).
   AILuminate rides as an *attachment*, not a slot.
2. **Never MEASURED.** An imported AILuminate result is `ATTACHED` evidence on
   an existing axis's evidence trail. The importer has no code path that writes
   `status: "MEASURED"`.
3. **Never a fused grade.** No GSPC+AILuminate composite score, no "AILuminate
   Good ⇒ GSPC pass" inference. The vocabulary crosswalk verdict stands:
   AILuminate's 5-tier grade is relative to a floating reference model —
   *"a grade is not comparable across time"* — so grade → MEASURED mapping is
   not equivalence; mapping it would be dishonest.

## 1. What AILuminate is (third-party facts, cited)

- MLCommons AI Safety v1.1 benchmark, released 11 Feb 2025 (arXiv 2503.05731 v2).
- **Chat-style systems only** — general-purpose chat hazard assessment.
- 12 hazard categories, 14 codes: `vcr ncr src cse ssh iwp ipv dfm hte prv
  spc_ele spc_fin spc_hlt sxc_prn` (`src` ≠ `sxc`).
- Prompt sets split into a **practice** set and a confidential **official** set
  with rotating reserve prompts monitored for overfitting — the
  practice/official split is the right anti-Goodhart shape and the estate's own
  holdout doctrine copies it.
- Output: a per-category 5-tier grade (Poor … Excellent) relative to a
  reference model.

## 2. What the importer consumes

An AILuminate v1.1 result export (per-category grades + run metadata). The
importer never runs AILuminate itself; running the benchmark is the operator's
act, on their licence terms.

## 3. What the importer emits

One **attachment record** per import (card-v0 family, `surface:
redteam.evidence`-style attachment, QUEUED unsigned — the GHA publisher is the
only signer):

```json
{
  "kind": "csoai.external-attachment/0.1",
  "framework": "MLCommons AILuminate",
  "framework_version": "v1.1",
  "attachment_to_axes": ["safety"],
  "state": "ATTACHED",
  "evidence_hash": "sha256 of the imported export bytes",
  "grades_asserted_by_framework": {"vcr": "…", "…": "…"},
  "imported_at": "ISO-8601",
  "never": ["MEASURED", "23rd-axis", "fused-grade"]
}
```

- The grades are recorded **as the framework asserted them**, verbatim, with
  the floating-baseline caveat carried inside the record.
- `attachment_to_axes` is `safety` at most (chat hazard ↔ calibrated-refusal
  instrument). Hazard categories that touch other axes (e.g. `dfm` ↔
  `art5-safeguard`, `ipv`/`iwp` ↔ `safety`) are noted as RELATED in the record,
  never projected.
- `n` honesty: AILuminate exports carry no per-category `n` field the board
  grammar can use — the crosswalk notes it is prose. The attachment therefore
  carries **no n** and can never enter separation stats or any mean.

## 4. What the importer never does

- Convert a grade into an accuracy, a CI, a leader, or a separation verdict.
- Write to the board, the root, or any signed surface (QUEUED unsigned only).
- Treat the practice set as the official set, or merge runs across set kinds.
- Claim GSPC equivalence, coverage, or compliance from an AILuminate result.

## 5. Why this shape

The playbook line is the positioning: **"AILuminate for chat. GSPC for
everything else."** Compatibility without capture: an operator who already ran
AILuminate can pin that evidence next to the 22-axis board — where it is one
honestly-labelled attachment beside instruments for provenance, continuity,
conformance, jail, swarm, custody and the financial half that a chat-hazard
benchmark does not reach.

*Measurement, not certification. An attachment is evidence, never a verdict.*
