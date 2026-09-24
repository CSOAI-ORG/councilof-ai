#!/usr/bin/env python3
"""Hiring platforms (agents hire humans / humans hire agents) — keyless measurements.

One JSON per measurement id, in the same shape measure_growth.py writes, so the one registry
builder (capture-growth.mjs) attaches a result ONLY where a harness here returned
CLAIM_MEASURED. Nothing here decides whether a claim is true.

The rule this lane works to: a claim is measured only against evidence held by someone other
than the party making it — a code host's own record, a package registry's own record, the
official MCP registry, an x402 discovery index, a regulator's filer record. A subject's own page,
its own API response, or its own /.well-known file is the claim again (spec 4.6), and a PRESENT
well-known file is evidence that the file was published, never evidence of what it says.

Evidence states used in the harness outputs (NOT artifact states — the specification has four and
only four, spec 4):
  MEASURED             a third party's own record was read and the value is reported
  SELF_ASSERTED        the only public evidence is the subject's own surface
  SEARCH_INCONCLUSIVE  the third party's record could not be read; the HTTP status is recorded,
                       and it is never read as an absence
  UNMEASURED           no route to a third-party record was attempted or none exists keylessly

    python3 scripts/claims/measure_hiring.py <out-dir> [only-id ...]
"""
from __future__ import annotations

import json
import re
import sys
import time
import traceback
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import common as c  # noqa: E402
import repo_facts  # noqa: E402
from measure_growth import corroboration_measurement  # noqa: E402

MCP_REGISTRY = 'https://registry.modelcontextprotocol.io/v0/servers?search='
NPM_REGISTRY = 'https://registry.npmjs.org/'
NPM_DOWNLOADS = 'https://api.npmjs.org/downloads/point/'
CDP_INDEX = 'https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources'
PAYAI_INDEX = 'https://facilitator.payai.network/discovery/resources'
EDGAR_FTS = 'https://efts.sec.gov/LATEST/search-index?q='
EDGAR_SUBMISSIONS = 'https://data.sec.gov/submissions/CIK{cik}.json'

#: every host this lane maintains, for the x402 index scan
SUBJECT_HOSTS = {
    'rentahuman.ai': 'RentAHuman',
    'invoke.nanocorp.app': 'Invoke',
    'gotohuman.com': 'gotoHuman', 'www.gotohuman.com': 'gotoHuman', 'app.gotohuman.com': 'gotoHuman',
    'paymanai.com': 'Payman', 'app.paymanai.com': 'Payman',
    'instahuman.com': 'InstaHuman', 'api.instahuman.com': 'InstaHuman',
}
#: descriptions an x402 index entry carries when it offers a human-performed task
HUMAN_TASK_PATTERNS = [r'\bhire (?:a )?humans?\b', r'\brent (?:a )?humans?\b', r'\bhuman[- ]task',
                       r'\breal (?:person|human)\b', r'\bhuman worker', r'\bhuman-in-the-loop\b']


def _get_json_retry(url: str, tries: int = 4) -> tuple[dict, object]:
    """The MCP registry intermittently answers 200 with an empty body. That is retried, and if it
    persists it is recorded as what it is — an unparseable 200 — never as zero results."""
    last = None
    for i in range(tries):
        r, j = c.get_json(url, headers={'Accept': 'application/json'})
        if j is not None:
            return r, j
        last = r
        time.sleep(1.5 * (i + 1))
    return last, None


