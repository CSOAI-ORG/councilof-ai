#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 CSOAI Ltd
"""OpenShell declared-vs-observed adapter (our example; not part of OpenShell).

Three inputs, kept apart:

  declared   an OpenShell sandbox policy (YAML, `version: 1`) plus, for syscalls,
             the fixed runtime baseline that OpenShell documents (it is not a
             policy field);
  enforcer   the records OpenShell writes about itself: OCSF JSONL
             (/var/log/openshell-ocsf.*.log) or the shorthand lines
             (/var/log/openshell.*.log, `openshell logs`);
  witness    an optional JSONL stream from something that is NOT the enforcer:
             a client transcript, a host flow log, strace, auditd. Format in
             DESIGN.md.

For every observed attempt (egress, file, syscall) the adapter writes one row:
what the policy declares, what the enforcer recorded, what the witness saw,
and a comparison. Rows and the run are wrapped in signed-receipts/v1 objects.

  python3 adapter.py compare --policy P.yaml --enforcer-log LOG [--enforcer-log LOG ...]
                             [--witness W.jsonl] --out DIR [--issued-at ISO]
                             [--subject URI] [--enforcer-version V] [--strict]
  python3 adapter.py verify FILE [--did-doc DOC.json]

Exit codes (compare):
  0  CONSISTENT  no divergence, and at least one row has an independent witness
  1  DIVERGENT   a declared deny with observed effect, or the enforcer's own
                 record of a declared deny being let through
  2  input error (policy rejected, unreadable log)
  3  UNMEASURED  no divergence, but no witness row either: the enforcer's word
                 alone cannot show that nothing left

Receipts are signed with a PUBLISHED TEST KEY unless --key-seed-file is given.
Test-key receipts show the mechanism; they are nobody's attestation.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import ipaddress
import json
import os
import re
import sys
import urllib.parse
from typing import Any

ADAPTER_NAME = "openshell-declared-vs-observed"
ADAPTER_VERSION = "0.1.0"
HERE = os.path.dirname(os.path.abspath(__file__))

# --------------------------------------------------------------------------- declared: documented constants
# Sources (OpenShell repo, tag v0.1.2 = 6648bd0c, identical on main eef8bec for these files):
#   docs/how-it-works/policies/schema.mdx, default-policy.mdx, network-rules.mdx,
#   docs/security/best-practices.mdx, docs/observability/logging.mdx, ocsf-json-export.mdx.
TOP_LEVEL_FIELDS = {"version", "filesystem_policy", "landlock", "process", "network_policies", "network_middlewares"}
RULE_FIELDS = {"name", "endpoints", "binaries"}
ENDPOINT_FIELDS = {
    "host", "port", "ports", "path", "allowed_ips", "protocol", "tls", "enforcement", "access", "rules",
    "deny_rules", "allow_encoded_slash", "credential_binding", "request_body_credential_rewrite",
    "websocket_credential_rewrite", "allow_uninspected_credentials", "credential_signing", "signing_service",
    "signing_region", "persisted_queries", "graphql_persisted_queries", "graphql_max_body_bytes", "mcp", "json_rpc",
}
PRESETS: dict[str, set[str] | None] = {
    "read-only": {"GET", "HEAD", "OPTIONS"},
    "read-write": {"GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH"},
    "full": None,  # every method
}
CONTROL_PLANE_PORTS = {2379, 2380, 6443, 10250, 10255}
BASELINE_RO = ["/usr", "/lib", "/etc", "/app", "/var/log", "/proc", "/dev/urandom"]
BASELINE_RW = ["/tmp", "/dev/null"]
RUNTIME_RO = ["/run/openshell-supervisor-ca"]  # runtime grant, not saved in the policy
SYSCALL_BLOCKED = {
    "memfd_create", "ptrace", "bpf", "process_vm_readv", "process_vm_writev", "pidfd_open", "pidfd_getfd",
    "pidfd_send_signal", "io_uring_setup", "mount", "fsopen", "fsconfig", "fsmount", "fspick", "move_mount",
    "open_tree", "setns", "umount2", "pivot_root", "userfaultfd", "perf_event_open",
}
SYSCALL_CONDITIONAL = {"execveat": "AT_EMPTY_PATH", "unshare": "CLONE_NEWUSER", "clone": "CLONE_NEWUSER",
                       "seccomp": "SECCOMP_SET_MODE_FILTER"}
SOCKET_DOMAINS_BLOCKED = {"AF_PACKET", "AF_BLUETOOTH", "AF_VSOCK"}
SYSCALL_BASELINE_SOURCE = "OpenShell docs/security/best-practices.mdx (Seccomp Filters), v0.1.2; not a policy field"

PERMITTED, DENIED, UNMODELLED = "permitted_by_policy", "denied_by_policy", "unmodelled"

# comparison values (per row) and results (per run). Deliberately not decision words:
# the adapter compares a policy with records; it does not admit or refuse anything.
HELD, DIVERGED, SELF_REPORT_ONLY, OVERBLOCK, NOTE, ROW_UNMODELLED = (
    "HELD", "DIVERGED", "SELF_REPORT_ONLY", "OVERBLOCK", "NOTE", "UNMODELLED")
CONSISTENT, DIVERGENT, UNMEASURED = "CONSISTENT", "DIVERGENT", "UNMEASURED"


class PolicyError(ValueError):
    pass


# --------------------------------------------------------------------------- canonical JSON / hashing
def _canon(obj: Any) -> bytes:
    ref = _interceptor(required=False)
    if ref is not None:
        return ref._canon(obj)
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _read_json(path: str) -> Any:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def sha256_file(path: str) -> str:
    with open(path, "rb") as fh:
        return sha256_bytes(fh.read())


_REF = None


def _interceptor(required: bool = True):
    """The signed-receipts/v1 reference implementation from this repo."""
    global _REF
    if _REF is not None:
        return _REF
    for cand in (os.path.join(HERE, "..", "..", "public", "spec", "signed-receipts", "v1"), HERE):
        if os.path.exists(os.path.join(cand, "interceptor.py")):
            sys.path.insert(0, os.path.abspath(cand))
            try:
                import interceptor  # type: ignore
                _REF = interceptor
                return _REF
            except ImportError:  # cryptography missing
                break
    if required:
        raise SystemExit("signed-receipts/v1 interceptor.py (and `cryptography`) is needed to sign or verify")
    return None


# --------------------------------------------------------------------------- policy loading
def _yaml_strict(text: str) -> Any:
    import yaml  # PyYAML

    class Loader(yaml.SafeLoader):
        pass

    def mapping(loader, node, deep=False):
        seen = set()
        for k_node, _ in node.value:
            k = loader.construct_object(k_node, deep=deep)
            if k in seen:
                raise PolicyError(f"duplicate key {k!r} at line {k_node.start_mark.line + 1}")
            seen.add(k)
        return yaml.SafeLoader.construct_mapping(loader, node, deep)

    Loader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, mapping)
    return yaml.load(text, Loader=Loader)


def load_policy(path: str) -> dict:
    with open(path, "rb") as fh:
        raw = fh.read()
    if len(raw) > 4 * 1024 * 1024:
        raise PolicyError("policy larger than 4 MiB")
    text = raw.decode("utf-8")
    if path.endswith(".json"):
        doc = json.loads(text)
    else:
        try:
            doc = _yaml_strict(text)
        except ImportError:
            raise PolicyError("PyYAML is needed for a YAML policy (or pass the policy as .json)")
    if not isinstance(doc, dict):
        raise PolicyError("policy is not a mapping")
    unknown = set(doc) - TOP_LEVEL_FIELDS
    if unknown:
        raise PolicyError(f"unknown top-level field(s) {sorted(unknown)}; OpenShell rejects these")
    if doc.get("version") != 1:
        raise PolicyError("`version` must be 1")
    fs = doc.get("filesystem_policy") or {}
    for key in ("read_only", "read_write"):
        for p in fs.get(key) or []:
            if not isinstance(p, str) or not p.startswith("/") or ".." in p.split("/"):
                raise PolicyError(f"filesystem path {p!r} must be absolute without '..'")
    if "/" in (fs.get("read_write") or []):
        raise PolicyError("`read_write` cannot contain /")
    for key, rule in (doc.get("network_policies") or {}).items():
        if str(key).startswith("_provider_"):
            raise PolicyError(f"rule key {key!r} uses the reserved _provider_ prefix")
        if not isinstance(rule, dict) or set(rule) - RULE_FIELDS:
            raise PolicyError(f"rule {key!r}: unknown field(s) {sorted(set(rule) - RULE_FIELDS)}")
        for ep in rule.get("endpoints") or []:
            if "port" in ep and "ports" in ep:
                raise PolicyError(f"rule {key!r}: set `port` or `ports`, not both")
            if "host" not in ep and "allowed_ips" not in ep:
                raise PolicyError(f"rule {key!r}: an endpoint needs `host` or `allowed_ips`")
            if ep.get("enforcement", "audit") not in ("audit", "enforce"):
                raise PolicyError(f"rule {key!r}: enforcement must be audit or enforce")
            if "access" in ep and "rules" in ep:
                raise PolicyError(f"rule {key!r}: `access` and `rules` cannot be combined")
    return doc


# --------------------------------------------------------------------------- matchers (schema.mdx "Matcher Semantics")
def _seg_regex(seg: str, sep: str) -> str:
    not_sep = "[^" + re.escape(sep) + "]"
    out, i = [], 0
    while i < len(seg):
        c = seg[i]
        if c == "*":
            while i < len(seg) and seg[i] == "*":
                i += 1
            out.append(not_sep + "*")  # `**` next to other characters behaves like `*`
            continue
        if c == "?":
            out.append(not_sep)
            i += 1
            continue
        if c == "[":
            j = seg.find("]", i + 2)
            if j > i:
                body = seg[i + 1:j]
                if body.startswith("!"):
                    body = "^" + body[1:]
                out.append("[" + body.replace("\\", "\\\\") + "]")
                i = j + 1
                continue
        out.append(re.escape(c))
        i += 1
    return "".join(out)


def glob_match(pattern: str, value: str, sep: str, case_sensitive: bool = True) -> bool:
    """`*` any run without the separator; whole-segment `**` spans separators."""
    rx = re.escape(sep).join(".*" if s == "**" else _seg_regex(s, sep) for s in pattern.split(sep))
    return re.fullmatch(rx, value, 0 if case_sensitive else re.IGNORECASE) is not None


def host_match(pattern: str, host: str) -> bool:
    return glob_match(pattern.lower(), host.lower().rstrip("."), ".", case_sensitive=False)


def _is_ip(s: str):
    try:
        return ipaddress.ip_address(s.strip("[]"))
    except ValueError:
        return None


def _always_blocked_ip(ip) -> bool:
    return bool(ip) and (ip.is_loopback or ip.is_link_local or ip.is_unspecified)


def path_under(path: str, root: str) -> bool:
    root = root.rstrip("/") or "/"
    return path == root or root == "/" or path.startswith(root + "/")


# --------------------------------------------------------------------------- declared model
class Declared:
    def __init__(self, doc: dict, workdir: str | None = "/sandbox"):
        self.doc = doc
        self.rules = doc.get("network_policies") or {}
        self.workdir = workdir

    # ---- network
    def _endpoints(self, host: str, port: int, binary: str | None, ip: str | None):
        out, unmodelled = [], []
        for key, rule in self.rules.items():
            bins = [b.get("path", "") for b in (rule.get("binaries") or []) if isinstance(b, dict)]
            if not bins:
                continue  # "An empty list matches no binary."
            if binary and binary not in ("-", ""):
                if not any(glob_match(b, binary, "/") for b in bins):
                    continue
            for ep in rule.get("endpoints") or []:
                ports = ep.get("ports") or ([ep["port"]] if "port" in ep else [])
                if port not in ports:
                    continue
                if "host" in ep:
                    if not host_match(str(ep["host"]), host):
                        continue
                elif ip is None:
                    unmodelled.append((key, "hostless endpoint (allowed_ips) needs the resolved IP"))
                    continue
                if ep.get("allowed_ips"):
                    if ip is None:
                        unmodelled.append((key, "allowed_ips needs the resolved IP"))
                        continue
                    addr = _is_ip(ip)
                    if not any(addr in ipaddress.ip_network(c, strict=False) for c in ep["allowed_ips"]):
                        continue
                out.append((key, rule.get("name", key), ep))
        return out, unmodelled

    def network(self, host: str, port: int, binary: str | None = None, ip: str | None = None) -> dict:
        literal = _is_ip(host)
        if _always_blocked_ip(literal) or _always_blocked_ip(_is_ip(ip) if ip else None):
            return {"effect": DENIED, "layer": "l4", "rule": None, "reason": "always-blocked address (loopback, link-local or unspecified)"}
        matches, unmodelled = self._endpoints(host, port, binary, ip)
        if not matches:
            if unmodelled:
                return {"effect": UNMODELLED, "layer": "l4", "rule": unmodelled[0][0], "reason": unmodelled[0][1]}
            return {"effect": DENIED, "layer": "l4", "rule": None, "reason": "no matching policy (default deny)"}
        if port in CONTROL_PLANE_PORTS:
            return {"effect": DENIED, "layer": "l4", "rule": None, "reason": f"port {port} is a blocked control-plane port"}
        rule = matches[0][0]
        bin_note = None if binary and binary not in ("-", "") else "binary identity not observed; endpoint-only match"
        out = {"effect": PERMITTED, "layer": "l4", "rule": rule, "reason": "endpoint listed", "_matches": matches}
        if bin_note:
            out["note"] = bin_note
        return out

    def http(self, host: str, port: int, method: str, path: str, binary: str | None = None, ip: str | None = None) -> dict:
        l4 = self.network(host, port, binary, ip)
        if l4["effect"] != PERMITTED:
            return l4
        matches = l4.pop("_matches")
        inspected = [m for m in matches if m[2].get("protocol") in ("rest", "websocket", "graphql", "mcp", "json-rpc")]
        if not inspected:
            return {**l4, "layer": "l4", "reason": "endpoint listed without request inspection: any method and path"}
        rest = [m for m in inspected if m[2].get("protocol") in ("rest", "websocket")]
        if len(rest) != len(inspected):
            return {"effect": UNMODELLED, "layer": "l7", "rule": inspected[0][0],
                    "reason": "graphql / mcp / json-rpc request rules are not modelled by this adapter"}
        with_path = [m for m in rest if m[2].get("path")]
        if with_path:
            chosen = [m for m in with_path if glob_match(m[2]["path"], path, "/")]
            rest = chosen or [m for m in rest if not m[2].get("path")]
            if not rest:
                return {"effect": DENIED, "layer": "l7", "rule": None, "reason": "no inspected endpoint path matches",
                        "enforcement": with_path[0][2].get("enforcement", "audit")}
        enforcement = rest[0][2].get("enforcement", "audit")
        for key, _name, ep in rest:
            for dr in ep.get("deny_rules") or []:
                if "query" in dr:
                    return {"effect": UNMODELLED, "layer": "l7", "rule": key, "reason": "query matchers are not modelled"}
                if dr.get("method") in ("*", method) and glob_match(str(dr.get("path", "")), path, "/"):
                    return {"effect": DENIED, "layer": "l7", "rule": key, "enforcement": ep.get("enforcement", "audit"),
                            "reason": f"deny_rules {dr.get('method')} {dr.get('path')}"}
        for key, _name, ep in rest:
            preset = ep.get("access")
            if preset is not None:
                allowed = PRESETS.get(preset, set())
                if allowed is None or method in allowed:
                    return {"effect": PERMITTED, "layer": "l7", "rule": key, "reason": f"access preset {preset}",
                            "enforcement": ep.get("enforcement", "audit")}
            for r in ep.get("rules") or []:
                a = r.get("allow") or {}
                if "query" in a:
                    return {"effect": UNMODELLED, "layer": "l7", "rule": key, "reason": "query matchers are not modelled"}
                if a.get("method") in ("*", method) and glob_match(str(a.get("path", "")), path, "/"):
                    return {"effect": PERMITTED, "layer": "l7", "rule": key, "reason": f"rules allow {a.get('method')} {a.get('path')}",
                            "enforcement": ep.get("enforcement", "audit")}
        return {"effect": DENIED, "layer": "l7", "rule": rest[0][0], "enforcement": enforcement,
                "reason": "no allow rule or preset covers this request (rule missing)"}

    # ---- filesystem (Landlock)
    def fs_lists(self) -> tuple[list[str], list[str]]:
        fs = self.doc.get("filesystem_policy")
        ro = list((fs or {}).get("read_only") or [])
        rw = list((fs or {}).get("read_write") or [])
        include_workdir = (fs or {}).get("include_workdir", fs is None)
        if include_workdir and self.workdir:
            rw.append(self.workdir)
        if self.rules:  # baseline paths are added when the effective policy has a network rule
            listed = set(ro) | set(rw)
            ro += [p for p in BASELINE_RO if p not in listed]
            rw += [p for p in BASELINE_RW if p not in listed]
        return ro + RUNTIME_RO, rw

    def fs(self, path: str, op: str) -> dict:
        ro, rw = self.fs_lists()
        best = max(((p, "rw") for p in rw if path_under(path, p)), key=lambda t: len(t[0]), default=None)
        best_ro = max(((p, "ro") for p in ro if path_under(path, p)), key=lambda t: len(t[0]), default=None)
        if best_ro and (not best or len(best_ro[0]) > len(best[0])):
            best = best_ro
        if best is None:
            return {"effect": DENIED, "layer": "landlock", "rule": None, "reason": "path not listed (inaccessible)"}
        if best[1] == "rw" or op in ("read", "exec", "stat"):
            return {"effect": PERMITTED, "layer": "landlock", "rule": best[0], "reason": f"{'read_write' if best[1] == 'rw' else 'read_only'} {best[0]}"}
        return {"effect": DENIED, "layer": "landlock", "rule": best[0], "reason": f"read_only {best[0]} does not grant {op}"}

    # ---- syscalls (documented baseline)
    @staticmethod
    def syscall(name: str, flags: list[str] | None, domain: str | None) -> dict:
        src = {"layer": "seccomp", "rule": None, "declared_by": SYSCALL_BASELINE_SOURCE}
        if name in SYSCALL_BLOCKED:
            return {"effect": DENIED, "reason": f"{name} is blocked unconditionally", **src}
        if name == "socket" and domain:
            if domain in SOCKET_DOMAINS_BLOCKED:
                return {"effect": DENIED, "reason": f"socket domain {domain} is blocked", **src}
            return {"effect": PERMITTED, "reason": f"socket domain {domain} not in the blocked set", **src}
        if name in SYSCALL_CONDITIONAL:
            need = SYSCALL_CONDITIONAL[name]
            if flags is None:
                return {"effect": UNMODELLED, "reason": f"{name} is blocked only with {need}; the witness gave no flags", **src}
            if need in flags:
                return {"effect": DENIED, "reason": f"{name} with {need} is blocked", **src}
        return {"effect": PERMITTED, "reason": "not in the documented seccomp denylist", **src}


# --------------------------------------------------------------------------- enforcer records
_SH = re.compile(
    r"^(?:(?P<iso>\d{4}-\d\d-\d\dT[\d:.]+Z)\s+OCSF\s+"
    r"|\[(?P<epoch>[\d.]+)\]\s+\[[^\]]*\]\s+\[OCSF\s*\]\s+\[ocsf\]\s+)"
    r"(?P<cls>[A-Z]+)(?::(?P<act>[A-Z_]+))?\s+\[(?P<sev>[A-Z]+)\]\s*(?P<rest>.*)$")
_NET = re.compile(r"^(?P<action>ALLOWED|DENIED|BLOCKED)\s+(?P<proc>\S*?)\((?P<pid>-?\d+)\)\s+->\s+"
                  r"(?P<host>\[[^\]]+\]|[^\s:]+):(?P<port>\d+)(?P<ctx>.*)$")
_HTTP = re.compile(r"^(?P<action>ALLOWED|DENIED|BLOCKED)\s+(?P<method>[A-Z_]+)\s+(?P<url>\S+)(?P<ctx>.*)$")
_CTX_POLICY = re.compile(r"\[policy:(?P<policy>\S+)\s+engine:(?P<engine>[^\]\s]+)\]")
_CTX_REASON = re.compile(r"\[reason:(?P<reason>.*)\]\s*$")
_LL_BUILT = re.compile(r"Landlock ruleset built \[rules_applied:(?P<applied>\d+) skipped:(?P<skipped>\d+)\]")


def _iso_from_epoch(sec: float) -> str:
    return _dt.datetime.fromtimestamp(sec, _dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def _t(iso: str | None) -> float | None:
    if not iso:
        return None
    try:
        return _dt.datetime.strptime(iso.replace("Z", "+0000"), "%Y-%m-%dT%H:%M:%S.%f%z").timestamp()
    except ValueError:
        try:
            return _dt.datetime.strptime(iso.replace("Z", "+0000"), "%Y-%m-%dT%H:%M:%S%z").timestamp()
        except ValueError:
            return None


def _split_url(url: str) -> tuple[str, int | None, str]:
    u = urllib.parse.urlsplit(url)
    port = u.port or (443 if u.scheme == "https" else 80 if u.scheme == "http" else None)
    return (u.hostname or ""), port, (u.path or "/")


def parse_shorthand(line: str, src: str, lineno: int) -> dict | None:
    m = _SH.match(line.strip())
    if not m:
        return None
    rec = {"source": src, "line": lineno, "format": "shorthand", "raw_sha256": sha256_bytes(line.rstrip("\n").encode()),
           "t": m["iso"] or _iso_from_epoch(float(m["epoch"])), "class": m["cls"], "activity": m["act"], "severity": m["sev"]}
    rest = m["rest"]
    pm, rm = _CTX_POLICY.search(rest), _CTX_REASON.search(rest)
    if pm:
        rec["policy"], rec["engine"] = pm["policy"], pm["engine"]
    if rm:
        rec["reason"] = rm["reason"]
    if m["cls"] == "NET" and (n := _NET.match(rest)):
        rec.update(kind="net", action=n["action"], process=n["proc"] or "-", pid=int(n["pid"]),
                   host=n["host"].strip("[]").lower(), port=int(n["port"]))
    elif m["cls"] == "HTTP" and (h := _HTTP.match(rest)):
        host, port, path = _split_url(h["url"])
        rec.update(kind="http", action=h["action"], method=h["method"], host=host.lower(), port=port, path=path)
    elif m["cls"] in ("CONFIG", "FINDING"):
        rec["kind"] = "config"
        rec["message"] = rest
        if (b := _LL_BUILT.search(rest)):
            rec["landlock_applied"], rec["landlock_skipped"] = int(b["applied"]), int(b["skipped"])
    else:
        rec["kind"] = "other"
    return rec


def parse_ocsf_json(obj: dict, src: str, lineno: int, raw: str) -> dict:
    cls = obj.get("class_uid")
    t = obj.get("time")
    rec = {"source": src, "line": lineno, "format": "ocsf-json", "raw_sha256": sha256_bytes(raw.encode()),
           "t": _iso_from_epoch(t / 1000) if isinstance(t, (int, float)) else None,
           "class_uid": cls, "severity": obj.get("severity"), "message": obj.get("message")}
    action = (obj.get("action") or "").upper()
    rec["action"] = {"ALLOWED": "ALLOWED", "DENIED": "DENIED", "BLOCKED": "BLOCKED"}.get(action, action or None)
    fr = obj.get("firewall_rule") or {}
    rec["policy"], rec["engine"] = fr.get("name"), fr.get("type")
    if obj.get("status_detail"):
        rec["reason"] = obj["status_detail"]
    msg = obj.get("message") or ""
    if msg.startswith("L7_REQUEST audit"):
        rec["enforcer_marked_audit"] = True
    dst = obj.get("dst_endpoint") or {}
    proc = ((obj.get("actor") or {}).get("process") or {})
    if cls == 4001:
        rec.update(kind="net", host=(dst.get("domain") or dst.get("hostname") or dst.get("ip") or "").lower(),
                   port=dst.get("port"), process=proc.get("name") or proc.get("path") or "-", pid=proc.get("pid"))
        if dst.get("ip"):
            rec["ip"] = dst["ip"]
    elif cls == 4002:
        req = obj.get("http_request") or {}
        url = req.get("url") or {}
        if isinstance(url, dict):
            host = (url.get("hostname") or dst.get("domain") or "").lower()
            port = url.get("port") or dst.get("port")
            path = url.get("path") or "/"
        else:
            host, port, path = _split_url(str(url))
        rec.update(kind="http", method=req.get("http_method"), host=host, port=port, path=path)
    elif cls in (5019, 2004):
        rec["kind"] = "config"
        if (b := _LL_BUILT.search(msg)):
            rec["landlock_applied"], rec["landlock_skipped"] = int(b["applied"]), int(b["skipped"])
    else:
        rec["kind"] = "other"
    return rec


def load_enforcer(paths: list[str]) -> tuple[list[dict], dict]:
    recs, stats = [], {"lines": 0, "parsed": 0, "files": []}
    for p in paths:
        stats["files"].append({"path": os.path.basename(p), "sha256": sha256_file(p)})
        with open(p, encoding="utf-8", errors="replace") as fh:
            for i, line in enumerate(fh, 1):
                if not line.strip():
                    continue
                stats["lines"] += 1
                s = line.strip()
                rec = None
                if s.startswith("{"):
                    try:
                        rec = parse_ocsf_json(json.loads(s), os.path.basename(p), i, s)
                    except json.JSONDecodeError:
                        rec = None
                else:
                    rec = parse_shorthand(s, os.path.basename(p), i)
                if rec is not None:
                    stats["parsed"] += 1
                    recs.append(rec)
    return recs, stats


def load_witness(path: str | None) -> list[dict]:
    if not path:
        return []
    out = []
    with open(path, encoding="utf-8") as fh:
        for i, line in enumerate(fh, 1):
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            w = json.loads(s)
            if w.get("kind") not in ("egress", "file", "syscall"):
                raise ValueError(f"{path}:{i}: witness kind must be egress, file or syscall")
            w["_line"], w["_sha256"] = i, sha256_bytes(s.encode())
            out.append(w)
    return out


# --------------------------------------------------------------------------- comparison
def _enforcer_claim(recs: list[dict], l7: bool) -> str:
    if not recs:
        return "ABSENT"
    https = [r for r in recs if r.get("kind") == "http"]
    nets = [r for r in recs if r.get("kind") == "net"]
    if any(r.get("action") in ("DENIED", "BLOCKED") for r in nets):
        return "DENIED"  # the connection never opened, so the request never went
    if l7 and https:
        return "DENIED" if any(r.get("action") in ("DENIED", "BLOCKED") for r in https) else "ALLOWED"
    if l7 and not https and nets:
        return "ALLOWED_CONNECTION_ONLY"
    return "ALLOWED"


def _compare_egress(declared: dict, claim: str, left: bool | None, marked_audit: bool,
                    provider_rule: bool = False) -> tuple[str, str | None]:
    """provider_rule: an enforcer record names a `_provider_*` rule. Providers add rules at runtime
    that are not in the policy file, so the effective policy can be wider than the declared one."""
    eff = declared["effect"]
    if eff == UNMODELLED:
        return ROW_UNMODELLED, None
    if eff == DENIED:
        audit = declared.get("layer") == "l7" and declared.get("enforcement", "audit") == "audit"
        if left is True:
            if claim == "DENIED":
                return DIVERGED, "ENFORCER_RECORD_CONTRADICTED_BY_WITNESS"
            if claim in ("ALLOWED", "ALLOWED_CONNECTION_ONLY"):
                return DIVERGED, _let_through_code(audit or marked_audit, provider_rule)
            return DIVERGED, "EGRESS_WITHOUT_ENFORCER_RECORD"
        if claim == "ALLOWED":
            return DIVERGED, _let_through_code(audit or marked_audit, provider_rule)
        if left is False:
            return HELD, None
        return SELF_REPORT_ONLY, None
    # declared permitted
    if claim == "DENIED":
        return OVERBLOCK, "DECLARED_PERMIT_ENFORCER_DENIED"
    if left is False and claim == "ALLOWED":
        return NOTE, "ENFORCER_ALLOWED_NO_EGRESS_SEEN"
    if left is None:
        return SELF_REPORT_ONLY, None
    return HELD, None


def _let_through_code(audit: bool, provider_rule: bool) -> str:
    if audit:
        return "DENY_DECLARED_AUDIT_PASSTHROUGH"
    if provider_rule:
        return "PROVIDER_RULE_OUTSIDE_POLICY_FILE"
    return "ENFORCER_LET_DECLARED_DENY_THROUGH"


def _provider(recs: list[dict]) -> bool:
    return any(str(r.get("policy") or "").startswith("_provider_") for r in recs)


def compare(doc: dict, enforcer: list[dict], witness: list[dict], window_s: float = 5.0,
            workdir: str | None = "/sandbox") -> list[dict]:
    D = Declared(doc, workdir)
    rows: list[dict] = []
    used: set[int] = set()
    traffic = [(i, r) for i, r in enumerate(enforcer) if r.get("kind") in ("net", "http")]

    def near(r, t):
        return t is None or _t(r.get("t")) is None or abs(_t(r["t"]) - t) <= window_s

    def attempt_records(host, port, method, path, t):
        got = []
        for i, r in traffic:
            if i in used or r.get("host") != host or r.get("port") != port or not near(r, t):
                continue
            if r["kind"] == "http" and method and (r.get("method") != method or r.get("path") != path):
                continue
            got.append((i, r))
        # one attempt = at most one NET record and one HTTP record, the earliest of each
        pick, seen = [], set()
        for i, r in got:
            if r["kind"] not in seen:
                pick.append((i, r))
                seen.add(r["kind"])
        return pick

    for w in witness:
        if w["kind"] != "egress":
            continue
        host, port = str(w["host"]).lower(), int(w["port"])
        method, path = w.get("method"), w.get("path")
        t = _t(w.get("t"))
        picked = attempt_records(host, port, method, path, t)
        used.update(i for i, _ in picked)
        recs = [r for _, r in picked]
        decl = D.http(host, port, method, path or "/", w.get("binary"), w.get("ip")) if method else \
            D.network(host, port, w.get("binary"), w.get("ip"))
        decl.pop("_matches", None)
        comp, code = _compare_egress(decl, _enforcer_claim(recs, bool(method)), w.get("left"),
                                     any(r.get("enforcer_marked_audit") for r in recs), _provider(recs))
        rows.append(_row("egress", {"host": host, "port": port, **({"method": method, "path": path} if method else {})},
                         decl, recs, w, comp, code))

    # enforcer traffic records with no witness row: group NET + HTTP of one attempt
    for i, r in traffic:
        if i in used:
            continue
        used.add(i)
        group = [r]
        if r["kind"] == "net":
            for j, s in traffic:
                if j not in used and s["kind"] == "http" and s.get("host") == r.get("host") and s.get("port") == r.get("port") \
                        and near(s, _t(r.get("t"))):
                    used.add(j)
                    group.append(s)
                    break
        http = next((g for g in group if g["kind"] == "http"), None)
        host, port = r.get("host") or "", int(r.get("port") or 0)
        if http:
            decl = D.http(host, port, http.get("method") or "GET", http.get("path") or "/", r.get("process"), r.get("ip"))
            attempt = {"host": host, "port": port, "method": http.get("method"), "path": http.get("path")}
        else:
            decl = D.network(host, port, r.get("process"), r.get("ip"))
            attempt = {"host": host, "port": port}
        decl.pop("_matches", None)
        comp, code = _compare_egress(decl, _enforcer_claim(group, bool(http)), None,
                                     any(g.get("enforcer_marked_audit") for g in group), _provider(group))
        rows.append(_row("egress", attempt, decl, group, None, comp, code))

    # filesystem: Landlock configuration records, then witnessed file operations
    for r in enforcer:
        if r.get("kind") != "config":
            continue
        msg = (r.get("message") or "")
        high = str(r.get("severity") or "").upper() in ("HIGH", "CRIT", "CRITICAL", "FATAL")
        if "landlock_applied" in r and r["landlock_applied"] == 0 or (high and "landlock" in msg.lower()):
            ro, rw = D.fs_lists()
            decl = {"effect": DENIED, "layer": "landlock", "rule": None,
                    "reason": f"policy lists {len(ro)} read-only and {len(rw)} read-write paths; everything else is declared inaccessible"}
            rows.append(_row("filesystem_config", {"what": "landlock ruleset"}, decl, [r], None, DIVERGED, "FS_RULES_NOT_APPLIED"))
        elif r.get("landlock_skipped"):
            decl = {"effect": PERMITTED, "layer": "landlock", "rule": None, "reason": "declared paths skipped at startup"}
            rows.append(_row("filesystem_config", {"what": "landlock ruleset"}, decl, [r], None, OVERBLOCK, "FS_DECLARED_PATHS_SKIPPED"))
    for w in witness:
        if w["kind"] == "file":
            decl = D.fs(str(w["path"]), str(w.get("op", "read")))
            took_effect = str(w.get("result", "")).lower() in ("ok", "0", "success")
            comp, code = _compare_effect(decl, took_effect, w.get("result"))
            rows.append(_row("file", {"path": w["path"], "op": w.get("op", "read")}, decl, [], w, comp, code,
                             enforcer_expected="none (OpenShell writes no per-access Landlock record)"))
        elif w["kind"] == "syscall":
            decl = D.syscall(str(w["name"]), w.get("flags"), w.get("domain"))
            took_effect = str(w.get("result", "")).lower() in ("ok", "0", "success")
            comp, code = _compare_effect(decl, took_effect, w.get("result"))
            attempt = {"name": w["name"], **({"flags": w["flags"]} if "flags" in w else {}),
                       **({"domain": w["domain"]} if "domain" in w else {})}
            rows.append(_row("syscall", attempt, decl, [], w, comp, code,
                             enforcer_expected="none (seccomp returns an errno; no per-call record)"))
    for n, row in enumerate(rows, 1):
        row["row"] = n
    return rows


def _compare_effect(decl: dict, took_effect: bool, result: Any) -> tuple[str, str | None]:
    if decl["effect"] == UNMODELLED:
        return ROW_UNMODELLED, None
    if decl["effect"] == DENIED:
        return (DIVERGED, "DENY_DECLARED_EFFECT_OBSERVED") if took_effect else (HELD, None)
    return (HELD, None) if took_effect else (OVERBLOCK, "DECLARED_PERMIT_OPERATION_REFUSED")


def _row(kind, attempt, decl, recs, w, comp, code, enforcer_expected=None) -> dict:
    row = {
        "kind": kind,
        "attempt": attempt,
        "declared": {k: v for k, v in decl.items() if not k.startswith("_")},
        "enforcer": {
            "records": [{k: r.get(k) for k in ("source", "line", "format", "t", "kind", "action", "policy", "engine", "reason",
                                               "enforcer_marked_audit", "landlock_applied", "landlock_skipped", "raw_sha256")
                         if r.get(k) is not None} for r in recs],
        },
        "witness": None if w is None else {k: v for k, v in w.items() if not k.startswith("_")} | {"record_sha256": w["_sha256"]},
        "comparison": comp,
    }
    if kind == "egress":
        row["enforcer"]["claim"] = _enforcer_claim(recs, "method" in attempt)
    if enforcer_expected:
        row["enforcer"]["expected_record"] = enforcer_expected
    if code:
        row["code"] = code
    return row


def summarise(rows: list[dict], strict: bool = False) -> dict:
    counts: dict[str, int] = {}
    codes: dict[str, int] = {}
    for r in rows:
        counts[r["comparison"]] = counts.get(r["comparison"], 0) + 1
        if r.get("code"):
            codes[r["code"]] = codes.get(r["code"], 0) + 1
    witnessed = sum(1 for r in rows if r.get("witness") is not None and r["comparison"] != ROW_UNMODELLED)
    failing = counts.get(DIVERGED, 0) + (counts.get(OVERBLOCK, 0) if strict else 0)
    if failing:
        result = DIVERGENT
    elif witnessed:
        result = CONSISTENT
    else:
        result = UNMEASURED
    return {"result": result, "rows": len(rows), "witnessed_rows": witnessed, "counts": dict(sorted(counts.items())),
            "codes": dict(sorted(codes.items())), "strict": strict}


# --------------------------------------------------------------------------- receipts
TEST_KEY_LABEL = "openshell-adapter example TEST key: issuer"
TEST_ISSUER = "did:web:issuer.example"
TEST_KID = TEST_ISSUER + "#key-1"


def test_key():
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    return Ed25519PrivateKey.from_private_bytes(hashlib.sha256(TEST_KEY_LABEL.encode()).digest())


def sign_receipt(claims: list[dict], task_id: str, subject: str, issued_at: str, key=None,
                 issuer: str = TEST_ISSUER, kid: str = TEST_KID) -> dict:
    ref = _interceptor()
    key = key or test_key()
    body = {"schema": ref.SCHEMA, "issuer": issuer, "subject_card": subject, "task_id": task_id,
            "claims": claims, "register": ref.REGISTER, "issued_at": issued_at}
    body["content_id"] = sha256_bytes(ref._canon(body))
    sig = key.sign(ref._canon(body))
    pub = key.public_key().public_bytes_raw().hex()
    return {**body, "signature": {"alg": "Ed25519", "kid": kid, "signer_public_key": pub, "sig": sig.hex()}}


def _row_detail(r: dict) -> str:
    a, d = r["attempt"], r["declared"]
    what = {"egress": lambda: f"egress {a['host']}:{a['port']}" + (f" {a['method']} {a['path']}" if a.get("method") else ""),
            "file": lambda: f"file {a['op']} {a['path']}",
            "syscall": lambda: f"syscall {a['name']}",
            "filesystem_config": lambda: "landlock ruleset"}[r["kind"]]()
    parts = [what, f"policy: {d['effect']} ({d.get('reason')})"]
    if r["kind"] == "egress":
        parts.append(f"enforcer record: {r['enforcer'].get('claim')}")
    if r.get("witness") is not None:
        w = r["witness"]
        parts.append(f"witness: {'left' if w.get('left') else 'did not leave' if w.get('left') is False else w.get('result')}")
    return "; ".join(parts) + f" -> {r['comparison']}" + (f" ({r['code']})" if r.get("code") else "")


def build_receipts(rows, summary, inputs, subject, issued_at, enforcer_version, key=None):
    rows_sha = sha256_bytes(_canon(rows))
    run_id = sha256_bytes(_canon(inputs))[:16]
    row_receipts = []
    for r in rows:
        claim = {"type": "openshell.declared_vs_observed.row", "detail": _row_detail(r),
                 "comparison": r["comparison"], "kind": r["kind"], "attempt": r["attempt"],
                 "declared_effect": r["declared"]["effect"], "evidence_sha256": sha256_bytes(_canon(r))}
        if r.get("code"):
            claim["code"] = r["code"]
        row_receipts.append(sign_receipt([claim], f"{ADAPTER_NAME}/{run_id}/row-{r['row']:03d}", subject, issued_at, key))
    run_claim = {
        "type": "openshell.declared_vs_observed.run", "result": summary["result"],
        "detail": (f"{summary['rows']} rows, {summary['witnessed_rows']} with an independent witness; "
                   f"comparisons {summary['counts']}; codes {summary['codes'] or '{}'}"),
        "counts": summary["counts"], "codes": summary["codes"], "inputs": inputs,
        "enforcer": {"product": "OpenShell", "version": enforcer_version or "not stated"},
        "adapter": {"name": ADAPTER_NAME, "version": ADAPTER_VERSION, "sha256": sha256_file(os.path.abspath(__file__))},
        "row_receipts": [rr["content_id"] for rr in row_receipts],
        "evidence_sha256": rows_sha,
    }
    return row_receipts, sign_receipt([run_claim], f"{ADAPTER_NAME}/{run_id}", subject, issued_at, key)


# --------------------------------------------------------------------------- CLI
def cmd_compare(a) -> int:
    try:
        doc = load_policy(a.policy)
        enforcer, estats = load_enforcer(a.enforcer_log or [])
        witness = load_witness(a.witness)
    except (PolicyError, OSError, ValueError, json.JSONDecodeError) as e:
        print(f"input error: {e}", file=sys.stderr)
        return 2
    rows = compare(doc, enforcer, witness, a.window, a.workdir)
    summary = summarise(rows, a.strict)
    inputs = {"policy_sha256": sha256_file(a.policy), "enforcer_logs": estats["files"],
              "enforcer_lines": estats["lines"], "enforcer_records_parsed": estats["parsed"],
              "witness_sha256": sha256_file(a.witness) if a.witness else None, "witness_rows": len(witness)}
    issued_at = a.issued_at or _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    key = None
    if a.key_seed_file:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        with open(a.key_seed_file) as fh:
            key = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(fh.read().strip()))
    report = {"adapter": {"name": ADAPTER_NAME, "version": ADAPTER_VERSION}, "summary": summary, "inputs": inputs,
              "rows": rows, "signing_key": "published TEST key" if key is None else "operator key"}
    if a.out:
        os.makedirs(a.out, exist_ok=True)
        row_receipts, run_receipt = build_receipts(rows, summary, inputs, a.subject, issued_at,
                                                   a.enforcer_version, key)
        with open(os.path.join(a.out, "rows.json"), "w") as fh:
            json.dump(report, fh, indent=1, ensure_ascii=False)
            fh.write("\n")
        with open(os.path.join(a.out, "receipts.jsonl"), "w") as fh:
            for rr in row_receipts:
                fh.write(json.dumps(rr, ensure_ascii=False, separators=(",", ":")) + "\n")
        with open(os.path.join(a.out, "run-receipt.json"), "w") as fh:
            json.dump(run_receipt, fh, indent=1, ensure_ascii=False)
            fh.write("\n")
    for r in rows:
        print(f"row {r['row']:>3}  {r['comparison']:<16} {_row_detail(r)}")
    print(f"RESULT {summary['result']}  rows={summary['rows']} witnessed={summary['witnessed_rows']} "
          f"counts={summary['counts']} codes={summary['codes']}")
    return {CONSISTENT: 0, DIVERGENT: 1, UNMEASURED: 3}[summary["result"]]


def cmd_verify(a) -> int:
    ref = _interceptor()
    doc = _read_json(a.did_doc) if a.did_doc else None
    resolver = (lambda did: doc if doc and doc.get("id") == did else None) if doc else None
    with open(a.file, encoding="utf-8") as fh:
        text = fh.read().strip()
    items = [json.loads(text)] if text.startswith("{") and "\n{" not in text else [json.loads(x) for x in text.splitlines() if x.strip()]
    results = []
    for it in items:
        res, why = ref.verify_receipt_result(it, resolve_did=resolver)
        results.append(res)
        print(f"{res:<16} {it.get('task_id')}  {why}")
    if "INVALID" in results:
        return 1
    return 3 if "UNVERIFIABLE_KEY" in results else 0


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("compare")
    c.add_argument("--policy", required=True)
    c.add_argument("--enforcer-log", action="append")
    c.add_argument("--witness")
    c.add_argument("--out")
    c.add_argument("--issued-at")
    c.add_argument("--subject", default="urn:example:openshell-sandbox")
    c.add_argument("--enforcer-version")
    c.add_argument("--workdir", default="/sandbox")
    c.add_argument("--window", type=float, default=5.0, help="seconds between a witness row and an enforcer record")
    c.add_argument("--strict", action="store_true", help="OVERBLOCK rows also make the run DIVERGENT")
    c.add_argument("--key-seed-file", help="hex Ed25519 seed; default is the published test key")
    v = sub.add_parser("verify")
    v.add_argument("file")
    v.add_argument("--did-doc")
    a = p.parse_args(argv)
    return cmd_compare(a) if a.cmd == "compare" else cmd_verify(a)


if __name__ == "__main__":
    sys.exit(main())
