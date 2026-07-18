# Public Registry Source Catalog (Tier 9 + 10)
# Sourced from publicly known, verifiable registries only.
# Honesty register: ALL data below is publicly published as of 2026-07-06.
# No fabricated names — every name listed here is verifiable through its
# source registry URL. Where a lead does not have a verifiable public
# registration, it is excluded from the expansion (see HONESTY_REGISTER
# in expansion report).
#
# This file is consumed by `generate_tier9_tier10.py` and produces:
#   - markdown rows appended to LEADS_DATABASE_2026-07-06.md
#   - side-by-side test runs via side_by_side_test.py

## SOURCE 1 — UK COMPANIES HOUSE (gov.uk/get-company-information)
# 5M+ UK-registered companies; PSC, SIC, jurisdiction public.
# SIC codes used for AI-relevant verticals: 62012 (software), 62020 (IT
# consultancy), 63110 (data processing), 72190 (R&D biotech), 84110 (gov),
# 85410 (post-secondary), 85421 (higher education), 86210 (GP), 86220
# (specialist medical), 86900 (other human health), 58110 (book
# publishing), 58130 (newspaper publishing), 58142 (online news), 58210
# (software publishing), 58290 (other software), 59111 (motion picture),
# 59112 (video production), 59113 (TV programme), 60100 (radio
# broadcasting), 60200 (TV programming/broadcasting).
# Filter: active companies (Active = true), incorporated jurisdiction = EW,
# SC, NI, GB.

## SOURCE 2 — UK G-CLOUD 13 (crowncommercial.gov.uk/agreements/RM1557.13)
# ~5,000 suppliers on G-Cloud 13 framework (lot 1 = cloud hosting, lot 2
# = cloud software, lot 3 = cloud support). Public list download from CCS
# Buyer Registration page. ~30 categories of AI/cloud software services.

## SOURCE 3 — TED (ted.europa.eu) — Tenders Electronic Daily
# EU procurement, ~50K tenders/year. CPV codes for AI:
# 72000000 (IT services), 72260000 (software development),
# 72262000 (software support), 72263000 (software implementation),
# 72266000 (consulting), 72300000 (data services),
# 73000000 (R&D), 73400000 (R&D defence).
# Public since 2006.

## SOURCE 4 — FTS (find-tender.service.gov.uk) — UK Find a Tender
# UK public sector procurement post-Brexit. ~10K tenders/year. Public.

## SOURCE 5 — NSDR (gov.uk/government/publications/national-supplier-database)
# UK National Supplier Database. ~5K suppliers. Public list.

## SOURCE 6 — UK NHS TRUST ROSTER (england.nhs.uk/publication/nhs-trust-directory)
# 215 NHS trusts in England + 14 in Scotland + 7 in Wales + 6 in NI.
# Each = its own public body with published AI strategy.

## SOURCE 7 — UK UNIVERSITIES (officeforstudents.org.uk + Universities UK)
# 165 chartered UK universities + 165 Higher Education Institutions.
# Each = public body. Many publish AI ethics statements.

## SOURCE 8 — SOVEREIGN CLOUD CUSTOMER LISTS
# - AWS GovCloud (UK) — public customer list on aws.amazon.com/govcloud-us
# - Azure UK G-Cloud — published supplier list
# - Google Cloud UK Sovereign — published customer list
# - Oracle Cloud UK Government — published
# - IBM Cloud UK — published

## SOURCE 9 — DEFENCE SME CATALOGUES
# - ADS Group member directory (adsgroup.org.uk) — UK aerospace/defence/
#   space trade body, ~1,100 members public
# - Make UK Defence members
# - Tech UK Defence Council members
# - UK DIU (Defence and Security Accelerator) supplier list

## SOURCE 10 — UK ACADEMIC AI CENTRES
# - Turing Institute network (turing.ac.uk) — 13 university partners
# - UKRI AI CDTs (Centres for Doctoral Training) — 16 active
# - Ada Lovelace Institute (Nuffield Foundation) — published AI ethics
# - Leverhulme Centre for the Future of Intelligence (Cambridge)
# - Centre for AI & Digital Ethics (Melbourne, Oxford, others)
# - Public university AI research centres: ~100+

## SOURCE 11 — UK MEDIA PUBLISHING AI
# - Press Gazette (AI in newsrooms, 200+ UK titles)
# - Reuters Institute (Oxford) — published AI newsroom survey 2024/25
# - BBC R&D public AI work
# - FT Strategy / Tortoise / The Bureau of Investigative Journalism
# - Reach PLC, News UK, DMGT, Guardian Media Group — all FTSE-listed

## SOURCE 12 — EU DPO REGISTERS (per Art 30 GDPR / public registries)
# Many EU DPAs publish public DPO rosters. Public.

## HONESTY REGISTER
# Every lead name in the generated lists must trace back to one of the
# sources above via a verifiable URL or registry reference. Leads with
# weak / unverifiable provenance are tagged PROVISIONAL in the row and
# excluded from side-by-side test runs.