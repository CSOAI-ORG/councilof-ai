"""Deterministic public review destinations, never submission or authority."""
import re

FORUM = 'https://github.com/CSOAI-ORG/councilof-ai/discussions'


def review_routes(groups, tracker):
    if tracker.get('schema') != 'csoai.working-group-tracker/1' or tracker.get('forum') != FORUM:
        raise ValueError('Unknown public tracker or forum')
    known = {g['id'] for g in groups}
    seen = set()
    result = []
    for doc in tracker['documents']:
        ident, group, version = doc['id'], doc['groupId'], doc['version']
        if not re.fullmatch(r'COAI-WG-[0-9]{3,6}', ident) or ident in seen:
            raise ValueError('Invalid or duplicate review document')
        if group not in known or not re.fullmatch(r'[a-z][a-z0-9-]{1,80}', group):
            raise ValueError('Unknown review group')
        if type(version) is not int or version < 1:
            raise ValueError('Invalid review document version')
        source = doc['source']
        if not re.fullmatch(r'[a-f0-9]{40}', source['commit']):
            raise ValueError('Review source must pin a commit')
        if not re.fullmatch(r'[a-zA-Z0-9_./-]+', source['path']) or '..' in source['path'] or source['path'].startswith('/'):
            raise ValueError('Invalid public source path')
        seen.add(ident)
        result.append({
            'group_id': group, 'document_id': ident, 'document_version': version,
            'pinned_source_url': 'https://github.com/CSOAI-ORG/councilof-ai/blob/' + source['commit'] + '/' + source['path'],
            'review_email_url': 'https://councilof.ai/contact/?arm=working-group&group=' + group + '&stage=review',
            'forum_url': FORUM,
            'tracker_url': 'https://councilof.ai/working-groups/',
        })
    if {r['group_id'] for r in result} != known:
        raise ValueError('Every forming group needs a review document')
    return result
