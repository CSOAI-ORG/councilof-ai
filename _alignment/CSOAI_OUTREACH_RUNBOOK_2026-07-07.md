# ▶️ CSOAI Outreach & Distribution — OPERATOR RUNBOOK (2026-07-07)

**Not a new plan.** Indexes the canonical engine (`CSOAI_DISTRIBUTION_UNIFIED_2026-07-07.md`)
and adds the bleeding-edge OSS tool layer. Extends the **inbound/tooling** lane per the dedup rule.
Care Floor 0.95 + SIGIL. One leads DB (`sovereign-charters/csoai_leads.db`). One key. One funnel.

## 1. The engine (already built — reuse, don't rebuild)
| Piece | Path | State |
|---|---|---|
| Unified plan | `_alignment/CSOAI_DISTRIBUTION_UNIFIED_2026-07-07.md` | canonical |
| Leads DB (target map) | `sovereign-charters/csoai_leads.db` | 200+ leads, 1,053 metrics, signed |
| Send system | `outreach-system/send_all.py` + `emails/*.txt` | 30 emails staged, SMTP/SendGrid |
| Outbound demo globe | `sovereign-charters/csoai_portal/distribution-globe.html` | Cesium, lead pins |
| Inbound self-serve | `os.meok.ai/hatch-demo.html` + `sovereign-embed.js` | one-line embed |
| Discoverability | 317 PyPI MCPs · MCP registry · llms.txt/agent-card | live |

## 2. The bleeding-edge OSS tool layer (wire to SOV3 via MCP)
| Funnel stage | Tool (OSS/MCP-native ⭐) | Role |
|---|---|---|
| **GET CITED by AI** ⭐#1 gap | `geo-optimizer-skill` (MCP), GetCito, geo-aeo-tracker | track/fix ChatGPT/Perplexity/Gemini citations |
| **Social distribution** | Postiz (AGPL, agentic) | 13 networks, AI posts |
| **Email broadcast** | Listmonk (AGPL) | fast lists, analytics |
| **Email nurture** | Mautic (GPL) | drip, lead-score |
| **Send infra** | Postal / Mailcow | SMTP + domain warmup |
| **Lead-gen / web agent** | Skyvern (AGPL, MCP-ready) | find + enrich + form-fill |
| **CRM (system of record)** | Twenty (AGPL, native MCP) | pipeline, SOV3 read/write |
| **PR / news** | Featured.com, Qwoted, Source-of-Sources (SaaS) | journalist requests → signed expert quotes |
| **Repurpose** | SOV3 OOWM (no OSS equal) | 1 blog → 30 pieces → Postiz |
| **Analytics** | PostHog + Dub.co | attribution loop |

## 3. The linkable asset (feeds ALL channels at once)
Publish the **27-framework crosswalk + signed System Cards** as public, crawlable, schema.org pages.
Answer engines, journalists, and bloggers all cite concrete + *verifiable* facts. This is GEO action #1.

## 4. How to RUN it (and what's gated)
```
# 1. See who we'd contact (SAFE, no send)
python3 outreach-system/send_all.py --dry-run

# 2. GEO scan — which queries are we invisible on? (SAFE, read-only)
#    npx geo-optimizer / geo-aeo-tracker against csoai.org

# 3. Real send — OWNER-GATED (sends on Nick's behalf):
#    requires ~/clawd/.env.local creds + per-batch approval + GDPR/PECR opt-out
python3 outreach-system/send_all.py --limit 5 --delay 30
```
**⛔ Gated (owner only, never auto-fire):** real email send, `.env.local` SMTP/SendGrid creds,
`SIGIL_SEED`, Stripe, any login/ToS-crossing scrape. Public data only. Care-floor blocks spam.

## 5. The sovereign loop (target architecture)
`SOV3 OOWM ← GEO tracker (finds lost queries) → generates cited content → Postiz/Listmonk distribute
→ Featured/Qwoted pitches drafted → Skyvern places backlinks → Twenty logs → EVERY action Ed25519-signed
+ care-gated → appends inbound signals to csoai_leads.db.` One engine, governed end to end.

## 6. AI SDR vs Layer 0 (the architecture call)
The **SDR is an application (L4), NOT a Layer 0 protocol.** BUT it must run *on* L0 primitives, and
there is a real **new L0 primitive** worth adding:
> **"Governed Outbound / Outreach Provenance"** — a signed, consent-gated, auditable record proving an
> AI-sent message was authorized (did:csoai), policy-checked (care-floor), and opt-out-honored
> (GDPR/PECR/CAN-SPAM). Composes existing L0: identity + policy-engine + audit.

This turns "AI SDR" from a growth hack into a CSOAI **standard**: *provable, compliant AI outreach* —
which no ungoverned SDR (Clay/Instantly/Overloop) can offer. Recommend adding it as L0 protocol #9.
