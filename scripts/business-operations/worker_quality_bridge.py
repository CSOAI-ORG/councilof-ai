"""Bounded local adapter for the existing read-only worker-quality reporter."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from worker_quality_report import load_json, strict_object, utc

MAX_REPORT_BYTES = 8 * 1024 * 1024
QUALITY_NAMES = frozenset(('FULLY_GRADED_CANDIDATE', 'PARTLY_GRADED_CANDIDATE',
    'NO_GRADED_OUTPUT', 'CONTRADICTORY_METADATA', 'INCOMPLETE',
    'TRANSPORT_INCOMPLETE', 'REQUIRES_REVIEW'))


def config_dir_from_process(worker_root, state_dir, proc_root=Path('/proc')):
    """Read the running worker's declared job directory when health omits it.

    No default job directory is inferred: a missing or ambiguous worker stays
    uncheckable instead of silently auditing an old set of jobs.
    """
    worker_root = worker_root.resolve()
    state_dir = state_dir.resolve()
    matches = []
    for cmdline in proc_root.glob('[0-9]*/cmdline'):
        try:
            argv = [part.decode('utf-8') for part in
                cmdline.read_bytes().split(b'\0') if part]
            if len(argv) < 6 or '--config-dir' not in argv or '--state-dir' not in argv:
                continue
            scripts = [Path(arg) for arg in argv[1:] if arg.endswith('/runpod_gspc_worker.py')]
            if len(scripts) != 1 or not scripts[0].resolve().is_relative_to(worker_root):
                continue
            config = Path(argv[argv.index('--config-dir') + 1])
            state = Path(argv[argv.index('--state-dir') + 1])
            if state.resolve() == state_dir:
                matches.append(config)
        except (OSError, ValueError, IndexError, UnicodeDecodeError):
            continue
    if len(matches) != 1:
        raise ValueError('QUALITY_WORKER_PROCESS_NOT_UNIQUE')
    return matches[0]


def summarize(report, now):
    if report.get('schema') != 'csoai.worker-quality-readback/1':
        raise ValueError('QUALITY_SCHEMA_REQUIRED')
    if report.get('state') not in ('REVIEW_REQUIRED', 'OBSERVED_CANDIDATES_PRESENT'):
        raise ValueError('QUALITY_STATE_INVALID')
    age = (now - utc(report['observed_at'])).total_seconds()
    if not 0 <= age <= 180:
        raise ValueError('QUALITY_REPORT_NOT_CURRENT')
    w = report['window']; counts = w['quality_counts']
    if not isinstance(counts, dict) or set(counts) - QUALITY_NAMES:
        raise ValueError('QUALITY_CLASSES_INVALID')
    values = [w['verified_run_records'], w['scoreable_candidates'], w.get('legacy_candidate_hash_records',0), *counts.values()]
    if any(type(v) is not int or v < 0 for v in values):
        raise ValueError('QUALITY_COUNTS_INVALID')
    if sum(counts.values()) != w['verified_run_records']:
        raise ValueError('QUALITY_COUNT_TOTAL_MISMATCH')
    if w.get('legacy_candidate_hash_records',0)>w['verified_run_records']:
        raise ValueError('QUALITY_LEGACY_COUNT_INVALID')
    if w['scoreable_candidates'] != sum(counts.get(k, 0) for k in
            ('FULLY_GRADED_CANDIDATE', 'PARTLY_GRADED_CANDIDATE')):
        raise ValueError('QUALITY_SCOREABLE_TOTAL_MISMATCH')
    if w.get('admitted') is not None or w.get('published') is not None:
        raise ValueError('COMPUTE_CANNOT_ESTABLISH_ADMISSION_OR_PUBLICATION')
    if report.get('mutations') is not False or report.get('new_inference') is not False:
        raise ValueError('QUALITY_READ_ONLY_SCOPE_REQUIRED')
    alerts = report['alerts']; errors = report['errors']
    if not isinstance(alerts, list) or not all(isinstance(a, str) for a in alerts) or not isinstance(errors, list):
        raise ValueError('QUALITY_DIAGNOSTICS_INVALID')
    alerts = list(dict.fromkeys(alerts))
    if errors and 'INCOMPLETE_OR_INVALID_AUDIT' not in alerts:
        alerts.append('INCOMPLETE_OR_INVALID_AUDIT')
    if any(counts.get(k, 0) for k in ('CONTRADICTORY_METADATA', 'INCOMPLETE',
            'TRANSPORT_INCOMPLETE', 'REQUIRES_REVIEW')):
        alerts.append('RUN_METADATA_OR_COMPLETION_REQUIRES_REVIEW')
    return {'observed_at': report['observed_at'],
        'state': 'REVIEW_REQUIRED' if alerts else report['state'],
        'verified_run_records': w['verified_run_records'], 'quality_counts': counts,
        'scoreable_candidates': w['scoreable_candidates'],
        'legacy_candidate_hash_records': w.get('legacy_candidate_hash_records',0),
        'unparsed_by_model': w.get('unparsed_by_model', {}),
        'admitted': None, 'published': None,
        'schedule': report['schedule'], 'process': report['process'],
        'alerts': list(dict.fromkeys(alerts)), 'audit_error_count': len(errors),
        'basis': 'Retained output hashes and reported grading counts; not rescoring or admission.'}


def collect(worker_root=Path('/workspace/gspc-worker'), workspace=Path('/workspace'), timeout=45):
    """Run the existing checker once; never infer zero from an unavailable check."""
    try:
        health_path = worker_root / 'state/health.json'
        health = load_json(health_path)
        config_dir = (Path(health['config_dir']) if health.get('config_dir')
            else config_dir_from_process(worker_root, health_path.parent))
        if config_dir.is_symlink() or not config_dir.resolve().is_relative_to(worker_root.resolve()) or not config_dir.is_dir():
            raise ValueError('QUALITY_CONFIG_DIRECTORY_REJECTED')
        command = [sys.executable, str(Path(__file__).with_name('worker_quality_report.py')),
            '--config-dir', str(config_dir), '--health', str(health_path),
            '--workspace', str(workspace), '--hours', '24']
        env = {k: v for k, v in os.environ.items() if k in ('PATH', 'LANG', 'LC_ALL', 'TZ')}
        env['PYTHONDONTWRITEBYTECODE'] = '1'
        with tempfile.TemporaryFile() as output, tempfile.TemporaryFile() as diagnostic:
            completed = subprocess.run(command, stdout=output, stderr=diagnostic,
                timeout=timeout, env=env, check=False)
            if completed.returncode not in (0, 1, 2):
                raise ValueError('QUALITY_PROCESS_FAILED')
            output.seek(0); raw = output.read(MAX_REPORT_BYTES + 1)
            if len(raw) > MAX_REPORT_BYTES:
                raise ValueError('QUALITY_REPORT_TOO_LARGE')
        report = json.loads(raw, object_pairs_hook=strict_object,
            parse_constant=lambda value: (_ for _ in ()).throw(ValueError('NONFINITE_JSON')))
        if not isinstance(report, dict):
            raise ValueError('QUALITY_OBJECT_REQUIRED')
        summary = summarize(report, datetime.now(timezone.utc))
        if completed.returncode == 2 and not summary['audit_error_count']:
            raise ValueError('QUALITY_EXIT_REPORT_MISMATCH')
        summary['process_exit_code'] = completed.returncode
        return report, summary
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.TimeoutExpired) as error:
        summary = {'observed_at': datetime.now(timezone.utc).isoformat(), 'state': 'UNCHECKABLE',
            'verified_run_records': None, 'quality_counts': None, 'scoreable_candidates': None,
            'admitted': None, 'published': None, 'alerts': ['WORKER_QUALITY_UNCHECKABLE'],
            'error_code': 'QUALITY_READ_TIMEOUT' if isinstance(error, subprocess.TimeoutExpired) else type(error).__name__,
            'basis': 'No current quality result; missing is not zero. Inspect the source checker.'}
        return dict(summary), summary
