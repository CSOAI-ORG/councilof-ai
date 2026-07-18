# meok-sovereign-defence-mcp

**Sovereign Defence MCP — defensive-only.** Threat assessment, IWC (Information Warfare Capacity), JSP 936 audit, C2 routing, defensive doctrine.

**DOCTRINE: DEFENSIVE ONLY.** No offensive operations. No worm propagation. No kill chains. Defensive posture is the sovereign thesis.

> *"Defend. Detect. Deny. Deceive. Defeat. — Never Offend."*

## 5 tools

| Tool | What | Why |
|---|---|---|
| `sov_threat_assess(description, evidence)` | Score a threat 1-10 | Cyber + physical + insider + critical-infra + AI dimensions |
| `sov_iwc_calculate(scans, detected, neutralised)` | IWC score | (detected×0.4 + neutralised×0.6) / scans |
| `sov_jsp936_audit(org, pillars)` | JSP 936 (NATO assurance) | 5 pillars: identify, assess, document, test, manage |
| `sov_c2_route(asset, dest, priority, requires_approval)` | C2 routing | 3-hop tunnel with council vote for critical |
| `sov_doctrine()` | Defensive doctrine | 7 principles, never offensive |

## Install
```bash
pip install meok-sovereign-defence-mcp
```

## Usage
```python
from meok_sovereign_defence_mcp import sov_threat_assess, sov_iwc_calculate, sov_jsp936_audit, sov_c2_route, sov_doctrine

# 1. Threat score
r = sov_threat_assess("Critical infrastructure cyber attack with active insider breach")
assert r["threat_score"] >= 8
assert r["threat_level"] == "critical"

# 2. IWC
r = sov_iwc_calculate(scans_per_day=100, detected_threats=90, neutralised=85)
assert r["capacity"] == "sovereign"

# 3. JSP 936 audit (5 pillars)
pillars = {p: {"documented": True, "tested": True, "incident_history": True} for p in [
    "Identify critical functions and dependencies",
    "Assess threats and vulnerabilities",
    "Document and review resilience plans",
    "Test, exercise, and validate responses",
    "Manage incidents with traceable decisions",
]}
r = sov_jsp936_audit("CSOAI", pillars)
assert r["assurance_level"] in ("sovereign", "robust")

# 4. C2 routing (critical requires council vote)
r = sov_c2_route("asset-1", "frontline", priority="critical", requires_approval=True)
assert r["route"]["approval"] == "pending_council_vote"

# 5. Doctrine
r = sov_doctrine()
assert "Never Offend" in r["doctrine"]["motto"]
```

## License
MIT — CSOAI Ltd (UK 16939677)

## References
- JSP 936 (UK MoD Defence Code of Practice)
- NATO Assurance standards
- Kimi DefneOS intel (defensive posture)

**The dragon defends. The dragon never attacks.**
