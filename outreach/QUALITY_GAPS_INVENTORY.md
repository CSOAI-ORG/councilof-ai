# Quality Gaps Inventory

> **Generated:** 2026-06-17  
> **Scope:** All `.md`, `.sh`, and `.txt` files under `~/clawd/`  
> **Issue categories:**
> 1. `[Name]`, `[Company]`, `[First Name]`, `[Recipient's Name]` — Unfilled placeholder name fields
> 2. `[Title]`, `[Role]`, `[Organization]` — Template role/organisation blanks
> 3. `[Insert …]`, `[Full Name]`, `[Email]`, `[Calendly link]` — Unsubstituted template fields
> 4. `[Brief technical description]`, `[Same structure]`, `[Why chosen over alternatives]` — AI skeleton text never fleshed out
> 5. `[specific …]` — Unfilled specific-context markers
> 6. `"response": "` wrapper — Raw AI-generated output saved instead of the rendered document
> 7. Generic AI template phrasing — Marketing boilerplate, repeated structures
>
> **Total unique files flagged:** ~80 (counting only `.md` files with unresolved placeholders)

---

## Category 1: Unfilled `[Name]` / `[Company]` / Personalisation Placeholders

These files contain email templates, outreach drafts, or documents with `[Name]`, `[Company]`, `[First Name]`, `[Recipient's Name]`, or similar personalisation fields that have never been filled in.

### Root-level clawd/

| File | Issue | Lines |
|------|-------|-------|
| `DOMAINS_EXECUTE_NOW.md` | `Hi [Name],` | 51 |
| `DOMAINS_EXECUTE_NOW.md` | `Hi [Decision Maker],` | 83 |
| `DOMAINS_EXECUTE_NOW.md` | `Hi [Safety Team],` | 107 |
| `DOMAIN_LAUNCH_TODAY.md` | `Hi [Name],` | 74 |
| `DOMAIN_LAUNCH_TODAY.md` | `Hi [Decision Maker],` | 33 |
| `DOMAIN_LAUNCH_TODAY.md` | `Hi [Safety Team],` | 113 |
| `MEOK_ONEOS_MASTER_STRATEGY.md` | `"Hello, I'm [Name]."` — companion intro script | 199 |
| `outreach_day4_cobol.md` | `Hi [Name],` | 9 |
| `domain-quick-win-strategy.md` | `Hi [Name],`, `[Company]` | 94, 96 |
| `first_strike.sh` | `Hi [Name],` | 52 |

### csoai-platform/ — Email & council templates

| File | Issue | Lines |
|------|-------|-------|
| `files (2) copy/CSOAI_Founding_Member_Welcome_Email.md` | `Dear [Name],` | 16 |
| `files (2) copy/CSOAI_Founding_Council_Page_Template.md` | `Dear [Name],` | 226 |
| `files (2) copy/CSOAI_Website_All_Page_Copy.md` | `**[Name]**`, `[Title/Role]` | 646-647 |
| `files (2) copy/CSOAI_Email_Templates.md` | `Hi [Name],` (×1), `Dear [Name],` (×3) | 19, 68, 170, 219 |
| `files (3)/CSOAI_Founding_Member_Welcome_Email.md` | `Dear [Name],` | 16 |
| `files (3)/CSOAI_Founding_Council_Page_Template.md` | `Dear [Name],`, `[Title] \| [Organization]` | 49, 226 |
| `files (3)/CSOAI_Website_All_Page_Copy.md` | `**[Name]**`, `[Title/Role]` | 646-647 |
| `files (3)/CSOAI_Email_Templates.md` | `Hi [Name],` `Dear [Name],` (×4), `[Company]` | 19, 68, 170, 219, 249 |
| `CSOAI_Master_Document_Library/05_Marketing_Sales/CSOAI_Website_All_Page_Copy.md` | `**[Name]**`, `[Title/Role]` | 646-647 |
| `CSOAI_Master_Document_Library/05_Marketing_Sales/CSOAI_Email_Templates.md` | `Hi [Name],` `Dear [Name],` (×4), `[Company]` | 19, 68, 170, 219, 249 |
| `CSOAI_Master_Document_Library/07_Founding_Council/CSOAI_Founding_Council_Page_Template.md` | `Dear [Name],`, `[Title] \| [Organization]` | 49, 226 |

