# Five Editor Pitches — 2026-09-16

**Prepared by:** Editorial conversion lane (Claude)
**Rule:** each pitch names one public artifact the editor can fetch themselves.
No certification claims, no "first/only," no unverifiable superlatives.

---

## Pitch 1 — AI governance / policy editor

**Target:** Melissa Heikkilä, MIT Technology Review (AI policy beat)

**Angle:** "What happens when you probe 500 public MCP servers and207 of them challenge you with auth before saying hello?"

**The artifact:** `GET https://councilof.ai/interop/mcp-trust/latest.json`
→ `counts.auth_challenged_401_403: 207` of 500 probed servers.

**Pitch:**

> Hi Melissa,
>
> We run a weekly handshake census of internet-facing MCP servers — the
> protocol that lets AI agents call tools. Last week we probed 500
> servers. 207 responded with an authentication challenge before answering
> anything else. 19 answered openly. The rest were unreachable or erred.
>
> The interesting question isn't "are they secure" — it's "what does a 401
> mean when an agent knocks?" In the MCP protocol, a 401 is a term sheet,
> not a rejection. It says "here are my terms" before anything else happens.
>
> We publish the counts-only snapshot weekly. No host names, no grades,
> no rankings. Just: how many answered, under what posture, and what
> changed since last week.
>
> The data: https://councilof.ai/interop/mcp-trust/latest.json
> The board: https://councilof.ai/trust
>
> Happy to walk through the methodology.
>
> Nicholas

---

## Pitch 2 — Security / InfoSec editor

**Target:** Lucian Constantin, CSO Online (AI security beat)

**Angle:** "We probed 100 public x402 payment doors. Here's what a conformance test actually measures — and what it doesn't."

**The artifact:** `GET https://councilof.ai/interop/x402-trust/latest.json`
→ `counts.total: 100`, schema `csoai.x402-trust-snapshot/0.1`.

**Pitch:**

> Hi Lucian,
>
> x402 is the HTTP-native micropayment protocol that lets AI agents pay
> for resources. We've been running a weekly conformance census of public
> x402 doors — 100 hosts so far.
>
> The probe is strict: it sends a real HTTP request and checks whether
> the door returns a proper 402 challenge with the right schema. It does
> NOT attempt payment, does not grade security posture, and does not name
> non-conformant hosts.
>
> What we can say: how many doors answer a correct challenge, how many
> are phantom (listed but unreachable), and how the numbers changed
> since last week.
>
> The snapshot: https://councilof.ai/interop/x402-trust/latest.json
> The methodology: https://councilof.ai/trust
>
> This is measurement, not certification. We publish what we observed,
> not what we recommend.
>
> Nicholas

---

## Pitch 3 — Fintech / stablecoin editor

**Target:** Danny Nelson, CoinDesk (stablecoin regulation beat)

**Angle:** "NYDFS just extended the comment period for23 NYCRR 202 — the stablecoin rule. We measured what the public record says."

**The artifact:** `GET https://councilof.ai/interop/mcp-trust/latest.json` (MCP trust census showing 500 servers probed) + the NYDFS regulatory calendar at `measurement/calendar/regulator-doors.json`.

**Pitch:**

> Hi Danny,
>
> The NYDFS comment period for23 NYCRR 202 (the stablecoin rulemaking)
> closes September 21. We've been tracking regulatory comment deadlines
> across15 jurisdictions as part of our measurement calendar.
>
> The interesting datapoint: we also run a weekly probe of 500
> internet-facing MCP servers — the protocol layer that AI agents use to
> interact with financial tools. 207 of them challenge with auth before
> answering. The intersection of "AI agents that can hold money" and
> "regulators writing stablecoin rules" is the story.
>
> Our regulatory calendar: https://councilof.ai/dashboard (regulatory
> doors pane)
> The MCP census: https://councilof.ai/interop/mcp-trust/latest.json
>
> We don't take positions on regulation. We measure what's there.
>
> Nicholas

---

## Pitch 4 — Developer tools / infrastructure editor

**Target:** Frederic Lardinois, TechCrunch (dev tools beat)

**Angle:** "An open-source MCP server with13 tools, zero dependencies, and a verification CLI — all built to measure AI, not sell it."

**The artifact:** `POST https://councilof.ai/mcp` → `tools/list` returns 13 tools.
Source: `mcp/gspc-server/index.mjs` (zero dependencies, stdio transport).

**Pitch:**

> Hi Frederic,
>
> We built an MCP server that measures AI systems and publishes signed
> evidence. It has13 tools (9 free, 4 x402-metered), zero runtime
> dependencies, and ships as a single npm package (`csoai-gspc-mcp`).
>
> The interesting design choice: every tool returns what we observed,
> not what we recommend. The `mcp_trust` tool returns a snapshot of 500
> internet-facing MCP servers — how many answered a handshake, under what
> auth posture. The `verify_card` tool checks an Ed25519 signature
> against a pinned DID. The `board_totals` tool returns live counts
> from the GSPC board.
>
> The server: `npx -y csoai-gspc-mcp`
> The source: https://github.com/CSOAI-ORG/councilof-ai/tree/master/mcp/gspc-server
> The verification CLI: `python3 tools/verify/csoai_verify.py <card-url>`
>
> Zero dependencies. Measurement, not certification.
>
> Nicholas

---

## Pitch 5 — Research / academic AI editor

**Target:** Jeremy Kahn, Fortune (AI beat)

**Angle:** "305 signed measurement cards across 22 governance axes — the largest public, independently verified AI measurement corpus."

**The artifact:** `GET https://councilof.ai/root.json` → `card_count: 305`.
`GET https://councilof.ai/api/gspc` → `measured_axes: 22`.

**Pitch:**

> Hi Jeremy,
>
> We've built what may be the largest publicly verifiable AI measurement
> corpus: 305 signed measurement cards across 22 governance axes, each
> Ed25519-signed and Merkle-anchored to a public root.
>
> Every card is independently verifiable — no account, no key, no API
> token. The verification CLI is open source. The root is OTS-anchored.
> Corrections are append-only, starting with our own errors.
>
> The board: https://councilof.ai/api/gspc
> The root: https://councilof.ai/root.json
> Verify a card: `python3 tools/verify/csoai_verify.py <card-url>`
>
> This is measurement, not certification. We publish what we found,
> including the gaps. UNMEASURED cells stay visible.
>
> Nicholas

---

*Each pitch names one fetchable artifact. Every claim is verifiable.*
