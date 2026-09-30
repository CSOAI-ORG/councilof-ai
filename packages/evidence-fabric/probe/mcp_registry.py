#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""What the official MCP Registry lists for a server vs what the package registry or the live endpoint says.

    python3 probe/mcp_registry.py --name io.github.X/y --workdir DIR --census-dir scripts/census > events.jsonl

For the registry's isLatest entry of --name:
  * each listed package (pypi / npm): registry server.version vs the package registry's latest version;
  * each listed remote URL: run the census probe scripts/census/mcp-remote-probe.py (robots.txt, discover/initialize
    + tools/list only, never tools/call, never auth) and compare serverInfo.version with server.version.
  * no remote listed: ONE event, UNMEASURED, "no public remote endpoint listed" -- a remote probe needs a remote.
CONSISTENT: same version. DIVERGENT: different version, or the endpoint answered but not as MCP.
UNMEASURED: auth required, unreachable, timeout. Negative control: the observed version against a fabricated
version must DIVERGE.
"""
import argparse, gzip, json, os, subprocess, sys, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from probe import E, get, now  # noqa: E402

REG = "https://registry.modelcontextprotocol.io/v0.1/servers"
FAKE = "0.0.0-csoai-control"


def latest_entry(name):
    """The search matches substrings; a full name with '/' can page past its own entries, so try the short name too."""
    for term in (name, name.rsplit("/", 1)[-1]):
        url = f"{REG}?search={urllib.parse.quote(term)}&limit=100"
        st, b, sha, at = get(url)
        ss = json.loads(b).get("servers", []) if st == 200 else []
        for s in ss:
            meta = (s.get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {}
            if s["server"]["name"] == name and meta.get("isLatest"):
                return url, sha, at, s["server"]
    return url, sha, at, None


def ctl(observed_version):
    return {"id": "fabricated-version", "expected": "DIVERGENT", "got": "CONSISTENT" if observed_version == FAKE else "DIVERGENT"}


def oci_match(ident, version):
    """Public ghcr.io image: anonymous pull token, then tags/list. Returns (url, found) where found is
    'tag:<t>' if a tag equals the version or carries its build suffix (+<sha> -> '-<sha>' in the tag), else 'absent'."""
    repo = ident.split("/", 1)[1].split(":", 1)[0]
    st, b, _, _ = get(f"https://ghcr.io/token?scope=repository:{repo}:pull")
    if st != 200:
        return f"https://ghcr.io/v2/{repo}/tags/list", None
    tok = json.loads(b)["token"]
    import urllib.request
    u = f"https://ghcr.io/v2/{repo}/tags/list?n=1000"
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"Authorization": f"Bearer {tok}", "User-Agent": "csoai-evidence"}), timeout=30) as r:
            tags = json.loads(r.read()).get("tags") or []
    except Exception:
        return u, None
    build = version.split("+", 1)[1] if "+" in version else None
    for t in tags:
        if t == version or t == version.replace("+", "-") or (build and t.endswith("-" + build)):
            return u, "tag:" + t
    return u, "absent"


def package_events(name, srv, rurl, rsha, rat):
    out = []
    for p in srv.get("packages") or []:
        rt, ident = p.get("registryType") or p.get("registry_type"), p.get("identifier")
        if rt == "pypi":
            u = f"https://pypi.org/pypi/{ident}/json"; st, b, sha, at = get(u); pv = json.loads(b)["info"]["version"] if st == 200 else None
        elif rt == "npm":
            u = f"https://registry.npmjs.org/{ident.replace('/', '%2F')}"; st, b, sha, at = get(u); pv = json.loads(b).get("dist-tags", {}).get("latest") if st == 200 else None
        elif rt == "oci" and ident.startswith("ghcr.io/"):
            u, pv = oci_match(ident, srv["version"])
            sha, at = None, now()
        else:
            continue
        state = "UNCHECKABLE" if pv is None else ("CONSISTENT" if pv == srv["version"] or (rt == "oci" and pv.startswith("tag:")) else "DIVERGENT")
        out.append(E.build(
            subject={"kind": "mcp_server", "locator": f"mcp-registry:{name}", "declared_by": "registry.modelcontextprotocol.io isLatest entry"},
            claim={"text": (f"The MCP Registry's latest entry for {name} is version {srv['version']}, packaged as {rt}:{ident}; "
                            + (f"the image registry's matching tag: {pv}." if rt == "oci" else f"{rt} lists {pv} as latest.")),
                   "source_url": rurl, "source_sha256": rsha, "read_at": rat},
            method={"id": "mcp-registry-package-parity", "version": "0.1", "code_sha256": None, "holder": "csoai"},
            declared={"registry_version": srv["version"], "package": f"{rt}:{ident}"}, observed={"package_latest": pv, "url": u, "sha256": sha, "read_at": at},
            state=state, value=None,
            negative_control=ctl(pv) if pv else {"id": "fabricated-version", "expected": None, "got": "NOT_RUN"},
            limits=["Two public version statements; a package registry may lead the MCP Registry by a release. Nothing about behaviour."]))
    return out


def remote_events(name, srv, rurl, rsha, rat, workdir, census_dir):
    remotes = [r.get("url") for r in srv.get("remotes") or [] if r.get("url")]
    if not remotes:
        return [E.build(
            subject={"kind": "mcp_server", "locator": f"mcp-registry:{name}", "declared_by": "registry.modelcontextprotocol.io isLatest entry"},
            claim={"text": f"The MCP Registry's latest entry for {name} lists no remote endpoint.", "source_url": rurl, "source_sha256": rsha, "read_at": rat},
            method={"id": "mcp-remote-probe", "version": "census", "code_sha256": None, "holder": "csoai"},
            declared={"remotes": []}, observed={"probed": False, "reason": "NONE_PUBLIC: nothing to probe"},
            state="UNMEASURED", value=None, negative_control={"id": None, "expected": None, "got": "NOT_RUN"},
            limits=["A remote probe (and an effect-binding probe) needs a public remote endpoint; none is listed, so nothing was measured."])]
    os.makedirs(workdir, exist_ok=True)
    plan = os.path.join(workdir, "plan.jsonl.gz")
    with gzip.open(plan, "wt") as f:
        for i, u in enumerate(remotes):
            f.write(json.dumps({"rank": i, "endpoint": u, "ranked_by": "csoai-bridge", "transports": ["streamable-http"]}) + "\n")
    out_dir = os.path.join(workdir, "probe")
    subprocess.run([sys.executable, os.path.join(census_dir, "mcp-remote-probe.py"), "--plan", plan, "--out", out_dir, "--workers", "1", "--budget-s", "300"],
                   check=True, capture_output=True)
    rows = [json.loads(l) for l in gzip.open(os.path.join(out_dir, "results.jsonl.gz"), "rt")]
    out = []
    for r in rows:
        si = r.get("serverInfo") or {}
        sv = si.get("version")
        s = r.get("state")
        if s == "RESPONDED":
            state = "CONSISTENT" if sv == srv["version"] else "DIVERGENT"
        elif s == "NOT_MCP":
            state = "DIVERGENT"
        else:
            state = "UNMEASURED"
        out.append(E.build(
            subject={"kind": "mcp_server", "locator": r.get("endpoint"), "declared_by": f"registry.modelcontextprotocol.io {name} {srv['version']}"},
            claim={"text": f"The MCP Registry lists {r.get('endpoint')} as the remote for {name} version {srv['version']}.",
                   "source_url": rurl, "source_sha256": rsha, "read_at": r.get("finished") or rat},
            method={"id": "mcp-remote-probe", "version": "census mcp-remote-probe.py", "code_sha256": None, "holder": "csoai"},
            declared={"registry_version": srv["version"], "remote": r.get("endpoint")},
            observed={"state": s, "serverInfo": si, "era": r.get("era"), "tools_count": r.get("tools_count"),
                      "tool_names_sha256": r.get("tool_names_sha256"), "reason": r.get("reason")},
            state=state, value=None,
            negative_control=ctl(sv) if s == "RESPONDED" else {"id": "fabricated-version", "expected": None, "got": "NOT_RUN"},
            limits=["discover/initialize and tools/list only; no tool was called and no credential was used.",
                    "A version string match says two statements agree; it says nothing about the service's behaviour."]))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", required=True); ap.add_argument("--workdir", required=True); ap.add_argument("--census-dir", required=True)
    a = ap.parse_args(argv)
    rurl, rsha, rat, srv = latest_entry(a.name)
    if srv is None:
        print(f"no isLatest entry for {a.name}", file=sys.stderr); return 2
    for ev in package_events(a.name, srv, rurl, rsha, rat) + remote_events(a.name, srv, rurl, rsha, rat, a.workdir, a.census_dir):
        sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
