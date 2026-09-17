# DRAFT — NOT SUBMITTED

**Status: NOT SUBMITTED. Nothing here has been sent to the MCP Registry project,
filed as an issue, or posted as a comment.** It is a local reproduction kept
beside our validation stage so the defect we guard against is written down in the
form its maintainers would need if we ever chose to send it. Sending is an
owner decision that has not been made.

Upstream reference: MCP Registry issue #1546 (opened 19 August 2026) — registry
accepts and serves `server.json` records with an empty `repository: {}`.

## Reproduction (verified 2026-09-17)

```
$ curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=ai.alpic.test/test-mcp-server"
```

Returns HTTP 200 with:

```json
{
  "server": {
    "$schema": "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json",
    "name": "ai.alpic.test/test-mcp-server",
    "description": "Alpic Test MCP Server - great server!",
    "repository": {},
    "version": "0.0.1",
    "remotes": [{"type": "streamable-http", "url": "https://test.alpic.ai/"}]
  }
}
```

The schema that record itself declares says:

```json
"Repository": {
  "type": "object",
  "required": ["url", "source"],
  ...
}
```

So the served record does not validate against its own declared `$schema`:

```
$.repository | 'url' is a required property
$.repository | 'source' is a required property
```

Minimal check, no network (schema is cached in `schema-cache/`):

```
python3 scripts/census/registry_schema_validation.py \
    scripts/census/fixtures/registry-records/empty-repository-mcp-1546.json
```

## Not confined to the test record

A bounded sample of 500 records taken 2026-09-17 (convenience sample in
pagination order — **not** the population, and not extrapolated) found four
records that fail their own declared schema. Three of them are the `repository: {}`
shape, and two of those are not test records:

| record | declared schema | violation |
|---|---|---|
| `ai.agentrapay/agentra@1.0.0` | 2025-07-09 | `repository` missing `url`, `source` |
| `ai.alpic.test/test-mcp-server@0.0.1` | 2025-09-29 | `repository` missing `url`, `source` |
| `ai.anzenna/anzenna@0.1` | 2025-09-29 | `repository` missing `url`, `source` |
| `ai.aliengiraffe/spotdb@0.1.0` | 2025-09-29 | `packages[0]` missing `version` |

So the gap spans at least two schema versions and is not an artefact of one
deliberately-odd test entry.

## What we did about it on our side

We did not wait on an upstream fix and we did not treat the records as ours to
correct. We added a validation stage that keeps registry PRESENCE and schema
VALIDITY as separate recorded facts — see `registry_schema_validation.py` and
`test_registry_schema_validation.py` in this directory. The record above is
pinned as a regression fixture so the defect cannot quietly stop being visible
to us.
