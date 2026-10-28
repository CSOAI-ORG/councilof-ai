"""test_hitl_authority_effect_v0_2.py — the executable half of the v0.2 HITL profile.

WHAT THIS TESTS. Two bindings that v0.1 left to the consumer and that an Alliance
counterpart asked to see made testable:

  1. A claim that is not CURRENT does not authorize a consequential execution.
     STALE, RETEST_DUE, UNMEASURED and NOT_WATCHED are non-authorizing; a decision
     taken on one, or an execution carried out on one, is rejected.
  2. An APPROVE decision is bound to a current external authority record carrying the
     operational baseline, the scope, the authority epoch, the validity window, the
     expiry and the revocation state. A record that omits those fields is rejected, and
     a revocation state that is unknown fails closed.

THE NEGATIVE CONTROL. The must-fail cases below are ALSO RUN AGAINST v0.1, and v0.1
must ACCEPT them. If v0.1 rejected them, the gap this profile closes was never a gap,
and the new controls would prove nothing. A control that can only pass proves nothing;
this one can fail, and it is shown failing.

THE TEMPORAL GATE. JSON Schema cannot compare timestamps, so the validity window,
the decision time, the invocation time and the observation times are checked by the
reference checker in this file. Those rules are consumer requirements in the profile
text and executable here, which is what "conformance-testable" has to mean.

Usage:  python3 test_hitl_authority_effect_v0_2.py
Exit 0 on pass, 1 on failure, 2 if jsonschema is unavailable.
"""

import copy
import json
import pathlib
import sys
from datetime import datetime

try:
    import jsonschema
except ImportError as e:  # pragma: no cover
    print('SKIP jsonschema unavailable:', e)
    sys.exit(2)

ROOT = pathlib.Path(__file__).resolve().parent
S2 = json.loads((ROOT / 'hitl-authority-effect-v0.2.schema.json').read_text())
E2 = json.loads((ROOT / 'hitl-authority-effect-v0.2.example.json').read_text())
S1 = json.loads((ROOT / 'hitl-authority-effect-v0.1.schema.json').read_text())
E1 = json.loads((ROOT / 'hitl-authority-effect.example.json').read_text())

jsonschema.Draft202012Validator.check_schema(S2)
V2 = jsonschema.Draft202012Validator(S2, format_checker=jsonschema.FormatChecker())
V1 = jsonschema.Draft202012Validator(S1, format_checker=jsonschema.FormatChecker())

counts = {'must_pass': 0, 'must_fail': 0, 'negative_control': 0, 'temporal': 0}
failures = []

# A format check that silently does not run is worse than no format check: the record
# would look validated while its timestamps were never checked. CI pins
# jsonschema==4.25.1 and rfc3339_validator==0.1.4 so that `date-time` is enforced.
if 'date-time' not in jsonschema.FormatChecker().checkers:
    failures.append('the date-time format checker is unavailable — the timestamp checks in this file would not run')


def accepted(record, label, validator=V2):
    validator.validate(record)
    counts['must_pass'] += 1
    print(f'  ok  accept  {label}')


def rejected(record, label):
    try:
        V2.validate(record)
    except jsonschema.ValidationError as e:
        counts['must_fail'] += 1
        print(f'  ok  reject  {label}   [{e.json_path}]')
        return
    failures.append(f'NOT REJECTED: {label}')
    print(f'  FAIL accept {label}')


def accepted_by_v1(record, label):
    """The negative control: v0.1 must ACCEPT what v0.2 rejects."""
    try:
        V1.validate(record)
    except jsonschema.ValidationError as e:
        failures.append(f'v0.1 REJECTED (control is not discriminating): {label} [{e.json_path}]')
        print(f'  FAIL v0.1 rejected {label}')
        return
    counts['negative_control'] += 1
    print(f'  ok  v1-accepts  {label}')


def _path(path):
    """A path of length 1 sets a top-level key; a tuple walks into nested objects."""
    return (path,) if isinstance(path, str) else tuple(path)


def mutate(record, path, value):
    """Set a nested value."""
    path = _path(path)
    target = record
    for key in path[:-1]:
        target = target[key]
    target[path[-1]] = value


def drop(record, path):
    path = _path(path)
    target = record
    for key in path[:-1]:
        target = target[key]
    del target[path[-1]]


