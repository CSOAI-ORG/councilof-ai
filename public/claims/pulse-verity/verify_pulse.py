#!/usr/bin/env python3
"""Independent check of Pulse Verity v1+v2 signatures against the separately hosted key ring.
Uses only: key ring file, sample files. Stdlib + `cryptography`. Writes verify_result.json."""
import json, base64, hashlib, sys, datetime, copy
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from cryptography.exceptions import InvalidSignature
D = sys.argv[1] if len(sys.argv) > 1 else '.'
ring = json.load(open(f'{D}/keyring.json'))
keys = {k['kid']: serialization.load_pem_public_key(k['publicKeyPem'].encode()) for k in ring['keys']}
api = json.load(open(f'{D}/pubkey.json'))
FIELDS = api['canonicalV2Fields']['index']

def ok(kid, sig_b64, msg: bytes):
    raw = base64.b64decode(sig_b64)
    if len(raw) != 64: return False
    der = encode_dss_signature(int.from_bytes(raw[:32], 'big'), int.from_bytes(raw[32:], 'big'))
    try:
        keys[kid].verify(der, msg, ec.ECDSA(hashes.SHA256())); return True
    except (InvalidSignature, KeyError):
        return False

def get(rec, path):
    cur = rec
    for p in path.split('.'):
        if not isinstance(cur, dict) or p not in cur: return None
        cur = cur[p]
    return cur

def flip_one_byte(b: bytes, idx: int) -> bytes:
    a = bytearray(b); a[idx] ^= 0x01; return bytes(a)

out = {'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
       'keyring_sha256': hashlib.sha256(open(f'{D}/keyring.json','rb').read()).hexdigest(),
       'keyring_kids': list(keys), 'keyring_matches_api': None, 'samples': []}
api_keys = {k['kid']: k['pem'] for k in api['verificationKeys']}
out['keyring_matches_api'] = {k['kid']: api_keys.get(k['kid']) == k['publicKeyPem'] for k in ring['keys']} | {
    'same_kid_set': set(api_keys) == set(keys), 'same_activeKid': api['activeKid'] == ring['activeKid']}
for sym in ('btc', 'eth', 'sol'):
    fn = f'{D}/sample_{sym}.json'
    raw = open(fn, 'rb').read(); rec = json.loads(raw)
    r = {'file': f'sample_{sym}.json', 'sha256': hashlib.sha256(raw).hexdigest(), 'symbol': rec['symbol'], 'at': rec['at'],
         'v1_kid': rec['kid'], 'v2_kid': rec['v2']['kid'], 'kid_in_keyring': rec['v2']['kid'] in keys}
    v1msg = f"pulse-index-v1\n{rec['symbol']}\n{rec['priceText']}\n{rec['at']}\n{rec['grade']}".encode()
    r['v1_valid'] = ok(rec['kid'], rec['signature'], v1msg)
    can = rec['v2']['canonical'].encode('utf-8')
    r['v2_valid_as_given'] = ok(rec['v2']['kid'], rec['v2']['signature'], can)
    lines = rec['v2']['canonical'].split('\n')
    r['v2_header_ok'] = lines[0] == 'pulse-index-v2'
    paths = [l.split('=', 1)[0] for l in lines[1:]]
    r['v2_paths_equal_published_field_order'] = paths == FIELDS
    mism = [l.split('=',1)[0] for l in lines[1:] if json.loads(l.split('=',1)[1]) != get(rec, l.split('=',1)[0])]
    r['v2_line_vs_field_mismatches'] = mism
    # independent rebuild from the JSON fields (Python serialisation); informative only
    rebuilt = 'pulse-index-v2\n' + '\n'.join(f"{p}={json.dumps(get(rec,p), separators=(',',':'), ensure_ascii=False)}" for p in FIELDS)
    r['v2_rebuilt_from_fields_equals_given'] = rebuilt == rec['v2']['canonical']
    r['v2_rebuilt_verifies'] = ok(rec['v2']['kid'], rec['v2']['signature'], rebuilt.encode())
    # tamper controls
    i = rec['v2']['canonical'].index('\nsources=') + len('\nsources=')
    t1 = flip_one_byte(can, i)          # one byte inside the sources value
    r['tamper_v2_canonical_one_byte'] = {'offset': i, 'before': chr(can[i]), 'after': chr(t1[i]), 'valid': ok(rec['v2']['kid'], rec['v2']['signature'], t1)}
    j = v1msg.index(rec['priceText'].encode()) + len(rec['priceText']) - 1
    t2 = flip_one_byte(v1msg, j)
    r['tamper_v1_priceText_last_byte'] = {'valid': ok(rec['kid'], rec['signature'], t2)}
    sig = bytearray(base64.b64decode(rec['v2']['signature'])); sig[10] ^= 0x01
    r['tamper_v2_signature_one_byte'] = {'valid': ok(rec['v2']['kid'], base64.b64encode(bytes(sig)).decode(), can)}
    # field-level tamper: change sources in the JSON, keep the signed canonical -> line check must catch it
    rec2 = copy.deepcopy(rec); rec2['sources'] = rec['sources'] + 1
    r['tamper_json_sources_detected_by_line_check'] = any(json.loads(l.split('=',1)[1]) != get(rec2, l.split('=',1)[0]) for l in lines[1:])
    out['samples'].append(r)
out['all_pass'] = all(s['v1_valid'] and s['v2_valid_as_given'] and s['kid_in_keyring'] and s['v2_header_ok'] and s['v2_paths_equal_published_field_order']
                      and not s['v2_line_vs_field_mismatches'] and not s['tamper_v2_canonical_one_byte']['valid']
                      and not s['tamper_v1_priceText_last_byte']['valid'] and not s['tamper_v2_signature_one_byte']['valid']
                      and s['tamper_json_sources_detected_by_line_check'] for s in out['samples'])
json.dump(out, open(f'{D}/verify_result.json', 'w'), indent=2)
print(json.dumps(out, indent=2))
