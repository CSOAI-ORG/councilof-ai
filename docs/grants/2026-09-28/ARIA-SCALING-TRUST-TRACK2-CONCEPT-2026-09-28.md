# ARIA Scaling Trust, Track 2 (Tooling): concept note. DRAFT, NOT SUBMITTED

Status: HELD. Owner asks: (1) read the programme thesis and the rolling solicitation (links below) and decide whether to apply in the cycle that closes **31 October 2026, 14:00 GMT**; (2) if yes, create the ARIA portal account yourself; (3) set the budget and duration; (4) write the team section; (5) expand this note to at most 10 pages, or keep it short, which ARIA allows. A proposal that misses this cut-off rolls into the next quarterly cycle.

Lane: grants-20260928. Call facts were read from aria.org.uk on 2026-09-28; CSOAI figures from live endpoints the same day.

## Call facts (quoted)

- "Applications are open on a rolling basis and reviewed in quarterly batches. The next proposal cut-off is 31 October 2026 (14:00 GMT)." Review runs 1 to 30 November 2026, with notification on 30 November 2026. (https://aria.org.uk/opportunity-spaces/trust-everything-everywhere/scaling-trust/funding)
- Track 2: "Open-source agents and reusable components that enable secure requirement capture, negotiation, protocol generation, and verification in multi-agent settings." The funding page adds "security reasoning, and verifiable reporting". Size: "4–6 teams, £200k–£2m each", as listed on the funding-opportunities page.
- Who: "We welcome applications from across the R&D ecosystem, including individuals, universities, research institutions, companies of all sizes, charities and public sector research organisations."
- Licence: "all software produced under Track 2 (Tooling) and Track 3 (Fundamental Research) must be released under a permissive open-source licence. We require a dual-licence approach under MIT and Apache 2.0." Background IP stays with the applicant.
- The call names four sub-components. The fourth is "Report – input execution trace → outputs succinct convincing statement". This note targets that component.

## The gap, measured

Agents act through tools, and a report is only convincing if what was authorised is what actually ran. On 2026-09-22 we probed third-party MCP servers drawn from the public registry, asking whether authorisation binds to the request the server executes or only to the tool call the agent declared. Of 600 servers tried, 261 returned a verdict: **BINDS 0 · PARTIAL 23 · DOES_NOT_BIND 238** (GET https://councilof.ai/api/gspc, axis effect-binding; signed companion at https://councilof.ai/interop/effect-binding-server-probe-2026-09-22.signed.json).

The record states its own limits, and they belong with the numbers. DOES_NOT_BIND means an unauthorised extra argument was not refused at the boundary, not that the backend used it. Servers behind an authentication wall were recorded as uncheckable and never counted. It is one operating point on one day, and it is not a security claim about any vendor. Even read narrowly, it shows that a report built from what an agent declared does not show what executed.

## What we would build (Track 2, Report component)

1. **Trace-to-statement reporter.** Takes an execution trace of an agent's tool and agent-to-agent calls and emits a succinct signed statement that pairs what was declared with what was observed at the boundary. Evidence travels as hashes, and the format is compatible with the SCITT signed-statement model (COSE_Sign1). A verifier ships with it, so any party can check a statement offline without trusting the reporter.
2. **Binding probe as a reusable component.** The four-step probe behind the effect-binding measurement becomes a library an Arena agent can run against a counterpart before relying on it: declared-binding read, unauthorised-argument check, replay check where a nonce exists, and returned-evidence check. It reports BINDS, PARTIAL, DOES_NOT_BIND or UNCHECKABLE, and never collapses UNCHECKABLE into the other states.
3. **Arena integration.** Statements are emitted in a form the Arena's own evaluation pipeline can consume. Every run publishes its rows, so a result can be recomputed rather than trusted.

All deliverables would be released under MIT and Apache-2.0, as the call requires.

## Why CSOAI, checkable today

- **Signed records that verify:** 335 signed cards, all 335 verify (GET https://councilof.ai/api/state, card_chain.bodies_verified_valid, kind "measured"). Verifier: https://councilof.ai/signed/verify-card.mjs.
- **A dated corrections ledger:** 78 entries (GET https://councilof.ai/api/corrections).
- **Standards drafts on this exact problem:** individual Internet-Drafts draft-templeman-scitt-measurement-capsule ("Declared-versus-Observed Measurement Capsules") and draft-templeman-scitt-framing-space. These are individual drafts with no IETF standing.
- **Practice:** we measure, we issue no marks or pass/fail labels about any vendor, and verification is free.

## Done-when (draft milestones; the owner sets dates)

- **M1:** the reporter and verifier are released. Statements from a public reference trace verify offline on a second machine.
- **M2:** the probe library is released and re-runs the 2026-09-22 slice. Its per-server rows match the signed run, or each difference is published.
- **M3:** Arena integration, with statements accepted by the Arena pipeline on at least one live challenge. This depends on the Arena's launch, and if the Arena is not live, M3 is reported as UNMEASURED.

## Budget and duration

OWNER: set both. Track 2 awards range from GBP 200,000 to GBP 2,000,000. A 9-month scope for the three components above sits at the lower end of that range.

## Team

OWNER: write this section.