def mcp_registry_entries(term: str, name: str | None = None) -> dict:
    r, j = _get_json_retry(MCP_REGISTRY + urllib.parse.quote(term))
    src = c.source(r, f'official MCP registry search for {term!r}')
    if j is None:
        return {'evidence_state': 'SEARCH_INCONCLUSIVE', 'status': r['status'], 'reason': r['reason'] or
                'empty or unparseable body after retries', 'source': src}
    servers = [s.get('server', s) for s in j.get('servers', [])]
    metas = [(s.get('_meta') or {}).get('io.modelcontextprotocol.registry/official', {}) for s in j.get('servers', [])]
    rows = []
    for sv, m in zip(servers, metas):
        if name and sv.get('name') != name:
            continue
        rows.append({'name': sv.get('name'), 'version': sv.get('version'),
                     'repository_url': (sv.get('repository') or {}).get('url'),
                     'remotes': [x.get('url') for x in sv.get('remotes') or []],
                     'packages': [{'registry': p.get('registryType'), 'identifier': p.get('identifier')}
                                  for p in sv.get('packages') or []],
                     'status': m.get('status'), 'published_at': m.get('publishedAt'), 'is_latest': m.get('isLatest')})
    return {'evidence_state': 'MEASURED', 'term': term, 'name_filter': name,
            'entries_returned_by_search': len(servers), 'entries_matching_name': len(rows),
            'next_cursor': (j.get('metadata') or {}).get('nextCursor'), 'entries': rows, 'source': src}


def npm_facts(pkg: str) -> dict:
    enc = pkg.replace('/', '%2f')
    r, j = c.get_json(NPM_REGISTRY + enc)
    src = c.source(r, f'npm registry document for {pkg}')
    if j is None or not isinstance(j, dict) or 'versions' not in j:
        return {'evidence_state': 'SEARCH_INCONCLUSIVE', 'package': pkg, 'status': r['status'], 'source': src}
    latest = (j.get('dist-tags') or {}).get('latest')
    lv = (j.get('versions') or {}).get(latest, {})
    out = {'evidence_state': 'MEASURED', 'package': pkg, 'latest': latest,
           'versions_published': len(j.get('versions') or {}),
           'first_published_utc': (j.get('time') or {}).get('created'),
           'last_modified_utc': (j.get('time') or {}).get('modified'),
           'manifest_licence_field': lv.get('license'),
           'manifest_repository_field': (lv.get('repository') or {}).get('url') if isinstance(lv.get('repository'), dict) else lv.get('repository'),
           'deprecated_latest': lv.get('deprecated'),
           'source': src,
           'note': 'maintainer names and e-mail addresses in the registry document are personal data and are not carried here'}
    dls = {}
    srcs = []
    for window in ('last-week', 'last-month'):
        r2, j2 = c.get_json(NPM_DOWNLOADS + window + '/' + pkg)
        srcs.append(c.source(r2, f'npm downloads {window} for {pkg}'))
        if isinstance(j2, dict) and 'downloads' in j2:
            dls[window] = {'downloads': j2['downloads'], 'start': j2.get('start'), 'end': j2.get('end')}
        else:
            dls[window] = {'evidence_state': 'SEARCH_INCONCLUSIVE', 'status': r2['status']}
    out['downloads'] = dls
    out['download_sources'] = srcs
    return out


def github_readability(url: str | None) -> dict | None:
    if not url:
        return None
    m = re.match(r'https?://github\.com/([^/]+/[^/#?]+?)(?:\.git)?/?$', url.strip())
    if not m:
        return {'declared_url': url, 'evidence_state': 'UNMEASURED', 'reason': 'not a github.com repository URL'}
    r = repo_facts.repo(m.group(1))
    if not r['reachable']:
        return {'declared_url': url, 'repository': m.group(1), 'evidence_state': 'SEARCH_INCONCLUSIVE',
                'status': r['status'], 'source': r['source'],
                'meaning': ('the code host did not serve this repository to an unauthenticated reader. The '
                            'GitHub API answers 404 both for a repository that does not exist and for one that '
                            'is private, so this is recorded with its status and read as neither')}
    return {'declared_url': url, 'repository': m.group(1), 'evidence_state': 'MEASURED',
            'stars': r['stars'], 'forks': r['forks'], 'licence_spdx_reported_by_github': r['licence_spdx'],
            'archived': r['archived'], 'pushed_at': r['pushed_at'], 'source': r['source']}


