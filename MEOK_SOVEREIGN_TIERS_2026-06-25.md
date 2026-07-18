# 🏛 MEOK Sovereign hosting tiers — free vs own-VM (2026-06-25)
Nick's question: sovereign.mom = your own GCP VM hive (all connected, your data on your data hive); sovereign.wiki = free within MEOK — "or do both?" **Answer: yes, do both — it's a clean freemium sovereignty ladder, and it IS the moat.**

## The ladder (recommended)
| Tier | Domain | What you get | Data | Price |
|---|---|---|---|---|
| **Free** | **sovereign.wiki** | a sovereign AI + character in MEOK, shared MEOK infra, core apps | your data, your keys — but on **shared** MEOK hive | £0 (the front door / distribution) |
| **Sovereign** (premium) | **sovereign.mom** | **your OWN GCP VM hive**, fully isolated, all apps + data connected, your own data hive | **your own VM, your own data hive — true isolation** | £/mo (the real product) |

**Why both:** Free = distribution (get everyone in, "no more giving your data away" even on shared). Premium = the *actual* sovereignty promise — **your own machine, your own hive, your own data** — which is the moat nobody else offers and the recurring revenue. The free tier is the on-ramp to the paid one.

## Why this is genuinely strong (not just upsell)
- It matches the brand line: **"Sovereign OS — no more giving your data away."** Free already keeps your data yours; **own-VM makes it physically yours** (the premium leap people pay for).
- We already run the infra pattern: **`meok-king-hive` GCP VM (London)** exists — premium = one such hive *per sovereign*.
- CSOAI governance wraps both: every tier is signed/attested (the Ed25519 ledger moat).

## Honest reality (what it takes — flagged)
- **Domains** (sovereign.wiki / sovereign.mom): **owner registers + points DNS** — I don't register domains (owner-gated).
- **Free tier** = multi-tenant on shared MEOK hive → needs **tenant isolation + data partitioning** (real build).
- **Premium own-VM** = **per-user GCP VM provisioning** (Terraform / GCP API automation: spin a hive, attach a data hive, deploy the stack, point sovereign.mom subdomain). A real backend project — but the *stack* already exists (sovereign-temple + the hive), so it's automation, not invention.
- Billing = the existing Stripe/PAYG rails (Pro/£99 etc.) — add a "Sovereign / own-VM" SKU.

## Recommendation
1. **sovereign.wiki = free tier** — the OS as it is today, shared, your-data-yours. Best distribution play (ties to the "be the distribution layer" insight from the crown jewels).
2. **sovereign.mom = premium own-VM** — the sovereignty leap, recurring revenue, the moat. Provision-per-user is the build; the stack is ready.
3. Both governed by CSOAI (signed/attested) — same OS, two depths of sovereignty.
→ Pricing/SKU: fold into `revenue/PRICING_SOURCE_OF_TRUTH` (free → Sovereign own-VM as the top consumer tier, alongside the £499 A2A / £1,499 enterprise).

## Status
- This is the **product/tier design + recommendation**. Domains + per-user VM provisioning + tenant isolation are **owner/build work**, not done. The OS itself (the thing both tiers serve) is built and end-user-simple (the new guided welcome).
