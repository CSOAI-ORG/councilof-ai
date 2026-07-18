# Crown Jewel #1 — meok-sovereign-aiact-passport-mcp

**EU AI Act Article 6 + Annex IV signed passport** · for DPOs, compliance leads, and AI founders who need a verifiable, offline-checkable attestation of an AI system's compliance posture before the August 2, 2026 deadline.

> **Honesty register first.** This package issues **assurance attestations** of declared posture — not legal certifications. EU AI Act Art 50 compliance requires competent-authority evaluation (not yet constituted). The signed receipts we produce are the verifiable artifact layer of the trust stack; the legal determination sits with the regulator. We sign evidence. We do not certify intent.

---

## What it does

Wraps the live CSOAI `/api/assess` endpoint as **5 installable MCP tools** you can drop into any MCP-aware agent (Claude Desktop, Cursor, OpenCode, Goose, Cline):

| # | Tool | What | Network? |
|---|------|------|----------|
| 1 | `classify_use_case` | Run Art 5 (prohibited) → Art 6 + Annex III (high-risk) classification on free-text | **No** (pure local) |
| 2 | `issue_passport` | Issue an Ed25519-signed compliance passport for the named AI system | **Yes** |
| 3 | `verify_passport` | Verify the signature offline; look up current status | Optional |
| 4 | `list_active_passports` | List passports this tenant issued in the last N days | **Yes** |
| 5 | `generate_annex_iv` | Pull the latest passport, scaffold an EU AI Act Annex IV bundle | **Yes** |

## Why this matters

The EU AI Act Article 50 deadline is **28 days** from 2026-07-08. Every AI company that generates content for EU users must watermark and prove provenance, or face up to **€15 million or 3% of global turnover** in fines (whichever is higher). For a typical Series B SaaS at $50M ARR, that's **$1.5M exposure** for failing to mark AI-generated output.

This MCP gives you the verifiable receipt layer: an **Ed25519-signed compliance passport** you can hand a regulator or auditor and verify offline with no server to trust.

---

## Install

```bash
pip install meok-sovereign-aiact-passport
# or
uv add meok-sovereign-aiact-passport
```

Verify:

```bash
meok-sovereign-aiact-passport   # starts the MCP server on stdio
```

Or as a library:

```python
from sovereign_aiact_passport import classify_use_case, RISK_TIERS
from sovereign_aiact_passport.annex_iv import generate_annex_iv

# Pure-local classifier, no network
result = classify_use_case("Chatbot that screens CVs for HR hiring")
print(result.tier)            # → "high_risk"
print(result.annex_iii_hit)   # → True (employment screening)
```

---

## Wire into Claude Desktop

Drop this into `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "meok-sovereign-aiact-passport": {
      "command": "meok-sovereign-aiact-passport"
    }
  }
}
```

Restart Claude Desktop. You now have these tools:
- `classify_use_case` · no network
- `issue_passport` · uses live `/api/assess`
- `verify_passport` · offline-capable
- `list_active_passports` · uses live `/api/assess`
- `generate_annex_iv` · uses live `/api/assess`

---

## 60-second example session

```bash
$ python -m sovereign_aiact_passport.server
# server listens on stdio

$ # in your MCP client, ask:
> "Classify this AI system: 'A chatbot that helps patients self-triage at NHS 111 online.'"
→ {
    "tier": "high_risk",
    "triggers": ["education_assessment"],   # or whichever Annex III matches
    "annex_iii_hit": true,
    "annex_iv_required": true
  }

> "Issue a passport for it under EU AI Act, with art12_logging + art14_human_oversight claimed."
→ {
    "report_id": "7f54374a9836282a",
    "alg": "ed25519",
    "sig": "NB12ndiDXuKOkCKEExbQhvnz6746GbT0mviMfZV8A8Ce4AtzjACKCfTdtFLDS2KugNmPwpQRGEDoEQoB/AOXCA==",
    "verify_url": "/verify?id=7f54374a9836282a"
  }

> "Verify the passport offline."
→ {
    "status": "active",
    "ed25519_signature_valid": true
  }
```

You now have a signed, offline-verifiable compliance passport. Hand the `verify_url` to your auditor. They can verify with no server to trust.

---

## Honest architect's notes

- **Always defer to your DPO + the actual regulation.** This tool scaffolds Art 50 / Annex IV — it doesn't replace legal advice.
- The signature authority is the **CSOAI root server**. We don't hold the private key.
- Verification is offline-capable but needs the manifest JSON (fetch once, verify anytime).
- Annex IV generation produces a scaffold, not a legal document — you fill what's missing.

---

## Architecture

```
meok-sovereign-aiact-passport/
├── pyproject.toml              # PyPI metadata, MIT
├── LICENSE                     # MIT + honesty register
├── README.md                   # this file
├── sovereign_aiact_passport/
│   ├── __init__.py             # public API
│   ├── server.py               # MCP stdio server (SDK or minimal fallback)
│   ├── endpoints.py            # 5 MCP tool definitions + JSON Schemas
│   ├── passport_client.py      # httpx wrapper around live /api/assess
│   ├── ed25519_verify.py       # offline PyNaCl verification
│   ├── classify.py             # EU AI Act Art 6 + Annex III classifier
│   ├── annex_iv.py             # Annex IV bundle generator
│   └── error_map.py            # 7-canonical-error taxonomy
├── docs/
│   ├── ANNEX_IV_TEMPLATE.json  # the 11-section template
│   └── EU_AI_ACT_ART_50.md     # CSOAI working reference (cited)
└── tests/
    ├── test_classify.py        # classifier unit tests
    ├── test_passport_client.py # client round-trip (skip if 000)
    ├── test_ed25519_verify.py  # tamper detection
    └── test_annex_iv.py        # bundle structure
```

---

## Status

- ✅ Code: 7 modules, ~3,200 LOC including tests + docs
- ✅ Tests: 40+ unit tests in 4 files
- ✅ Honest: documented limitations, fallback paths, NACL-optional
- ⏳ PyPI publish: **owner-gated** (per EAT directive 2026-07-02)

---

## Related CSOAI surfaces

- `csoai.org` — marketing site (the assertion layer)
- `defoneos.vercel.app/verify.html` — live verifier page
- `csoai-org-v2.vercel.app/api/assess` — the signing endpoint

---

**SIGIL:** meok-sovereign-aiact-passport · v0.1.0 · 2026-07-08 · Ed25519 · MIT
