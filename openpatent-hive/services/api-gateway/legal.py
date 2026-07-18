"""
OpenPatent.ai legal framework + jurisdiction badges.
Direct citations from the master plan §3.1 — these are the badges
shown on the landing page trust section and inside the verify pages.
"""
LEGAL_BADGES = [
    {
        "id": "fre-902",
        "jurisdiction": "United States",
        "citation": "Federal Rules of Evidence 902(13) & 902(14)",
        "year": 2017,
        "summary": "Self-authenticating electronic records verified by hash value. Blockchain timestamps align precisely.",
        "url": "https://www.law.cornell.edu/rules/fre/rule_902",
    },
    {
        "id": "eidas",
        "jurisdiction": "European Union",
        "citation": "Regulation (EU) No 910/2014 (eIDAS), Art. 41 + 2024 eIDAS 2.0 revision",
        "year": 2014,
        "summary": "Qualified electronic timestamps carry legal presumption of accuracy across all 27 member states.",
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32014R0910",
    },
    {
        "id": "hangzhou-2018",
        "jurisdiction": "China",
        "citation": "Hangzhou Internet Court, June 2018 + Supreme People's Court Sept 2018",
        "year": 2018,
        "summary": "First court globally to admit blockchain-stored evidence; three Internet Courts now operate dedicated judicial blockchains.",
        "url": "http://www.hzinternetcourt.com/",
    },
    {
        "id": "marseille-2025",
        "jurisdiction": "France",
        "citation": "Tribunal Judiciaire de Marseille, March 2025",
        "year": 2025,
        "summary": "Recognized blockchain timestamping as valid proof of copyright anteriority — a persuasive European precedent.",
        "url": "https://www.courdecassation.fr/",
    },
    {
        "id": "wipo",
        "jurisdiction": "Global",
        "citation": "WIPO guidance on blockchain for prior authorship",
        "year": 2022,
        "summary": "World Intellectual Property Organization explicitly recognizes blockchain as valid measure to prove prior authorship.",
        "url": "https://www.wipo.int/",
    },
    {
        "id": "thaler-v-vidal",
        "jurisdiction": "United States",
        "citation": "Thaler v. Vidal, 43 F.4th 1207 (Fed. Cir. 2022)",
        "year": 2022,
        "summary": "AI cannot be named as inventor; AI-assisted human invention with inventive judgment remains patentable.",
        "url": "https://law.justia.com/cases/federal/appellate-courts/cafc/22-113/22-113-2022-08-05.html",
    },
    {
        "id": "35-usc-102",
        "jurisdiction": "United States",
        "citation": "35 U.S.C. § 102 (AIA)",
        "year": 2013,
        "summary": "Publicly accessible disclosures before filing date = prior art. Blockchain publication meets the standard.",
        "url": "https://www.law.cornell.edu/uscode/text/35/102",
    },
    {
        "id": "epc-54",
        "jurisdiction": "European Union",
        "citation": "Article 54(2) EPC",
        "year": 1973,
        "summary": "State of the art = everything made available to the public before filing. eIDAS-qualified timestamp proves the date.",
        "url": "https://www.epo.org/en/legal/epc",
    },
    {
        "id": "uk-pa-1977",
        "jurisdiction": "United Kingdom",
        "citation": "Patents Act 1977 § 2(2) + post-Brexit eIDAS alignment + Property (Digital Assets) Bill 2024",
        "year": 2024,
        "summary": "Same as EPC for prior art; domesticated eIDAS framework with digital asset personal property recognition.",
        "url": "https://www.legislation.gov.uk/ukpga/1977/37",
    },
    {
        "id": "japan-pa-29",
        "jurisdiction": "Japan",
        "citation": "Patent Act § 29(1)",
        "year": 1959,
        "summary": "Publicly known or worked invention before filing = prior art. Case-by-case blockchain evidence admission.",
        "url": "https://www.jpo.go.jp/e/",
    },
    {
        "id": "china-pl-22",
        "jurisdiction": "China",
        "citation": "Patent Law Article 22(2)",
        "year": 2008,
        "summary": "Publicly known before filing = no patent. Judicial blockchain infrastructure directly supports timestamp evidence.",
        "url": "https://www.cnipa.gov.cn/",
    },
    {
        "id": "italy-12-2019",
        "jurisdiction": "Italy",
        "citation": "Law No. 12/2019, Article 8-ter",
        "year": 2019,
        "summary": "Blockchain timestamps granted same legal effect as electronic timestamps under eIDAS — national-level reinforcement.",
        "url": "https://www.gazzettaufficiale.it/",
    },
]

# 5 primary jurisdictions covered by CSOAI Crosswalk Engine
JURISDICTIONS = [
    {"code": "US", "name": "United States", "law": "35 U.S.C. § 102", "grace_period_days": 365},
    {"code": "EU", "name": "European Union", "law": "Article 54(2) EPC", "grace_period_days": 180},
    {"code": "UK", "name": "United Kingdom", "law": "Patents Act 1977 § 2(2)", "grace_period_days": 180},
    {"code": "JP", "name": "Japan", "law": "Patent Act § 29(1)", "grace_period_days": 180},
    {"code": "CN", "name": "China", "law": "Patent Law Art. 22(2)", "grace_period_days": 180},
]
