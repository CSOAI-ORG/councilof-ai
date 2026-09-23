# Our axes against a published agentic-risk taxonomy

A mapping from the axes on GET /api/gspc to the threat classes of a published agentic-risk taxonomy, built to align with that taxonomy's vocabulary. A named class beside an axis means the axis SPEAKS TO it. It does not mean the class is handled, mitigated, covered or conformant, and nothing here certifies anything — not our systems and not anyone else's.

**Licence: CC-BY-SA-4.0** — not the estate's usual CC-BY-4.0. This page adapts a CC BY-SA 4.0 taxonomy and share-alike carries over.

> Contains material from “Agentic AI – Threats and Mitigations” (v1.0, February 2025) by the OWASP Agentic Security Initiative, OWASP GenAI Security Project, https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/ — licensed under Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0). This crosswalk is an adaptation and is published under the same licence. OWASP and the OWASP logo are trademarks of the OWASP Foundation, Inc. OWASP has not reviewed, approved or endorsed this crosswalk; the document is named as factual provenance, not as affiliation or endorsement.

## The mapping

`DIRECT` — the axis's task is a measurement of that class's failure mode. `ADJACENT` — the axis bears on the class without being a measurement of it. A named class beside an axis is **not** coverage and **not** a conformity statement.

| class | our axes | reading |
|---|---|---|
| **T1 Memory Poisoning** | **none** | No axis of ours inspects an agent's persisted memory or measures whether injected content survives into a later decision. Every behavioural axis grades a single stateless exchange against a frozen bank, so a fault that only appears across turns cannot show up on this board at all. |
| **T2 Tool Misuse** | `effect-binding` (DIRECT), `conformance` (ADJACENT) | effect-binding asks the question this class is about: does authorization bind to the request the server actually executes, or only to the tool call the agent declared. conformance measures a model against the tool protocol's own rules, which is the surface tool misuse travels over, not the misuse. |
| **T3 Privilege Compromise** | `effect-binding` (DIRECT), `cross-reality` (ADJACENT) | effect-binding is a probe of servers, and the gap it measures is a privilege gap. cross-reality grades whether an agent claims the authority to act (PROCEED / CONFIRM / REFUSE), which is a judgement about privilege rather than a test of enforcement. |
| **T4 Resource Overload** | **none** | Nothing on the board measures exhaustion of compute, memory or a downstream service. Our own engine was stopped by exactly this on the day this crosswalk was written — by free disk, not by an attacker — and no axis would have caught it. |
| **T5 Cascading Hallucination Attacks** | **none** | No axis measures propagation: every axis grades one answer, never what a wrong answer does to the next step. The estate does run a separate corrections-propagation watch over third-party pages, but that is not an axis, it measures published corrections rather than model output, and it must not be quoted as coverage of this class. |
| **T6 Intent Breaking & Goal Manipulation** | `safety` (ADJACENT), `art5-safeguard` (ADJACENT) | safety grades calibrated refusal on paired requests and art5-safeguard grades whether a prohibited practice is tripped — both measure resistance to being talked into an outcome. Neither measures a plan or a goal being rewritten mid-task, which is what this class names. |
| **T7 Misaligned & Deceptive Behaviors** | `care` (ADJACENT), `affect` (ADJACENT) | care scores protecting against helping on paired conduct scenarios and affect covers manipulation, disclosure and vulnerability. Both are about behaviour toward a person. Neither tests for an agent concealing its own behaviour from an operator. |
| **T8 Repudiation & Untraceability** | `provenance` (ADJACENT), `detector-interop` (ADJACENT) | provenance measures whether content marking survives, and detector-interop measures whether detectors agree across implementations — traceability of OUTPUT. No axis measures whether an agent's ACTIONS are logged and attributable, which is the class. Our own signing and receipt apparatus addresses this for our artifacts, and that is an estate practice, not a measurement of anyone. |
| **T9 Identity Spoofing & Impersonation** | `provenance-controls` (ADJACENT) | provenance-controls reads issuer-identity binding facts on-chain — identity, but of a financial issuer, in a different domain. No axis measures agent or user impersonation. |
| **T10 Overwhelming Human-in-the-Loop** | `cross-reality` (ADJACENT) | cross-reality measures whether a model hands a decision back to a human at all. It says nothing about the volume or fatigue that this class is about: an oversight rate is not an oversight load. |
| **T11 Unexpected RCE and Code Attacks** | `jail` (DIRECT) | jail grades escape-attempt detection over a 71-cell gold bank of real code cells (38 ESCAPE / 33 BENIGN). It measures DETECTION of such code, not prevention of its execution, and the distinction is the whole difference between this axis and a control. |
| **T12 Agent Communication Poisoning** | `swarm` (ADJACENT), `conformance` (ADJACENT) | swarm grades multi-agent coordination safety and conformance grades the tool protocol the messages travel over. Neither injects a poisoned message into a channel and measures what the receiving agent then does. |
| **T13 Rogue Agents in Multi-Agent Systems** | `swarm` (ADJACENT) | swarm is the only axis with more than one agent in it, and it grades coordination safety rather than the detection of a compromised or unmonitored participant. |
| **T14 Human Attacks on Multi-Agent Systems** | **none** | No axis models a human exploiting trust between agents. The board has no adversarial human in it anywhere: every bank is a frozen set of items, not an interactive opponent. |
| **T15 Human Manipulation** | `affect` (DIRECT), `care` (ADJACENT) | affect grades emotional and embodied safety across manipulation, disclosure and vulnerability, which is this class stated as a measurement. care scores the protect-against-help trade-off that manipulation exploits. |

