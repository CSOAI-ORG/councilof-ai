# RUNBOOK — Series A 7-day sprint

This is the **operator's view** of `clawd/csoai-launch-pack/`. Every file is wired to
the Sovereign Layer Zero Charter v1.0 (SHA-256 `df65a658…22054`). The
`/api/signup` flow is **production-shaped** (returns charter anchor, sigil mint,
STR pubkey, red-lines list, audit URL on every signup).

## THE 4 IRREVERSIBLE ACTIONS (yours only)

| # | Action | Where | Time |
|---|---|---|---|
| 1 | Create GitHub repo `CSOAI-ORG/SOVEREIGN-LAYER-ZERO-CHARTER` | https://github.com/organizations/CSOAI-ORG/repositories/new | 60s |
| 2 | Push 27 files | one terminal command | 30s |
| 3 | Enable Stripe live mode + create £999 Payment Link | https://dashboard.stripe.com | 5 min |
| 4 | Send the £999 link to 3 warm targets | mailto: | 10 min |

**All other 95% of the 7-day sprint JEEVES does autonomously.**

## The sovereign API — what runs where

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Browser / 8 personas / 12 industries / 4 jurisdictions     │
│     → static HTML on csoai-static-deploy2.vercel.app            │
│     → CTA: GET https://app.csoai.org/signup                     │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Sovereign signup + sovereign signup-api                    │
│     /Users/nicholas/clawd/csoai-launch-pack/signup_api.py        │
│     /Users/nicholas/clawd/csoai-launch-pack/local_signup_server.py│
│     → POST /api/signup returns Charter-anchored payload         │
│     → stored in ~/.sovereign/signups.jsonl                      │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Sovereign assess (the actual model + 12 mind-sets)         │
│     /Users/nicholas/clawd/csoai-launch-pack/sovereign_api.py   │
│     → 30 sovereign tools + 12 mind-sets + Qwen3-30B-A3B       │
│     → every emit → sigil chain (RFC 8032 Ed25519)              │
│     → /api/assess returns charter-anchored audit receipt        │
│     → "audit_url": "https://proofof.ai/audit/<digest>"          │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Sovereign SIGIL chain (public, browser-verifiable)          │
│     /Users/nicholas/.sovereign/sigil_chain.jsonl                │
│     → every receipt is Ed25519-signed, hash-chained            │
│     → public mirror at proofof.ai/audit/<digest>                │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Sovereign Trust Root (RFC 8032)                             │
│     pubkey: QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28   │
│     alg: ed25519, RFC 8032 §7.1 verified byte-for-byte          │
│     jurisdiction: GB (CSOAI Ltd, UK 16939677)                  │
└─────────────────────────────────────────────────────────────────┘
```

## How to run the sovereign API end-to-end (D1-D3 today)

### Step 1 — pull Qwen3-30B-A3B (in background, 18 GB)
```bash
ollama pull qwen3:30b-a3b   # ~15-30 min, CPU+GPU
# In the meantime, the API auto-falls back to qwen2.5:3b (already on the Mac)
```

### Step 2 — start the sovereign API server
```bash
cd /Users/nicholas/clawd/csoai-launch-pack
python3 local_signup_server.py    # serves signup.html on :5000
# OR
python3 sovereign_api.py          # standalone CLI demo
```

### Step 3 — verify the E2E
```bash
# 1. Signup → Charter-anchored key
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","company":"Co"}'

# Returns:
# {
#   "status": "created",
#   "api_key": "csoai_...",
#   "did": "did:csoai:...",
#   "charter": {"sha256": "df65a658...22054", ...},
#   "sovereign_trust_root": {"str_uri": "str:v1:QD595...@GB", "alg": "ed25519", "rfc8032_compliant": true}
# }

# 2. Assess with the meta-mind-set
python3 sovereign_api.py --assess '{"system":"my-prod-system","mindset":"meta","jurisdiction":"EU"}'

# Returns:
# {
#   "receipt_id": "...",
#   "sigil_digest": "...",
#   "audit_url": "https://proofof.ai/audit/...",
#   "model": "qwen3:30b-a3b" or "qwen2.5:3b (fallback)",
#   "response": "EU AI Act Art 50: 4 disclosure pillars met. C2PA manifest generated. Verifiable."
# }
```

### Step 4 — verify the SIGIL
```bash
python3 sovereign_api.py --sigil-count
# {"sigil_chain_length": 5}

