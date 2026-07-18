# 10 — Folder Index

All documents in this playbook folder, in reading order.

---

## The 10 documents

| # | Filename | What it covers | Audience |
|---|---|---|---|
| 00 | **00_START_HERE_README.md** | Map of the whole folder + 60-second summary + the 4 phone calls for this week | Everyone — read first |
| 01 | **01_THE_FOUR_BUSINESSES.md** | Plain-English explanation of Templeman Opticians, MEOK AI Labs, CSO AI, CobolBridge.ai, Optomobile.ai, and the farm | Wendy + Fred (and Nick) |
| 02 | **02_TEMPLEMAN_OPTICIANS_GROWTH_PLAYBOOK.md** | How to grow the opticians specifically — 5 growth levers + 90-day plan + marketing | Wendy + Fred primarily |
| 03 | **03_KEY_CONTACTS_AND_PHONES.md** | Every phone number, email, URL needed — pin to office wall | Wendy + Fred (action reference) |
| 04 | **04_IP_AS_COLLATERAL_PLAN.md** | How Nick's software becomes cash via R&D tax credits, Patent Box, Innovation Loans, grants, eventual equity | Nick + family understanding |
| 05 | **05_6_MONTH_ROADMAP.md** | Month-by-month execution plan for May-October 2026 | Everyone — shared schedule |
| 06 | **06_PLAYBOOKS_TO_LEARN_FROM.md** | 8 case studies (Specsavers, Optical Express, Patagonia, Stripe, Notion, Riverford, Red Hat, Calendly) + master patterns + actions | Wendy + Fred inspiration |
| 07 | **07_DAILY_WEEKLY_CHECKLIST.md** | Simple recurring rhythms — daily, weekly, monthly, quarterly | Wendy + Fred fridge magnet |
| 08 | **08_NICK_EXECUTION_PLAN.md** | What Nick is doing in parallel — 5 simultaneous tracks | Wendy + Fred to understand Nick's work |
| 09 | **09_THE_FAMILY_ASSETS_INVENTORY.md** | Everything the family owns — physical, digital, IP, heritage, financial | Family + accountant reference |
| 10 | **10_INDEX.md** | This file | Navigation |

---

## Related documents OUTSIDE this folder

| Filename | Where | What it is |
|---|---|---|
| **MASTER_FAMILY_GRANTS_2026-05-14.md** | `/Users/nicholas/clawd/revenue/` | 1,626-line consolidated research on every grant + planning + trust + family-benefit available. Read alongside this playbook. |
| **GLOBAL_DOMINATION_2026-05-14.md** | `/Users/nicholas/clawd/revenue/` | Nick's distribution playbook — 8 awesome-mcp PRs, device codes, manifest API |

---

## Quick-reference cheat sheets

### The 4 phone calls for THIS WEEK
1. Citizens Advice South Lincolnshire — **0808 278 7996** (benefits check)
2. Pension Credit — **0800 99 1234** (passporting unlock)
3. Business Lincolnshire — **01522 782067** (free adviser)
4. South Holland DC pre-app — **planningadvice@sholland.gov.uk** (free written advice)

### The 5 grant deadlines for JUNE 2026
1. **PTES Stage 1** — 28 May 2026 — £3-10k
2. **NLnet NGI Zero Commons** — 1 June 2026 — €30-60k (3 sub-proposals)
3. **Defra ADOPT Round 7** — 3 June 2026 — £100k
4. **Innovate UK AgriScale** — 3 June 2026 — £250-750k
5. **KTP Round 2** with University of Lincoln — 24 June 2026 — £75-600k

### The 4 family financial quick wins
1. **Pension Credit** — even £1/wk unlocks £2-4k passporting + £150 Warm Home Discount + £174 TV licence + £25 Cold Weather + full Council Tax Reduction
2. **Attendance Allowance** — £3,988-£5,959/yr per parent with chronic condition (NOT means-tested, NOT taxable)
3. **Employment Allowance £10,500/yr** off employer NI (verify Templeman Opticians payroll EPS)
4. **Marriage Allowance £252/yr × 4 yrs backdated = £1,260 immediate**

### The 3 strategic structural moves
1. **Family IIP Trust** for the farm via Roythornes (~£3-6k setup)
2. **MEOK Operating Ltd + IP Holdco Ltd** split via Saffery (~£3-6k setup)
3. **Family Investment Company (FIC)** for liquid wealth via Roythornes + Saffery (~£3-6k)

### Planning permission classes (use cases — see Section 4r of MASTER_FAMILY_GRANTS for full detail)
- **Section 55(2)(a) TCPA** — maintenance/improvement = not development (covers polytunnel re-skinning)
- **Section 55(2)(d) TCPA** — incidental to dwelling = not development (covers personal-use structures within curtilage)
- **Class B GPDO Part 6** — 25% cubic content extension of existing ag buildings on 0.4-5 ha holdings, NO prior notification (covers workshop extension)
- **Class E GPDO Part 1** — outbuildings within dwellinghouse curtilage, 50% area / 4m height, NO application (covers polytunnels in curtilage)
- **Class R GPDO Part 3** — agricultural building → flexible commercial use up to 1,000 m², £258-£540 fee if formal change needed
- **LDC s.191** — Certificate of Lawful Existing Use, ~£309, defensive establishment of existing rights
- **LDC s.192** — Certificate of Lawful Proposed Use, half-fee ~£155, certainty before building

### Alternative legal vehicles to consider
- **CIC (Community Interest Company)** — for public-good research arm — unlocks Esmée Fairbairn, Garfield Weston, John Ellerman
- **BenCom (Co-operative & Community Benefit Society)** — can take community shares (£100-£20k each, tax-relief eligible), realistic Lincolnshire raise £30-150k
- **EOT (Employee Ownership Trust)** — succession option for Templeman Opticians, tax-free exit, retains independence

---

## How to update this playbook

This playbook is a **living document**. As things change (grants won/lost, new contacts, new businesses), update the relevant section.

**Quarterly review:**
- First Sunday of each quarter, family sits down for 1 hour
- Read this index
- Update any section where reality has moved past the document
- Commit changes to git so we have version history

**Nick is the keeper.** He updates the docs. But Wendy + Fred can request edits anytime by emailing him.

---

## Backup + version control

This folder is at: **`/Users/nicholas/clawd/revenue/playbook_2026-05-14/`**

It's tracked by git. Every change is recorded.

To see the current state from anywhere:
```bash
cd ~/clawd/revenue/playbook_2026-05-14/
ls
```

To print everything to PDF for Wendy + Fred to read on paper:
```bash
cd ~/clawd/revenue/playbook_2026-05-14/
for f in *.md; do
  pandoc "$f" -o "${f%.md}.pdf" --pdf-engine=wkhtmltopdf
done
```

(Or just open each .md in any text editor / VS Code / GitHub web — Markdown is readable as-is.)

---

## Final word

This is a 5-year plan compressed into ~30,000 words. The most important thing is to **not get overwhelmed**. Pick one document. Read it. Take one action. Then come back tomorrow.

The family is doing this together. Nobody is alone in it.

— Nick, 14 May 2026