### csoai-platform/docs/other/ — Outreach & execution docs

| File | Issue | Lines |
|------|-------|-------|
| `Viral Growth Execution Plan: 1000 LOI Signups.md` | `[Company Name]`, `Hi [Name]`, `[Company]` | 145-146 |
| `MANUS IP DOCUMENTATION & VALUATION AUTOMATION SCRIPT.md` | `Hi [Name],`, `[specific project]` | 470, 474 |
| `FishKeeper.ai Fix Action Plan.md` | `Hi [Name],` | 188 |
| `THE 7.5-HOUR EXECUTION GUIDE: CLOSING THE PAPERWORK GAP.md` | `Hi [Name],`, `[Name] \| [Company]` tables, `[Contact Name] - [Company] - [Your relationship] - [Email]` (×20 rows), `[First Name]` | 173, 311-332, 348, 387-388, 398 |
| `COMPLETE LOI PACKAGE - READY TO SEND.md` | `[Name] \| [Company]` tables, `[Contact Name] - [Company] - [Your relationship]` (×19 rows) | 71-107, 213-215 |
| `THE TRUE MASTER PLAN: MAKING VALUE REAL.md` | `Hi [Name],`, `[Their Company]` | 221, 219 |

### csoai-platform/assets/

| File | Issue | Lines |
|------|-------|-------|
| `pasted_content_3.txt` | `Hi [Name]`, `[specific project]` | 119 |
| `pasted_content_4.txt` | `Hi [Name],` | 21 |
| `pasted_content_6.txt` | `Hi [Name],`, `[Their Company]` | 166 |

### Other locations

| File | Issue | Lines |
|------|-------|-------|
| `cobol-bridge-sales-plan.md` | `[First Name]` (×6), `[Full Name]` (×4), `[Calendly link]` (×1), `[bank/insurance/gov]` | 328, 345, 348, 358, 370, 382, 392, 404, 414, 425, 430, 441 |
| `MEOK-PARTNER-AGREEMENT-TEMPLATE.md` | `[insert date]`, `[PARTNER]`, `[insert address]` | 10 |
| `freelance-profiles/upwork-profile.md` | `[X days]`, `[specific need]`, `[Architecture suggestion]` | 72, 84, 86 |
| `strategy/big-four-positioning/BIG_FOUR_IPO_POSITIONING_STRATEGY.md` | `[specific capability]`, `[enterprise client]` | 35, 39 |
| `revenue/COLD_EMAIL_DRAFTS_2026-06-07.md` | `[Company]`, `[N]`, `[region]` | 68, 92, 117 |
| `revenue/OUTBOUND_LINKEDIN_EMAILS_2026-04-26.md` | `[First Name]` (×4), `[specific thing they posted]` | 26, 28, 40, 54, 88 |
| `revenue/COLD_EMAILS_V3_INDUSTRY_VOICE.md` | Documents `[Name]` / `[Title]` as unpersonalised | 231 |
| `revenue/OEM_RESEND_2026-05-17.md` | `[Company]` | 41 |
| `revenue/content/cold_emails_ready_to_send.md` | Explicit header: "change [Company] and [Name], send" | 2 |
| `eu-ai-act-gtm-plan.md` | `[Company Name]` | 196 |
| `MASTER-REVENUE-PLAN.md` | `[Company Name]`, `[Calendly link]` | 566, 613 |

---

## Category 2: AI Skeleton / Unfilled Template Fields

Documents where entire sections are still placeholder text from an AI-generated outline that was never filled in.

