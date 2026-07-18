# MEOK ONE / SIGIL — Competitive Brief (overnight 2026-05-30)

## One-liner
NO competitor combines (a) signed message-level interchange + (b) human-readable + (c) compact deterministic + (d) EU AI Act Art 12 audit mapping. That 4-way combo IS SIGIL's moat. Window: Art 50 live 2 Aug 2026 (73 days).

## Landscape
- **GibberLink** (acoustic, fast, NO signing/audit — hackathon demo). **Latent-space comms** (arXiv, zero auditability — opposite of SIGIL). Semantic-protocol survey (arXiv 2604.02369) explicitly names "human-readable audit trails" as an OPEN GAP.
- **MCP security crisis:** ~43 CVEs in 60 days, 82% of 2,614 servers have path-traversal, CVE-2026-26030 Semantic Kernel RCE CVSS 9.8. Proposed fix (tool-description signing + server attestation) has NO production implementation → SIGIL-signed tool descriptions directly mitigate MCPoison-class attacks.
- **AAIF** formed Apr 2026 (Anthropic donated MCP to Linux Foundation; 170+ orgs). Q3 2026 joint MCP/A2A interop spec coming — window to submit SIGIL before it crystallizes.
- **A2A** v1.0, 150+ orgs, JWS Agent Cards (not universally deployed). **AP2** (Google, 60+ partners incl Mastercard) = signed VC-wrapped agent messages at scale = proof SIGIL's design works; but payment-only.
- **OpenRouter** $113M Series B (May 2026, ~$1.3B val, 25T tokens/wk) — building governance, NO signing/audit layer. Portkey/LiteLLM = audit logs, no crypto signing.
- ⚠️ A blockchain "SIGIL Protocol" (sigilprotocol.xyz, Solana, $SIGIL token) exists — MEOK SIGIL must differentiate: no blockchain, no token, transport-agnostic, EU-reg-native.

## Verdict: infrastructure first, then standard
1. Ship sigil-py + sigil-ts (zero-dep, Ed25519, wraps A2A/MCP) — drives attestation-API calls.
2. Monetize the live attestation API (verify endpoint).
3. Submit to AAIF once 100+ stars (fills the documented logging-mandate gap).

## Top 5 ship (prioritized, pre-Aug 2)
1. sigil-py/sigil-ts libs (~2d) — wrap A2A/MCP in SIGIL envelope.
2. meok-mcp-guard — MCP proxy that SIGIL-signs tool descriptions/responses (£299/mo or £799 kit) — rides the CVE crisis.
3. "SIGIL as your Art 12 log" one-pager + Stripe product (£499-4,999/yr).
4. AAIF GitHub issue/proposal on the logging gap (pre-Q3).
5. SIGIL routing receipts in the MEOK ONE router (enterprise differentiator OpenRouter can't match in 73 days).

## Moat sentence
"Every agent↔agent message is a SIGIL envelope: Ed25519-signed, human-readable, hash-chained — your Art 12 log IS the SIGIL stream." No separate logging infra. Nobody else has this.
