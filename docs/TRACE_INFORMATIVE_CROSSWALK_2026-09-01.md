# TRACE informative crosswalk — Measure — 1 Sep 2026

**Status:** INFORMATIONAL DRAFT. Partnership frame. **No endorsement. No upstream issue until Nick names.**  
**Surface:** `trace.runtime` (card-v0) maps GSPC behavioural evidence beside TRACE-class runtime records.  
**Locks:** Board **22 · 15 · 7**. Never MEASURED from this doc. Never claim TRACE membership, TRACE-certified, or live partnership. Nick voice only for outreach. x402 sit.

Aligns with fire-playbook `02-trace-gspc-payload.md` and NAMED outer card-v0 envelope.

---

## Spec cite (facts only)

| Fact | Value |
|---|---|
| Name | TRACE — Trust, Runtime Attestation and Compliance Evidence |
| Spec intro | **23 Jun 2026** (Confidential Computing Summit; v0.2 Developer Preview class) |
| Founding contributors | **AMD · Intel · Microsoft · OPAQUE · TII** |
| LF governance | Linux Foundation welcome / contribution announced **25 Aug 2026** (CoSAI technical workstream) |
| Public home | https://trace.agentrust-io.com · LF press |

TRACE ≈ hardware-attested **runtime** evidence (what ran, policies, tool transcripts, model identity bound to TEE measurement).  
GSPC ≈ **behavioural measurement** on named axes under a published method.  
CSOAI does **not** compete with TRACE. We map the ~3KB card as a behavioural evidence payload that can travel next to a TRACE Trust Record.

---

## Envelope discipline

Outer card-v0 (owner): `schema · surface · subject · as_of · source_urls · payload · sha256 · unmeasured[] · sig_ed25519?`

- TRACE-class runtime leaf → `surface: trace.runtime` (payload = runtime/map facts only).  
- GSPC behavioural leaf → `surface: gspc.behavioural` (payload = Measure profile).  
- Same root indexes both. No second board.

---

## Informative crosswalk (GSPC / card-v0 → TRACE-class slots)

Illustrative TRACE v0.2-class slots from public docs: `subject`, `model`, `runtime`, `policy`, `data_class`, `tool_transcript`, `build_provenance`, `appraisal`, `transparency`, `cnf`, `signature`.

| GSPC / card-v0 | TRACE-class slot | Informative note |
|---|---|---|
| outer `schema` + `surface=gspc.behavioural` | evidence type / eat_profile adjacent | Label behavioural measurement, not TEE appraisal |
| outer `subject` | `subject` | What was measured |
| payload model / system id | `model.{provider,model_id,version}` | Identity of measured system, not the TEE |
| payload `axis` + result status | typed claim / extension | `UNMEASURED` / `UNSIGNED` first-class — never impute zero |
| payload accuracy (when MEASURED) | behavioural result claim | **Not a rank product** |
| outer `as_of` | `iat` / temporal bound | Do not invent freshness |
| `did:web:csoai.org#…` + Ed25519 | issuer / authority context | CSOAI Ed25519 stays authority for our leaf |
| outer `sha256` (payload digest) | content binding | Stranger-recomputable |
| outer `sig_ed25519` | signature material (or later COSE wrap) | Do not replace with TRACE silicon key |
| payload root / prev | provenance chain extension | Truncation defence |
| outer `source_urls` + bank refs | supporting evidence URIs | Same discipline as ERC-8325 evidenceHash |
| outer `unmeasured[]` | explicit gaps | TRACE must not treat missing as affirming |
| living merkle / Rekor inclusion | `transparency` | Bytes-existed witness — not “safe” |
| Board 22·15·7 | context only | Re-GET `/api/gspc`; never freeze; never stamp empties |

**Division of labour:** TRACE affirms *what binary / policy / TEE ran*. GSPC affirms *how the system behaved on named axes*. Together under one stranger-checkable envelope — without CSOAI pretending to be a TEE vendor or TRACE pretending to be a public behaviour board.

---

## Copy rules

**Do write:**

- “Provenance / transparency frame compatible with TRACE-class disclosure.”
- “GSPC card as behavioural evidence payload beside TRACE Trust Records.”
- “Partnership *frame* — not a signed deal.”
- “Informative crosswalk only.”

**Do not write:**

- “TRACE-certified by Council of AI”
- “TRACE partner (live)” / “we co-wrote TRACE”
- “Compliance badge via TRACE”
- Any sold rank inside a TRACE program
- Endorsement language

---

## HOLD

- **No upstream TRACE / LF / CoSAI / OPAQUE / AMD / Intel / Microsoft / TII issue** until Nick names.  
- No endorsement claim.  
- Outreach: Nick voice only.  
- If Nick opens a door: one receipt, one link (`/gspc-verify` or living GET), one ask — verify a card or join `/measure` waitlist. No badge language.

Filed: `/workspace/TRACE-INFORMATIVE-CROSSWALK-2026-09-01.md`  
Companion: `/workspace/fire-playbook-2026-09-01/02-trace-gspc-payload.md`
