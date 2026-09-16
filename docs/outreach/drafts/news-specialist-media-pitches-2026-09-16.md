# News & Specialist Media — Ten Qualified Editor Pitches
## 2026-09-16

**Lane:** News and specialist media (TUI 1 allocation)
**Prepared by:** Claude (cross-lane execution)
**Rule:** each pitch names one fetchable artifact. No certification language,
no "first/only," no unverifiable superlatives. Every number is a live
endpoint the editor can check.

---

## 1. Bloomberg — AI & crypto desk

**Editor:** Yueqi Yang (stablecoin/crypto infrastructure beat)

**Angle:** "NYDFS stablecoin comment period closes in5 days. We measured what the500-server MCP ecosystem looks like at the same moment."

**Artifact:** `GET https://councilof.ai/interop/mcp-trust/latest.json`
→ `counts.total: 500`, `counts.auth_challenged_401_403: 207`

**Pitch:**

> The NYDFS comment period for 23 NYCRR 202 closes September 21. At the
> same time, the protocol layer that AI agents use to interact with
> financial tools — MCP — has 500 internet-facing servers. 207 of them
> challenge with auth before answering. 19 answer openly.
>
> The overlap: agents that can hold money are knocking on servers that
> can challenge them. The stablecoin rule is about the money. The MCP
> census is about the doors.
>
> Snapshot: https://councilof.ai/interop/mcp-trust/latest.json
> Calendar: https://councilof.ai/dashboard (regulatory doors)
>
> Counts only — no host names, no grades.

---

## 2. Reuters — technology policy

**Editor:** Jeffrey Dastin (AI policy beat)

**Angle:** "311 signed measurement cards across 22 governance axes — what a public, independently verifiable AI measurement corpus actually looks like."

**Artifact:** `GET https://councilof.ai/root.json` → `card_count: 311`

**Pitch:**

> We've built a public AI measurement corpus: 311 signed cards across
> 22 governance axes drawn from statute. Each card is Ed25519-signed,
> Merkle-anchored, and independently verifiable — no account, no API
> key, no login.
>
> The interesting policy question: what does "measurement, not
> certification" mean in practice? We publish what we found, including
> the gaps. UNMEASURED cells stay visible. Corrections are append-only,
> starting with our own errors.
>
> Root: https://councilof.ai/root.json
> Board: https://councilof.ai/api/gspc
> Verify: python3 tools/verify/csoai_verify.py <card-url>
>
> This is evidence, not a recommendation.

---

## 3. The Verge — AI & consumer tech

**Editor:** James Vincent (AI beat)

**Angle:** "We probed 500 MCP servers. The median server reports 3 tools. Here's what the AI agent infrastructure actually looks like right now."

**Artifact:** `GET https://councilof.ai/interop/mcp-trust/latest.json`
→ `counts.tools_median_per_answering_server: 3.0`,
`counts.servers_reporting_tools: 238`

**Pitch:**

> MCP is the protocol that lets AI agents call tools — browse, code,
> pay, measure. We run a weekly handshake census of 500 internet-facing
> MCP servers.
>
> The surprising number: the median answering server reports just 3
> tools. 238 servers reported tools at all. 207 challenged with auth
> before answering anything. 19 answered openly.
>
> No host names, no grades, no rankings. Just: how many answered,
> under what posture, and how many tools they report.
>
> Snapshot: https://councilof.ai/interop/mcp-trust/latest.json
> Board: https://councilof.ai/trust
>
> Measurement, not certification.

---

## 4. Wired — security & privacy

**Editor:** Lily Hay Newman (security beat)

**Angle:** "An x402 payment door conformance census — 100 hosts probed, and what 'conformant' actually means when the protocol is3 months old."

**Artifact:** `GET https://councilof.ai/interop/x402-trust/latest.json`
→ `counts.total: 100`

**Pitch:**

> x402 is the HTTP-native micropayment protocol that lets AI agents pay
> for resources. We've been running a weekly conformance census — 100
> public hosts so far.
>
> The probe is strict: send a real HTTP request, check whether the door
> returns a proper 402 challenge with the right schema. No payment
> attempted, no security grading, no host names published.
>
> What we can say: how many doors answer a correct challenge, how many
> are phantom (listed but unreachable), and how the numbers changed.
>
> Snapshot: https://councilof.ai/interop/x402-trust/latest.json
> Methodology: https://councilof.ai/trust
>
> Measurement, not certification.

---

## 5. Ars Technica — security & policy

**Editor:** Dan Goodin (security beat)

**Angle:** "Ed25519-signed measurement cards with Merkle inclusion proofs — how an append-only corrections ledger works when the measurer publishes its own errors first."

**Artifact:** `GET https://councilof.ai/refutation-ledger` (corrections ledger)

**Pitch:**

> We publish signed measurement cards — 311 so far, each Ed25519-signed
> under a published DID and anchored to a Merkle root. The interesting
> security property: corrections are append-only, and the ledger starts
> with our own errors.
>
> A signed card is not a guarantee of correctness. It's a guarantee that
> the bytes haven't been tampered with since signing. If we were wrong,
> the correction supersedes (never deletes) the original.
>
> Ledger: https://councilof.ai/refutation-ledger
> Verify: python3 tools/verify/csoai_verify.py <card-url>
>
> The verification CLI is open source. No account required.