## The gaps, which are the findings

- **4 of 15 classes have a DIRECT axis**: T2, T3, T11, T15
- **4 of 15 classes have no axis of ours at all**: T1, T4, T5, T14
- **7 of 15 classes are touched only adjacently**: T6, T7, T8, T9, T10, T12, T13
- **11 of 23 of our axes speak to no class in this taxonomy**: `ai-adoption-components`, `continuity`, `custody-disclosure`, `distribution-integrity`, `governance`, `humanoid-labour-index`, `labour-components`, `machinery-conformity`, `openness`, `regulatory-framework`, `reserve-attestation`

Four of fifteen classes have a DIRECT axis. Four have no axis at all. Seven are touched only adjacently, which for a reader looking for assurance is nearer to nothing than to something. Eleven of our twenty-three axes speak to no class in this taxonomy — they are regulatory, cryptographic, licensing and financial-disclosure measurements, and the board must never be quoted as agentic-risk coverage on their account.

### Why the gaps are structural, not an oversight

- Every behavioural axis grades one stateless exchange against a frozen bank, so any class whose failure only appears across turns (T1, T5) is out of reach by construction, not by oversight.
- No bank contains an adversarial human or a live opponent, so T14 cannot be measured by anything on the board.
- Detection is not prevention. Where an axis grades whether a model NOTICES a hostile input (T11), that is a different quantity from whether a system stops it, and no axis measures the second.

## The other half

A sibling lane maps the same axes the other way: axis to the open tools whose own published material claims to address it, with the axes no open tool addresses called out. Threat class on this side, available remedy on that side; read them together. — `measurement/remediation-crosswalk/2026-09-23/failure-class-to-open-remediation.json`

That file is CC-BY-4.0: it cites the taxonomy's identifiers for navigation and reproduces no prose from it. This file is CC-BY-SA-4.0 because it adapts the taxonomy's class names and structure, and share-alike carries over. Two artifacts, two licences, on purpose — name the artifact, never “the licence”.

## What this is not

- Not coverage. Relation DIRECT means the axis's task is a measurement of that class's failure mode, at the sample size the board publishes, and nothing more.
- Not a conformity statement, a certification or an endorsement, and no organisation has reviewed or approved it.
- Not a claim about anyone else's systems. Every axis measures models or public artifacts against a frozen bank; none of it is an assertion of falsity about a vendor.
- Not stable. Axes move; re-derive from the live board rather than quoting this file as the current shape of the board.

## Provenance of the source, at the level it was verified

| field | value |
|---|---|
| title | Agentic AI – Threats and Mitigations |
| version | v1.0 |
| published | 2025-02-17 |
| publisher | OWASP Agentic Security Initiative, OWASP GenAI Security Project |
| url | https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/ |
| license | CC-BY-SA-4.0 (Creative Commons Attribution-ShareAlike 4.0 International) |

Verified from the publisher's own page: title, version, published, license, trademark_notice.

Not verified from the primary document:
- the T1..T15 identifiers and names below: taken from secondary sources and cross-checked between them, because the primary PDF was not retrieved by this lane
- one secondary source refers to T1..T17; that count could not be reconciled against the primary and is recorded here rather than resolved

Licence line as the publisher states it: “Unless otherwise specified, all content on the site is Creative Commons Attribution-ShareAlike v4.0 and provided without warranty of service or accuracy.”

---

Council of AI (CSOAI Ltd, UK Companies House 16939677), councilof.ai. This crosswalk is CC-BY-SA-4.0. Board data at `GET /api/gspc` is CC-BY-4.0. Licence differs by artifact; name the artifact.
