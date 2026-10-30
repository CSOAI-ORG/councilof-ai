"""Read-only charter federation. External references never grant authority."""
import hashlib
import json
import re
from pathlib import Path
from participation import review_routes


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def validate(data):
    if data.get('schema') != 'council.charter-federation/0.1':
        raise ValueError('Unsupported register schema')
    if data.get('grants_authority') is not False:
        raise ValueError('A register cannot grant authority')
    if data.get('review_routes') != review_routes(data['groups'], data['working_group_tracker']):
        raise ValueError('Review routes do not match the canonical group documents')
    for kind in ('sources', 'provisions', 'groups'):
        ids = [r['id'] for r in data[kind]]
        if len(ids) != len(set(ids)):
            raise ValueError('Duplicate ' + kind + ' identifier')
    expected = data['frozen_corpus']['root']
    # Match the existing producer: sort identifiers before concatenating hashes.
    observed = hashlib.sha256(''.join(r['id'] + r['sha256'] for r in sorted(data['provisions'], key=lambda r: r['id'])).encode()).hexdigest()
    if observed != expected:
        raise ValueError('Frozen corpus root mismatch')
    if len(data['provisions']) != data['frozen_corpus']['count']:
        raise ValueError('Frozen corpus count mismatch')
    known_articles = {a['article'] for a in data['articles']}
    known_groups = {g['id'] for g in data['groups']}
    for source in data['sources']:
        if source['kind'] not in {'law', 'framework', 'governance', 'software', 'metadata', 'participation'}:
            raise ValueError('Unknown source kind')
        if not source['url'].startswith('https://'):
            raise ValueError('Source must use HTTPS')
        if source['adoption'] != 'REFERENCE_ONLY' or source['applicability'] != 'HUMAN_REVIEW_REQUIRED':
            raise ValueError('External source cannot be silently adopted')
        if not set(source['candidate_articles']) <= known_articles:
            raise ValueError('Unknown charter article')
        if not set(source['groups']) <= known_groups:
            raise ValueError('Unknown working group')
    for p in data['provisions']:
        if p['source_bytes'] != 'UNRESOLVED' or p['legal_applicability'] != 'NOT_DETERMINED':
            raise ValueError('This snapshot has no recovered legal-text evidence')
    return data


def load_register(path):
    envelope = json.loads(Path(path).read_text())
    if digest(envelope['register']) != envelope['sha256']:
        raise ValueError('Register content digest mismatch')
    return validate(envelope['register'])


def search(data, query='', limit=20):
    if not isinstance(query, str) or len(query) > 200:
        raise ValueError('Query must be text of at most 200 characters')
    if type(limit) is not int or not 1 <= limit <= 50:
        raise ValueError('Limit must be an integer from 1 to 50')
    q = query.casefold().strip()
    rows = [s for s in data['sources'] if q in canonical(s).casefold()]
    return {'matches': rows[:limit], 'total': len(rows), 'grants_authority': False}


def provision(data, identifier):
    if not isinstance(identifier, str) or not re.fullmatch(r'[0-9A-Z]+:-?[0-9]+', identifier):
        raise ValueError('Use an exact frozen provision identifier')
    row = next((p for p in data['provisions'] if p['id'] == identifier), None)
    if row is None:
        raise ValueError('Provision is outside the inventoried corpus')
    return row


def propose(data, source_id, expected_register_sha256, rationale):
    if expected_register_sha256 != digest(data):
        raise ValueError('Register changed; review the current revision before proposing')
    if not isinstance(rationale, str) or not 20 <= len(rationale.strip()) <= 2000:
        raise ValueError('Explain the proposed change in 20 to 2000 characters')
    source = next((s for s in data['sources'] if s['id'] == source_id), None)
    if source is None:
        raise ValueError('Unknown source')
    body = {'schema': 'council.charter-change-proposal/0.1', 'source_id': source_id,
            'source_url': source['url'], 'register_sha256': digest(data),
            'charter_sha256': data['charter_sha256'], 'rationale': rationale.strip(),
            'candidate_articles': source['candidate_articles'], 'state': 'DRAFT_NOT_SUBMITTED',
            'tracker_sha256': data['inputs']['tracker']['sha256'],
            'review_routes': [r for r in data['review_routes'] if r['group_id'] in source['groups']],
            'required_reviews': ['source_and_licence', 'scope_and_applicability', 'conflicts_and_affected_people', 'authorized_human_adoption'],
            'human_approval': False, 'may_execute': False, 'changes_live_policy': False}
    return {'proposal': body, 'sha256': digest(body)}


TOOLS = [
    {'name': 'charter_sources', 'description': 'Search reference sources and infrastructure candidates; no authority or compliance determination.',
     'inputSchema': {'type': 'object', 'properties': {'query': {'type': 'string', 'maxLength': 200}, 'limit': {'type': 'integer', 'minimum': 1, 'maximum': 50}}, 'additionalProperties': False}},
    {'name': 'charter_provision', 'description': 'Read one frozen identifier, hash, coverage and unresolved-source limitation.',
     'inputSchema': {'type': 'object', 'properties': {'id': {'type': 'string'}}, 'required': ['id'], 'additionalProperties': False}},
    {'name': 'charter_prepare_change', 'description': 'Return a revision-bound draft only. Does not submit, sign, approve, publish or execute.',
     'inputSchema': {'type': 'object', 'properties': {'source_id': {'type': 'string'}, 'expected_register_sha256': {'type': 'string'}, 'rationale': {'type': 'string', 'minLength': 20, 'maxLength': 2000}},
                     'required': ['source_id', 'expected_register_sha256', 'rationale'], 'additionalProperties': False}}
]
for tool in TOOLS:
    tool['annotations'] = {'readOnlyHint': True, 'destructiveHint': False, 'idempotentHint': True, 'openWorldHint': False}


def call_tool(data, name, arguments):
    if not isinstance(arguments, dict):
        raise ValueError('Arguments must be an object')
    tool = next((t for t in TOOLS if t['name'] == name), None)
    if tool is None:
        raise ValueError('Unknown tool')
    schema = tool['inputSchema']
    if set(arguments) - set(schema['properties']) or set(schema.get('required', [])) - set(arguments):
        raise ValueError('Missing or unsupported arguments')
    if name == 'charter_sources':
        return search(data, arguments.get('query', ''), arguments.get('limit', 20))
    if name == 'charter_provision':
        return provision(data, arguments['id'])
    return propose(data, **arguments)
