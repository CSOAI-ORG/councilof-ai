# awesome-a2a PR — Council of AI

Add under **Measurement & Governance** (or create that section):

```markdown
### Measurement & Governance

- **[Council of AI](https://councilof.ai)** — Independent AI-governance measurement body (CSOAI Ltd, UK 16939677). GSPC 14-slot board (13 measured of 14), Ed25519-signed evidence, free offline verify. Measurement, not certification.
  - Agent card (A2A v1.0): https://councilof.ai/.well-known/agent-card.json
  - JSON-RPC: `POST https://councilof.ai/api/mcp` (`tools/list`, `tools/call`)
  - Full manifest: https://councilof.ai/.well-known/agent.json
  - DOI: https://doi.org/10.5281/zenodo.21991104
```

## PR body

**Title:** Add Council of AI — GSPC measurement agent (A2A v1.0)

**Description:**

Council of AI publishes the GSPC governance measurement instrument — 13 of 14 registry axes measured with frozen item banks and offline-verifiable Ed25519 credentials.

- Live A2A v1.0 agent card at `/.well-known/agent-card.json` (8 required fields)
- MCP JSON-RPC endpoint at `/api/mcp` proxies measured board APIs
- Explicitly not: certification, accreditation, conformity assessment

Agent card validates against A2A v1.0 required fields. Happy to adjust section placement.

## Commands

```bash
git clone https://github.com/<awesome-a2a-org>/awesome-a2a.git
cd awesome-a2a
# edit README.md with entry above
git checkout -b add-council-of-ai
git commit -am "Add Council of AI measurement agent"
git push -u origin add-council-of-ai
gh pr create --title "Add Council of AI — GSPC measurement agent" --body-file distribution/a2a/awesome-a2a-pr.md
```
