#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Licence a package registry declares vs the licence GitHub detects in the source repo -> one event per package.

    python3 probe/licence_parity.py TARGETS.json > events.jsonl
    TARGETS.json: [{"registry": "pypi"|"npm", "package": "falcon-mcp", "repo": "CrowdStrike/falcon-mcp"}]

CONSISTENT: same SPDX id (case-insensitive; a PyPI classifier "License :: OSI Approved :: MIT License" reads as MIT).
DIVERGENT: two different ids. UNCHECKABLE: either side absent or NOASSERTION (GitHub could not identify the file).
Negative control: the registry id against a fabricated id must DIVERGE. Not legal advice; ids only.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from probe import E, get  # noqa: E402

CLASSIFIER = {"MIT License": "MIT", "Apache Software License": "Apache-2.0", "BSD License": "BSD", "ISC License (ISCL)": "ISC"}


def registry_licence(t):
    if t["registry"] == "pypi":
        url = f"https://pypi.org/pypi/{t['package']}/json"
        st, b, sha, at = get(url)
        if st != 200:
            return url, sha, at, None
        i = json.loads(b)["info"]
        lic = i.get("license_expression") or (i.get("license") if i.get("license") and len(i.get("license")) < 40 else None)
        if not lic:
            for c in i.get("classifiers", []):
                if c.startswith("License :: OSI Approved :: "):
                    lic = CLASSIFIER.get(c.split(" :: ")[-1], c.split(" :: ")[-1])
        return url, sha, at, lic
    url = f"https://registry.npmjs.org/{t['package'].replace('/', '%2F')}/latest"
    st, b, sha, at = get(url)
    return url, sha, at, (json.loads(b).get("license") if st == 200 else None)


def norm(x):
    return re.sub(r"[^a-z0-9.+-]", "", (x or "").lower())


def measure(t):
    rurl, rsha, rat, rl = registry_licence(t)
    st, b, gsha, gat = get(f"https://api.github.com/repos/{t['repo']}", accept="application/vnd.github+json")
    gl = ((json.loads(b).get("license") or {}).get("spdx_id") if st == 200 else None)
    if not rl or not gl or gl == "NOASSERTION":
        state, ctl = "UNCHECKABLE", {"id": "fabricated-licence", "expected": None, "got": "NOT_RUN"}
    else:
        state = "CONSISTENT" if norm(rl) == norm(gl) else "DIVERGENT"
        ctl = {"id": "fabricated-licence", "expected": "DIVERGENT", "got": "CONSISTENT" if norm(rl) == norm("CSOAI-Control-1.0") else "DIVERGENT"}
    return E.build(
        subject={"kind": "package", "locator": f"{t['registry']}:{t['package']}", "declared_by": f"{t['registry']} registry metadata"},
        claim={"text": f"{t['registry']} declares the licence of {t['package']} as {rl}; GitHub detects {gl} in {t['repo']}.",
               "source_url": rurl, "source_sha256": rsha, "read_at": rat},
        method={"id": "licence-parity", "version": "0.1", "code_sha256": None, "holder": "csoai"},
        declared={"registry": t["registry"], "package": t["package"], "licence": rl},
        observed={"repo": t["repo"], "github_spdx": gl, "http": st, "sha256": gsha, "read_at": gat},
        state=state, value=None, negative_control=ctl,
        limits=["SPDX identifiers compared as strings; not legal advice and not a reading of the licence text.",
                "NOASSERTION means GitHub could not identify the licence file; it is UNCHECKABLE, not a finding."])


def main(argv=None):
    for t in json.load(open((argv or sys.argv[1:])[0])):
        sys.stdout.write(json.dumps(measure(t), ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
