# Apify MCP Actor Deployment — 2026-06-13

## Result
**14/14 MEOK compliance MCP Actors deployed to Apify cloud under `knowing_yucca/` account.**

## The 14 actors

| Actor | Apify ID |
|-------|----------|
| meok-eu-ai-act-compliance-mcp | scB8rfyNyqHQFAIDf |
| meok-dora-compliance-mcp | 59N7sSfTt9HWWOpYP |
| meok-nis2-compliance-mcp | Aots7pPnSfs96MRQI |
| meok-cra-compliance-mcp | f2H5eFyvLs8pY3Qmv |
| meok-gdpr-compliance-ai-mcp | 7sRqm2ClMVHehrDup |
| meok-iso-42001-ai-mcp | fOBq1YGrBvDk1RP1Y |
| meok-bias-detection-mcp | 4dUbyqZZQc7hvORjB |
| meok-fda-samd-mcp | iE1uJ8n2xbeYAciHG |
| meok-canada-aida-ai-mcp | T4Tkn5hsXdcBlbF0J |
| meok-explainability-report-mcp | ni57st0V41cS4dDsq |
| meok-ai-bom-mcp | w4gW85afL3eIbhMLl |
| meok-ai-incident-reporting-mcp | P9EwMMWlSbIRxl7pZ |
| meok-agent-audit-logger-mcp | QtdxN9zL3rU6xKBHj |
| meok-nist-rmf-ai-mcp | oVbN0Vcm77iTnmL2o |

Total meok-* actors on Apify: 20 (6 pre-existed with similar names).

## Schema fixes applied

- `version: "1.0.0"` → `version: "1.0"` (Apify needs MAJOR.MINOR, not MAJOR.MINOR.PATCH)
- Input schema: removed invalid `editor` values, added `description` to all fields, used `select` for enums
- Output schema: added `actorOutputSchemaVersion: 1`, added `template` field, made `result` a string (JSON-stringified) instead of object

## Dockerfile fixes applied

- `FROM meok/mcp-base:latest` → `FROM python:3.11-slim` (the meok/mcp-base image was never pushed to Docker Hub)
- Inlined `pip install fastmcp==0.4.0 mcp==1.0.0 uvicorn==0.32.0 starlette==0.41.3` in each actor

## MCP URL pattern
`https://<actor-name>.apify.actor/mcp` — these are HTTP MCP servers (streamable-http transport).

## Next steps
- All return 401 (need API token) — same auth model as MCP registry. Same pattern: OAuth when user installs via Apify console.
- They show up in Apify store search immediately.
- Run the meter on them via the same `_server_meter_check` pattern as Python packages.

## Memory update
- Apify memory: `version: "1.0"` not `"1.0.0"`. Output schema needs `actorOutputSchemaVersion: 1` + per-field `template: "{{field_name}}"`. Dockerfile: don't reference private base images unless they're on Docker Hub. Apify 8GB free-tier memory limit — push serially if you have many actors.
