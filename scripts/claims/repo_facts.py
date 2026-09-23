#!/usr/bin/env python3
"""Open-source claims measured against the code host's public record, not the claimant's page.

A vendor saying 'we are open source (MIT)' is the claim again if you check it on the vendor's own
marketing page. The one reading that is independent of the claimant is the code host's: GitHub
publishes, keylessly, the licence it detects for a repository and the number of accounts that have
starred it. Neither number is written by the vendor.

Two things are produced here and they are different:

  licence   the SPDX identifier GitHub's own licence detector reports for the named repository.
            This settles a licence claim about THAT repository and nothing else.

  stars     stargazers_count for each repository in a DECLARED comparison set, read in one pass so
            every figure shares an instant. This does NOT settle 'most widely adopted', 'most
            popular' or 'leading'; stars are an account-level signal about a repository page. The
            comparison set is published so a reader who disagrees with it can re-run with theirs.

Keyless: the unauthenticated GitHub REST API. No token, no account. A rate-limited response is
recorded with its status and the repository is dropped from the denominator.
"""
from __future__ import annotations

import json
import sys

try:
    from . import common as c
except ImportError:
    import common as c  # type: ignore

API = 'https://api.github.com/repos/'


#: SPDX identifiers are a constrained token; a category word like "permissive" is not one.
def _is_spdx(v: str) -> bool:
    import re
    return bool(re.fullmatch(r"[A-Za-z0-9.+-]+", str(v))) and str(v) not in (
        "permissive", "open", "free", "copyleft", "proprietary")


def repo(full_name: str) -> dict:
    r, j = c.get_json(API + full_name, timeout=45)
    src = c.source(r, f'GitHub public repository record for {full_name}')
    if not r['ok'] or not isinstance(j, dict):
        return {'repo': full_name, 'reachable': False, 'status': r['status'],
                'reason': r['reason'] or 'unparseable', 'source': src}
    lic = (j.get('license') or {})
    return {
        'repo': full_name,
        'reachable': True,
        'stars': j.get('stargazers_count'),
        'forks': j.get('forks_count'),
        'open_issues': j.get('open_issues_count'),
        'licence_spdx': lic.get('spdx_id'),
        'licence_name': lic.get('name'),
        'archived': j.get('archived'),
        'pushed_at': j.get('pushed_at'),
        'html_url': j.get('html_url'),
        'source': src,
    }


def licence_file(full_name: str) -> dict:
    """The repository's own LICENCE file, as GitHub serves it. The detector is a heuristic; the file
    is the text. Reading both is the difference between a label and the thing labelled."""
    r, j = c.get_json(API + full_name + '/license', timeout=45)
    src = c.source(r, f'the LICENCE file GitHub detects in {full_name}')
    if not r['ok'] or not isinstance(j, dict):
        return {'reachable': False, 'status': r['status'], 'source': src}
    import base64
    body = ''
    try:
        body = base64.b64decode(j.get('content') or '').decode('utf-8', 'replace')
    except Exception:
        body = ''
    head = ' '.join(body.split())[:300]
    return {'reachable': True, 'path': j.get('path'), 'sha': j.get('sha'),
            'first_300_chars': head, 'source': src}


