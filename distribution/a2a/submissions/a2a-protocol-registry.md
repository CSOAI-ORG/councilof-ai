# A2A directory submission — a2a-protocol.org community registry

**Status:** Ready to submit (not yet filed)

## Agent record

```json
{
  "name": "Council of AI — Measurement Agent",
  "agentCardUrl": "https://councilof.ai/.well-known/agent-card.json",
  "homepage": "https://councilof.ai",
  "provider": "CSOAI Ltd",
  "category": "measurement",
  "tags": ["governance", "benchmark", "verification", "eu-ai-act"],
  "protocolVersion": "1.0",
  "endpoint": "https://councilof.ai/api/mcp"
}
```

## Notes for maintainers

- Card uses A2A v1.0 required fields (name, description, version, supportedInterfaces, capabilities, defaultInputModes, defaultOutputModes, skills).
- `explicitly_not` in card: certification, accreditation, conformity-assessment.
- Zenodo concept DOI: 10.5281/zenodo.21991104

## Submit

Follow the registry process at https://a2a-protocol.org/ — attach agent card URL and await validation.
