# Venue lanes — tonight's CLIs

Executable tonight without owner gate unless noted.

## HuggingFace

```bash
hf auth login                                    # write token
bash scripts/hf-publish-leaderboard.sh           # Space + results dataset
# Per-axis dataset cards: copy hf/datasets/dataset-card-template.md → Hub README, assign DataCite DOI in Settings
node scripts/hf-submit-result.mjs hf/datasets/results-submission-template.json
```

| Asset | Target |
|-------|--------|
| Leaderboard Space | `csoai/gspc-governance-leaderboard` |
| PR results dataset | `csoai/gspc-leaderboard-results` |
| Axis datasets | `csoai/gspc-gov`, `gspc-agi`, … per `NAMING.md` |
| DOI | Zenodo concept `10.5281/zenodo.21991104` + per-dataset DataCite on HF |

## MCP Registry v1.0.2

```bash
cd mcp/csoai-governance
npm publish --access public   # csoai-governance-mcp@1.0.2
mcp-publisher login github
bash ../../distribution/mcp-registry/publish.sh
```

Manifest: `mcp/csoai-governance/server.json` (repository, title, packages restored).

## A2A v1.0

Live card: `public/.well-known/agent-card.json` (8 required fields).

```bash
curl -sS https://councilof.ai/.well-known/agent-card.json | jq 'keys'
# Submit PRs using drafts in distribution/a2a/
```

| Submission | Draft |
|------------|-------|
| awesome-a2a | `distribution/a2a/awesome-a2a-pr.md` |
| agentcard.net | `distribution/a2a/submissions/agentcard-net.md` |
| a2a-protocol.org | `distribution/a2a/submissions/a2a-protocol-registry.md` |
| a2a-samples | `distribution/a2a/submissions/a2a-samples-pr.md` |

## Data marketplaces

| Venue | Tonight | Owner gate |
|-------|---------|------------|
| ADX | `bash distribution/data-marketplaces/adx/stage.sh` | submit |
| Snowflake | draft in `snowflake/listing-draft.md` | seller-of-record |
| Datarade | draft in `datarade/application-draft.md` | paid plans |

## Insurance

| Asset | Path |
|-------|------|
| 4-doc evidence pack | `distribution/insurance/evidence-pack/` |
| Outreach | `distribution/insurance/outreach/DRAFT-unsent.md` — **UNSENT** |

## Verify after deploy

```bash
curl -sS -X POST https://councilof.ai/api/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools[].name'
curl -sS https://councilof.ai/.well-known/agent-card.json | jq '.supportedInterfaces'
```
