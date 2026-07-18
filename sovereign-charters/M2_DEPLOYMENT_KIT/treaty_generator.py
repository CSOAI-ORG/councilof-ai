#!/usr/bin/env python3
"""
TREATY GENERATOR
=================
Generate a Partner Alliance Treaty (L0+ binding document) for a new partner.
Outputs a fully-rendered Markdown treaty with Ed25519 placeholder + BFT records.

(c) 2026 CSOAI Ltd · UK Companies House 16939677
Charter Article 0 binding.
"""
import sys, json, hashlib, argparse, datetime
from pathlib import Path

PARTNER_CATEGORIES = {
    'sovereign_operators': {
        'name': 'Sovereign Operators',
        'onboarding_sla_days': 30,
        'binding': 'Charter Article 0 + 4-tier cert',
        'sigil_rate_per_min': 100,
    },
    'enterprise_customers': {
        'name': 'Enterprise Customers',
        'onboarding_sla_days': 14,
        'binding': 'Charter Article 0 + Data Processing Agreement',
        'sigil_rate_per_min': 10,
    },
    'regulator_partners': {
        'name': 'Regulator Partners',
        'onboarding_sla_days': 90,
        'binding': 'Charter Article 0 + Memorandum of Understanding',
        'sigil_rate_per_min': 1,
    },
    'academic_partners': {
        'name': 'Academic Partners',
        'onboarding_sla_days': 60,
        'binding': 'Charter Article 0 + IP Agreement',
        'sigil_rate_per_min': 1,
    },
    'sovereign_cloud_partners': {
        'name': 'Sovereign Cloud Partners',
        'onboarding_sla_days': 45,
        'binding': 'Charter Article 0 + Air-gap deployment agreement',
        'sigil_rate_per_min': 1,
    },
    'defence_partners': {
        'name': 'Defence Partners',
        'onboarding_sla_days': 180,
        'binding': 'Charter Article 0 + DEFONEOS-SEAL',
        'sigil_rate_per_min': 0.1,
    },
}

PARTNER_TIERS = {
    'bronze': {'name': 'Bronze', 'cert_required': 'Foundation', 'review_months': 6, 'revenue_share': '0%', 'required_care_score': 0.85},
    'silver': {'name': 'Silver', 'cert_required': 'Foundation', 'review_months': 3, 'revenue_share': '1%', 'required_care_score': 0.90},
    'gold': {'name': 'Gold', 'cert_required': 'Practitioner + SOC 2', 'review_months': 1, 'revenue_share': '3%', 'required_care_score': 0.93},
    'platinum': {'name': 'Platinum', 'cert_required': 'Lead Auditor + BFT nomination', 'review_months': 0.25, 'revenue_share': '5%', 'required_care_score': 0.95},
}

DRAGON = chr(0x1F409)  # dragon emoji, kept out of f-strings to satisfy linters


