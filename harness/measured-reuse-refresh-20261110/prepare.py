"""Construct the exact tested candidate; no network, installation or live writes."""
from pathlib import Path
import hashlib, shutil
ROOT = Path(__file__).resolve().parent
BASE = '9f2249277c9897788844fe02b8397180e8383dcb4ef381490b39a65410aa4a37'
CANDIDATE = 'a0332c36471bf2b726ee00bdcac7733d7b98e2991954b6beb61b6b103e635e69'
old = "    def run(self, ctx: HostContext, req: Request, *, compute: Callable, verify: Callable) -> dict:\n"
new = '''    def run(self, ctx: HostContext, req: Request, *, compute: Callable, verify: Callable,
            force_refresh: bool = False) -> dict:
        """Refresh is a host execution preference, never an authority grant.

        True skips result lookup but preserves the existing compute, validation,
        source/access recheck and cache-population path. Default behaviour is unchanged.
        """
        if type(force_refresh) is not bool:
            raise Refused('INVALID_REFRESH_MODE')
'''
old_lookup = "            row = self.db.execute('SELECT payload,payload_sha,expires FROM result_cache WHERE key=?', (key,)).fetchone()\n"
new_lookup = "            row = (None if force_refresh else self.db.execute(\n                'SELECT payload,payload_sha,expires FROM result_cache WHERE key=?', (key,)).fetchone())\n"
raw = (ROOT/'baseline/memory_venturi.py').read_bytes()
if hashlib.sha256(raw).hexdigest() != BASE:
    raise SystemExit('BASELINE_HASH_MISMATCH')
src = raw.decode('utf-8')
if src.count(old) != 1 or src.count(old_lookup) != 1:
    raise SystemExit('PATCH_CONTEXT_MISMATCH')
result = src.replace(old, new).replace(old_lookup, new_lookup).encode('utf-8')
if hashlib.sha256(result).hexdigest() != CANDIDATE:
    raise SystemExit('CANDIDATE_HASH_MISMATCH')
for target, content in [(ROOT/'candidate/memory_venturi.py', result),
                        (ROOT/'candidate/test_memory_venturi.py', (ROOT/'baseline/test_memory_venturi.py').read_bytes())]:
    if target.exists() and target.read_bytes() != content:
        raise SystemExit('REFUSE_TO_OVERWRITE_CHANGED_FILE: ' + target.name)
    target.write_bytes(content)
print('Exact candidate prepared; original source remains unchanged.')
