#!/usr/bin/env python3
r"""HOLD watcher: a server whose registry version changed is held until it is re-measured.

A census row describes what an endpoint answered at one moment. When the MCP Registry entry behind it
publishes a new server.version, the old row no longer describes the current contract, and nothing in it
says so. This watcher diffs two registry reads, marks every server whose server.version changed
HOLD_UNTIL_REMEASURED, re-probes the remote endpoints of those servers read-only (prober 0.2, bounded),
and records by name:

  REMEASURED_SAME        re-probed; tool-name set, auth boundary and (where comparable) protocol unchanged
                         vs the last census probe row for the endpoint
  REMEASURED_CHANGED     re-probed; at least one of those changed. `changed` names which, with before/after
  REMEASURED_NO_BASELINE re-probed; the endpoint had no earlier census probe row to compare with
  REMEASURE_INCONCLUSIVE re-probed; either read did not observe a discovery boundary (unreachable, timeout,
                         not MCP, ...): a transient failure is not called a contract change
  HOLD_UNTIL_REMEASURED  still held: no remote endpoint (package-only entry), robots.txt, bound or budget.
                         `hold_reason` says which.

Comparability: the baseline rows come from prober 0.1 (initialize, requesting 2025-11-25); the re-probe is
0.2 (offers 2026-07-28 first). Protocol is compared only when the 0.2 row fell back to the legacy era and
requested 2025-11-25; a modern-era answer is recorded, never counted as a change.

Subcommands
  fetch     GET the registry's servers updated since a time (version=latest, paged, 1 request/s)
  diff      previous snapshot vs current snapshot (+ optional fetched overlay) -> hold.jsonl.gz
  remeasure re-probe the held endpoints (<= --bound) with mcp-remote-probe.py and record outcomes
  --self-test

Snapshots: a census-frame raw page dir (raw/mcp-registry/*.json.gz) or a jsonl with id/version/remotes rows.

Cron (for the flywheel lane to adopt; this lane installs none). Every 6 h: read what changed since the last
read, diff it onto the last snapshot, hold, re-probe <= 300, keep the new snapshot for the next run:
  40 */6 * * *  cd ~/lanes/flywheel/scripts/census && S=~/lanes/flywheel/state/hold && R=$S/$(date -u +\%Y\%m\%dT\%H) && python3 version-hold.py fetch --since-file $S/last-read --out $R && python3 version-hold.py diff --window "cron|$S/snapshot.jsonl.gz|$(cat $S/last-read)|$S/snapshot.jsonl.gz|$(date -u +\%FT\%TZ)|$R/fetched.jsonl.gz" --out $R --write-snapshot $S/snapshot.jsonl.gz && python3 version-hold.py remeasure --hold $R --baseline $S/last-probe --bound 300 && date -u +\%FT\%TZ > $S/last-read
"""
from __future__ import annotations

import argparse
import collections
import datetime
import gzip
import importlib.util
import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))


def _load(name, fn):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, fn))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


F = _load("census_frame", "frame.py")
SCHEMA = "csoai.mcp-version-hold/0.1"
UA = "CSOAI-census/0.1 (+https://councilof.ai/census)"
REGISTRY = "https://registry.modelcontextprotocol.io/v0/servers"
REQUESTED_LEGACY = "2025-11-25"
WATCH_IDS = ("com.crosscheckapi/crosscheck", "io.github.DanceNitra/inspeximus", "ai.limitguard.api/trust-intelligence",
             "io.github.CryptoAPIs-io/mcp-x402-pay", "ai.korala/mcp")
OUTCOMES = ("REMEASURED_SAME", "REMEASURED_CHANGED", "REMEASURED_NO_BASELINE", "REMEASURE_INCONCLUSIVE",
            "HOLD_UNTIL_REMEASURED")


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def canon(u):
    try:
        return F.canonical_endpoint(u)[0] if isinstance(u, str) else None
    except Exception:
        return None


def jl(p):
    op = gzip.open if p.endswith(".gz") else open
    with op(p, "rt") as f:
        for line in f:
            if line.strip():
                yield json.loads(line)


