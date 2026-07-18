# Companies House — entities linked to James

## Purpose
Companies House is open data. Pulling the full structure of companies linked to James (and to you) is the single most concrete step in this bundle. It will either show a legitimate operating structure, or it will show the "shell" pattern (dormant accounts, shared addresses, no real employees, intra-group circular transactions).

## TO FILL

| Company name | Company number | Role of James | Role of you | Status | Notes |
|---|---|---|---|---|---|
| | | | | | |

For each company:
- **Active directors** (Companies House → People → search his name)
- **SIC codes** (what the company says it does)
- **Last accounts filed** (a dormant or never-filed company is a yellow flag)
- **Registered address** (a "virtual office" address shared with 50+ other companies is a red flag)
- **Persons with significant control** (the ultimate owners, not just nominees)
- **Charges** (any secured loans against the company)

## How to do this

1. Go to https://find-and-update.company-information.service.gov.uk/
2. Search "James Castle" → list all results → record company numbers
3. Repeat for any company name he used (his own, joint ventures, subsidiaries)
4. Repeat for the entities where YOU are a director — note where he appears in the structure
5. For each company number: click through → "People" → "Persons with significant control" → record

## What I can do

Once you give me a list of company names or numbers, I can do all of the above in one pass via the Companies House API (free, no key needed for basic queries). **Give me the list, I'll populate the table.**

## Red flags I'm specifically looking for

- Company has the same registered address as 20+ other companies (a "formation agent" address, e.g. 71-75 Shelton Street, London WC2H)
- James is PSC (person of significant control) but not a listed director (uses nominees)
- Accounts are years overdue or "dormant" but the company is actively transacting
- Share capital is £1 issued at par and never changed
- Two companies in the group invoice each other for "management fees" or "consultancy" with no underlying contract

None of these are illegal in themselves. They are patterns that, **combined with the false-credential claim and a financial-extraction pattern**, would support a "shell extraction" characterisation. **That's the solicitor's call, not mine.**
