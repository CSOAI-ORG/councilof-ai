# Cold Outreach — Day 5: PyPI Organic + MCP Registry

**Subject:** New compliance MCPs on PyPI — worth a look

**Target:** Python developers, AI engineers, DevOps/platform engineers at companies with AI systems

**Body:**

Hi [Name],

We just published 38 MCP servers to PyPI covering EU AI Act, DORA, and AI supply-chain compliance. All MIT licensed, all free to use:

```
pip install meok-eu-ai-act-compliance
pip install meok-dora-compliance
pip install meok-ai-bom
```

Each one generates cryptographically signed attestation URLs you can verify at proofof.ai — no account needed, no vendor lock-in.

If you're building AI systems that will need regulatory compliance, these are worth bookmarking for when August hits.

 Nicholas
MEOK AI Labs
https://pypi.org/user/meok-ai/

---

**Follow-up (if no reply in 5 days):**
Subject: Re: PyPI MCPs — one more thing

Hi [Name],

One use case I didn't mention: if you have MCP-connected AI agents in production, the `agent-audit-logger-mcp` tracks every tool call with a signed audit trail. Useful for SOC 2, ISO 27001, and AI Act Article 13 audit evidence.

pip install meok-agent-audit-logger

 Nichols