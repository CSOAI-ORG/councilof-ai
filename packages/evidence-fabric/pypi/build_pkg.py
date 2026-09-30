#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Assemble the PyPI distribution `csoai-evidence-fabric` from the canonical sources one directory up.

    python3 build_pkg.py OUT_DIR          # writes OUT_DIR/{pyproject.toml,README.md,LICENSE,src/csoai_evidence_fabric/...}
    python3 -m build OUT_DIR              # sdist + wheel in OUT_DIR/dist

The canonical files are copied, never edited in place. Only two mechanical rewrites are made, so the modules
import as one package instead of through sys.path:
  * `import event as E`            -> `from csoai_evidence_fabric import event as E`
  * `from render import ...`       -> `from csoai_evidence_fabric.render import ...`
  * `sys.path.insert(0, ...)`      -> `pass`
Everything else is byte-for-byte the canonical code; `check_install.py` checks the packaged renderers against
the canonical golden files.
"""
import os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
PKG = "csoai_evidence_fabric"
MODULES = ["event.py", "verify.py", "batch.py",
           "render/__init__.py", "render/ocsf.py", "render/otel.py", "render/sarif.py", "render/intoto.py",
           "render/ecs_hec.py", "render/w3c_acr01.py",
           "ingest/__init__.py", "ingest/sarif_in.py", "ingest/garak_in.py", "ingest/safe_in.py", "ingest/openshell_in.py"]
DATA_DIRS = ["schema", "vendor"]


def rewrite(text):
    text = re.sub(r"^(\s*)import event as E\b", rf"\1from {PKG} import event as E", text, flags=re.M)
    text = re.sub(r"^(\s*)from render import ", rf"\1from {PKG}.render import ", text, flags=re.M)
    text = re.sub(r"^(\s*)from ingest import ", rf"\1from {PKG}.ingest import ", text, flags=re.M)
    text = re.sub(r"^(\s*)sys\.path\.insert\(0, [^\n]*\)\s*$", r"\1pass", text, flags=re.M)
    return text


def main(out):
    if os.path.exists(out):
        shutil.rmtree(out)
    dst = os.path.join(out, "src", PKG)
    for rel in MODULES:
        s = os.path.join(SRC, rel)
        d = os.path.join(dst, rel)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        t = rewrite(open(s, encoding="utf-8").read())
        if re.search(r"^\s*(import event|from render import|from ingest import|sys\.path\.insert)", t, re.M):
            sys.exit(f"unrewritten import left in {rel}")
        open(d, "w", encoding="utf-8").write(t)
    open(os.path.join(dst, "__init__.py"), "w").write(
        '# SPDX-License-Identifier: Apache-2.0\n"""csoai.evidence-event/0.1: schema, carriers (OCSF, OTel, SARIF, in-toto, ECS/HEC, '
        'W3C ACR v0.1) and an offline verifier."""\n__version__ = "%s"\n' % VERSION)
    shutil.copy(os.path.join(HERE, "cli.py"), os.path.join(dst, "cli.py"))
    for dd in DATA_DIRS:
        shutil.copytree(os.path.join(SRC, dd), os.path.join(dst, dd))
    for f in ("pyproject.toml", "README.md"):
        shutil.copy(os.path.join(HERE, f), os.path.join(out, f))
    shutil.copy(os.path.join(SRC, "LICENSE"), os.path.join(out, "LICENSE"))
    print(out)


VERSION = re.search(r'^version = "([^"]+)"', open(os.path.join(HERE, "pyproject.toml")).read(), re.M).group(1)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "build"))
