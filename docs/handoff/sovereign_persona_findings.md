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
