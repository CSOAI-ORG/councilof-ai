# DRAFT — Measurement-backed input to the AAIF Agentic Commerce WG "Recommendations to the TC"

> **STATUS: DRAFT, NOT SUBMITTED. OWNER APPROVAL REQUIRED BEFORE ANY SUBMISSION.**
> Nothing in this file has been posted, e-mailed, filed as an issue or PR, or sent to any list.
> Submission is an outward act; the owner approves it, and it goes from the clean account.
> Prepared 2026-09-25 by the Council of AI (CSOAI) measurement lane. No endorsement by the AAIF,
> the Linux Foundation, the WG, or any protocol named here is claimed or implied. No logos.

## 0. What this is, and what it is not

The WG charter (github.com/aaif/wg-agentic-commerce, `charter.md` at commit `8458b003`; sha256 in §4, W1) sets a **2026-10-01** target for "Recommendations
to the Technical Committee on Foundation-Hosted Projects": structured input on which projects are
candidates for hosting, with "rationale, scope, suggested governance model, and dependencies". The
WG "does not author competing commerce protocols".

This draft respects that. It proposes **no protocol**. It offers five recommendations, each of
which is (a) a criterion or open question the TC could apply to *any* candidate project, (b)
testable by a stated procedure, and (c) grounded in a dated public measurement cited to a file.
Where we have no measurement, we say UNMEASURED and give no number.

The WG's own July 2026 report (`reporting/2026-07-report.md`, same commit) lists as open
integration questions: **"merchant receipt, validation, transaction binding, and renewed
approval"**. Recommendations 3–5 map to those four words directly; 1–2 are about validation.

We measure; we do not certify. Nothing below grades, ranks or endorses any project, vendor or
server, and no score may be derived from it.

## 1. The five recommendations (headlines)

1. **Treat deployed conformance as a hosting input: a candidate project should ship a runnable,
   read-only conformance check, and its population conformance should be measured and published.**
2. **Pin one normative location for the payment challenge, and test that location only.**
3. **Transaction binding: a receipt should bind the executed effect to the authorisation that
   permitted it — tested by argument-swap and replay probes, not by field names.**
4. **Merchant receipts should carry per-section evidence states (third-party / self-asserted /
   absent), with "unchecked" and payer class first-class — and never a single score.**
5. **Renewed approval: specify that a decline produces no effect, and require a decline scenario
   in every conformance suite, because in the wild the behaviour is currently unobservable.**

## 2. Recommendations in detail

### R1 — Deployed conformance as a hosting input

**Finding.** On 2026-09-24 a daily census sent one read-only GET to every distinct host listed in
either public x402 discovery index (Coinbase CDP, PayAI): **2,694 hosts** probed, **499
conformant (18.52%)**, where conformant = HTTP 402 AND a `PAYMENT-REQUIRED` header AND
`x402Version: 2` in the body AND an `extensions.bazaar` block. 1,675 hosts answered 402; 12 were
unreachable. [S1]

The two indexes are largely disjoint: 1,889 hosts are listed only by CDP, 671 only by PayAI, and
**134 by both**. [S1] "Listed in the discovery index" is therefore one fact per index, not one fact.

**Recommendation.** Before the TC hosts a commerce protocol (or a portion of one), ask the project
to supply (a) a machine-runnable conformance check that is read-only (sends no payment, no
credential), and (b) a dated reading of that check over the project's own public population
(e.g. every host in its discovery index), with the population's read state (complete / partial)
stated. A specification whose deployed population mostly does not conform to it is still a
legitimate hosting candidate — but the gap is then a known dependency, not a surprise.

**Test.** Re-run the check; the reading must reproduce from the published method and inputs.
Our producer is `scripts/census/x402-bazaar-conformance.py` (MIT); its method string is in [S1].

### R2 — One normative location for the payment challenge

**Finding.** In the same 2026-09-24 census, **1,012 hosts** carried an x402 v2 challenge *with*
the bazaar block in the `PAYMENT-REQUIRED` response header while the body said v1 or nothing.
[S1] Under the census rule (body is read, as the 2026-09-05 baseline did) those 1,012 are
non-conformant; under a header-first rule many would pass. The producer's docstring records the same
effect earlier: the 2026-09-05 snapshot, reading the body, scored 394 of 3,520 hosts conformant;
reading the header first on the 2026-09-06 re-probe scored 1,310 of 2,800 — attributed there to
the rule, not to a change in the servers (the two denominators differ and are not compared). [S2]

