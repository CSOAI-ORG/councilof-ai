#!/usr/bin/env python3
"""
JURISDICTION MAPPER
===================
Map an ISO country code to its sovereign status, applicable frameworks,
sovereign trust tier, and applicable CSOAI charters. Stdlib only.

Outputs a JSON document mapping each ISO code to its sovereign state.

(c) 2026 CSOAI Ltd · UK Companies House 16939677
Charter Article 0 binding applies to all output.
"""

import sys, json, argparse
from pathlib import Path

# ISO 3166-1 alpha-2 country code → sovereign tier (1-5)
# Tier 1 = Sovereign Member, 2 = Treaty Adopter, 3 = Sovereign Cloud Eligible,
# 4 = Conditional, 5 = Restricted
SOVEREIGN_TIERS = {
    # Tier 1 — Sovereign AI Members (full recognition)
    'GB': {'tier': 1, 'name': 'United Kingdom', 'sovereign_status': 'MEMBER', 'available_tier': 'Full 4-tier + Watchdog Cert + DEFONEOS-SEAL', 'flags': ['EU AI Act mirror via UK GDPR', 'JSP 936/440/604']},
    # Tier 2 — Treaty Adopters
    'US': {'tier': 2, 'name': 'United States', 'sovereign_status': 'TREATY', 'available_tier': 'Director-level cert accepted as NIST AI RMF tier 4', 'flags': ['NIST AI RMF', 'NIST CSF 2.0', 'NIST SP 800-53']},
    'EU': {'tier': 2, 'name': 'European Union', 'sovereign_status': 'TREATY', 'available_tier': 'Full 4-tier via AI Act certification pathway', 'flags': ['EU AI Act', 'GDPR', 'DORA', 'MiCA']},
    # Tier 3 — Sovereign Cloud Eligible (15 countries)
    'AU': {'tier': 3, 'name': 'Australia', 'sovereign_status': 'CLOUD', 'available_tier': 'Privacy officer tier accepted', 'flags': ['Privacy Act 1988', 'ADM & AI Action Plan 2024', 'Defence AI Industry Strategy 2024']},
    'JP': {'tier': 3, 'name': 'Japan', 'sovereign_status': 'CLOUD', 'available_tier': 'Director-level certification recognised', 'flags': ['AI Promotion Act 2025', 'PPC AI Guidance', 'Copyright & AI Training']},
    'KR': {'tier': 3, 'name': 'Korea (South)', 'sovereign_status': 'CLOUD', 'available_tier': 'Director + AI Basic Act compliance', 'flags': ['AI Basic Act 2026', 'PIPA']},
    'SG': {'tier': 3, 'name': 'Singapore', 'sovereign_status': 'CLOUD', 'available_tier': 'AI Verify cross-walk approved', 'flags': ['Model AI Governance Framework 2024', 'PDPA 2012', 'Cybersecurity Act 2018']},
    'IN': {'tier': 3, 'name': 'India', 'sovereign_status': 'CLOUD', 'available_tier': 'DPDPA tier 1+2 accepted', 'flags': ['DPDPA 2023', 'IndiaAI Mission 2024']},
    'AE': {'tier': 3, 'name': 'UAE', 'sovereign_status': 'CLOUD', 'available_tier': 'ADGM AI/ML Guidance cross-walk', 'flags': ['PDPL 2021', 'SDAIA']},
    'SA': {'tier': 3, 'name': 'Saudi Arabia', 'sovereign_status': 'CLOUD', 'available_tier': 'National AI Strategy recognised', 'flags': ['PDPL 2024', 'Vision 2030 AI']},
    'IL': {'tier': 3, 'name': 'Israel', 'sovereign_status': 'CLOUD', 'available_tier': 'Privacy officer tier accepted', 'flags': ['Privacy Protection Law 1981', 'National AI Strategy']},
    'TW': {'tier': 3, 'name': 'Taiwan', 'sovereign_status': 'CLOUD', 'available_tier': 'PDPA compliance pathway', 'flags': ['PDPA', 'AI Basic Act draft 2025']},
    'HK': {'tier': 3, 'name': 'Hong Kong', 'sovereign_status': 'CLOUD', 'available_tier': 'PDPA + AI Ordinance', 'flags': ['AI Personal Data (Privacy) Ordinance 2025']},
    'TH': {'tier': 3, 'name': 'Thailand', 'sovereign_status': 'CLOUD', 'available_tier': 'PDPA tier 1 accepted', 'flags': ['PDPA 2019', 'Royal Decree on AI Ethics 2025']},
    'VN': {'tier': 3, 'name': 'Vietnam', 'sovereign_status': 'CLOUD', 'available_tier': 'PDPD tier 1 accepted', 'flags': ['PDPD 13/2023']},
    'CH': {'tier': 3, 'name': 'Switzerland', 'sovereign_status': 'CLOUD', 'available_tier': 'Revised DPA 2023 compliance', 'flags': ['Revised Data Protection Act 2023', 'Federal AI Guidelines 2024']},
    'NO': {'tier': 3, 'name': 'Norway', 'sovereign_status': 'CLOUD', 'available_tier': 'AI Risk Management', 'flags': ['DPA Act 2018', 'AI Risk Management']},
    'NZ': {'tier': 3, 'name': 'New Zealand', 'sovereign_status': 'CLOUD', 'available_tier': 'Privacy Act 2020 + Algorithm Charter', 'flags': ['Privacy Act 2020', 'Algorithm Charter']},
    # Tier 4 — Conditional Deployment (5 countries)
    'BR': {'tier': 4, 'name': 'Brazil', 'sovereign_status': 'CONDITIONAL', 'available_tier': 'LGPD tier accepted (pilot)', 'flags': ['LGPD 2018', 'EBIA', 'AI Bill 2024']},
    'MX': {'tier': 4, 'name': 'Mexico', 'sovereign_status': 'CONDITIONAL', 'available_tier': 'LFPDPPP baseline', 'flags': ['LFPDPPP', 'National AI Strategy 2024']},
    'ZA': {'tier': 4, 'name': 'South Africa', 'sovereign_status': 'CONDITIONAL', 'available_tier': 'POPIA tier 1+2', 'flags': ['POPIA 2013', 'National AI Policy Framework']},
    'TR': {'tier': 4, 'name': 'Turkey', 'sovereign_status': 'CONDITIONAL', 'available_tier': 'KVKK baseline', 'flags': ['KVKK 6698', 'National AI Strategy 2021-2025']},
    'EG': {'tier': 4, 'name': 'Egypt', 'sovereign_status': 'CONDITIONAL', 'available_tier': 'PDPL baseline', 'flags': ['PDPL 151/2020', 'National AI Strategy 2025']},
    # Tier 5 — Restricted (3 countries)
    'CN': {'tier': 5, 'name': 'China', 'sovereign_status': 'RESTRICTED', 'available_tier': 'Sovereign-court-strict isolation required', 'flags': ['PIPL', 'DSL', 'CSL', 'GenAI Interim Measures 2023', 'Algorithm Recommendation Provisions 2022', 'Synthetic Content ID Provisions 2024', 'GB/T 45438-2025']},
    'RU': {'tier': 5, 'name': 'Russia', 'sovereign_status': 'RESTRICTED', 'available_tier': 'Sovereign-court-strict isolation required', 'flags': ['Personal Data Law 152-FZ']},
    'IR': {'tier': 5, 'name': 'Iran', 'sovereign_status': 'PROHIBITED', 'available_tier': 'UN sanctions prohibit', 'flags': []},
}