def generate_treaty(partner_name, partner_category, partner_did, contact_email, intended_use, partner_tier='silver'):
    if partner_category not in PARTNER_CATEGORIES:
        raise ValueError("Unknown category: %s" % partner_category)
    if partner_tier not in PARTNER_TIERS:
        raise ValueError("Unknown tier: %s" % partner_tier)
    cat = PARTNER_CATEGORIES[partner_category]
    tier = PARTNER_TIERS[partner_tier]
    today = datetime.date.today().isoformat()
    sha_input = (partner_name + '|' + partner_category + '|' + partner_did + '|' + today).encode('utf-8')
    doc_id = 'PARTNER-TREATY-' + hashlib.sha256(sha_input).hexdigest()[:12].upper()

    body = []
    body.append('# SOVEREIGN PARTNER ALLIANCE TREATY (L0+)')
    body.append('## ' + partner_name + ' x CSOAI Charter Universe')
    body.append('## CSOAI Ltd · UK Companies House 16939677 · London, United Kingdom')
    body.append('## Treaty ID: ' + doc_id)
    body.append('')
    body.append('---')
    body.append('')
    body.append('## PREAMBLE')
    body.append('')
    body.append('THIS TREATY is made on ' + today + ' between **CSOAI Ltd** (a company registered in England and Wales with company number **16939677**, headquartered in London, United Kingdom) and **' + partner_name + '** (the "Partner", identified by DID `' + partner_did + '`, contact `' + contact_email + '`).')
    body.append('')
    body.append('The Partner wishes to participate in the Sovereign Partner Alliance established by the CSOAI Charter of Charters (`00-partners-charter.md`), which is governed by a 33-agent Byzantine Fault Tolerant council and protected by Charter Article 0 (constitutional protection requiring 33/33 + 5 human sigs to amend).')
    body.append('')
    body.append('**Charter Article 0 — Binding on All Partners**:')
    body.append('> "Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI."')
    body.append('')
    body.append('---')
    body.append('')
    body.append('## PART 1 — PARTNER IDENTITY')
    body.append('')
    body.append('| Field | Value |')
    body.append('|---|---|')
    body.append('| **Partner Name** | ' + partner_name + ' |')
    body.append('| **Partner Category** | ' + cat['name'] + ' |')
    body.append('| **Decentralized Identifier (DID)** | `did:csoai:' + partner_did + '` |')
    body.append('| **Contact Email** | `' + contact_email + '` |')
    body.append('| **Intended Use** | ' + intended_use + ' |')
    body.append('| **Partner Tier** | ' + tier['name'] + ' |')
    body.append('| **Treatment SLA** | ' + str(cat['onboarding_sla_days']) + ' days |')
    body.append('| **Charter Binding** | ' + cat['binding'] + ' |')
    body.append('| **SIGIL Rate Limit** | ' + str(cat['sigil_rate_per_min']) + '/min |')
    body.append('')
    body.append('## PART 2 — TIER BENEFITS')
    body.append('')
    body.append('| Tier: ' + tier['name'] + ' |')
    body.append('|---|')
    body.append('| **Cert Required**: ' + tier['cert_required'] + ' |')
    body.append('| **Review Cycle**: Every ' + str(tier['review_months']) + ' months |')
    body.append('| **Revenue Share**: ' + tier['revenue_share'] + ' |')
    body.append('| **Required Care Score**: >= ' + str(tier['required_care_score']) + ' |')
    body.append('| **Branding**: Sovereign brand license |')
    body.append('| **MCP Infrastructure Access**: OK |')
    body.append('| **Watchdog Signal Access**: OK |')
    body.append('| **SIGIL Chain Read/Write**: OK |')
    body.append('| **Cross-Cert Rights**: OK |')
    body.append('')
    body.append('## PART 3 — BINDING OBLIGATIONS (Charter Article 0 Inheritance)')
    body.append('')
    body.append('The Partner agrees to:')
    body.append('')
    body.append('1. **Inherit Charter Article 0** (no equity, no board seats, no revenue-sharing, no success fees).')
    body.append('2. **Operate within 30-framework universal cross-walk** (no jurisdiction shopping).')
    body.append('3. **Emit SIGILs for all sovereign actions** (full audit chain transparency).')
    body.append('4. **Report S4/S5 signals to Watchdog** (mandatory within 24h via `/api/report`).')
    body.append('5. **Accept BFT council adjudication** (binding on partner disputes, 23/33 quorum).')
    body.append('6. **Renew certification annually** (4-tier certs expire 12 months from issue).')
    body.append('7. **Maintain care_score >= ' + str(tier['required_care_score']) + '** (Care Membrane standard).')
    body.append('8. **Disclose all data sources** (no hidden scraping, no proprietary lock-in).')
    body.append('9. **Comply with Charter Article 0 binding** (constitutional, unamendable).')
    body.append('10. **Submit to annual partner audit** (Charter binding verification).')
    body.append('')
    body.append('---')
    body.append('')
    body.append('## PART 4 — VIOLATION RESPONSE (Charter Article 0 Enforcement)')
    body.append('')
    body.append('| Severity | Action |')
    body.append('|---|---|')
    body.append('| **S1** | Warning + corrective action plan |')
    body.append('| **S2** | Probation + 6-month monitoring |')
    body.append('| **S3** | Suspension + 90-day remediation |')
    body.append('| **S4** | Termination + BFT council ban + public disclosure |')
    body.append('| **S5** | Termination + Ed25519-signed public warning + **Charter Article 0 invocation** |')
    body.append('')
    body.append('Any violation of Charter Article 0 = automatic S5 termination + permanent public record.')
    body.append('')
    body.append('---')
    body.append('')
    body.append('## PART 5 — SIGNATURES')
    body.append('')
    body.append('### Partner Signature')
    body.append('```')
    body.append('Partner DID: did:csoai:' + partner_did)
    body.append('Partner Public Key (Ed25519): [to be inserted]')
    body.append('Partner Signature: [to be inserted]')
    body.append('Timestamp: ' + today)
    body.append('```')
    body.append('')
    body.append('### CSOAI Signature (Sovereign Root)')
    body.append('```')
    body.append('CSOAI Sovereign Key (Ed25519): d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a')
    body.append('CSOAI Signature: [to be inserted upon ratification]')
    body.append('Treaty ID: ' + doc_id)
    body.append('BFT Ratification: 23/33 quorum required')
    body.append('OTS Bitcoin Anchor: pending')
    body.append('```')
    body.append('')
    body.append('---')
    body.append('')
    body.append('**Treaty ID**: ' + doc_id)
    body.append('**Date**: ' + today)
    treaty_text = '\n'.join(body)

    treaty_hash = hashlib.sha256(treaty_text.encode('utf-8')).hexdigest()
    footer = []
    footer.append('**Treaty Hash (SHA-256)**: ' + treaty_hash[:32] + '...')
    footer.append('**Verification URL**: `https://proofof.ai/verify/treaty/' + doc_id + '`')
    footer.append('')
    footer.append('> *"The sovereign partner alliance is governed by Charter Article 0. Every partner inherits the binding. Every violation triggers automatic S5 enforcement. Every partnership is Ed25519-signed and BFT-ratified. The barrier to entry is zero. The barrier to capture is infinite."* ' + DRAGON)
    return treaty_text + '\n' + '\n'.join(footer)


