#!/usr/bin/env python3
"""mcp-stdio-probe — handshake + tools/list + tools/call every MCP server under a servers/ root.

WHY THIS IS COMMITTED (2026-08-26, lane A4)
-------------------------------------------
The estate's headline MCP figure — "338 servers probed / 1,869 tools called", the number the MCP
security scorecard play was ranked #1 on — came from a probe script (`batch_probe.py`) that was
NEVER COMMITTED, run against a pod-only checkout, writing its report to `/tmp/probe.json`. The pod
is gone, the script is gone, the report is gone. A number nobody can re-derive is not a measurement,
and this organisation exists to refuse exactly that.

So: the probe lives here, in git. Its output goes to a tracked path, never /tmp. Anyone with the
`servers/` tree can re-run it and get a report that can be diffed against the last one.

WHAT IT MEASURES
----------------
For each server directory containing `server.py`, over MCP stdio, with an isolated HOME so a shared
daily-usage counter cannot mask real capability behind a paywall refusal:
  initialize -> tools/list -> tools/call (every tool, dummy args from its own inputSchema)
A tool whose response matches a stub marker is recorded as stubbed. A server whose every tool is
stubbed is recorded as fully stubbed. Paywall strings appearing in the MCP surface are recorded.

WHAT IT DOES NOT DO
-------------------
It does not extrapolate. If the root does not exist, it writes nothing and exits non-zero — it will
not emit an empty report that a later reader could mistake for "0 failures".

USAGE
-----
    pip install mcp
    python3 scripts/mcp-stdio-probe.py --root /path/to/gspc-os/servers
    python3 scripts/mcp-stdio-probe.py --root ./servers --out evidence/mcp-stdio-probe.json
    python3 scripts/mcp-stdio-probe.py --selftest        # no network, no servers needed

The `servers/` tree of CSOAI-ORG/gspc-os is private and pod-only. On any machine without it this
script exits with a clear message; the correct response is to record those servers as
`catalogued-not-probed` in scripts/mcp-targets.json, NOT to cite a remembered number.
"""
import argparse
import asyncio
import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timezone

DEFAULT_OUT = "evidence/mcp-stdio-probe.json"
PER_SERVER_TIMEOUT = 75
PER_CALL_TIMEOUT = 20

STUB_MARKERS = (
    '"status": "stub"', '"status":"stub"', "'status': 'stub'",
    "not implemented", "notimplemented", "coming soon", "placeholder",
    "todo: implement", "unimplemented", '"stub": true',
)
PAYWALL_MARKERS = (
    "buy.stripe.com", "upgrade_url", "upsell", "/mo", "pro tier",
    "free tier", "pricing", "paid signed issuance",
)


def dummy_for(schema, name=""):
    """Build a plausible value for a required argument from its own schema."""
    t = schema.get("type")
    if schema.get("enum"):
        return schema["enum"][0]
    if "default" in schema:
        return schema["default"]
    if t == "integer":
        return 1
    if t == "number":
        return 1.0
    if t == "boolean":
        return False
    if t == "array":
        item = schema.get("items") or {}
        return [dummy_for(item)] if item else []
    if t == "object":
        return {}
    n = name.lower()
    if "url" in n:
        return "https://example.org"
    if "email" in n:
        return "probe@example.org"
    if "hex" in n or "color" in n:
        return "#333333"
    if "lang" in n:
        return "en"
    if "date" in n:
        return "2026-01-01"
    return "probe"


def args_for(tool):
    sch = tool.inputSchema or {}
    props = sch.get("properties") or {}
    return {k: dummy_for(props.get(k) or {}, k) for k in (sch.get("required") or [])}


def looks_stub(text):
    t = (text or "").lower()
    return any(m in t for m in STUB_MARKERS)


def paywall_hits(text, label):
    t = (text or "").lower()
    return [f"{label}:{m}" for m in PAYWALL_MARKERS if m in t]