def mcp_publication(label: str, term: str, name: str | None, npm_pkg: str | None,
                    extra_repos: list[str] | None = None) -> dict:
    reg = mcp_registry_entries(term, name)
    npm = npm_facts(npm_pkg) if npm_pkg else None
    declared = sorted({e['repository_url'] for e in reg.get('entries', []) if e.get('repository_url')}
                      | set(extra_repos or []))
    repos = [github_readability(u) for u in declared]
    sources = [reg['source']] + ([npm['source']] + npm.get('download_sources', []) if npm else []) + \
              [x['source'] for x in repos if x and x.get('source')]
    if reg['evidence_state'] != 'MEASURED' or (npm and npm['evidence_state'] != 'MEASURED'):
        return {'state': 'UNMEASURED', 'evidence_state': 'SEARCH_INCONCLUSIVE',
                'reason': 'the MCP registry or the npm registry could not be read in this run; nothing is concluded',
                'measured_at': c.now_iso(), 'registry': reg, 'npm': npm, 'repositories': repos, 'sources': sources}
    latest = [e for e in reg['entries'] if e.get('is_latest')]
    result = {
        'subject': label,
        'mcp_registry_search_term': term,
        'mcp_registry_entries_matching': str(reg['entries_matching_name'] if name else reg['entries_returned_by_search']),
        'mcp_registry_latest_version': latest[0]['version'] if latest else None,
        'mcp_registry_latest_published_utc': latest[0]['published_at'] if latest else None,
        'mcp_registry_declared_repositories': declared,
        'declared_repositories_readable_by_unauthenticated_reader': str(sum(1 for x in repos if x and x.get('evidence_state') == 'MEASURED')),
        'declared_repositories_not_served': str(sum(1 for x in repos if x and x.get('evidence_state') == 'SEARCH_INCONCLUSIVE')),
        'n': 1,
    }
    if npm:
        result.update({
            'npm_package': npm['package'], 'npm_latest': npm['latest'],
            'npm_versions_published': str(npm['versions_published']),
            'npm_first_published_utc': npm['first_published_utc'],
            'npm_downloads_last_month': str(npm['downloads'].get('last-month', {}).get('downloads')),
            'npm_downloads_last_month_window': [npm['downloads'].get('last-month', {}).get('start'),
                                                npm['downloads'].get('last-month', {}).get('end')],
        })
    return {
        'state': 'CLAIM_MEASURED', 'evidence_state': 'MEASURED', 'measured_at': c.now_iso(),
        'method': ('read the official MCP registry search API for the term (keyless), filter to the named server '
                   'where one is given, and record every version entry and the repository URL it declares; read '
                   'the npm registry document and the npm downloads API for the package the entry names; read the '
                   'unauthenticated GitHub REST record for every declared repository. Each of those records is held '
                   'by the registry or code host, not by the subject'),
        'window': 'the registries as served at measured_at; npm downloads over the window npm states in the result',
        'denominator': {'registries_read': 2 if npm else 1, 'declared_repositories': len(declared)},
        'result': result,
        'registry': reg, 'npm': npm, 'repositories': repos, 'sources': sources,
        'does_not_prove': [
            'that the MCP server works, is safe, or does what the subject says it does. A registry entry records '
            'that a publisher who controls the namespace submitted metadata; the registry does not test the server',
            'that any agent has hired any human through this server. npm download counts include CI systems, '
            'mirrors and caches and are not users, installs or transactions',
            'that a repository which was not served to an unauthenticated reader does not exist; the code host '
            'answers the same way for a private repository',
            'anything about the number of workers, tasks or payments on the platform',
        ],
    }


def _enumerate(base: str, limit: int, max_pages: int = 400) -> tuple[list, dict]:
    items, offset, total, pages, failures = [], 0, None, 0, []
    while pages < max_pages:
        r, j = c.get_json(f'{base}?limit={limit}&offset={offset}', headers={'Accept': 'application/json'})
        pages += 1
        if j is None:
            failures.append({'offset': offset, 'status': r['status'], 'reason': r['reason']})
            if len(failures) > 3:
                break
            time.sleep(2)
            continue
        page = j.get('items') or []
        total = (j.get('pagination') or {}).get('total', total)
        items.extend(page)
        if not page or (total is not None and offset + len(page) >= total):
            break
        offset += len(page)
    complete = total is not None and len(items) >= total
    return items, {'index': base, 'resources_read': len(items), 'reported_total': total, 'complete': complete,
                   'pages': pages, 'page_failures': failures, 'read_utc': c.now_iso()}


_INDEX_CACHE: dict = {}


