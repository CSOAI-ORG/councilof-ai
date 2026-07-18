# Crown-Jewel #1 — meok-sovereign-aiact-passport-mcp

**Date:** 2026-07-08 · **Status:** SPEC (not built) · **Tier:** S (crown jewel)
**Personas served:** Marcus (DACH DPO), Fatima (Big 4 EU AI Act consultant), Yuki (Japan-APAC CISO)

---

## The job

Take the existing `/api/assess` passport endpoint and **wrap it as an installable MCP** that a DPO can drop into their existing MCP substrate (Claude Desktop, Cursor, in-house agent) and call from their own tools.

The unique value: existing `/api/assess` is a curl call. This MCP makes the same capability available as a **named, typed, predictable tool** with input validation, output schema, and Ed25519-signed receipts the same shape that downstream auditors expect.

---

## Module structure (Python)

```
meok-sovereign-aiact-passport-mcp/
├── pyproject.toml              # MCP SDK dep + PyPI metadata
├── README.md                   # 1-screen intro + EU AI Act framing
├── sovereign_aiact_passport/
│   ├── __init__.py             # version + entry point
│   ├── server.py               # MCP stdio server (FastMCP idiomatic)
│   ├── endpoints.py            # 5 tool definitions + schema validation
│   ├── passport_client.py      # POST /api/assess wrapper (httpx)
│   ├── passport_verify.py      # GET /api/reports/[id] / SIGIL lookup
│   ├── ed25519_verify.py       # verify-signed-passport against pub key
│   ├── annex_iv.py             # generate Annex IV template from passport
│   └── error_map.py            # 7-canonical-error-type → HTTP 400/422/500
├── tests/
│   ├── test_endpoints.py       # 10+ MCP tool tests (parametrised)
│   ├── test_passport_client.py # 5+ tests against live /api/assess (skip if 000)
│   ├── test_ed25519_verify.py  # 10+ tests incl. tamper detection
│   └── test_annex_iv.py        # 3+ tests against EU AI Act Annex IV template
└── docs/
    ├── EU_AI_ACT_ART_50.md     # what Art 50 actually requires (cited)
    └── ANNEX_IV_TEMPLATE.json  # the 11-section Annex IV template
```

**LOC budget:** ~280 lines per file × 7 files + ~250 LOC × 4 test files ≈ 3,000 LOC total.

---

## 5 MCP tools (exact definitions)

### Tool 1 — `classify_use_case`
```python
@mcp.tool()
def classify_use_case(free_text: str) -> dict:
    """Run Article 6 + Annex III risk-classification on a free-text
    AI system description. Returns tier ∈ {prohibited, high_risk,
    limited_risk, minimal}. Pure local logic — no API call."""
```

### Tool 2 — `issue_passport`
```python
@mcp.tool()
def issue_passport(
    system_id: Annotated[str, "human-readable label, e.g. 'acme-pay'"],
    framework: Annotated[Literal["EU_AI_ACT","GDPR","SOC2","HIPAA","ISO_42001","NIST_AI_RMF"], "..."],
    claimed_controls: Annotated[List[str], "control IDs operator asserts are in place"],
    description: Annotated[str, "free text, kept only for tier classification"] = "",
) -> dict:
    """Issue a signed compliance passport. Calls csoai-org-v2.vercel.app/api/assess.
    Returns Ed25519-signed JSON-LD with report_id, body, sig, pub, verify_url.
    Operator can hand the verify_url to their DPO / auditor for offline check."""
```

### Tool 3 — `verify_passport`
```python
@mcp.tool()
def verify_passport(receipt_id: Annotated[str, "report_id from issue_passport"]) -> dict:
    """Look up a SIGIL receipt by report_id. Returns active/expired/revoked
    + the issuing timestamp + signer pubkey fingerprint. Receipts are append-only."""
```

### Tool 4 — `list_active_passports`
```python
@mcp.tool()
def list_active_passports(
    tenant_id: Annotated[str, "your own audit-tenant ID, e.g. 'acme-compliance-2026'"],
    days: Annotated[int, "lookback window"] = 90,
) -> dict:
    """Return passports this tenant issued in the last `days`. The buyer's own
    audit log. Filter on tenant_id from locally-cached receipts."""
```

### Tool 5 — `generate_annex_iv`
```python
@mcp.tool()
def generate_annex_iv(
    system_id: Annotated[str, "the AI system to document"],
    passport_id: Annotated[str, "report_id from issue_passport"] = None,
) -> dict:
    """Pull the passport, fill the EU AI Act Annex IV technical-documentation
    template (Items 1-9), return a signed PDF + JSON-LD bundle. The 11 fields
    per Art 11 + Annex IV."""
```

---

## Test cases (10+ per file)

### test_endpoints.py
1. `classify_use_case` on NHS triage bot → returns `high_risk`
2. `classify_use_case` on a calculator → returns `minimal`
3. `classify_use_case` on social scoring → returns `prohibited`
4. `issue_passport` validates `framework` enum, rejects unknown with 422
5. `issue_passport` validates `claimed_controls` is list of strings
6. `issue_passport` returns `report_id` matching pattern `[a-f0-9]{16}`
7. `verify_passport` rejects malformed IDs with 422
8. `list_active_passports` rejects negative `days` with 422
9. `generate_annex_iv` produces 11-section JSON
10. `generate_annex_iv` signs output via same Ed25519 keypair

