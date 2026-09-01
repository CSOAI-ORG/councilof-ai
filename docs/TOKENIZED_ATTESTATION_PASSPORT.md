# Tokenized attestation passport — proof pointer, not grade — 1 Sep 2026

**Status:** OWNER LOCK / DRAFT HOLD. Cite-only. **No endorsement. No compliance claim.**  
**Locks:** Board **22 · 15 · 7**. Never tokenize models. Never MEASURED-from-listing. Never fill-7. No second root writer. No laptop key. Cite only — no OWASP / MS / W3C / GENIUS endorsement claims.

---

## Thesis

**After** the living merkle **root hash** is anchored (Rekor / OTS Bitcoin / XRPL DID / ERC-8325-class witness — **root hash only**), tokenize the **proof pointer** only.

The token (ERC-8004 identity field and/or ERC-8325-style asset-anchor binding) points at:

1. the **card hash** (sha256 over card-v0 payload / leaf), and  
2. the **anchored root** that includes that leaf.

The passport carries a **verifiable link**. It does **not** carry a grade, rank, CE mark, or sold score. Weights / checkpoints / model blobs are **never** the tokenized asset under this grammar.

```
adapters → card-v0 → merkle → public/root.json
                              ↓
                     root-hash anchor (witnesses)
                              ↓
                     tokenize proof pointer only
                     (ERC-8004 identity and/or ERC-8325-style)
                              ↓
                     passport = { card_hash, root_hash, digests, URIs }
```

---

## What the passport is / is not

| Is | Is not |
|---|---|
| Pointer to card URL + root URL + digests | The evidence itself |
| Verifiable link a stranger can re-check | A behavioural grade or axis fill |
| Free to **verify** (no account required for check) | A compliance badge |
| Optionally paid to **mint / refresh** | Tokenization of model weights |
| Gate artifact for Dorado / insurer / bank **condition patterns** | “Certified by Council of AI” |

**Never tokenize models.**

---

## Commercial frame (design)

| Lane | Rule |
|---|---|
| Verify | **Free** — stranger recomputes card + root without mint |
| Mint / refresh | **Paid** (named desk when wired) — issues or refreshes the on-chain pointer to current card+root |
| Expiry | Refresh binds to a **recent** root window; stale root → re-GET, do not edit old card |
| Authority | CSOAI Ed25519 / `did:web:csoai.org` remains authority for **our** leaf; chain token does not replace it |

No invented £ in this lock file. Human paid rail stays Coming until Paddle (or owner-named) is wired — do not put Stripe on COBOL/AX named Pro from this doc.

---

## Condition pattern (Dorado / insurer / bank) — design frame

Marketplaces, insurers, and banks may adopt a **condition** pattern:

> **No tokenized attestation passport → no release** (no bid, no payout, no escrow release)

as a **design frame** only:

- Condition checks **presence + verify** of passport → card hash → anchored root.  
- Fail / missing / stale → **HOLD** or reject per counterparty policy.  
- Pass = artifacts verified under published rules — **not** certification, **not** a sold rank.  
- Dorado (or any counterparty) implements the gate; CSOAI publishes checkable inputs.  
- Drift / UNMEASURED axes required by the listing stay HOLD — never invent a score to release funds.

Companions: fire-playbook `05-dorado-gspc-escrow.md` · filter `ERC8004_FILTER_REGISTERED_VS_CALLABLE.md`.

---

## Regulatory frame — cite only

| Frame | Use | Hard stop |
|---|---|---|
| **GENIUS Act** | Cite-only regulatory frame for **reserve-attestation** discourse (US payment-stablecoin class; expected effective class **18 Jan 2027** — re-pin primary) | Never claim CSOAI / card / passport is GENIUS-compliant |
| **Collins Amendment** (named discourse / bill class) | Cite-only companion frame next to GENIUS — re-pin primary before spray | Never “certified under Collins …” |
| **EU AI Act Art.50** | Cite-only frame for **GPAI transparency** / marking duties (Art.50 + enforcement live class **2 Aug 2026**; GPAI obligations date in copy = **2 Aug 2025** — re-pin) | Never claim Art.50 conformity badge; not C2PA-conformant |

These cites feed leftover / printer honesty. They do **not** fill `reserve-attestation`, `regulatory-framework`, or any empty cell. Living board stays **22 · 15 · 7**.

---

## Binding discipline (ERC-8004 / ERC-8325-style)

| May | Must not |
|---|---|
| Point identity / `evidenceHash`-class fields at card + root digests | Embed model weights as the asset |
| Dual-check: on-chain binding **and** stranger recompute of card under root | Treat mint as MEASURED |
| Keep one public root for all arms | Fork a second board or second root writer |
| Leave gaps in `unmeasured[]` | Silent pass on missing legs |

ERC-8325 remains **Review/draft class** as fetched — do not claim CSOAI operates the canonical Asset Anchor Registry.

---

## Hard stops

- Tokenize **proof only** — never models.  
- Never MEASURED-from-listing. Never fill-7. No 23/22.  
- No second root writer. Witnesses carry **root hash only**.  
- No laptop key. No wrangler. No Cloud Agents from this desk.  
- Cite only — no OWASP / Microsoft / W3C / GENIUS / Collins / Art.50 endorsement or compliance claim.  
- Free verify; paid mint/refresh is commercial — not a trust substitute.

Companions: `ERC8004_FILTER_REGISTERED_VS_CALLABLE.md` · wedge `ERC8004_PASSPORT_TO_ROOT` · `ROOT_ANCHOR_WITNESSES` · fire-playbook `04` / `06` / `10`.

*End. Pointer, not grade. Europe/London. 1 Sep 2026.*