def x402_indexes() -> dict:
    if not _INDEX_CACHE:
        cdp, cdp_meta = _enumerate(CDP_INDEX, 100)
        payai, payai_meta = _enumerate(PAYAI_INDEX, 1000)
        _INDEX_CACHE.update({'cdp': (cdp, cdp_meta), 'payai': (payai, payai_meta)})
    return _INDEX_CACHE


def _host(u: str) -> str:
    try:
        return urllib.parse.urlparse(u).hostname or ''
    except Exception:
        return ''


def x402_listing(label: str, hosts: list[str]) -> dict:
    idx = x402_indexes()
    per_index = {}
    for name, (items, meta) in idx.items():
        hits = []
        for it in items:
            res = it.get('resource') or it.get('url') or ''
            if _host(res) in hosts:
                acc = it.get('accepts') or []
                hits.append({'resource': res,
                             'networks': sorted({a.get('network') for a in acc if a.get('network')}),
                             'assets': sorted({a.get('asset') for a in acc if a.get('asset')}),
                             'last_updated': it.get('lastUpdated')})
        per_index[name] = {'meta': meta, 'resources_on_subject_hosts': hits}
    complete = all(v['meta']['complete'] for v in per_index.values())
    reached = [k for k, v in per_index.items() if v['meta']['resources_read'] > 0]
    if not reached:
        return {'state': 'UNMEASURED', 'evidence_state': 'SEARCH_INCONCLUSIVE',
                'reason': 'neither x402 discovery index could be read from this host in this run',
                'per_index': {k: v['meta'] for k, v in per_index.items()}}
    listed = sum(len(v['resources_on_subject_hosts']) for v in per_index.values())
    return {
        'state': 'CLAIM_MEASURED', 'evidence_state': 'MEASURED', 'measured_at': c.now_iso(),
        'method': ('enumerate every page of the two public, keyless x402 discovery indexes (Coinbase CDP Bazaar at '
                   'limit=100 per page, PayAI at limit=1000 per page) to the total each index reports, and select '
                   'the resources whose URL host is one of the subject\'s declared hosts. Each index is held by its '
                   'facilitator, not by the subject'),
        'window': 'each index as served during this run; the read instants are in denominator',
        'denominator': {k: {'resources_read': str(v['meta']['resources_read']),
                            'reported_total': str(v['meta']['reported_total']),
                            'complete': v['meta']['complete'], 'read_utc': v['meta']['read_utc']}
                        for k, v in per_index.items()},
        'result': {'subject': label, 'hosts_searched': hosts,
                   'resources_listed_on_subject_hosts': str(listed),
                   'status': 'LISTED' if listed else 'NOT_FOUND_IN_INDEXES',
                   'indexes_read_completely': complete,
                   'per_index': {k: v['resources_on_subject_hosts'] for k, v in per_index.items()},
                   'n': len(reached)},
        'sources': [{'url': v['meta']['index'], 'status': 200, 'accessed_utc': v['meta']['read_utc'],
                     'note': f"{v['meta']['pages']} page(s), {v['meta']['resources_read']} resource(s) of a reported "
                             f"{v['meta']['reported_total']}; page digests are in the lane evidence index"}
                    for v in per_index.values()],
        'does_not_prove': [
            'that the subject does or does not accept x402 payments. A discovery index lists a resource after it has '
            'been registered with, or settled through, that facilitator with discovery metadata; a working x402 '
            'endpoint that settles elsewhere or omits the metadata is not listed',
            'NOT_FOUND_IN_INDEXES is a fact about two indexes at one time, not an absence of the rail and not a '
            'finding that any statement is false',
            'that a listed resource settles, delivers, or is safe to pay. A listing is not a settlement',
        ] + ([] if complete else ['one or both indexes was read only in part; the unread remainder is unmeasured and '
                                   'is not counted as NOT_FOUND']),
    }


