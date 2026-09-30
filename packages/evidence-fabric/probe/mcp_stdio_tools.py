#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""A README claim about which tools an MCP server exposes vs what `tools/list` returns, run LOCALLY over stdio with NO
credentials -> one evidence event per claim.

    python3 probe/mcp_stdio_tools.py CLAIMS.json > events.jsonl
    CLAIMS.json: [{"about": "...", "quote": "...", "source_url": "...", "cmd": ["falcon-mcp", "--tools", "a,b"],
                   "expected_tools": ["a", "b"], "package": "pypi:falcon-mcp==0.19.0"}]

Sends only initialize, notifications/initialized and tools/list. Never tools/call. No credentials are set (the
environment is emptied except PATH/HOME), so anything that needs an account is out of reach: if the server does
not start or does not answer tools/list, the event is UNMEASURED with the reason, never a pass.
CONSISTENT: the listed tool names equal expected_tools. DIVERGENT: they differ (both sets are recorded).
Negative control: the same observed set compared with expected_tools plus one fabricated name must DIVERGE.
"""
import json, os, select, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from probe import E, now  # noqa: E402

FAKE = "csoai_negative_control_tool"


def rpc_session(cmd, timeout=60):
    env = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "HOME": os.environ.get("HOME", "/root")}
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
    msgs = [{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {},
             "clientInfo": {"name": "csoai-evidence-probe", "version": "0.1"}}},
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}]
    out, buf, deadline, sent = {}, b"", time.time() + timeout, 0
    try:
        p.stdin.write((json.dumps(msgs[0]) + "\n").encode()); p.stdin.flush(); sent = 1
        while time.time() < deadline and 2 not in out:
            r, _, _ = select.select([p.stdout], [], [], 1.0)
            if not r:
                if p.poll() is not None:
                    break
                continue
            chunk = os.read(p.stdout.fileno(), 65536)
            if not chunk:
                break
            buf += chunk
            while b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                try:
                    m = json.loads(line)
                except ValueError:
                    continue
                if "id" in m:
                    out[m["id"]] = m
                if m.get("id") == 1 and sent == 1:
                    for x in msgs[1:]:
                        p.stdin.write((json.dumps(x) + "\n").encode())
                    p.stdin.flush(); sent = 3
    finally:
        try:
            p.kill()
        except Exception:
            pass
        err = p.stderr.read()[-600:].decode("utf-8", "replace") if p.stderr else ""
    return out, err, p.returncode


def measure(c):
    at = now()
    out, err, rc = rpc_session(c["cmd"])
    init = (out.get(1) or {}).get("result") or {}
    tl = (out.get(2) or {}).get("result")
    exp = sorted(c["expected_tools"])
    if tl is None:
        state, got, ctl = "UNMEASURED", None, {"id": "expected-plus-fabricated-name", "expected": None, "got": "NOT_RUN"}
    else:
        got = sorted(t["name"] for t in tl.get("tools", []))
        state = "CONSISTENT" if got == exp else "DIVERGENT"
        ctl = {"id": "expected-plus-fabricated-name", "expected": "DIVERGENT",
               "got": "CONSISTENT" if got == sorted(exp + [FAKE]) else "DIVERGENT"}
    return E.build(
        subject={"kind": "package", "locator": c["package"], "declared_by": c["source_url"]},
        claim={"text": f"{c['about']}: “{c['quote']}”", "source_url": c["source_url"], "source_sha256": c.get("source_sha256"), "read_at": at},
        method={"id": "mcp-stdio-tools-list", "version": "0.1", "code_sha256": None, "holder": "csoai"},
        declared={"cmd": c["cmd"], "expected_tools": exp},
        observed={"tools": got, "serverInfo": init.get("serverInfo"), "tools_list_answered": tl is not None,
                  "stderr_tail": None if tl is not None else err[-300:], "credentials": "none set"},
        state=state, value=None, negative_control=ctl,
        limits=["Run locally over stdio with no credentials; only initialize and tools/list were sent, never tools/call.",
                "Which tools are registered is not what they do: behaviour against a live tenant is UNMEASURED."])


def main(argv=None):
    for c in json.load(open((argv or sys.argv[1:])[0])):
        sys.stdout.write(json.dumps(measure(c), ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
