# Press Outreach Bundle — 15 Jun 2026 (Article 50 / EU Code of Practice sprint)

5 artifacts from the 48-day EU AI Act Article 50 sprint. All built on the GCP VM (35.242.143.249) sovereign substrate (5 services live, 79 SOV3 agents, 3 MCPs wired, v2 keep-alive cron).

## The 5 files

| File | Size | What |
|---|---|---|
| `PRESS_OUTREACH_LIST_2026-06-15.md` | 6.2 KB | 26 contacts across 5 tiers (tech press / reg-fintech / EU AI Act specialists / gambling / Gulf) — best-guess email patterns, NOT verified |
| `PRESS_RELEASE_2026-06-15_article-50-sprint.md` | 12.9 KB | 3 headline options + 350-word AP-style body + Show HN + LinkedIn + 5-step send plan |
| `PITCH_MGX_MEOK_2026-06-15.md` | 6.7 KB | Gulf pitch 3-pager for MGX / HUMAIN / SDAIA — £2M anchor proposal, 5-min demo, honest disclosure |
| `FEAST_x_MEOK_matrix.md` | 8.1 KB | FEAST report × MEOK portfolio strategic matrix — 6×12 cross-map of regulatory cells to hives |
| `SUBSTRATE_DISCOVERY_2026-06-15.md` | 6.5 KB | Kimi WebBridge discoveries (meok.ai bound to ui project) + the 6-step alignment protocol |

## The 26 press emails

**Generated separately** at `/home/nicholas/meok-compliance-gateway/press_outbox/` on the VM (non-volatile, 26 .eml + 1 _summary.csv).

**To regenerate:** `ssh meok-backend 'python3 /home/nicholas/meok-compliance-gateway/press_send.py'`

## The live URL (for the press)

**Public preview:** `https://meok-q4e0w62es-niks-projects-0a2ef942.vercel.app/eu-code-of-practice`

⚠️ Currently 401 (Vercel Standard Protection). 2-min dashboard fix: WebBridge → vercel.com → meok-ai → Settings → Security → turn off Standard Protection.

## The 2 min review before sending

1. `cd /home/nicholas/meok-compliance-gateway/press_outbox/`
2. `cat _summary.csv` — see the 26 contacts
3. `cat tier_3_eu_ai_act_specialists..._luca-bertuzzi.eml` — see the email template (the verified beat-match for EURACTIV)
4. For the 5-10 highest-leverage ones, manually verify via LinkedIn or the outlet's contact page
5. Send 3-5 as a test batch, gauge response, then the rest

## The 3 in-your-queue manual actions

1. **Vercel Standard Protection toggle** (2 min) — makes the live preview URL public
2. **Verify 5-10 Tier 1 emails** (10 min) — best-guess patterns need real verification before send
3. **Wait for PyPI cron** (1-24h) — the 3 MCPs will land on PyPI when the project-creation throttle clears