---

## 6. The Register — enterprise AI

**Editor:** Thomas Claburn (AI/enterprise beat)

**Angle:** "13 MCP tools, zero dependencies, one npm package — what an AI measurement server looks like when it's built to measure, not sell."

**Artifact:** `POST https://councilof.ai/mcp` → `tools/list` returns 13 tools.
Source: `mcp/gspc-server/index.mjs` (zero deps, stdio).

**Pitch:**

> We built an MCP server that measures AI systems and publishes signed
> evidence. 13 tools (9 free, 4 x402-metered), zero runtime
> dependencies, single npm package.
>
> The design choice: every tool returns what we observed, not what we
> recommend. `mcp_trust` returns a snapshot of 500 internet-facing MCP
> servers. `verify_card` checks an Ed25519 signature against a pinned
> DID. `board_totals` returns live counts.
>
> Install: `npx -y csoai-gspc-mcp`
> Source: https://github.com/CSOAI-ORG/councilof-ai/tree/master/mcp/gspc-server
>
> Zero dependencies. Measurement, not certification.

---

## 7. VentureBeat — AI infrastructure

**Editor:** Sharon Goldman (AI enterprise beat)

**Angle:** "The MCP trust board — 500 servers probed weekly, auth posture distribution published, no host names. What 'measurement, not certification' looks like at protocol scale."

**Artifact:** `GET https://councilof.ai/interop/mcp-trust/latest.json`
→ full snapshot with `enumeration`, `counts`, `partial` fields.

**Pitch:**

> The MCP ecosystem has 500 internet-facing servers. We probe them
> weekly — one initialize handshake per host, tools/list only if the
> handshake answers, tools counted but never called.
>
> What we publish: counts by auth posture (open, bearer/OAuth,
> unspecified), tool count distribution, and whether the round was
> partial. What we withhold: host names, by doctrine.
>
> The board: https://councilof.ai/trust
> The snapshot: https://councilof.ai/interop/mcp-trust/latest.json
>
> A partial round is marked partial. A cap change is disclosed.
> Measurement, not certification.

---

## 8. The Information — enterprise AI

**Editor:** Cory Weinberg (enterprise AI beat)

**Angle:** "An x402 micropayment rail with a $0.02 issuance atom — what 'measurement, not certification' looks like when it's metered per-card, not per-seat."

**Artifact:** `functions/api/_skus.ts` — issuance SKU at $0.02 per card.
Live settlements: `GET https://councilof.ai/api/revenue`

**Pitch:**

> CSOAI charges $0.02 per signed measurement card — not per seat, not
> per user, not per month. The atom is one card: one subject, one
> frozen probe, one timestamp, one Ed25519 signature.
>
> The interesting enterprise question: what does "measurement as a
> service" look like when the unit is an artifact, not a subscription?
> The buyer pays for the issuance work and the durable signature —
> the answer itself is independently recomputable for free.
>
> Revenue: https://councilof.ai/api/revenue
> Board: https://councilof.ai/api/gspc
> SKUs: documented in functions/api/_skus.ts (source-available)
>
> No grade is sold. The board stays free.

---

## 9. Decrypt — crypto & web3

**Editor:** Sander Lutz (crypto regulation beat)

**Angle:** "100 x402 payment doors probed — what 'conformant' means when the protocol is the payment rail for AI agents."

**Artifact:** `GET https://councilof.ai/interop/x402-trust/latest.json`

**Pitch:**

> x402 is the HTTP-native micropayment protocol — AI agents use it to
> pay for resources without human intervention. We've probed 100 public
> x402 doors to see how many answer a correct 402 challenge.
>
> The probe doesn't attempt payment. It checks whether the door returns
> the right schema when an agent knocks. Phantom doors (listed but
> unreachable) are counted separately.
>
> Snapshot: https://councilof.ai/interop/x402-trust/latest.json
> Board: https://councilof.ai/trust
>
> Counts only. No host names, no grades.

---

## 10. Protocol (now part of Politico) — enterprise tech policy

**Editor:** Shakeel Hashim (AI infrastructure policy beat)

**Angle:** "22 governance axes drawn from statute — how an independent measurement body maps AI behaviour to regulatory obligations without certifying compliance."

**Artifact:** `GET https://councilof.ai/api/gspc` → `measured_axes: 22`

**Pitch:**

> CSOAI measures AI systems across 22 governance axes drawn from
> statute — governance, safety, provenance, continuity, care,
> jail containment, and more. Each axis has a frozen instrument,
> a published scoring method, and a signed result.
>
> The policy question: what's the difference between "measured against
> statute" and "compliant with regulation"? We publish the measurement.
> Compliance is the entity's and its auditor's call.
>
> Board: https://councilof.ai/api/gspc
> Axes: https://councilof.ai/api/state (board section)
>
> Measurement, not certification. Empty cells stay empty.

---

*Ten editors, ten artifacts, ten evidence-led angles. Every number is fetchable.*
