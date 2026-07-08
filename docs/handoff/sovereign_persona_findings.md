# Sovereign Persona Test — findings & training signal (2026-07-07)

> Tool: `npm run sov:personas` (scripts/persona-e2e.mjs). Talks to the LIVE Sovereign
> (os.meok.ai/api/chat) as 6 region+role end users, scores each answer (clean / on-topic /
> region-appropriate), flags weak spots. Read-only — the training signal for M4.

## Result (latest run)
- **6/6 clean + on-topic** — no persona-bleed, no refusals, all governed answers.
- **6/6 region-appropriate** on the strict check (Japan→METI/APPI/FSA, EU→EU AI Act, US→HIPAA/NIST, KR→AI Basic Act, SG→MAS, dev→signed/hash/audit).

## Training signal (for M4 — brain prompt/knowledge tuning)
- **Intermittent EU-centric bias on non-EU regions.** On some runs the Japan bank persona
  got an *EU-AI-Act-first* answer instead of leading with Japan (METI AI Guidelines for
  Business / FSA / APPI). It is inconsistent run-to-run (LLM non-determinism).
  **Fix direction:** in the Sovereign system prompt / retrieval, lead with the LOCAL regime
  for the stated jurisdiction, then note cross-border (EU) exposure second.
- Everything else is solid — the region personas get correct, practical, cited-framework answers.

## Use
Run before demos / after any brain change: `npm run sov:personas`. Add personas by editing
the PERSONAS array. Not a hard CI gate (region-appropriateness can flap run-to-run); it is a
training/monitoring tool.

## Update (2026-07-07) — multilingual response gap
- **Frontend now requests the visitor's language** (client/src/lib/sovAsk.ts appends "Respond in <language>. Keep regulation names + labels in English."). Verified the request is correct and keeps "EU AI Act" canonical.
- **BRAIN does not yet honor it** — a Japanese-directive request came back in English. So end-to-end multilingual answers need brain-side support (model/prompt/config on os.meok.ai). **Training item for M4.** The frontend is forward-compatible: it will localize automatically once the brain complies.
- Separately observed: the brain gave an inaccurate EU AI Act date ("mid-2025") in that reply — brain knowledge freshness is also an M4 training item (the site copy + register are correct; the brain should cite the register).

## Update (2026-07-08) — scaled account-e2e (26 accounts) confirms the region-lead gap
- **24/26 fully clean; 2 flagged:** Novartis (EU/pharma) and TSMC (APAC/ai-lab) — Sovereign did NOT lead with their local regime (EU AI Act / APAC MAS-METI-ISO). Same intermittent EU-centric / generic-lead bias the persona test caught; confirms it is real and shows on ~8% of accounts run-to-run.
- **Training direction for M4:** in the Sovereign system prompt / retrieval, for a stated jurisdiction lead the FIRST sentence with that jurisdiction's regime (EU->EU AI Act, JP->METI, KR->AI Basic Act, SG->MAS, US->NIST/HIPAA), then note cross-border exposure. `npm run` -> `ACCOUNTS=novartis,tsmc node scripts/account-e2e.mjs` reproduces.
- Frontend/experience side is clean: region homepage, tailored brief (play+USPs+region globe), pre-framed crosswalk all pass 26/26.

## Full-universe sweep (88 accounts, 2026-07-08) — brain signal for M4
`ACCOUNTS=all node scripts/account-e2e.mjs` → **avg experience 95%**. Frontend clean. Two brain-lane patterns quantified across the whole book:

**A) Region-lead miss (11 enterprise accounts):** Sovereign didn't open with the account's LOCAL regime.
- US: Wells Fargo, Goldman Sachs, American Express, Humana, Merck — led generic/EU-first instead of US (NIST AI RMF / state ADMT).
- EU: Allianz, Sanofi, Ericsson, Siemens — didn't lead with EU AI Act / DORA.
- APAC: TSMC — didn't lead with APAC regime.

**B) Off-topic / thin for a sector (2 accounts):** AXA (insurance) + Siemens (global2000) — Sovereign returned off-topic/empty for the sector framing.

Root cause = brain prompt/retrieval (region + sector priors), not frontend. Frontend already passes region homepage, tailored brief, and localized globe for every one of these. Fix belongs in Sovereign training/retrieval (M4 lane).

_Harness note:_ crosswalk-tailoring check is now gated to enterprises only (regulators author frameworks, they don't crosswalk to them) — removed 11 false-positive "crosswalk not tailored" flags on regulator accounts.