def wgz(p, rows):
    with gzip.GzipFile(p, "wb", mtime=0) as g:
        for r in rows:
            g.write((json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n").encode())


# ---------------------------------------------------------------- snapshots
def norm_server(srv, off):
    return {"id": srv.get("name"), "version": srv.get("version"), "updatedAt": (off or {}).get("updatedAt"),
            "status": (off or {}).get("status"),
            "remotes": sorted({c for c in (canon(r.get("url")) for r in srv.get("remotes") or [] if isinstance(r, dict)) if c}),
            "transports": sorted({str(r.get("type")) for r in srv.get("remotes") or [] if isinstance(r, dict)})}


def load_snapshot(path):
    """-> {id: row}. A raw page dir (census frame) or a jsonl (RAS shape: id, version, remotes[{url}], updated_at)."""
    snap = {}
    if os.path.isdir(path):
        for fn in sorted(os.listdir(path)):
            if fn.endswith(".json.gz"):
                with gzip.open(os.path.join(path, fn), "rt") as f:
                    d = json.load(f)
                for s in d.get("servers") or []:
                    off = (s.get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {}
                    r = norm_server(s.get("server") or {}, off)
                    snap[r["id"]] = r
        return snap
    for r in jl(path):
        if "server" in r:  # a fetched page row
            off = (r.get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {}
            if off.get("isLatest") is False:
                continue
            n = norm_server(r["server"], off)
        elif "remotes" in r and isinstance(r.get("remotes"), list) and r["remotes"] and isinstance(r["remotes"][0], dict):
            n = {"id": r.get("id"), "version": r.get("version"), "updatedAt": r.get("updated_at"), "status": r.get("status"),
                 "remotes": sorted({c for c in (canon(x.get("url")) for x in r["remotes"]) if c}),
                 "transports": sorted({str(x.get("type")) for x in r["remotes"]})}
        else:
            n = {k: r.get(k) for k in ("id", "version", "updatedAt", "status", "remotes", "transports")}
            n["remotes"] = n["remotes"] or []
        snap[n["id"]] = n
    return snap


def fetch(a):
    """GET /v0/servers?updated_since=...&version=latest, paged. 1 request/s. Writes fetched.jsonl.gz (+ pages)."""
    since = a.since or open(a.since_file).read().strip()
    os.makedirs(a.out, exist_ok=True)
    rows, cursor, pages, seen = [], None, 0, set()
    started = utcnow()
    state, reason = "PARTIAL", None
    while pages < 500:
        q = {"limit": "100", "version": "latest", "updated_since": since}
        if cursor:
            q["cursor"] = cursor
        req = urllib.request.Request(REGISTRY + "?" + urllib.parse.urlencode(q), headers={"User-Agent": UA, "Accept": "application/json"})
        t0 = time.monotonic()
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.load(r)
        except Exception as e:
            reason = f"page {pages + 1}: {type(e).__name__}: {str(e)[:120]}"
            break
        pages += 1
        if not isinstance(d, dict) or not isinstance(d.get("servers"), list) or not isinstance(d.get("metadata"), dict):
            reason = f"page {pages}: not a page (no servers[] + metadata{{}})"
            break
        rows.extend(d["servers"])
        cursor = d["metadata"].get("nextCursor")
        if not cursor:
            state, reason = "EXHAUSTED", f"metadata.nextCursor absent on page {pages}: upstream end"
            break
        if cursor in seen:
            reason = f"page {pages}: cursor repeated"
            break
        seen.add(cursor)
        time.sleep(max(0.0, 1.0 - (time.monotonic() - t0)))
    wgz(os.path.join(a.out, "fetched.jsonl.gz"), rows)
    meta = {"schema": SCHEMA + "/fetch", "updated_since": since, "started": started, "finished": utcnow(), "pages": pages,
            "rows": len(rows), "read_state": state, "reason": reason, "user_agent": UA,
            "query": {"version": "latest", "limit": 100}}
    json.dump(meta, open(os.path.join(a.out, "fetched.json"), "w"), indent=1)
    print(json.dumps(meta, indent=1))


# ---------------------------------------------------------------- diff
def diff_snapshots(prev, cur):
    """-> (changed [(id, prev_row, cur_row)], new_ids, gone_ids). Pure."""
    changed = []
    for i, c in cur.items():
        p = prev.get(i)
        if p is not None and p.get("version") != c.get("version"):
            changed.append((i, p, c))
    return changed, sorted(set(cur) - set(prev)), sorted(set(prev) - set(cur))


def diff(a):
    windows = []
    for spec in a.window:
        name, prev_path, prev_asof, cur_path, cur_asof, *overlay = spec.split("|")
        prev = load_snapshot(prev_path)
        cur = load_snapshot(cur_path)
        if overlay and overlay[0]:
            for i, r in load_snapshot(overlay[0]).items():
                cur[i] = r
        changed, new, gone = diff_snapshots(prev, cur)
        last_cur = cur
        windows.append({"name": name, "previous": {"path": prev_path, "as_of": prev_asof, "n": len(prev)},
                        "current": {"path": cur_path, "as_of": cur_asof, "n": len(cur), "overlay": overlay[0] if overlay else None},
                        "changed": changed, "new": new, "gone": gone})
    held = collections.OrderedDict()
    for w in windows:
        for i, p, c in w["changed"]:
            h = held.setdefault(i, {"id": i, "state": "HOLD_UNTIL_REMEASURED", "windows": [], "remotes": c["remotes"],
                                    "transports": c["transports"], "in_watch_list": i in WATCH_IDS})
            h["windows"].append({"window": w["name"], "version_before": p.get("version"), "version_after": c.get("version"),
                                 "updatedAt": c.get("updatedAt")})
            h["remotes"] = c["remotes"]
            h["transports"] = c["transports"]
    rows = list(held.values())
    for r in rows:
        if not r["remotes"]:
            r["hold_reason"] = "no remote endpoint: package-only entry; the remote probe measures remote endpoints only"
    os.makedirs(a.out, exist_ok=True)
    wgz(os.path.join(a.out, "hold.jsonl.gz"), rows)
    summ = {"schema": SCHEMA, "as_of": utcnow(),
            "windows": [{k: w[k] for k in ("name", "previous", "current")} | {"version_changed": len(w["changed"]), "new_ids": len(w["new"]),
                                                                               "absent_ids": len(w["gone"])} for w in windows],
            "held": len(rows), "held_with_remote": sum(1 for r in rows if r["remotes"]),
            "watch_list_held": [r["id"] for r in rows if r["in_watch_list"]],
            "rule": "server.version differs between two reads of the same registry id -> HOLD_UNTIL_REMEASURED",
            "not_held": "new ids and ids absent from the later read are counted, not held (no earlier version to compare)"}
    json.dump(summ, open(os.path.join(a.out, "hold-summary.json"), "w"), indent=1)
    if a.write_snapshot:
        wgz(a.write_snapshot, sorted(last_cur.values(), key=lambda r: r["id"] or ""))
    print(json.dumps({k: summ[k] for k in ("windows", "held", "held_with_remote", "watch_list_held")}, indent=1))


# ---------------------------------------------------------------- remeasure
def boundary(r):
    st = r.get("state")
    if st == "RESPONDED":
        return "gated-at-tools-list" if r.get("tools_list_status") == "auth_required" else "open"
    if st == "AUTH_REQUIRED":
        return "payment-402" if r.get("http_status") == 402 else "gated"
    return None


def compare_probe(before, after):
    """-> (outcome, changed{}, notes[]). Pure."""
    if before is None:
        return "REMEASURED_NO_BASELINE", {}, []
    b0, b1 = boundary(before), boundary(after)
    if b0 is None or b1 is None:
        return "REMEASURE_INCONCLUSIVE", {}, [f"before {before.get('state')}, after {after.get('state')}: no discovery boundary observed on one side"]
    changed, notes, compared = {}, [], set()
    if b0 == b1 or after.get("era") == "legacy":
        compared.add("auth_boundary")
    if b0 != b1:
        if after.get("era") != "legacy":
            # the 0.1 baseline's boundary is the answer to initialize; a 0.2 row that is not legacy-era answered (or
            # refused) server/discover instead. Different methods: the boundary is not compared, only recorded
            notes.append(f"auth boundary not compared: baseline {b0} at initialize (0.1); re-probe {b1} at "
                         f"{'server/discover' if after.get('era') != 'legacy' else 'initialize'} (0.2, era {after.get('era')}), "
                         "a different method")
            if after.get("state") != "RESPONDED":
                return "REMEASURE_INCONCLUSIVE", {}, notes
        else:
            changed["auth_boundary"] = {"before": b0, "after": b1}
    if before.get("state") == after.get("state") == "RESPONDED":
        cb = before.get("tools_list_status") == "ok" and before.get("tools_complete")
        ca = after.get("tools_list_status") == "ok" and after.get("tools_complete")
        if cb and ca:
            compared.add("tool_set")
            if before.get("tool_names_sha256") != after.get("tool_names_sha256"):
                bn, an = set(before.get("tool_names") or []), set(after.get("tool_names") or [])
                changed["tool_set"] = {"before": f"n={before.get('n_tools')} sha256={before.get('tool_names_sha256')}",
                                       "after": f"n={after.get('n_tools')} sha256={after.get('tool_names_sha256')}",
                                       "added": sorted(an - bn)[:5], "removed": sorted(bn - an)[:5]}
        else:
            notes.append("tool set not compared: a tools/list was incomplete on one side")
        era = after.get("era")
        if era == "legacy" and (after.get("protocol_version_requested") or REQUESTED_LEGACY) == REQUESTED_LEGACY:
            compared.add("protocol")
            pb, pa = before.get("protocol_version"), after.get("protocol_version_negotiated") or after.get("protocol_version")
            if pb != pa:
                changed["protocol"] = {"before": pb, "after": pa}
        else:
            notes.append(f"protocol not compared: re-probe era {era} (requested {after.get('protocol_version_requested')}); baseline requested {REQUESTED_LEGACY}")
    if changed:
        return "REMEASURED_CHANGED", changed, notes
    if not compared:
        return "REMEASURE_INCONCLUSIVE", {}, notes + ["nothing comparable between the two reads"]
    return "REMEASURED_SAME", {}, notes + [f"compared: {', '.join(sorted(compared))}"]


def baseline_rows(dirs):
    base = {}
    for d in dirs:
        for r in jl(os.path.join(d, "results.jsonl.gz")):
            prev = base.get(r["endpoint"])
            if prev is None or r["state"] == "RESPONDED" or prev["state"] != "RESPONDED":
                base[r["endpoint"]] = {k: r.get(k) for k in ("state", "http_status", "tools_list_status", "tools_complete",
                                                             "tool_names_sha256", "tool_names", "n_tools", "protocol_version",
                                                             "started")} | {"source": os.path.basename(d.rstrip("/"))}
    return base


def remeasure(a):
    rows = list(jl(os.path.join(a.hold, "hold.jsonl.gz")))
    base = baseline_rows(a.baseline)
    eps, order = [], []
    # watch-list entries first so a bound never drops them; then registry order of the hold list
    for r in sorted(rows, key=lambda r: (not r["in_watch_list"],)):
        for ep in r["remotes"]:
            if ep not in eps:
                eps.append(ep)
    planned = eps[:a.bound]
    over = set(eps[a.bound:])
    pdir = os.path.join(a.hold, "reprobe")
    os.makedirs(pdir, exist_ok=True)
    tr = {}
    for r in rows:
        for ep in r["remotes"]:
            tr.setdefault(ep, r["transports"])
    wgz(os.path.join(pdir, "plan.jsonl.gz"), [{"rank": i + 1, "endpoint": ep, "ranked_by": "hold_list_order",
                                                "transports": tr.get(ep)} for i, ep in enumerate(planned)])
    if planned and not a.no_probe:
        cmd = [sys.executable, os.path.join(HERE, "mcp-remote-probe.py"), "--plan", os.path.join(pdir, "plan.jsonl.gz"),
               "--out", pdir, "--budget-s", str(a.budget_s), "--workers", str(a.workers)]
        subprocess.run(cmd, check=True)
    after = {r["endpoint"]: r for r in jl(os.path.join(pdir, "results.jsonl.gz"))} if os.path.exists(os.path.join(pdir, "results.jsonl.gz")) else {}
    skipped = {r["endpoint"]: r.get("not_attempted") for r in jl(os.path.join(pdir, "not_attempted.jsonl.gz"))} \
        if os.path.exists(os.path.join(pdir, "not_attempted.jsonl.gz")) else {}
    probe_summary = json.load(open(os.path.join(pdir, "summary.json"))) if os.path.exists(os.path.join(pdir, "summary.json")) else {}
    counts = collections.Counter()
    for r in rows:
        per = []
        for ep in r["remotes"]:
            if ep in over:
                per.append({"endpoint": ep, "outcome": "HOLD_UNTIL_REMEASURED", "hold_reason": f"beyond the re-probe bound ({a.bound})"})
                continue
            if ep in skipped or ep not in after:
                per.append({"endpoint": ep, "outcome": "HOLD_UNTIL_REMEASURED", "hold_reason": f"not attempted: {skipped.get(ep, 'no re-probe row')}"})
                continue
            aft = after[ep]
            out, changed, notes = compare_probe(base.get(ep), aft)
            e = {"endpoint": ep, "outcome": out, "after": {"state": aft.get("state"), "era": aft.get("era"),
                                                             "protocol_version_negotiated": aft.get("protocol_version_negotiated"),
                                                             "n_tools": aft.get("n_tools"), "tool_names_sha256": aft.get("tool_names_sha256"),
                                                             "finished": aft.get("finished")}}
            b = base.get(ep)
            if b:
                e["before"] = {"state": b["state"], "source": b["source"], "started": b.get("started"),
                               "n_tools": b.get("n_tools"), "tool_names_sha256": b.get("tool_names_sha256"),
                               "protocol_version": b.get("protocol_version")}
                ua = [w.get("updatedAt") for w in r["windows"] if w.get("updatedAt")]
                if ua and b.get("started"):
                    e["baseline_predates_version_change"] = b["started"] < max(ua)
            if changed:
                e["changed"] = changed
            if notes:
                e["notes"] = notes
            per.append(e)
        r["endpoints"] = per
        if per:
            # an entry is SAME only if every endpoint is SAME; any change wins; any endpoint still held keeps it held
            outs = {p["outcome"] for p in per}
            r["state"] = next(o for o in ("REMEASURED_CHANGED", "HOLD_UNTIL_REMEASURED", "REMEASURE_INCONCLUSIVE",
                                          "REMEASURED_NO_BASELINE", "REMEASURED_SAME") if o in outs)
        counts[r["state"]] += 1
    wgz(os.path.join(a.hold, "hold.jsonl.gz"), rows)
    summ = json.load(open(os.path.join(a.hold, "hold-summary.json")))
    summ.update({"bound": a.bound, "endpoints_held": len(eps), "endpoints_reprobed_planned": len(planned),
                 "counts": {o: counts.get(o, 0) for o in OUTCOMES},
                 "endpoint_outcomes": dict(collections.Counter(p["outcome"] for r in rows for p in r.get("endpoints", []))),
                 "changed_by_name": [{"id": r["id"], "changed": [p.get("changed") for p in r["endpoints"] if p.get("changed")]}
                                     for r in rows if r["state"] == "REMEASURED_CHANGED"],
                 "watch_list": [{"id": r["id"], "state": r["state"], "windows": r["windows"]} for r in rows if r["in_watch_list"]],
                 "reprobe": {"prober": "mcp-remote-probe.py (csoai.census-probe/0.2)", "n_planned": probe_summary.get("n_planned"),
                             "n_attempted": probe_summary.get("n_attempted"), "read_state": probe_summary.get("read_state"),
                             "states": probe_summary.get("states"), "started": probe_summary.get("started"),
                             "finished": probe_summary.get("finished")},
                 "baseline": {"dirs": a.baseline, "prober": "csoai.census-probe/0.1 (initialize, requested 2025-11-25)"},
                 "comparability": "tool set and auth boundary compared across 0.1 -> 0.2; protocol only when the 0.2 row is legacy-era and requested 2025-11-25"})
    json.dump(summ, open(os.path.join(a.hold, "hold-summary.json"), "w"), indent=1)
    print(json.dumps({k: summ[k] for k in ("held", "endpoints_held", "endpoints_reprobed_planned", "counts", "endpoint_outcomes", "watch_list")}, indent=1))


# ---------------------------------------------------------------- self-test
def self_test():
    ok = True

    def check(name, cond):
        nonlocal ok
        ok &= bool(cond)
        print(("PASS " if cond else "FAIL ") + name)
    prev = {"a": {"id": "a", "version": "1.0.0"}, "b": {"id": "b", "version": "2.0"}, "gone": {"id": "gone", "version": "1"}}
    cur = {"a": {"id": "a", "version": "1.0.1"}, "b": {"id": "b", "version": "2.0"}, "new": {"id": "new", "version": "1"}}
    ch, new, gone = diff_snapshots(prev, cur)
    check("version change is held; unchanged is not", [c[0] for c in ch] == ["a"])
    check("new and absent ids are counted, not held", (new, gone) == (["new"], ["gone"]))
    R = lambda **k: {"state": "RESPONDED", "tools_list_status": "ok", "tools_complete": True, "tool_names_sha256": "h1",
                     "n_tools": 2, "tool_names": ["x", "y"], "protocol_version": "2025-11-25"} | k
    check("same", compare_probe(R(), R(era="legacy", protocol_version_negotiated="2025-11-25"))[0] == "REMEASURED_SAME")
    o, c, _ = compare_probe(R(), R(era="legacy", tool_names_sha256="h2", tool_names=["x", "z"]))
    check("tool set change is CHANGED and names it", o == "REMEASURED_CHANGED" and c["tool_set"]["added"] == ["z"])
    o, c, _ = compare_probe(R(), R(era="legacy", tools_list_status="auth_required"))
    check("auth boundary change behind initialize", o == "REMEASURED_CHANGED" and c["auth_boundary"] == {"before": "open", "after": "gated-at-tools-list"})
    o, c, n = compare_probe(R(), {"state": "AUTH_REQUIRED", "http_status": 401, "era": None})
    check("a 401 to server/discover is not an initialize-boundary change", o == "REMEASURE_INCONCLUSIVE" and not c and n)
    o, c, _ = compare_probe({"state": "AUTH_REQUIRED", "http_status": 401}, R(era="legacy"))
    check("gated -> open at initialize is a change", o == "REMEASURED_CHANGED" and c["auth_boundary"]["after"] == "open")
    o, c, n = compare_probe(R(), R(era="modern", protocol_version_negotiated="2026-07-28", protocol_version_requested="2026-07-28"))
    check("modern-era answer is not a protocol change", o == "REMEASURED_SAME" and n)
    check("unreachable is inconclusive, not changed", compare_probe(R(), {"state": "UNREACHABLE"})[0] == "REMEASURE_INCONCLUSIVE")
    check("no baseline", compare_probe(None, R())[0] == "REMEASURED_NO_BASELINE")
    check("SAME needs something compared", compare_probe({"state": "AUTH_REQUIRED", "http_status": 401},
                                                         R(era="modern", tools_list_status="auth_required"))[0] == "REMEASURE_INCONCLUSIVE")
    # must-fail control: a comparator that calls any difference in raw rows a change must fail the modern-era check
    broken = lambda b, a_: ("REMEASURED_CHANGED" if b.get("protocol_version") != (a_.get("protocol_version_negotiated") or b.get("protocol_version")) else "REMEASURED_SAME")
    control_holds = broken(R(), R(era="modern", protocol_version_negotiated="2026-07-28")) != "REMEASURED_SAME"
    check("control: a naive protocol diff would call the 0.1->0.2 prober change a contract change (so the era rule is load-bearing)", control_holds)
    return 0 if ok else 1


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("cmd", nargs="?", choices=["fetch", "diff", "remeasure"])
    ap.add_argument("--since")
    ap.add_argument("--since-file")
    ap.add_argument("--out")
    ap.add_argument("--window", action="append", default=[],
                    help="NAME|PREV_PATH|PREV_AS_OF|CUR_PATH|CUR_AS_OF[|OVERLAY_JSONL]")
    ap.add_argument("--write-snapshot")
    ap.add_argument("--hold")
    ap.add_argument("--baseline", action="append", default=[])
    ap.add_argument("--bound", type=int, default=300)
    ap.add_argument("--budget-s", type=float, default=1200)
    ap.add_argument("--workers", type=int, default=32)
    ap.add_argument("--no-probe", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return self_test()
    {"fetch": fetch, "diff": diff, "remeasure": remeasure}[a.cmd](a)
    return 0


if __name__ == "__main__":
    sys.exit(main())