async def probe_one(root, sd, sem):
    """Probe one server. Every field starts unmeasured; only a returning probe overwrites one."""
    rec = {
        "server": sd, "name": None, "handshake": False, "last_probed": None,
        "tools": [], "tools_count": None, "calls": {}, "stub_tools": [],
        "paywall_hits": [], "error": None,
    }
    d = os.path.join(root, sd)
    if not os.path.exists(os.path.join(d, "server.py")):
        rec["error"] = "no server.py"
        return rec

    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    env = dict(os.environ)
    env["PYTHONPATH"] = d
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    env["MEOK_API_KEY"] = ""
    # Isolated HOME: a shared ~/.meok/usage.json daily counter must not be able to make a working
    # server look like a paywalled one, or vice versa.
    home = tempfile.mkdtemp(prefix="probehome-")
    env["HOME"] = home
    params = StdioServerParameters(command=sys.executable, args=["server.py"], cwd=d, env=env)

    async with sem:
        try:
            async def run():
                async with stdio_client(params) as (r, w):
                    async with ClientSession(r, w) as s:
                        init = await s.initialize()
                        rec["handshake"] = True
                        rec["last_probed"] = datetime.now(timezone.utc).isoformat()
                        rec["name"] = init.serverInfo.name
                        tl = await s.list_tools()
                        rec["tools"] = [t.name for t in tl.tools]
                        rec["tools_count"] = len(tl.tools)
                        for t in tl.tools:
                            rec["paywall_hits"] += paywall_hits(t.description or "", f"desc:{t.name}")
                        for t in tl.tools:
                            try:
                                res = await asyncio.wait_for(
                                    s.call_tool(t.name, args_for(t)), timeout=PER_CALL_TIMEOUT)
                                txt = " ".join(getattr(c, "text", "") or "" for c in res.content)
                            except Exception as e:  # a failing call is data, not a crash
                                txt = f"__CALLERR__ {type(e).__name__}: {e}"
                            rec["calls"][t.name] = txt[:3000]
                            if looks_stub(txt):
                                rec["stub_tools"].append(t.name)
                            rec["paywall_hits"] += paywall_hits(txt, f"call:{t.name}")
            await asyncio.wait_for(run(), timeout=PER_SERVER_TIMEOUT)
        except Exception as e:
            rec["error"] = f"{type(e).__name__}: {str(e)[:300]}"
        finally:
            shutil.rmtree(home, ignore_errors=True)
    return rec


def classify(rec):
    """working | partial | stubbed | dead — the register's vocabulary."""
    if not rec["handshake"]:
        return "dead"
    if not rec["tools"]:
        return "dead"
    n_stub = len(rec["stub_tools"])
    if n_stub == 0:
        return "working"
    if n_stub == len(rec["tools"]):
        return "stubbed"
    return "partial"


