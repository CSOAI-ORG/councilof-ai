# Day 2 Move 10 — Phantom Claims Audit

**Date:** 15 June 2026
**Author:** Hermes (Move 10)
**Scope:** Resolve "£9 vs £29" pricing phantom + verify `meok.ai/llms.txt` location
**Hard rules honoured:** No Vercel deploys · No commits · `CLAUDE.md` / `AGENTS.md` not modified · No `.env*` touched

---

## Section 1 — Pricing canon decision

### The conflict in one line

`AGENTS.md` says the £29/mo Stripe link (`9B67sNeoIcMObEx56o8k91S`) is for **Sovereign**,
but the live pricing widget on the homepage (`meok/ui/src/components/pricing-tier-widget.tsx`)
labels that same link as **£9/mo Sovereign** — a 3.2× under-quote that would silently
mis-charge users at the Stripe checkout counter.

### Source of truth — `AGENTS.md` "Stripe live" block (lines 93-100)

| Tier (AGENTS.md) | Price | Stripe ID |
|---|---|---|
| **Sovereign** | **£29/mo** | `9B67sNeoIcMObEx56o8k91S` |
| Pro | £199/mo | `eVq14p1BWcMO4c59mE8k91T` |
| Enterprise | £1,499/mo | `28E7sNdkEeUW5g96as8k91U` |
| Article 50 Kit | £999 one-time | `fZu00l4O8fZ07oh0Q88k91V` |
| LAUNCH50 | £499 | `4gMcN7a8s6oq0ZTaqI8k91Z` |
| **Quick Kit** | **£9** | `9B68wR6WgfZ0gYR8iA8k91W` |
| Audit-Prep | £4,950 | `28E6oJ94ofZ0aAt1Uc8k91X` |
| Watchdog Cert | £4,950 | `9B6dRb2G0eUWcIBaqI8k91Y` |

### What the front-end actually renders

`meok/ui/src/components/pricing-tier-widget.tsx` (the 5-tier widget rendered on marketing pages):

| Line | Front-end label | Front-end price | Stripe link | What that link actually is |
|---|---|---|---|---|
| 9 | Sovereign | **£9/mo** | `9B67sNeoIcMObEx56o8k91S` | **Sovereign £29** ← phantom |
| 10 | Pro | £19/mo | `eVq14p1BWcMO4c59mE8k91T` | Pro £199 ← phantom (10× under-quote) |
| 11 | Family | **£29/mo** | `28E7sNdkEeUW5g96as8k91U` | **Enterprise £1,499** ← phantom (link belongs to wrong tier) |
| 12 | Enterprise | £500/mo+ | mailto: | OK (no Stripe) |

Independent confirmation of the £29-vs-£1,499 mix-up:
- `_TABS/_inventory/MEOK_LIVE_STATE_HONEST_2026-06-13.md:24` — "Enterprise £1,499/mo: `28E7sNdkEeUW5g96as8k91U`"
- `_TABS/_inventory/MEOK_EAT_PUSH_2026-06-14.md:36,38` — same two links, same two tiers

Independent confirmation of the £9 ↔ £29 Sovereign phantom:
- `_TABS/_inventory/MEOK_EAT_PUSH_2026-06-14.md:36` — "Sovereign £29/mo | 9B67sNeoIcMObEx56o8k91S"
- `_TABS/_inventory/MEOK_LIVE_STATE_HONEST_2026-06-13.md:22` — "Sovereign £29/mo: `9B67sNeoIcMObEx56o8k91S`"
- `live-deploy/index.html:118` — "Sovereign £29/mo" with the same link

### Tier-system reminder

There are **two** consumer-facing tier systems in the codebase, both called "Sovereign" at different price points:

| Tier system | Sovereign price | Authority | Confirmed by |
|---|---|---|---|
| Compliance tier (B2B) | **£29/mo** | AGENTS.md Stripe list + `_TABS` audits | Multiple |
| Consumer tier (B2C) | **£9/mo** | `ui/src/lib/stripe.ts:67` (`TIERS.sovereign.price_monthly = 12`) and a `£12/mo` legacy in same file:33 | Single source, but contradicts itself: line 33 says £12, line 67 says £12, every page render says £9 |

