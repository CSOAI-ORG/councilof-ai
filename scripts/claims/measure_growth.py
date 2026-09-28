#!/usr/bin/env python3
"""Run every measurement this lane can make keylessly, and write one JSON per measurement id.

Nothing here decides whether a claim is true. Each harness returns what it read, the window it
read over, the denominator it read against, and the sources with their access dates. A harness
that could not reach its evidence returns UNMEASURED with the reason, and the claim it would have
settled stays UNMEASURED in the registry. A partial read is never totalled as a population.

  python3 measure_growth.py <out-dir> [only-id ...]
"""
from __future__ import annotations

import json
import sys
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import common as c  # noqa: E402
import corroborate  # noqa: E402
import repo_facts  # noqa: E402
import superlative  # noqa: E402

#: measurement id -> (callable, note). Ids are referenced by the registry builder.
GOVERNANCE_PATTERNS = [r'\bthe leading\b', r'\bleading (?:enterprise )?AI[- ]?governance\b',
                       r'\btrusted leader\b', r'\b#1\b', r'\bindustry[- ]leading\b',
                       r'\bthe only\b', r'\bmarket leader\b']
OBSERVABILITY_PATTERNS = [r'\bthe leading\b', r'\bmost widely adopted\b', r'\bmost popular\b',
                          r'\bindustry[- ]leading\b', r'\bthe only\b', r'\b#1\b']

GOVERNANCE_OTHERS = {
    'Credo AI': 'https://www.credo.ai/',
    'Holistic AI': 'https://www.holisticai.com/',
    'Vanta': 'https://www.vanta.com/',
    'IBM watsonx.governance': 'https://www.ibm.com/products/watsonx-governance',
    'Fairly AI': 'https://www.fairly.ai/',
    'Trustible': 'https://www.trustible.ai/',
}
OBSERVABILITY_OTHERS = {
    'Arize': 'https://arize.com/',
    'Langfuse': 'https://langfuse.com/',
    'Galileo': 'https://galileo.ai/',
    'Traceloop': 'https://www.traceloop.com/',
    'Helicone': 'https://www.helicone.ai/',
    'Comet Opik': 'https://www.comet.com/site/products/opik/',
    'LangSmith': 'https://www.langchain.com/langsmith',
}
OSS_LLM_ENGINEERING_SET = [
    'langfuse/langfuse', 'Arize-ai/phoenix', 'Helicone/helicone', 'traceloop/openllmetry',
    'comet-ml/opik', 'openlit/openlit', 'Agenta-AI/agenta', 'lunary-ai/lunary',
    'promptfoo/promptfoo', 'confident-ai/deepeval',
]

#: corroboration: (measurement id, the named third party, the term searched, its own domains)
CORROBORATIONS = [
    ('M-CORR-CLICKHOUSE', 'ClickHouse', 'Langfuse', ['clickhouse.com']),
    ('M-CORR-SERVICENOW', 'ServiceNow', 'Traceloop', ['servicenow.com']),
    ('M-CORR-MINTLIFY', 'Mintlify', 'Helicone', ['mintlify.com']),
    ('M-CORR-FORRESTER-VANTA', 'Forrester', 'Vanta', ['forrester.com']),
    ('M-CORR-FORRESTER-CREDO', 'Forrester', 'Credo AI', ['forrester.com']),
    ('M-CORR-GARTNER-HOLISTIC', 'Gartner', 'Holistic AI', ['gartner.com']),
    ('M-CORR-RBI-DEMAT2', 'Reserve Bank of India', 'Demat 2.0', ['rbi.org.in']),
]

#: the entities the ECB's own press release names as onboarded to Pontes, with their own domains.
PONTES_NAMED = {
    'ABANCA': ['abanca.com'], 'BayernLB': ['bayernlb.de'],
    'Caisse des Depots et Consignations': ['caissedesdepots.fr'], 'Cecabank': ['cecabank.es'],
    'Deutsche Bank': ['db.com'], 'Deka Bank': ['deka.de'], 'DZ Bank': ['dzbank.de'],
    'European Investment Bank': ['eib.org'], 'Kreditanstalt fuer Wiederaufbau': ['kfw.de'],
    'Memo Bank': ['memo.bank'], 'NRW.BANK': ['nrwbank.de'], 'Santander': ['santander.com'],
    'Societe Generale': ['societegenerale.com'], 'Axiology': ['axiology.eu'],
    'Cashlink': ['cashlink.de'], 'Clearstream': ['clearstream.com'], 'SWIAT': ['swiat.io'],
    'Deutsche Bundesbank': ['bundesbank.de'],
}