def ts(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


print('== v0.2 must-pass ==')
accepted(E2, 'the conforming v0.2 example')

# A record with no claim dependency at all: authority stands alone, and nothing in the
# claim-maintenance bindings applies because the block is absent.
no_claim = copy.deepcopy(E2)
drop(no_claim, 'claim_maintenance')
accepted(no_claim, 'an authority with no claim dependency (claim_maintenance absent)')

# A historical record: the claim was current at decision and at invocation, and is stale
# now. The release is no longer live. This must remain writable — history is not rewritten.
historical = copy.deepcopy(E2)
mutate(historical, ('claim_maintenance', 'watch_state'), 'STALE')
mutate(historical, ('authority', 'release_state'), 'SUPERSEDED')
accepted(historical, 'a historical execution whose claim has since gone stale')

print('== v0.2 must-fail: binding 1 — a claim that is not CURRENT does not authorize ==')
for state in ('RETEST_DUE', 'STALE', 'UNMEASURED', 'NOT_WATCHED'):
    bad = copy.deepcopy(E2)
    mutate(bad, ('claim_maintenance', 'watch_state'), state)
    rejected(bad, f'live release ACTIVE with watch_state={state}')

for state in ('RETEST_DUE', 'STALE', 'UNMEASURED', 'NOT_WATCHED'):
    bad = copy.deepcopy(E2)
    mutate(bad, ('claim_maintenance', 'watch_state_at_decision'), state)
    rejected(bad, f'APPROVE decided while the claim was {state}')

for state in ('RETEST_DUE', 'STALE', 'UNMEASURED', 'NOT_WATCHED'):
    bad = copy.deepcopy(E2)
    mutate(bad, ('claim_maintenance', 'watch_state_at_invocation'), state)
    rejected(bad, f'EXECUTED while the claim was {state}')

bad = copy.deepcopy(E2)
mutate(bad, ('claim_maintenance', 'watch_state_at_decision'), None)
rejected(bad, 'APPROVE with no watch state at the decision')

bad = copy.deepcopy(E2)
mutate(bad, ('claim_maintenance', 'watch_state_at_invocation'), None)
rejected(bad, 'EXECUTED with no watch state at the invocation')

print('== v0.2 must-fail: binding 2 — APPROVE bound to a current external authority record ==')
for state in ('REVOKED', 'REVOCATION_UNKNOWN'):
    bad = copy.deepcopy(E2)
    mutate(bad, ('authority', 'revocation_state'), state)
    rejected(bad, f'APPROVE with revocation_state={state}')

for path in (
    ('authority', 'operational_baseline'),
    ('authority', 'validity_window'),
    ('authority', 'release_state'),
    ('authority', 'revocation_state'),
    ('authority', 'external_record_ref'),
    ('authority', 'external_record_digest'),
):
    bad = copy.deepcopy(E2)
    drop(bad, path)
    rejected(bad, f'APPROVE without {".".join(path)}')

bad = copy.deepcopy(E2)
drop(bad, ('authority', 'operational_baseline'))
mutate(bad, ('authority', 'operational_baseline'), {'observed_at': '2026-10-27T09:09:30Z'})
rejected(bad, 'operational_baseline without a baseline digest')

bad = copy.deepcopy(E2)
mutate(bad, ('authority', 'validity_window'), {'not_before': '2026-10-27T09:10:00Z'})
rejected(bad, 'validity_window without an expiry')

for path in (
    ('authority', 'decided_at'),
    ('authority', 'validity_window', 'not_before'),
    ('authority', 'validity_window', 'not_after'),
    ('authority', 'operational_baseline', 'observed_at'),
    ('invocation', 'invoked_at'),
):
    bad = copy.deepcopy(E2)
    mutate(bad, path, 'not-a-date-time')
    rejected(bad, f'malformed timestamp at {".".join(path)}')

print('== negative control: v0.1 must accept the records v0.2 rejects ==')
# The same live-stale combination, expressed in the v0.1 shape.
for state in ('STALE', 'UNMEASURED', 'RETEST_DUE'):
    old = copy.deepcopy(E1)
    mutate(old, ('claim_maintenance', 'watch_state'), state)
    accepted_by_v1(old, f'v0.1 accepts APPROVE+EXECUTED with watch_state={state}')

# The v0.1 example as it stands: no operational baseline, no validity window, no
# revocation state, no external record binding.
accepted_by_v1(E1, 'v0.1 accepts an APPROVE with no external authority record binding')

print('== temporal gate (reference checker; JSON Schema cannot compare timestamps) ==')


def temporal_ok(record):
    """The executable form of the consumer requirements stated in the profile."""
    problems = []
    authority = record['authority']
    window = authority['validity_window']
    not_before, not_after = ts(window['not_before']), ts(window['not_after'])
    decided_at = ts(authority['decided_at'])
    if not (not_before <= decided_at <= not_after):
        problems.append('decided_at outside the validity window')
    if ts(authority['operational_baseline']['observed_at']) > decided_at:
        problems.append('the operational baseline was observed after the decision')
    invoked_at = record['invocation'].get('invoked_at')
    if invoked_at:
        if not (not_before <= ts(invoked_at) <= not_after):
            problems.append('invoked_at outside the validity window')
        if ts(record['effect']['observed_at']) < ts(invoked_at):
            problems.append('the effect was observed before the invocation')
    verified_at = record['verification'].get('verified_at')
    if verified_at and record['effect'].get('observed_at'):
        if ts(verified_at) < ts(record['effect']['observed_at']):
            problems.append('verification precedes the observed effect')
    return problems


problems = temporal_ok(E2)
if problems:
    failures.append(f'temporal gate rejected the conforming example: {problems}')
    print(f'  FAIL temporal gate on the conforming example: {problems}')
else:
    counts['temporal'] += 1
    print('  ok  the conforming example passes the temporal gate')

out_of_window = copy.deepcopy(E2)
mutate(out_of_window, ('invocation', 'invoked_at'), '2026-10-27T10:30:00Z')
problems = temporal_ok(out_of_window)
if not problems:
    failures.append('temporal gate accepted an invocation outside the validity window')
    print('  FAIL temporal gate accepted an out-of-window invocation')
else:
    counts['temporal'] += 1
    print(f'  ok  the temporal gate rejects it: {problems}')

out_of_window = copy.deepcopy(E2)
mutate(out_of_window, ('authority', 'decided_at'), '2026-10-27T11:00:00Z')
problems = temporal_ok(out_of_window)
if not problems:
    failures.append('temporal gate accepted a decision outside the validity window')
    print('  FAIL temporal gate accepted an out-of-window decision')
else:
    counts['temporal'] += 1
    print(f'  ok  the temporal gate rejects it: {problems}')

print('== summary ==')
if failures:
    for f in failures:
        print('FAIL ' + f)
    sys.exit(1)

total = sum(counts.values())
print(f"PASS {counts['must_pass']} must-pass; {counts['must_fail']} must-fail; "
      f"{counts['negative_control']} negative controls (v0.1 accepted what v0.2 rejects); "
      f"{counts['temporal']} temporal checks ({total} total)")
