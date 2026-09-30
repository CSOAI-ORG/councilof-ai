# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""tool_drift: two independent tools/list observations of the same MCP endpoint -> one capsule per endpoint.

declared = what the endpoint advertised at T1 (the tool set, as digests); observed = what it advertised at T2;
differential = tool names added / removed (multiset), and, where per-tool hashes were recorded on BOTH sides,
the names whose description or inputSchema hash changed. serverInfo.version at T1 and T2 is recorded beside it:
a change with a version change and a change without one are both just recorded states.

Measurement only. A difference is not called malicious, a rug-pull or poisoning; it is a recorded difference
between two observations. Nothing here judges intent.

Join: exact endpoint URL string. Only endpoints observed (attempted) at BOTH times get a capsule; an endpoint absent
from T2 is not REMOVED, it is UNCHECKABLE (classify(t1, None)), and is counted in the batch record, not capsuled.

Granularity (per side, the weakest side sets what is measurable):
  per_tool_hashes  name + sha256(raw description) + sha256(whitespace-collapsed description) + sha256(canonical inputSchema)
                   per tool (written by the daily tool-drift probe from 2026-09-26 on);
  names            the complete sorted tool-name list (census probe rows, tool_names, when len == n_tools);
  names_hash       only tool_names_sha256 (sha256 of the sorted names joined by '\\n'; lists over 500 names were truncated).
The 25 Sep census rows carry names + names hash only: descriptions and schemas were never stored, so for those pairs
the description and schema dimensions are UNCHECKABLE and the endpoint state says UNCHANGED_AT_NAME_GRANULARITY, never
UNCHANGED.

