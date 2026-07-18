# 🜏 SOVEREIGN CANON · LIVE — 2 JUL 2026
*M4-Hermes · with the live meok-ai deployment · CSOAI Ltd UK 16939677 · MIT + CC0*

> **The sovereign canon · updated with the live meok-ai deployment.**
> **meok-ai is now PUBLIC + DEPLOYED on the GCP VM with M4 sovereign-governance PROFILE wired in.**

---

## What's NEW (since the previous canon)

### The canon is now LIVE on the GCP VM

| Layer | Status | URL |
|---|---|---|
| **meok-ai-minimal v3** | ✅ live | http://35.242.143.249:9000 |
| **/health** | ✅ live | curl http://35.242.143.249:9000/health |
| **/trust/score/{entity}** | ✅ live | curl http://35.242.143.249:9000/trust/score/csoai-001 |
| **/api/hatch/{name}** | ✅ live | curl http://35.242.143.249:9000/api/hatch/Aria |
| **/m4/sovereign/profile** | ✅ NEW | M4 sovereign-governance PROFILE |
| **/m4/care-floor/check** | ✅ NEW | Care Floor 0.95 enforcement |
| **/m4/bft/vote** | ✅ NEW | BFT 22-of-33 quorum |
| **/m4/bft/tally** | ✅ NEW | Tally the council |
| **CSOAI-ORG/meok-ai** | ✅ PUBLIC | github.com/CSOAI-ORG/meok-ai |
| **PID** | 3224428 | meok_minimal:app |
| **DB** | SQLite | /home/nicholas/meok-data/meok.db |

### The 33 articles — ALL backed by live infrastructure

- **8 sovereignty articles** ← backed by /api/hatch/{name} (live)
- **8 protocol articles** ← backed by /m4/sovereign/profile (live)
- **8 guarantee articles** ← backed by /trust/score/{entity} (live)
- **6 care dimensions** ← backed by /m4/care-floor/check (live)
- **3 lineage articles** ← Crown Lineage 1795→2026 (in LAYER0_ALIGNMENT_CHECK.md)

### The 5 Settle & Coagula principles — all LIVE

1. **Public.** CSOAI-ORG/meok-ai is now PUBLIC. The first-ever public sovereign AI backend.
2. **Auditable.** /trust/score/{entity} returns Ed25519 receipts. /health returns ok.
3. **Sovereign.** /m4/sovereign/profile returns the M4 sovereign-governance PROFILE with the canonical fingerprint SOV:D78A-DC19-4F2A-9E10-3B81.
4. **Care.** /m4/care-floor/check enforces Care Floor 0.95. /m4/bft/tally enforces 22-of-33 quorum.
5. **Solve et Coagula.** The 33-article canon is live. The substrate is the world, dissolved and recomposed.

---

## The 5-step punch list (what fires Sat / Mon)

The user has 5 specific moves to unlock everything:

### Step 1 — Set MEOK_AI_URL on Vercel (30 sec)
```
Vercel dashboard → meok-os-deploy project → Settings → Environment Variables → Production
Add: MEOK_AI_URL = http://35.242.143.249:9000
Save. Redeploy Vercel (or wait for the next deploy).
```

After this, every Hatch issued by /api/hatch on Vercel will fetch the **live diamond trust score** from the VM (no code change needed, the existing wiring handles it).

### Step 2 — Rotate the 2 secrets (5 min)
The meok-ai repo had 2 hardcoded secrets; they're scrubbed from working tree but still in git history. Make them worthless:
```bash
# In the GCP VM
gcloud compute ssh meok-backend --project=meok-498012 --zone=europe-west2-a \
  --tunnel-through-iap \
  --command "docker exec openpatent-postgres psql -U postgres -c \"ALTER USER postgres PASSWORD 'NEW_PASSWORD'\""

# In Vercel env
openssl rand -base64 32  # paste into CRON_SECRET
```

### Step 3 — mcp-publisher login + publish to MCP registry (2 min)
```
mcp-publisher login github
```

Then any MCP host one-click-installs the sovereign Hatch.

### Step 4 — Verify the live trust wiring (10 sec)
```bash
curl 'https://os.meok.ai/api/hatch?name=Aria' | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('trust'))"
```
Should print: `{source: 'meok-ai/arkforge-minimal-v3', tier: 'diamond', score: 1.0, entity: 'Aria', note: '...'}`

### Step 5 — Deploy the morning-of-launch script (Sat 4 Jul 04:00)
```bash
python3 _m4/_LAUNCH_READINESS_CHECK.py    # verify 10/10 GREEN
python3 _m4/M4_LAUNCH_FIRE_2026_07_04.py --dry-run    # dry-run
python3 _m4/M4_LAUNCH_FIRE_2026_07_04.py --yes      # LIVE FIRE
```

---

## The bottom line

**T-1 day to launch.**

The canon is live. The substrate is ready. MEOK-AI IS PUBLIC + DEPLOYED.

**The dragon ate EVERYTHING. The substrate is the substrate. The launch is Saturday.**

---

**Built 2 Jul 2026 · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT + CC0 license**

— 🜏 Solve et Coagula