### test_passport_client.py
1. Live POST /api/assess returns 200 + valid JSON
2. **Skip if HTTP 000** (network unavailable — graceful fallback)
3. Response includes `alg: "ed25519"` and base64 sig
4. `verify_url` matches expected path pattern
5. Error response includes `error` key with canonical message

### test_ed25519_verify.py
1. Verify a known-good passport (`7f54374a9836282a`) — must pass
2. Tamper with `body.system` → must fail with 422
3. Tamper with `sig` → must fail with 422
4. Wrong pubkey → must fail with 422
5. Empty body → must fail with 422
6. Replay attack (re-issue with same body) → must succeed (passports are append-only)
7. Cross-verify between two different MCP installs (pub keys match)

### test_annex_iv.py
1. Generate Annex IV with all 11 sections present
2. Section 9 (training data summary) is non-empty for EU AI Act
3. Output PDF is readable (size > 10 KB)
4. Output JSON-LD includes signed passport

---

## Terminal-style demo

```bash
$ claude mcp add meok-sovereign-aiact-passport /path/to/server.py

$ claude "Issue me a passport for acme-pay, EU AI Act, with art12_logging + art14_human_oversight in place"
{
  "report_id": "7f54374a9836282a",
  "tier": "limited_risk",
  "verdict": "remediate",
  "compliance_score": 0.625,
  "gaps": ["art13_transparency", "art15_accuracy_robustness", "art50_transparency_obligations"],
  "verify_url": "https://csoai-org-v2.vercel.app/verify?id=7f54374a9836282a",
  "signed_manifest": { "alg": "ed25519", "pub": "...", "sig": "..." }
}

$ claude "Verify this passport"
{
  "status": "active",
  "issued_at": "2026-07-08T04:22:59Z",
  "system": "acme-pay",
  "ed25519_signature_valid": true
}

$ claude "Generate Annex IV for this system"
{
  "annex_iv_url": "/tmp/annex_iv_acme-pay_2026-07-08.json",
  "sections_present": 11,
  "sections_complete": 11,
  "signed": true,
  "size_bytes": 18432
}
```

---

## Migration / linking to existing /api/assess

The MCP does **not** rebuild the passport engine. It uses the existing Phase-529 fix (post-deploy). The only build effort:

1. **New:** the wrapper around `/api/assess` (passport_client.py)
2. **New:** the MCP server glue (server.py + endpoints.py)
3. **New:** local Annex IV templating (annex_iv.py + docs/ANNEX_IV_TEMPLATE.json)
4. **New:** Ed25519 verifier (ed25519_verify.py — mostly reuses the existing one in /csoai-org-v2/src/app/verify/VerifyClient.tsx but in Python)

**No changes to:** `/api/assess`, the csoai-org-v2 Next.js code, or Vercel deploy.

---

## Pricing tier mapping

| Tier | Persona | MCP role |
|------|---------|----------|
| Free (3 calls/day, anon) | Bootstrapping founder | try without signup |
| Pro (£499/mo) | DPO buying one seat | unlimited calls, 5 own tenants |
| Gov (£2,499/mo) | DPO + team | unlimited + SSO + audit log export |
| Enterprise (£9,999+/mo) | Compliance team | unlimited + on-prem option + custom frameworks |

The MCP itself is **free to install** (MIT). The **backend** (passport API + SIGIL storage) is what we sell.

---

## Build time estimate

| Phase | Effort |
|-------|--------|
| Module scaffolding + pyproject + README | 1 hour |
| 5 tool definitions + schema validation | 2 hours |
| passport_client wrapper | 30 min |
| ed25519_verify (with tamper tests) | 1.5 hours |
| annex_iv templating | 1.5 hours |
| 40+ tests + CI | 2 hours |
| Docs + README + EU AI Act citation | 1 hour |
| **Total** | **~9.5 hours = one focused day** |

---

## Build dependency

**Phase-529 fix** (the API scoring engine branching on framework) **must be deployed first** to land. Otherwise `issue_passport` returns the old always-the-same-gaps behavior that today is the bug.

After Gate A fires (`vercel --prod` on csoai-org-v2), this MCP becomes useful.

---

## Revenue impact (honest math)

| Persona | Outreach target | Conv. 3-7% | Yield | MRR contribution |
|---------|----------------|-------------|-------|------------------|
| Marcus | 50 BayLDA/IAPP DACH | 5% | 2.5 → 1-2 paying | £500-£1,000/mo |
| Fatima | 10 Big 4 EU AI Act partners | 10% | 1 partner × 5 client ref | £1,250-£2,500/mo |
| Yuki | 30 JP/APAC CISOs wanting EU export | 3% | 1 paying | £499/mo |
| **Total** | **90 outreach** | ~5% | **2-3 direct + 1 partner** | **£2,250-£4,000/mo** |

That's the **first revenue** if we ship this MCP in 7 days.

---

## SIGIL

CJ1-AIACT-PASSPORT-SPEC · 2026-07-08 · Ed25519