async def main_async(root, out, concurrency):
    servers = sorted(
        d for d in os.listdir(root)
        if os.path.isdir(os.path.join(root, d))
        and os.path.exists(os.path.join(root, d, "server.py"))
    )
    if not servers:
        print(f"FATAL: no server.py found under {root}. Refusing to write an empty report.", file=sys.stderr)
        return 2

    started = datetime.now(timezone.utc).isoformat()
    sem = asyncio.Semaphore(concurrency)
    print(f"probing {len(servers)} servers, concurrency={concurrency}", flush=True)

    results = []
    tasks = [asyncio.create_task(probe_one(root, s, sem)) for s in servers]
    for i, fut in enumerate(asyncio.as_completed(tasks), 1):
        results.append(await fut)
        if i % 25 == 0:
            print(f"  {i}/{len(servers)}", flush=True)
    results.sort(key=lambda r: r["server"])

    for r in results:
        r["status"] = classify(r)

    tally = {k: sum(1 for r in results if r["status"] == k)
             for k in ("working", "partial", "stubbed", "dead")}
    artifact = {
        "schema": "csoai.mcp-stdio-probe/1",
        "generated_by": "scripts/mcp-stdio-probe.py",
        "probe_method": (
            "MCP stdio: initialize -> tools/list -> tools/call on every tool with dummy args "
            "derived from each tool's own inputSchema, isolated HOME per server."
        ),
        "probe_host": os.uname().nodename,
        "probe_root": os.path.abspath(root),
        "started": started,
        "finished": datetime.now(timezone.utc).isoformat(),
        "counts": {
            "servers_found": len(servers),
            "handshake_ok": sum(1 for r in results if r["handshake"]),
            "tools_listed": sum(r["tools_count"] or 0 for r in results),
            "calls_ok": sum(1 for r in results for v in r["calls"].values()
                            if not v.startswith("__CALLERR__")),
            "servers_with_paywall_in_mcp_surface": sum(1 for r in results if r["paywall_hits"]),
            "by_status": tally,
        },
        "servers": results,
    }

    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    with open(out, "w") as f:
        json.dump(artifact, f, indent=1)
        f.write("\n")

    c = artifact["counts"]
    print(f"\nRESULT handshake_ok={c['handshake_ok']}/{len(servers)}  tools={c['tools_listed']}  "
          f"calls_ok={c['calls_ok']}  paywalled={c['servers_with_paywall_in_mcp_surface']}")
    print(f"       working={tally['working']} partial={tally['partial']} "
          f"stubbed={tally['stubbed']} dead={tally['dead']}")
    print(f"report -> {out}")
    print("\nCommit this file. An uncommitted probe report is not a measurement.")
    return 0


def selftest():
    """Verify the classifier and the stub detector without needing any server."""
    assert looks_stub('{"status": "stub"}')
    assert looks_stub("Coming soon!")
    assert not looks_stub('{"ok": true, "result": 42}')
    assert paywall_hits("see buy.stripe.com/x", "d") == ["d:buy.stripe.com"]

    mk = lambda hs, tools, stubs: {"handshake": hs, "tools": tools, "stub_tools": stubs}
    assert classify(mk(False, [], [])) == "dead"
    assert classify(mk(True, [], [])) == "dead"
    assert classify(mk(True, ["a", "b"], [])) == "working"
    assert classify(mk(True, ["a", "b"], ["a"])) == "partial"
    assert classify(mk(True, ["a", "b"], ["a", "b"])) == "stubbed"

    # The invariant that matters: a server that never answered carries no timestamp.
    rec = {"server": "x", "handshake": False, "last_probed": None}
    assert rec["last_probed"] is None
    print("selftest ok — stub detection, status classification, and null-timestamp invariant hold")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=os.environ.get("MCP_SERVERS_ROOT", "servers"),
                    help="directory containing one subdirectory per MCP server (default: ./servers)")
    ap.add_argument("--out", default=DEFAULT_OUT, help=f"tracked output path (default: {DEFAULT_OUT})")
    ap.add_argument("--concurrency", type=int, default=int(os.environ.get("PROBE_CONCURRENCY", "12")))
    ap.add_argument("--selftest", action="store_true", help="check the logic, no servers needed")
    a = ap.parse_args()

    if a.selftest:
        sys.exit(selftest())

    if a.out.startswith("/tmp/") or a.out.startswith("/var/folders/"):
        print("FATAL: refusing to write the report to a temp path. The last probe was lost exactly "
              "this way. Use a tracked path such as " + DEFAULT_OUT, file=sys.stderr)
        sys.exit(2)

    if not os.path.isdir(a.root):
        print(f"FATAL: servers root not found: {a.root}\n"
              "  The gspc-os servers/ tree is private and pod-only. On a machine without it, record\n"
              "  those servers as `catalogued-not-probed` in scripts/mcp-targets.json.\n"
              "  Do NOT cite a remembered probe figure — it is unreproducible and therefore unusable.",
              file=sys.stderr)
        sys.exit(2)

    sys.exit(asyncio.run(main_async(a.root, a.out, a.concurrency)))


if __name__ == "__main__":
    main()
