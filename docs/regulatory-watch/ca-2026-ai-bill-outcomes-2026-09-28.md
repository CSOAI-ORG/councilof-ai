# California AI bills before the Governor: outcomes as read on 2026-09-28

**Status: interim snapshot. Re-read on or after 2026-10-01.** The Governor has until **2026-09-30** to sign or veto
the bills passed before the 2026-08-31 adjournment. This file is read-only and internal. It is not a public page and
not an outward draft.

- **Source of every outcome:** each bill's full history page on leginfo.legislature.ca.gov, the Legislature's own
  record, read once between 2026-09-28T15:17:55Z and 15:18:30Z. The machine-readable companion is
  `ca-2026-ai-bill-outcomes-2026-09-28.json`, which gives per bill the page URL, `fetched_at`, HTTP status and the
  sha256 of the bytes read.
- **Rule:** "Approved by the Governor" → APPROVED; "Vetoed by (the) Governor" → VETOED; "Enrolled and presented to the
  Governor" with neither → ON_DESK. Nothing is inferred from news reports.
- **Selection:** a bill is listed because at least one of three secondary sources named it as an AI-related bill sent
  to the Governor: Wiley (4 Sep), Kelley Drye (14 Sep) and a Substack round-up (11 Sep). Reports speak of 30 or more
  AI measures and this list has 21, so **completeness is UNMEASURED**.
- **Producer:** `scripts/reg-sources-watch/reg_sources_watch.py ca-outcomes`. The same 21 bills are sources in the
  watcher, so a Governor's action after this snapshot is recorded as a `QUARANTINED` change on that bill.

## Signed so far (7 of the 21 listed)

| Bill | Title (leginfo) | Approved | Chapter |
|---|---|---|---|
| SB 813 | Independent verification organizations | 2026-09-09 | Ch. 179, Stats. 2026 |
| AB 1405 | Artificial intelligence: auditors: registration | 2026-09-09 | Ch. 178, Stats. 2026 |
| SB 867 | Toys: companion chatbots | 2026-09-10 | Ch. 189, Stats. 2026 |
| SB 1119 | Companion chatbots: children's safety | 2026-09-10 | Ch. 190, Stats. 2026 |
| SB 1050 | False advertising: synthetic performers | 2026-09-16 | Ch. 246, Stats. 2026 |
| SB 886 | California Technology Innovation and Ratepayer Protection Act (data centres) | 2026-09-21 | Ch. 438, Stats. 2026 |
| AB 2383 | Electricity: data centers | 2026-09-21 | Ch. 435, Stats. 2026 |

## Vetoed so far: none of the 21 listed

## Still on the Governor's desk (14)

| Bill | Title (leginfo) | Presented |
|---|---|---|
| SB 503 | Health care services: artificial intelligence | 2026-08-30 |
| AB 2025 | Tenancy: digitally altered images: disclosure | 2026-08-31 |
| SB 1000 | California AI Transparency Act | 2026-09-02 |
| AB 1979 | Health care services: artificial intelligence | 2026-09-04 |
| AB 2713 | California AI Transparency Act: system provenance data | 2026-09-08 |
| SB 1111 | Digital replicas | 2026-09-08 |
| SB 947 | Employment: automated decision systems | 2026-09-09 |
| SB 951 | Employment: technological displacement: notice | 2026-09-09 |
| SB 903 | Mental health professionals: artificial intelligence | 2026-09-09 |
| SB 574 | Attorneys, arbitrators, judicial officers, and alternative resolution providers | 2026-09-09 |
| AB 1883 | Workplace surveillance tools | 2026-09-10 |
| AB 1609 | Customer service chatbots | 2026-09-14 |
| AB 1331 | Workplace surveillance | 2026-09-14 |
| AB 2575 | Health care services: artificial intelligence | 2026-09-15 |

## Notes

- **Secondary reports mix years.** One page dated 2026-09-09 reports SB 243 as signed and AB 1064 as vetoed "in
  2026". The leginfo history for AB 1064 shows "Vetoed by Governor" on **2025-10-13** and the veto consideration
  stricken on 2026-01-22, so it is not a 2026 action. SB 243's date was not re-read here, and it is not in the selection.
- The Governor's 2026-09-20 legislative update (gov.ca.gov) lists 87 bills signed and 24 vetoed. None of them is on
  this list.
- **Nothing here claims a status for CSOAI.** SB 813 (independent verification organisations) and AB 1405 (AI auditor
  registry) create criteria and a registry that do not exist yet (GovOps criteria are due by 2028-01-01 per internal notes, not re-read here). We hold no
  role under either and claim none. The 2026-09-18 executive order on independent oversight creates no role we hold.
