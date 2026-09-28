#!/usr/bin/env python3
"""harness-x live parity: every PUBLISHED Layer 0 channel, read live, against the single source.

The single source is council-os/distribution.json and the version sources it names. Its
`published_channels` array is the declaration of every place a Layer 0 artifact is (or is meant to
be) live. check.mjs proves the COMMITTED outputs agree with the source; this proves the LIVE
channels do. They are different questions: on 2026-09-28 check.mjs passed 109/111 while PyPI served
a langchain-csoai 0.1.0 whose bytes the source's 0.1.0 no longer produces.

Per channel, exactly one state:
  CONSISTENT    every check that ran agreed with the source
  INCONSISTENT  at least one check disagreed; each disagreement quotes BOTH sides (source / live)
  UNCHECKABLE   the live surface could not be read, or the channel is declared but not published.
                Never a pass: it is counted and printed on its own.

What it sends: HTTP GETs to PyPI, npm, Hugging Face, the MCP Registry and councilof.ai; read-only
MCP initialize, tools/list and one tools/call of the free board_totals reader. It publishes nothing,
submits nothing, authenticates nowhere and holds no token.

  parity_live.py [--repo DIR] [--out FILE]      live read
  parity_live.py --install DIR                  also: install each package into a fresh venv / npm
                                                cache under DIR and run it against the live board
  parity_live.py --self-test                    offline, fixture transport

Exit 1 if any channel is INCONSISTENT, else 0 (UNCHECKABLE is reported in the RESULT line).
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

UA = "CSOAI-harness-x-parity/0.1 (+https://councilof.ai)"
SCHEMA = "csoai.harness-x-parity/1"
CONSISTENT, INCONSISTENT, UNCHECKABLE = "CONSISTENT", "INCONSISTENT", "UNCHECKABLE"
PASS, FAIL, SKIP = "PASS", "FAIL", "SKIP"


# ------------------------------------------------------------------------------------ transport
def http_transport(method, url, headers, body, timeout):
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in (e.headers or {}).items()}, e.read() or b""


class Net:
    def __init__(self, transport=http_transport, timeout=45):
        self.t, self.timeout, self.requests = transport, timeout, 0

    def get(self, url, accept="application/json"):
        self.requests += 1
        return self.t("GET", url, {"User-Agent": UA, "Accept": accept}, None, self.timeout)

    def get_json(self, url):
        st, _h, b = self.get(url)
        if st != 200:
            raise IOError(f"HTTP {st} from {url}")
        return json.loads(b)

    def rpc(self, url, method, params=None, rid=1):
        body = json.dumps({"jsonrpc": "2.0", "id": rid, "method": method,
                           **({"params": params} if params is not None else {})}).encode()
        self.requests += 1
        st, _h, b = self.t("POST", url, {"User-Agent": UA, "content-type": "application/json",
                                         "accept": "application/json, text/event-stream"}, body, self.timeout)
        if st != 200:
            raise IOError(f"HTTP {st} from {url} ({method})")
        t = b.decode("utf-8", "replace").strip()
        if not t.startswith("{"):
            data = [l[5:].strip() for l in t.splitlines() if l.startswith("data:")]
            if not data:
                raise IOError(f"no JSON-RPC body from {url} ({method})")
            t = data[-1]
        d = json.loads(t)
        if "error" in d:
            raise IOError(f"JSON-RPC error from {url} ({method}): {d['error']}")
        return d["result"]


# ------------------------------------------------------------------------------------ source
def sha256(b):
    return hashlib.sha256(b).hexdigest()


def vtuple(v):
    """'0.2.20260926' -> (0, 2, 20260926); 'v1.4.3' -> (1, 4, 3); pre-release tails sort lower."""
    parts = re.findall(r"\d+", str(v or ""))
    return tuple(int(p) for p in parts) if parts else ()


class Source:
    def __init__(self, repo):
        self.repo = repo
        self.dist = self.json("council-os/distribution.json")
        self.id = self.dist["identity"]
        self._lock = None

    def path(self, rel):
        return os.path.join(self.repo, rel)

    def exists(self, rel):
        return os.path.exists(self.path(rel))

    def bytes(self, rel):
        if self.exists(rel):
            with open(self.path(rel), "rb") as f:
                return f.read()
        # a sparse checkout may lack the path: read it from the index, never guess
        return subprocess.run(["git", "-C", self.repo, "show", f"HEAD:{rel}"], check=True,
                              capture_output=True).stdout

    def text(self, rel):
        return self.bytes(rel).decode("utf-8")

    def json(self, rel):
        return json.loads(self.bytes(rel))

    def resolve(self, ref):
        """'file#/json/pointer' or 'file#project.version' (pyproject) -> value."""
        if ref in self.dist.get("version_sources", {}):
            ref = self.dist["version_sources"][ref]
        rel, _, ptr = ref.partition("#")
        if rel.endswith(".toml"):
            m = re.search(r'^version\s*=\s*"([^"]+)"', self.text(rel), re.M)
            return m.group(1) if m else None
        node = self.json(rel)
        for part in [p for p in ptr.split("/") if p]:
            node = node[int(part)] if isinstance(node, list) else node[part]
        return node

    @property
    def lock(self):
        if self._lock is None:
            self._lock = self.json("functions/mcp/tool-fleet.lock.json")
        return self._lock

    def pyproject_deps(self, rel):
        m = re.search(r"^dependencies\s*=\s*\[(.*?)\]", self.text(rel), re.M | re.S)
        return sorted(re.findall(r'"([^"]+)"', m.group(1))) if m else []

    def readme_links(self):
        i = self.id
        return {"data": [i["board"]],
                "corrections ledger": [i["corrections"], i["corrections_api"]],
                "verify": [i["verify_page"].rstrip("/")]}


# ------------------------------------------------------------------------------------ result
class Channel:
    def __init__(self, cid, kind, target):
        self.id, self.kind, self.target = cid, kind, target
        self.checks, self.unreadable = [], None

    def check(self, name, ok, source=None, live=None, note=None):
        self.checks.append({"check": name, "result": PASS if ok else FAIL,
                            **({"source": source} if source is not None else {}),
                            **({"live": live} if live is not None else {}),
                            **({"note": note} if note else {})})
        return ok

    def skip(self, name, why):
        self.checks.append({"check": name, "result": SKIP, "note": why})

    def cannot(self, why):
        self.unreadable = why

    @property
    def state(self):
        if any(c["result"] == FAIL for c in self.checks):
            return INCONSISTENT
        if self.unreadable or not any(c["result"] == PASS for c in self.checks):
            return UNCHECKABLE
        return CONSISTENT

    def as_dict(self):
        d = {"id": self.id, "kind": self.kind, "target": self.target, "state": self.state,
             "checks": self.checks}
        if self.unreadable:
            d["unreadable"] = self.unreadable
        return d


def readme_check(ch, src, text, label="live README"):
    if text is None:
        ch.skip(f"{label} links", "no README text served")
        return
    missing = [k for k, alts in src.readme_links().items() if not any(a in text for a in alts)]
    ch.check(f"{label} points at councilof.ai data, the corrections ledger and verify", not missing,
             source="all three", live=("missing: " + ", ".join(missing)) if missing else "all three")


# ------------------------------------------------------------------------------------ channels
def check_site_mcp(net, src, spec):
    ch = Channel(spec["id"], "site-mcp", spec["url"])
    want_version = src.resolve(spec["version_source"])
    want_tools = list(src.lock["free"]) + ([] if spec.get("free_only") else list(src.lock["paid"]))
    try:
        init = net.rpc(spec["url"], "initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                                                    "clientInfo": {"name": "harness-x-parity", "version": "1"}})
        tl = net.rpc(spec["url"], "tools/list", rid=2)
    except Exception as e:
        ch.cannot(f"{type(e).__name__}: {e}")
        return ch
    live_v = (init.get("serverInfo") or {}).get("version")
    ch.check("serverInfo.version == source", live_v == want_version, want_version, live_v)
    names = [t.get("name") for t in tl.get("tools", [])]
    ch.check("tools/list names == fleet lock (order)", names == want_tools,
             f"{len(want_tools)}: {','.join(want_tools)}", f"{len(names)}: {','.join(names)}")
    return ch


def check_site_file(net, src, spec):
    ch = Channel(spec["id"], "site-file", spec["url"])
    try:
        committed = src.bytes(spec["path"])
    except Exception as e:
        ch.cannot(f"source file unreadable: {e}")
        return ch
    st, _h, live = net.get(spec["url"])
    if st != 200:
        ch.cannot(f"HTTP {st}")
        return ch
    same = sha256(live) == sha256(committed)
    detail_s, detail_l = sha256(committed)[:16], sha256(live)[:16]
    if not same:
        try:
            a, b = json.loads(committed), json.loads(live)
            diff = sorted(k for k in set(a) | set(b) if a.get(k) != b.get(k))
            detail_s += f" (keys differing from live: {', '.join(diff[:8])})"
        except ValueError:
            pass
    ch.check("served bytes == committed (sha256)", same, detail_s, detail_l)
    return ch


def check_registry(net, src, spec):
    ch = Channel(spec["id"], "mcp-registry", spec["name"])
    base = "https://registry.modelcontextprotocol.io/v0/servers/"
    try:
        d = net.get_json(base + urllib.parse.quote(spec["name"], safe="") + "/versions")
    except Exception as e:
        ch.cannot(f"{type(e).__name__}: {e}")
        return ch
    rows = d.get("servers") or []
    latest = [r for r in rows if ((r.get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {}).get("isLatest")]
    if not latest:
        ch.check("an isLatest entry exists", False, "registered", f"ABSENT ({len(rows)} versions, none isLatest)")
        return ch
    srv = latest[0]["server"]
    off = latest[0]["_meta"]["io.modelcontextprotocol.registry/official"]
    want = src.resolve(spec["version_source"])
    ch.check("isLatest version == source", srv.get("version") == want, want, srv.get("version"))
    door = src.id["door"]
    urls = [r.get("url") for r in srv.get("remotes") or []]
    ch.check("remote url == door (byte-exact)", urls == [door], door, ", ".join(map(str, urls)))
    if spec.get("rendered"):
        rendered = src.json(spec["rendered"])
        ch.check("description == rendered descriptor", srv.get("description") == rendered.get("description"),
                 rendered.get("description"), srv.get("description"))
    if spec.get("expect_status"):
        ch.check("registry status", off.get("status") == spec["expect_status"], spec["expect_status"], off.get("status"))
    return ch


def _wheel_files(blob):
    z = zipfile.ZipFile(io.BytesIO(blob))
    out, meta = {}, ""
    for n in z.namelist():
        if ".dist-info/" in n:
            if n.endswith(".dist-info/METADATA"):
                meta = z.read(n).decode("utf-8", "replace")
            continue
        if not n.endswith("/"):
            out[n] = z.read(n)
    return out, meta


def check_pypi(net, src, spec, cache):
    ch = Channel(spec["id"], "pypi", spec["name"])
    try:
        d = net.get_json(f"https://pypi.org/pypi/{spec['name']}/json")
    except IOError as e:
        if "HTTP 404" in str(e):
            ch.cannot("NOT PUBLISHED (PyPI 404)")
        else:
            ch.cannot(str(e))
        return ch
    except Exception as e:
        ch.cannot(f"{type(e).__name__}: {e}")
        return ch
    cache[spec["name"]] = d
    info = d["info"]
    want = src.resolve(spec["version_source"])
    live_v = info.get("version")
    same_v = ch.check("latest version == source", live_v == want, want, live_v)
    readme_check(ch, src, info.get("description"))
    if spec.get("source_readme"):
        readme_check(ch, src, src.text(spec["source_readme"]), label="source README")
    # the dependency floor the SOURCE declares must be installable from what PyPI serves today
    if spec.get("pyproject"):
        for dep in src.pyproject_deps(spec["pyproject"]):
            m = re.match(r"([A-Za-z0-9_.\-\[\]]+?)(?:\[[^\]]*\])?>=([0-9][^,;\s]*)", dep)
            if not m or m.group(1) not in spec.get("floor_packages", []):
                continue
            dep_name, floor = m.group(1), m.group(2)
            dd = cache.get(dep_name)
            if dd is None:
                try:
                    dd = cache[dep_name] = net.get_json(f"https://pypi.org/pypi/{dep_name}/json")
                except Exception as e:
                    ch.skip(f"source floor {dep}", f"{dep_name} unreadable: {e}")
                    continue
            ok = any(vtuple(v) >= vtuple(floor) for v, files in dd["releases"].items() if files)
            ch.check(f"source floor {dep} is installable from PyPI", ok, f">={floor}",
                     f"{dep_name} latest {dd['info']['version']}")
    if not same_v:
        ch.skip("wheel bytes == source", "versions differ; bytes are not comparable")
        return ch
    wheels = [u for u in d.get("urls", []) if u.get("packagetype") == "bdist_wheel"]
    if not wheels:
        ch.skip("wheel bytes == source", "no wheel for this version")
        return ch
    st, _h, blob = net.get(wheels[0]["url"], accept="*/*")
    if st != 200 or sha256(blob) != wheels[0]["digests"]["sha256"]:
        ch.cannot(f"wheel download HTTP {st} or digest mismatch")
        return ch
    files, meta = _wheel_files(blob)
    differ, missing = [], []
    for rel, b in sorted(files.items()):
        srel = os.path.join(spec["source_dir"], rel)
        try:
            sb = src.bytes(srel)
        except Exception:
            missing.append(rel)
            continue
        if sha256(sb) != sha256(b):
            differ.append(rel)
    ch.check("same version, same bytes: every wheel file == source file", not differ and not missing,
             "identical", ("differ: " + ", ".join(differ) if differ else "") +
             ("; not in source: " + ", ".join(missing) if missing else ""),
             note=("A version number that names two different contents cannot be republished (PyPI refuses "
                   "a re-upload): the source must move to a new version." if differ else None))
    if spec.get("pyproject"):
        live_deps = sorted(re.sub(r"\s+", "", l.split(":", 1)[1]).split(";")[0]
                           for l in meta.splitlines() if l.startswith("Requires-Dist:"))
        src_deps = sorted(re.sub(r"\s+", "", x) for x in src.pyproject_deps(spec["pyproject"]))
        live_core = sorted(x for x in live_deps if "extra==" not in x)
        ch.check("Requires-Dist == source dependencies", live_core == src_deps or live_deps == src_deps,
                 ", ".join(src_deps), ", ".join(live_deps))
    return ch


def check_npm(net, src, spec):
    ch = Channel(spec["id"], "npm", spec["name"])
    st, _h, b = net.get("https://registry.npmjs.org/" + spec["name"].replace("/", "%2f"))
    if st == 404:
        ch.cannot("NOT PUBLISHED (npm 404)")
        return ch
    if st != 200:
        ch.cannot(f"HTTP {st}")
        return ch
    d = json.loads(b)
    live_v = (d.get("dist-tags") or {}).get("latest")
    want = src.resolve(spec["version_source"])
    same_v = ch.check("latest version == source", live_v == want, want, live_v)
    v = d["versions"].get(live_v, {})
    readme_check(ch, src, d.get("readme") or v.get("readme"))
    if spec.get("source_readme"):
        readme_check(ch, src, src.text(spec["source_readme"]), label="source README")
    if spec.get("package_json"):
        pj = src.json(spec["package_json"])
        for k in ("mcpName", "license"):
            if k in pj or k in v:
                ch.check(f"package.json {k} == source", v.get(k) == pj.get(k), pj.get(k), v.get(k))
    if not same_v:
        ch.skip("tarball bytes == source", "versions differ")
        return ch
    st, _h, tgz = net.get(v["dist"]["tarball"], accept="*/*")
    if st != 200:
        ch.cannot(f"tarball HTTP {st}")
        return ch
    differ, missing = [], []
    pack_map = spec.get("pack_map", {})
    with tarfile.open(fileobj=io.BytesIO(tgz), mode="r:gz") as t:
        for m in t.getmembers():
            if not m.isfile():
                continue
            rel = m.name.split("/", 1)[1]
            if rel == "package.json":
                continue  # npm rewrites it on publish; the fields above are compared instead
            srel = pack_map.get(rel, os.path.join(spec["source_dir"], rel))
            try:
                sb = src.bytes(srel)
            except Exception:
                missing.append(rel)
                continue
            if sha256(sb) != sha256(t.extractfile(m).read()):
                differ.append(rel)
    ch.check("same version, same bytes: every tarball file == source file", not differ and not missing,
             "identical", ("differ: " + ", ".join(differ) if differ else "") +
             ("; not in source: " + ", ".join(missing) if missing else ""),
             note=("npm refuses to republish a version: the source must move to a new version before this "
                   "content can ship." if differ else None))
    return ch


def check_hf_space(net, src, spec, pypi_cache):
    ch = Channel(spec["id"], "hf-space", spec["space_id"])
    sid = spec["space_id"]
    try:
        api = net.get_json(f"https://huggingface.co/api/spaces/{sid}")
    except Exception as e:
        ch.cannot(f"{type(e).__name__}: {e}")
        return ch
    stage = (api.get("runtime") or {}).get("stage")
    ch.check("runtime RUNNING", stage == "RUNNING", "RUNNING", stage)
    for f in spec["files"]:
        st, _h, live = net.get(f"https://huggingface.co/spaces/{sid}/raw/main/{f}", accept="*/*")
        if st != 200:
            ch.check(f"{f} served", False, "present", f"HTTP {st}")
            continue
        sb = src.bytes(os.path.join(spec["source_dir"], f))
        note = None
        if f == "requirements.txt" and sha256(sb) != sha256(live):
            note = f"source: {sb.decode().strip()!r} / live: {live.decode().strip()!r}"
        ch.check(f"{f} == rendered source (sha256)", sha256(sb) == sha256(live), sha256(sb)[:16], sha256(live)[:16], note)
        if f == "README.md":
            readme_check(ch, src, live.decode("utf-8", "replace"))
    # the source's requirement floor must be installable today
    req = src.text(os.path.join(spec["source_dir"], "requirements.txt"))
    m = re.search(r"csoai-gspc(?:\[[^\]]*\])?>=([0-9][^\s,;]*)", req)
    if m:
        dd = pypi_cache.get("csoai-gspc")
        if dd is None:
            try:
                dd = pypi_cache["csoai-gspc"] = net.get_json("https://pypi.org/pypi/csoai-gspc/json")
            except Exception as e:
                dd = None
                ch.skip("source floor csoai-gspc installable", str(e))
        if dd:
            ok = any(vtuple(v) >= vtuple(m.group(1)) for v, fl in dd["releases"].items() if fl)
            ch.check("source floor csoai-gspc is installable from PyPI", ok, f">={m.group(1)}",
                     f"csoai-gspc latest {dd['info']['version']}",
                     None if ok else "pushing the rendered Space before csoai-gspc is published breaks its build")
    # the Space is an MCP server: its tools are the gspc_* functions of the rendered app.py
    app = src.text(os.path.join(spec["source_dir"], "app.py"))
    fns = re.findall(r"^def (gspc_\w+)\(", app, re.M)
    try:
        net.rpc(spec["mcp_url"], "initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                                                 "clientInfo": {"name": "harness-x-parity", "version": "1"}})
        names = [t["name"] for t in net.rpc(spec["mcp_url"], "tools/list", rid=2).get("tools", [])]
    except Exception as e:
        ch.skip("MCP tools/list", f"{type(e).__name__}: {e}")
        return ch
    ok = len(names) == len(fns) and all(any(n.endswith(f) for n in names) for f in fns)
    ch.check("MCP tools == app.py gspc_* functions", ok, ",".join(fns), ",".join(names))
    bt = next((n for n in names if n.endswith("gspc_board_totals")), None)
    if bt:
        try:
            r = net.rpc(spec["mcp_url"], "tools/call", {"name": bt, "arguments": {}}, rid=3)
            txt = " ".join(c.get("text", "") for c in r.get("content", []))
            board = net.get_json(src.id["board"])
            want_pc = (board.get("totals") or {}).get("public_count")
            ch.check("board_totals answers LIVE with the board's own public_count",
                     "'LIVE'" in txt and want_pc is not None and want_pc in txt,
                     want_pc, txt[:160])
        except Exception as e:
            ch.skip("board_totals call", f"{type(e).__name__}: {e}")
    return ch


def check_rendered_only(src, spec):
    ch = Channel(spec["id"], "rendered-only", spec.get("row", spec["id"]))
    ch.cannot(spec.get("why", "not published anywhere public; the owner step in distribution/SUBMIT.md is open"))
    return ch


# ------------------------------------------------------------------------------------ install
def _run(cmd, cwd, env=None, timeout=1800, stdin=None):
    return subprocess.run(cmd, cwd=cwd, env={**os.environ, **(env or {})}, timeout=timeout,
                          capture_output=True, text=True, input=stdin)


def install_pypi(root, spec, version, board_pc):
    """Fresh venv + fresh pip cache under root; install NAME==VERSION from PyPI; run its smoke."""
    d = tempfile.mkdtemp(prefix=f"{spec['name']}-", dir=root)
    env = {"PIP_CACHE_DIR": os.path.join(d, "pip-cache"), "PIP_DISABLE_PIP_VERSION_CHECK": "1"}
    r = _run([sys.executable, "-m", "venv", os.path.join(d, "venv")], d)
    if r.returncode:
        return {"state": FAIL, "step": "venv", "tail": r.stderr[-400:]}
    py = os.path.join(d, "venv", "bin", "python")
    t0 = time.time()
    r = _run([py, "-m", "pip", "install", "-q", f"{spec['name']}=={version}"], d, env)
    if r.returncode:
        return {"state": FAIL, "step": "pip install", "seconds": round(time.time() - t0), "tail": r.stderr[-600:]}
    r = _run([py, "-c", spec["smoke"]], d, timeout=300)
    out = (r.stdout or "").strip().splitlines()
    ok = r.returncode == 0 and bool(out) and board_pc in out[-1]
    return {"state": PASS if ok else FAIL, "step": "run", "dir": d, "seconds": round(time.time() - t0),
            "stdout_tail": out[-1][:200] if out else "", "stderr_tail": (r.stderr or "")[-300:] if not ok else ""}


def install_npm_stdio(root, spec, version, lock_names):
    d = tempfile.mkdtemp(prefix="npm-", dir=root)
    msgs = "\n".join(json.dumps(m) for m in [
        {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {},
                                                                       "clientInfo": {"name": "harness-x-parity", "version": "1"}}},
        {"jsonrpc": "2.0", "method": "notifications/initialized"},
        {"jsonrpc": "2.0", "id": 2, "method": "tools/list"}]) + "\n"
    r = _run(["npx", "-y", f"{spec['name']}@{version}"], d, {"npm_config_cache": os.path.join(d, "npm-cache")},
             timeout=600, stdin=msgs)
    resp = {}
    for line in (r.stdout or "").splitlines():
        try:
            m = json.loads(line)
            resp[m.get("id")] = m
        except ValueError:
            continue
    names = [t["name"] for t in ((resp.get(2) or {}).get("result") or {}).get("tools", [])]
    info = ((resp.get(1) or {}).get("result") or {}).get("serverInfo")
    ok = names == lock_names
    return {"state": PASS if ok else FAIL, "step": "npx stdio initialize + tools/list", "dir": d,
            "serverInfo": info, "tools": f"{len(names)} served / {len(lock_names)} locked",
            "differ": sorted(set(names) ^ set(lock_names)), "stderr_tail": (r.stderr or "")[-300:] if not ok else ""}


# ------------------------------------------------------------------------------------ run
def run(repo, net, install_root=None):
    src = Source(repo)
    specs = src.dist.get("published_channels")
    if not specs:
        raise SystemExit("council-os/distribution.json has no published_channels[]: nothing declares what is live")
    pypi_cache, out = {}, []
    for spec in specs:
        k = spec["kind"]
        try:
            if k == "site-mcp":
                ch = check_site_mcp(net, src, spec)
            elif k == "site-file":
                ch = check_site_file(net, src, spec)
            elif k == "mcp-registry":
                ch = check_registry(net, src, spec)
            elif k == "pypi":
                ch = check_pypi(net, src, spec, pypi_cache)
            elif k == "npm":
                ch = check_npm(net, src, spec)
            elif k == "hf-space":
                ch = check_hf_space(net, src, spec, pypi_cache)
            elif k == "rendered-only":
                ch = check_rendered_only(src, spec)
            else:
                ch = Channel(spec["id"], k, "?")
                ch.cannot(f"unknown kind {k}")
        except Exception as e:  # a crashed check is never a pass
            ch = Channel(spec["id"], k, spec.get("name") or spec.get("url") or "?")
            ch.cannot(f"check crashed: {type(e).__name__}: {e}")
        out.append(ch)
    installs = {}
    if install_root:
        os.makedirs(install_root, exist_ok=True)
        try:
            board_pc = net.get_json(src.id["board"])["totals"]["public_count"]
        except Exception as e:
            board_pc = None
            installs["*"] = {"state": SKIP, "why": f"board unreadable: {e}"}
        lock_names = list(src.lock["free"]) + list(src.lock["paid"])
        for spec, ch in zip(specs, out):
            live = pypi_cache.get(spec.get("name"), {}).get("info", {}).get("version") if spec["kind"] == "pypi" else None
            if spec["kind"] == "pypi" and spec.get("smoke") and live and board_pc:
                installs[spec["id"]] = r = install_pypi(install_root, spec, live, board_pc)
            elif spec["kind"] == "npm" and spec.get("stdio_smoke") and ch.state != UNCHECKABLE:
                ver = next((c["live"] for c in ch.checks if c["check"] == "latest version == source"), None)
                installs[spec["id"]] = r = install_npm_stdio(install_root, spec, ver, lock_names)
            else:
                continue
            ch.check("clean install + run from a fresh temp dir", r["state"] == PASS, "installs and answers LIVE",
                     json.dumps({k: v for k, v in r.items() if k in ("step", "stdout_tail", "tools", "differ", "tail", "stderr_tail")})[:400])
    states = {s: sum(1 for c in out if c.state == s) for s in (CONSISTENT, INCONSISTENT, UNCHECKABLE)}

    def declared(key):
        try:
            return src.resolve(key) if key in src.dist.get("version_sources", {}) else None
        except Exception:
            return None
    report = {
        "schema": SCHEMA, "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": {"repo_head": _head(repo), "distribution_json_sha256": sha256(src.bytes("council-os/distribution.json")),
                   "versions": {k: declared(k) for k in src.dist.get("version_sources", {})}},
        "states": states, "requests": net.requests,
        "channels": [c.as_dict() for c in out],
        "what_this_is": "each live Layer 0 channel compared with the single source; a disagreement quotes both sides",
        "what_it_never_is": "a publish, a submission, or a statement about anyone else's software",
    }
    return report


def _head(repo):
    r = subprocess.run(["git", "-C", repo, "rev-parse", "--short", "HEAD"], capture_output=True, text=True)
    return r.stdout.strip() or None


def result_line(rep):
    s = rep["states"]
    inc = [c["id"] for c in rep["channels"] if c["state"] == INCONSISTENT]
    unc = [c["id"] for c in rep["channels"] if c["state"] == UNCHECKABLE]
    return (f"RESULT harness-x-parity {rep['as_of']} consistent={s[CONSISTENT]} inconsistent={s[INCONSISTENT]} "
            f"uncheckable={s[UNCHECKABLE]}" + (f" INCONSISTENT[{','.join(inc)}]" if inc else "") +
            (f" UNCHECKABLE[{','.join(unc)}]" if unc else ""))


# ------------------------------------------------------------------------------------ self-test
def self_test():
    """Fixture transport: one channel of each outcome, and a crashed check that must not pass."""
    tmp = tempfile.mkdtemp(prefix="hx-parity-selftest-")
    os.makedirs(os.path.join(tmp, "council-os"))
    os.makedirs(os.path.join(tmp, "functions/mcp"))
    os.makedirs(os.path.join(tmp, "mcp"))
    ident = {"door": "https://door.example/mcp", "board": "https://door.example/api/gspc",
             "corrections": "https://door.example/corrections/", "corrections_api": "https://door.example/api/corrections",
             "verify_page": "https://door.example/gspc-verify/"}
    dist = {"identity": ident, "adapter_version": "0.1.1",
            "version_sources": {"remote": "mcp/server.json#/version", "adapters": "council-os/distribution.json#/adapter_version"},
            "published_channels": [
                {"id": "door", "kind": "site-mcp", "url": ident["door"], "version_source": "remote"},
                {"id": "py-old", "kind": "pypi", "name": "pkg-old", "version_source": "adapters", "source_dir": "x"},
                {"id": "py-none", "kind": "pypi", "name": "pkg-none", "version_source": "adapters", "source_dir": "x"},
                {"id": "reg-down", "kind": "mcp-registry", "name": "a/b", "version_source": "remote"},
                {"id": "form", "kind": "rendered-only"}]}
    json.dump(dist, open(os.path.join(tmp, "council-os/distribution.json"), "w"))
    json.dump({"version": "1.4.3"}, open(os.path.join(tmp, "mcp/server.json"), "w"))
    json.dump({"free": ["a"], "paid": ["b"]}, open(os.path.join(tmp, "functions/mcp/tool-fleet.lock.json"), "w"))
    links = f"{ident['board']} {ident['corrections']} {ident['verify_page']}"

    def transport(method, url, headers, body, timeout):
        if url == ident["door"]:
            m = json.loads(body)["method"]
            res = {"serverInfo": {"version": "1.4.3"}} if m == "initialize" else {"tools": [{"name": "a"}, {"name": "b"}]}
            return 200, {}, ("event: message\ndata: " + json.dumps({"jsonrpc": "2.0", "id": 1, "result": res})).encode()
        if url.endswith("/pkg-old/json"):
            return 200, {}, json.dumps({"info": {"version": "0.1.0", "description": links}, "releases": {"0.1.0": [{}]}, "urls": []}).encode()
        if url.endswith("/pkg-none/json"):
            return 404, {}, b"{}"
        raise TimeoutError("registry timed out")

    rep = run(tmp, Net(transport))
    got = {c["id"]: c["state"] for c in rep["channels"]}
    want = {"door": CONSISTENT, "py-old": INCONSISTENT, "py-none": UNCHECKABLE, "reg-down": UNCHECKABLE, "form": UNCHECKABLE}
    quoted = next(c for c in rep["channels"] if c["id"] == "py-old")["checks"][0]
    ok = got == want and quoted.get("source") == "0.1.1" and quoted.get("live") == "0.1.0"
    print(json.dumps({"self_test": "PASS" if ok else "FAIL", "got": got, "quoted": quoted}))
    return 0 if ok else 1


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--repo", default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    ap.add_argument("--out", help="write the JSON report here")
    ap.add_argument("--install", metavar="DIR", help="also install + run each package from a fresh dir under DIR")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return self_test()
    rep = run(a.repo, Net(), a.install)
    text = json.dumps(rep, indent=1, ensure_ascii=False)
    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        with open(a.out, "w") as f:
            f.write(text + "\n")
    for c in rep["channels"]:
        print(f"{c['state']:<12} {c['id']:<34} {c['target']}")
        for k in c["checks"]:
            if k["result"] != PASS:
                print(f"    {k['result']} {k['check']}" + (f" | source: {k.get('source')} | live: {k.get('live')}" if k["result"] == FAIL else f" | {k.get('note')}"))
        if c.get("unreadable"):
            print(f"    UNREADABLE {c['unreadable']}")
    print(result_line(rep))
    return 1 if rep["states"][INCONSISTENT] else 0


if __name__ == "__main__":
    sys.exit(main())