def x402_human_task_population() -> dict:
    """Context, not a claim measurement: how many x402-indexed resources describe a human-performed
    task, and on which hosts. Reported so the lane's subject selection can be compared with the index."""
    idx = x402_indexes()
    pats = [re.compile(p, re.I) for p in HUMAN_TASK_PATTERNS]
    hosts: dict = {}
    for name, (items, meta) in idx.items():
        for it in items:
            desc = ' '.join(str(it.get(k) or '') for k in ('description',)) + ' ' + ' '.join(
                str(a.get('description') or '') for a in it.get('accepts') or [])
            if any(p.search(desc) for p in pats):
                h = _host(it.get('resource') or '')
                row = hosts.setdefault(h, {'host': h, 'indexes': set(), 'resources': 0, 'example_description': desc.strip()[:200]})
                row['indexes'].add(name)
                row['resources'] += 1
    rows = sorted(({**v, 'indexes': sorted(v['indexes'])} for v in hosts.values()), key=lambda r: -r['resources'])
    return {'record_kind': 'CONTEXT_NOT_A_CLAIM_MEASUREMENT', 'evidence_state': 'MEASURED', 'measured_at': c.now_iso(),
            'patterns': HUMAN_TASK_PATTERNS,
            'index_meta': {k: v[1] for k, v in idx.items()},
            'hosts_with_matching_descriptions': rows,
            'note': ('a description match is a statement by each resource\'s publisher about its own resource. It '
                     'selects rows for reading; it does not establish that a human performs anything')}


def edgar_entity(label: str, entity_name: str, cik: str | None) -> dict:
    q = urllib.parse.quote(f'"{entity_name}"')
    r, j = c.get_json(EDGAR_FTS + q)
    fts_src = c.source(r, f'SEC EDGAR full-text search for "{entity_name}"')
    fts = None
    if isinstance(j, dict) and 'hits' in j:
        hits = j['hits'].get('hits', [])
        fts = {'total': j['hits'].get('total', {}).get('value'),
               'filers': sorted({n for h in hits for n in (h.get('_source', {}).get('display_names') or [])}),
               'forms': sorted({h.get('_source', {}).get('form') for h in hits if h.get('_source', {}).get('form')})}
    if not cik:
        return {'state': 'UNMEASURED', 'evidence_state': 'SEARCH_INCONCLUSIVE' if fts is None else 'UNMEASURED',
                'reason': ('EDGAR is a register of SEC filings, not of incorporations. A full-text search that finds '
                           'no filing under this name says nothing about whether the entity exists, because most '
                           'private companies never file with the SEC. The incorporation registers that could settle '
                           'the claim answer only through an interactive search form, which this harness does not '
                           'submit; so this run reached no measurement'),
                'edgar_full_text': fts, 'measured_at': c.now_iso(), 'sources': [fts_src]}
    r2, sub = c.get_json(EDGAR_SUBMISSIONS.format(cik=cik.zfill(10)))
    sub_src = c.source(r2, f'SEC EDGAR submissions record for CIK {cik}')
    if not isinstance(sub, dict) or 'name' not in sub:
        return {'state': 'UNMEASURED', 'evidence_state': 'SEARCH_INCONCLUSIVE',
                'reason': f'the SEC submissions record could not be read (status {r2["status"]})',
                'edgar_full_text': fts, 'sources': [fts_src, sub_src]}
    rec = sub.get('filings', {}).get('recent', {})
    filings = [{'form': f, 'filing_date': d} for f, d in zip(rec.get('form', []), rec.get('filingDate', []))]
    return {
        'state': 'CLAIM_MEASURED', 'evidence_state': 'MEASURED', 'measured_at': c.now_iso(),
        'method': ('read the SEC\'s own EDGAR submissions record for the CIK that EDGAR full-text search returns for '
                   'the exact entity name the subject publishes, and compare the registered name byte for byte'),
        'window': 'the EDGAR record as served at measured_at',
        'denominator': {'registers_read': 1},
        'result': {'subject': label, 'entity_name_published_by_subject': entity_name,
                   'edgar_registered_name': sub.get('name'), 'cik': sub.get('cik'),
                   'name_matches_exactly': sub.get('name') == entity_name,
                   'state_of_incorporation_on_record': sub.get('stateOfIncorporation'),
                   'filings_on_record': filings, 'n': 1},
        'edgar_full_text': fts,
        'sources': [fts_src, sub_src],
        'personal_data_note': ('the EDGAR record also carries a street address and a telephone number. They are not '
                               'carried here: this lane records no data that could identify a person'),
        'does_not_prove': [
            'anything the filings say. A Form D is completed by the issuer; the SEC records that it was filed and '
            'does not review its contents. Only the existence of the filer record and its registered name are '
            'measured here',
            'that the entity currently operates the website, or is in good standing in its state of incorporation',
            'anything about the product, its safety, or its users',
        ],
    }


