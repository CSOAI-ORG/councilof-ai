# DRAFT — note to Artificial Analysis, Cyber Index Alliance

**Status: DRAFT. Not sent. Do not send without the step named at the end.**

Prepared 26 October 2026 by a CSOAI lane agent, at the owner's instruction. Nothing has been emailed.

**Channel (verified 26 October 2026):** email `cyber@artificialanalysis.ai`. The Alliance page states
"Organizations interested in joining the Cyber Index Alliance can contact us at cyber@artificialanalysis.ai".
<https://artificialanalysis.ai/evaluations/artificial-analysis-cyber-index>

**Delivery state:** blocked on the same house mail credential as the NIST comment — see the delivery
note in `NIST-NCCoE-agentic-SI-identity-comment-DRAFT.md`, step 5. The message is built and ready.

---

## The message

**To:** cyber@artificialanalysis.ai
**From:** CSOAI Ltd (Council of AI) <nicholas@csoai.org>
**Subject:** Measurement expertise for the Cyber Index Alliance — an offer, and one question

Dear Artificial Analysis team,

Your Cyber Index Alliance page invites organisations to get in touch. We would like to introduce
ourselves, and to ask one concrete question.

We are CSOAI Ltd (Council of AI), an independent measurement body. We publish signed, publicly
re-checkable measurements of how AI systems and agent infrastructure behave. We measure and we never
certify: we issue no conformity marks, we sell no grade, and verification of anything we publish is
free permanently. We hold no client with an interest in this space.

We publish the awkward parts of our own record rather than only the parts that help us. Our board
carries 33 axes: 23 have a run behind them and 10 are declared but unmeasured, and we publish those
two numbers separately rather than collapsing them. Where the board compares models, 14 axes carry a
comparison and on those it separates no leader — 7 are TIE and 7 are UNTESTED. We publish the
separation line apart from the counts, because a TIE is not a win and an UNTESTED cell is not a tie.
Our corrections register holds 93 entries, the newest dated 6 October 2026.

What we could offer the Alliance:

1. **Independent measurement of the Index itself.** You run the three evaluations — CWE-Bench-AA,
   DeepsecBench-AA and CyberGym-E2E-AA — independently, on your own harness, and you publish the
   methodology. We would measure the reproducibility of that setup from outside: whether the Index's
   scores hold across reruns, runtimes and harness configurations, and whether the harness can fail
   a check it is supposed to fail. We would publish the result whether or not it flatters the Index,
   and we would publish it under terms no less open than your own.

2. **The safety-refusal dimension.** The Index reports that some models refuse tasks outright.
   Whether a refusal is a safety property, a capability ceiling, or an artefact of how the task was
   phrased is not visible from a composite score, and it is the kind of question that needs a
   measurement rather than an interpretation. We have published a method for separating a real
   behavioural property from a formatting artefact — and we have had to correct our own use of it in
   public, when 44 of our own signed results turned out to be measuring format compliance rather
   than the axis they claimed, and every one of them reported a perfect score because the grading
   configuration permitted only one answer. Those records stay online and unedited beside the ledger
   row naming each one.

3. **Evidence practice.** The schema we use requires a negative control as a field rather than an
   optional annex — a check that was capable of failing is part of the record, not a footnote. We
   would share that schema and the tooling with the Alliance at no cost and with no claim on any of
   it.

What we are not asking for. No slot on the Index. No inclusion of anything we measure in your
ranking. No listing, no accreditation, and no endorsement of CSOAI by Artificial Analysis. We are not
asking the Alliance to adopt our schema, our tooling or our definitions. If the purpose of an
Alliance is to keep evaluation honest, we think independent measurement of the evaluation sits
squarely inside that — and we would want the Alliance to be free to publish whatever we find,
including results that disagree with the current Index.

One question: does the Alliance have a mechanism for external research contributions, and would an
independent measurement of the Index's reproducibility be welcome?

With thanks,

CSOAI Ltd (Council of AI)
3rd Floor, 86-90 Paul Street, London EC2A 4NE, United Kingdom
nicholas@csoai.org
https://councilof.ai

---

## Before this is sent

1. **Re-verify the CSOAI figures** — 33 axes, 23 measured, 10 unmeasured, 14 comparison axes, 7 TIE,
   7 UNTESTED, 93 corrections, 44 withdrawn results. All were read from the live endpoints on
   26 October 2026, and the paths are in `HONESTY-REGISTER-2026-10-26.md` and the NIST draft. They
   move; read them again on the day.
2. **Clear the mail credential.** The message is built at
   `~/clawd/csoai-work/hunt/csoai-cyber-index-alliance.eml`. The send is blocked on the Proton app
   password being rejected by the server — see the NIST draft, step 5, for the two one-minute owner
   actions.
3. **Send it** from `nicholas@csoai.org` to `cyber@artificialanalysis.ai`, and save the sent copy
   and the delivery receipt beside this file.

   ```bash
   msmtp --account=csoai cyber@artificialanalysis.ai \
     < ~/clawd/csoai-work/hunt/csoai-cyber-index-alliance.eml
   ```
4. **Record the outcome honestly.** If the Alliance replies, what is proved is that a conversation
   opened. It is not a membership, not a partnership, not a contribution accepted, and not a
   measurement included in the Index. Do not write it up as any of those. The Index's evaluations are
   run by Artificial Analysis; a measurement of ours could only ever sit beside the Index, never
   inside it.
