# ERC-8004 filter — registered vs callable — 1 Sep 2026

**Status:** OWNER LOCK / DRAFT HOLD. Cite-only. **No endorsement.**  
**Surface:** `erc8004.callable`  
**Locks:** Board **22 · 15 · 7**. Never MEASURED-from-listing. Never tokenize models. Never fill-7. No second root writer. No laptop key. Cite only — no OWASP / MS / W3C / GENIUS endorsement claims.

---

## Thesis

ERC-8004 registrations are **identity listings**. Callable agents are a **strict subset**: those that expose a live public endpoint a stranger can probe. The filter below separates **registered** from **callable** so coverage facts stay labelled inputs — never a board stamp and never a sold agent rank.

Passport (companion): points at **card hash + anchored root**. This file is the **filter** that decides when an identity may enter the `erc8004.callable` evidence path.

---

## Permissionless measure rule

| Rule | Sit |
|---|---|
| Public endpoints | **Anyone** may probe public agent endpoints without owner consent |
| Validation Registry | Independent checks / attestations land here when the rail is ready — not a CSOAI monopoly |
| Consent | **No owner consent required** to measure **public** agents |
| Private / gated | Stay `UNMEASURED` or out-of-scope until a published method + bank exist |
| Board | Filter outputs feed cite panes / economy-index **inputs** — **not** MEASURED cells |

Permissionless ≠ free-to-fill. Listing presence alone never restores an empty GSPC axis.

---

## Crawl order (v0)

1. **Base**  
2. **BNB**  
3. **Ethereum**  
4. Other chains only after the first three have a published crawl window + labelled fraction

Per registration with a declared endpoint:

```
live endpoint probe
        → frozen behavioural bank (named items, stranger-recomputable)
        → card-v0 leaf  surface=erc8004.callable
        → same living merkle root (one root; root hash only on-chain)
```

No live endpoint → **not callable**. Registration may still be cited as a coverage denominator. Do **not** invent behavioural results from a registry row.

---

## Cite pane (re-pin before spray)

| Label | Fact (cite class) | Honesty |
|---|---|---|
| Non-callable / no live endpoint class | **~85–97%** of registrations lack a stranger-probeable live MCP / A2A-class endpoint (public scan range — **re-fetch**) | Placeholders stay **UNMEASURED** with gap named |
| Callable / live endpoint class | **~3–15%** declare a live endpoint | registered ≠ signed-and-callable |
| Weekly labelled fact | **registered-versus-callable fraction** | Cite pane / **economy index input** only |
| Board | Living GET remains **22 · 15 · 7** | **NOT** a MEASURED board stamp · **not** fill-7 |

**Hard stop:** Never stamp `ai-economy-index` (or any axis) MEASURED from this listing pane.

When a probe cannot run, or the bank is not frozen, the card (or placeholder) declares the gap in outer `unmeasured[]` by name — never impute zero, never silent pass.

---

## Validation Registry (when rail ready)

Write an **independent attestation** into the ERC-8004 **Validation Registry** when that rail is live and the method is published:

- Attestation binds to **card sha256 + root hash** (and crawl window), not to a grade or rank.  
- Third parties may verify without CSOAI as intermediary.  
- Sybil / fake-reviewer risk is acknowledged; CSOAI does not claim the registry is Sybil-proof.  
- Until the rail is ready: cite the empty socket; do **not** fake on-chain writes from this doc.

---

## Card discipline (`surface=erc8004.callable`)

Outer envelope unchanged: `schema · surface · subject · as_of · source_urls · payload · sha256 · unmeasured[] · sig_ed25519?`

Payload holds coverage / probe facts only (chain, registration id, endpoint class, crawl window, bank id, gap names). **No model weights. No grade SKU. No fill of the seven empties.**

---

## Hard stops

- Never MEASURED-from-listing.  
- Never tokenize models / weights / checkpoints.  
- No fill-7. No 23/22. Board stays **22 · 15 · 7**.  
- No second root writer. Chain witnesses **root hash only**.  
- No laptop / MetaMask / 3090 key in agent paths.  
- Cite only — no OWASP / Microsoft / W3C / GENIUS endorsement or compliance claim.  
- Passport / token = verifiable **link**, not the evidence and not a grade.

Companions: `TOKENIZED_ATTESTATION_PASSPORT.md` · fire-playbook `06-cite-only-panes.md` §A · `ERC8004_PASSPORT_TO_ROOT` (wedge) · card-v0 grammar `erc8004.callable`.

*End. Filter, not stamp. Europe/London. 1 Sep 2026.*