The front-end copy consistently renders **£9/mo Sovereign** for B2C, but its Stripe link
points at the **£29/mo** B2B Sovereign price. Neither matches the **£12** in `stripe.ts`.

### Canon decision

**Adopt the compliance-tier £29/mo Stripe link as the canonical price for "Sovereign" at the URL `9B67sNeoIcMObEx56o8k91S`.** Rationale:

1. `AGENTS.md` is the only place a human-curated Stripe ID-to-tier mapping exists.
2. Both `_TABS` audits (`MEOK_LIVE_STATE_HONEST_2026-06-13.md`, `MEOK_EAT_PUSH_2026-06-14.md`) agree.
3. `live-deploy/index.html` (the currently-aliased production deploy per AGENTS.md §"Aliases") shows £29 next to the same link.
4. The 7+ other £29 references in marketing copy (`press-kit/page.tsx:30`, `family-v3.html:78`, `compare-v3.html:34`, `tos-v3.html:27`, `100-day-challenge-v3.html:45`, `case-studies-v3.html:58,74,104`, `cross-domain-nav-v3.html:64`, `press-kit-live-v3.html:208`, `pricing-v3.html:62`, `faq/faq-client.tsx:43`, `faq/faq-client.tsx:45`, `seo.ts:262,265`, `revenue-dashboard-v3.html:101`, `email-campaigns.ts:194-198` [adjacent]) all label the same Family/Team tier as £29/mo — and that copy is consistent with `AGENTS.md` (no separate Family Stripe link in AGENTS.md means the marketing £29 Family/Team copy currently has **no Stripe link at all**).

### What to update in the follow-up sprint (no commits from Move 10)

| File | Line | Current | Should be |
|---|---|---|---|
| `meok/ui/src/components/pricing-tier-widget.tsx` | 9 | `Sovereign, £9, link 9B67sN…` | `Sovereign, £29, link 9B67sN…` |
| `meok/ui/src/components/pricing-tier-widget.tsx` | 10 | `Pro, £19, link eVq14p1…` | `Pro, £199, link eVq14p1…` |
| `meok/ui/src/components/pricing-tier-widget.tsx` | 11 | `Family, £29, link 28E7sN…` | (remove line — or replace with `Family — link TBD` until a real Family Stripe link is provisioned) |
| `meok/ui/src/components/pricing-tier-widget.tsx` | 44 | `£9-£500/mo` | `£29-£1,499/mo` |
| `meok/ui/src/lib/stripe.ts` | 33 | `price: 1200, // £12/month` | Reconcile with tier canon (decide £9 vs £12 vs £29) |
| `meok/ui/src/lib/stripe.ts` | 40 | `price: 2900, // £29/month` (Sovereign Elite) | Rename to `Family` and move to `family` slot |
| `meok/ui/src/lib/stripe.ts` | 67 | `price_monthly: 12` (sovereign) | `29` (matches AGENTS.md) |
| `meok/ui/src/lib/seo.ts` | 262, 265 | "Sovereign: £9/month" | "Sovereign: £29/month" |
| `meok/ui/public/llms.txt` | 19, 33 | Compliance `Sovereign £29/mo` AND Consumer `Sovereign £9/mo` | Reconcile to a single £29 entry OR add a clearly-labelled second row |
| `meok/ui/public/meok-os-v3-llms.txt` | 30, 32 | "Sovereign £9/mo" + "Family £29/mo" | Same — reconcile |
| `meok/ui/docs/press-release-easter-2026.md` | 39 | "Sovereign (£9/month)" | "Sovereign (£29/month)" |
| `meok/ui/docs/innovate-uk-executive-summary.md` | 45 | "Sovereign (£9/mo)" | "Sovereign (£29/mo)" |
| `meok/ui/docs/pitch-deck-content.md` | 67 | "Sovereign £9/mo" | "Sovereign £29/mo" |
| `meok/ui/docs/reddit-posts.md` | 97 | "Sovereign tier (£9/mo)" | "Sovereign tier (£29/mo)" |
| `meok/ui/src/app/faq/faq-client.tsx` | 40, 43, 45 | "Sovereign (£9/month)" x3 | "Sovereign (£29/month)" x3 |
| `meok/ui/src/app/press-kit/page.tsx` | 30 | "Explorer free · Sovereign £9/mo" | "Explorer free · Sovereign £29/mo" |
| `meok/ui/src/app/waitlist/page.tsx` | 23, 25 | "£9/mo" and "£29/mo" lines | Reconcile (the £29 line has no Stripe link in AGENTS.md) |
| `meok/ui/src/app/changelog/page.tsx` | 44 | "Sovereign (£12/mo)" | Match the new canon |
| `meok/ui/src/app/memory/page.tsx` | 152 | "Sovereign (£12/mo)" | Match the new canon |
| `meok/ui/public/eu-ai-act-article-50-explainer.html` | 77, 103 | Article 50 Kit pricing | OK (matches AGENTS.md £999) |
| `meok/ui/EASTER_LAUNCH_CHECKLIST.md` | 9 | "Sovereign £12, Family £29" | "Sovereign £29 (canonical from AGENTS.md), Family — link TBD" |