def entity_register_unreached(label: str, entity_name: str, register: str) -> dict:
    """Records the route tried to a public company register and what it answered. The routes that
    need a key are dropped, and a form-only register is not submitted, per the lane rules."""
    q = urllib.parse.quote(entity_name)
    r = c.get(f'https://opencorporates.com/companies?q={q}')
    body = c.visible_text(r['body'])[:120] if r['body'] else ''
    r2 = c.get(f'https://api.opencorporates.com/v0.4/companies/search?q={q}', headers={'Accept': 'application/json'})
    return {'state': 'UNMEASURED', 'evidence_state': 'SEARCH_INCONCLUSIVE',
            'reason': (f'{register} answers only through an interactive search form, which this harness does not '
                       'submit. The keyless aggregator route was tried: its web search served a body reading '
                       f'{body!r} (HTTP {r["status"]}), and its API answered HTTP {r2["status"]} because it requires '
                       'a token, so it was dropped rather than worked around. Nothing is concluded about the entity'),
            'measured_at': c.now_iso(),
            'sources': [c.source(r, 'OpenCorporates web search (keyless)'),
                        c.source(r2, 'OpenCorporates API search (requires a token; dropped)')]}


def wayback_history(label: str, url: str, patterns: dict[str, str], max_snapshots: int = 80) -> dict:
    """Context, not a claim measurement: what the Internet Archive's own copies of a page carried
    over time. The archive's copies are the subject's words again (spec 4.6); they date a statement,
    they never settle it."""
    cdx = ('https://web.archive.org/cdx/search/cdx?url=' + urllib.parse.quote(url, safe='')
           + '&output=json&fl=timestamp,statuscode,digest&filter=statuscode:200&collapse=digest&limit=1000')
    r, j = c.get_json(cdx)
    cdx_src = c.source(r, f'Internet Archive CDX index for {url}')
    if not isinstance(j, list) or len(j) < 2:
        return {'record_kind': 'CONTEXT_NOT_A_CLAIM_MEASUREMENT', 'evidence_state': 'SEARCH_INCONCLUSIVE', 'source': cdx_src,
                'reason': f'CDX index could not be read (status {r["status"]})'}
    stamps = [row[0] for row in j[1:]]
    if len(stamps) > max_snapshots:
        step = len(stamps) / max_snapshots
        stamps = [stamps[int(i * step)] for i in range(max_snapshots)]
    rows = []
    import gzip
    for ts in stamps:
        snap = f'https://web.archive.org/web/{ts}id_/{url}'
        rr = c.get(snap, timeout=60, retries=1)
        body = rr['body'] or b''
        if body[:2] == b'\x1f\x8b':
            try:
                body = gzip.decompress(body)
            except Exception:
                pass
        text = c.visible_text(body) if rr['ok'] else ''
        found = {}
        for k, p in patterns.items():
            m = re.search(p, text)
            found[k] = m.group(0) if m else None
        title = re.search(rb'(?is)<title[^>]*>(.*?)</title>', body)
        rows.append({'timestamp': ts, 'snapshot_url': snap, 'status': rr['status'],
                     'response_sha256': rr['sha256'], 'visible_text_chars': len(text),
                     'title': title.group(1).decode('utf-8', 'replace').strip()[:160] if title else None,
                     'matched': found})
        time.sleep(0.6)
    read = [x for x in rows if x['status'] == 200]
    return {'record_kind': 'CONTEXT_NOT_A_CLAIM_MEASUREMENT', 'evidence_state': 'MEASURED', 'measured_at': c.now_iso(),
            'subject': label, 'url': url, 'patterns': patterns,
            'distinct_captures_in_index': len(j) - 1, 'snapshots_requested': len(rows), 'snapshots_read': len(read),
            'snapshots': rows, 'source': cdx_src,
            'does_not_prove': ['that any archived statement was true or false when it was made',
                               'why a page changed. A page may change for any reason',
                               'that the archive holds every version; captures are the archive\'s sample']}


