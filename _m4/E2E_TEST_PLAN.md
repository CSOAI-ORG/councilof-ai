# E2E TEST PLAN — 9 PM BST (1 Jul 2026 → 4 Jul 09:00 BST)

> **The 6-day end-to-end test plan for the CSOAI/MEOK launch.**
> **Each day = one round of E2E. Each round tests a different aspect of the substrate.**

---

## The 6-day schedule (T-3 → T-0)

```
Wed 1 Jul 21:00 BST  ·  ROUND 1 · Substrate + SIGIL chain + BFT council
Thu 2 Jul 21:00 BST  ·  ROUND 2 · OSCAL proof + 16 sovereign-law frameworks
Fri 3 Jul 21:00 BST  ·  ROUND 3 · i-character wizard + sov.space marketplace
Sat 4 Jul 04:00 BST  ·  ROUND 4 · Final smoke + dry-run
Sat 4 Jul 09:00 BST  ·  🚀 LAUNCH
```

---

## ROUND 1 — Wed 1 Jul 21:00 BST (T-3) · Substrate + SIGIL chain + BFT

**Goal:** Verify the 8 Layer-0 protocols are operational, the SIGIL chain is live, the BFT council can deliberate, the Care Floor 0.95 is enforced.

### 8 checks

| # | Check | How | Expected |
|---|---|---|---|
| 1 | MCP federation | Curl 1 of 531 MCPs | 200 OK + tools list |
| 2 | Legacy bridges | Curl 1 of 22 bridges (e.g. cobol-bridge) | 200 OK + read_cobol works |
| 3 | A2A substrate | Curl A2A endpoint | 200 OK + agent list |
| 4 | x402 payments | Create + pay an invoice | 200 OK + SIGIL receipt |
| 5 | SIGIL attestation | Emit a SIGIL event | 200 OK + hash chain appended |
| 6 | OSCAL / FedRAMP | Verify a component | 200 OK + sha256 matches |
| 7 | BFT council | Submit a proposal | 200 OK + 22-of-33 votes |
| 8 | Compliance Passport | Issue a passport | 200 OK + W3C VC + EU AI Act Art 50 |

### The 1-line test (after each check)

```bash
# From the substrate's test suite
python3 -m pytest tests/ -v --tb=short
```

### Pass criteria

- 8/8 checks pass
- SIGIL chain grows by 8 events
- BFT council approves 1 proposal (22-of-33 votes)
- OSCAL proof verifies (sha256 matches)

---

## ROUND 2 — Thu 2 Jul 21:00 BST (T-2) · OSCAL proof + 16 sovereign-law frameworks

**Goal:** Verify the OSCAL proof is verifiable in any browser + the 16 sovereign-law frameworks are all loaded + the compliance crosswalk is accurate.

### 12 checks

| # | Check | How | Expected |
|---|---|---|---|
| 1 | OSCAL proof (canonical sha256) | Curl oscal-verifier | "signature verifies: True" |
| 2 | EU AI Act (in force 2 Aug 2026) | Verify all 99 articles mapped | 99/99 |
| 3 | GDPR | Verify Article 6(1)(a-f) lawful bases | 6/6 |
| 4 | DORA | Verify 5 pillars | 5/5 |
| 5 | NIS2 | Verify 21 measures | 21/21 |
| 6 | CRA | Verify Annex IV (in force 10 Dec 2027) | All Annex IV points mapped |
| 7 | NIST AI RMF | Verify 4 functions + 7 trustworthy characteristics | 11/11 |
| 8 | ISO/IEC 42001 | Verify 7 Annex A controls | 7/7 |
| 9 | ISO/IEC 27001 | Verify 93 Annex A controls | 93/93 |
| 10 | IEEE 7000 series | Verify 12 standards (P7000-P7011) | 12/12 |
| 11 | SOC 2 | Verify 33 Common Criteria | 33/33 |
| 12 | HIPAA + PCI DSS + NIST CSF + Global Law + Crosswalk + Audit | Verify all | 4/4 frameworks + 3/3 meta files |

### Pass criteria

- 12/12 checks pass
- Average composite score: 7.43/10 (A+++++)
- All 12 frameworks satisfy the 52-cell crosswalk

---

## ROUND 3 — Fri 3 Jul 21:00 BST (T-1) · i-character wizard + sov.space marketplace

**Goal:** Verify the i-character wizard converts 80%+ of visitors + the sov.space marketplace has 100+ MCPs published + the social authority badge system is functional.

### 5 checks