| File | Issue | Lines |
|------|-------|-------|
| `csoai-platform/files (2)/CSOAI_Charter_Article_23_Model_Development_Standards.md` | `### Option 1: [Name]`, `**Description:** [Brief technical description]`, `[Same structure]` (×2), `### Option 2: [Name]`, `### Option 3: [Name]`, `## Selected Architecture: [Name]`, `**Rationale:** [Why chosen over alternatives]`, `- Safety: [specific concerns]` | 65-82 |
| `csoai-platform/files (4)/CSOAI_Charter_Article_23_Model_Development_Standards.md` | Identical set of skeleton placeholder lines | 65-82 |
| `csoai-platform/CHARTER ARTICLES/CSOAI_Charter_Article_23_Model_Development_Standards.md` | Identical set of skeleton placeholder lines | 65-82 |
| `csoai-platform/CSOAI_Master_Document_Library/03_Charter_Articles/Phase3_Technical/CSOAI_Charter_Article_23_Model_Development_Standards.md` | Identical set of skeleton placeholder lines | 65-82 |
| `csoai-platform/CSOAI_Complete_Partnership_Charter_52_Articles.md` | Identical skeleton (Art. 23 section) | 17789-17806 |
| `csoai-platform/CSOAI_Complete_Partnership_Charter_52_Articles copy.md` | Identical skeleton (duplicate file) | 17789-17806 |
| `csoai-platform/files (2)/CSOAI_Charter_Article_26_Interpretability_Explainability.md` | `Dear [Name],` — email template block | 595 |
| `csoai-platform/files (4)/CSOAI_Charter_Article_26_Interpretability_Explainability.md` | `Dear [Name],` — email template block | 595 |
| `csoai-platform/CHARTER ARTICLES/CSOAI_Charter_Article_26_Interpretability_Explainability.md` | `Dear [Name],` — email template block | 595 |
| `csoai-platform/CSOAI_Master_Document_Library/03_Charter_Articles/Phase3_Technical/CSOAI_Charter_Article_26_Interpretability_Explainability.md` | `Dear [Name],` — email template block | 595 |
| `csoai-platform/CSOAI_Complete_Partnership_Charter_52_Articles.md` | `Dear [Name],` — email template block | 21526 |
| `csoai-platform/CSOAI_Complete_Partnership_Charter_52_Articles copy.md` | `Dear [Name],` — email template block | 21526 |

---

## Category 3: Raw AI-Generated Output (`"response":` Wrapper)

These files in `marketing/` contain raw AI response blobs where the entire document is wrapped in `"response": "..."` — meaning they were saved as JSON-value strings instead of being rendered as proper documents. They also contain unfilled `[Recipient's Name]` / `[Name]` placeholders.

| File | Issue |
|------|-------|
| `marketing/10-gtm-emails-d4-d5.md` | AI response wrapper + `[Name]`, `[Company]` |
| `marketing/10-followup-emails-clearscore.md` | AI response wrapper + `[Recipient's Name]` |
| `marketing/10-testimonial-posts.md` | AI response wrapper |
| `marketing/3-dim-readiness-audit.md` | AI response wrapper |
| `marketing/align-D8-7-5-templates.md` | AI response wrapper + `[Insert Date]` |
| `marketing/align-D8-6-compare-soc2.md` | AI response wrapper |
| `marketing/align-D8-9-inbound.md` | AI response wrapper |
| `marketing/d4-D4-9-aisi.md` | AI response wrapper |
| `marketing/d4-D4-11-10.md` | AI response wrapper |
| `marketing/d5-D5-5-30-post.md` | AI response wrapper |
| `marketing/d5-50-personalised-emails.md` | AI response wrapper + `[Recipient's Name]` (×30 emails) |
| `marketing/d6-D6-3-meok.md` | AI response wrapper |
| `marketing/d7-D7-7-10.md` | AI response wrapper |
| `marketing/d8-D8-1-5.md` | AI response wrapper + `[Name]` |
| `marketing/d8-D8-7-5.md` | AI response wrapper + `[Recipient's Name]` |
| `marketing/lead-magnet-7day-sequence.md` | AI response wrapper |
| `marketing/meok-gaming-carousels.md` | AI response wrapper |
| `marketing/rev-partner-2.md` | AI response wrapper |
| `marketing/rev-sectors.md` | AI response wrapper |
| `marketing/rev-policies.md` | AI response wrapper |
| `marketing/founder-office-hour.md` | AI response wrapper |
| *(and several more `marketing/rev-*` and `align-*` files)* | AI response wrapper |

> **Note:** The entire `marketing/` directory (~50+ files) appears to be AI-generated drafts saved in raw JSON response format. Many contain unfilled `[Recipient's Name]` fields. These would all benefit from being rendered as proper markdown documents with placeholders resolved.

---

## Category 4: Files with `[specific …]` Context Gaps

These files use `[specific X]` markers that were never filled with concrete details.

