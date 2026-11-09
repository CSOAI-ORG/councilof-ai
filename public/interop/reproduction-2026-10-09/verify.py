#!/usr/bin/env python3
"""csoai.card-verify/0.1 — reproduce a GSPC measurement-card verification from public bytes.

Self-contained: Python standard library only. Ed25519 (RFC 8032) is implemented in
this file and self-tested against the RFC's TEST 1 vector before any check runs.

Chain reproduced here (every step observable in public bytes):
  1. fetch the live DID document (did:web:csoai.org) and resolve the signing kid
  2. base64url-decode the JWK "x" -> 32-byte Ed25519 public key
  3. rebuild the canonical preimage of the card body
     preimage_rule: json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')
     card id = sha256(preimage) hex  (a naive hash of the card file bytes does NOT match)
  4. Ed25519-verify the signature OVER THE PREIMAGE BYTES (not over the digest)

Verdicts: VALID / INVALID / UNCHECKABLE, exits 0 / 2 / 3. UNCHECKABLE is
first-class: any fetch failure or missing trust-root material is UNCHECKABLE,
never INVALID, never 0. Measurement, never certification.
"""
import argparse, base64, hashlib, json, sys, urllib.request

# ---------------- Ed25519 (RFC 8032 reference algorithm, stdlib only) ----------------
_p = 2**255 - 19
_n = 2**252 + 27742317777372353535851937790883648493
_d = (-121665 * pow(121666, _p - 2, _p)) % _p
_I = pow(2, (_p - 1) // 4, _p)

def _sha512(m):
    return hashlib.sha512(m).digest()

def _inv(x):
    return pow(x, _p - 2, _p)

def _xrecover(y):
    xx = (y * y - 1) * _inv(_d * y * y + 1)
    x = pow(xx, (_p + 3) // 8, _p)
    if (x * x - xx) % _p != 0:
        x = (x * _I) % _p
    if x % 2 != 0:
        x = _p - x
    return x

_By = 4 * _inv(5)
_B = (_xrecover(_By) % _p, _By % _p)

def _add(P, Q):
    x1, y1 = P
    x2, y2 = Q
    x3 = (x1 * y2 + x2 * y1) * _inv(1 + _d * x1 * x2 * y1 * y2)
    y3 = (y1 * y2 + x1 * x2) * _inv(1 - _d * x1 * x2 * y1 * y2)
    return (x3 % _p, y3 % _p)

def _mul(P, e):
    Q = (0, 1)
    while e > 0:
        if e & 1:
            Q = _add(Q, P)
        P = _add(P, P)
        e >>= 1
    return Q

def _enc(P):
    x, y = P
    bits = [(y >> i) & 1 for i in range(255)] + [x & 1]
    return bytes(sum(bits[i * 8 + j] << j for j in range(8)) for i in range(32))

def _dec(s):
    y = int.from_bytes(s, 'little') & ((1 << 255) - 1)
    x = _xrecover(y)
    if (x & 1) != ((s[31] >> 7) & 1):
        x = _p - x
    return (x, y)

def ed25519_verify(pub32, msg, sig64):
    if len(pub32) != 32 or len(sig64) != 64:
        return False
    try:
        A = _dec(pub32)
        R = _dec(sig64[:32])
    except Exception:
        return False
    S = int.from_bytes(sig64[32:], 'little')
    if S >= _n:
        return False
    h = int.from_bytes(_sha512(sig64[:32] + pub32 + msg), 'little') % _n
    return _mul(_B, S) == _add(R, _mul(A, h))

def ed25519_pub_from_seed(seed32):
    h = _sha512(seed32)
    a = 2**254 + sum(((h[i >> 3] >> (i & 7)) & 1) << i for i in range(3, 254))
    return _enc(_mul(_B, a))

def self_test():
    sk = bytes.fromhex('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60')
    pk = bytes.fromhex('d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a')
    sig = bytes.fromhex('e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b')
    return bool(ed25519_pub_from_seed(sk) == pk and ed25519_verify(pk, b'', sig) and not ed25519_verify(pk, b'x', sig))

# ---------------- verification chain ----------------
CANONICAL_RULE = "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')"
DEFAULT_DID = 'https://councilof.ai/.well-known/did.json'
UA = 'csoai-card-verify/0.1 (reproduction package 2026-10-09; measurement, never certification)'

def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def b64url_decode(s):
    return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))

def resolve_kid(did_doc, kid):
    for vm in did_doc.get('verificationMethod', []):
        vid = vm.get('id') or ''
        jwk = vm.get('publicKeyJwk') or {}
        if vid.endswith('#' + kid) or jwk.get('kid') == kid or jwk.get('kid') == 'csoai-' + kid:
            return vid, jwk
    return None, None

