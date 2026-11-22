# Attestation passport — proof pointer, not grade, not a token — 1 Sep 2026, reworded 22 Nov 2026

**Status:** Design note, no code. Cite-only. **No endorsement. No compliance claim.**  
**Owner ruling, 22 Nov 2026:** the passport is a signed record. It is free to verify and refreshed per request over x402. CSOAI mints, holds and redeems nothing. In his words: "We're not going to create a token. We can create a service, the infrastructure." The file name is kept so existing links resolve.  
**Locks:** Board counts come from the live `GET /api/gspc`, never from this file. No token. Never tokenize models. Never MEASURED-from-listing. Never fill-7. No second root writer. No laptop key. Cite only — no OWASP / MS / W3C / GENIUS endorsement claims.

---

## Thesis

**After** the living merkle **root hash** is anchored (Rekor / OTS Bitcoin / XRPL DID / ERC-8325-class witness — **root hash only**), publish the **proof pointer** as a signed record. Nothing is tokenized.

The signed record points at:

1. the **card hash** (sha256 over card-v0 payload / leaf), and  
2. the **anchored root** that includes that leaf.

The passport carries a **verifiable link**. It does **not** carry a grade, rank, CE mark, or sold score. There is no tokenized asset under this grammar: not the pointer, and never weights, checkpoints or model blobs.

```
adapters → card-v0 → merkle → public/root.json
                              ↓
                     root-hash anchor (witnesses)
                              ↓
                     signed proof pointer only
                     (a record, not a token)
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
| **Refreshed** per request over x402 | A token, a credit, or anything minted or redeemable |
| Gate artifact for Dorado / insurer / bank **condition patterns** | “Certified by Council of AI” |

**Never tokenize models.**

---

## Commercial frame (design)

| Lane | Rule |
|---|---|
| Verify | **Free** — a stranger recomputes card + root, with no account and no payment |
| Refresh | **Paid per request over x402** — returns the signed record for the current card + root. Nothing is minted |
| Expiry | Refresh binds to a **recent** root window; stale root → re-GET, do not edit old card |
| Authority | CSOAI Ed25519 / `did:web:csoai.org` remains authority for **our** leaf; no on-chain entry made by anyone replaces it |

No invented £ in this file. Payment is x402 per request only. No Stripe, no subscription, no seats.

---

## Condition pattern (Dorado / insurer / bank) — design frame

Marketplaces, insurers, and banks may adopt a **condition** pattern:

> **No attestation passport → no release** (no bid, no payout, no escrow release)

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

These cites feed leftover / printer honesty. They do **not** fill `reserve-attestation`, `regulatory-framework`, or any empty cell. Board counts come from the live GET.

---

## If a third party binds on-chain (ERC-8004 / ERC-8325-style)

A third party may point its own registry entry at these digests. That entry is theirs, under their own licence. CSOAI issues none.

| May | Must not |
|---|---|
| Point identity / `evidenceHash`-class fields at card + root digests | Embed model weights as the asset |
| Dual-check: on-chain binding **and** stranger recompute of card under root | Treat a third party's on-chain entry as MEASURED |
| Keep one public root for all arms | Fork a second board or second root writer |
| Leave gaps in `unmeasured[]` | Silent pass on missing legs |

ERC-8325 remains **Review/draft class** as fetched — do not claim CSOAI operates the canonical Asset Anchor Registry.

---

## Hard stops

- No token. CSOAI mints, holds and redeems nothing — not the pointer, never models.  
- Never MEASURED-from-listing. Never fill-7. No 23/22.  
- No second root writer. Witnesses carry **root hash only**.  
- No laptop key. No wrangler. No Cloud Agents from this desk.  
- Cite only — no OWASP / Microsoft / W3C / GENIUS / Collins / Art.50 endorsement or compliance claim.  
- Free verify; paid refresh over x402 is commercial — not a trust substitute.

Companions: `ERC8004_FILTER_REGISTERED_VS_CALLABLE.md` · wedge `ERC8004_PASSPORT_TO_ROOT` · `ROOT_ANCHOR_WITNESSES` · fire-playbook `04` / `06` / `10`.

*End. Pointer, not grade, not a token. Europe/London. 1 Sep 2026; reworded 22 Nov 2026 to the owner's ruling.*
