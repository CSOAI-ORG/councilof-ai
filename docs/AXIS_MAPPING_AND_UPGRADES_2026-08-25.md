# AXIS MAPPING & MINED UPGRADES — dossier → GSPC governance (2026-08-25)

How the pre-execution freshness/risk check (unsolicited+permissionless attestation thesis,
2026-08-25) maps into the public quotable board (**14** axes — cite live `totals.public_count`
from GET /api/gspc: *14 measured of 14 quotable*), plus internal expansion/REGISTERING axes
and financial/domain axes that are **not** board-quotable (never publish "22 axes" as the board),
and the estate's benchmark governance — plus the mined upgrade list across all assets.

## A. Mapping table: dossier finding → axis/doctrine node → state

| Dossier finding | Axis / governance node | Estate state |
|---|---|---|
| Differentiator must be **unsolicited + permissionless** (incumbents all claim "independent": Moody's TIE, S&P+Chainlink, Particula, Credora/RedStone) | `gov` axis doctrine: **nobody-ranked-pays** commercial mirror — never issuer-paid, never issuer-opt-in | ✅ Encoded: `harness/rwa-attest/METHODOLOGY.md` v0.2 (moat = unsolicited + permissionless + statistically-governed + signed); `TARGETS` flags `unsolicited:true, issuer_paid:false` × 10 (today) |
| SEC 2026-01-28 Statement: tokenization taxonomy silent on pure signed opinions | Pure-attestor rule: **no token issuance, no custody, no synthetic exposure** = outside the taxonomy | ✅ Engine doctrine (JL.5/IY Wall 2); registry has no issuance surface |
| EU AI Act GPAI enforcement LIVE **2026-08-02** (€15M / 3%); prohibited €35M / 7% | `art5` axis (we measure Art 5 model conduct) + **own-posture** GPAI map | 🆕 `docs/GPAI_MODEL_MAP_2026-08-25.md`; attestation path is deterministic (no GPAI) |
| EU CRA reporting **2026-09-11** (24h/72h/14d ENISA); notified bodies 2026-06-11; conformity 2027-12-11; guidance C(2026) 5252 | `conformance`/`mach` axis family + own-posture SBOM + vuln workflow | 🆕 `docs/CRA_COMPLIANCE_2026-08-25.md`; engine = stdlib-only python (minimal SBOM) |
| Clean plays: Aviva (LIVE 2026-07-29, CBI first), RLUSD (1.711B cap, EU CASP 2026-08-05), BUIDL (~$2.6-2.7B, Aaa-mf), BENJI ($700-830M, '40 Act), OUSG ($375M TVL, SEC closed) | `financial-axes`: provenance-controls MEASURED (deterministic on-chain facts); risk verdicts **UNMEASURED** (counsel-pending) — JL.5 | 🆕 Freshness + `watch:clean` intel in `attestation-corpus.json` (today); addresses located |
| JMWH: ~$2.23B *represented* ≠ distributed; 19 holders; ~0 volume; minted-not-purchased; Minimal UK parent; CAMMESA custodian+auditor | **Honesty-flag vocabulary**: `value_model: represented\|distributed`, `minted_not_distributed`, holder/volume, `watch: demo-only` | ✅ Already tier-3 "max demonstrative"; 🆕 corpus/engine flags today — **demonstration-of-value only, never endorsement** |
| Moody's TIE (Canton Mar 2026 + Solana via Alphaledger Jun 2026, issuer "choose to have"), S&P via Chainlink, Credora/RedStone, Particula mandate-based, Chainlink ACE = enforcement infra | COI taxonomy + independence ledger (OWNERSHIP-100 #64–71): the **"Moody's-trap memo"** is now empirically grounded (issuer-pays/opt-in IS the trap; anti-touting favors us) | 🔶 Upgraded when memo written with live examples (agent-doable, queued) |
| xrpl.js CVE-2025-32965 (Apr 2025, fixed 4.2.5 / 2.14.3; current 5.x); npm 2FA Aug 2026 / Jan 2027 | Supply-chain hygiene: engine = **stdlib-only python** (no xrpl.js); `XrplAttest.tsx` = no xrpl dep | ✅ N/A in-repo; 📌 consumer note: pin ≥4.2.5/5.x + SCA + 2FA prep |
| XRPL protocol fresh: Credentials XLS-70 (live 2025-09-04), PermissionedDomains XLS-80, v3.2.0, XLS-96 Confidential Transfers (develop), **XLS-100 Smart Escrows** (attestation-triggered) | `xr`-adjacent interop evidence (`xrpl-attest-run.json`): rails live, non-deprecated; Smart Escrows = **upgrade**: attestation-gated RWA settlement flows | ✅ Rails confirmed usable; XLS-100 = future product moat |
| EAS v2.9.1 (stable, free); AG-UI/CopilotKit maintained (ag-ui-langgraph 2026-06-19; coupling caveat #1223; $22K cost overrun anecdote) | MCP / AG-UI surface (Council OS stack) + **agent-spend caps** | 📌 Maintenance posture; add model-cost caps to the agent templates |

## B. Mined upgrade list (all estate assets → upgrade, state-marked)

**DONE today (2026-08-25):** jail separation TIE → 14-of-14 quotable live · board_living re-signed (stale signature repaired) · EXP 061/064 hash-pins · Measurement Signal Index (15 rows) · card-chain adjudication from bytes (335 real; publish-rule = owner) · RWA freshness + honesty flags · os-production pushed (cursor feed + HANDOFF-K3).

**DONE prior:** 22-axis canon · signed corpus (10,226 records) · rwa-attest engine + methodology v0.2 · financial-axes provenance-controls MEASURED · XRPL/EAS interop evidence · Rule-5 (BaaS) positioning · honest register · ClaimGuard publish-gate · signed-json-guard.

**OPEN — agent-doable (from OWNERSHIP-100 / NEXT-100 + dossier), prioritized:**
1. COI taxonomy (7-class, independence doctrine) — 7 classes now populate with named incumbent models (TIE, Chainlink, Particula, Credora/RedStone, ACE). *(MOVES #65)*
2. "Issuer-pays land-grab memo" (Moody's-trap #66) with the 2026 examples — the dossier's evidence IS the memo's skeleton.
3. `verify` stranger-verifiable product LIVE + portable verifier (#61–62) — signature spine already fits XRPL/EAS proof verify.
4. Standards engagement: RECEIPT-SPEC I-D, media type, MCP #426 PR, AIUC-1/C2PA/A2A/OSFF observe (#1–8) — align with the AIUC-1 Sep 30 cadence.
5. PQC path note (ML-DSA-65) in RECEIPT-SPEC (#11) — Ed25519 post-quantum note.
6. Transparency-log anchor + SCITT registration (#7–8 of NEXT-100) — RFC 6962/RFC 9942 interop already exists.
7. e2e --json/--ids/--budget + no-LLM-judge CI hook + determinism re-run gate (NEXT-100 #3–5, #10).
8. Correction-receipt supersede chain (#6) — the correction ledger convention from the JW final.
9. 14-slot board exactness (cite live public_count; do not invent 22 axes) + counts reconciliation (NEXT-100 #1–2, #9) — one sweep after the bot war settles.
10. Benchmarks governance: **JMWH-style "represented≠distributed" flag vocabulary** promoted into a schema standard (financial-axes 0.1 → 0.2).

**OWNER-GATED (render honestly):** NRSRO/counsel analysis before risk verdicts publish at scale · pricing ruling (Move 211) · Stripe price IDs · MCP registry publish + DOI bump · issuer-pays/counsel signoff on JMWH demo card text · EU FCA/ACPR engagement for DLT Pilot route (Dowgo precedent).

## C. Governance rule added by this pass
**"Represented ≠ distributed is a first-class honesty field"** — in the 22-axis grammar,
a value figure without a distribution model + holder/transfer evidence is rendered with
`value_model: represented` + `watch: demo-only`, never as an endorsement (JMWH rule).
The same rule applies to any future coverage target.
