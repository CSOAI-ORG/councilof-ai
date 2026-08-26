"""_ed25519_pure.py — Ed25519 signature VERIFICATION only, pure Python, stdlib only.

This exists so verify_any_card.py has zero dependencies: an auditor can create an
empty virtualenv, copy two files in, and check an estate artifact. No pip install,
no network, no estate packages.

Adapted from the RFC 8032 reference implementation (public domain). Verification
only -- there is deliberately no signing code path in this file.

This is not constant-time. That is fine: verification uses only public data.
"""
import hashlib

b = 256
q = 2 ** 255 - 19
l = 2 ** 252 + 27742317777372353535851937790883648493


def _H(m):
    return hashlib.sha512(m).digest()


def _inv(x):
    return pow(x, q - 2, q)


d = -121665 * _inv(121666) % q
I = pow(2, (q - 1) // 4, q)


def _xrecover(y):
    xx = (y * y - 1) * _inv(d * y * y + 1)
    x = pow(xx, (q + 3) // 8, q)
    if (x * x - xx) % q != 0:
        x = (x * I) % q
    if x % 2 != 0:
        x = q - x
    return x


By = 4 * _inv(5) % q
Bx = _xrecover(By)
B = (Bx % q, By % q, 1, (Bx * By) % q)
ident = (0, 1, 1, 0)


def _add(P, Q):
    x1, y1, z1, t1 = P
    x2, y2, z2, t2 = Q
    a = (y1 - x1) * (y2 - x2) % q
    bb = (y1 + x1) * (y2 + x2) % q
    c = t1 * 2 * d * t2 % q
    dd = z1 * 2 * z2 % q
    e, f, g, h = bb - a, dd - c, dd + c, bb + a
    return (e * f % q, g * h % q, f * g % q, e * h % q)


def _double(P):
    x1, y1, z1, _ = P
    a = x1 * x1 % q
    bb = y1 * y1 % q
    c = 2 * z1 * z1 % q
    e = ((x1 + y1) * (x1 + y1) - a - bb) % q
    g = -a + bb
    f = g - c
    h = -a - bb
    return (e * f % q, g * h % q, f * g % q, e * h % q)


def _scalarmult(P, e):
    if e == 0:
        return ident
    Q = _scalarmult(P, e // 2)
    Q = _double(Q)
    if e & 1:
        Q = _add(Q, P)
    return Q


def _encodeint(y):
    return y.to_bytes(b // 8, "little")


def _decodeint(s):
    return int.from_bytes(s, "little")


def _decodepoint(s):
    y = int.from_bytes(s, "little") & ((1 << 255) - 1)
    x = _xrecover(y)
    if x & 1 != (s[31] >> 7) & 1:
        x = q - x
    P = (x, y, 1, (x * y) % q)
    if not _isoncurve(P):
        raise ValueError("decoding point that is not on curve")
    return P


def _isoncurve(P):
    x, y, z, t = P
    return (z % q != 0
            and x * y % q == z * t % q
            and (y * y - x * x - z * z - d * t * t) % q == 0)


def _equal(P, Q):
    x1, y1, z1, _ = P
    x2, y2, z2, _ = Q
    return (x1 * z2 - x2 * z1) % q == 0 and (y1 * z2 - y2 * z1) % q == 0


def verify(public_key: bytes, signature: bytes, message: bytes) -> bool:
    """Return True iff `signature` is a valid Ed25519 signature over `message`."""
    if len(signature) != 64 or len(public_key) != 32:
        return False
    try:
        R = _decodepoint(signature[:32])
        A = _decodepoint(public_key)
    except Exception:
        return False
    S = _decodeint(signature[32:])
    if S >= l:
        return False
    h = _decodeint(_H(signature[:32] + public_key + message)) % l
    return _equal(_scalarmult(B, S), _add(R, _scalarmult(A, h)))