--src = T1 results file(s) (comma-separated; a directory means its results.jsonl.gz); --aux = T2 results file(s).
Ordering is not change: tool lists are compared as multisets; the names hash is over sorted names.
"""
import collections, gzip, json, os, pathlib
import venturi_capsule as v
from adapters import PendingSource

NAME = "tool_drift"
KIND = "measurement.tool_drift"
DEFAULT_T1 = "/evac-bulk/census-probe-2026-09-25/results.jsonl.gz"
DEFAULT_T2 = "/evac-bulk/census-firstparty-2026-09-25/results.jsonl.gz"
LIMITS = [
    "a recorded difference between two observations; it does not say why the tool list changed and never judges intent",
    "a difference can come from a release, a load-balanced fleet serving mixed versions, per-session or per-region tool lists, "
    "or feature flags; the capsule cannot tell these apart",
    "join is by exact endpoint URL; the same server reachable at two URLs is two subjects",
    "no tool was called; only discovery (initialize or server/discover) and tools/list were read",
]
TOOLS_KEPT = 500


# ---------------------------------------------------------------- hashing (the one definition the probe also imports)
def ws_collapse(s):
    return " ".join(s.split())


def tool_hashes(t):
    """Per-tool digests. Raw description bytes and whitespace-collapsed bytes are hashed separately, so a whitespace-only
    edit is visible (raw differs) and labelled (collapsed equal). inputSchema is hashed over canonical JSON (object keys
    sorted; array order kept). A missing field hashes to None, which differs from an empty string."""
    d = t.get("description")
    d = d if isinstance(d, str) else (None if d is None else json.dumps(d, sort_keys=True, ensure_ascii=False))
    s = t.get("inputSchema", None)
    return {"name": str(t.get("name")),
            "description_sha256": None if d is None else v.sha(d.encode("utf-8", "surrogatepass")),
            "description_ws_sha256": None if d is None else v.sha(ws_collapse(d).encode("utf-8", "surrogatepass")),
            "input_schema_sha256": None if "inputSchema" not in t else v.sha(v.canon(s))}


def names_sha(names):
    return v.sha("\n".join(sorted(names)).encode())


# ---------------------------------------------------------------- observation
def observation(row, file_sha256=None):
    """One census/drift-probe row -> the compact observation this adapter compares. Reads, never infers."""
    si = row.get("server_info") if isinstance(row.get("server_info"), dict) else {}
    names = row.get("tool_names") if isinstance(row.get("tool_names"), list) else None
    n = row.get("n_tools")
    complete = bool(row.get("tools_complete")) and row.get("tools_list_status") == "ok"
    tools = row.get("tools") if isinstance(row.get("tools"), list) else None
    names_complete = names is not None and isinstance(n, int) and len(names) == n
    tools_complete_hashes = tools is not None and isinstance(n, int) and len(tools) == n and bool(row.get("tools_hashes_complete", True))
    gran = ("per_tool_hashes" if complete and tools_complete_hashes else
            "names" if complete and names_complete else
            "names_hash" if complete and row.get("tool_names_sha256") else None)
    return {"endpoint": row.get("endpoint"), "state": row.get("state"), "observed_at": row.get("started"),
            "server_name": si.get("name"), "server_version": si.get("version"),
            "n_tools": n, "tools_complete": complete, "tool_names_sha256": row.get("tool_names_sha256"),
            "tool_names": names if names_complete else None, "tools": tools if tools_complete_hashes else None,
            "granularity": gran, "row_sha256": v.sha(v.canon(row)), "file_sha256": file_sha256,
            "declared_transports": row.get("declared_transports")}


def _paths(spec):
    out = []
    for p in str(spec).split(","):
        p = pathlib.Path(p.strip())
        out.append(p / "results.jsonl.gz" if p.is_dir() else p)
    return out


def load_side(spec):
    """{endpoint: observation}; several rows for one endpoint -> the latest by started. Streams the gzip."""
    obs, files = {}, {}
    for p in _paths(spec):
        if not p.exists():
            raise PendingSource(f"no results file at {p}")
        fs = v.file_sha(p)
        files[str(p)] = fs
        with gzip.open(p, "rt") as f:
            for line in f:
                r = json.loads(line)
                e = r.get("endpoint")
                if not e:
                    continue
                o = observation(r, fs)
                if e not in obs or (o["observed_at"] or "") > (obs[e]["observed_at"] or ""):
                    obs[e] = o
    return obs, files


# ---------------------------------------------------------------- classification
def _version_state(a, b):
    va, vb = a.get("server_version"), b.get("server_version")
    if va is None and vb is None:
        return "UNREPORTED_BOTH"
    if va is None:
        return "UNREPORTED_T1"
    if vb is None:
        return "UNREPORTED_T2"
    return "SAME" if va == vb else "CHANGED"


def _per_name(tools, key):
    """name -> the SET of distinct hash values under that name. A change in how many times a name occurs is a names
    change (multiset, above); it is not also counted as a description or schema change."""
    d = collections.defaultdict(set)
    for t in tools:
        d[t["name"]].add(t.get(key))
    return d


def classify(t1, t2):
    """-> (measurement_state, differential). Pure; no I/O."""
    if t1 is None or t2 is None:
        side = "T1" if t1 is None else "T2"
        return "UNCHECKABLE", {"reason": f"not observed at {side}; absence from an observation is not removal"}
    if t1.get("state") != "RESPONDED" or t2.get("state") != "RESPONDED":
        return "UNCHECKABLE", {"reason": f"state T1 {t1.get('state')}, T2 {t2.get('state')}: both must be RESPONDED"}
    if not (t1.get("granularity") and t2.get("granularity")):
        which = [s for s, t in (("T1", t1), ("T2", t2)) if not t.get("granularity")]
        return "UNCHECKABLE", {"reason": f"tools/list incomplete or not ok at {'+'.join(which)}"}
    vs = _version_state(t1, t2)
    diff = {"version_state": vs,
            "server_name_state": "SAME" if t1.get("server_name") == t2.get("server_name") else "CHANGED",
            "granularity": {"t1": t1["granularity"], "t2": t2["granularity"]}}
    flags = []
    # names (multiset): the names hash is over the sorted list, so reordering never changes it
    if t1["tool_names_sha256"] == t2["tool_names_sha256"]:
        diff["names"] = {"state": "UNCHANGED"}
    elif t1.get("tool_names") is not None and t2.get("tool_names") is not None:
        c1, c2 = collections.Counter(t1["tool_names"]), collections.Counter(t2["tool_names"])
        added, removed = sorted((c2 - c1).elements()), sorted((c1 - c2).elements())
        diff["names"] = {"state": "CHANGED", "added": added, "removed": removed}
        flags += (["TOOLS_ADDED"] if added else []) + (["TOOLS_REMOVED"] if removed else [])
        if not added and not removed:  # the hash moved but the lists agree: hash input differs from the kept list
            diff["names"]["note"] = "names hash differs while the kept lists are equal"
            flags.append("NAME_SET_CHANGED")
    else:
        diff["names"] = {"state": "CHANGED", "note": "names hash differs; the member lists were not kept in full, so which names changed is not recoverable"}
        flags.append("NAME_SET_CHANGED")
    # descriptions + schemas: only where BOTH sides carry per-tool hashes
    if t1["granularity"] == "per_tool_hashes" and t2["granularity"] == "per_tool_hashes":
        common = sorted(set(t["name"] for t in t1["tools"]) & set(t["name"] for t in t2["tools"]))
        d1, d2 = _per_name(t1["tools"], "description_sha256"), _per_name(t2["tools"], "description_sha256")
        w1, w2 = _per_name(t1["tools"], "description_ws_sha256"), _per_name(t2["tools"], "description_ws_sha256")
        s1, s2 = _per_name(t1["tools"], "input_schema_sha256"), _per_name(t2["tools"], "input_schema_sha256")
        dch = []
        for n in common:
            if d1[n] == d2[n]:
                continue  # raw bytes equal: never flagged, whatever the whitespace
            if None in d1[n] or None in d2[n]:
                kind = "presence"  # a description appeared or disappeared
            elif w1[n] == w2[n]:
                kind = "whitespace_only"
            else:
                kind = "content"
            dch.append({"name": n, "change": kind})
        sch = [n for n in common if s1[n] != s2[n]]
        diff["descriptions"] = {"state": "CHANGED" if dch else "UNCHANGED", "changed": dch, "compared_names": len(common)}
        diff["schemas"] = {"state": "CHANGED" if sch else "UNCHANGED", "changed": sch, "compared_names": len(common)}
        if dch:
            flags.append("DESCRIPTION_CHANGED_WHITESPACE_ONLY" if all(x["change"] == "whitespace_only" for x in dch)
                         else "DESCRIPTION_CHANGED")
        if sch:
            flags.append("SCHEMA_CHANGED")
        full = True
    else:
        missing = [s for s, t in (("T1", t1), ("T2", t2)) if t["granularity"] != "per_tool_hashes"]
        why = f"per-tool description and inputSchema hashes were not recorded at {'+'.join(missing)}"
        diff["descriptions"] = {"state": "UNCHECKABLE", "reason": why}
        diff["schemas"] = {"state": "UNCHECKABLE", "reason": why}
        full = False
    if flags:
        state = "+".join(flags)
        diff["changed_with_version_change"] = vs == "CHANGED"
        diff["changed_without_version_change"] = vs == "SAME"
    else:
        state = "UNCHANGED" if full else "UNCHANGED_AT_NAME_GRANULARITY"
    return state, diff


def is_change(state):
    return any(k in state for k in ("TOOLS_ADDED", "TOOLS_REMOVED", "NAME_SET_CHANGED", "DESCRIPTION_CHANGED", "SCHEMA_CHANGED"))


# ---------------------------------------------------------------- capsules
def _side(o):
    d = {"observed_at": o.get("observed_at"), "state": o.get("state"), "server_name": o.get("server_name"),
         "server_version": o.get("server_version"), "n_tools": o.get("n_tools"), "tools_complete": o.get("tools_complete"),
         "tool_names_sha256": o.get("tool_names_sha256"), "granularity": o.get("granularity")}
    if o.get("tools") is not None:
        d["per_tool"] = sorted(([t["name"], t.get("description_sha256"), t.get("description_ws_sha256"), t.get("input_schema_sha256")]
                                for t in o["tools"]), key=lambda x: [str(y) for y in x])
        d["per_tool_columns"] = ["name", "description_sha256", "description_ws_sha256", "input_schema_sha256"]
    return d


def capsule_for(endpoint, t1, t2, labels):
    state, diff = classify(t1, t2)
    return v.make_capsule(
        kind=KIND, subject_id=endpoint,
        claim={"statement": "the tools this endpoint advertised at T1 are the tools it advertised at T2 "
                            "(names always; descriptions and input schemas where both observations recorded them)",
               "t1": labels["t1"], "t2": labels["t2"], "join": "exact endpoint URL"},
        declared=_side(t1), observed=_side(t2), differential=diff,
        sources={"t1_file_sha256": t1.get("file_sha256"), "t2_file_sha256": t2.get("file_sha256"),
                 "t1_row_sha256": t1.get("row_sha256"), "t2_row_sha256": t2.get("row_sha256"),
                 "t1_tool_names_sha256": t1.get("tool_names_sha256"), "t2_tool_names_sha256": t2.get("tool_names_sha256")},
        measurement_state=state, limitations=LIMITS, observed_at=t2.get("observed_at"))


def capsules(src, stats, aux=None):
    t1s, f1 = load_side(src or DEFAULT_T1)
    t2s, f2 = load_side(aux or DEFAULT_T2)
    join = sorted(set(t1s) & set(t2s))
    labels = {"t1": sorted(f1.values()), "t2": sorted(f2.values())}
    stats.update(t1_files=f1, t2_files=f2, n_t1=len(t1s), n_t2=len(t2s), n_join=len(join),
                 n_t1_only=len(set(t1s) - set(t2s)), n_t2_only=len(set(t2s) - set(t1s)))
    by_state, gran, ver = collections.Counter(), collections.Counter(), collections.Counter()
    t1_only_responded = sum(1 for e in set(t1s) - set(t2s) if t1s[e]["state"] == "RESPONDED")
    stats["t1_responded_absent_at_t2"] = t1_only_responded
    for e in join:
        c = capsule_for(e, t1s[e], t2s[e], labels)
        by_state[c["measurement_state"]] += 1
        g = c["differential"].get("granularity")
        if g:
            gran[f"{g['t1']}->{g['t2']}"] += 1
        if is_change(c["measurement_state"]):
            ver[c["differential"]["version_state"]] += 1
        yield c
    stats["by_state"], stats["granularity"], stats["changes_by_version_state"] = dict(by_state), dict(gran), dict(ver)


def meta(src, stats):
    return {"what_this_is": "Tool drift: for each MCP endpoint observed at two independent times, whether the tools it advertised "
                            "(names; descriptions and input schemas where recorded) are the same. One capsule per endpoint in the "
                            "exact-URL join of the two observations.",
            "what_this_is_not": "Not a finding of malice, poisoning or a rug-pull, and not a grade of any server. A change is a recorded "
                                "difference between two observations; a version change beside it is recorded, not treated as an excuse.",
            "granularity_available": stats.get("granularity"),
            "granularity_note": "names = complete sorted tool-name lists + their sha256; per_tool_hashes adds description (raw and "
                                "whitespace-collapsed) and inputSchema sha256 per tool. The 25 Sep census stored names only: "
                                "description and schema drift is UNCHECKABLE for those rows.",
            "source": {"t1_files_sha256": stats.get("t1_files"), "t2_files_sha256": stats.get("t2_files"),
                       "n_t1_endpoints": stats.get("n_t1"), "n_t2_endpoints": stats.get("n_t2"), "n_join": stats.get("n_join"),
                       "n_t1_only": stats.get("n_t1_only"), "n_t2_only": stats.get("n_t2_only"),
                       "t1_responded_absent_at_t2": stats.get("t1_responded_absent_at_t2"),
                       "absent_at_t2_rule": "not capsuled and never counted as REMOVED: absence from an observation is UNCHECKABLE"},
            "capsules_by_state": stats.get("by_state"),
            "changes_by_version_state": stats.get("changes_by_version_state")}


def main(argv=None):
    """python3 -m adapters.tool_drift --out DIR [--src T1] [--aux T2]: the same build path as `venturi_capsule.py build`
    (write_batch), usable before this adapter is registered in adapters.NAMES. sign / ots / verify: venturi_capsule.py --out DIR."""
    import argparse, sys
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True); ap.add_argument("--src", default=DEFAULT_T1); ap.add_argument("--aux", default=DEFAULT_T2)
    a = ap.parse_args(argv)
    stats = {}
    try:
        rec = v.write_batch(a.out, NAME, KIND, capsules(a.src, stats, aux=a.aux), lambda: meta(a.src, stats))
    except PendingSource as e:
        print(json.dumps({"adapter": NAME, "state": "PENDING_SOURCE", "why": str(e)}))
        sys.exit(3)
    print(json.dumps({"adapter": NAME, "n": rec["n_capsules"], "states": rec["states"], "merkle_root": rec["merkle_root"],
                      "gz_bytes": rec["capsules_file"]["bytes"], "source": rec.get("source")}))


if __name__ == "__main__":
    main()
