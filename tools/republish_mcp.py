#!/usr/bin/env python3
"""
Safely rebuild + republish fixed MCP packages to PyPI.

Hard safety gate: a package is ONLY uploaded if, after building, its wheel
installs into a clean venv and `import server` SUCCEEDS (replicates the real
end-user experience). After upload it re-installs from PyPI and re-imports to
confirm the live release works.

Usage:
  python3 tools/republish_mcp.py <pkg-dir> [<pkg-dir> ...]            # publish
  python3 tools/republish_mcp.py --dry-run <pkg-dir> [...]           # build+test only
"""
import os, sys, ast, json, re, subprocess, urllib.request, time

ROOT = os.path.expanduser("~/clawd/mcp-marketplace")
PY = "/opt/homebrew/bin/python3.11"
TEST_VENV = "/tmp/itest_venv"
DRY = "--dry-run" in sys.argv
PKGS = [a for a in sys.argv[1:] if not a.startswith("--")]

def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def pypi_version(pkg):
    try:
        with urllib.request.urlopen(f"https://pypi.org/pypi/{pkg}/json", timeout=10) as r:
            return json.load(r)["info"]["version"]
    except Exception:
        return None

def bump(v):
    a, b, c = (v.split(".") + ["0", "0"])[:3]
    return f"{a}.{b}.{int(c)+1}"

def vmax(a, b):
    return a if tuple(int(x) for x in a.split(".")) >= tuple(int(x) for x in b.split(".")) else b

def ensure_test_venv():
    if not os.path.exists(f"{TEST_VENV}/bin/python"):
        sh([PY, "-m", "venv", TEST_VENV])
    sh([f"{TEST_VENV}/bin/pip", "install", "-q", "mcp"])

def install_test(target, from_pypi=False):
    """Install target (wheel path or 'pkg==ver') --no-deps, import server from /tmp."""
    sh([f"{TEST_VENV}/bin/pip", "uninstall", "-y", "-q", "server"], )  # best-effort clean
    if from_pypi:
        ins = sh([f"{TEST_VENV}/bin/pip", "install", "-q", "--no-deps",
                  "--force-reinstall", target])
    else:
        ins = sh([f"{TEST_VENV}/bin/pip", "install", "-q", "--no-deps",
                  "--force-reinstall", target])
    if ins.returncode != 0:
        return False, ins.stderr.strip()[-200:]
    r = sh([f"{TEST_VENV}/bin/python", "-c", "import server; print('OK')"], cwd="/tmp")
    ok = r.returncode == 0 and "OK" in r.stdout
    return ok, (r.stderr.strip()[-200:] if not ok else "")

def set_version(pyproject, newv):
    src = open(pyproject).read()
    src2 = re.sub(r'(?m)^(version\s*=\s*)["\']([^"\']+)["\']', rf'\g<1>"{newv}"', src, count=1)
    open(pyproject, "w").write(src2)

def main():
    ensure_test_venv()
    results = []
    for d in PKGS:
        d = d.rstrip("/")
        path = os.path.join(ROOT, d)
        pyproject = os.path.join(path, "pyproject.toml")
        srv = os.path.join(path, "server.py")
        st = {"pkg": d}
        if not os.path.exists(srv) or not os.path.exists(pyproject):
            st["status"] = "SKIP no server.py/pyproject"; results.append(st); continue
        # parse gate
        try:
            ast.parse(open(srv).read())
        except SyntaxError as e:
            st["status"] = f"SKIP still-broken L{e.lineno}"; results.append(st); continue
        # pkg name + versions
        pj = open(pyproject).read()
        name = re.search(r'(?m)^name\s*=\s*["\']([^"\']+)["\']', pj).group(1)
        localv = re.search(r'(?m)^version\s*=\s*["\']([^"\']+)["\']', pj).group(1)
        pubv = pypi_version(name)
        newv = vmax(localv, bump(pubv)) if pubv else localv
        st.update(name=name, pub=pubv, new=newv)
        set_version(pyproject, newv)
        # build
        sh(["rm", "-rf", os.path.join(path, "dist"), os.path.join(path, "build")])
        b = sh([PY, "-m", "build", path], cwd=path)
        whl = None
        dd = os.path.join(path, "dist")
        if os.path.isdir(dd):
            whls = [f for f in os.listdir(dd) if f.endswith(".whl")]
            whl = os.path.join(dd, whls[0]) if whls else None
        if not whl:
            st["status"] = "FAIL build"; st["err"] = b.stderr.strip()[-200:]; results.append(st); continue
        # local install-test (the gate)
        ok, err = install_test(whl)
        if not ok:
            st["status"] = "FAIL install-test (NOT published)"; st["err"] = err; results.append(st); continue
        if DRY:
            st["status"] = "DRY ok (built+import OK, not published)"; results.append(st); continue
        # upload
        up = sh(["twine", "upload", "--skip-existing", os.path.join(dd, "*")],
                shell=False) if False else subprocess.run(
                f'twine upload --skip-existing "{dd}"/*', shell=True, capture_output=True, text=True)
        # verify from PyPI (poll for propagation)
        live = False
        for _ in range(8):
            if pypi_version(name) == newv:
                live = True; break
            time.sleep(5)
        vok, verr = (False, "not live")
        if live:
            time.sleep(3)
            vok, verr = install_test(f"{name}=={newv}", from_pypi=True)
        st["status"] = "PUBLISHED+VERIFIED ✅" if vok else f"UPLOADED but verify failed: {verr}"
        results.append(st)

    print("\n==== REPUBLISH RESULTS ====")
    for r in results:
        line = f"{r['pkg']:<34} {r.get('pub','?')}→{r.get('new','?'):<8} {r['status']}"
        if r.get("err"): line += f"  | {r['err']}"
        print(line)

if __name__ == "__main__":
    main()
