# meok-sovereign-governance-mcp

**Sovereign Governance Engine MCP** — policy enforcement + zero-trust identity + sandboxing + SRE for autonomous AI agents.

Wraps:
- [microsoft/agent-governance-toolkit](https://github.com/microsoft/agent-governance-toolkit) (AGT, MIT, 4.5K stars, PyPI/npm/NuGet)
- [massivescale-ai/agentic-trust-framework](https://github.com/massivescale-ai/agentic-trust-framework) (ATF specification, CC BY 4.0)
- [WhitzardAgent/AgentGuard](https://github.com/WhitzardAgent/AgentGuard) (Zero-Trust Security Foundation)

with the **CSOAI sovereign substrate** (Ed25519, BFT council, Maternal Covenant, proofof.ai).

## The Five Governance Elements (mirrors ATF)

| # | Element | Question | Sovereign Tool |
|---|---------|----------|----------------|
| 1 | **Identity** | "Who are you?" | sov_policy_evaluate |
| 2 | **Behavior** | "What are you doing?" | sov_policy_evaluate |
| 3 | **Data** | "What are you eating/serving?" | sov_policy_evaluate (care_floor) |
| 4 | **Segmentation** | "Where can you go?" | sov_segmentation_zone |
| 5 | **Incident** | "What if you go rogue?" | sov_incident_killswitch |

## The Four Maturity Levels (mirrors AGT)

| Level | Name | Autonomy | Tools Allowed | Min Actions | Max Incidents | Min Care Ratio | BFT Council |
|-------|------|----------|---------------|-------------|---------------|----------------|-------------|
| 1 | INTERN | observe + report | read, report | 0 | 999 | 0% | ❌ |
| 2 | JUNIOR | recommend + approve | + recommend | 100 | 0 | 0% | ✅ |
| 3 | SENIOR | act + notify | + act, notify | 1,000 | 5 | 95% | ✅ |
| 4 | PRINCIPAL | autonomous | + delegate, override | 10,000 | 1 | 99% | ✅ |

## Install

```bash
pip install meok-sovereign-governance-mcp
```

## Usage (Python)

```python
from meok_sovereign_governance_mcp import (
    policy_evaluate, segmentation_zone, maturity_assess, incident_killswitch,
)

# 1. Policy decision (signed)
decision = policy_evaluate(
    agent_id="trader-bot",
    action="send_payment",
    resource="/api/payments",
    agent_level="senior",
    care_floor_validated=True,
    bft_council_id="council-12of1-abc",
)
assert decision["verdict"] == "allow"
print(decision["verify_url"])

# 2. Segmentation check
zone = segmentation_zone(
    "trader-bot", "/users/123/profile",
    allowed_zones=["/users/*", "/admin/*"],
)
assert zone["verdict"] == "allow"

# 3. Maturity assessment (level-up)
assess = maturity_assess(
    "trader-bot", "principal",
    successful_actions=15000,
    incidents_total=0,
    care_floor_passed=995, care_floor_total=1000,
    bft_council_approved=True,
)
assert assess["verdict"] == "allow"

# 4. Killswitch (incident response)
incident_killswitch("rogue-agent", "Produced harmful output", "critical")
```

## Usage (MCP server)

```bash
python -m meok_sovereign_governance_mcp
# Exposes 4 tools: sov_policy_evaluate, sov_segmentation_zone, sov_maturity_assess, sov_incident_killswitch
```

## The Verdict Decision Tree

```
Action requested
  ↓
[Intern] can only observe / report → ESCALATE for anything else
  ↓
[Junior] can also recommend → DENY for act/delete/send
  ↓
[Senior] can act/notify → DENY sensitive (delete/drop/send) without care-floor
  ↓
[Principal] can delegate/override → ESCALATE override without BFT council
```

## Sovereign Substrate

| Layer | What | Substrate |
|---|---|---|
| Sign | Every decision | Ed25519, `~/.meok/sov_governance_key.pem` |
| Verify | Public URL | `https://proofof.ai/governance/<decision_id>` |
| Care | Sensitive acts | Maternal Covenant `care_floor_validated` flag |
| Council | Override actions | BFT council ID field |

## Reference Implementations

- **AGT** — github.com/microsoft/agent-governance-toolkit (MIT, 4.5K stars)
- **ATF** — github.com/massivescale-ai/agentic-trust-framework (Apache 2.0, CSA-published)
- **AgentGuard** — github.com/WhitzardAgent/AgentGuard (GPL-3.0)
- **Sovereign wrapper** — this package (MIT, CSOAI Ltd UK 16939677)

## License

MIT — CSOAI Ltd (UK 16939677)

---

**The dragon never lies. Every decision is signed. Every boundary is enforced.**