WELL_KNOWN_PATHS = ['/.well-known/agent-card.json', '/.well-known/agent.json', '/.well-known/mcp.json',
                    '/.well-known/mcp/server-card.json', '/.well-known/x402.json', '/llms.txt']
WELL_KNOWN_HOSTS = ['rentahuman.ai', 'www.gotohuman.com', 'paymanai.com', 'invoke.nanocorp.app', 'instahuman.com']


def well_known_presence() -> dict:
    """Context, not a claim measurement: which discovery files each subject serves. PRESENT means
    the host served a parseable file at that path; it is evidence the file was published and
    nothing about what it says. A 404 on a conventional path proves nothing either: the path is a
    convention this reader chose, not one the subject declared."""
    rows = []
    for h in WELL_KNOWN_HOSTS:
        for p in WELL_KNOWN_PATHS:
            r = c.get(f'https://{h}{p}', headers={'Accept': 'application/json, text/plain;q=0.9, */*;q=0.1'}, retries=1)
            body = r['body'] or b''
            kind = 'ABSENT_AT_THIS_PATH'
            if r['ok']:
                if p.endswith('.json'):
                    try:
                        json.loads(body.decode('utf-8'))
                        kind = 'PRESENT_JSON'
                    except Exception:
                        kind = 'SERVED_BUT_NOT_JSON'
                else:
                    kind = 'PRESENT_TEXT' if not body.lstrip()[:1] == b'<' else 'SERVED_HTML'
            elif r['status'] is None or r['status'] >= 500 or r['status'] in (401, 403, 429):
                kind = 'SEARCH_INCONCLUSIVE'
            rows.append({**c.source(r, f'{h}{p}'), 'presence': kind})
    return {'record_kind': 'CONTEXT_NOT_A_CLAIM_MEASUREMENT', 'evidence_state': 'MEASURED', 'measured_at': c.now_iso(),
            'paths': WELL_KNOWN_PATHS, 'hosts': WELL_KNOWN_HOSTS, 'rows': rows,
            'does_not_prove': ['that a file which is PRESENT is accurate; its content is the subject speaking',
                               'that a subject lacks a capability because it serves no file at a conventional path']}


MEASUREMENTS = {
    'CTX-WELL-KNOWN': well_known_presence,
    'M-HP-MCP-RENTAHUMAN': lambda: mcp_publication('RentAHuman', 'rentahuman', 'io.github.rentahuman-ai/rentahuman',
                                                   'rentahuman-mcp'),
    'M-HP-MCP-GOTOHUMAN': lambda: mcp_publication('gotoHuman', 'gotohuman', None, '@gotohuman/mcp-server',
                                                  ['https://github.com/gotohuman/gotohuman-mcp-server']),
    'M-HP-MCP-INVOKE': lambda: mcp_publication('Invoke', 'nanocorp', 'app.nanocorp.invoke/human-tasks', None),
    'M-HP-X402-RENTAHUMAN': lambda: x402_listing('RentAHuman', ['rentahuman.ai', 'www.rentahuman.ai', 'api.rentahuman.ai']),
    'M-HP-X402-INSTAHUMAN': lambda: x402_listing('InstaHuman', ['instahuman.com', 'www.instahuman.com', 'api.instahuman.com']),
    'M-HP-LICENCE-RENTAHUMAN': lambda: repo_facts.licence_check('rentahuman-ai/human-rental-marketplace', 'MIT'),
    'M-HP-LICENCE-GOTOHUMAN': lambda: repo_facts.licence_check('gotohuman/gotohuman-mcp-server', 'MIT'),
    'M-CORR-PAYFACTO-GOTOHUMAN': lambda: corroboration_measurement('PayFacto', 'gotoHuman', ['payfacto.com']),
    'M-HP-ENTITY-RAWLABS': lambda: edgar_entity('RentAHuman', 'RawLabs, Inc.', None),
    'M-HP-ENTITY-PAYMAN': lambda: edgar_entity('Payman', 'Payman AI, Inc.', '2025647'),
    'M-HP-ENTITY-GOTOHUMAN': lambda: entity_register_unreached('gotoHuman', 'gotoHuman',
                                                               'The German commercial register (Handelsregister)'),
    # Context outputs. Not referenced by any claim, never attached to an artifact.
    'CTX-X402-HUMAN-TASKS': x402_human_task_population,
    'CTX-WAYBACK-PAYMAN': lambda: wayback_history('Payman', 'https://paymanai.com/', {
        'ai_pays_humans': r'AI [Tt]hat [Pp]ays [Hh]umans',
        'first_ai_to_human': r'first AI to Human platform[^.]*\.',
        'beta_signups': r'Over [0-9,]+\+? signed up for the beta',
        'agents_move_money': r'AI [Aa]gents to (?:safely )?move (?:real )?money',
        'banking': r'[Bb]anking|[Bb]anks|[Ff]inancial [Ii]nstitutions',
        'soc2': r'SOC 2[^.]{0,20}',
    }),
    'CTX-WAYBACK-RENTAHUMAN': lambda: wayback_history('RentAHuman', 'https://rentahuman.ai/', {
        'registered_humans': r'[0-9][0-9,]*\+? registered humans(?: across [0-9]+\+? countries)?',
        'rentable_humans_counter': r'[0-9][0-9,]* Rentable humans',
    }),
}


