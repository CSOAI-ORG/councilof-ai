#!/usr/bin/env python3
"""CSOAI claim-maintenance plugin: offline, source-preserving review projections.

Standard library only. No network, inference, token/signature generation, publishing,
code execution or production changes. This is an integration candidate, NOT an
identity provider, cryptographic verifier, policy enforcement point or certification.
Operator-curated contracts/trust contexts must come from an authenticated host,
never from retrieved documents. Local hashes are integrity identifiers, not proof
of authorship, timestamp, truth or append-only persistence.
"""
from __future__ import annotations
import argparse
import copy
import datetime as dt
import hashlib
import html
import json
import re
from collections import deque
from pathlib import Path
from typing import Any, Iterable, Mapping

VERSION = '0.1.0'
MAX_BYTES = 2 * 1024 * 1024
HEX = re.compile(r'^[0-9a-f]{64}$')
UTC = dt.timezone.utc

class ContractError(ValueError):
    pass

def digest(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()

def timestamp(value: str) -> dt.datetime:
    if not isinstance(value, str):
        raise ContractError('TIMESTAMP_STRING_REQUIRED')
    try:
        out = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as exc:
        raise ContractError('TIMESTAMP_INVALID') from exc
    if out.tzinfo is None:
        raise ContractError('TIMEZONE_REQUIRED')
    return out.astimezone(UTC)

def _pairs(pairs: list[tuple[str, Any]]) -> dict:
    out = {}
    for key, value in pairs:
        if key in out:
            raise ContractError('DUPLICATE_JSON_KEY')
        out[key] = value
    return out

def _bad_constant(value: str) -> None:
    raise ContractError('NONFINITE_JSON_NUMBER')

def load_json(body: bytes) -> Any:
    if len(body) > MAX_BYTES:
        raise ContractError('JSON_SIZE_LIMIT')
    try:
        return json.loads(body.decode('utf-8'), object_pairs_hook=_pairs,
                          parse_constant=_bad_constant)
    except (UnicodeError, json.JSONDecodeError, RecursionError) as exc:
        raise ContractError('INVALID_JSON') from exc

def canonical(value: Any) -> bytes:
    """Restricted deterministic encoding. NOT an implementation of RFC 8785.

    Numeric measurements must be decimal strings in the core's own records.
    Integers outside IEEE-754 safe range are refused; identifiers must be strings.
    Original incoming bytes are retained by the caller and never re-canonicalized
    to verify an upstream signature.
    """
    def check(v: Any, depth: int = 0) -> None:
        if depth > 40:
            raise ContractError('JSON_DEPTH_LIMIT')
        if v is None or isinstance(v, (str, bool)):
            return
        if type(v) is int:
            if abs(v) > 9007199254740991:
                raise ContractError('LARGE_INTEGER_USE_STRING')
            return
        if isinstance(v, list):
            for item in v: check(item, depth + 1)
            return
        if isinstance(v, dict) and all(isinstance(k, str) for k in v):
            for item in v.values(): check(item, depth + 1)
            return
        raise ContractError('UNSUPPORTED_VALUE_USE_DECIMAL_STRING')
    check(value)
    raw = json.dumps(value, sort_keys=True, separators=(',', ':'),
                     ensure_ascii=True, allow_nan=False).encode('utf-8')
    if len(raw) > MAX_BYTES:
        raise ContractError('JSON_SIZE_LIMIT')
    return raw

def require_digest(value: str) -> None:
    if not isinstance(value, str) or not HEX.fullmatch(value):
        raise ContractError('SHA256_REQUIRED')

def read_state(expected: str, body: bytes | None) -> str:
    require_digest(expected)
    if body is None: return 'UNAVAILABLE'
    return 'MATCHED_BYTES' if digest(body) == expected else 'INTEGRITY_FAILURE'

class ClaimGraph:
    """Bounded immutable-by-API graph; no implied independent or global truth."""
    RELATIONS = {'cites', 'derived_from', 'revision_of', 'correction_candidate',
                 'interprets', 'tested_by', 'rendered_on', 'same_observation'}
    PROPAGATES = {'derived_from', 'interprets', 'rendered_on', 'tested_by'}
    KINDS = {'source', 'claim', 'interpretation', 'instrument', 'run', 'surface', 'proposal'}

    def __init__(self, max_nodes: int = 10000):
        self.max_nodes = max_nodes
        self._nodes: dict[str, bytes] = {}
        self._edges: dict[str, bytes] = {}

    def put(self, *, kind: str, subject: str, source_uri: str,
            source_sha256: str, observed_at: str, content: dict,
            visibility: str = 'internal') -> str:
        if kind not in self.KINDS or visibility not in {'public', 'internal', 'private'}:
            raise ContractError('NODE_KIND_OR_VISIBILITY')
        if not subject or not source_uri: raise ContractError('SOURCE_AND_SUBJECT_REQUIRED')
        require_digest(source_sha256); timestamp(observed_at)
        node = dict(kind=kind, subject=subject, source_uri=source_uri,
                    source_sha256=source_sha256, observed_at=observed_at,
                    content=content, visibility=visibility,
                    assertion_basis='SOURCE_STATEMENT_NOT_INDEPENDENTLY_VALIDATED')
        raw = canonical(node); key = 'sha256:' + digest(raw)
        if key not in self._nodes and len(self._nodes) >= self.max_nodes:
            raise ContractError('GRAPH_SIZE_LIMIT')
        self._nodes.setdefault(key, raw)
        return key

    def node(self, key: str) -> dict:
        if key not in self._nodes: raise ContractError('UNKNOWN_NODE')
        raw = self._nodes[key]
        if key != 'sha256:' + digest(raw): raise ContractError('NODE_INTEGRITY_FAILURE')
        return load_json(raw)

    def link(self, dependent: str, relation: str, source: str, *,
             evidence_sha256: str, recorded_at: str,
             basis: str = 'candidate') -> str:
        if relation not in self.RELATIONS: raise ContractError('UNSUPPORTED_RELATION')
        if basis not in {'candidate', 'operator_reviewed'}: raise ContractError('EDGE_BASIS')
        self.node(dependent); self.node(source); require_digest(evidence_sha256)
        timestamp(recorded_at)
        if dependent == source: raise ContractError('SELF_EDGE')
        # Only causal dependency relations are acyclic. Citation cycles are valid
        # and retained, but never generate extra evidentiary support.
        if relation in self.PROPAGATES:
            if dependent in self._ancestors(source): raise ContractError('DEPENDENCY_CYCLE')
        edge = dict(dependent=dependent, relation=relation, source=source,
                    evidence_sha256=evidence_sha256, recorded_at=recorded_at, basis=basis)
        raw = canonical(edge); key = 'sha256:' + digest(raw)
        if key not in self._edges and len(self._edges) >= self.max_nodes * 8:
            raise ContractError('EDGE_SIZE_LIMIT')
        self._edges.setdefault(key, raw)
        return key

    def _edges_read(self) -> list[dict]:
        out = []
        for key, raw in self._edges.items():
            if key != 'sha256:' + digest(raw): raise ContractError('EDGE_INTEGRITY_FAILURE')
            out.append(load_json(raw))
        return out

    def _ancestors(self, start: str) -> set[str]:
        q, seen = deque([start]), set()
        edges = self._edges_read()
        while q:
            current = q.popleft()
            for e in edges:
                if e['dependent'] == current and e['relation'] in self.PROPAGATES:
                    if e['source'] not in seen:
                        seen.add(e['source']); q.append(e['source'])
        return seen

    def impact(self, changed: str, *, known_at: str, public_only: bool = False) -> dict:
        cutoff = timestamp(known_at); self.node(changed)
        if timestamp(self.node(changed)['observed_at']) > cutoff:
            raise ContractError('CHANGE_NOT_YET_OBSERVED')
        edges = [e for e in self._edges_read() if timestamp(e['recorded_at']) <= cutoff
                 and timestamp(self.node(e['source'])['observed_at']) <= cutoff
                 and timestamp(self.node(e['dependent'])['observed_at']) <= cutoff]
        if public_only:
            # Never reveal private topology through identifiers, path lengths or counts.
            edges = [e for e in edges if all(self.node(e[k])['visibility'] == 'public'
                                            for k in ('source', 'dependent'))]
            if self.node(changed)['visibility'] != 'public': raise ContractError('PRIVATE_ROOT')
        q, seen, findings = deque([changed]), {changed}, []
        while q:
            current = q.popleft()
            for e in edges:
                if e['source'] != current or e['dependent'] in seen: continue
                if e['relation'] not in self.PROPAGATES: continue
                if e['basis'] != 'operator_reviewed': continue
                node = e['dependent']; seen.add(node); q.append(node)
                findings.append({'node': node, 'state': 'REASSESSMENT_CANDIDATE',
                                 'via': current, 'relation': e['relation']})
        return {'changed': changed, 'known_at': known_at, 'impacted': findings,
                'historical_verdicts_changed': False, 'execution_authorized': False,
                'coverage': 'RECORDED_REVIEWED_EDGES_ONLY'}

    def export(self, *, public_only: bool = False) -> dict:
        nodes = {k: self.node(k) for k in sorted(self._nodes)
                 if not public_only or self.node(k)['visibility'] == 'public'}
        edges = [e for e in self._edges_read() if e['source'] in nodes and e['dependent'] in nodes]
        return {'schema': 'csoai.claim-maintenance/0.1', 'nodes': nodes,
                'edges': edges, 'signature_state': 'UNSIGNED',
                'global_truth_claimed': False}

    def prov_export(self, *, public_only: bool = True) -> dict:
        graph = self.export(public_only=public_only)
        entities = []
        for key, n in graph['nodes'].items():
            entities.append({'@id': key, '@type': 'prov:Entity',
                             'cm:source': n['source_uri'], 'cm:observedAt': n['observed_at'],
                             'cm:sourceDigest': n['source_sha256'], 'cm:kind': n['kind']})
        for e in graph['edges']:
            # A citation is NOT automatically a derivation. Use PROV only where it fits.
            prop = 'prov:wasDerivedFrom' if e['relation'] == 'derived_from' else 'cm:' + e['relation']
            entities.append({'@id': e['dependent'], prop: {'@id': e['source']},
                             'cm:basis': e['basis']})
        return {'@context': {'prov': 'http://www.w3.org/ns/prov#',
                             'cm': 'urn:csoai:claim-maintenance:0.1:'}, '@graph': entities}


def observations_summary(rows: Iterable[Mapping]) -> dict:
    """IDs and dependency clusters are source assertions, NOT authenticated identity."""
    unique: dict[str, tuple] = {}; messages = 0
    for r in rows:
        messages += 1
        oid = r.get('observation_id'); source_hash = r.get('source_sha256')
        if not isinstance(oid, str) or not oid: raise ContractError('OBSERVATION_ID_REQUIRED')
        require_digest(source_hash)
        record = (source_hash, r.get('dependency_group'), canonical(r.get('value')))
        if oid in unique and unique[oid] != record: raise ContractError('OBSERVATION_ID_CONFLICT')
        unique[oid] = record
    return {'messages': messages, 'distinct_asserted_observation_ids': len(unique),
            'distinct_source_digests': len({v[0] for v in unique.values()}),
            'known_dependency_groups': len({v[1] for v in unique.values() if v[1]}),
            'independent_observations': None, 'independence_state': 'NOT_ESTABLISHED',
            'vote_or_confidence': None}


def check_readback(contract: Mapping, receipt: Mapping, body: bytes | None, *, now: str) -> dict:
    """Compare a freshly retained response to an operator-curated exact-byte contract.

    Receipt identity/time are supplied by the trusted collector, not remote page text.
    No string matching is represented as proof of scientific or legal correctness.
    """
    required = {'target_uri', 'corrected_source_sha256', 'accepted_target_sha256',
                'max_age_seconds', 'not_before', 'contract_id'}
    if set(contract) != required: raise ContractError('READBACK_CONTRACT_SCHEMA')
    require_digest(contract['corrected_source_sha256']); require_digest(contract['accepted_target_sha256'])
    if type(contract['max_age_seconds']) is not int or contract['max_age_seconds'] < 1:
        raise ContractError('READBACK_AGE_REQUIRED')
    state = 'NOT_CHECKED'
    try:
        when = timestamp(receipt['observed_at']); current = timestamp(now)
        age = (current - when).total_seconds()
        if receipt.get('requested_uri') != contract['target_uri'] or receipt.get('final_uri') != contract['target_uri']:
            state = 'SOURCE_IDENTITY_MISMATCH'
        elif receipt.get('http_status') == 304:
            state = 'CACHE_REVALIDATION_NOT_SUPPORTED'
        elif receipt.get('http_status') != 200 or body is None:
            state = 'UNAVAILABLE'
        elif age < 0 or when < timestamp(contract['not_before']):
            state = 'INVALID_OBSERVATION_TIME'
        elif age > contract['max_age_seconds']:
            state = 'STALE_OBSERVATION'
        elif read_state(receipt.get('body_sha256'), body) != 'MATCHED_BYTES':
            state = 'INTEGRITY_FAILURE'
        elif digest(body) == contract['accepted_target_sha256']:
            state = 'EXPECTED_REVISION_OBSERVED'
        else:
            state = 'DIFFERENT_REVISION_REVIEW_REQUIRED'
    except KeyError:
        state = 'INCOMPLETE_RECEIPT'
    return {'contract_id': contract['contract_id'], 'state': state,
            'method': 'EXACT_BYTE_REVISION_MATCH', 'observed_at': receipt.get('observed_at'),
            'semantic_correctness': 'NOT_ESTABLISHED', 'delivery_to_all_consumers': 'UNKNOWN'}


def propagation_summary(results: list[Mapping]) -> dict:
    ids = [r['contract_id'] for r in results]
    if len(set(ids)) != len(ids): raise ContractError('DUPLICATE_PROPAGATION_TARGET')
    matched = sum(r['state'] == 'EXPECTED_REVISION_OBSERVED' for r in results)
    compared = sum(r['state'] in {'EXPECTED_REVISION_OBSERVED', 'DIFFERENT_REVISION_REVIEW_REQUIRED'} for r in results)
    # Never emit a blanket propagation percentage over inaccessible or unknown citers.
    return {'declared_targets': len(results), 'fresh_compared_targets': compared,
            'expected_revision_observed': matched,
            'unresolved_targets': len(results)-compared,
            'complete_for_declared_targets': bool(results) and compared == len(results),
            'global_propagation_rate': None,
            'scope': 'OPERATOR_DECLARED_TARGETS_ONLY'}


def import_legacy_watch(blob: Mapping) -> dict:
    scans = blob.get('scans')
    if not isinstance(scans, list): raise ContractError('LEGACY_WATCH_SCHEMA')
    return {'schema': 'csoai.legacy-watch-reading/0.1', 'records': len(scans),
            'source_generated_at': blob.get('generated_at'),
            'source_signature_state': blob.get('signature_state'),
            'fresh_target_readbacks': 0, 'global_propagation_rate': None,
            'state': 'LEGACY_INVENTORY_NOT_PROPAGATION_MEASUREMENT',
            'items': [{'id': r.get('id'), 'source_reported_age_days': r.get('stale_days'),
                       'target_readback': 'NOT_ESTABLISHED'} for r in scans]}


def import_corrections(graph: ClaimGraph, body: bytes, source_uri: str, observed_at: str) -> dict:
    """Reuse csoai.corrections/0.1 without relabeling publisher assertions as verified."""
    blob = load_json(body)
    if not isinstance(blob, dict) or not isinstance(blob.get('corrections'), list):
        raise ContractError('CORRECTIONS_SCHEMA')
    source = graph.put(kind='source', subject='corrections-ledger', source_uri=source_uri,
                       source_sha256=digest(body), observed_at=observed_at,
                       content={'schema': str(blob.get('schema')), 'local_copy_only': True})
    keys = []
    for i, row in enumerate(blob['corrections']):
        if not isinstance(row, dict) or not isinstance(row.get('id'), str):
            raise ContractError('CORRECTION_ROW_SCHEMA')
        key = graph.put(kind='proposal', subject=row['id'], source_uri=source_uri,
                        source_sha256=digest(body), observed_at=observed_at,
                        content={'source_pointer': '/corrections/' + str(i),
                                 'what_was_wrong': str(row.get('what_was_wrong', '')),
                                 'what_changed': str(row.get('what_changed', '')),
                                 'source_date': str(row.get('date', '')),
                                 'state': 'PUBLISHER_REPORTED_CORRECTION'})
        graph.link(key, 'derived_from', source, evidence_sha256=digest(body),
                   recorded_at=observed_at, basis='operator_reviewed')
        keys.append(key)
    return {'source': source, 'imported_statements': len(keys), 'nodes': keys,
            'source_claims_independently_reproduced': False}


def fix_gate(proposal: Mapping, host: Mapping, *, now: str) -> dict:
    """Offline release-readiness classifier, not authentication or execution authority.

    host is a LOCAL, operator-managed input representing upstream verified results.
    A document cannot supply host. A production caller must use existing RAS identity,
    lease, signature-verification, custody and one-writer release controls.
    """
    required = {'proposal_id', 'subject', 'baseline_sha256', 'candidate_sha256',
                'patch_sha256', 'instrument_sha256', 'scope', 'expires_at'}
    if set(proposal) != required: raise ContractError('FIX_PROPOSAL_SCHEMA')
    for name in ('baseline_sha256', 'candidate_sha256', 'patch_sha256', 'instrument_sha256'):
        require_digest(proposal[name])
    psha = digest(canonical(dict(proposal))); reasons = []
    if timestamp(proposal['expires_at']) <= timestamp(now): reasons.append('EXPIRED_PROPOSAL')
    if host.get('reviewed_proposal_sha256') != psha: reasons.append('EXACT_PROPOSAL_REVIEW_REQUIRED')
    if proposal['scope'] not in host.get('allowed_scopes', []): reasons.append('SCOPE_NOT_ALLOWED')
    if host.get('current_baseline_sha256') != proposal['baseline_sha256']: reasons.append('BASELINE_MOVED')
    if host.get('tested_candidate_sha256') != proposal['candidate_sha256']: reasons.append('CANDIDATE_NOT_TESTED')
    if host.get('tested_instrument_sha256') != proposal['instrument_sha256']: reasons.append('INSTRUMENT_CHANGED')
    author, reviewer = host.get('author_principal'), host.get('reviewer_principal')
    if not author or not reviewer or author == reviewer: reasons.append('SEPARATE_REVIEWER_REQUIRED')
    if host.get('reviewer_authorized') is not True: reasons.append('REVIEWER_AUTHORITY_UNESTABLISHED')
    if host.get('instrument_qualified') is not True: reasons.append('INSTRUMENT_UNQUALIFIED')
    if host.get('legitimate_action_control') != 'PASS': reasons.append('UTILITY_CONTROL_REQUIRED')
    if host.get('designed_failure_control') != 'PASS': reasons.append('DISCRIMINATION_REQUIRED')
    if host.get('safety_regressions') != []: reasons.append('REGRESSIONS_UNRESOLVED')
    if not isinstance(host.get('rollback_sha256'), str) or not HEX.fullmatch(host['rollback_sha256']):
        reasons.append('ROLLBACK_REQUIRED')
    return {'proposal_sha256': psha, 'state': 'BLOCKED' if reasons else 'ELIGIBLE_FOR_SEPARATE_RELEASE_REVIEW',
            'reasons': reasons, 'execution_authorized': False, 'auto_publish': False,
            'assurance': 'HOST_ASSERTED_INPUTS_NOT_AUTHENTICATED_BY_THIS_PLUGIN'}


def render_report(report: Mapping) -> str:
    escaped = html.escape(json.dumps(report, indent=2, ensure_ascii=False))
    return ('<!doctype html><html lang="en"><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'">'
            '<title>CSOAI claim-maintenance review</title>'
            '<style>body{max-width:1000px;margin:3rem auto;padding:1rem;font:16px system-ui;line-height:1.5}'
            'pre{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid;padding:1rem}</style>'
            '<h1>Claim-maintenance review</h1><p>Offline candidate. No certification, '
            'execution, signature or live deployment is implied.</p><pre>' + escaped + '</pre></html>')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--corrections', type=Path)
    parser.add_argument('--legacy-watch', type=Path)
    parser.add_argument('--source-uri', default='local:operator-supplied-artifact')
    parser.add_argument('--observed-at', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    timestamp(args.observed_at)
    if not args.corrections and not args.legacy_watch: parser.error('supply at least one input')
    report: dict = {'schema': 'csoai.claim-maintenance-run/0.1', 'plugin_version': VERSION,
                    'observed_at': args.observed_at, 'network_calls': 0,
                    'production_changes': 0, 'input_receipts': []}
    graph = ClaimGraph()
    try:
        for name in ('corrections', 'legacy_watch'):
            path = getattr(args, name)
            if path:
                if path.stat().st_size > MAX_BYTES: raise ContractError('JSON_SIZE_LIMIT')
                raw = path.read_bytes()
                report['input_receipts'].append({'kind': name, 'sha256': digest(raw), 'bytes': len(raw)})
                if name == 'corrections':
                    report[name] = import_corrections(graph, raw, args.source_uri, args.observed_at)
                else: report[name] = import_legacy_watch(load_json(raw))
        report['graph'] = graph.export()
        args.output.mkdir(parents=True, exist_ok=False)
        (args.output/'review.json').write_text(json.dumps(report,indent=2)+'\n')
        (args.output/'review.html').write_text(render_report(report))
        (args.output/'provenance.jsonld').write_text(json.dumps(graph.prov_export(public_only=False),indent=2)+'\n')
        print(json.dumps({'state':'OFFLINE_REVIEW_WRITTEN','output':str(args.output),
                          'statements':report.get('corrections',{}).get('imported_statements',0),
                          'fresh_target_readbacks':0,'production_changes':0}))
        return 0
    except (ContractError, OSError) as exc:
        print(json.dumps({'state':'ERROR','reason':str(exc)}))
        return 2

if __name__ == '__main__':
    raise SystemExit(main())
