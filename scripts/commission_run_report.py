"""Link commissions to observed mill outputs without claiming signed delivery."""
import argparse
import hashlib
import json
from pathlib import Path


def build(feed, report, directory):
    if feed.get('schema') != 'csoai.commissions/0.1' or feed.get('status') != 'MEASURED' or feed.get('records_unreadable') != 0 or not isinstance(feed.get('commissions'), list):
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
    return {'schema':'csoai.commission-run-report/0.1','as_of':report.get('as_of'),
            'axis':axis,'commissions':result,
            'meaning':'Run observations only. Staging does not prove signing, admission, root inclusion or customer delivery.'}


if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('--feed',required=True);p.add_argument('--mill',required=True)
    args=p.parse_args();directory=Path(args.mill)
    value=build(json.loads(Path(args.feed).read_text()),json.loads((directory/'mill-report.json').read_text()),directory)
    (directory/'commission-run-report.json').write_text(json.dumps(value,indent=2)+'\n')
