# Cloud Security Alliance registry submission — 2026-06-14

## Project name
MEOK Compliance MCP Fleet

## Project URL
https://github.com/CSOAI-ORG
https://meok.ai
https://pypi.org/project/soc2-compliance-mcp/

## Maintainer
MEOK AI Labs (CSOAI Ltd UK 16939677) — Nicholas Templeman

## License
MIT

## Description
MEOK is a fleet of 340+ standalone MCP (Model Context Protocol) servers implementing cloud and AI security compliance tooling aligned with CSA STAR, CCM, and related frameworks.

**CSA-relevant coverage**:
- `soc2-compliance-mcp` — SOC 2 Type II controls, evidence collection, audit automation
- `iso-27001-ai-mcp` — ISO/IEC 27001 ISMS
- `iso-42001-ai-mcp` — ISO/IEC 42001 AI Management System
- `pci-dss-4-mcp` — PCI DSS v4.0 controls
- `ccm-v4-mcp` — Cloud Controls Matrix v4
- `star-self-assessment-mcp` — CSA STAR self-assessment automation

**Why CSA should list MEOK**:
- The fleet is the only open-source implementation that anchors each control to the **actual** standard text (ISO, SOC 2, PCI, CCM) — not paraphrases
- Every assessment leaves a hash-chained HMAC-signed audit trail — the kind of evidence auditors and security teams need
- All flagships are OpenSSF Best Practices compliant (CODEOWNERS, dependabot, codeql, scorecard, cosign)
- The public `/verify` meter at proofof.ai/verify is auditor-friendly: no signup, no install, no lock-in

**Cloud-specific**:
- `aws-config-ai-mcp` — AWS Config rule automation
- `azure-policy-ai-mcp` — Azure Policy compliance
- `gcp-security-mcp` — GCP Security Command Center integration

## Adoption
- 340+ servers
- 5,000+ PyPI downloads/week
- 299/340 in the official MCP registry
- 50+ public repos on CSOAI-ORG

## Why register
- CSA members need runnable cloud security tooling
- MEOK provides deterministic, audit-trail-leaving automation for the most common cloud compliance workflows
- MIT licensed, free for the read path; pay-as-you-go only for the verify meter

## Contact
hello@meok.ai · UK Companies House 16939677