def verify(card_bytes, kid, did_url, out):
    try:
        did_raw = fetch(did_url)
    except Exception:
        out.append('did: FETCH-FAILED %s' % did_url)
        return 'UNCHECKABLE', 'did-fetch-failed'
    did = json.loads(did_raw.decode('utf-8'))
    out.append('did: %s sha256=%s' % (did_url, hashlib.sha256(did_raw).hexdigest()))
    vm_id, jwk = resolve_kid(did, kid)
    if not jwk or not jwk.get('x'):
        out.append('kid: %s UNRESOLVED in %s' % (kid, did_url))
        return 'UNCHECKABLE', 'kid-unresolved'
    pub = b64url_decode(jwk['x'])
    out.append('kid: %s -> %s' % (kid, vm_id))
    out.append('key-x: %s' % jwk['x'])
    try:
        card = json.loads(card_bytes.decode('utf-8'))
        body = card['body']
    except Exception:
        out.append('card: MALFORMED (need a JSON object with "body")')
        return 'INVALID', 'malformed-card'
    rule = card.get('preimage_rule')
    if rule != CANONICAL_RULE:
        out.append('preimage-rule: UNSUPPORTED %r' % (rule,))
        return 'UNCHECKABLE', 'unsupported-preimage-rule'
    preimage = json.dumps(body, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')
    pre_hex = hashlib.sha256(preimage).hexdigest()
    out.append('preimage-rule: canonical-json-v1')
    out.append('preimage-sha256: %s' % pre_hex)
    out.append('naive-file-bytes-sha256: %s (informational; expected NOT to equal the card id)' % hashlib.sha256(card_bytes).hexdigest())
    id_ok = (card.get('id') == pre_hex)
    out.append('id-check: %s' % ('PASS' if id_ok else 'FAIL'))
    try:
        card_pub_hex = card.get('pubkey')
        sig = bytes.fromhex(card.get('signature', ''))
    except Exception:
        out.append('signature-check: FAIL (unparseable signature)')
        return 'INVALID', 'malformed-signature'
    pub_ok = (card_pub_hex == pub.hex())
    out.append('pubkey-check: %s (card.pubkey vs the DID key resolved for %s)' % ('PASS' if pub_ok else 'FAIL', kid))
    sig_ok = ed25519_verify(pub, preimage, sig)
    out.append('signature-check: %s (Ed25519 over the canonical preimage bytes)' % ('PASS' if sig_ok else 'FAIL'))
    if id_ok and pub_ok and sig_ok:
        return 'VALID', ''
    reasons = [n for ok, n in ((id_ok, 'id-mismatch'), (pub_ok, 'pubkey-mismatch'), (sig_ok, 'signature-mismatch')) if not ok]
    return 'INVALID', ','.join(reasons)

def main(argv):
    ap = argparse.ArgumentParser(prog='verify.py', description='GSPC measurement-card verifier (reproduction package). Measurement, never certification.')
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument('--card-url', help='fetch the card JSON from this URL')
    src.add_argument('--card-b64', help='card JSON as base64 (hermetic run; bytes identical to a fixture)')
    src.add_argument('--card-json', help='card JSON inline (or a fetch spec carrying "fetch_url")')
    src.add_argument('--fixture', help='path to a fixture file (card JSON or fetch spec)')
    ap.add_argument('--kid', default='card-attestation-1', help='signing key id to resolve in the DID (default: card-attestation-1)')
    ap.add_argument('--did-url', default=DEFAULT_DID, help='DID document URL (default: the live did:web:csoai.org document)')
    args = ap.parse_args(argv)

    out = ['csoai.card-verify/0.1']
    if not self_test():
        out.append('self-test: rfc8032-TEST1 FAIL')
        out.append('verdict: UNCHECKABLE reason=self-test-failed')
        print('\n'.join(out))
        return 3
    out.append('self-test: rfc8032-TEST1 PASS')

    if args.card_url:
        source, spec, label = 'url', args.card_url, args.card_url
    elif args.card_b64:
        source, spec, label = 'b64', base64.b64decode(args.card_b64), '<base64 payload>'
    elif args.card_json:
        source, spec, label = 'inline', args.card_json.encode('utf-8'), '<inline JSON>'
    else:
        source, spec, label = 'file', open(args.fixture, 'rb').read(), args.fixture
    out.append('source: %s %s' % (source, label))

    card_bytes = None
    if source == 'url':
        try:
            card_bytes = fetch(spec)
        except Exception:
            out.append('card: FETCH-FAILED %s' % spec)
            out.append('verdict: UNCHECKABLE reason=card-fetch-failed')
            print('\n'.join(out))
            return 3
    else:
        probe = json.loads(spec.decode('utf-8'))
        if isinstance(probe, dict) and 'fetch_url' in probe:
            out.append('fetch-spec: %s (fixture expectation: %s)' % (probe.get('fetch_url'), probe.get('expect')))
            try:
                card_bytes = fetch(probe['fetch_url'])
            except Exception:
                out.append('card: FETCH-FAILED %s' % probe['fetch_url'])
                out.append('verdict: UNCHECKABLE reason=card-fetch-failed')
                print('\n'.join(out))
                return 3
        else:
            card_bytes = spec

    verdict, reason = verify(card_bytes, args.kid, args.did_url, out)
    out.append('verdict: %s%s' % (verdict, (' reason=' + reason) if reason else ''))
    print('\n'.join(out))
    return {'VALID': 0, 'INVALID': 2, 'UNCHECKABLE': 3}[verdict]

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
