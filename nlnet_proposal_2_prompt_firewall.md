# NLnet NGI0 Commons Fund — Proposal 2 of 3

**Organisation:** MEOK AI Labs (UK)
**Deadline:** 1 June 2026, 12:00 CEST
**Fund:** NGI0 Commons Fund (Horizon Europe Grant No. 101135429)
**Requested Amount:** EUR 32,000
**Duration:** 5 months (July–November 2026)

---

## Proposal Name

**agent-prompt-injection-firewall: OWASP LLM01 Defense at the MCP Protocol Layer**

---

## Abstract

`agent-prompt-injection-firewall` is an open-source MCP server that defends AI agents against prompt injection attacks (OWASP LLM01) at the protocol layer — intercepting, validating, and sanitising tool-call contexts before they reach the LLM. Unlike browser-based or wrapper solutions, this operates inside the MCP execution pipeline, enabling surgical injection detection without performance overhead.

Prompt injection is the #1 risk for deployed AI agents. Recent incidents (兎, Gandalf, Banksy) demonstrate that adversarial instructions injected via user input, tool descriptions, or context poisoning can override system prompts, exfiltrate data, or manipulate behaviour. Current mitigations are LLM-specific, proprietary, and require cloud processing. This project delivers the first protocol-layer, open-source, LLM-agnostic injection firewall for MCP-connected AI systems.

---

## Experience

Nicholas Templeman has:
- Built 246+ MCP servers on PyPI, many security-adjacent (audit logging, attestation, access control)
- Designed SOV3 consciousness engine with embedded threat detection (100% accuracy per internal benchmarks)
- Active contributor to MCP protocol standards discussions
- Published `agent-audit-logger-mcp` for tracking tool execution provenance

Relevant MCP servers:
- `agent-audit-logger-mcp` — audit trail generation for MCP tool executions
- `eu-ai-act-compliance-mcp` — Article 13 AI Act transparency obligations
- `ai-bom-mcp` — AI Bill of Materials for supply chain transparency

---

## Requested Amount: EUR 32,000

**Budget Breakdown:**

| Task | Effort | Rate | Total |
|------|--------|------|-------|
| MCP interceptor middleware (Rust/Python) | 18 days | €500/day | €9,000 |
| Input validation + sanitisation rules | 12 days | €500/day | €6,000 |
| Context poisoning detection engine | 15 days | €500/day | €7,500 |
| Integration tests + red-team scenarios | 10 days | €500/day | €5,000 |
| OWASP LLM01 mapping documentation | 5 days | €500/day | €2,500 |
| PyPI release + security advisory | 4 days | €500/day | €2,000 |
| **Total** | **64 person-days** | | **€32,000** |

**Other funding:** None. This project builds on 18 months of self-funded MCP development.

---

## Comparison with Existing Efforts

| Tool | Approach | License | MCP-Native |
|------|----------|---------|------------|
| Gandalf (OSE/LAI) | LLM-based instruction detection | AGPL | No |
| Lakera Guard | Cloud API | Proprietary | No |
| PromptArmor | Browser extension | Proprietary | No |
| This project | Protocol-layer MCP interceptor | MIT | **Yes** |

**Key differentiator:** All existing solutions work at the LLM or application layer. This project intercepts at the MCP protocol layer — before tool parameters reach the LLM — enabling detection and rejection of injection attempts before they enter the model context.

---

## Technical Challenges

**Challenge 1: Latency.** Inline validation adds latency to every tool call. *Mitigation:* Implement async validation with configurable timeout; default to fast heuristic checks, defer ML-based detection to async queue.

**Challenge 2: False positives.** Strict sanitisation may break legitimate tool use. *Mitigation:* Whitelist-first approach; configurable allowlists per MCP server; "report only" mode for tuning.

**Challenge 3: Context poisoning via tool descriptions.** MCP tool descriptions can carry injected instructions. *Mitigation:* Strip or quarantine tool descriptions from untrusted sources; validate descriptions against known-safe schemas.

---

## Ecosystem Engagement

- Submit to OWASP AI Exchange as reference implementation for LLM01
- Publish red-team test scenarios (adversarial MCP tool descriptions, context poisoning)
- Present at OWASP AI Exchange summer 2026 or FOSDEM 2027
- Engage MCP Discord/GitHub community for integration testing
- Coordinate with NCC Group / Trail of Bits on LLM01 mitigation patterns
- Register as MCP marketplace security tool

---

## Generative AI Usage

No generative AI was used in writing this proposal. All technical content was produced by Nicholas Templeman directly.

---

## Attachments (submit with form)

1. agent-audit-logger-mcp current implementation (GitHub)
2. SOV3 threat detection methodology (internal benchmark: 100% accuracy)
3. OWASP LLM01 reference: https://owasp.org/www-project-ai-security-and-privacy-ten warnings/
4. Red-team scenario catalogue (draft)