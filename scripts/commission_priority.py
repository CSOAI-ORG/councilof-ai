"""Select commissions for this axis; a priority is not a fulfilled measurement."""
import argparse
import json
from pathlib import Path


def select(payload, axis):
    if not isinstance(payload, dict) or payload.get('schema') != 'csoai.commissions/0.1' or payload.get('status') != 'MEASURED' or payload.get('records_unreadable') != 0:
        raise ValueError('commission feed unavailable or unreadable')
    records = payload.get('commissions')
    if not isinstance(records, list):
        raise ValueError('commission records missing')
    subjects = set()
    for record in records:
        if not isinstance(record, dict):
            raise ValueError('invalid commission record')
        subject, requested_axis = record.get('subject'), record.get('axis')
        if not isinstance(subject, str) or not subject.strip() or '\n' in subject or '\r' in subject:
            raise ValueError('invalid commission subject')
        if requested_axis is not None and (not isinstance(requested_axis, str) or not requested_axis.strip()):
            raise ValueError('invalid requested axis')
        if requested_axis is None or requested_axis == axis:
            subjects.add(subject)
    return sorted(subjects)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--axis', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    subjects = select(json.loads(Path(args.input).read_text()), args.axis)
    Path(args.output).write_text(''.join(s + '\n' for s in subjects))