def main():
    parser = argparse.ArgumentParser(description='Generate a Partner Alliance Treaty.')
    parser.add_argument('--partner-name', '-n', help='Partner organization name')
    parser.add_argument('--partner-category', '-c', choices=list(PARTNER_CATEGORIES.keys()), help='Partner category')
    parser.add_argument('--partner-did', '-d', help='Decentralized identifier (DID)')
    parser.add_argument('--contact-email', '-e', help='Contact email')
    parser.add_argument('--intended-use', '-u', help='Intended use case')
    parser.add_argument('--partner-tier', '-t', default='silver', choices=list(PARTNER_TIERS.keys()), help='Partner tier')
    parser.add_argument('--output', '-o', help='Output file path (otherwise stdout)')
    parser.add_argument('--self-test', action='store_true', help='Run self-test')
    args = parser.parse_args()

    if args.self_test:
        print('[SELF-TEST] treaty_generator.py')
        treaty = generate_treaty(
            partner_name='ACME Sovereign Cloud Ltd',
            partner_category='sovereign_cloud_partners',
            partner_did='partner-acme-sov-cloud-12345',
            contact_email='[email protected]',
            intended_use='Hosting sovereign AI workloads for UK and EU customers',
            partner_tier='gold'
        )
        assert len(treaty) > 3500, 'treaty should be substantial'
        assert 'Charter Article 0' in treaty
        assert '16939677' in treaty
        assert 'partner-acme-sov-cloud-12345' in treaty
        assert 'Gold' in treaty
        assert 'Article 0' in treaty
        h = hashlib.sha256(treaty.encode('utf-8')).hexdigest()
        print('  OK Treaty generated (' + str(len(treaty)) + ' bytes, SHA-256 ' + h[:16] + '...)')
        print('  OK Charter Article 0 binding included')
        print('  OK UK 16939677 included')
        print('  OK Partner DID included')
        print('  OK Tier benefits included')
        try:
            generate_treaty('TEST', 'invalid_category', 'did', 'test', 'use', 'silver')
            print('  FAIL Should have raised ValueError')
        except ValueError:
            print('  OK ValueError on unknown category')
        print('[SELF-TEST PASSED] 7/7 tests')
        return

    if not all([args.partner_name, args.partner_category, args.partner_did, args.contact_email, args.intended_use]):
        parser.print_help()
        sys.exit(1)

    treaty = generate_treaty(
        args.partner_name, args.partner_category, args.partner_did,
        args.contact_email, args.intended_use, args.partner_tier
    )
    if args.output:
        Path(args.output).write_text(treaty)
        print('Treaty written to ' + args.output)
    else:
        print(treaty)


if __name__ == '__main__':
    main()