| # | Check | How | Expected |
|---|---|---|---|
| 1 | i-character wizard (5 steps) | Walk through 5 steps | DID + W3C VC + sovereign JWT + i-character + Bronze badge |
| 2 | Sovereign DB | Verify 13 tables + 18/18 tests | 13/13 tables + 18/18 tests pass |
| 3 | sov.space marketplace | Curl marketplace | 531 MCPs catalog + 22 bridges |
| 4 | Fork hub | Curl fork-hub | 8 protocols + 3 plug-in patterns |
| 5 | Social authority badge | Emit 1+ SIGIL events + 1+ BFT votes | Bronze badge awarded |

### Pass criteria

- 5/5 checks pass
- i-character wizard converts (5 steps in <3 minutes)
- Bronze badge awarded within 5 SIGIL events

---

## ROUND 4 — Sat 4 Jul 04:00 BST (T-0, T-5h) · Final smoke + dry-run

**Goal:** Verify everything is launch-ready. Run the 10-check `_LAUNCH_READINESS_CHECK.py`. Run the 9-step `M4_LAUNCH_FIRE` in dry-run mode.

### 10 checks (the launch readiness check)

1. Charters at 8KB+ (61/61)
2. Sovereign-law files at 8KB+ (16/16)
3. HTML surfaces A+++++ (144/144)
4. OSCAL proof (canonical SHA-256 + sig)
5. PR tracker (5 PRs)
6. Overnight crons (2 active)
7. Sovereign corpus (668 components)
8. Desktop bundle (drag-ready)
9. GitHub repos A+++++ (32/32)
10. Sovereign DB tests (18/18 pass)

### Pass criteria

- 10/10 checks pass
- M4_LAUNCH_FIRE dry-run completes in <30 seconds
- All 142 surfaces load in <2 seconds
- SIGIL chain is live + BFT operational + OSCAL proof verifiable

---

## 🚀 LAUNCH — Sat 4 Jul 09:00 BST

```bash
# 04:00 — Final smoke + dry-run
python3 _m4/_LAUNCH_READINESS_CHECK.py
python3 _m4/M4_LAUNCH_FIRE_2026_07_04.py --dry-run

# 04:30 — Run the 6 round tests
bash _m4/E2E_TEST_PLAN.md

# 06:00 — Final check
python3 _m4/_LAUNCH_READINESS_CHECK.py

# 08:00 — Owner fires 1-move (3 tokens + ship + deploy = 28 min)
export PYPI_TOKEN=*** NPM_TOKEN=*** VERCEL_TOKEN=***
mcp-publisher login github
bash scripts/ship-everything.sh
cd ~/clawd/meok-deploy && vercel --prod --yes --token "$VERCEL_TOKEN"

# 08:55 — Verify all 142 surfaces live
curl -s -o /dev/null -w "%{http_code} catapult\n" https://csoai.org/csoai-os/catapult.html
# ... 142 surfaces total

# 08:58 — Verify SIGIL + BFT + OSCAL
curl -s https://csoai.org/api/v1/sigil/recent | head -5
curl -s https://csoai.org/api/v1/bft/active | head -5
curl -s https://csoai.org/csoai-os/oscal-verifier.html | head -5

# 09:00 — 🚀 LAUNCH
python3 _m4/M4_LAUNCH_FIRE_2026_07_04.py --yes

# 09:05 — Post 5-tweet thread
# (manually copy-paste from CSOAI_LAUNCH_THREAD_2026-07-04.md)

# 09:10 — Send LinkedIn post
# (manually copy-paste from LAUNCH_READY_2026-07-01.md)

# 09:30 — Start monitoring traffic
# (use launch dashboard)

# 10:00 — First design-partner call (Monzo target)
```

---

## The 4 test scripts (for the rounds)