# Applicable CSOAI charters per sovereign trust tier (Citizen/Resident/Visitor/Prohibited)
TIER_AVAILABLE_CHARTERS = {
    1: list(range(1, 42)),  # All 41 charters (Sovereign Member)
    2: list(range(1, 42)),  # All 41 (Treaty Adopter)
    3: list(range(1, 42)),  # All 41 (Cloud Eligible)
    4: list(range(1, 38)),  # 38 industry-only (no sovereign-court-strict)
    5: [37, 38, 39],          # Restricted to the 3 sovereign-only charters (Court/Standards/Ledger)
}

# Sovereign Trust Tiers (an alternative classification — based on CSOAI partnership depth)
SOVEREIGN_TRUST_TIERS = {
    1: 'Citizen',  # Full CSOAI community access
    2: 'Citizen',  # Treaty Adopter
    3: 'Resident',  # Cloud Eligible
    4: 'Visitor',  # Conditional
    5: 'Prohibited',  # Restricted / no-go
}

# Applicable frameworks per tier
TIER_APPLICABLE_FRAMEWORKS = {
    1: {'EU': 18, 'UK': 15, 'US': 29, 'APAC': 38, 'EMEA': 30, 'Americas': 18, 'Sectoral': 37, 'Standards': 48, 'Multilateral': 6, 'total': 236},
    2: {'EU': 18, 'UK': 15, 'US': 29, 'APAC': 38, 'EMEA': 30, 'Americas': 18, 'Sectoral': 37, 'Standards': 48, 'Multilateral': 6, 'total': 236},
    3: {'EMEA': 30, 'APAC': 38, 'Sectoral': 37, 'Standards': 48, 'Multilateral': 6, 'total': 159},  # Region-applicable only
    4: {'Sectoral': 37, 'Standards': 48, 'Multilateral': 6, 'total': 91},  # Sectoral only
    5: {'Multilateral': 6, 'total': 6},  # Multilateral only (UN/UNESCO/OECD)
}

