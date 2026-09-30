# SPDX-License-Identifier: Apache-2.0
"""Read-only probes of public surfaces -> evidence events. GET only; no auth; no account."""
import hashlib, json, os, sys, time, urllib.error, urllib.request
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import event as E  # noqa: E402,F401

UA = "Mozilla/5.0 (compatible; CSOAI-evidence/0.1; +https://councilof.ai)"


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def get(url, accept="application/json", timeout=30):
    """(status, bytes, sha256, read_at). Network errors are status None, never an invented body."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    t = now()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            b = r.read()
            return r.status, b, hashlib.sha256(b).hexdigest(), t
    except urllib.error.HTTPError as e:
        b = e.read() or b""
        return e.code, b, hashlib.sha256(b).hexdigest(), t
    except Exception as ex:
        return None, repr(ex).encode()[:300], None, t
