Title: Show HN: EU AI Act compliance MCP with the Digital Omnibus Act delay built in

Text:
We're shipping an open-source MCP (Model Context Protocol) server that has the EU Digital Omnibus Act (7 May 2026) delay built into the tooling.

Every compliance vendor (Verifywise, OneTrust, TrustArc, Big 4) is still telling customers "37 days to the EU AI Act cliff." They're wrong.

The 7 May 2026 EU Digital Omnibus Act political agreement delayed Annex III high-risk AI provisions from 2 Aug 2026 to 2 Dec 2027. But Article 50 transparency + watermarking is NOT delayed — still bites in 36 days.

Our `eu-ai-act-compliance-mcp` returns the correct deadlines:
- Article 50: 36 days (NOT delayed)
- Annex III: 523 days (DELAYED 16 months)
- Annex I: 767 days (DELAYED 12 months)

We also built:
- `article50_passport_issue` — issue C2PA watermarked passports for the 36-day window
- `orgkernel_register_identity/log_execution/assert_compliance/verify_chain` — Apache-2.0 fork of MetapriseAI OrgKernel's 3-layer audit pattern
- `federated_rag` — single-call RAG over the 1,232-file vault + 341-MCP federation
- `lapis_dashboard` — real-time alchemical Salt/Sulfur/Mercury balance of the substrate
- `proactive_assess` — 7 triggers that watch your shell history, disk, sigils, windows

19 published MCPs at github.com/CSOAI-ORG. 2,500+ OLM training samples. 128 SOV3 tools live on the substrate. Sovereign substrate v2.0.0.

The whole stack is open source. The Article 50 passport tool is free for the first 50 calls/day. Pro tier is £79/mo with Ed25519 attestation.

Repo: https://github.com/CSOAI-ORG
Demo: https://csoai.org/article-50-passport/
Analysis: https://csoai.org/content/omnibus-delay/

The cliff moved. We're the only compliance tooling that knows.