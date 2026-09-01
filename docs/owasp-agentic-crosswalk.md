# OWASP Agentic Top 10 ↔ GSPC controls — Council of AI

**Status:** informative crosswalk. **Cite OWASP. Do not claim endorsement, partnership, or certification.**  
**Board lock:** live GET https://councilof.ai/api/gspc = **22 · 15 · 7**. Empty stays empty. Never MEASURED-from-listing. Never certify.

**Source (cite):** OWASP Top 10 for Agentic Applications 2026 (ASI01–ASI10).  
This document maps those risks to **existing** Council of AI / GSPC controls and halts. It is not an OWASP product and is not endorsed by OWASP.

**Surface:** `owasp.control` (card-v0 evidence leaf only — never a badge).

| ASI | Risk (OWASP label class) | GSPC / harness control or halt |
|---|---|---|
| ASI01 | Goal hijack | halt-on-unsigned-leaf; goal-change tracking; unsigned stays unsigned until n≥30 + 4way + keystone |
| ASI02 | Tool misuse | least-privilege MCP tools; approval gates; no laptop/3090/MetaMask key |
| ASI03 | Identity / privilege abuse | separate user / agent / service identities; Ed25519 keystone only; DID assertionMethod honesty |
| ASI04 | Supply chain | signed cards only for SIGNED path; no untrusted MCP; Cobalt leave alone |
| ASI05 | Code execution | no eval; sandboxed mill; mill deleted from public JS |
| ASI06 | Memory poisoning | immutable root; no silent overwrite; no second writer of `root.json` |
| ASI07 | Inter-agent communication | signed A2A messages only; harness authority over clients |
| ASI08 | Cascading failures | halt-on-split; one board; clients do not mint MEASURED |
| ASI09 | Human trust / over-reliance | TIE is TIE; no certified badge; never claim OWASP/Microsoft endorsement |
| ASI10 | Rogue agents | drift delta (N→N+1); re-attestation window; request flywheel (x402) |

## Hard stops (owner)

Second writer of `root.json` · key on laptop/3090/MetaMask · fill 7 empties · MEASURED-from-listing · claim OWASP/Microsoft endorsement · treat COBOL Bridge as external · paywall `/root.json` · 23/22.

## Notes

- Microsoft Agent Framework + Channels = **supported MCP client/runtime**; our harness stays authority.
- COBOL Bridge (`CSOAI-ORG/cobol-bridge-mcp`) = **ours**, Layer-0, `surface=cobol.legacy`, same root.
- Chain witnesses the **root hash only** (XRPL DID/memo, ERC-8325, Rekor v2, OTS→Bitcoin). Online: live GET. Offline: recompute hash + verify sig.
