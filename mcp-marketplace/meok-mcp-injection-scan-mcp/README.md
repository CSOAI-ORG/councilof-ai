[![MCP Scorecard: 90/100](https://img.shields.io/badge/proofof.ai-90%2F100-5b21b6)](https://proofof.ai/scorecard/meok-mcp-injection-scan-mcp.html)

# meok-mcp-injection-scan-mcp

[![PyPI](https://img.shields.io/pypi/v/meok-mcp-injection-scan-mcp)](https://pypi.org/project/meok-mcp-injection-scan-mcp/) [![Python](https://img.shields.io/pypi/pyversions/meok-mcp-injection-scan-mcp)](https://pypi.org/project/meok-mcp-injection-scan-mcp/)

[![GitHub stars](https://img.shields.io/github/stars/CSOAI-ORG/meok-mcp-injection-scan-mcp)](https://github.com/CSOAI-ORG/meok-mcp-injection-scan-mcp/stargazers)


**Scan any MCP server for the prompt-injection / tool-poisoning / SSRF class disclosed in the April 2026 CVE wave.**

```
pip install meok-mcp-injection-scan-mcp
```

## Why This Exists

The EU AI Act's high-risk system provisions come into full force in **November 2026**. Companies deploying AI in healthcare, finance, education, law enforcement, and critical infrastructure face fines of up to **€35 million or 7% of global turnover**.

Most compliance teams spend **£360,000/year** on manual governance. This MCP server automates the entire process in minutes.

**Perfect for:**
- Compliance officers preparing for audits
- AI governance teams tracking regulatory deadlines  
- Consultants delivering AI readiness assessments
- Developers building compliant AI systems

---

## Why this exists

April 2026 was a bad month for MCP. Anthropic published a "by-design" MCP RCE class affecting ~7,000 public servers (~150M downloads). `mcp-server-git` shipped a CVE chain. DockerDash got popped by an injection chain. Tool-description prompt injection ("tool poisoning") was demonstrated against every major MCP host.

If you run an MCP server in production, or you're auditing one before adoption, you need a fast scan that flags the patterns the April 2026 disclosures target. This MCP is that scan.

## What it checks

**30+ canonical rules** across 5 severity tiers:

- **CRITICAL** — direct RCE, system-prompt override, credential exfil patterns, shell metachars in defaults, file:// / internal-network URLs (the DockerDash 169.254.169.254 metadata-pivot vector).
- **HIGH** — encoded payloads, imperative directives at the agent, supply-chain prompts, env-var references, tool shadowing.
- **MEDIUM** — urgency / authority language, `additionalProperties=true`, unbounded strings, tool-name impersonation.
- **LOW** — over-long descriptions, zero-width / bidi-override chars (the U+202E PoC vector).

Coverage maps to: OWASP LLM Top 10, GenAI Red Team v1, the April 2026 Anthropic MCP RCE disclosure, and the `mcp-server-git` CVE chain.

## Tools exposed

| Tool | Purpose |
|---|---|
| `scan_mcp_url(url)` | Fetch a remote MCP server's tool listing and scan it |
| `audit_tool_descriptions(tools_json)` | Scan a pasted JSON tool list (auth-walled servers) |
| `signed_safety_report(subject, findings_json, score, note)` | Issue a procurement-grade signed cert (Pro tier) |
| `list_rules()` | Inspect the full rule catalogue before subscribing |
| `pricing()` | Subscribe links + tier comparison |

## Pricing

| Tier | Price | What you get |
|---|---|---|
| Free | £0 | 5 scans / day, no signed reports |
| Starter | [£29/mo](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t) | Unlimited scans + signed reports |
| Pro | [£79/mo](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t) | + scheduled rescans + 48h support |
| Enterprise | [£1,499/mo](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t) | + custom rule packs + 4h SLA |

Every signed cert lives at `https://meok-attestation-api.vercel.app/verify/<cert_id>` — auditors and procurement teams confirm without an account.

## What you do NOT get

This is a static-pattern scanner. It does not run dynamic taint analysis, fuzz the server with adversarial inputs, or replace a human red-team. It is the first 80% of the audit, in 5 seconds, for free.

## Built by MEOK AI Labs

Solo founder. London. 234 MCP packages on PyPI. Live signing infrastructure at `meok-attestation-api.vercel.app`. Storefront `councilof.ai`. Get the catalogue: `https://meok-attestation-api.vercel.app/catalogue`.

<!-- mcp-name: io.github.CSOAI-ORG/meok-mcp-injection-scan-mcp -->


---

## ⭐ Support This Project

If you find this MCP server useful, please star the repo and share it with your compliance team. Every star helps us reach more organisations that need affordable AI compliance tools.

[![GitHub stars](https://img.shields.io/github/stars/CSOAI-ORG/meok-mcp-injection-scan-mcp)](https://github.com/CSOAI-ORG/meok-mcp-injection-scan-mcp)

**Questions?** [Open an issue](https://github.com/CSOAI-ORG/meok-mcp-injection-scan-mcp/issues) or email nicholas@meok.ai

<!-- meok-moat-footer-v1 -->
---

## Pairs with MEOK Governance Suite

Build something that touches users? You need compliance. MEOK ships 38 governance MCPs that drop in alongside this tool — EU AI Act, DORA, NIS2, CRA, GDPR, ISO 42001, FDA SaMD, MDR, Basel, MiFID II, MiCA, COPPA, and more.

```bash
# One-shot install of the governance pack
npx meok-setup --pack governance
```

Free tier: 10 calls/day per MCP. Pro tier (£79/mo): unlimited + cryptographically signed compliance attestations your auditor verifies independently.

→ Full catalogue: [councilof.ai/catalogue](https://councilof.ai/catalogue)
→ MEOK AI Labs: [meok.ai](https://meok.ai)

<!-- BUY-LADDER:START -->

## 💸 Try MEOK in 30 seconds — instant buy ladder

| Tier | Price | What you get | Stripe |
|---|---|---|---|
| Smoke test | **£1** | Signed sample MCP-Hardening report + Article 50 PDF | <https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t> |
| Quick Kit | **£9** | EU AI Act Article 50 implementation guide (C2PA + EU-Icon) | <https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t> |
| Founder Call | **£29** | 30-min 1-on-1 with the founder | <https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t> |

> Refundable. UK Stripe — VAT-clean. Builds on the 81-MCP MEOK fleet.
> Verify any signed report at <https://meok.ai/verify>.

<!-- BUY-LADDER:END -->



## Configuration

Add to your `claude_desktop_config.json` (Claude Desktop) or your MCP client config:

```json
{
  "mcpServers": {
    "meok-mcp-injection-scan-mcp": {
      "command": "uvx",
      "args": ["meok-mcp-injection-scan-mcp"]
    }
  }
}
```

Or: `pip install meok-mcp-injection-scan-mcp` then run the `meok-mcp-injection-scan-mcp` command (stdio transport).

## Examples

Once configured, ask your assistant, for example:
- "Use `scan_mcp_url` to …"
- "Use `audit_tool_descriptions` to …"
- "Use `signed_safety_report` to …"
