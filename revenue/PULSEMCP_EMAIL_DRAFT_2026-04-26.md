# PulseMCP submission email — to send via Gmail

**To:** hello@pulsemcp.com
**From:** nicholastempleman@gmail.com (or nicholas@csoai.org if you prefer)
**Subject:** Add 5 MEOK AI Labs EU compliance MCPs to PulseMCP

---

Hi PulseMCP team,

Saw your "auto-ingest from Official MCP Registry weekly" note on the submit page. I'm working on the Official Registry publish flow this week (server.json + mcpName already in repos, just need to wire up the GitHub Actions OIDC publish), but in the meantime I wanted to give you a heads-up on 5 EU compliance MCPs that fit a category I don't see well represented on PulseMCP yet:

1. **meok-omnibus-tracker-mcp** — https://github.com/CSOAI-ORG/meok-omnibus-tracker-mcp — Track all 8 EU AI Act + GDPR + DORA Digital Omnibus cliff dates and live status of every regulatory delay.
2. **meok-watermark-attest-mcp** — https://github.com/CSOAI-ORG/meok-watermark-attest-mcp — EU AI Act Article 50 watermarking (C2PA, content provenance, deepfake disclosure). Hits the August 2026 cliff.
3. **meok-cra-annex-iv-classifier-mcp** — https://github.com/CSOAI-ORG/meok-cra-annex-iv-classifier-mcp — EU CRA (Reg 2024/2847) Annex IV essential security requirements classifier with HMAC-signed compliance attestations.
4. **meok-nis2-de-register-mcp** — https://github.com/CSOAI-ORG/meok-nis2-de-register-mcp — Germany NIS2 BSI register product — Section 30/32 reporting timelines and KRITIS classifications.
5. **meok-mcp-injection-scan-mcp** — https://github.com/CSOAI-ORG/meok-mcp-injection-scan-mcp — 30+ canonical detection rules across 5 severity tiers for the April 2026 Anthropic MCP RCE class.

All 5:
- Are live public repos with Dockerfile, `glama.json`, `smithery.yaml`, `server.json`, and `mcpName` (`io.github.CSOAI-ORG/<repo>`) entries
- Are published on PyPI under the `MEOK_AI_Labs` namespace (versions 1.0.0 / 1.0.1)
- Ship with HMAC-signed compliance attestations verifiable at https://meok-attestation-api.vercel.app
- Are MIT-licensed
- Have public homepages at https://meok.ai

Happy to wait for the next weekly auto-ingest if you're already pulling from registry.modelcontextprotocol.io — just wanted to make sure they're on your radar given the November 2026 EU cliff is genuinely time-sensitive for compliance teams.

If a manual add is faster, the GitHub URLs above are all you need.

Thanks,
Nicholas Templeman
MEOK AI Labs · https://meok.ai
nicholas@csoai.org
CSOAI LTD (UK Companies House 16939677)
