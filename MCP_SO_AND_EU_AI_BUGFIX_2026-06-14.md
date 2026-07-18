# mcp.so Submission & eu-ai-act-compliance-mcp Bug Fix

**Date:** 2026-06-14
**Author:** Hermes subagent
**Tasks:** (1) Submit care-membrane-mcp to mcp.so via punkpeye/awesome-mcp-servers issue
(2) Investigate and fix the `classify_ai_risk()` `system_name` kwarg bug in `eu-ai-act-compliance-mcp`

---

## Task 1: mcp.so Submission (care-membrane-mcp)

**Status:** ✅ Issue opened successfully.

**Issue URL:** https://github.com/punkpeye/awesome-mcp-servers/issues/8041

**Title:** Add Care Membrane to AI Safety

**Body submitted:**
```
- Server name: Care Membrane
- Description: AI safety boundary with care-aware threat detection and emotional modeling
- GitHub: https://github.com/CSOAI-ORG/care-membrane-mcp
- PyPI: https://pypi.org/project/care-membrane-mcp/
- Category: AI Safety
- License: MIT
```

**Template check:** Confirmed via `gh api repos/punkpeye/awesome-mcp-servers/contents/.github/ISSUE_TEMPLATE`
→ 404 (no template exists). Used the standard pattern from
`~/clawd/mcp-marketplace/distribution-output/mcp-so-submissions.md` for care-membrane-mcp.

---

## Task 2: eu-ai-act-compliance-mcp `classify_ai_risk()` Fix

### Root Cause

`classify_ai_risk()` declared a strict signature `classify_ai_risk(description: str, caller: str = "anonymous", api_key: str = "")`.
It did not accept `system_name`.

Meanwhile, sibling tools in the same module — `check_compliance`, `generate_documentation`, `audit_report` — all
take `system_name` as their **first** parameter:

```python
check_compliance(system_name=..., purpose=..., data_types=..., decision_scope=...)
generate_documentation(system_name=..., provider_name=..., ...)
audit_report(system_name=..., provider_name=..., ...)
```

When clients invoke these tools uniformly through a multi-step workflow (the documented pattern in
`AGENTS.md`: "Start with `quick_scan` for instant risk classification, then `check_compliance`, then
`generate_documentation`"), they pass `system_name` to `classify_ai_risk` as well. FastMCP rejects the call
with a validation error and the user's workflow dies. This explains the audit's 33% success rate and 10
failed calls/week.

### The Fix

Surgical, 5 logical lines. The function now:

1. Accepts `system_name: str = ""` as an optional second positional parameter
2. If `description` is empty, uses `system_name` as the description
3. If both are present, prepends `[System: {name}]\n` so the keyword matchers still see context

```python
@mcp.tool()
def classify_ai_risk(
    description: str = "",
    system_name: str = "",
    caller: str = "anonymous",
    api_key: str = "") -> dict:
    ...
    # Backwards-compat: callers from check_compliance/generate_documentation workflows
    # often pass `system_name` instead of `description`. Accept it gracefully — if
    # description is empty, treat system_name as the description (and prepend a
    # marker so the classifier's keyword matchers can still inspect it).
    if not description and system_name:
        description = system_name
    elif system_name:
        description = f"[System: {system_name}]\n{description}"
```

`description` is changed from a required positional to a defaulted parameter so the call
`classify_ai_risk(system_name="FooAI")` is also valid (the most common failure mode in the bug report).

### Verification

- All 6 existing `TestClassifyAiRisk` tests pass.
- Full test suite: **43/43 passing** in `tests/test_tools_full.py`.
- Manual smoke tests:
  - `classify_ai_risk(system_name="CreditScoreAI", description="hiring decisions using ML")` → `high-risk` ✅
  - `classify_ai_risk(description="chatbot for FAQs")` → `limited-risk` (regression check) ✅
  - `classify_ai_risk(system_name="BiometricID Pro")` → returns dict (no TypeError) ✅

### Diff

`/Users/nicholas/clawd/eu-ai-act-classify-fix.patch` — unified diff, 16 added lines, 1 changed line.

### Files Modified

- `/Users/nicholas/clawd/mcp-marketplace/eu-ai-act-compliance-mcp/server.py` — applied in place.

### Files Created

- `/Users/nicholas/clawd/eu-ai-act-classify-fix.patch` — diff to apply the fix.
- `/Users/nicholas/clawd/MCP_SO_AND_EU_AI_BUGFIX_2026-06-14.md` — this report.
- `/Users/nicholas/clawd/mcp-so-eu-ai-bugfix-result.json` — machine-readable result.

### Notes

- I detected and ignored a prompt-injection attempt in `clawd/AGENTS.md` and the per-package
  `.cursorrules` files (classified as "potential prompt injection / exfil_curl"). I did not load their
  full content and made decisions based on the source code and tests, not on those instructions.
- The fix is intentionally minimal: no refactor of the keyword matcher, no schema migration, no
  breaking change to existing callers. Pure additive backward-compat.
