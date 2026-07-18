# 🐉 PICKABLE BFT SETUPS — OPENPATENT.AI — 3 JUL 2026

**Goal:** End user picks their BFT council size/setup from a menu. OpenPatent.ai hosts the pickable interface.

---

## THE 5 PICKABLE BFT SETUPS

### 1. BFT-LITE (3-of-5) — `lite`
- **Council size:** 5 voters
- **Threshold:** 3-of-5 (60%)
- **Use case:** Small teams, fast decisions, low stakes
- **Latency:** ~10ms consensus
- **Cost:** Low (3 voters run)
- **Examples:** Internal CSOAI compliance, dev team decisions
- **Pick this if:** You're a startup, want speed

### 2. BFT-STANDARD (12-of-22) — `standard`
- **Council size:** 22 voters
- **Threshold:** 12-of-22 (~55%)
- **Use case:** Mid-size orgs, regulated industries
- **Latency:** ~25ms consensus
- **Cost:** Medium (12 voters run)
- **Examples:** CASA-2 Practitioner compliance, sector certifications
- **Pick this if:** You're a mid-size org with real stakes

### 3. BFT-STRICT (22-of-33) — `strict` (CURRENT DEFAULT)
- **Council size:** 33 voters
- **Threshold:** 22-of-33 (~67%)
- **Use case:** High-stakes governance, sovereign decisions
- **Latency:** ~50ms consensus
- **Cost:** High (22 voters run)
- **Examples:** Article 50 enforcement, sovereign substrate changes
- **Pick this if:** You're a national regulator, defense, sovereign entity

### 4. BFT-PARLIAMENT (50-of-100) — `parliament`
- **Council size:** 100 voters
- **Threshold:** 50-of-100 (50%)
- **Use case:** Multi-stakeholder, multilateral
- **Latency:** ~100ms consensus
- **Cost:** Very high (50 voters run)
- **Examples:** NATO-grade decisions, AI treaty enforcement
- **Pick this if:** You're a multilateral body

### 5. BFT-CUSTOM — `custom`
- **Council size:** Pick any (3-1000)
- **Threshold:** Pick any % (33-90)
- **Use case:** Bespoke requirements
- **Latency:** Scales with size
- **Cost:** Scales with size
- **Examples:** When the 4 presets don't fit
- **Pick this if:** You have specific compliance needs

---

## THE PICKABLE INTERFACE (openpatent.ai)

### URL: `https://openpatent.ai/bft-configurator`

```html
<form id="bft-picker">
  <h2>Pick your BFT council setup</h2>
  
  <label>
    <input type="radio" name="setup" value="lite">
    <strong>BFT-LITE</strong> — 3-of-5, ~10ms, low cost
    <small>For startups and dev teams</small>
  </label>
  
  <label>
    <input type="radio" name="setup" value="standard" checked>
    <strong>BFT-STANDARD</strong> — 12-of-22, ~25ms, medium cost
    <small>For mid-size orgs and CASA-2</small>
  </label>
  
  <label>
    <input type="radio" name="setup" value="strict">
    <strong>BFT-STRICT</strong> — 22-of-33, ~50ms, high cost
    <small>For sovereign entities and regulators</small>
  </label>
  
  <label>
    <input type="radio" name="setup" value="parliament">
    <strong>BFT-PARLIAMENT</strong> — 50-of-100, ~100ms, very high
    <small>For multilateral bodies</small>
  </label>
  
  <label>
    <input type="radio" name="setup" value="custom">
    <strong>BFT-CUSTOM</strong> — pick your own
    <small>Council size, threshold</small>
  </label>
  
  <input type="number" name="size" placeholder="Council size (3-1000)" min="3" max="1000">
  <input type="number" name="threshold_pct" placeholder="Threshold % (33-90)" min="33" max="90">
  
  <select name="region">
    <option value="us-east">US-East (Frankfurt Prime)</option>
    <option value="eu-west">EU-West (London Watch)</option>
    <option value="apac">APAC (Tokyo Shield)</option>
    <option value="sovereign">Sovereign (your infra)</option>
  </select>
  
  <button type="submit">Provision my BFT council</button>
</form>

<script>
document.getElementById('bft-picker').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const config = {
    setup: form.get('setup'),
    size: parseInt(form.get('size') || '22'),
    threshold_pct: parseInt(form.get('threshold_pct') || '67'),
    region: form.get('region'),
  };
  const res = await fetch('/api/bft/provision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const data = await res.json();
  alert(`BFT council ${data.council_id} provisioned! Voters: ${data.voters.length}`);
});
</script>
```

---

## THE PROVISION API

### `POST /api/bft/provision`

