# Council mechanism: proposal section (copied 29 Sep 2026)

Copied unchanged from section 4 of the owner-side note COUNCIL-MECHANISM-MINED-2026-09-29.md. The owner adopted the ruling records it proposes on 29 Sep 2026 ("adopt the ruling records"). The heading still says PROPOSAL because these are its original bytes; the adoption is ruling R-2026-0929-06.

---

## 4. Proposal (PROPOSAL, not in force. Nothing below exists yet)

**Principle.** This keeps DR-0012, DR-0033, ADR-001 and charter Arts. 1, 12, 17, 19, 20 and 22 as they are.

**A. Rules decide measured states, never votes.**
- SEPARATED, TIE, UNTESTED, MEASURED, UNMEASURED and ADMITTED/NOT_ADMITTED are outputs of pre-registered, pinned code over pinned bytes, as they are today.
- No council, owner or model may set these states by opinion. They may only rule on **which rule applies** and **whether the output is served**.

**B. A council rules on ruling-class questions only:**
- admission rules and their changes (for example card admission options A/B/C);
- new state names or reason codes (for example NO_PER_ROW_RESULTS, ADMITTED_SINGLE_RUNTIME);
- serving a rule-computed state change on the signed board (the jail case);
- slot count and new axes (ADR-class);
- company and product naming (for example SovX, "completion record");
- disputes under `/dispute`.

**C. Composition (proposal).**
- N reviewer agents or models from different families **and** different providers, plus the owner as final decider. This matches today's Art. 20 and the dispute page.
- **Do not call it BFT until it is measured.** Record the panel's n_eff on every ruling using the existing `council-independence` method.
- If n_eff < 2, the panel is **ADVISORY** and the owner's ruling alone is binding.
- "BFT" wording is allowed only when measured independence supports n ≥ 3f+1 with f ≥ 1 (at least 4 effectively independent reviewers), with authenticated keys per reviewer. This is the bar the quarantine README already sets: "independently produced, authenticated votes and an independence gate".

**D. Reviewer duties.** A reviewer does not vote on the answer. It checks:
- whether the rule was pre-registered before the result;
- whether the output reproduces from the pinned bytes;
- whether the evidence hash matches;
- whether the proposed public sentence says more than the output.

Each check is recorded as a verdict: `CONCUR` / `DISSENT` / `CANNOT_REPRODUCE`, with a rationale hash.

**E. Every ruling is a signed record** (proposed schema `csoai.ruling/0.1`, appended to the corrections ledger or a sibling ledger):

```
ruling_id, class (admission|state-name|board-serve|slot|naming|dispute), question,
rule_ref {script, commit, sha256, preregistered_commit}, evidence_sha256[],
computed_output, proposer, reviewers[{id, family, provider, verdict, rationale_sha256, sig}],
panel_n_eff, panel_state (ADVISORY|INDEPENDENT), decider, decision (verbatim owner quote),
decided_at, supersedes, correction_id, signature (separate ruling key, not the board key)
```

Applied to today's case, the jail ruling would read:

```
class=board-serve
rule_ref: e95c14cf4 / 0c9e93d11
computed_output: UNTESTED (NO_PER_ROW_RESULTS)
evidence_sha256: bank 0b45b620…, gold_results 19978128…
decision: the owner's quote
```