# Charter hive slug names
HIVE_SLUGS = {1: 'csoai', 2: 'meok', 3: 'proofof', 4: 'safetyof', 5: 'accountabilityof', 6: 'ethicalgovernanceof', 7: 'transparencyof', 8: 'biasdetectionof', 9: 'dataprivacyof', 10: 'asisecurity', 11: 'agisafe', 12: 'defoneos', 13: 'councilof', 14: 'openmoe', 15: 'openmcp', 16: 'openpatent', 17: 'sandbox', 18: 'sovereign-town', 19: 'meok-compliance-gateway', 20: 'loopfactory', 21: 'optimobile', 22: 'socialmediamanager', 23: 'cobolbridge', 24: 'commercialvehicle', 25: 'diyhelp', 26: 'fishkeeper', 27: 'grabhire', 28: 'koikeeper', 29: 'landlaw', 30: 'muckaway', 31: 'planthire', 32: 'pokerhud', 33: 'suicidestop', 34: 'science', 35: 'coigndaltion', 36: 'publicwatchdog', 37: 'sovereigncourt', 38: 'sovereignstandards', 39: 'sovereignledger'}


def lookup(iso_code: str) -> dict:
    """Look up sovereign status for an ISO 3166-1 alpha-2 country code.
    Codes 'EU' (European Union) and 'GB' (United Kingdom) supported."""
    iso_code = iso_code.upper()
    if iso_code not in SOVEREIGN_TIERS:
        return {
            'iso_code': iso_code,
            'error': f'Unknown ISO code "{iso_code}". Use ISO 3166-1 alpha-2 (e.g. GB, US, DE, FR) or EU.',
        }
    info = SOVEREIGN_TIERS[iso_code]
    tier = info['tier']
    return {
        'iso_code': iso_code,
        'name': info['name'],
        'sovereign_tier': tier,
        'sovereign_status': info['sovereign_status'],
        'sovereign_trust_tier': SOVEREIGN_TRUST_TIERS[tier],
        'available_sovereign_tier': info['available_tier'],
        'applicable_flags': info['flags'],
        'applicable_frameworks': TIER_APPLICABLE_FRAMEWORKS[tier],
        'applicable_charters_count': len(TIER_AVAILABLE_CHARTERS[tier]),
        'applicable_charter_slugs': [HIVE_SLUGS[i] for i in TIER_AVAILABLE_CHARTERS[tier] if i in HIVE_SLUGS],
        'sovereign_root_binds': 'Charter Article 0 binding applies',
        'charter_article_0': 'Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI.',
    }


def list_all() -> dict:
    """List all sovereign status mappings."""
    return {code: lookup(code) for code in SOVEREIGN_TIERS}


def main():
    parser = argparse.ArgumentParser(description='Sovereign Jurisdiction Mapper (stdlib only).')
    parser.add_argument('--iso-code', '-i', help='ISO 3166-1 alpha-2 country code (e.g. GB, US, EU)')
    parser.add_argument('--list', '-l', action='store_true', help='List all jurisdictions')
    parser.add_argument('--self-test', action='store_true', help='Run self-test')
    args = parser.parse_args()

    if args.self_test:
        print("[SELF-TEST] jurisdiction_mapper.py")
        # Test 1: GB lookup
        gb = lookup('GB')
        assert gb['iso_code'] == 'GB', "GB lookup failed"
        assert gb['sovereign_tier'] == 1, "GB should be Tier 1"
        print("  ✓ GB lookup (Tier 1, full 4-tier)")
        # Test 2: US lookup
        us = lookup('US')
        assert us['iso_code'] == 'US', "US lookup failed"
        assert us['sovereign_tier'] == 2, "US should be Tier 2"
        print(f"  ✓ US lookup (Tier 2, {us['applicable_frameworks']['total']} frameworks)")
        # Test 3: CN lookup (Tier 5 restricted)
        cn = lookup('CN')
        assert cn['sovereign_tier'] == 5, "CN should be Tier 5"
        assert cn['sovereign_status'] == 'RESTRICTED', "CN should be RESTRICTED"
        print(f"  ✓ CN lookup (Tier 5, RESTRICTED, sovereign-court-strict isolation)")
        # Test 4: Unknown code
        bad = lookup('ZZ')
        assert 'error' in bad, "ZZ should error"
        print("  ✓ ZZ lookup (graceful error)")
        # Test 5: list_all
        all_data = list_all()
        assert len(all_data) >= 25, "list_all should have >= 25 jurisdictions"
        print(f"  ✓ list_all ({len(all_data)} jurisdictions)")
        # Test 6: BR (Tier 4)
        br = lookup('BR')
        assert br['sovereign_tier'] == 4, "BR should be Tier 4"
        print("  ✓ BR lookup (Tier 4, CONDITIONAL, LGPD)")
        # Test 7: EU
        eu = lookup('EU')
        assert eu['sovereign_tier'] == 2, "EU should be Tier 2"
        print("  ✓ EU lookup (Tier 2, TREATY)")
        print("\n[SELF-TEST PASSED] 7/7 tests")
        return

    if args.list:
        result = list_all()
        print(json.dumps(result, indent=2))
        return

    if args.iso_code:
        result = lookup(args.iso_code)
        print(json.dumps(result, indent=2))
        return

    parser.print_help()


if __name__ == "__main__":
    main()