def extra_line_for(r: dict) -> str:
    """A NOT_FOUND must carry its own reach in the same record, in numbers, or it will be read as
    a denial. This names how much of the party's own site was actually read and what this reader
    structurally cannot pass."""
    reach = r.get('reach') or {}
    return (
        f"this search read {reach.get('pages_read_successfully')} page(s) of this party's own site "
        f"and saw {reach.get('sitemap_urls_seen')} URL(s) in its published index and "
        f"{reach.get('commoncrawl_pages_indexed_seen')} page(s) for it in the keyless Common Crawl "
        "index. It cannot pass a registration wall, a paywall, a bot challenge or a robots rule, and "
        "research and analyst firms commonly place report content behind one. Content there would not "
        "be found by this search, and its absence from this result is a property of the routes used")


def corroboration_measurement(org: str, term: str, domains: list[str]) -> dict:
    r = corroborate.check(org, term, domains=domains)
    conclusive = r['status'] in ('CORROBORATED', 'NOT_FOUND')
    return {
        'state': 'CLAIM_MEASURED' if conclusive else 'UNMEASURED',
        'reason': None if conclusive else r['meaning'],
        'measured_at': c.now_iso(),
        'method': ('search the named third party\'s OWN published index — its robots.txt and sitemaps, plus '
                   'the keyless Common Crawl URL index for its domain — fetch every URL whose slug carries '
                   'the term together with a bounded set of its own news pages, and quote the term from the '
                   'visible text served by that party itself'),
        'window': f"{org}'s public web presence as served at measured_at",
        'denominator': {'third_parties_searched': 1, 'pages_read_successfully':
                        r.get('reach', {}).get('pages_read_successfully', 0),
                        'sitemap_urls_seen': r.get('reach', {}).get('sitemap_urls_seen', 0),
                        'commoncrawl_pages_indexed_seen': r.get('reach', {}).get('commoncrawl_pages_indexed_seen', 0)},
        'result': {'third_party': org, 'term': term, 'status': r['status'],
                   'quotes': [h.get('quote') for h in r.get('corroborations', [])][:2],
                   'quote_urls': [h.get('url') for h in r.get('corroborations', [])][:2], 'n': 1},
        'detail': r,
        'does_not_prove': ([extra_line_for(r)] if r['status'] == 'NOT_FOUND' else []) + [
            'NOT_FOUND is a fact about this search by the stated routes. It is not a denial by the third '
            'party, not a contradiction of the claim, and not a finding that anything is false',
            'SEARCH_INCONCLUSIVE means this host could not reach enough of that party\'s own index to '
            'conclude anything, and is reported separately for exactly that reason',
            'CORROBORATED means the third party\'s own site names the term. It does not establish the '
            'scale, status, commercial terms or currency of any relationship',
            'whole-site full text is not searched: slugs across the published index plus the full text of '
            'the pages actually fetched',
        ],
    }


def pontes_participant_measurement() -> dict:
    # Each named entity is an independent public-site read. Run them concurrently so one slow
    # organisation cannot serialize the whole 18-entity measurement for many minutes. Results are
    # keyed and sorted below, so scheduling order never changes the published artifact.
    def read_one(org: str, doms: list[str]):
        try:
            return org, corroborate.check(org, 'Pontes', domains=doms, bounded=True)
        except Exception:
            return org, {'status': 'SEARCH_INCONCLUSIVE', 'meaning': 'harness raised',
                         'traceback': traceback.format_exc()[-400:]}

    # Warm the Common Crawl collection lookup once before fan-out; every worker then reuses the
    # exact same collection endpoint and source receipt.
    corroborate.cc_api(bounded=True)
    rows = {}
    with ThreadPoolExecutor(max_workers=min(6, len(PONTES_NAMED))) as pool:
        futures = [pool.submit(read_one, org, doms) for org, doms in PONTES_NAMED.items()]
        for future in as_completed(futures):
            org, result = future.result()
            rows[org] = result
    tally = {s: sorted(k for k, v in rows.items() if v['status'] == s)
             for s in ('CORROBORATED', 'NOT_FOUND', 'SEARCH_INCONCLUSIVE', 'NOT_SEARCHED')}
    conclusive = len(tally['CORROBORATED']) + len(tally['NOT_FOUND'])
    if conclusive == 0:
        return {'state': 'UNMEASURED',
                'reason': ('not one of the named entities could be reached conclusively from this host, so '
                           'this run measured nothing'),
                'per_entity_status': {k: v['status'] for k, v in rows.items()}}
    return {
        'state': 'CLAIM_MEASURED',
        'measured_at': c.now_iso(),
        'method': ('take the entities the publisher\'s own press release names, and for each one search that '
                   'entity\'s OWN published index (robots.txt -> a bounded sitemap read; the keyless Common '
                   'Crawl URL index is the fallback when that site index cannot be read) for the programme '
                   'name, quoting any hit from the entity\'s own visible page text. Network reads are time '
                   'bounded; a timeout becomes SEARCH_INCONCLUSIVE, never an absence'),
        'window': 'each named entity\'s public web presence as served at measured_at',
        'denominator': {
            'entities_named_by_the_publisher': len(PONTES_NAMED),
            'entities_reached_conclusively': conclusive,
            'entities_search_inconclusive': len(tally['SEARCH_INCONCLUSIVE']),
            'note': ('the rate below is over the entities REACHED, not over the entities named. The '
                     'unreached remainder is unmeasured and is reported as such, never divided into'),
        },
        'result': {
            'entities_named': str(len(PONTES_NAMED)),
            'entities_reached': str(conclusive),
            'corroborated_on_their_own_site': str(len(tally['CORROBORATED'])),
            'not_found_by_this_search': str(len(tally['NOT_FOUND'])),
            'unmeasured_because_unreachable': str(len(tally['SEARCH_INCONCLUSIVE'])),
            'n': conclusive,
        },
        'per_entity': {k: {'status': v['status'],
                           'quote': (v.get('corroborations') or [{}])[0].get('quote'),
                           'quote_url': (v.get('corroborations') or [{}])[0].get('url'),
                           'pages_read': v.get('reach', {}).get('pages_read_successfully')}
                       for k, v in sorted(rows.items())},
        'does_not_prove': [
            'that any named entity is or is not participating. NOT_FOUND is a fact about this search; many '
            'organisations do not publish their market-infrastructure connections on their website at all',
            'that the publisher\'s statement is wrong in any respect. Nothing here is a statement about the '
            'publisher, and none may be read as one',
            'that the unreached entities are absent. They are unmeasured, counted separately, and never '
            'folded into the denominator',
        ],
    }


