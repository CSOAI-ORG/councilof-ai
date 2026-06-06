# 01 — Corporate

The "can I invest safely?" folder. An EIS angel's lawyer lives here. The single biggest red flag at this stage is **no IP assignment from founder to company** — fix that first.

| # | Document | Why an investor needs it | Status | Source / how to verify |
|---|---|---|---|---|
| 01.1 | Certificate of incorporation | Proves the company legally exists. | **HAVE** | Companies House **#16939677** — public record. Download the cert from find-and-update.company-information.service.gov.uk/company/16939677 and place the PDF here. |
| 01.2 | Articles of association | Governs share rights, decisions, transfer restrictions. | **NEED** (file copy) | Public at Companies House (filing history). Download + place here; confirm they're model articles or note amendments. |
| 01.3 | Cap table (single source of truth) | Confirms 100% founder ownership, no surprise holders, ESOP plan. | **NEED** | Template in `_alignment/SWEAT_EQUITY_AND_DATAROOM_2026-06-02.md` §8 (Nicholas 100% Ordinary; reserve 10% ESOP at seed, do not grant pre-seed). Build `cap_table.xlsx` here. |
| 01.4 | **IP assignment deed (Nicholas → CSOAI LTD)** | **The #1 DD red flag.** Without it the IP "is just Nicholas's", not the company's. Every investor flags this. | **NEED — highest priority** | ~£500 with a UK SaaS lawyer. Once signed, place the executed deed here. Until then, this is the gating item for any term sheet. |
| 01.5 | Founder reverse-vesting agreement | Protects the company (and signals discipline) if the founder leaves; expected before outside money. | **NEED** | Put founder shares on a reverse-vesting schedule pre-raise. Standard 4yr/1yr-cliff. |
| 01.6 | Statutory registers (members, PSC) | Confirms persons with significant control = the founder; no hidden parties. | **IN-PROGRESS** | PSC is filed at Companies House (verify there). Maintain the members register here. |
| 01.7 | ICO data-protection registration | Required for processing personal data; cheap; investors check it. | **NEED** | Register at ico.org.uk (~£40/yr SME). Place the registration confirmation here. |
| 01.8 | EIS Advance Assurance (HMRC) | Lets the angel claim 30% income-tax relief — often the deciding factor for UK pre-revenue angels. | **NEED — high priority for this raise** | Apply to HMRC (SEIS first if eligible, then EIS). Place the HMRC assurance letter here. See `06_financials/` for the SEIS/EIS limits note. |
| 01.9 | Confirmation statement / annual filings | Shows the company is in good standing, not struck-off-pending. | **HAVE** (at CH) | Companies House filing history — public. |
| 01.10 | Business bank account confirmation | No personal/business commingling — a valuation-killer if absent. | **NEED** | Open at Mettle/Tide/Starling; route all revenue + outgoings through it. Place statement header here. |

**Verifier's note:** items 01.1, 01.2, 01.6, 01.9 are all **publicly checkable at Companies House right now** — the investor doesn't have to trust us for those. The `NEED`s (deed, cap table, ICO, EIS, bank) are the founder's near-term to-do list and are the honest gating items for closing.
