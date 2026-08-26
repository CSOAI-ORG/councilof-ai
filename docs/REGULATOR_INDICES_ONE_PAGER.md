# Regulator brief — labour & AI-economy indices (UNMEASURED)

**NEXT_300 #149** · Markdown source for PDF layout · **Not a compliance determination**

CSOAI Ltd · UK Companies House **16939677** · Measurement, not certification

---

## What we publish today

| Surface | Register | `measured_score` |
|---------|----------|------------------|
| GSPC scoreboard (`GET /api/gspc`) | **MEASURED** (13 of 14 axes) | Per-axis, signed Ed25519 |
| AI Economy Index (`/indices/ai-economy`) | **UNMEASURED** | `null` |
| Human Labour Index (`/indices/human-labour`) | **UNMEASURED** | `null` |
| Humanoid Labour Index (`/indices/humanoid-labour`) | **UNMEASURED** | `null` |

Catalog API: `GET /api/indices` — returns `register: UNMEASURED` and `measured_score: null` for all three.

## What we refuse to do

- Invent wage %, displacement %, TVL, or TAM as MEASURED labour/economy scores.
- Fuse index numbers into GSPC grading cells (SHA-256 / Ed25519 board inputs).
- Certify compliance, issue badges, or sell grades (HO.2 — verify free forever for regulators).

## Why empty cells are honest

Absence is **not** zero. Until INDEX-METHOD-0.1 freezes an input bank and usable n, the product is declared UNMEASURED. Contextual citations may appear as **REPORTED** labels only — never as MEASURED inputs.

## Verify without an account

- Board: https://councilof.ai/gspc-scoreboard · offline recompute: `/gspc-verify`
- Indices hub: https://councilof.ai/indices
- Corrections (append-only): `GET /api/corrections`

## Hub vs product honesty

Some Hugging Face `csoai/*` experiment files may label `MEASURED-INDEX-v0.1`. The **Council OS product surface** remains UNMEASURED. See correction `C-2026-0826-01` and `docs/HF_LABOUR_INDEX_HONESTY.md`.

## Contact

Public artifacts only — no cold harvest. Outreach template: `docs/CONTACT_OUTREACH_TEMPLATE.md`.

**PDF layout / counsel sign-off:** owner gate. Print-ready HTML (browser Print → PDF): `/regulator-indices-one-pager.html`. This markdown remains the source text.