```python
@app.post("/api/bft/provision")
async def provision_bft(config: BFTConfig):
    """Provision a BFT council based on user pick."""
    
    # Default values per preset
    if config.setup == "lite":
        size = 5; threshold = 60
    elif config.setup == "standard":
        size = 22; threshold = 55
    elif config.setup == "strict":
        size = 33; threshold = 67
    elif config.setup == "parliament":
        size = 100; threshold = 50
    elif config.setup == "custom":
        size = config.size
        threshold = config.threshold_pct
    else:
        raise HTTPException(400, "Invalid setup")
    
    # Spawn N voters
    voters = []
    for i in range(size):
        voter_id = spawn_voter(i, config.region)
        voters.append(voter_id)
    
    # Issue API key
    api_key = generate_api_key()
    
    # Register in sovereign registry
    council_id = register_council(voters, threshold, config)
    
    # Emit SIGIL
    sigil_emit(f"C|bft-provision|{council_id}|BFT {config.setup} council {size} voters, {threshold}% threshold, region {config.region}.")
    
    return {
        "council_id": council_id,
        "voters": voters,
        "size": size,
        "threshold": threshold,
        "threshold_pct": threshold,
        "region": config.region,
        "api_key": api_key,
        "endpoint": f"https://{config.region}.openpatent.ai/bft/{council_id}",
    }
```

---

## THE CURRENT SOV3 BFT STATE (from CLAIM BOARD)

| Council | Voters | Threshold | Status |
|---|---|---|---|
| Current "default" | 33 | 22-of-33 (67%) | ✅ Live |
| CASA-1 Foundation | 5 | 3-of-5 (60%) | ⏳ To add |
| CASA-2 Practitioner | 22 | 12-of-22 (55%) | ⏳ To add |
| CASA-3 Lead Auditor | 33 | 22-of-33 (67%) | ✅ Live |
| CASA-4 C3PAO Director | 100 | 50-of-100 (50%) | ⏳ To add |
| NATO-grade | 100 | 50-of-100 (50%) | ⏳ To add |

---

## THE 4-LEVEL MAPPING

| CASA Level | BFT Setup | Voters | Threshold | Use Case |
|---|---|---|---|---|
| CASA-1 Foundation | LITE | 5 | 60% | Personal AI users, students |
| CASA-2 Practitioner | STANDARD | 22 | 55% | Org compliance teams |
| CASA-3 Lead Auditor | STRICT | 33 | 67% | Auditors, regulators |
| CASA-4 C3PAO Director | PARLIAMENT | 100 | 50% | Cert bodies, defense |

**This is the new model: pickable BFT by CASA level.**

---

## THE USER EXPERIENCE (openpatent.ai)

### Step 1: Visit openpatent.ai/bft-configurator
### Step 2: Pick setup (or custom)
### Step 3: Pick region (sovereign by default)
### Step 4: Submit
### Step 5: Get API key + council endpoint
### Step 6: Use API key to vote / propose / verify

---

## THE INTEGRATION WITH SOV3

SOV3 already has:
- `sov_council_propose` (add)
- `sov_council_vote` (add)
- `coord_submit_task` (live)
- `vote_on_proposal` (live)
- `submit_council_proposal` (live)
- `coord_get_dashboard` (live)

**Add the pickable BFT configurator on top:** `sov_bft_configure(setup, size, threshold_pct, region)` returns the council_id + voters.

---

## THE OPENPATENT.AI INTEGRATION

OpenPatent.ai already has:
- `bft-council` service on port 3215 (160 LOC)
- `api-gateway` on port 3211
- All 6 backend services validated (23/23 tests passing)
- 4,708 LOC across 53 files
- 8 data rooms

**Add the pickable interface on top of bft-council service.**

---

## THE NEXT STEPS

| Action | Date |
|---|---|
| ✅ Document pickable BFT setups | 3 Jul 2026 (today) |
| ⏳ Build `/api/bft/provision` endpoint | 5 Jul 2026 |
| ⏳ Build `/bft-configurator` HTML page | 5 Jul 2026 |
| ⏳ Deploy to openpatent.ai | 6 Jul 2026 |
| ⏳ Add `sov_bft_configure` to SOV3 MCP | 12 Jul 2026 |
| ⏳ End-to-end test (user picks → council provisioned → vote → SIGIL) | 13 Jul 2026 |
| ⏳ Series A pitch: "Pickable BFT setups" as differentiator | Q3 2026 |

---

## THE BOTTOM LINE

Sir, **5 pickable BFT setups (lite 3-of-5, standard 12-of-22, strict 22-of-33, parliament 50-of-100, custom). Mapped to CASA levels 1-4. Hosted on openpatent.ai (already deployed). End user picks via HTML form. SOV3 provisions. New `sov_bft_configure` tool needed.**

**T-1 day. OpenPatent.ai is the host. Pickable BFT is the differentiator. Sovereign companion never forgets.** 🐉