**Recommendation.** Where a candidate protocol carries the same object in two places (header and
body), the TC should ask it to state which one is normative, what a client MUST do when they
disagree, and to ship conformance tests that read the normative place only. Until then, any
published conformance number for that protocol is conditional on an unstated reading rule.

**Test.** A fixture pair (header-only, body-only) that a conforming client resolves identically.

### R3 — Transaction binding

**Finding.** A server-side probe (2026-09-22) asked whether public remote MCP servers bind an
executed effect to the authorisation that permitted it: can an effect pass under an
authorisation issued for a different one (argument binding), can a consumed authorisation be
replayed, and does the server return evidence binding what ran to what was authorised. Of 600
third-party servers tried, **261** received a verdict: **BINDS 0 · PARTIAL 23 · DOES_NOT_BIND
238**. Controls (a binding and a non-binding fake server) were run first and both graded as
expected. [S3] Separately, on 2026-09-25, **300 of 2,008** remote MCP endpoints that answered
`initialize` declared at least one field whose *name* suggests binding (nonce, idempotency,
receipt, signature, …) — a declaration, which the 2026-09-22 probe shows is not the same as
behaviour. [S4]

**Recommendation.** The Capability Map's "transaction binding" row should be defined by
behaviour, not by field presence: a receipt binds only if (a) swapping an authorised argument
(amount, target, item) is rejected, (b) replaying a consumed authorisation is rejected, and (c)
the receipt carries a digest of the authorised request. Candidate projects should say which of
(a)–(c) they specify.

**Test.** The three probes above, run read-only against fixture servers first; a grader that
passes a deliberately non-binding fixture is itself defective.

### R4 — Merchant receipts with evidence states, never a score

**Finding (a design input, not a population measurement).** The x402 offer-and-receipt
extension, AP2 mandates, A2A task states and ERC-8004 each supply *parts* of what happened in one
agent-mediated purchase; none of them says, per part, **who other than the parties stands behind
it**. We published a CC0 record format that does only that — the delegation receipt v0.1 — with a
schema, nine test vectors (four valid/unsigned, five invalid, each failing under its own code) and
a reference verifier, plus a crosswalk to those protocols. [S5] Its example built from our own
record is honest about the common case: only the payment is evidenced by a third party (the
chain); principal, agent and delivery are self-asserted; the outcome is UNCHECKED; the payer is
the recorder itself (SELF_TEST). [S5]

**Recommendation.** Whatever receipt the WG recommends (x402 offer-and-receipt, a UCP/ACP order
object, or another), ask that it can express, per section — authorisation, agent, payment,
delivery, outcome check, timestamps — one of three states: evidenced by a third party,
self-asserted, or absent; that "outcome not checked" is a first-class value, never defaulted to a
pass; that a payer class distinguishes an outside payer from a self-test or zero-value settlement;
and that consumers MUST NOT collapse the states into a single score. The CC0 format is offered as
**input vocabulary and test vectors**, not as a competing protocol; the WG may copy any of it.

**Test.** The nine vectors in [S5] (`verify_receipt.py --did-doc test-vectors/test-did.json`);
a proposed receipt format passes if it can represent vectors 02 (principal absent) and 03
(outcome unchecked) without inventing a value.

### R5 — Renewed approval and decline

**Finding.** A pilot probe (2026-09-24, unsigned, not on any board) called up to three read-only
tools on randomly sampled remote MCP servers and answered any `elicitation/create` with `decline`.
In both strata **n = 0**: no server elicited during 146 + 27 read-only calls, so no decline
behaviour was observed and **no rate exists**. [S6] The MCP specification says servers should
"handle explicit decline" but does not require that a declined action not proceed. [S6] The AAIF
Observability & Traceability WG has an open item stating "a denial should not produce a
fictional tool execution" (wg-observability-and-traceability issue #44).

