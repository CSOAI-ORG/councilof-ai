# Wilson — frozen banks only (harness note)

**NEXT_300 #174** · harness discipline · not a product score

Wilson 95% confidence intervals appear on:

- **GSPC** per-axis results where n is honestly independent on a **frozen** item bank.
- **Future RWA packs** only after an owner-frozen bank + custody gate — not before.

Wilson does **not** apply to:

- Live contract / issuer churn (adapters read public artifacts; no Wilson on moving targets).
- Labour / AI-economy indices (`/indices/*` — **UNMEASURED**, `measured_score: null`).
- RWA contact matrix rows (`docs/RWA_CONTACT_MATRIX.md` — REPORTED only, no scores).
- Demo-play targets (JMWH — `play: "demo"`).

Harness surfaces: `/arena-harness` · `GET /api/gspc` · batch Wilson workers (#287) must check bank freeze bit before CI.

Canon: `docs/SOVOS/INDEX-METHOD-0.1.md` · `docs/EAT_PLAYBOOK.md` § Wilson.