# Each receipt is a JSON line in ~/.sovereign/sigil_chain.jsonl
# with: op, ts, intent, body, digest, prev_sig, signature, alg, pubkey
```

## The 8 personas (all 8 pages built)

| Persona | Industry | Jurisdiction | File |
|---|---|---|---|
| CTO · SaaS · EU | SaaS | EU | `pages/cto-eu-saas.html` |
| CISO · Fintech · US | Fintech | US | `pages/ciso-us-fintech.html` |
| Compliance · Health · EU | Health | EU | `pages/compliance-eu-health.html` |
| VP Risk · Banking · UK | Banking | UK | `pages/vp-uk-banking.html` |
| ML Lead · Health-tech · US | Health-tech | US | `pages/ml-us-health.html` |
| Policy · Central bank · AU | Sovereign | AU | `pages/policy-au-central-bank.html` |
| CISO · Defence · UK | Defence | UK | `pages/ciso-uk-defence.html` |
| Indie · anywhere | Indie | Anywhere | `pages/indie-anywhere.html` |

## The 4 jurisdictional overlays (all 4 pages built)

| Jurisdiction | File |
|---|---|
| EU | `pages/jurisdiction-eu.html` |
| US | `pages/jurisdiction-us.html` |
| UK | `pages/jurisdiction-uk.html` |
| AU/NZ/CA | `pages/jurisdiction-au.html` |

## The 12 mind-sets in /api/assess

```python
MIND_SETS = {
    "1_forensic":          "EU AI Act Art 50 watermarking audit",
    "2_risk_classifier":   "EU AI Act Art 6 + Annex III risk tier",
    "3_human_oversight":   "EU AI Act Art 14 9-layer human oversight plan",
    "4_bias_fairness":     "EU AI Act Art 10 bias audit",
    "5_cybersecurity":      "EU AI Act Art 15 cyber posture",
    "6_gdpr":              "GDPR Art 6, 9, 17, 22, 30, 32, 35 machine-check",
    "7_iso_42001":         "ISO 42001 A.5-A.10 control mapping",
    "8_nist_rmf":          "NIST AI RMF Map/Measure/Manage/Govern",
    "9_soc2":              "SOC 2 Type II CC1-CC9 mapping",
    "10_dora":             "DORA Regulatory Technical Standards for AI",
    "11_uk_ai_bill":       "UK AI Bill 5 principles assurance",
    "12_nis2":             "NIS2 incident reporting + supply-chain",
    "meta":                "Chains 1, 2, 3, 6, 9, 12 — covers 6 frameworks in one call",
}
```

## The 30 sovereign tools (each is a /api/<tool> endpoint)

| # | Tool | Endpoint | Output |
|---|---|---|---|
| 1 | eu-ai-act-quick-scan | POST /api/quick-scan | EU AI Act risk tier |
| 2 | article-50-passport | POST /api/passport | Article 50 receipt |
| 3 | gdpr-classify | POST /api/gdpr | GDPR Art 6 + Art 9 assertions |
| 4 | iso-42001-aims | POST /api/iso-42001 | AIMS control mapping |
| 5 | nist-ai-rmf | POST /api/nist-rmf | RMF category mapping |
| 6 | soc2-tsc | POST /api/soc2 | TSC criterion mapping |
| 7 | dora-rts | POST /api/dora | RTS requirement mapping |
| 8 | nis2-incident | POST /api/nis2 | Incident-readiness check |
| 9 | uk-ai-bill | POST /api/uk-bill | 5-principle assurance |
| 10 | hipaa-privacy | POST /api/hipaa | HIPAA Privacy Rule |
| 11 | mcp-injection-scan | POST /api/inject | Prompt-injection audit |
| 12 | bias-audit | POST /api/bias | Quantitative fairness |
| 13 | sigstore-attest | POST /api/sigstore | Sigstore-style attestation |
| 14 | oscal-component | POST /api/oscal | OSCAL 1.1.2 component def |
| 15 | oscal-ssp | POST /api/oscal-ssp | OSCAL SSP |
| 16 | oscal-poam | POST /api/oscal-poam | Plan of Action & Milestones |
| 17 | c2pa-mark | POST /api/c2pa | C2PA 2.0 manifest |
| 18 | c2pa-verify | GET /api/c2pa/<id> | C2PA verify |
| 19 | sigil-emit | POST /api/sigil | Emit 1 SIGIL receipt |
| 20 | sigil-verify | GET /api/sigil/<id> | Verify SIGIL |
| 21 | str-resolve | GET /api/str/<did> | Resolve STR |
| 22 | care-floor-check | POST /api/care | Care Floor ≥ 0.95 |
| 23 | bft-council-vote | POST /api/bft | 33-agent BFT vote |
| 24 | human-oversight | POST /api/ho | Art 14 9-layer plan |
| 25 | frisk-frontend | POST /api/frisk | EU AI Act Art 26 FRIA |
| 26 | risk-tier-classify | POST /api/tier | Annex III |
| 27 | audit-verify | GET /api/audit/<id> | Full audit replay |
| 28 | signature-verify | POST /api/sig-verify | RFC 8032 verify |
| 29 | sso-did | GET /api/sso/<did> | did:csoai SSO |
| 30 | screenshot-pass | GET /api/pass/<id>.png | PNG of the receipt |

## The 4-number north star (track hourly)

| Metric | T+0 (now) | T+24h | T+48h | T+72h | T+96h | T+120h | T+144h | T+168h |
|---|---|---|---|---|---|---|---|---|
| **Signups** | ? | 50 | 200 | 500 | 1,000 | 2,000 | 5,000 | 10,000 |
| **Passports issued** | 0 | 50 | 500 | 2,000 | 5,000 | 20,000 | 50,000 | 100,000 |
| **£999 sales** | 0 | 0 | 0 | 1 | 2 | 3 | 5 | 8 |
| **£199/mo recurring** | 0 | 0 | 0 | 0 | 1 | 2 | 4 | 8 |

## File map (csoai-launch-pack)

```
csoai-launch-pack/
├── README.md                            ← owner-4-actions summary
├── 01-stripe-999-packet.md             ← £999 sale packet
├── 02-gap-analysis-4950-onepager.md   ← £4,950 gap analysis one-pager
├── 03-security-estate-runbook.md      ← firewall + secret rotation
├── 04-dns-os-csoai-org.md             ← Namecheap CNAME
├── signup.html                        ← 357-line signup form
├── signup_api.py                      ← POST /api/signup + auth
├── local_signup_server.py             ← Flask server on :5000
├── sovereign_api.py                    ← 12 mind-sets + 30 tools + Qwen3
├── personas/
│   ├── cta-helper.py                  ← 8 personas + 4 jurisdictions emitter
│   ├── index.html                     ← persona picker
│   ├── payload.js
│   └── pages/
│       ├── cto-eu-saas.html
│       ├── ciso-us-fintech.html
│       ├── compliance-eu-health.html
│       ├── vp-uk-banking.html
│       ├── ml-us-health.html
│       ├── policy-au-central-bank.html
│       ├── ciso-uk-defence.html
│       ├── indie-anywhere.html
│       ├── jurisdiction-eu.html
│       ├── jurisdiction-us.html
│       ├── jurisdiction-uk.html
│       ├── jurisdiction-au.html
│       └── index.html
├── PLAN_2026-07-02_revise-and-align.md
├── AGENTIC_THREAT_DEFENSE_OUTREACH.md
└── RUNBOOK.md                          ← this file
```

## Charter anchor (every page, every API, every receipt)

| Field | Value |
|---|---|
| Charter SHA-256 | `df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054` |
| Sigil mint digest | `77ab0e6f9d6c77e8` |
| STR pubkey (Ed25519) | `QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28` |
| Sovereign model (Charter Art 16) | Qwen3-30B-A3B (Apache-2.0, 3B active) |
| Working model (immediate) | qwen2.5:3b (already on Mac) |
| RFC 8032 §7.1 Test 1 | **VERIFIED** byte-for-byte |
| License — Charter | CC0 1.0 |
| License — ref impl | Apache-2.0 |
| Compute-light | 1 e2-micro + MacBook Air M2 |
| Article 15 red lines | immutable (no kinetic, no surveillance, no AUKUS-without-letter, no defonos.io) |
