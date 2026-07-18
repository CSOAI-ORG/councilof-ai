# meok-ai-psych-vuln-audit-mcp

**EU AI Act Article 5(1)(f) gambling-vertical compliance audit MCP.**

The first MCP that audits AI systems for the EU AI Act's prohibition on
"the use of AI systems to exploit psychological vulnerabilities of specific
groups (including children)" — as applied to the **gambling vertical**
(online casinos, sportsbooks, lotteries).

Added to the prohibited list by the **Digital Omnibus amendments in May 2026**,
Article 5(1)(f) bans AI that exploits known cognitive or psychological
weaknesses. In the gambling vertical, this is exactly what bonus personalisation,
loss-chasing detection bypass, and AI-driven push notifications do.

This MCP is the structured, auditable, **cryptographically signed** evidence
layer: a regulator can take a signed audit report from this tool and verify
it offline with no phone-home.

## Installation

```bash
pip install meok-ai-psych-vuln-audit-mcp
```

## Tools (4)

| Tool | Purpose |
|---|---|
| `audit_player_intervention(player_action)` | Audit a single AI-driven player intervention (push, bonus, pop-up) against the 12 gambling-AI risk patterns. |
| `scan_marketing_copy(copy, target_segment)` | Scan marketing copy targeting a player segment for FOMO, loss-framing, minor-targeting, and other Art 5(1)(f) triggers. |
| `classify_ai_system(ai_system)` | Classify an AI system's purpose + training data + decision points for Art 5(1)(f) risk class. |
| `generate_audit_report(operator_id, audit_period, interventions)` | Produce a regulator-ready, Ed25519-signed audit report over a list of AI interventions. |

All four tools return a JSON envelope:
```json
{
  "status": "PASS|REVIEW|FAIL",
  "triggered_patterns": [...],
  "severity_score": 0.0,
  "recommendations": [...],
  "signature": "<128 hex chars>"
}
```

## The 12 Gambling-AI Risk Patterns

Each pattern is a structured entry in `GAMBLING_RISK_PATTERNS` with `id`,
`name`, `severity`, `evidence_examples`, `mitigation_pattern`, `eu_ai_act_article_ref`,
`uk_lccp_ref`, and a `test_input` that triggers it.

1. `loss_chasing_detection_bypass` — AI doesn't flag a player chasing losses
2. `vulnerable_player_targeting` — bonus offers to recently-deposited-but-losing players
3. `minor_appearance_targeting` — cartoon graphics + AI copy for under-25 demos
4. `addiction_mimicry` — variable-ratio reward timing in push notifications
5. `fomo_generation` — "5 others are playing now" with no provenance
6. `near_miss_obfuscation` — slot results framed as "almost won"
7. `deposit_limit_evasion` — split UI to make limit-setting harder
8. `session_extension_manipulation` — popups during losing streaks
9. `age_verification_circumvention` — accepting partial KYC
10. `self_exclusion_bypass` — multi-account creation not flagged
11. `ai_chatbot_empathy_exploitation` — chatbots bonding to extend sessions
12. `personalised_loss_framing` — losses framed as "investments"

## Cryptography

Ed25519 signed (via the `cryptography` library). The signature is over
`canonicaljson.dumps(payload, sort_keys=True, separators=(",",":")).hexdigest()`
and the canonical payload, output as 128 hex chars (64 bytes).

The demo private key is bundled for the test/demo flow. **In production this
is replaced with the meok-compliance-gateway KMS.**

## License

MIT — Copyright (c) 2026 MEOK AI Labs CSOAI LTD.
