#!/usr/bin/env python3
"""Compare what was sent to an OTel collector with what its file exporter wrote back.

Stdlib only. Usage: python3 check.py [SENT.otlp.json] [READBACK.jsonl]
Exit 0 only if every sent record reads back with identical eventName, timeUnixNano and attributes.
"""
import hashlib, json, sys

def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def flat(doc):
    out = {}
    for rl in doc['resourceLogs']:
        for sl in rl['scopeLogs']:
            for lr in sl['logRecords']:
                a = {x['key']: list(x['value'].values())[0] for x in lr['attributes']}
                out[a['csoai.event_id']] = {'eventName': lr.get('eventName'), 'timeUnixNano': lr.get('timeUnixNano'), 'attributes': a}
    return out

sent_p = sys.argv[1] if len(sys.argv) > 1 else 'data/openshell.otlp.json'
back_p = sys.argv[2] if len(sys.argv) > 2 else 'data/readback-otelcol-contrib-v0.162.0.jsonl'
sent = flat(json.load(open(sent_p)))
back = {}
for line in open(back_p):
    if line.strip(): back.update(flat(json.loads(line)))
rows = []
for eid, s in sent.items():
    b = back.get(eid)
    rows.append({'event_id': eid, 'read_back': b is not None, 'identical': s == b,
                 'eventName': b and b['eventName'], 'state': b and b['attributes'].get('gen_ai.evaluation.score.label')})
ok = bool(rows) and all(r['identical'] for r in rows)
print(json.dumps({'sent_sha256': sha(sent_p), 'readback_sha256': sha(back_p), 'records_sent': len(sent),
                  'records_read_back': sum(r['read_back'] for r in rows), 'records': rows,
                  'result': 'IDENTICAL' if ok else 'MISMATCH'}, indent=1))
sys.exit(0 if ok else 1)
