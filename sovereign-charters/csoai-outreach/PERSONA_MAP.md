# 🎯 CSOAI Persona → Platform-Coverage Map (2363 accounts)

Derived from the Sovereign SME KB. Each persona is a real demographic in the 2,363-account
distribution list; the surfaces are what that buyer needs to see to convert. Gaps = surfaces a
persona needs that CSOAI does not yet expose as a first-class route.

## Personas (by volume)
| Persona | Accounts | Surfaces needed | Examples |
|---|---:|---|---|
| **US public company (SEC filer)** | 1526 | /crosswalk, /compare, /system-card, /verify-certificate, /classifier, /us-ai-regulation, /high-risk-ai | NVIDIA CORP; Apple Inc.; Alphabet Inc. |
| **Financial services** | 343 | /crosswalk, /compare, /system-card, /verify-certificate, /classifier, /dora, /finance-ai-act, /nis2 | FCA — AI in Finance; EIOPA (insurance); EBA (banking) |
| **Healthcare / Life sciences** | 167 | /crosswalk, /compare, /system-card, /verify-certificate, /classifier, /healthcare-ai-act, /high-risk-ai | AstraZeneca; Pfizer; UnitedHealth |
| **AI startup / scale-up** | 147 | /crosswalk, /compare, /system-card, /verify-certificate, /classifier, /start, /os, /pricing | Zscaler; European Commission DG-CONNECT; EU AI Office |
| **Enterprise (general)** | 113 | /crosswalk, /compare, /system-card, /verify-certificate, /classifier, /industries, /pricing | QinetiQ; ICO — AI Auditing Framework; NCSC — AI Cyber |
| **Regulator / Policy body** | 41 | /crosswalk, /compare, /system-card, /verify-certificate, /classifier, /regulator-atlas, /government-dashboard, /sov-space, /globe | UK AI Safety Institute (AISI); UK Cabinet Office — i.AI team; UK Department for Science, Innovation & Technology (DSIT) |
| **Defence / National security** | 26 | /crosswalk, /compare, /system-card, /verify-certificate, /classifier, /fedramp, /cobol, /high-risk-ai | BAE Systems; Rolls-Royce; Leonardo |

## Surface coverage (needed path vs live route — verified against master's router)
- ✅ **/classifier** (live route)
- ✅ **/cobol** (live route)
- ✅ **/compare** (live route)
- ✅ **/crosswalk** (live route)
- ✅ **/dora** (live route)
- ✅ **/fedramp** (live route)
- ✅ **/finance-ai-act** (live route)
- ✅ **/globe** (live route)
- ✅ **/government-dashboard** (live route)
- ✅ **/healthcare-ai-act** (live route)
- ✅ **/high-risk-ai** (live route)
- ✅ **/industries** (live route)
- ✅ **/nis2** (live route)
- ✅ **/os** (live route)
- ✅ **/pricing** (live route)
- ✅ **/regulator-atlas** (live route)
- ✅ **/sov-space** (live route)
- ✅ **/start** (live route)
- ✅ **/system-card** (live route)
- ✅ **/us-ai-regulation** (live route)
- ✅ **/verify-certificate** (live route)

✅ every persona-needed path is a live route.

## TRUE demographic gaps (persona ✕ 300+-route cross-reference)
- 🔴 No **SEC AI-disclosure** page (`/sec-disclosure`) for the **1,541 SEC-filer** persona — the single largest demographic. `/us-ai-regulation` exists but is generic, not the 10-K AI-risk-factor + governance-evidence angle they file on.
- 🔴 No **defence-specific** CSOAI page for primes (BAE, Rolls-Royce, Leonardo) — likely intentional (that is DEFONEOS’s lane), so map these to a DEFONEOS handoff rather than build inside CSOAI.
- 🔴 No **per-persona journey/landing** that routes a visitor by demographic into the right existing pages — the pages exist but discovery is flat.

> The site already has 300+ routes incl. sector + framework pages — the real gap is **packaging + discovery per persona**, not missing content. Highest-leverage build: a SEC-filer page for the #1 persona (1,541 accounts), and a demographic router.