| File | Issues |
|------|--------|
| `csoai-platform/docs/other/MANUS IP DOCUMENTATION & VALUATION AUTOMATION SCRIPT.md` | `[specific project]` |
| `strategy/big-four-positioning/BIG_FOUR_IPO_POSITIONING_STRATEGY.md` | `[specific capability]`, `[enterprise client]` |
| `freelance-profiles/upwork-profile.md` | `[specific need]`, `[Architecture suggestion]`, `[X days]` |
| `revenue/OUTBOUND_LINKEDIN_EMAILS_2026-04-26.md` | `[specific thing they posted — e.g. "BSI's Section 30 register ambiguity"]` |
| `csoai-platform/assets/pasted_content_3.txt` | `[specific project]` |
| `cobol-bridge-sales-plan.md` | `[bank/insurance/gov]` |
| All 7 copies of `CSOAI_Charter_Article_23_Model_Development_Standards.md` | `- Safety: [specific concerns]` |

---

## Category 5: Duplicate / Stale Copy Issues

Several files are exact or near-exact duplicates spread across the csoai-platform directory tree:

| Duplicate variants | Content |
|--------------------|---------|
| `csoai-platform/files (2)/CSOAI_Charter_Article_23_Model_Development_Standards.md` | Same skeleton |
| `csoai-platform/files (4)/CSOAI_Charter_Article_23_Model_Development_Standards.md` | Same skeleton |
| `csoai-platform/CHARTER ARTICLES/CSOAI_Charter_Article_23_Model_Development_Standards.md` | Same skeleton |
| `csoai-platform/CSOAI_Master_Document_Library/03_Charter_Articles/Phase3_Technical/CSOAI_Charter_Article_23_Model_Development_Standards.md` | Same skeleton |
| `csoai-platform/CSOAI_Complete_Partnership_Charter_52_Articles.md` | Contains same skeleton (embedded) |
| `csoai-platform/CSOAI_Complete_Partnership_Charter_52_Articles copy.md` | Exact duplicate of above |

Similar duplication exists for:
- `CSOAI_Charter_Article_26_Interpretability_Explainability.md` (4 copies + 2 embedded in the megacharter)
- `CSOAI_Founding_Member_Welcome_Email.md` (3 copies)
- `CSOAI_Founding_Council_Page_Template.md` (3 copies)
- `CSOAI_Website_All_Page_Copy.md` (3 copies)
- `CSOAI_Email_Templates.md` (3 copies)

---

## Category 6: Other Quality Signals

| File | Issue |
|------|-------|
| `marketing/d5-D5-8-first-customer.md` | `[Recipient's Name]` — unfilled |
| `marketing/email-template-library.md` | Contains `[Name]` / `[Company]` patterns |
| `_RESEARCH_REVIEW/kimi_dominance_dossier/meok_domination.agent.final.md` | Contains "do not hesitate" generic AI phrasing |
| `_RESEARCH_REVIEW/kimi_dominance_dossier/meok_domination_sec07.md` | Contains "do not hesitate" generic AI phrasing |
| `_RESEARCH_REVIEW/kimi_dominance_dossier/meok_domination.agent.final.converted.md` | Contains "do not hesitate" generic AI phrasing |

---

## Summary

| Category | Approx. file count | Severity |
|----------|-------------------|----------|
| 1. Unfilled `[Name]`/`[Company]` placeholders | ~40 files | 🔴 High — blocks sending |
| 2. AI skeleton / unfilled template fields | ~7 unique docs (×6 copies = 12 files) | 🔴 High — incomplete content |
| 3. Raw AI `"response"` wrappers | ~25+ files in `marketing/` | 🟡 Medium — not rendered |
| 4. `[specific …]` context gaps | ~7 files | 🟡 Medium — vague |
| 5. Duplicate/stale copies | ~15 redundant files | 🟡 Medium — clutter |
| 6. AI template phrasing | 3 files | 🟢 Low — minor tone issue |

**Key actionable insights:**
1. The `csoai-platform/` directory has the worst concentration of unresolved placeholders, especially the Article 23 Model Development Standards skeleton which appears in **6 different copies**.
2. The `marketing/` directory is essentially raw AI output — all ~50 files start with `"response":` JSON wrappers and many contain `[Recipient's Name]`.
3. Outreach templates in `revenue/` and root-level `DOMAIN_*` files still have `[Name]`/`[Company]` unfilled.
4. The `cobol-bridge-sales-plan.md` has heavy template-isation across multiple email drafts.