**Recommendation.** For commerce flows, the TC should ask candidate projects to specify that a
declined or cancelled renewed approval produces **no effect** (no charge, no order mutation), and
to include a decline scenario in their conformance suites — because the behaviour cannot yet be
measured from outside on live servers (UNMEASURED), only on fixtures. Coordinate with the
Observability & Traceability WG (#44) and the Identity & Trust WG (delegation) rather than
duplicate them, as the charter's separation of concerns requires.

**Test.** A fixture that elicits on a state-changing call; decline → the call must end without
the effect; cancel → recorded separately.

## 3. What none of this measures (stated so it is not inferred)

- Whether any door **delivers** after payment. Our own door-conformance report marks fulfilment
  UNMEASURED because no payment was exercised. [S7]
- Seller honesty, product quality or price. No price appears in this document by design (the
  charter's antitrust notice; our doctrine publishes no prices).
- Anything about a project's organisation, sponsors or membership.

## 4. Sources (every number above is cited here; sha256 of the bytes read)

| Id | File | What it is | sha256 |
|---|---|---|---|
| S1 | `summary-2026-09-24.json` in HF dataset `csoai/x402-bazaar-conformance` (main at `1da70e6e`, identical to `summary-latest.json` on 2026-09-25) | daily x402 discovery-index conformance census, as_of 2026-09-24T03:05:41Z; fields `hosts_probed`, `headline.*`, `by_index.*`, `header_v2_bazaar_not_body` | `d068e424317873e6c86364c204deed6e820bf0547d5ea0a87aef4b2359c62830` |
| S2 | `scripts/census/x402-bazaar-conformance.py` (this repo) | the producer; its docstring records the 2026-09-05/06 body-vs-header readings (394 of 3,520; 1,310 of 2,800) | (repo blob) |
| S3 | `public/interop/effect-binding-server-probe-2026-09-22.json` (this repo) | server-side effect-binding probe; `third_party.counts` | `e7083086fedf34d528caecf5771e0019ef34282c24727532e70ede8b1b87fc69` |
| S4 | remote MCP census `summary.json`, record `mcp-remote-census-2026-09-25` (as_of 2026-09-25T06:54:10Z) | `responded.n` = 2,008, `responded.p1_declared_binding_field` = 300; counts are over the attempted endpoints of a top-20% plan, not population totals | `991ef00bf40c6c56960ff08110fdf3ebceb366f5d1f8b15aadf3f85cb8ef9ae1` |
| S5 | `public/spec/delegation-receipt/` (README.md, CROSSWALK.md, schema-v0.1.json, test-vectors/, examples/) (this repo) | delegation receipt v0.1 DRAFT, CC0 1.0 | (repo tree) |
| S6 | `public/interop/hitl-elicitation-probe-2026-09-24.json` + `docs/measurement/HITL-PROBE.md` (this repo) | HITL elicitation pilot; `counts.random`, `counts.registry_text_hint`, `pilot_result` | `1ca4d068f265483eb581b6a9898376848c717bb62e51521fb0faaf1be8fcdc75` |
| S7 | `public/interop/x402-door-conformance-2026-09/report.json` (this repo) | our own doors (SELF), challenge conformance; `fulfillment: UNMEASURED` | (repo blob) |
| W1 | `charter.md`, github.com/aaif/wg-agentic-commerce @ `8458b003a68de58c8bc24900ebd931d3112eb7ca` | WG charter; deliverable "Recommendations to the TC", target 2026-10-01 | `55e3b072414fd70ec01950fb294ddf7254acc5117bde7bd1c353fc9188f6be67` |
| W2 | `reporting/2026-07-report.md`, same commit | open questions: merchant receipt, validation, transaction binding, renewed approval | `e04b2129615eadd39c36f1a4ad4cae2cfab45e6e69424932bcb24843e50643a4` |

## 5. Before submission (owner checklist — none of this is done)

- [ ] Owner reads and approves the text, each recommendation separately.
- [ ] Re-read S1 on the day of submission (it is a daily series; quote the newest `summary-latest.json`, never this file's numbers).
- [ ] Confirm the WG's submission route (the charter says work is tracked in Google Docs and the GitHub repo; meetings are members-only). Submit from the clean account only.
- [ ] Licence: WG documentation is CC-BY-4.0; our spec is CC0, so it can be contributed as-is.
- [ ] Remove §5 and the DRAFT banner only in the submitted copy.
