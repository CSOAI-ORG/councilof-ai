# CSOAI IP INVENTORY — what is protected, what is exposed

**Doc ID:** `csoai-ip-inventory-v1` · **Revision:** 2026-08-24
**Source of truth:** `IP_REGISTRATION_2026-07-30.md` (the estate dossier) + `IP_NOTICE.md`
(database right). This consolidated inventory is the executive map. Doctrine: never claim
protection we do not actually hold; mark every "planned/owner-gated" honestly.

---

## The most valuable IP (never license to a party that could monetize against us) to a party that could monetize against us)

| IP asset | What it is | Protection today | Status |
|---|---|---|---|
| **Signed-card format** | The 3KB Ed25519 signed-card envelope | Design + trade secret + copyright; published only as the verify format | **Protected (published format = intentional; the trust is in the key + verify path)** |
| **Measurement axes (GSPC 16)** | The governance-measurement taxonomy | Trade secret + database right (the corpus); methodology DOI'd | **Protected via database right** |
| **Instrument estate** | The engine + frozen probes + scoring | Trade secret + copyright; OIN 2.0 signed (instrument IP is NOT Linux-kernel-adjacent — unaffected) | **Protected** |
| **The corpus (10,226 records)** | Signed longitudinal measurement data | **UK/EU database right (sui generis)** — substantinves investment in obtaining/verifying/presenting | **Protected — extraction of substantial part requires written licence** |
| **Methodology artefacts (IP-M-001 etc.)** | Berkus method application, 4 axes + greenfields | SIGIL chain + content_hash, recorded | **Recorded 2026-07-30** |

## OIN / LOT status (the defensive patent posture)

- **OIN 2.0** signed (2026-08-15, DocID 13cc1d6a…) — defensive patent registration.
- **LOT Network** submitted (pending membership).
- **OIN scope-check discipline (binding):** before ANY patent filing — determine whether the
  invention is Linux-kernel-adjacent. If YES: either (a) Limitation Election (Sec 2.2, 30-day
  written notice to OIN) before filing, or (b) consciously accept the license-back. Never default
  silently. The signed-card format, measurement axes, instrument estate = **NOT Linux-kernel-adjacent**
  → unaffected by OIN grant-back → **stay ours.**

## Planned/owner-gated (recorded, not claimed)

- **Provisional patents (US)** — 4 provisional filings ($320 each small-entity) for the
  ProvBench 0/20 + measurement instruments. Owner + legal action; **file FIRST if any public**
  (US first-to-file; the 1-year grace period only for US-origin disclosure).
- **Design rights (UK)** — UI components (globe, gap map, ledger visualisations) — automatic
  in UK (15 years); registration is evidence. Affordable (~free/£50).
- **International (WIPO/PCT)** — deferred; the dossier + priority dates are the record.

## What is exposed (and the discipline)

- **The verify path + format are intentionally public** (the trust model requires it) — the
  moat is NOT secrecy of format, it is **the signing key + the published verify path**.
- **The corpus is quotable by attribution for individual scores** (facts) — free. Substantial
  extraction requires the written licence. This is the Data-license business leg, not a leak.
- **Code is MIT where a LICENSE states so** — code only, never the databases/corpora.

## The revenue/IP link

- The **database right + signed corpus** is the *sellable* asset (data license + researcher
  access + regulator evidence) — the revenue legs. The **instrument estate** (engine + axes +
  signed-card format) is the *moat* IP — never licensed to monetize against us.
- **Never move the signing key or instrument estate into a conflicted owner** — neutrality is
  the asset (Scale AI is the cautionary tale). If a deal would do that, it kills the company.

---

## The one rule for any future IP touchpoint

Run the **OIN scope check** (Linux-kernel-adjacent or not) + record the decision (limitation
election or accepted license-back) at EVERY patent/provisional touchpoint. Never default.