def licence_check(full_name: str, asserted_spdx: str) -> dict:
    r = repo(full_name)
    if not r['reachable']:
        return {'state': 'UNMEASURED', 'reason': f"GitHub's record for {full_name} could not be read "
                f"(status {r['status']}); nothing is concluded", 'repo': r}
    lf = licence_file(full_name)
    got = r['licence_spdx']
    return {
        'state': 'CLAIM_MEASURED',
        'measured_at': c.now_iso(),
        'method': ('read the unauthenticated GitHub REST record for the named repository and take the SPDX '
                   "identifier GitHub's own licence detector reports for it"),
        'window': f"the repository as GitHub served it at {r['source']['accessed_utc']}",
        'denominator': {'repositories_checked': 1},
        # A claim may assert a licence IDENTIFIER ("MIT") or a licence CATEGORY ("licensed
        # permissively"). Comparing a category word with an SPDX identifier is a category error, and
        # a boolean produced by one would say False about a claim it never tested. Where the
        # assertion is not SPDX-shaped, no boolean is emitted and the reason is recorded instead.
        'result': {'repository': full_name,
                   'asserted': asserted_spdx,
                   'assertion_kind': 'spdx-identifier' if _is_spdx(asserted_spdx) else 'licence-category',
                   'spdx_reported_by_github': got,
                   **({'matches_asserted': got == asserted_spdx} if _is_spdx(asserted_spdx) else {
                       'matches_asserted': None,
                       'no_boolean_because': (
                           f'the claim asserts a licence CATEGORY ({asserted_spdx!r}), not an SPDX '
                           'identifier. Whether a licence is "permissive" is a reading of its terms, not '
                           'a string comparison, and this harness does not read terms. The identifier the '
                           'code host reports and the opening text of the licence file are recorded '
                           'instead, so a reader can do that reading themselves')}),
                   'licence_file_path': lf.get('path'),
                   'licence_file_opening_text': lf.get('first_300_chars'),
                   'n': 1},
        'sources': [r['source']] + ([lf['source']] if lf.get('source') else []),
        'does_not_prove': [
            "that every file in the repository carries that licence; GitHub's detector reads the "
            'repository licence file and is a heuristic over it',
            "that a detector result of NOASSERTION or 'Other' indicates the asserted licence is wrong. "
            'GitHub reports that value for any repository whose licensing its heuristic cannot reduce to a '
            'single SPDX identifier, which routinely includes repositories that carry a standard licence '
            'plus a second licence for part of the tree. The licence file text is recorded beside the '
            'detector result for exactly that reason',
            'that the vendor product, the hosted service or any other repository is under that licence',
            'anything about whether the software works, is maintained, or is safe to use',
        ],
    }


def star_comparison(claimant_repo: str, comparison_set: list[str], category: str) -> dict:
    rows = [repo(x) for x in [claimant_repo] + [r for r in comparison_set if r != claimant_repo]]
    read = [r for r in rows if r['reachable'] and isinstance(r.get('stars'), int)]
    unread = [{'repo': r['repo'], 'status': r['status'], 'reason': r['reason']} for r in rows if not r['reachable']]
    if not read or claimant_repo not in [r['repo'] for r in read]:
        return {'state': 'UNMEASURED',
                'reason': "the claimant's own repository could not be read, or no repository in the set "
                          'could be read; a partial read is never totalled as the set',
                'repositories_unreadable': unread}
    ranked = sorted(read, key=lambda r: r['stars'], reverse=True)
    top = ranked[0]
    me = next(r for r in read if r['repo'] == claimant_repo)
    return {
        'state': 'CLAIM_MEASURED',
        'measured_at': c.now_iso(),
        'method': ('declare a comparison set of open-source repositories in the stated category, read '
                   'stargazers_count for every one of them from the unauthenticated GitHub REST API in a '
                   'single pass, and rank them. The set is published in full so a reader who disagrees with '
                   'it can re-run the same method with a different set'),
        'window': 'one instant; every figure in the set was read in the same pass at measured_at',
        'denominator': {'repositories_declared': len(rows), 'repositories_read': len(read),
                        'repositories_not_read': len(unread), 'category_declared': category},
        'result': {
            'claimant_repository': claimant_repo,
            'claimant_stars': str(me['stars']),
            'highest_in_set': top['repo'],
            'highest_stars': str(top['stars']),
            'claimant_rank_in_set': str([r['repo'] for r in ranked].index(claimant_repo) + 1),
            'ranking': [{'repo': r['repo'], 'stars': str(r['stars'])} for r in ranked],
            'n': len(read),
        },
        'repositories_unreadable': unread,
        'sources': [r['source'] for r in rows],
        'does_not_prove': [
            'that the claim is right or wrong. Stars are not adoption, not revenue, not deployments and '
            'not users; they are accounts that clicked a button on a repository page',
            'that the comparison set is the category. The set is this harness\'s declaration and a reader '
            'who names a different set will get a different ranking',
            'that a repository is the product. Several platforms in this category ship a hosted service '
            'whose usage no public repository records',
            'anything about the closed-source platforms in the same category, which have no repository to read',
        ],
    }


if __name__ == '__main__':
    print(json.dumps(repo(sys.argv[1] if len(sys.argv) > 1 else 'langfuse/langfuse'), indent=1))
