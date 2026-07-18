# 🟢 VERIFIED — MCP STDIO RCE (Cowork blocker #2) + the authority play (2026-06-25)
Browser-verified the claim before any authority post (same discipline as the diamonds).

## Real, multi-source
- **OX Security** — "MCP STDIO Command Injection: Full Vulnerability Advisory" + "The Architectural Flaw at the Core of Anthropic's MCP" (15 Apr 2026): systemic command injection in Anthropic's MCP protocol, **150M+ downloads** affected, "by design / architectural."
- **Cloud Security Alliance** — "MCP by Design: RCE Across the AI Agent Ecosystem" (2026-04-20): independent corroboration.
- **CVE-2026-30623** — command injection via Anthropic's MCP stdio transport; fixed downstream in **LiteLLM ≥ 1.83.6-nightly / 1.83.7-stable**.
  (Reconcile vs `intel-2026-06-23` memory's "CVE-2026-42271 CVSS10 patched ≥1.83.7" — likely a related/second LiteLLM CVE; confirm both are covered by the ≥1.83.7 pin in `meok-agent-zero`.)

## The play (legit, grounded)
- **MEOK owns the mitigation locally:** `meok-mcp-injection-scan` (in `clawd/apify-actors/` + `clawd/mcp-marketplace/meok-mcp-injection-scan-mcp` + gateway registry templates). A real, ecosystem-wide RCE (150M+ downloads) that MEOK has a scanner for = a genuine authority + product angle (pair with the OpenClaw CVE note).
- **Fleet hygiene:** confirm every MEOK component using MCP stdio / LiteLLM is on ≥1.83.7.

## M4 ↔ Cowork — the 5 ship-blockers split
1. Medical false-clear → **M4 ✅ fixed + verified** (`EU_AI_ACT_MEDICAL_FIX_2026-06-25.md`), pending publish.
2. MCP STDIO RCE advisory → **verified real (this doc)**; mitigation MCP local; advisory = content task next.
3. proofof price/Stripe + repo reconcile → **lane/owner** (proofof repo not on M4; deploy-gated).
4. Omnibus/NIS2/CRA → **FACTS.yaml** → **Cowork's lane** (file is VM-side, NOT on M4 — only `extracted_facts.json` is local).
5. Roll key → send 3 drafts → **NICK** (owner-gated).
→ M4 owns #1 (done) + #2 (verified); #3/#4/#5 are Cowork/lane/owner. Swarm converging, not duplicating.