### ROUND 1 script
```bash
# tests/test_round_1.py
import pytest
import httpx
import json

BASE = "https://api.csoai.org/v1"

def test_mcp_federation():
    r = httpx.get(f"{BASE}/mcps?limit=1")
    assert r.status_code == 200
    assert "mcps" in r.json()
    assert len(r.json()["mcps"]) > 0

def test_legacy_bridges():
    r = httpx.get(f"{BASE}/bridges?limit=1")
    assert r.status_code == 200
    assert "bridges" in r.json()

def test_a2a_substrate():
    r = httpx.get(f"{BASE}/a2a/agents?limit=1")
    assert r.status_code == 200
    assert "agents" in r.json()

def test_x402_payment():
    r = httpx.post(f"{BASE}/x402/invoice", json={"service": "test", "tier": "Free", "quantity": 1})
    assert r.status_code == 200
    invoice_id = r.json()["invoice_id"]
    r2 = httpx.post(f"{BASE}/x402/pay", json={"invoice_id": invoice_id})
    assert r2.status_code == 200

def test_sigil_attestation():
    r = httpx.post(f"{BASE}/sigil/emit", json={"actor": "test", "action": "e2e_test", "payload": {}})
    assert r.status_code == 200
    assert "hash" in r.json()

def test_oscal_fedramp():
    r = httpx.get(f"{BASE}/oscal?component_id=sov.ai_act_50")
    assert r.status_code == 200

def test_bft_council():
    r = httpx.post(f"{BASE}/bft/proposal", json={"title": "e2e test", "proposer": "M4"})
    assert r.status_code == 200
    assert r.json()["approved"] is True

def test_compliance_passport():
    r = httpx.post(f"{BASE}/passport/issue", json={"did": "did:csoai:test-001"})
    assert r.status_code == 200
    assert "vc" in r.json()
```

### ROUND 2 script
```bash
# tests/test_round_2.py
import pytest
import httpx

BASE = "https://api.csoai.org/v1"

def test_oscal_canonical():
    r = httpx.get(f"{BASE}/oscal/canonical_sha256")
    assert r.status_code == 200
    assert len(r.json()["sha256"]) == 64

def test_eu_ai_act():
    r = httpx.get(f"{BASE}/law/eu-ai-act")
    assert r.status_code == 200
    assert r.json()["articles_count"] == 99

def test_gdpr():
    r = httpx.get(f"{BASE}/law/gdpr")
    assert r.status_code == 200
    assert r.json()["lawful_bases_count"] == 6

# ... 10 more tests
```

### ROUND 3 script
```bash
# tests/test_round_3.py
import pytest
import httpx

BASE = "https://api.csoai.org/v1"

def test_icharacter_wizard():
    # Walk through 5 steps
    r = httpx.post(f"{BASE}/icharacter/create", json={
        "name": "Test User",
        "sovereign_domains": ["healthcare"],
        "location": {"lat": 51.5074, "lon": -0.1278, "precision": 100},
        "preferences": {"radius_km": 5, "transport": ["walking"]},
        "bft_tier": "Bronze",
        "ai_ethics": {"care_floor": 0.95}
    })
    assert r.status_code == 200
    assert "did" in r.json()
    assert "vc" in r.json()
    assert r.json()["tier"] == "Bronze"

def test_sovspace_marketplace():
    r = httpx.get(f"{BASE}/marketplace?limit=10")
    assert r.status_code == 200
    assert r.json()["count"] >= 531

# ... 3 more tests
```

### ROUND 4 script (the final smoke)
```bash
# Already have _m4/_LAUNCH_READINESS_CHECK.py
# Run it:
python3 _m4/_LAUNCH_READINESS_CHECK.py
```

---

## The 4 success criteria for the entire 6-day test

1. **All 8 Layer-0 protocols operational** (Round 1)
2. **All 16 sovereign-law frameworks + 3 meta files verified** (Round 2)
3. **i-character wizard converts 80%+ + sov.space has 100+ MCPs** (Round 3)
4. **10/10 launch readiness check pass + M4_LAUNCH_FIRE dry-run completes** (Round 4)

If all 4 rounds pass, the launch is GO.

---

## The escalation procedure (if a check fails)

1. **Check the substrate logs** — `tail -f /tmp/sov3.log`
2. **Check the hermes cron logs** — `hermes cron log <job_id>`
3. **Check the SOV3 BFT council** — `curl https://csoai.org/api/v1/bft/active`
4. **Check the OSCAL proof** — `python3 mcp-marketplace/oscal-generator-mcp/gen_layer0_package.py`
5. **Re-run the check** — if it passes, log the incident
6. **If it fails again** — escalate to the sovereign-orchestrator (M4 lane) + the substrate council (33-agent BFT)
7. **If the BFT can't resolve** — escalate to the user (Nick)

---

## The 4 timeouts per check

- HTTP check: **5 seconds** (must respond in <5s)
- OSCAL verify: **10 seconds** (must verify in <10s)
- SIGIL emit: **2 seconds** (must emit in <2s)
- BFT deliberation: **2.0s cycle** (must deliberate in <2.0s)

---

## The 5 reporting channels

1. **Console output** — `pytest -v`
2. **OverNIGHT.log** — `tail -f _m4/_overnight.log`
3. **M2 handoff report** — `csoai-os/self-catalog.html`
4. **CLAIM board** — `AGENTS.md`
5. **Slack/email** — (if connected)

---

**Built 1 Jul 2026 05:10 BST · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula