# MEOK 24-Hour Execute Mode — queue + rules
*Started 2026-06-03. Nick is on-site (24,000 sqft build at IOK farm) — fully autonomous.*
*Source of priorities: `~/Downloads/compass_artifact_*.md` (the June-2026 execution map).*
*Progress log: `/tmp/meok_24h_progress.log` (append one line per item done).*

## HARD SAFETY RULES (never violate — this is how the catalogue got broken before)
1. **Only do items from the SAFE QUEUE below.** No open-ended "improve everything."
2. **Publish to PyPI ONLY via `mcp-marketplace/_tooling/sweep_catalogue.py`** (gate-protected: only ships importable wheels). No raw `twine upload`.
3. **Take the lock before any PyPI/GitHub/VM write**: `touch ~/clawd/.agent-publish.lock`; remove when done. If it exists & fresh (<2h), wait.
4. **Deploys are health-gated** (`meok-one/deploy/deploy.sh` verifies 200). Roll back / stop on any failure.
5. **NEVER do owner-gated actions**: Stripe live/keys, DNS, Vercel-auth, account recovery, sending email/DMs/outreach, accepting terms. Leave them for Nick.
6. **Verify before asserting.** Re-check claims (dates, prices, enum values) against source/code before editing.
7. **Reversible only.** Content edits, drafts, additive code, gate-protected publishes. No irreversible bulk ops, no live-SOV3 surgery unsupervised.
8. **Log every item** to `/tmp/meok_24h_progress.log` and skip items already logged.

## SAFE QUEUE (priority order — do the next un-logged item each cycle)

### A. MEOK honesty + positioning fixes (HIGHEST EV — the lead horse; all content, reversible)
A1. **Date fix:** across `csoai-org/public/*.html` + `meok-one/.../web/*.html`, the EU AI Act watermarking deadline is **2 December 2026** (Digital Omnibus grace for pre-existing systems) and Article 50 applies **2 August 2026** for new systems. Replace imprecise "November 2026" deadline refs in the *watermarking/Article-50* context. READ each occurrence's context first — don't replace unrelated November refs. Deploy csoai-org after.
A2. **HMAC reframe (honesty):** everywhere HMAC is marketed as the external-verification *feature/moat* (≈8 csoai pages + 51 MCP descriptions), reframe to: HMAC-SHA256 = **internal tamper-evidence/log integrity**; external defensibility = **C2PA Content Credentials (X.509) + RFC-3161 timestamping**. An auditor will read symmetric HMAC as a downgrade vs the asymmetric signing every competitor uses. Sentence-level edits (judgment needed). For MCPs, edit descriptions/READMEs only — republish via the gate harness.
A3. **SME penalty honesty:** wherever "€15M / 3% global turnover" appears for SMEs, add Art 99(6): for SMEs/startups the cap is "**whichever is lower**" (proportionate). Don't quote the €15M headline to micro-businesses.
A4. **£999 → service:** reposition the £999 from a "watermarking kit" (ProofSnap commoditises at $9–29/mo) to a **done-with-you Article-50 readiness package** (AI-content-flow inventory + C2PA/SynthID marking + signed attestation + disclosure playbook + audit-ready evidence folder). Update pricing/work copy.

### B. Global-ready + product (safe builds)
B1. **i18n layer for MEOK ONE** — a locale mechanism (lang switch + locale JSON) + translate the key OS/DOME/LAW/pricing/work strings (start EN→ES/FR/DE). The only real gap between "100/100 e2e-ready" and "global ready." Additive; deploy health-gated.
B2. **OS Tools panel** — surface the 110 bridged tools (`GET /api/mcp/tools`) in the OS UI so users *see* the bridge. Additive page/section.

### C. Fastest-cash sales assets (drafts only — Nick sends/posts)
C1. **Article 50 mini-audit diagnostic** (£250–£500) — a one-page offer + checklist to cross-sell the trade-client SMM book (warm list = the moat ProofSnap lacks). Draft page + email copy (DON'T send).
C2. **Tiered SMM retainers** (≈£600 / £1,200 / £2,500, 50–60% margin) — productisation doc + a pricing page.

### D. Robotics + grants (drafts/docs only)
D1. **FarmBot build doc** — uses the on-site Creality K1 Max Pro (PA12-CF) for tool mounts; 6–24mo ROI; open BOM. (The realistic near-term agri-robotics ROI per the research.)
D2. **Grant-prep drafts** — Capital Grants (opens July 2026), Rural England Prosperity Fund (£33M, diversification), Farming Innovation Programme / ADOPT (£30M). NOTE: SFI needs ≥3 ha; farm ≈2.63 ha → likely under threshold (flag, don't bank on SFI).

### E. Catalogue hygiene (gate-protected)
E1. Re-run `sweep_catalogue.py` to finish any PyPI-429 leftovers + catch new breakage. Re-run the upsell roll on any compliance MCP still missing it.

## NOT-AUTONOMOUS (flag in the morning rundown — do NOT attempt unsupervised)
- SOV3 LangGraph + PostgresSaver migration (touches fragile live SOV3 — needs Nick).
- Real Ed25519/X.509 attestation crypto upgrade (task #43 — a real build, supervise).
- Registering agents on the VM SOV3 (delegate "no suitable agent").
- Anything owner-gated (rule 5).
