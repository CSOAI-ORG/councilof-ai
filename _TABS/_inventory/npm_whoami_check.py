#!/usr/bin/env python3
"""
npm_whoami_check.py — verify your current npm identity + token scopes.

Why: after the csga_global sever, you must NEVER publish under the wrong
account again. This script:
  1. Runs `npm whoami` to show the current logged-in user
  2. Lists your active tokens (via `npm token list`) so you can see the
     legacy csga_global token if it's still around
  3. Compares against the canonical meok-ai-labs identity
  4. Verifies the two flagship packages (meok-sdk-ts, meok-setup) still
     show the csga_global publisher — so you know your work is needed

Run: python3 npm_whoami_check.py
"""
import json
import subprocess
import sys
import urllib.parse
import urllib.request

CANONICAL = "meok-ai-labs"
LEGACY = "csga_global"


def sh(cmd: str) -> tuple[int, str, str]:
    p = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return p.returncode, p.stdout.strip(), p.stderr.strip()


def main():
    print("=" * 60)
    print("NPM IDENTITY CHECK")
    print("=" * 60)

    # 1. whoami
    rc, who, err = sh("npm whoami")
    if rc == 0 and who:
        print(f"  currently logged in as: {who}")
    else:
        print(f"  NOT LOGGED IN. Run: npm login")
        print(f"  err: {err}")
        return 1

    legacy_warning = False
    if who == LEGACY:
        print(f"  ⚠️  YOU ARE ON THE LEGACY/SEVERED ACCOUNT.")
        print(f"  Run: npm logout")
        print(f"  Then: npm login  (as {CANONICAL})")
        legacy_warning = True
    elif who == CANONICAL:
        print(f"  ✓ Correct identity ({CANONICAL})")
    else:
        print(f"  ? Unexpected identity '{who}' — expected {CANONICAL} or {LEGACY}")
        print(f"  If this is your new authorised account, OK. Otherwise: npm logout")
    # Don't return early — continue with all the checks so the audit captures full state.

    # 2. active tokens
    print()
    print("=" * 60)
    print("ACTIVE NPM TOKENS")
    print("=" * 60)
    rc, tokens, err = sh("npm token list --json 2>/dev/null || npm token list")
    if rc == 0 and tokens:
        try:
            tdata = json.loads(tokens)
            for t in tdata:
                cid = t.get("cidr", [])
                read = t.get("readonly", False)
                publish = "publish" in (t.get("automation") or "")
                created = t.get("created", "?")
                token_id = t.get("token", "?")[:12]
                print(f"  token {token_id}...  readonly={read}  automation={publish}  cidr={cid}  created={created}")
            if not tdata:
                print("  (no tokens — log in to get one)")
        except json.JSONDecodeError:
            print("  raw output:")
            for line in tokens.splitlines():
                print(f"    {line}")
    else:
        print(f"  couldn't list tokens: {err}")

    # 3. canonical-package owner check
    print()
    print("=" * 60)
    print("FLAGSHIP PACKAGE OWNER CHECK")
    print("=" * 60)
    for pkg in ["meok-sdk-ts", "meok-setup"]:
        print(f"  {pkg}:")
        rc, owners, err = sh(f"npm owner ls {pkg}")
        if rc == 0 and owners:
            for line in owners.splitlines():
                print(f"    {line}")
        else:
            print(f"    couldn't list: {err}")

    # 4. csga_global publisher still on flagship?
    print()
    print("=" * 60)
    print("CSGA-GLOBAL STILL PUBLISHING?")
    print("=" * 60)
    for pkg in ["meok-sdk-ts", "meok-setup"]:
        try:
            safe = urllib.parse.quote(pkg, safe="")
            with urllib.request.urlopen(f"https://registry.npmjs.org/{safe}", timeout=10) as r:
                d = json.loads(r.read())
            maint = d.get("maintainers", [])
            csga = [m for m in maint if m.get("name") == LEGACY]
            print(f"  {pkg}@{d.get('dist-tags',{}).get('latest')}: csga_global={'YES ⚠️' if csga else 'no'}")
            if csga:
                print(f"    → still need bulk_npm_owner_add.sh + deprecate")
        except Exception as e:
            print(f"  {pkg}: error: {e}")

    print()
    print("=" * 60)
    print("RECOMMENDED NEXT STEPS")
    print("=" * 60)
    print("  1. If csga_global still owns the packages: bulk_npm_owner_add.sh --execute")
    print("  2. After adding owner: bulk_npm_deprecate.sh --execute")
    print("  3. Publish meok-sdk-ts@3.2.0 + meok-setup@1.2.0 from meok-ai-labs")
    print("  4. Re-run this script to verify clean state")
    return 0


if __name__ == "__main__":
    sys.exit(main())
