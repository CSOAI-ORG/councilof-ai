# SOC 2 Type 1 — 90-day path (Move #16)

## Why SOC 2 first (not ISO 27001)

- Enterprise procurement (UK + US Fortune 500) gates on SOC 2
- 90-day timeline (Type 1) vs 12-month Type 2 — open enterprise doors faster, upgrade to Type 2 next year
- Cheaper: ~£8-12k vs £25k+ for ISO 27001 audit
- ~Self-attestable via Vanta / Drata / Secureframe — heavy lift done in software

## Vendor

**Vanta** — chosen for the trial-free 30 days, ~270 pre-built integrations, well-documented controls
library, lowest learning curve.

Alternatives: Drata (better UX, 30% more expensive), Secureframe (US-focused, fewer EU controls).

## 90-day timeline

### Days 1-7: Setup
- Sign up for Vanta trial
- Connect:
  - Vercel
  - Stripe
  - GitHub (CSOAI-ORG)
  - Upstash
  - Sentry (when DSN set)
  - npm (for SDK ownership)
  - PyPI
  - Google Workspace (nicholas@meok.ai)
- Run Vanta initial scan → typically ~40% controls auto-pass

### Days 7-30: Policy authoring
Vanta provides templates; customise:
- Information Security Policy
- Access Control Policy
- Acceptable Use Policy
- Incident Response Policy
- Vendor Management Policy
- Data Classification Policy
- Encryption Policy
- BCP/DRP (Business Continuity / Disaster Recovery)
- Change Management Policy
- Risk Assessment Policy

Each ~1-2 hours to localise to MEOK context.

### Days 30-60: Controls evidence
- 100% MFA on every connected account
- All laptops encrypted (FileVault on Macs)
- Password manager (1Password Business — ~£8/mo per seat)
- Security training (Vanta has a built-in 30-min module — Nick completes)
- Access review (monthly cadence — Vanta auto-enforces)
- Vulnerability scanning (Vanta + Snyk auto-scan deps)
- Background checks (Vanta has integration with Checkr — N/A for solo founder)

### Days 60-90: External auditor
- Pick auditor from Vanta's marketplace: typically **AssuranceLab** (UK-friendly, ~£7.5k Type 1)
- Auditor walks through controls + sample evidence
- Issue Type 1 letter dated end of audit window

### Day 91+: Marketing
- Add SOC 2 logo to https://haulage.app/trust
- Publish full report (gated behind a form) at /soc2
- Add to /partners materials for enterprise prospects

## Cost envelope

| Item | One-time | Ongoing |
|---|---|---|
| Vanta Type 1 plan | — | £400/mo |
| AssuranceLab audit | £7,500 | £4,000/yr re-audit |
| 1Password Business | £100 | £100/yr |
| Snyk / Dependabot (already free on GitHub) | — | — |
| **Total Year 1** | **£7,600** | **£4,900** |

## Year-2 path to Type 2

Type 2 = 12 months of continuous control operation. Vanta auto-collects evidence; we just need
**zero control failures** for 12 months. Schedule audit Q1 2027.

## Side-quest: ISO/IEC 42001 AI management

Since we ship AI compliance MCPs, getting ISO 42001 (the AI management system standard) is a
no-brainer marketing flex. ~50% overlap with SOC 2 controls. Add ~£3k + 30 days to the path.
**Defer to Q3 2026** after Type 1 lands.

## What enterprise procurement actually asks for

The list of evidence enterprise security reviews demand:
- [ ] Current SOC 2 Type 1 or Type 2 letter
- [ ] Penetration test report (~£3k from Cure53 / Cobalt — Year 2)
- [ ] Sub-processor list (already drafted in /legal/dpa)
- [ ] Encryption-at-rest evidence (Upstash KMS, Vercel encrypted env vars)
- [ ] Incident response plan (Vanta template)
- [ ] Privacy policy with GDPR/CCPA compliance (already shipped /legal/privacy)
- [ ] Bug bounty / responsible disclosure policy (write `/security.txt` per RFC 9116)

## Decision

**Start Vanta trial after Move #13 Sentry + Move #14 Audit ledger have real prod data flowing.**
Both feed evidence directly into Vanta's continuous-control monitoring.
