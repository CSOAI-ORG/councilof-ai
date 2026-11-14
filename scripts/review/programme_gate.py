#!/usr/bin/env python3
"""Read-only readiness projection for the existing CSOAI execution programme.

No scheduler, network client, shell invocation, signer or approval mechanism.
A historical receipt is labelled as evidence of its scope, not current production.
"""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
from typing import Any

SCHEMA = 'csoai.execution-programme/1'
HEX = re.compile(r'^[0-9a-f]{64}$')
ID = re.compile(r'^[A-Z][0-9]{2}$')
MAX_JSON = 4_000_000


def load_json(path: Path) -> Any:
    def unique(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f'Duplicate JSON key: {key}')
            result[key] = value
        return result
    if path.stat().st_size > MAX_JSON:
        raise ValueError('JSON exceeds size bound')
    return json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=unique,
                      parse_constant=lambda x: (_ for _ in ()).throw(ValueError('Nonfinite JSON')))


def validate(plan: dict[str, Any]) -> list[list[str]]:
    if plan.get('schema') != SCHEMA:
        raise ValueError('Programme schema mismatch')
    tasks = plan.get('tasks')
    if not isinstance(tasks, list) or not 1 <= len(tasks) <= 200:
        raise ValueError('Expected 1–200 tasks')
    ids: set[str] = set()
    phases = {p['id'] for p in plan.get('phases', [])}
    lanes = {p['id'] for p in plan.get('lanes', [])}
    for task in tasks:
        task_id = task.get('id', '')
        if not ID.fullmatch(task_id) or task_id in ids:
            raise ValueError('Missing or duplicate task identity')
        ids.add(task_id)
        if task.get('phase') not in phases or task.get('lane') not in lanes:
            raise ValueError('Unknown phase or lane')
        for key in ['title', 'deliverable', 'acceptance', 'reuse', 'collision_group']:
            if not isinstance(task.get(key), str) or not task[key].strip():
                raise ValueError(f'Missing task field: {key}')
        for key in ['depends_on', 'required_approvals', 'evidence']:
            if not isinstance(task.get(key), list):
                raise ValueError(f'Expected array: {key}')
        if not all(isinstance(x, str) and x for x in task['required_approvals']):
            raise ValueError('Invalid approval requirement')
        if task.get('priority') not in ('P0', 'P1', 'P2'):
            raise ValueError('Invalid priority')
        if task.get('completion_scope') not in ('PRIVATE', 'PUBLIC', 'HUMAN', 'COMMERCIAL'):
            raise ValueError('Invalid completion scope')
        for evidence in task['evidence']:
            rel = Path(evidence.get('path', ''))
            if not str(rel) or str(rel) == '.' or rel.is_absolute() or '..' in rel.parts:
                raise ValueError('Unsafe receipt path')
            if not HEX.fullmatch(evidence.get('sha256', '')):
                raise ValueError('Receipt digest required')
            if not isinstance(evidence.get('assertions'), list) or not evidence['assertions']:
                raise ValueError('Receipt assertions required')
            if not evidence.get('scope_note'):
                raise ValueError('Receipt scope required')
    unresolved = {t['id']: set(t['depends_on']) for t in tasks}
    for task, deps in unresolved.items():
        if task in deps or not deps <= ids:
            raise ValueError('Unknown or self dependency')
    levels: list[list[str]] = []
    while unresolved:
        ready = sorted(t for t, deps in unresolved.items() if not deps)
        if not ready:
            raise ValueError('Dependency cycle')
        levels.append(ready)
        for task in ready:
            del unresolved[task]
        for deps in unresolved.values():
            deps.difference_update(ready)
    return levels


