"""Link commissions to observed mill outputs without claiming signed delivery."""
import argparse
import hashlib
import json
from pathlib import Path


def feed_available(feed):
    return (
        isinstance(feed, dict)
        # /api/commissions is csoai.commissions/0.2 since #2252 (typed fields) and #2278
        # (cards[]/delivery). The report reads only subject/axis/receipt_sha, present in both.
        and feed.get('schema') in ('csoai.commissions/0.1', 'csoai.commissions/0.2')
        and feed.get('status') == 'MEASURED'
        and feed.get('records_unreadable') == 0
        and isinstance(feed.get('commissions'), list)
    )


def health(feed, axis, priority_status, subject_count, priority_source):
    if priority_status not in ('AVAILABLE', 'UNAVAILABLE'):
        raise ValueError('unexpected priority status')
    if priority_status == 'AVAILABLE' and (
        not isinstance(subject_count, int) or isinstance(subject_count, bool) or subject_count < 0 or not priority_source
    ):
        raise ValueError('available priority requires a count and source')
    report_feed_status = 'AVAILABLE' if feed_available(feed) else 'UNAVAILABLE'
    status = 'AVAILABLE' if priority_status == report_feed_status == 'AVAILABLE' else 'UNAVAILABLE'
    return {
        'status': status,
        'axis': axis,
        'subject_count': subject_count if priority_status == 'AVAILABLE' else None,
        'priority_status': priority_status,
        'priority_source': priority_source if priority_status == 'AVAILABLE' else None,
        'report_feed_status': report_feed_status,
        'fulfillment_asserted': False,
    }


def build(feed, report, directory):
    if not feed_available(feed):
        raise ValueError('commission feed unavailable')
    if report.get('kind') != 'csoai.hub-queue-mill/0.1':
        raise ValueError('unexpected mill report')
    axis = report['axis']
    result = []
    for commission in feed['commissions']:
        subject = commission['subject']
        row = {'receipt_sha': commission['receipt_sha'], 'subject': subject,
               'requested_axis': commission.get('axis'), 'run_axis': axis,
               'status': 'NOT_OBSERVED_IN_RUN', 'artifacts': [], 'skip_reasons': [],
               'delivered': False, 'signed': False, 'root_included': False}
        if commission.get('axis') not in (None, axis):
            row['status'] = 'OTHER_AXIS'
        else:
            for card in report.get('staged_unsigned', []):
                if card.get('id') != subject or card.get('axis') != axis:
                    continue
                name = card['card']
                if Path(name).name != name or not name.startswith('unsigned-'):
                    raise ValueError('unsafe staged artifact name')
                path = directory / name
                if path.is_symlink() or not path.is_file():
                    raise ValueError('staged artifact missing or symlinked')
                row['artifacts'].append({'path':name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
            row['skip_reasons'] = [s['reason'] for s in report.get('skips', []) if s.get('id') == subject and s.get('axis') == axis]
            if row['artifacts']:
                row['status'] = 'STAGED_UNSIGNED'
            elif row['skip_reasons']:
                row['status'] = 'SKIPPED_IN_RUN'
        result.append(row)
    return {'schema':'csoai.commission-run-report/0.1','status':'AVAILABLE','as_of':report.get('as_of'),
            'axis':axis,'commissions':result,
            'fulfillment_asserted':False,
            'meaning':'Run observations only. Staging does not prove signing, admission, root inclusion or customer delivery.'}


def build_or_unavailable(feed, report, directory):
    if report.get('kind') != 'csoai.hub-queue-mill/0.1':
        raise ValueError('unexpected mill report')
    if feed_available(feed):
        return build(feed, report, directory)
    return {
        'schema': 'csoai.commission-run-report/0.1',
        'status': 'UNAVAILABLE',
        'as_of': report.get('as_of'),
        'axis': report.get('axis'),
        'commissions': None,
        'fulfillment_asserted': False,
        'meaning': 'Commission feed unavailable. No commission fulfillment is asserted from this run.',
    }


def load_json_or_unavailable(path):
    try:
        value = json.loads(Path(path).read_text())
        return value if isinstance(value, dict) else {}
    except (OSError, ValueError, TypeError):
        return {}


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument('--feed', required=True)
    p.add_argument('--mill')
    p.add_argument('--health-out')
    p.add_argument('--axis')
    p.add_argument('--priority-status', choices=('AVAILABLE', 'UNAVAILABLE'))
    p.add_argument('--priority-source', default='')
    p.add_argument('--subject-count', type=int)
    args = p.parse_args(argv)
    feed = load_json_or_unavailable(args.feed)
    if args.health_out:
        if not args.axis or not args.priority_status:
            p.error('--health-out requires --axis and --priority-status')
        value = health(feed, args.axis, args.priority_status, args.subject_count, args.priority_source)
        Path(args.health_out).write_text(json.dumps(value, separators=(',', ':')) + '\n')
        if value['status'] != 'AVAILABLE':
            print('::warning::Commission health unavailable; paid-request priority and run-report feed are reported separately. No fulfillment asserted.')
        return 0
    if not args.mill:
        p.error('--mill is required unless --health-out is used')
    directory = Path(args.mill)
    report = json.loads((directory / 'mill-report.json').read_text())
    value = build_or_unavailable(feed, report, directory)
    (directory / 'commission-run-report.json').write_text(json.dumps(value, indent=2) + '\n')
    if value['status'] == 'UNAVAILABLE':
        print('::warning::Commission feed unavailable; commission-run-report is non-asserting and no fulfillment is asserted.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
