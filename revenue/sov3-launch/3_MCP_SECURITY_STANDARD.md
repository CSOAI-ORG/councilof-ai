# The MCP Security & Governance Standard (MSGS) — v0.1 Outline
**Prepared for:** Nick Templeman, SOV3 · **Why this is the crown jewel:** standards bodies capture markets. When the web needed trust, certificate authorities became billion-dollar businesses. MCP is exploding and has no security-certification layer. Publishing the standard *first* — openly, rigorously — makes SOV3 the authority without smearing anyone.

> **The move:** you don't attack the MCP ecosystem's weaknesses, you *fix* them in public. That's "fight evil with good" — and good is what becomes infrastructure.

---

## A. Why now (the real, verifiable gap)

- MCP is at genuine scale: ~10k+ public servers (Anthropic, Dec 2025), ~15.9k `mcp-server` GitHub repos (May 2026), ~97M monthly SDK downloads — every major host (Claude, Cursor, ChatGPT desktop, OpenAI Agents SDK, Bedrock AgentCore) speaks it.
- The threat is real and *already demonstrated*: **CVE-2026-25253** — a one-click RCE class in a popular MCP control UI that auto-trusted a `gatewayUrl` query param and leaked the auth token; 40k+ instances exposed ([NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-25253)). This is the motivating example — cited as *"the class of bug a standard prevents,"* not as a weapon against any vendor.
- There is **no** established security-certification or trust framework for MCP servers. That's the vacuum SOV3 fills.

## B. Scope of MSGS v0.1

A certifiable security baseline for any MCP server. Five control domains:

1. **Origin & connection trust** — no auto-connecting to attacker-supplied URLs; explicit user consent for new gateways; no token leakage to unverified endpoints. *(Directly closes the CVE-2026-25253 class.)*
2. **Authentication & secrets** — token handling, scope minimization, no secrets in query strings/logs, rotation support.
3. **Tool-call authorization** — least privilege per tool, explicit allow-lists, confirmation gates for state-changing/destructive actions.
4. **Input/output safety** — injection resistance (incl. prompt-injection via tool output), schema validation, output sanitization.
5. **Auditability** — tamper-evident logs of tool invocations, sufficient for EU AI Act-style oversight and incident reconstruction.

## C. Certification tiers (the product + the moat)

| Tier | What it means | How SOV3 monetizes |
|---|---|---|
| **MSGS-Self** | Self-attested against the public checklist | Free → top-of-funnel, drives adoption of the standard |
| **MSGS-Verified** | SOV3 runs the automated audit suite against the server | Paid per-server / subscription |
| **MSGS-Certified** | Verified + periodic re-test + listed in the registry | Premium; renewal revenue; the "trust badge" buyers look for |

The standard is **open** (anyone can read/implement). The **verification and registry** are SOV3's business. Same model as TLS: the spec is free, being the CA is the business.

## D. Governance that keeps it credible (and keeps *you* out of trouble)

- **Publish the spec under an open license.** A standard nobody can read isn't a standard, it's a brochure.
- **Invite an advisory group** (even informal at first) — credibility comes from not being a single vendor's marketing doc.
- **Apply MSGS to SOV3's own MCP packages first, publicly.** You ship ~316 of them. Certify your own, show the results warts-and-all. This is the inverse of the "they have a CVE = they're frauds" trap: you hold *yourself* to the standard first, which is exactly what earns the authority to certify others.
- **No "X failed our audit" press.** Certify the willing; let absence from the registry speak for itself.

## E. Launch sequence

1. **Now → July 4:** publish MSGS v0.1 spec + the free self-attestation checklist at a clean URL.
2. **July 4 launch:** announce SOV3 as "the platform that governs MCP" with MSGS as the standard behind it; show SOV3's own packages certified.
3. **Post-launch:** open MSGS-Verified audits; build the public registry; pitch it to the MCP community (Anthropic registry, PulseMCP, Smithery) as a complementary trust layer, not a competitor.

## F. The one-line positioning

> **"MCP gave AI agents hands. MSGS makes sure they're clean. SOV3 is the standard."**

---

### Why this beats the "smear the incumbents" plan on every axis
- **Durable:** a standard compounds; a hit-piece is a news cycle.
- **Legal:** you're publishing safety criteria, not accusations.
- **On-brand:** a *trust* company earns trust by raising the floor, not by throwing mud.
- **Defensible:** when an incumbent copies it, they're ratifying *your* standard.