def verify_receipt(evidence: dict[str, Any], root: Path) -> tuple[bool, str]:
    root = root.resolve()
    file = root / evidence['path']
    try:
        if file.is_symlink() or not file.is_file() or not file.resolve().is_relative_to(root):
            return False, 'MISSING_OR_UNSAFE_RECEIPT'
        if file.stat().st_size > MAX_JSON:
            return False, 'RECEIPT_TOO_LARGE'
        raw = file.read_bytes()
        if hashlib.sha256(raw).hexdigest() != evidence['sha256']:
            return False, 'RECEIPT_DIGEST_MISMATCH'
        obj = load_json(file)
        for check in evidence['assertions']:
            value = obj
            for key in check['path']:
                value = value[key]
            if type(value) is not type(check['equals']) or value != check['equals']:
                return False, 'RECEIPT_ASSERTION_FAILED'
        return True, 'EXACT_RECEIPT_AND_ASSERTIONS_MATCH'
    except (OSError, ValueError, TypeError, KeyError, IndexError):
        return False, 'INVALID_RECEIPT'


def project(plan: dict[str, Any], root: Path, policy: dict[str, Any]) -> dict[str, Any]:
    levels = validate(plan)
    task_map = {t['id']: t for t in plan['tasks']}
    results: dict[str, Any] = {}
    policy = policy.get('policy', policy)
    if not isinstance(policy, dict):
        raise ValueError('Invalid policy')
    for level in levels:
        for task_id in level:
            task = task_map[task_id]
            proof_checks = [verify_receipt(e, root) for e in task['evidence']]
            missing_deps = [d for d in task['depends_on'] if results[d]['state'] != 'EVIDENCED_SCOPE']
            missing_approval = [a for a in task['required_approvals'] if policy.get(a) is not True]
            if proof_checks and not all(ok for ok, _ in proof_checks):
                state = 'EVIDENCE_INVALID'
            elif proof_checks:
                # Records execution of the stated scope. Does not grant future action authority.
                state = 'EVIDENCED_SCOPE'
            elif missing_approval:
                state = 'AUTHORITY_HELD'
            elif missing_deps:
                state = 'DEPENDENCY_BLOCKED'
            else:
                state = 'READY_PRIVATE_PLAN_ONLY'
            results[task_id] = {'id': task_id, 'title': task['title'], 'state': state,
                                'phase': task['phase'], 'lane': task['lane'],
                                'dependencies_remaining': missing_deps,
                                'approvals_remaining': missing_approval,
                                'receipt_checks': [reason for _, reason in proof_checks],
                                'scope_notes': [e['scope_note'] for e in task['evidence']]}
    selected: list[str] = []
    used_lanes: set[str] = set()
    used_groups: set[str] = set()
    for task in sorted(plan['tasks'], key=lambda t: (t['priority'], t['phase'], t['id'])):
        if results[task['id']]['state'] != 'READY_PRIVATE_PLAN_ONLY':
            continue
        if task['lane'] in used_lanes or task['collision_group'] in used_groups:
            continue
        selected.append(task['id'])
        used_lanes.add(task['lane']); used_groups.add(task['collision_group'])
    return {'schema': 'csoai.programme-readiness/1',
            'read_at': datetime.now(timezone.utc).isoformat(),
            'state': 'READ_ONLY_PROJECTION', 'task_count': len(results),
            'counts': dict(Counter(r['state'] for r in results.values())),
            'dependency_levels': levels, 'suggested_parallel_private_tasks': selected,
            'tasks': list(results.values()), 'executed_by_this_command': 0,
            'grants_authority': False, 'production_ready': False,
            'note': 'Evidence labels only the retained tested scope. Readiness is a plan, not execution, approval, deployment or a current-state attestation.'}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--evidence-root', type=Path, required=True)
    parser.add_argument('--policy', type=Path, required=True)
    args = parser.parse_args()
    try:
        result = project(load_json(args.plan), args.evidence_root, load_json(args.policy))
        print(json.dumps(result, indent=2, ensure_ascii=False, allow_nan=False))
        return 0
    except (OSError, ValueError, TypeError, KeyError) as exc:
        print(json.dumps({'state': 'FAILED_CLOSED', 'reason': str(exc), 'executed': 0}))
        return 2

if __name__ == '__main__':
    raise SystemExit(main())