> The `AGENTS.md` "Stripe live" block is itself the most authoritative source and **should be left untouched** during the follow-up — it correctly anchors all eight live payment links. The bug is downstream: the front-end widget and ~20 copy files drifted away from it.

---

## Section 2 — `llms.txt` move verification

### Check performed

```
$ ls -la /Users/nicholas/clawd/meok/ui/public/llms.txt
-rw-r--r--@ 1 nicholas  staff  4758 Jun 14 04:01 /Users/nicholas/clawd/meok/ui/public/llms.txt

$ find /Users/nicholas/clawd/meok -name 'llms*.txt' -not -path '*/node_modules/*' -not -path '*/.next/*'
/Users/nicholas/clawd/meok/ui/public/llms.txt
/Users/nicholas/clawd/meok/ui/public/llms-full.txt
```

### Result

**`llms.txt` is already in `meok/ui/public/`** — at the canonical Next.js public-serve path.
The file is 4,758 bytes, last modified 14 June 2026, served at `https://meok.ai/llms.txt`
(also confirmed by the `_ops/pre_realias_check.sh` body-match check `# MEOK` documented in
`AGENTS.md` line 43).

A sibling `llms.txt` also exists at `/Users/nicholas/clawd/meok.ai/llms.txt` (the static
marketing repo) — also publicly served.

**Action taken: NONE — no move required.** The phantom claim that `llms.txt` was "hidden"
is stale. Move 10 closes this as already-done.

### Files of the same family that exist (for completeness)

- `/Users/nicholas/clawd/meok/ui/public/llms.txt` — short form (91 lines)
- `/Users/nicholas/clawd/meok/ui/public/llms-full.txt` — long form
- `/Users/nicholas/clawd/meok/ui/public/meok-os-v3-llms.txt` — v3-specific (referenced as 404 in a few places)
- `/Users/nicholas/clawd/meok.ai/llms.txt` + `meok.ai/llms-full.txt` — marketing-repo copies

---

## Section 3 — Phantom references to fix in follow-up sprint

Counted: **20 phantom references** (1 widget file is the source of 4 of them, the rest are scattered marketing/copy files).