MEASUREMENTS = {
    'M-LANGFUSE-LICENCE': lambda: repo_facts.licence_check('langfuse/langfuse', 'MIT'),
    'M-OPENLLMETRY-LICENCE': lambda: repo_facts.licence_check('traceloop/openllmetry', 'Apache-2.0'),
    'M-PHOENIX-LICENCE': lambda: repo_facts.licence_check('Arize-ai/phoenix', 'Elastic-2.0'),
    'M-HELICONE-LICENCE': lambda: repo_facts.licence_check('Helicone/helicone', 'Apache-2.0'),
    'M-OSS-STARS-LANGFUSE': lambda: repo_facts.star_comparison(
        'langfuse/langfuse', OSS_LLM_ENGINEERING_SET, 'open-source LLM engineering / observability platforms'),
    'M-OSS-STARS-PHOENIX': lambda: repo_facts.star_comparison(
        'Arize-ai/phoenix', OSS_LLM_ENGINEERING_SET, 'open-source LLM engineering / observability platforms'),
    'M-SUPERLATIVE-GOVERNANCE': lambda: superlative.run(
        'AI governance platforms', 'declared per artifact', 'declared per artifact',
        GOVERNANCE_OTHERS, GOVERNANCE_PATTERNS),
    'M-SUPERLATIVE-OBSERVABILITY': lambda: superlative.run(
        'AI/LLM observability and evaluation platforms', 'declared per artifact', 'declared per artifact',
        OBSERVABILITY_OTHERS, OBSERVABILITY_PATTERNS),
    'M-PONTES-PARTICIPANTS': pontes_participant_measurement,
    # Open-source harness projects. A licence claim on a project page is settled by the CODE HOST's
    # own record and by the licence file itself, neither of which the claimant writes.
    'M-GARAK-LICENCE': lambda: repo_facts.licence_check('NVIDIA/garak', 'Apache-2.0'),
    'M-GUARDRAILSAI-LICENCE': lambda: repo_facts.licence_check('guardrails-ai/guardrails', 'Apache-2.0'),
    'M-PYRIT-LICENCE': lambda: repo_facts.licence_check('microsoft/PyRIT', 'MIT'),
    'M-PURPLELLAMA-LICENCE': lambda: repo_facts.licence_check('meta-llama/PurpleLlama', 'permissive'),
    'M-INVARIANT-LICENCE': lambda: repo_facts.licence_check('invariantlabs-ai/invariant', 'Apache-2.0'),
    'M-GISKARD-LICENCE': lambda: repo_facts.licence_check('Giskard-AI/giskard-oss', 'Apache-2.0'),
}
for _id, _org, _term, _doms in CORROBORATIONS:
    MEASUREMENTS[_id] = (lambda o=_org, t=_term, d=_doms: corroboration_measurement(o, t, d))


def main() -> int:
    out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[2:])
    for mid, fn in MEASUREMENTS.items():
        if only and mid not in only:
            continue
        dest = out / f'{mid}.json'
        if dest.exists():
            print(f'SKIP {mid} (already written)')
            continue
        try:
            res = fn()
        except Exception:
            res = {'state': 'UNMEASURED', 'reason': 'harness raised',
                   'traceback': traceback.format_exc()[-900:], 'measured_at': c.now_iso()}
        dest.write_text(json.dumps(c.json_roundtrip_stable(res), indent=1, ensure_ascii=False) + '\n',
                        encoding='utf-8')
        print(f"DONE {mid} state={res.get('state')} {str(res.get('result') or res.get('reason'))[:150]}", flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
