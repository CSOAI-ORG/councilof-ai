#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Package registry version vs the repository's latest release tag -> one evidence event per package.

    python3 probe/release_parity.py TARGETS.json > events.jsonl
    TARGETS.json: [{"registry": "pypi"|"npm", "package": "garak", "repo": "NVIDIA/garak"}, ...]

Declared: the registry's latest version (PyPI JSON API / npm registry `dist-tags.latest`).
Observed: the repo's latest GitHub release tag (else newest tag), read anonymously.
CONSISTENT when they name the same version (a leading "v" is ignored), DIVERGENT when they differ, UNCHECKABLE
when either read fails. The negative control compares the registry version with a deliberately wrong tag
("0.0.0-csoai-control") and must come back DIVERGENT. A difference is a fact about two public statements,
not a defect: a registry may lag a tag, or a tag may exist without a release.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from probe import E, get  # noqa: E402


def norm(v):
    return re.sub(r"^v", "", (v or "").strip())


def registry_version(t):
    if t["registry"] == "pypi":
        url = f"https://pypi.org/pypi/{t['package']}/json"
        st, b, sha, at = get(url)
        v = json.loads(b)["info"]["version"] if st == 200 else None
    else:
        url = f"https://registry.npmjs.org/{t['package'].replace('/', '%2F')}"
        st, b, sha, at = get(url)
        v = json.loads(b).get("dist-tags", {}).get("latest") if st == 200 else None
    return url, st, sha, at, v


def repo_tag(repo):
    url = f"https://api.github.com/repos/{repo}/releases/latest"
    st, b, sha, at = get(url, accept="application/vnd.github+json")
    if st == 200:
        return url, st, sha, at, json.loads(b).get("tag_name"), "latest release"
    url = f"https://api.github.com/repos/{repo}/tags?per_page=1"
    st, b, sha, at = get(url, accept="application/vnd.github+json")
    tags = json.loads(b) if st == 200 else []
    return url, st, sha, at, (tags[0]["name"] if tags else None), "newest tag (no release)"


def measure(t):
    rurl, rst, rsha, rat, rv = registry_version(t)
    gurl, gst, gsha, gat, gv, gkind = repo_tag(t["repo"])
    if rv is None or gv is None:
        state, ctl = "UNCHECKABLE", {"id": "wrong-tag", "expected": None, "got": "NOT_RUN"}
    else:
        state = "CONSISTENT" if norm(rv) == norm(gv) else "DIVERGENT"
        c = "CONSISTENT" if norm(rv) == norm("0.0.0-csoai-control") else "DIVERGENT"
        ctl = {"id": "wrong-tag", "expected": "DIVERGENT", "got": c}
    return E.build(
        subject={"kind": "package", "locator": rurl.replace("/json", "").replace("pypi.org/pypi/", "pypi.org/project/"),
                 "declared_by": f"{t['registry']} registry"},
        claim={"text": f"The {t['registry']} registry's latest version of {t['package']} is {rv}; github.com/{t['repo']} {gkind} is {gv}.",
               "source_url": rurl, "source_sha256": rsha, "read_at": rat},
        method={"id": "release-parity", "version": "0.1", "code_sha256": None, "holder": "csoai"},
        declared={"registry": t["registry"], "package": t["package"], "version": rv, "http": rst},
        observed={"repo": t["repo"], "tag": gv, "tag_kind": gkind, "url": gurl, "http": gst, "sha256": gsha, "read_at": gat},
        state=state, value=None, negative_control=ctl,
        limits=["Two public version statements compared; nothing about the package's behaviour or safety.",
                "A mismatch can be ordinary release lag; it is recorded, not judged."])


def main(argv=None):
    for t in json.load(open((argv or sys.argv[1:])[0])):
        sys.stdout.write(json.dumps(measure(t), ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
