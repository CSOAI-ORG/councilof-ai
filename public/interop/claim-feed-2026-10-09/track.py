#!/usr/bin/env python3
"""csoai.maintained-claim tracker 0.1 — is this maintained claim still current?

stdlib only. Reads a csoai.maintained-claim/0.1 envelope, consults SUPERSEDED.jsonl
for dated supersession provenance, then reads the claim's own source and compares.

States: FRESH / STALE / SUPERSEDED / WITHDRAWN / UNVERIFIABLE
Exits:  0 = FRESH.  2 = STALE, SUPERSEDED or WITHDRAWN.  3 = UNVERIFIABLE.
A fetch failure is UNVERIFIABLE — never STALE, never 0 and never null.
Budget, expiry and retry policy are OUT OF SCOPE here (see README.md).
Measurement, never certification.
"""
import argparse, json, os, sys, urllib.request

STATE_EXIT = {'FRESH': 0, 'STALE': 2, 'SUPERSEDED': 2, 'WITHDRAWN': 2, 'UNVERIFIABLE': 3}

def dotted(obj, path):
    cur = obj
    for part in path.split('.'):
        if not isinstance(cur, dict) or part not in cur:
            return 'UNMEASURED'
        cur = cur[part]
    return cur

def read_ledger(path, claim_id):
    """Newest dated supersession record for this claim id, or None."""
    if not path or not os.path.exists(path):
        return None
    best = None
    with open(path, 'r', encoding='utf-8') as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            if rec.get('supersedes') == claim_id and rec.get('new_state') in ('SUPERSEDED', 'WITHDRAWN'):
                if best is None or (rec.get('date') or '') >= (best.get('date') or ''):
                    best = rec
    return best

def main(argv):
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description='Track a csoai.maintained-claim/0.1 claim. Exits 0 FRESH / 2 not-current / 3 UNVERIFIABLE.')
    ap.add_argument('--claim', default=os.path.join(here, 'claim.json'), help='path to the claim envelope')
    ap.add_argument('--claim-json', default=None, help='claim envelope inline (hermetic runs/tests)')
    ap.add_argument('--ledger', default=os.path.join(here, 'SUPERSEDED.jsonl'), help='supersession ledger path')
    ap.add_argument('--source-url', default=None, help='override the claim source URL (tests)')
    ap.add_argument('--observed-json', default=None, help='use these readback bytes instead of fetching (hermetic tests)')
    args = ap.parse_args(argv)

    claim = json.loads(args.claim_json) if args.claim_json else json.load(open(args.claim, 'r', encoding='utf-8'))
    result = {'schema': 'csoai.maintained-claim-tracker/0.1', 'claim': claim.get('id'),
              'assertion': claim.get('assertion'), 'as_of': claim.get('as_of')}

    sup = read_ledger(args.ledger, claim.get('id'))
    if sup:
        result['state'] = sup['new_state']
        result['reason'] = 'dated-supersession-record'
        result['supersession'] = {k: sup.get(k) for k in ('date', 'correction_id', 'provenance', 'note') if k in sup}
        result['observed'] = 'UNMEASURED'
        result['exit'] = STATE_EXIT[result['state']]
        print(json.dumps(result, ensure_ascii=False, sort_keys=True))
        return result['exit']

    url = args.source_url or claim.get('source')
    if args.observed_json is not None:
        observed_obj = json.loads(args.observed_json)
        result['readback'] = {'method': 'observed-json', 'url': url}
    else:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'csoai-maintained-claim-tracker/0.1'})
            with urllib.request.urlopen(req, timeout=20) as resp:
                raw = resp.read()
            observed_obj = json.loads(raw.decode('utf-8'))
            result['readback'] = {'method': 'fetch', 'url': url, 'bytes': len(raw)}
        except Exception:
            result['state'] = 'UNVERIFIABLE'
            result['reason'] = 'fetch-failed'
            result['observed'] = 'UNMEASURED'
            result['exit'] = STATE_EXIT['UNVERIFIABLE']
            print(json.dumps(result, ensure_ascii=False, sort_keys=True))
            return result['exit']

    asserted = claim.get('asserted_values', {})
    observed = {k: dotted(observed_obj, k) for k in claim.get('source_fields', list(asserted))}
    result['asserted'] = asserted
    result['observed'] = observed
    if asserted and all(observed.get(k) == v for k, v in asserted.items()):
        result['state'] = 'FRESH'
    else:
        result['state'] = 'STALE'
        result['reason'] = 'readback-no-longer-matches-asserted-values'
    result['exit'] = STATE_EXIT[result['state']]
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return result['exit']

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
