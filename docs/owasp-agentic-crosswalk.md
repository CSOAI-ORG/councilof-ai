# OWASP Agentic Top 10 ↔ GSPC controls /halts

**Status:** informative crosswalk only. **Cite OWASP. Do not claim endorsement, partnership, certification, or notified-body status.**  
**Board lock (re-GET, never freeze):** `GET https://councilof.ai/api/gspc` = **22 · 15 · 7**. Empty stays empty. Never MEASURED-from-listing. Never certify. No 23/22.

**Source (cite OWASP):** [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) (ASI01–ASI10; announced 9 Dec 2025, OWASP GenAI Security Project / Agentic Security Initiative).  
Announcement naming ASI01–ASI10: https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/

This document maps those risks to **existing** Council of AI / GSPC controls and halts. It is **not** an OWASP product and is **not** endorsed by OWASP. Mapping a risk to a control does not mean the control fully covers the risk.

**card-v0 surface:** `owasp.control` — evidence leaf only, never a badge.

---

## Owner-named GSPC controls /halts

| Control / halt | What it does (ours) |
|---|---|
| `halt-on-unsigned-leaf` | Refuse to promote / seal leaves that are not signed |
| `halt-on-split` | Refuse when signed and published trees diverge |
| `halt-on-missing-key` | Exit closed if board sign key is absent |
| no laptop key | Signing key never on laptop / 3090 / MetaMask / Cursor / Workers |
| least-privilege MCP | Tools only as declared; no undeclared agency |
| signed cards only | SIGNED path = signed:true + n≥30 + 4way + keystone |
| immutable root | Public root merkle; unsigned leaves do not rewrite history |
| signed A2A | Inter-agent cards / messages must verify |
| TIE is TIE | Point-estimate lead is not a separated win |
| drift + re-attest | Re-measure / re-attest when living facts move; never freeze a lie |

---

## Map ASI01–ASI10 → GSPC controls /halts (exactly as owner listed)

| ASI | Risk (OWASP title) | Primary GSPC controls /halts | Related board / surface (cite, not grade) |
|---|---|---|---|
| ASI01 | Agent Goal Hijack | least-privilege MCP; signed cards only; TIE is TIE (no invented win that redirects scope) | art5-safeguard, affect, jail floor |
| ASI02 | Tool Misuse & Exploitation | least-privilege MCP; halt-on-unsigned-leaf | conformance (MCPBench), MCP door |
| ASI03 | Identity & Privilege Abuse | no laptop key; halt-on-missing-key; signed A2A | DID / `.well-known/did.json`; agent-card |
| ASI04 | Agentic Supply Chain Vulnerabilities | signed cards only; immutable root; halt-on-unsigned-leaf | bank_host HF banks; Zenodo methodology DOI; site_attestation |
| ASI05 | Unexpected Code Execution | jail floor (containment measurement); least-privilege MCP | jail MEASURED floor (TIE); not a 16th ranked pane |
| ASI06 | Memory & Context Poisoning | signed cards only; halt-on-split; drift + re-attest | Ore ingest gate; living GET over frozen table |
| ASI07 | Insecure Inter-Agent Communication | signed A2A; least-privilege MCP | A2A agent-card / agent.json; no second world |
| ASI08 | Cascading Failures | halt-on-split; halt-on-unsigned-leaf; TIE is TIE (no cascade of fake wins) | swarm; Space printers not engines |
| ASI09 | Human-Agent Trust Exploitation | TIE is TIE; never certify; empty slots stay empty | scoreboard honesty; `/gspc-verify` free |
| ASI10 | Rogue Agents | no laptop key; halt-on-missing-key; drift + re-attest; signed cards only | KEEP 3090; mine OFF from Hive; Ore hopper shut |

ASI ids are **not** GSPC axes. `get_axis("ASI01")` → **NOT_ON_BOARD**. Do not stamp UNMEASURED/MEASURED for an ASI id.

---

## Explicit non-claims

- Not an OWASP endorsement, certification, compliance badge, or partnership.  
- CSOAI is a measurement body, not a notified body.  
- Microsoft Agent Framework + Channels = **supported MCP client/runtime**; harness stays authority — not a Microsoft endorsement.  
- COBOL Bridge (`CSOAI-ORG/cobol-bridge-mcp`) = **ours**, `surface=cobol.legacy`, same root — not a competitor.  
- Chain / Rekor / OTS / SCITT / XRPL witness the **root hash only**.

## Hard stops

Second writer of `root.json` · key on laptop/3090/MetaMask · fill 7 empties · MEASURED-from-listing · claim OWASP/Microsoft endorsement · paywall `/root.json` · 23/22 · Cloud Agents · wrangler.

*Filed 1 Sep 2026 · Europe/London.*
