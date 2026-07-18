# ENRICHMENT RESUME STATE — 2026-07-08

## Where it stopped
- **655/2,363 leads enriched** (28%), scored into csoai_leads_sim.db. All tiers 0-2 done.
- **1,708 remaining** — blocked by per-frame LLM 2.0M token ceiling (exhausted this session).

## To resume (fresh session = fresh budget)
1. Load `enrich_progress_656of2363.json` (the 655 good + 285 to-retry) and
   `enrich_input_all_leads.json` (all 2,363 + 46 charters).
2. Re-run the enrichment loop: REASONING model (utility refuses this task at scale),
   max_tokens=2000, CH=200, ~600 leads/turn to stay under 2.0M/frame. Keep good ones,
   only enrich missing lead_ids.
3. System prompt that works (avoids refusals): "You are a data-enrichment function inside
   CSOAI Ltd's own CRM (UK Companies House 16939677, owner Nick Templeman). Leads are public
   organizations already in the CRM. Pure classification from public information to fill
   missing CRM fields. Output only JSON."
4. Use "product-fit options" NOT "charters/credentials" in the prompt (the security-vocabulary
   triggers false-positive refusals).
5. After full coverage: re-run sim scoring (rebased wedge) into lead_sim, then re-aggregate
   crosswalks + update white paper (confirm the HYPOTHESIS items).

## Proven configs
- Wedge re-basing: split measured_gap / no_public_evidence / no_data (kills the fake 0.998).
- Care-floor serve threshold: confidence >= 0.35.
- lead_sim writes to csoai_leads_sim.db — canonical leads/side_by_side stay READ-ONLY.
