# A2A directory submission — Google A2A samples / ecosystem list

**Status:** Ready to submit (not yet filed)

## Pull request target

Repository: `a2aproject/a2a-samples` (or current ecosystem examples repo per https://github.com/a2aproject/a2a)

## Proposed addition

**`samples/agents/councilof-ai/README.md`**

```markdown
# Council of AI — Measurement Agent

- Agent card: https://councilof.ai/.well-known/agent-card.json
- Transport: JSON-RPC 1.0 at https://councilof.ai/api/mcp
- Skills: GSPC board, East-West cross-jurisdiction board, benchmark-quality register

## Handshake

\`\`\`bash
curl -sS -X POST https://councilof.ai/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
\`\`\`

Measurement, not certification. UK Companies House 16939677.
```

## PR title

`Add Council of AI measurement agent sample (GSPC board)`