def evidence_index(mdir: Path, registry: Path) -> dict:
    """Every evidence byte this lane read, with its digest and access instant, in one list: each
    source record the harness wrote, and each page the registry builder hashed."""
    rows = []

    def walk(o, origin):
        if isinstance(o, dict):
            if 'url' in o and 'accessed_utc' in o and ('response_sha256' in o or 'status' in o):
                rows.append({'origin': origin, **{k: o.get(k) for k in
                             ('url', 'final_url', 'status', 'accessed_utc', 'response_bytes', 'response_sha256', 'reason', 'note')
                             if o.get(k) is not None}})
            elif 'snapshot_url' in o and 'response_sha256' in o:
                rows.append({'origin': origin, 'url': o['snapshot_url'], 'status': o.get('status'),
                             'response_sha256': o['response_sha256']})
            for v in o.values():
                walk(v, origin)
        elif isinstance(o, list):
            for v in o:
                walk(v, origin)
    for p in sorted(mdir.glob('*.json')):
        walk(json.loads(p.read_text(encoding='utf-8')), p.stem)
    reg = json.loads(registry.read_text(encoding='utf-8'))
    for a in reg.get('claims', []):
        rows.append({'origin': 'registry:' + a['claim_id'], 'url': a['source_url'], 'accessed_utc': a['access_date'],
                     'content_sha256': a['source_content_hash']['value'],
                     'content_sha256_covers': a['source_content_hash']['covers']})
    for n in reg.get('not_captured', []):
        rows.append({'origin': 'registry:not_captured:' + n['claim_id'], 'url': n['url'],
                     'status': n.get('http_status'), 'reason': n.get('transport_reason') or n.get('recorded_as')})
    seen, uniq = set(), []
    for r in rows:
        k = json.dumps(r, sort_keys=True)
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    return {'generated_utc': c.now_iso(), 'registry': registry.name,
            'registry_digest': reg.get('registry_digest'), 'rows': uniq,
            'note': ('response_sha256 covers the raw response body; content_sha256 covers what the registry says it '
                     'covers. A row without a digest is a transport failure and carries its reason. No body is '
                     'republished here, only its digest')}


def main() -> int:
    if sys.argv[1] == '--index':
        idx = evidence_index(Path(sys.argv[2]), Path(sys.argv[3]))
        Path(sys.argv[4]).write_text(json.dumps(c.json_roundtrip_stable(idx), indent=1, ensure_ascii=False) + '\n',
                                     encoding='utf-8')
        print(f"wrote {sys.argv[4]} rows={len(idx['rows'])}")
        return 0
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
        print(f"DONE {mid} state={res.get('state')} {str(res.get('result') or res.get('reason'))[:160]}", flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
