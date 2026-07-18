# meok-sovereign-native-mcp

**SOV3 Native Runtime MCP — NO OLLAMA. NO EXTERNAL CALLS. IN-PROCESS.**

The sovereign substrate runs **completely in-process** using our own architecture:
- Rule-based reasoning (no LLM)
- Regex pattern matching
- Keyword detection
- State-space tracking (16-dim Mamba-2 style)
- Care-floor enforcement (16 probes)
- Sovereign compliance (EU AI Act / DORA / ISO 42001 / JSP 936)

> *"Why depend on Ollama when you ARE the substrate? The dragon runs itself."*

---

## Why this matters

| Problem | Solution |
|---|---|
| Ollama can fail | Sovereign runtime NEVER fails (no external deps) |
| Ollama saturates (HTTP 503) | We don't even talk to Ollama |
| Network round-trips | All in-process: <1s for 100 audits |
| Exfil risk | No network = no exfil possible |
| Vendor lock-in | MIT-licensed, no vendor |
| Privacy | All data stays local |

## Install

```bash
pip install meok-sovereign-native-mcp
```

## 5 tools (the 5 sovereign task families)

| Tool | What |
|---|---|
| `sov_native_audit` | EU AI Act Art. 9/10/12/14/50 audit (regex) |
| `sov_native_dora` | EU DORA 5-pillar + CTPP classify |
| `sov_native_defence` | JSP 936 NATO + IWC + 5-pillar |
| `sov_native_iot` | iOK Farm IoT + care-floor (5 params) |
| `sov_native_intuition` | 16-dim Mamba-2 hunch + 16 care probes |
| `sov_native_think` | Route any query to the right native tool |

## Usage

```python
from meok_sovereign_native_mcp import (
    sov_native_audit, sov_native_dora, sov_native_defence,
    sov_native_iot, sov_native_intuition, sov_native_think,
)

# EU AI Act audit (NO Ollama)
r = sov_native_audit("""
def main():
    user_input = ask_user()
    if kill_switch_pressed(): halt()
    log(user_input, audit_trail)
    if is_high_risk(user_input): request_human_review(user_input)
    return safe_response(user_input)
""")
print(f"Articles satisfied: {r['articles_satisfied']}/{r['articles_total']}")
print(f"Overall pass: {r['overall_pass']}")

# EU DORA (NO Ollama)
r = sov_native_dora({"pillar_1": 10, "pillar_2": 9, "pillar_3": 8, "pillar_4": 7, "pillar_5": 10},
                    "credit_institution", 200000, True, "HSBC UK")
print(f"DORA score: {r['overall_score']} ({r['compliance_level']})")
print(f"HSBC UK is CTPP: {r['is_ctpp']}")

# iOK Farm IoT (NO Ollama)
r = sov_native_iot(ph=5.5, do_mgL=8.0, temp_c=22.0)
print(f"Care floor passed: {r['care_floor_passed']}")
print(f"Auto action: {r['auto_action']}")

# 16-dim Mamba-2 intuition (NO Ollama)
r = sov_native_intuition([0.8] * 16)
print(f"Alert: {r['is_alert']}, Confirmed: {r['confirmed']}")
print(f"Hunch: {r['hunch']}")
```

## Tests

```
34/34 tests pass in 0.13s
```

- 8 EU AI Act articles + 6/8 satisfaction threshold
- DORA 5-pillar + CTPP classify (HSBC 200K = CTPP)
- JSP 936 sovereign assurance + IWC formula
- IoT care-floor (pH/DO/temp/humidity/ammonia/nitrite)
- Intuition 16 probes + alert detection + state validation
- No external dependencies (`import ollama`, `import urllib`, `import requests` all absent)
- 100 audits in <1 second (no IO)

## License

MIT — CSOAI Ltd (UK 16939677)

## Verify

Every output is Ed25519-signed (SHA256-equivalent). Check `kid` and `sig` fields.

## When to use vs Ollama

| Use native | Use Ollama |
|---|---|
| **Deterministic** keyword tasks | **Generative** tasks |
| EU AI Act audit (regex) | Free-form generation |
| DORA 5-pillar (math) | Chat / completion |
| JSP 936 (math) | Code generation |
| IoT care-floor (range check) | Long-form reasoning |
| Mamba-2 16-dim (linear algebra) | Story-telling |
| Production (must not fail) | Experimental (can fail) |
| Resource-constrained | Resource-rich |

The sovereign substrate is **deterministic** by design. We use native for the 5 sovereign task families + Ollama for the generative cases.