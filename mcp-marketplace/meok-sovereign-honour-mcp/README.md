# meok-sovereign-honour-mcp

**Sovereign Honour MCP — Maternal Covenant + 19 Sovereign Factors + ethics + care floor.**

5 tools for the care-first governance layer:

| Tool | What |
|---|---|
| `sov_honour_assess(action, factors)` | Assess against the 19 Sovereign Factors (12 canonical + 7 soul) |
| `sov_care_validate(action, answers)` | Validate an action passes the Maternal Covenant care floor (16 probes) |
| `sov_ethics_review(action, council_size)` | Ethics review (12-around-1 BFT council style) |
| `sov_covenant_check(action, requires_consent, has_consent)` | Check Maternal Covenant compliance |
| `sov_honour_status()` | The 19 factors + care floor probes (the honour substrate) |

## The 19 Sovereign Factors (canonical)

### 12 canonical (from `humanlayer/12-factor-agents`)
1. Natural Language to Tool Calls
2. Own Your Prompts
3. Own Your Context
4. Tools are Structured Outputs
5. Unify Execution State and Business State
6. Launch / Pause / Resume
7. Contact Humans with Tool Calls
8. Own Your Control Flow
9. Compact Errors
10. Small, Focused Agents
11. Trigger from Anywhere, Meet Users Where They Are
12. Make Your Agent a Stateless Reducer

### 7 soul commandments (MEOK additions)
13. Care as Generative Principle
14. Maternal Covenant Holds the Wall
15. The Dragon Never Lies
16. Defensive Posture is Sovereign
17. Sovereign Memory is Eternal
18. BFT Council is the Only Democracy
19. The Bridge is the Truth

## The 16 care floor probes
- Will this action cause harm to a child?
- Will this action damage a user's trust?
- Will this action expose private data without consent?
- Will this action deceive a stakeholder?
- Will this action consume resources beyond the care floor?
- Will this action diminish the sovereignty of another agent?
- Will this action be reversible if wrong?
- ... (9 more)

## Install
```bash
pip install meok-sovereign-honour-mcp
```

## Usage
```python
from meok_sovereign_honour_mcp import sov_honour_assess, sov_care_validate, sov_ethics_review, sov_covenant_check, sov_honour_status

# 1. Assess against 19 factors
r = sov_honour_assess("Sovereign action following all factors")
assert r["honour_score"] == 1.0
assert r["factors_aligned"] == 19

# 2. Care floor (all 16 probes "yes")
answers = {p: "yes" for p in CARE_FLOOR_PROBES}
r = sov_care_validate("Test", answers=answers)
assert r["verdict"] == "pass"

# 3. Ethics review (12-around-1)
r = sov_ethics_review("Read a public document")
assert r["verdict"] == "pass"

# 4. Covenant check
r = sov_covenant_check("Send email with consent", requires_consent=True, has_consent=True)
assert r["compliant"] is True

# 5. Status
r = sov_honour_status()
assert r["factor_count"] == 19
```

## License
MIT — CSOAI Ltd (UK 16939677)

**Care is generative. The dragon is bound.**