| # | File | Line | Phantom | Why it's a phantom | Severity |
|---|---|---|---|---|---|
| 1 | `meok/ui/src/components/pricing-tier-widget.tsx` | 9 | `Sovereign £9 → link 9B67sN` | Link is canonically £29/mo Sovereign | **HIGH — breaks checkout** |
| 2 | `meok/ui/src/components/pricing-tier-widget.tsx` | 10 | `Pro £19 → link eVq14p1` | Link is canonically £199/mo Pro | **HIGH — breaks checkout** |
| 3 | `meok/ui/src/components/pricing-tier-widget.tsx` | 11 | `Family £29 → link 28E7sN` | Link is canonically Enterprise £1,499 | **HIGH — wrong charge** |
| 4 | `meok/ui/src/components/pricing-tier-widget.tsx` | 44 | Footer text `£9-£500/mo` | Should be `£29-£1,499/mo` | LOW — copy only |
| 5 | `meok/ui/src/lib/stripe.ts` | 33 | `price: 1200, // £12` (Sovereign legacy) | Conflicts with line 67 (`price_monthly: 12`) and front-end £9/AGENTS.md £29 | MEDIUM — internal drift |
| 6 | `meok/ui/src/lib/stripe.ts` | 40 | `Sovereign Elite £29` | Tier is misnamed; no `Sovereign Elite` exists in any copy or AGENTS.md | MEDIUM — dead code |
| 7 | `meok/ui/public/llms.txt` | 19, 33 | Two different Sovereign prices (£29 vs £9) on the same page | LLM consumers see conflicting canon | MEDIUM — AEO/SEO |
| 8 | `meok/ui/public/meok-os-v3-llms.txt` | 30, 32 | "Sovereign £9/mo" + "Family £29/mo" | Same canon conflict as #7 | MEDIUM |
| 9 | `meok/ui/docs/press-release-easter-2026.md` | 39 | "Sovereign (£9/month)" | Should be £29 | LOW — copy |
| 10 | `meok/ui/docs/innovate-uk-executive-summary.md` | 45 | "Sovereign (£9/mo)" | Should be £29 | LOW — copy |
| 11 | `meok/ui/docs/pitch-deck-content.md` | 67, 73 | "Sovereign £9/mo" | Should be £29 | LOW — copy |
| 12 | `meok/ui/docs/reddit-posts.md` | 97 | "Sovereign tier (£9/mo)" | Should be £29 | LOW — copy |
| 13 | `meok/ui/src/app/faq/faq-client.tsx` | 40, 43, 45 | "Sovereign (£9/month)" x3 | Should be £29 | LOW — copy |
| 14 | `meok/ui/src/app/press-kit/page.tsx` | 30 | "Sovereign £9/mo" in consumer pricing | Should be £29 | LOW — copy |
| 15 | `meok/ui/src/app/waitlist/page.tsx` | 23, 25 | "£9/mo" + "£29/mo" | The £29 line has no Stripe link in AGENTS.md | MEDIUM — broken funnel |
| 16 | `meok/ui/src/app/changelog/page.tsx` | 44 | "Sovereign (£12/mo)" | Stale (was once the canonical price) | LOW |
| 17 | `meok/ui/src/app/memory/page.tsx` | 152 | "Sovereign (£12/mo)" | Stale | LOW |
| 18 | `meok/ui/src/lib/seo.ts` | 262, 265 | Structured-data "Sovereign: £9/month" x2 | Should be £29 — JSON-LD gets scraped | MEDIUM — SEO/AEO |
| 19 | `meok/EASTER_LAUNCH_CHECKLIST.md` | 9 | "Sovereign £12, Family £29" | Inconsistent; Family has no Stripe link in AGENTS.md | MEDIUM |
| 20 | `meok/ui/src/lib/character-marketplace.ts` | 42, 83, 229, 237 | "£9.99" / "£9" / "£90" pricing comments | Stale (predates Stripe-link reorg); not linked to Stripe | LOW |

### Severity roll-up

- **HIGH (revenue-breaking, fix first):** 3 — items #1, #2, #3 (all in one widget file)
- **MEDIUM:** 7 — items #5, #6, #7, #8, #15, #18, #19
- **LOW:** 10 — copy drift that won't break checkout but erodes trust

### Recommended fix order for the follow-up sprint

1. **One PR:** Update `pricing-tier-widget.tsx` (#1, #2, #3, #4) — gates all checkout revenue.
2. **One PR:** Reconcile `meok/ui/src/lib/stripe.ts` (#5, #6) — internal consistency.
3. **One PR:** Reconcile `llms.txt` + `meok-os-v3-llms.txt` (#7, #8) — AEO/SEO.
4. **One PR (sweep):** All copy/SEO files (#9-#20) — can be a single commit since the change is mechanical ("£9" → "£29" / "£12" → "£29").

### Plus one non-phantom follow-up

The `Family £29/mo` tier has **no Stripe link in `AGENTS.md`**. The marketing site, FAQ,
pricing widget, and at least 7 other files all promise a £29 Family tier that has no
payment link provisioned. This isn't a phantom claim — it's a missing link. Nick needs to
either (a) create a Family Stripe link in the dashboard and add it to `AGENTS.md` "Stripe
live" block, or (b) remove the £29 Family marketing copy until it does.

---

## Audit file location

`/Users/nicholas/clawd/DAY2_PHANTOM_CLAIMS_AUDIT_2026-06-15.md`

No commits made. No deploys triggered. No `AGENTS.md` / `CLAUDE.md` modified. No `.env*` touched.
