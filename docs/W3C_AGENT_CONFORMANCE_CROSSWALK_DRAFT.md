# W3C Agent Conformance × GSPC — informative crosswalk draft — 1 Sep 2026

**Status:** INFORMATIONAL DRAFT only. **Cite W3C materials. No endorsement. No sponsor claim. No membership claim.**  
**Locks:** Board **22 · 15 · 7**. Never MEASURED from this doc. Never certify. No wrangler. No Cloud Agents. No second root writer.

---

## HOLD — Nick / CG membership

| Item | Sit |
|---|---|
| W3C Agent Conformance Community Group | **JOIN HOLD Nick** — membership click |
| Call | Nick **called 30 Aug 2026** (owner calendar) — wait for Nick voice |
| This file | Draft crosswalk paper only — **not** a CG contribution, **not** a sponsor announcement |

**Do not write:** "W3C partner", "W3C-endorsed", "W3C-certified by Council of AI", "we sponsor the CG".

---

## Thesis (informative)

GSPC behavioural cards (~3KB Ed25519 atom under card-v0) can sit beside any future Agent Conformance disclosure shape as the **behavioural measurement layer**. CSOAI does not invent a competing conformance badge. Living authority remains `GET https://councilof.ai/api/gspc` → **22 · 15 · 7**.

Outer card-v0 envelope (owner): `schema · surface · subject · as_of · source_urls · payload · sha256 · unmeasured[] · sig_ed25519?`

---

## Informative map (GSPC / card-v0 → conformance-class slots)

Illustrative only — re-pin against any published CG draft before spray.

| GSPC / card-v0 | Conformance-class slot (illustrative) | Note |
|---|---|---|
| `surface=gspc.behavioural` | Behavioural evidence type | Not a TEE / runtime appraisal |
| outer `subject` + payload model id | Subject under test | Identity of measured system |
| payload axis + status (`UNMEASURED` / `UNSIGNED` / `SIGNED`) | Claim / gap grammar | Never impute zero for empty |
| outer `as_of` | Temporal bound | Do not invent freshness |
| `did:web:csoai.org#…` + Ed25519 | Issuer / authority | CSOAI keystone stays ours |
| outer `sha256` + living merkle root | Content binding + inclusion | Stranger-recomputable |
| outer `unmeasured[]` | Explicit gaps | Missing ≠ affirming |
| Board 22·15·7 | Context only | Re-GET; never freeze; never fill 7 |

---

## Copy rules

**Do write:** "Informative GSPC ↔ Agent Conformance crosswalk draft." · "Cite W3C / CG public materials." · "Join HOLD Nick."

**Do not write:** endorsement · partnership live · certification · sponsor · membership until Nick joins.

## Out of scope

- Opening a CG issue / PR / membership click from this leftover  
- Stamping MEASURED from a conformance checklist  
- Cobalt edits · wrangler · Cloud Agents · second board  

*End. Cite only. Europe/London. 1 Sep 2026.*
