#!/usr/bin/env python3
"""Build, sign and anchor the csoai.mcp-remote-census/0.1 publication record.

    build-mcp-remote-census-record.py build  --frame DIR --probe DIR --out DIR --stage DIR
    build-mcp-remote-census-record.py sign   --out DIR [--token FILE]
    build-mcp-remote-census-record.py ots    --out DIR
    build-mcp-remote-census-record.py readme --out DIR --stage DIR

build  reads the census frame (frame.py) and the remote MCP probe (mcp-remote-probe.py) outputs,
       recomputes every figure it publishes from the row files (the run summaries are cross-checked,
       never copied blind), and writes record.json. It also writes the public per-endpoint rows to
       the staging dir: endpoint, host, state, reason, HTTP status, protocolVersion, tool count and
       the sha256 of the sorted tool-name list. Tool names, tool descriptions and serverInfo are
       NOT published. Gzip is written with mtime 0 so the bytes are reproducible.
sign   posts a compact payload pinning record.json by sha256 to POST https://councilof.ai/api/board-sign
       with the pod caller token (never printed), verifies the Ed25519 signature against
       did:web:csoai.org#board-attestation-1 from https://csoai.org/.well-known/did.json, and runs an
       altered-preimage control that MUST fail. Nothing is written unless both hold.
ots    submits sha256(record.json) to three OpenTimestamps calendars and writes record.json.ots and
       record.ots.json. A fresh stamp is a PENDING CALENDAR COMMITMENT, not a Bitcoin attestation.
readme renders the Hugging Face dataset card from record.json, so no figure in it is hand-typed.

Correction 0.1.1 (superseding; record.json 0.1 is kept byte for byte):
    build-mcp-remote-census-record.py evidence --out DIR          fetch the MCP 2026-07-28 primary sources
    build-mcp-remote-census-record.py correct  --out DIR --probe DIR --prober-commit SHA [--smoke DIR]
    build-mcp-remote-census-record.py sign     --out DIR --record record.v0.1.1.json
    build-mcp-remote-census-record.py ots      --out DIR --record record.v0.1.1.json
    build-mcp-remote-census-record.py publish-correction --out DIR [--hf-token FILE]
evidence  fetches each primary source, records URL, final URL, HTTP status, fetched_at, byte count and
          sha256 of the bytes, and checks every quoted phrase is present in them (<= 15 words each).
correct   derives record.v0.1.1.json from record.json (whose sha256 must be the published 0.1):
          measurements untouched; the protocolVersion interpretation corrected; a `supersedes` and a
          `correction` block added.
publish-correction uploads record.v0.1.1.json (+ .signed.json, .json.ots, .ots.json) and a README with a
          Corrections section in ONE commit, and proves the 0.1 files are byte-identical before and after.

Doctrine: a PARTIAL read is never a population total; UNREACHABLE and TIMEOUT are published states,
not omissions; nothing here says a server is safe, good, or endorsed.
"""
import argparse, base64, collections, datetime, gzip, hashlib, io, json, os, pathlib, subprocess, sys
import urllib.request

# The How-to-cite / corrections / verification block every public csoai/* card carries (lane L5, 28 Sep 2026)
# has ONE producer, scripts/hf/cite_block.py; the card below passes through it so a rebuild keeps the block.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "hf"))
from cite_block import apply as cite_apply  # noqa: E402

SCHEMA = "csoai.mcp-remote-census/0.1"
RECORD_PATH = "/interop/mcp-remote-census-2026-09-25/record.json"
HF_REPO = "csoai/mcp-remote-census"
OWN_HOSTS = ("meok.ai", "csoai.org", "councilof.ai")
SUPERSESSION = "public/interop/mcp-registry-2026-09-23/supersession.json"
PUBLIC_ROW_KEYS = ["rank", "ranked_by", "endpoint", "host", "state", "reason", "http_status",
                   "transport", "protocol_version", "tools_list_status", "tools_complete", "n_tools",
                   "tool_names_sha256", "started", "finished"]
DNS_MARKERS = ("Name or service not known", "No address associated with hostname")

# ---- correction 0.1.1 (2026-09-25). The 0.1 bytes (sha256 V0_1_SHA) were built at 5821e4c7b with the
# texts in V0_1_TEXT; build() now emits the corrected texts, correct() derives 0.1.1 from the 0.1 bytes.
V0_1_SHA = "c4880fdba78709034466045f6c2ac1eda7c466c96502c75cca68ea34795dce84"
V0_1_TEXT = {
    "protocol_version.note": ("a server answers with the requested version when it supports it, otherwise with one of its own; "
                              "this distribution is conditional on the request and is not a census of what servers support"),
    "anomalies[A1].what_we_do_not_say": "anything about the operator's intent, or whether the version string is correct",
}
PV_NOTE_0_1_1 = ("We requested 2025-11-25, a legacy (initialize-handshake) MCP revision, and sent no request in the current "
                 "revision, 2026-07-28, which has no initialize handshake. Under the 2025-11-25 lifecycle a server that "
                 "supports the requested version MUST answer with it, otherwise with another version it supports. This "
                 "distribution is therefore what servers negotiated against an older requested version: it is not the newest "
                 "version each server supports, and it cannot show which servers also speak 2026-07-28.")
A1_NOT_SAY_0_1_1 = ("anything about the operator's intent. '2026-07-28' is a real MCP revision (published 2026-07-28, "
                    "the latest at our check); these endpoints named it inside a legacy initialize exchange, a handshake that "
                    "revision retired. We do not say which revision's behaviour they implement.")
EVIDENCE_REL = "evidence/mcp-2026-07-28-primary-sources.json"
MCP_SOURCES = [  # (url, [phrases that must be present in the fetched bytes, whitespace/markup-normalised])
    ("https://blog.modelcontextprotocol.io/posts/2026-07-28/",
     ["pushing the release button on the next version of the MCP specification, 2026-07-28",
      "officially retired the initialize / initialized exchange"]),
    ("https://modelcontextprotocol.io/specification/2026-07-28",
     ["Version 2026-07-28 (latest)"]),
    ("https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning.md",
     ["There is no negotiation handshake.",
      "establish a session with an initialize handshake (2025-11-25 and earlier)"]),
    ("https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http.md",
     ["Every POST request to the MCP endpoint MUST include an MCP-Protocol-Version header."]),
    ("https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle.md",
     ["Otherwise, the server MUST respond with another protocol version it supports."]),
]


def sha(b):
    return hashlib.sha256(b).hexdigest()


def fsha(p):
    return sha(pathlib.Path(p).read_bytes())


def jl(p):
    with gzip.open(p, "rt") as f:
        return [json.loads(l) for l in f if l.strip()]


def gz_bytes(rows):
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", mtime=0, filename="") as g:
        for r in rows:
            g.write((json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n").encode())
    return buf.getvalue()


def nearest_rank(sorted_vals, q):
    # nearest-rank percentile: the smallest value with at least q of the list at or below it
    import math
    k = max(1, math.ceil(q * len(sorted_vals)))
    return sorted_vals[k - 1]


def tool_stats(rows):
    v = sorted(r["n_tools"] for r in rows)
    if not v:
        return {"n": 0}
    return {"n": len(v), "p25": nearest_rank(v, .25), "median": nearest_rank(v, .5),
            "p75": nearest_rank(v, .75), "max": v[-1], "min": v[0],
            "zero_tools": sum(1 for x in v if x == 0)}


def git(*a):
    return subprocess.check_output(["git", *a], text=True).strip()


def build(a):
    frame, probe, out, stage = map(pathlib.Path, (a.frame, a.probe, a.out, a.stage))
    out.mkdir(parents=True, exist_ok=True); stage.mkdir(parents=True, exist_ok=True)
    fs = json.load(open(frame / "summary.json"))
    plan = json.load(open(frame / "plan-top20.json"))
    ps = json.load(open(probe / "summary.json"))
    rows = jl(probe / "results.jsonl.gz")
    na = jl(probe / "not_attempted.jsonl.gz")
    plan_rows = jl(frame / "plan-top20.jsonl.gz")
    entries = jl(frame / "entries.jsonl.gz")

    # ---- cross-check the run summaries against the row files (bytes adjudicate) ----
    states = collections.Counter(r["state"] for r in rows)
    checks = {
        "attempted_rows == summary.n_attempted": len(rows) == ps["n_attempted"],
        "not_attempted_rows == summary.n_not_attempted": len(na) == ps["n_not_attempted"],
        "plan_rows == summary.n_planned": len(plan_rows) == ps["n_planned"],
        "attempted + not_attempted == planned": len(rows) + len(na) == ps["n_planned"],
        "state counts == summary.states": dict(states) == ps["states"],
        "plan sha256 == summary.plan.sha256": fsha(frame / "plan-top20.jsonl.gz") == ps["plan"]["sha256"],
        "distinct endpoints attempted == attempted rows": len({r["endpoint"] for r in rows}) == len(rows),
    }
    bad = [k for k, ok in checks.items() if not ok]
    if bad:
        sys.exit(f"REFUSING: summary disagrees with its own rows: {bad}")

    resp = [r for r in rows if r["state"] == "RESPONDED"]
    complete = [r for r in resp if r.get("tools_list_status") == "ok" and r.get("tools_complete") and isinstance(r.get("n_tools"), int)]
    pv = collections.Counter(r.get("protocol_version") for r in resp)
    sets = collections.Counter(r["tool_names_sha256"] for r in complete)
    by_host = collections.defaultdict(list)
    for r in resp:
        by_host[r["host"]].append(r)

    # host-deduplicated view: the best-ranked complete row per host
    first_per_host = {}
    for r in sorted(complete, key=lambda r: r["rank"]):
        first_per_host.setdefault(r["host"], r)

    # ---- anomalies, measured from the rows ----
    gv = [r for r in resp if r["host"] == "getvda.ai" or r["host"].endswith(".getvda.ai")]
    gv_sets = collections.Counter(r.get("tool_names_sha256") for r in gv)
    gv_top_sha, gv_top_n = gv_sets.most_common(1)[0]
    gv_top_names = next(r["tool_names"] for r in gv if r.get("tool_names_sha256") == gv_top_sha)
    a2 = [r for r in resp if r["host"] == "a2awire.com"]
    a2_sets = collections.Counter(r.get("tool_names_sha256") for r in a2)
    a2_ntools = {}
    for s, _ in a2_sets.most_common():
        a2_ntools[s] = next(r["n_tools"] for r in a2 if r.get("tool_names_sha256") == s)
    unreach = [r for r in rows if r["state"] == "UNREACHABLE"]
    dns_def = [r for r in unreach if (r.get("reason") or "").startswith("at robots.txt fetch: dns:") and any(m in r["reason"] for m in DNS_MARKERS)]
    dns_tmp = [r for r in unreach if (r.get("reason") or "").startswith("at robots.txt fetch: dns:") and r not in dns_def]
    unreach_reason = collections.Counter()
    for r in unreach:
        s = r.get("reason") or ""
        if s.startswith("at robots.txt fetch: dns:"):
            k = "dns: name does not resolve (EAI_NONAME / EAI_NODATA)" if r in dns_def else "dns: temporary resolver failure (EAI_AGAIN)"
        elif s.startswith("at robots.txt fetch: tls:"):
            k = "tls handshake failed at robots.txt fetch"
        elif s.startswith("at robots.txt fetch:"):
            k = "connect failed at robots.txt fetch"
        else:
            k = "HTTP 5xx on the MCP request"
        unreach_reason[k] += 1

    # ---- the measuring estate's own entries ----
    own = [r for r in rows if any(r["host"] == h or r["host"].endswith("." + h) for h in OWN_HOSTS)]
    own_dead = sorted({r["endpoint"] for r in own if r["state"] == "UNREACHABLE"})
    ep_to_ids = collections.defaultdict(set)
    for e in entries:
        if e.get("source") != "mcp-registry":
            continue
        for ep in e.get("endpoints") or []:
            if ep.get("canonical"):
                ep_to_ids[ep["canonical"]].add(e["id"])
    own_dead_ids = sorted({i for ep in own_dead for i in ep_to_ids.get(ep, ())})
    own_dead_hosts = sorted({r["host"] for r in own if r["state"] == "UNREACHABLE"})
    sup_bytes = subprocess.check_output(["git", "show", "HEAD:" + SUPERSESSION])
    sup = json.loads(sup_bytes)

    # ---- tier-2 fill: registry listing order is byte-ascending server name; measure that ----
    reg = [e for e in entries if e.get("source") == "mcp-registry"]
    reg_sorted = sorted(reg, key=lambda e: e["order"])
    ids_in_order = [e["id"] for e in reg_sorted]
    ascending_pairs = sum(1 for x, y in zip(ids_in_order, ids_in_order[1:]) if x <= y)
    order_to_id = {e["order"]: e["id"] for e in reg}
    tier2 = [r for r in plan_rows if str(r.get("ranked_by", "")).startswith("registry_order")]
    tier2_mcp = [r for r in tier2 if r["ranked_by"] == "registry_order:mcp-registry"]
    last_order = max(r["registry_order"] for r in tier2_mcp)
    # share of registry entries (with an endpoint) named io.github.* : in the fill vs in the registry
    reg_with_ep = [e for e in reg if any(ep.get("canonical") and not ep.get("reject") and not ep.get("templated") for ep in e.get("endpoints") or [])]
    fill_ids = [order_to_id[r["registry_order"]] for r in tier2_mcp]
    io_gh = lambda ids: sum(1 for i in ids if i.startswith("io.github."))

    # ---- attempted, by the plan tier that put them there ----
    tier_of = {r["endpoint"]: ("reach_signal" if not str(r["ranked_by"]).startswith("registry_order") else "registry_order") for r in plan_rows}
    ranked_by_attempted = collections.Counter(r["ranked_by"] for r in rows)

    # ---- public rows ----
    pub_rows = [{k: r.get(k) for k in PUBLIC_ROW_KEYS} for r in sorted(rows, key=lambda r: r["rank"])]
    pub_na = [{"rank": r["rank"], "ranked_by": r["ranked_by"], "endpoint": r["endpoint"], "state": "NOT_ATTEMPTED",
               "reason": r["not_attempted"]} for r in sorted(na, key=lambda r: r["rank"])]
    files = {}
    for name, blob in (("probe/results.public.jsonl.gz", gz_bytes(pub_rows)),
                       ("probe/not_attempted.jsonl.gz", gz_bytes(pub_na))):
        p = stage / name; p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(blob)
        files[name] = {"sha256": sha(blob), "bytes": len(blob), "rows": len(pub_rows if "results" in name else pub_na)}
    for src, name in ((frame / "summary.json", "frame/summary.json"), (frame / "plan-top20.json", "frame/plan-top20.json"),
                      (probe / "summary.json", "probe/summary.json")):
        blob = src.read_bytes(); p = stage / name; p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(blob)
        files[name] = {"sha256": sha(blob), "bytes": len(blob)}

    head = git("rev-parse", "HEAD")
    producers = {p: {"sha256_at_head": sha(subprocess.check_output(["git", "show", f"HEAD:{p}"]))}
                 for p in ("scripts/census/frame.py", "scripts/census/reach.py", "scripts/census/read_state.py",
                           "scripts/census/mcp-remote-probe.py")}

    independent = None
    if a.other_read:
        od = pathlib.Path(a.other_read)          # read-only: another lane's directory is never written
        o_sum_b = (od / "summary.json").read_bytes(); o_sum = json.loads(o_sum_b)
        o_diff_b = (od / "mcp-corpus-diff-20260925.json").read_bytes(); o_diff = json.loads(o_diff_b)
        o_rows_p = od / "official-mcp-registry-full.jsonl"
        o_rows = [json.loads(l) for l in open(o_rows_p) if l.strip()]
        o_ver = {r["id"]: r.get("version") for r in o_rows}
        f_ver = {e["id"]: (e.get("meta") or {}).get("version") for e in reg}
        common = set(o_ver) & set(f_ver)
        mt = lambda p: datetime.datetime.fromtimestamp(p.stat().st_mtime, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        prod = od.parent / "sync_official_mcp_full.py"
        independent = {
            "what_this_is": ("Two readers of the official MCP registry, written separately, ran about an hour apart on the same day. "
                             "Their row counts are CITED side by side. The data is not merged, and this is not a reconciliation: "
                             "the registry changed between the reads, so a difference is expected and is not an error in either."),
            "reads": [
                {"reader": "census frame (this record)", "producer": "scripts/census/frame.py", "user_agent": fs["user_agent"],
                 "endpoint": "https://registry.modelcontextprotocol.io/v0/servers?limit=100&version=latest",
                 "window_utc": [fs["run_started"], fs["run_finished"]], "window_note": "the whole frame run; the MCP registry source took 464 s of it",
                 "read_state": fs["sources"]["mcp-registry"]["read_state"], "pages": fs["sources"]["mcp-registry"]["pages"], "rows": fs["sources"]["mcp-registry"]["rows_read"],
                 "file": "frame/summary.json", "sha256": fsha(frame / "summary.json")},
                {"reader": "RAS discovery lane (a different lane, different code)", "producer": "sync_official_mcp_full.py",
                 "producer_sha256": fsha(prod) if prod.is_file() else None, "user_agent": "CSOAI-RAS-Discovery/0.1",
                 "endpoint": "https://registry.modelcontextprotocol.io/v0.1/servers?limit=100&version=latest",
                 "finished_utc_file_mtime": mt(od / "summary.json"),
                 "read_state": o_sum.get("state"), "pages": o_sum.get("pages"), "rows": o_sum.get("rows"), "remote": o_sum.get("remote"),
                 "file": "summary.json", "sha256": sha(o_sum_b),
                 "rows_file_sha256": fsha(o_rows_p),
                 "corpus_diff": {"file": "mcp-corpus-diff-20260925.json", "sha256": sha(o_diff_b),
                                 "against": "the estate's canonical public MCP corpus", "canonical_public_sha256": o_diff.get("canonical_public_sha256"),
                                 "canonical_mcp_ids": o_diff.get("canonical_mcp_ids"), "new_official_ids": o_diff.get("new_official_ids"),
                                 "canonical_ids_absent_from_current_official": o_diff.get("canonical_ids_absent_from_current_official"),
                                 "version_changed_common": o_diff.get("version_changed_common"), "its_note": o_diff.get("note")}},
            ],
            "time_gap": "the RAS read finished at about 04:40Z; the frame read ran 05:45:50Z-05:54:05Z, roughly 65-74 minutes later",
            "row_difference_frame_minus_ras": fs["sources"]["mcp-registry"]["rows_read"] - (o_sum.get("rows") or 0),
            "id_sets": {"in_both": len(common), "only_in_frame_read": len(set(f_ver) - set(o_ver)), "only_in_ras_read": len(set(o_ver) - set(f_ver)),
                        "in_both_with_a_different_latest_version": sum(1 for i in common if f_ver[i] != o_ver[i])},
            "reading": None,
        }

    if independent:
        ids = independent["id_sets"]
        independent["reading"] = (f"Every id in the earlier RAS read ({ids['in_both'] + ids['only_in_ras_read']:,}) is also in the later frame read, "
                                  f"which has {ids['only_in_frame_read']} more; {ids['in_both_with_a_different_latest_version']} shared ids carry a different "
                                  "latest version. That is consistent with publications made between the reads, and the two reads agree to within that churn. "
                                  "'remote' (RAS) and 'entries with an endpoint' (frame) are defined differently and are not compared.")
    src = fs["sources"]
    record = {
        "schema": SCHEMA,
        "record_id": "mcp-remote-census-2026-09-25",
        "as_of": ps["finished"],
        "built_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publisher": "Council of AI (CSOAI), councilof.ai",
        "licence": {"data": "CC-BY-4.0"},
        "what_this_is": ("A dated measurement of what remote MCP endpoints, listed in public catalogues, answered to "
                         "initialize and tools/list on 2026-09-25, from one place. It is a measurement of the endpoints "
                         "we attempted - the top 20% of an ordered plan - and not of every endpoint in any catalogue."),
        "read_state_vocabulary": {
            "EXHAUSTED": "the upstream signalled its end (no next cursor / declared total reached) and every row was read",
            "PARTIAL": "some rows or endpoints were not read; counts are over what was read and are never a population total",
        },
        "units": {
            "catalogue row": "one listing in one source catalogue",
            "endpoint": "one canonical URL (scheme + lowercased host + non-default port + path; query/fragment dropped)",
            "host": "one lowercased hostname",
            "attempted endpoint": "an endpoint the probe contacted (robots.txt at least); one row in probe/results.public.jsonl.gz",
            "tool count": "len(tools) summed over tools/list pages for ONE endpoint, only when the listing completed",
            "tool_names_sha256": "sha256 of the sorted tool names joined by \\n, UTF-8",
        },
        "producer": {"repo": "councilof-ai (lane census-frame-20260925)", "commit": head, "files": producers,
                     "this_builder": "scripts/census/build-mcp-remote-census-record.py"},
        "inputs": {"frame/summary.json": fsha(frame / "summary.json"), "frame/plan-top20.json": fsha(frame / "plan-top20.json"),
                   "frame/plan-top20.jsonl.gz": fsha(frame / "plan-top20.jsonl.gz"), "frame/entries.jsonl.gz": fsha(frame / "entries.jsonl.gz"),
                   "probe/summary.json": fsha(probe / "summary.json"), "probe/results.jsonl.gz": fsha(probe / "results.jsonl.gz"),
                   "probe/not_attempted.jsonl.gz": fsha(probe / "not_attempted.jsonl.gz"),
                   "probe/results.run1.jsonl.gz (first run, kept, not published)": fsha(probe / "results.run1.jsonl.gz")},
        "summary_cross_checks": checks,

        "independent_reads": independent,

        "frame": {
            "schema": fs["schema"], "run": [fs["run_started"], fs["run_finished"]], "user_agent": fs["user_agent"],
            "requests": fs["requests"],
            "sources": {k: {kk: v.get(kk) for kk in ("read_state", "reason", "declared_total", "rows_read", "distinct_ids",
                                                      "population_total", "distinct_endpoints", "entries_without_endpoint", "page_set_sha256")}
                        for k, v in src.items()},
            "union": {"endpoints_read": fs["union"]["endpoints_in_file"], "hosts_read": fs["union"]["hosts_in_file"],
                      "combined_population_total": None,
                      "combined_population_total_null_because": fs["union"]["population_total_null_because"],
                      "note": "endpoints_read counts what was read. It is not a population total: Smithery was read PARTIAL (264 distinct of a declared 17,186; the anonymous API stops at 5 pages and lists no endpoint URL)."},
            "overlap_endpoint_level_in_2plus_catalogues": fs["overlap"]["endpoint_level"]["in_2plus_catalogues"],
            "overlap_host_level_in_2plus_catalogues": fs["overlap"]["host_level"]["in_2plus_catalogues"],
            "what_a_row_is": fs["what_a_row_is"], "what_it_never_proves": fs["what_it_never_proves"],
        },

        "plan": {
            "schema": plan["schema"], "as_of": plan["as_of"], "candidates": plan["candidates"], "excluded": plan["excluded"],
            "fraction": plan["fraction"], "top_n": plan["top_n"], "sha256_plan_rows": ps["plan"]["sha256"],
            "tier_1_reach_signalled": {
                "n": plan["top_n"] - len(tier2),
                "signal_mix": {k: v for k, v in plan["signal_mix_top"].items() if not k.startswith("registry_order")},
                "signals": {k: {kk: plan[k].get(kk) for kk in ("source", "definition", "status", "read_state") if kk in plan[k]}
                            for k in ("npm_weekly_downloads", "pypi_downloads_7d", "dockerhub_pull_count", "smithery_use_count")},
                "rule": "ordered by standing WITHIN the endpoint's own signal (reach_pct); signals are different units and are never added or converted",
            },
            "tier_2_alphabetical_fill": {
                "n": len(tier2),
                "label": "ALPHABETICAL FILL - not a reach signal",
                "what_it_is": "the remaining plan slots filled in MCP registry listing order, then Docker catalogue order",
                "listing_order_is_byte_ascending_server_name": {"adjacent_pairs_ascending": ascending_pairs,
                                                                "adjacent_pairs": len(ids_in_order) - 1},
                "fill_reached": {"last_registry_order": last_order, "last_server_name": order_to_id.get(last_order),
                                 "registry_entries": len(reg)},
                "bias_measured": {"io.github.*_share_in_fill": [io_gh(fill_ids), len(fill_ids)],
                                  "io.github.*_share_among_registry_entries_with_a_probeable_endpoint": [io_gh([e["id"] for e in reg_with_ep]), len(reg_with_ep)],
                                  "meaning": "the fill favours reverse-DNS names early in the byte order; it is a deterministic tie-break, not a sample of the registry"},
            },
            "github_stars": plan["github_stars"],
        },

        "probe": {
            "schema": ps["schema"], "window": [ps["started"], ps["finished"]], "user_agent": ps["user_agent"],
            "read_state": ps["read_state"], "read_state_rule": ps["read_state_rule"],
            "n_planned": ps["n_planned"], "n_attempted": ps["n_attempted"], "n_not_attempted": ps["n_not_attempted"],
            "not_attempted_by_reason": ps["not_attempted_by_reason"],
            "states": dict(states.most_common()),
            "state_meanings": {
                "RESPONDED": "answered initialize with an MCP result",
                "AUTH_REQUIRED": "refused without a credential (401/402/403 or an auth error); no credential was ever sent",
                "MCP_ERROR": "answered with a JSON-RPC error to initialize",
                "SSE_ENDPOINT_ONLY": "legacy SSE transport: served an endpoint event; no session was opened",
                "NOT_MCP": "answered, but not with MCP (HTML, 404, non-JSON-RPC)",
                "UNREACHABLE": "no usable answer: DNS, TLS, connect failure, or HTTP 5xx",
                "TIMEOUT": "no answer within 10 s connect / 15 s read",
            },
            "states_by_plan_tier": ps["states_by_rank_tier"],
            "attempted_by_ranked_by": dict(ranked_by_attempted.most_common()),
            "auth_required_http_status": ps["auth_required_http_status"],
            "requests": {"total": ps["requests"]["total"], "run1": ps["requests"]["run1"]["total"], "reprobe": ps["requests"]["reprobe"]["total"],
                         "max_to_one_host_run1": ps["requests"]["run1"]["max_to_one_host"], "hosts_stopped_by_429": 0},
            "limits": ps["limits"], "sent_to_endpoints": ps["sent_to_endpoints"], "never_sent": ps["never_sent"],
            "corrections": ps["corrections"],
            "population_note": ps["population_note"],
        },

        "measured_tool_surface": {
            "over": "RESPONDED endpoints whose tools/list completed (all pages read, status ok)",
            "responded": len(resp), "tools_list_status": dict(collections.Counter(r.get("tools_list_status") for r in resp)),
            "per_endpoint_tool_count": tool_stats(complete),
            "per_host_tool_count_best_ranked_endpoint_per_host": tool_stats(list(first_per_host.values())),
            "per_endpoint_tool_count_excluding_getvda_ai_and_a2awire_com": tool_stats([r for r in complete if r not in gv and r not in a2]),
            "percentile_method": "nearest rank",
            "distinct_tool_name_sets": len(sets),
            "largest_identical_tool_name_set": sets.most_common(1)[0][1],
            "responded_hosts": len(by_host),
            "top_hosts_by_responded_endpoints": [[h, len(v)] for h, v in sorted(by_host.items(), key=lambda kv: (-len(kv[1]), kv[0]))[:5]],
            "sum_of_tool_counts_is_not_a_population_figure": True,
            "transport": dict(collections.Counter(r.get("transport") for r in resp).most_common()),
        },

        "protocol_version": {
            "requested": ps["responded"]["protocol_version_requested"],
            "answered": dict(pv.most_common()),
            "note": PV_NOTE_0_1_1,
        },

        "anomalies": [
            {"id": "A1", "host": "getvda.ai",
             "measured": {"responded_subdomains": len({r['host'] for r in gv}), "responded_endpoints": len(gv),
                          "answering_protocol_version": dict(collections.Counter(r.get('protocol_version') for r in gv)),
                          "sharing_one_tool_name_set": gv_top_n, "that_set": gv_top_names, "that_set_sha256": gv_top_sha},
             "what_we_say": (f"{gv_top_n} distinct getvda.ai subdomains answered with the identical {len(gv_top_names)}-tool set "
                             f"{gv_top_names} and every getvda.ai endpoint answered protocolVersion "
                             f"{next(iter(collections.Counter(r.get('protocol_version') for r in gv)))!r} to a request for "
                             f"{ps['responded']['protocol_version_requested']!r}. They are {len(gv)} of the {len(resp)} RESPONDED endpoints and "
                             "the single largest identical tool-name set. Counts per endpoint therefore over-weight one operator."),
             "what_we_do_not_say": A1_NOT_SAY_0_1_1},
            {"id": "A2", "host": "a2awire.com",
             "measured": {"responded_endpoints": len(a2), "tool_name_sets": [[s, n, a2_ntools[s]] for s, n in a2_sets.most_common()]},
             "what_we_say": (f"{sum(n for _, n in a2_sets.most_common(2))} of {len(a2)} a2awire.com endpoints fall into two tool-name sets "
                             f"({a2_sets.most_common(2)[0][1]} with {a2_ntools[a2_sets.most_common(2)[0][0]]} tools, "
                             f"{a2_sets.most_common(2)[1][1]} with {a2_ntools[a2_sets.most_common(2)[1][0]]} tools). "
                             "One host is the largest single contributor of RESPONDED endpoints."),
             "correction_to_the_brief": "the lane brief said '109/112 identical'; the rows show 109/112 in TWO identical sets, not one"},
            {"id": "A3", "stage": "UNREACHABLE by cause; every DNS failure happened at the robots.txt fetch, the first request to a host",
             "measured": {"unreachable": len(unreach), "by_cause": dict(unreach_reason.most_common()),
                          "dns_name_does_not_resolve": len(dns_def), "dns_name_does_not_resolve_hosts": len({r['host'] for r in dns_def}),
                          "dns_temporary_failure": len(dns_tmp),
                          "of_which_ours_api_meok_ai": sum(1 for r in dns_def if r["host"] == "api.meok.ai")},
             "what_we_say": (f"{len(dns_def)} attempted endpoints are listed at hostnames that do not resolve "
                             f"(EAI_NONAME/EAI_NODATA at the robots.txt fetch); 1 more had a temporary resolver failure and is not counted as dead. "
                             f"{sum(1 for r in dns_def if r['host'] == 'api.meok.ai')} of the {len(dns_def)} are our own (see own_entries).")},
        ],

        "own_entries": {
            "statement": (f"{len(own_dead)} remote endpoints published under our own namespace io.github.CSOAI-ORG in the official MCP registry "
                          f"point at {', '.join(own_dead_hosts)}, which does not resolve in DNS. They were probed like everyone else's and are "
                          "counted in UNREACHABLE above. This is our defect, not the registry's."),
            "hosts_matching": list(OWN_HOSTS),
            "states": dict(collections.Counter(r["state"] for r in own)),
            "dead_endpoints": len(own_dead),
            "dead_registry_ids": len(own_dead_ids),
            "dead_registry_ids_in_io.github.CSOAI-ORG": sum(1 for i in own_dead_ids if i.startswith("io.github.CSOAI-ORG/")),
            "answering": sorted({r["endpoint"] for r in own if r["state"] == "RESPONDED"}),
            "why_not_fixed": ("Deprecating or deleting any io.github.CSOAI-ORG/* entry requires GitHub authentication as an Owner of the "
                              "organisation; a domain proof for councilof.ai grants ai.councilof/* only. The reasons, from the registry's own "
                              "source, are recorded in the supersession record."),
            "supersession_record": {"url": "https://councilof.ai/interop/mcp-registry-2026-09-23/supersession.json",
                                    "repo_path": SUPERSESSION, "sha256": sha(sup_bytes), "record_id": sup.get("record_id"),
                                    "its_finding_F1": next(f["finding"] for f in sup["findings"] if f["id"] == "F1")},
            "exclude_to_remove_our_own": "drop rows whose host is api.meok.ai or councilof.ai",
        },

        "not_evidence_of": [
            "that any server is safe, secure, correct, maintained, or fit for any purpose",
            "the quality of any server or its tools, or that a tool does what its name says",
            "endorsement, ranking, grading, or approval of any server or operator",
            "anything about the ~80% of the frame outside the top-20% plan, or the 232 planned endpoints not attempted",
            "a population total of MCP servers or endpoints: the frame is PARTIAL (Smithery) and the probe is PARTIAL",
            "reachability at any other moment or from any other network location",
            "what AUTH_REQUIRED servers expose behind their credential",
        ],
        "published_files": files,
        "hf_dataset": f"https://huggingface.co/datasets/{HF_REPO}",
        "verify": {
            "signature": "record.signed.json: canonicalise its payload (JSON, keys sorted, no whitespace, UTF-8); sha256 must equal signature.payload_sha256; payload.artifact.sha256 must equal sha256(record.json); verify signature.sig_ed25519 (hex) with the #board-attestation-1 Ed25519 key in https://csoai.org/.well-known/did.json",
            "timestamp": "record.json.ots is an OpenTimestamps proof over sha256(record.json). When published it was a PENDING calendar commitment; `ots upgrade` then `ots verify record.json.ots` against a Bitcoin node decides whether it has become a Bitcoin attestation",
            "files": "sha256 of every published file is in published_files and is pinned by the signature through record.json",
        },
    }
    (out / "record.json").write_text(json.dumps(record, indent=1, ensure_ascii=False) + "\n")
    print(f"record.json sha256={fsha(out / 'record.json')} checks={all(checks.values())}")


def _names(record):
    stem = record[:-len(".json")]
    return {"signed": stem + ".signed.json", "ots": record + ".ots", "ots_state": stem + ".ots.json",
            "path": RECORD_PATH.rsplit("/", 1)[0] + "/" + record}


def sign(a):
    from cryptography.hazmat.primitives.asymmetric import ed25519
    out = pathlib.Path(a.out); nm = _names(a.record)
    raw = (out / a.record).read_bytes(); rec = json.loads(raw)
    tok = pathlib.Path(os.path.expanduser(a.token)).read_text().strip()
    payload = {
        "schema": "csoai.signed-artifact/0.1",
        "artifact": {"path": nm["path"], "sha256": sha(raw), "schema": rec["schema"], "as_of": rec["as_of"]},
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
        "not_a_grade": "The signature proves these bytes were signed by the board key on the date below; it does not prove any claim inside beyond what the record's own instruments measured.",
        "read_state": rec["probe"]["read_state"], "n_planned": rec["probe"]["n_planned"], "n_attempted": rec["probe"]["n_attempted"],
        "states": rec["probe"]["states"], "frame_combined_population_total": rec["frame"]["union"]["combined_population_total"],
        "published_files": {k: v["sha256"] for k, v in rec["published_files"].items()},
    }
    if rec.get("supersedes"):
        payload["record_version"] = rec["record_version"]
        payload["supersedes_sha256"] = rec["supersedes"]["sha256"]
        payload["correction_scope"] = rec["correction"]["scope"]
    canon = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    assert len(canon) <= 3072, f"payload {len(canon)} bytes > 3072"
    req = urllib.request.Request("https://councilof.ai/api/board-sign", data=json.dumps({"payload": payload}).encode(),
                                 headers={"content-type": "application/json", "authorization": "Bearer " + tok,
                                          "user-agent": "Mozilla/5.0 csoai-pod-signer"})
    r = json.load(urllib.request.urlopen(req, timeout=40))
    assert r["payload_sha256"] == sha(canon), "preimage mismatch"
    did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"user-agent": "Mozilla/5.0"}), timeout=20))
    x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
    pk = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
    pk.verify(bytes.fromhex(r["sig_ed25519"]), canon)
    print("signature VERIFIES under did:web:csoai.org#board-attestation-1")
    controls = {}
    for name, altered in (("trailing byte appended", canon + b" "),
                          ("record sha256 altered", canon.replace(sha(raw).encode(), ("0" * 64).encode()))):
        assert altered != canon
        try:
            pk.verify(bytes.fromhex(r["sig_ed25519"]), altered); controls[name] = "VERIFIED (CONTROL FAILED)"
        except Exception:
            controls[name] = "rejected (control holds)"
    print("controls:", controls)
    if any("FAILED" in v for v in controls.values()):
        sys.exit(3)
    doc = {"schema": "csoai.signed-run/0.1", "payload": payload,
           "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                         "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                         "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
           "local_verification": {"did_document": "https://csoai.org/.well-known/did.json", "result": "VERIFIES", "altered_preimage_controls": controls},
           "verify": "canonicalise payload as above, sha256 must equal signature.payload_sha256, verify sig_ed25519 (hex) with the #board-attestation-1 key in https://csoai.org/.well-known/did.json"}
    (out / nm["signed"]).write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(f"SIGNED {a.record} sha256={sha(raw)} payload_sha256={r['payload_sha256']} signed_at={r.get('signed_at')} controls={controls}")


def ots(a):
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
    cals = ["https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org",
            "https://finney.calendar.eternitywall.com"]
    out = pathlib.Path(a.out); nm = _names(a.record); raw = (out / a.record).read_bytes(); d = hashlib.sha256(raw).digest()
    ts = Timestamp(d); got = []; failed = {}
    for u in cals:
        try:
            ts.merge(RemoteCalendar(u).submit(d, timeout=30)); got.append(u)
        except Exception as e:
            failed[u] = f"{type(e).__name__}: {str(e)[:80]}"
    if not got:
        sys.exit("NOT_STAMPED: no calendar accepted the digest; no .ots written")
    ctx = BytesSerializationContext(); DetachedTimestampFile(OpSHA256(), ts).serialize(ctx); proof = ctx.getbytes()
    (out / nm["ots"]).write_bytes(proof)
    back = DetachedTimestampFile.deserialize(BytesDeserializationContext((out / nm["ots"]).read_bytes()))
    atts = [type(x[1]).__name__ for x in back.timestamp.all_attestations()]
    side = {"schema": "csoai.ots-state/0.1", "file": a.record, "sha256": sha(raw), "ots_file": nm["ots"],
            "ots_sha256": sha(proof), "stamped_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "calendars_accepted": got, "calendars_failed": failed, "proof_parses": True,
            "proof_binds_to_file_digest": back.file_digest == d, "attestations": atts,
            "state": "PENDING_CALENDAR_COMMITMENT",
            "state_meaning": ("Calendars accepted this digest and promised future Bitcoin inclusion. This is NOT a Bitcoin attestation "
                              "and is not described as one. It becomes one only after `ots upgrade` returns a BitcoinBlockHeaderAttestation "
                              "and `ots verify` checks it against the chain."),
            "signing_is_separate": "record.signed.json says WHO attests to these bytes; this proof, once upgraded, says WHEN they existed."}
    assert all(a_ == "PendingAttestation" for a_ in atts), atts
    (out / nm["ots_state"]).write_text(json.dumps(side, indent=1) + "\n")
    print(f"OTS {len(got)} calendars, {len(atts)} pending attestations, binds={side['proof_binds_to_file_digest']}")


def readme(a):
    out, stage = pathlib.Path(a.out), pathlib.Path(a.stage)
    rec = json.loads((out / "record.json").read_text()); sig = json.loads((out / "record.signed.json").read_text())
    side = json.loads((out / "record.ots.json").read_text())
    p, f, ts, pv = rec["probe"], rec["frame"], rec["measured_tool_surface"], rec["protocol_version"]
    t1, t2 = rec["plan"]["tier_1_reach_signalled"], rec["plan"]["tier_2_alphabetical_fill"]
    st = "\n".join(f"| {k} | {v:,} | {p['state_meanings'][k]} |" for k, v in p["states"].items())
    srcs = "\n".join(f"| {k} | {v['read_state']} | {v['rows_read']:,} | {v['distinct_endpoints']:,} | "
                     f"{'null' if v['population_total'] is None else format(v['population_total'], ',')} |" for k, v in f["sources"].items())
    pvs = "\n".join(f"| {k} | {v:,} |" for k, v in pv["answered"].items())
    tc = ts["per_endpoint_tool_count"]; th = ts["per_host_tool_count_best_ranked_endpoint_per_host"]
    tx = ts["per_endpoint_tool_count_excluding_getvda_ai_and_a2awire_com"]
    an = "\n".join(f"- **{x['id']}** - {x['what_we_say']}" for x in rec["anomalies"])
    ne = "\n".join(f"- {x}" for x in rec["not_evidence_of"])
    fl = "\n".join(f"| `{k}` | `{v['sha256']}` |" for k, v in rec["published_files"].items())
    own = rec["own_entries"]
    ir = rec.get("independent_reads")
    if ir:
        f0, f1 = ir["reads"]; ids = ir["id_sets"]
        ir_md = (f"{ir['what_this_is']}\n\n| reader | user agent | endpoint | when (UTC) | read state | pages | rows | summary sha256 |\n|---|---|---|---|---|---|---|---|\n"
                 f"| {f0['reader']} | `{f0['user_agent']}` | `{f0['endpoint']}` | {f0['window_utc'][0]} to {f0['window_utc'][1]} | {f0['read_state']} | {f0['pages']} | {f0['rows']:,} | `{f0['sha256']}` |\n"
                 f"| {f1['reader']} | `{f1['user_agent']}` | `{f1['endpoint']}` | finished {f1['finished_utc_file_mtime']} (file mtime) | {f1['read_state']} | {f1['pages']} | {f1['rows']:,} | `{f1['sha256']}` |\n\n"
                 f"Time gap: {ir['time_gap']}. Ids in both: {ids['in_both']:,}; only in the frame read: {ids['only_in_frame_read']}; only in the RAS read: {ids['only_in_ras_read']}; "
                 f"shared ids with a different latest version: {ids['in_both_with_a_different_latest_version']}. {ir['reading']} "
                 f"The RAS lane also diffed its read against the estate's canonical public MCP corpus (`mcp-corpus-diff-20260925.json`, sha256 `{f1['corpus_diff']['sha256']}`): "
                 f"{f1['corpus_diff']['new_official_ids']:,} new, {f1['corpus_diff']['canonical_ids_absent_from_current_official']} absent from the current registry, "
                 f"{f1['corpus_diff']['version_changed_common']:,} version changes against {f1['corpus_diff']['canonical_mcp_ids']:,} canonical ids.")
    else:
        ir_md = "None recorded."
    rsha = hashlib.sha256((out / "record.json").read_bytes()).hexdigest()
    md = f"""---
license: cc-by-4.0
pretty_name: Remote MCP endpoint census (measured read, 2026-09-25)
tags:
- mcp
- model-context-protocol
- measurement
- census
configs:
- config_name: probe-2026-09-25
  data_files: probe/results.public.jsonl.gz
- config_name: not-attempted-2026-09-25
  data_files: probe/not_attempted.jsonl.gz
---

# Remote MCP endpoint census - measured read, 2026-09-25

What remote MCP endpoints listed in public catalogues answered to `initialize` and `tools/list`,
on {p['window'][0]} to {p['window'][1]}, from one network location. Published by Council of AI (CSOAI).
We **measure**. We do not certify, grade, rank or endorse any server.

**Read state: {p['read_state']}.** {p['n_attempted']:,} endpoints attempted of {p['n_planned']:,} planned
({p['n_not_attempted']} not attempted: robots.txt). The plan is the top 20% of an ordered frame; every
count below is over the attempted endpoints and is **not** a population total of MCP servers.

Record: `record.json` sha256 `{rsha}`, signed (Ed25519, `{sig['signature']['did']}`) at
{sig['signature']['signed_at']}, OpenTimestamps state **{side['state']}** at publication (see below).

## 1. The frame (what the catalogues list)

| source | read_state | rows read | distinct endpoints | population total |
|---|---|---|---|---|
{srcs}

Endpoints read across sources: {f['union']['endpoints_read']:,} on {f['union']['hosts_read']:,} hosts.
**Combined population total: null**, because {', '.join(f['union']['combined_population_total_null_because'])}.
{f['union']['note']}

### An independent second read of the MCP registry (cited, not merged)

{ir_md}

## 2. The plan (which 20% we probed, and why that 20%)

{rec['plan']['candidates']:,} probeable candidates; top {rec['plan']['top_n']:,} planned.

- **Tier 1, reach-signalled ({t1['n']:,}):** {', '.join(f'{k} {v:,}' for k, v in t1['signal_mix'].items())}. {t1['rule']}.
- **Tier 2, {t2['label']} ({t2['n']:,}):** {t2['what_it_is']}. Registry listing order is byte-ascending server name
  ({t2['listing_order_is_byte_ascending_server_name']['adjacent_pairs_ascending']:,} of {t2['listing_order_is_byte_ascending_server_name']['adjacent_pairs']:,} adjacent pairs ascending);
  the fill stopped at `{t2['fill_reached']['last_server_name']}`. io.github.* names: {t2['bias_measured']['io.github.*_share_in_fill'][0]:,} of {t2['bias_measured']['io.github.*_share_in_fill'][1]:,} in the fill vs
  {t2['bias_measured']['io.github.*_share_among_registry_entries_with_a_probeable_endpoint'][0]:,} of {t2['bias_measured']['io.github.*_share_among_registry_entries_with_a_probeable_endpoint'][1]:,} registry entries with a probeable endpoint. {t2['bias_measured']['meaning']}.
- GitHub stars were not used: {rec['plan']['github_stars']['why']}.

## 3. The probe (what the endpoints answered)

| state | endpoints | meaning |
|---|---|---|
{st}

Sent: {'; '.join(p['sent_to_endpoints'])}. **Never sent:** {', '.join(p['never_sent'])}.
One connection and at least {p['limits']['min_interval_s_per_host']} s between requests per host; at most one retry. {p['requests']['total']:,} requests in total.
Correction recorded: {p['corrections'][0]['what']} ({p['corrections'][0]['endpoints_reprobed']} re-probed; first run kept, not published).

### Tool surface (RESPONDED, tools/list complete)

Units: tools listed by one endpoint. Percentiles by nearest rank. A sum of tool counts is not a population figure.

| view | n | p25 | median | p75 | max |
|---|---|---|---|---|---|
| per endpoint | {tc['n']:,} | {tc['p25']} | {tc['median']} | {tc['p75']} | {tc['max']} |
| per host (best-ranked endpoint) | {th['n']:,} | {th['p25']} | {th['median']} | {th['p75']} | {th['max']} |
| per endpoint, excluding getvda.ai and a2awire.com | {tx['n']:,} | {tx['p25']} | {tx['median']} | {tx['p75']} | {tx['max']} |

{ts['distinct_tool_name_sets']:,} distinct tool-name sets; the largest identical set covers {ts['largest_identical_tool_name_set']} endpoints.

### protocolVersion answered (we requested `{pv['requested']}`)

| protocolVersion | endpoints |
|---|---|
{pvs}

{pv['note']}.

## 4. Anomalies

{an}

## 5. Our own dead entries

{own['statement']} {own['why_not_fixed']} Record: {own['supersession_record']['url']}
(sha256 `{own['supersession_record']['sha256']}`). To exclude the measuring estate's own rows: {own['exclude_to_remove_our_own']}.

## 6. What this is not evidence of

{ne}

## Files

| file | sha256 |
|---|---|
| `record.json` | `{rsha}` |
{fl}

`record.signed.json` (signature), `record.json.ots` (OpenTimestamps proof), `record.ots.json` (its stated state).
Per-endpoint rows carry: {', '.join(PUBLIC_ROW_KEYS)}. They carry **no** tool names, tool descriptions or serverInfo;
`tool_names_sha256` is sha256 of the sorted tool names joined by `\\n`, UTF-8 (as the probe computes it). Rows are derived from public catalogue listings.

## How to verify

**Signature.** In `record.signed.json`: serialise `payload` as JSON with keys sorted recursively, no whitespace, UTF-8.
Its sha256 must equal `signature.payload_sha256`. `payload.artifact.sha256` must equal sha256 of `record.json`.
Verify `signature.sig_ed25519` (hex) over those bytes with the Ed25519 key `#board-attestation-1`
(`publicKeyJwk.x`, base64url) in https://csoai.org/.well-known/did.json. Change one byte of the payload and it must fail.

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
s = json.load(open("record.signed.json"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("record.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
did = json.load(urllib.request.urlopen("https://csoai.org/.well-known/did.json"))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
```

**Timestamp.** `pip install opentimestamps-client`, then `ots upgrade record.json.ots` and `ots verify record.json.ots`
(verification needs a Bitcoin node or a block explorer). At publication the proof held
{len(side['attestations'])} pending calendar attestations from {', '.join(side['calendars_accepted'])}: a **pending calendar
commitment, not a Bitcoin attestation**. It proves nothing about time until it is upgraded and verified against the chain.

## Licence

Data: CC-BY-4.0. Cite as: Council of AI (CSOAI), *Remote MCP endpoint census, measured read 2026-09-25*, {HF_REPO}.
"""
    md = cite_apply(md, HF_REPO)
    (stage / "README.md").write_text(md)
    for n in ("record.json", "record.signed.json", "record.json.ots", "record.ots.json"):
        (stage / n).write_bytes((out / n).read_bytes())
    print(f"README.md {len(md)} chars; staged record files")



# ---------------------------------------------------------------- correction 0.1.1
def _norm(b, is_html):
    import html as _html, re as _re
    t = b.decode("utf-8", "replace")
    if is_html:
        t = _re.sub(r"<script.*?</script>|<style.*?</style>", " ", t, flags=_re.S)
        t = _html.unescape(_re.sub(r"<[^>]+>", " ", t))
    t = t.replace("**", "").replace("`", "")
    t = _re.sub(r"\s+", " ", t)
    return _re.sub(r" ([,.)])", r"\1", t)


def evidence(a):
    out = pathlib.Path(a.out); rows = []
    for url, phrases in MCP_SOURCES:
        req = urllib.request.Request(url, headers={"user-agent": "CSOAI-census/0.1 (+https://councilof.ai)"})
        fetched = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        with urllib.request.urlopen(req, timeout=30) as r:
            body, status, final = r.read(), r.status, r.geturl()
        text = _norm(body, not url.endswith(".md"))
        quotes = []
        for ph in phrases:
            assert len(ph.split()) <= 15, ph
            quotes.append({"quote": ph, "words": len(ph.split()), "present_in_fetched_bytes": ph in text})
        rows.append({"url": url, "final_url": final, "http_status": status, "fetched_at": fetched,
                     "bytes": len(body), "sha256": sha(body), "quotes": quotes})
        print(f"{status} {url} {len(body)}B sha256={sha(body)} quotes_ok={all(q['present_in_fetched_bytes'] for q in quotes)}")
    doc = {"schema": "csoai.primary-source-check/0.1",
           "question": "Is '2026-07-28' a real, published MCP protocol version, and what does it change about version negotiation?",
           "method": ("each URL fetched once with urllib; sha256 is over the exact bytes received; each quote is checked against "
                      "those bytes after stripping HTML tags (HTML pages), markdown emphasis/backticks, and collapsing whitespace. "
                      "Bytes are not republished here (third-party content); re-fetch and compare, noting pages can change."),
           "sources": rows,
           "verdict": ("CONFIRMED" if all(q["present_in_fetched_bytes"] for r_ in rows for q in r_["quotes"])
                       else "NOT CONFIRMED: a quote was absent")}
    (out / EVIDENCE_REL).parent.mkdir(parents=True, exist_ok=True)
    (out / EVIDENCE_REL).write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    print("verdict:", doc["verdict"], "file sha256:", fsha(out / EVIDENCE_REL))
    if doc["verdict"] != "CONFIRMED":
        sys.exit(2)


def correct(a):
    import copy
    out = pathlib.Path(a.out)
    raw = (out / "record.json").read_bytes()
    assert sha(raw) == V0_1_SHA, f"record.json is not the published 0.1 ({sha(raw)})"
    old = json.loads(raw)
    ev = json.loads((out / EVIDENCE_REL).read_text())
    assert ev["verdict"] == "CONFIRMED", ev["verdict"]
    a1 = [x for x in old["anomalies"] if x["id"] == "A1"][0]
    # the text being superseded must be the text that was published
    assert old["protocol_version"]["note"] == V0_1_TEXT["protocol_version.note"]
    assert a1["what_we_do_not_say"] == V0_1_TEXT["anomalies[A1].what_we_do_not_say"]
    pv = old["protocol_version"]
    ans = pv["answered"]
    probe_rows = {}
    if a.probe:
        with gzip.open(pathlib.Path(a.probe) / "results.jsonl.gz", "rt") as fh:
            for line in fh:
                r_ = json.loads(line)
                probe_rows[r_["endpoint"]] = r_
    two28 = sorted({r_["host"] for r_ in probe_rows.values()
                    if r_.get("state") == "RESPONDED" and r_.get("protocol_version") == "2026-07-28"})
    two28_non_getvda = [h for h in two28 if not h.endswith("getvda.ai")]
    assert probe_rows, "--probe DIR (the 0.1 probe rows) is required"
    assert sum(1 for r_ in probe_rows.values()
               if r_.get("state") == "RESPONDED" and r_.get("protocol_version") == "2026-07-28") == ans["2026-07-28"]

    new = copy.deepcopy(old)
    new["schema"] = "csoai.mcp-remote-census/0.1.1"
    new["record_version"] = "0.1.1"
    new["built_utc"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    new["supersedes"] = {
        "record_version": "0.1", "file": "record.json", "sha256": V0_1_SHA,
        "signed": {"file": "record.signed.json", "sha256": fsha(out / "record.signed.json")},
        "ots": {"file": "record.json.ots", "sha256": fsha(out / "record.json.ots")},
        "kept": "byte for byte, beside this record, in the dataset and in the repo; superseded, not deleted, not edited",
    }
    new["protocol_version"] = {
        "requested": pv["requested"],
        "requested_era": "legacy: the initialize-handshake revisions (2025-11-25 and earlier)",
        "not_requested": ["2026-07-28"],
        "answered": ans,
        "note": PV_NOTE_0_1_1,
    }
    new["anomalies"] = [dict(x, what_we_do_not_say=A1_NOT_SAY_0_1_1) if x["id"] == "A1" else x for x in old["anomalies"]]
    smoke = None
    if a.smoke:
        with gzip.open(pathlib.Path(a.smoke) / "results.jsonl.gz", "rt") as fh:
            srows = [json.loads(line) for line in fh]
        smoke = {"what_it_is": ("a SMOKE TEST of the corrected prober on 5 endpoints that RESPONDED on 2026-09-25, 1 worker, "
                                ">= 1 s per host. Not a census, not a sample, not a measurement of the population; "
                                "the rows below are the whole of it."),
                 "results_sha256": fsha(pathlib.Path(a.smoke) / "results.jsonl.gz"),
                 "window": [min(r_["started"] for r_ in srows), max(r_["finished"] for r_ in srows)],
                 "rows": [{"endpoint": r_["endpoint"], "state": r_["state"], "era": r_.get("era"),
                           "offered": r_.get("protocol_versions_offered"), "requested": r_.get("protocol_version_requested"),
                           "negotiated": r_.get("protocol_version_negotiated"),
                           "server_supported_versions": r_.get("server_supported_versions"),
                           "answered_to_0.1_initialize_2025-11-25": (probe_rows.get(r_["endpoint"]) or {}).get("protocol_version")}
                          for r_ in srows]}
    n_g = len(two28) - len(two28_non_getvda)
    new["correction"] = {
        "record_version": "0.1.1",
        "corrected_utc": new["built_utc"],
        "scope": ("interpretation of protocolVersion only; no measurement re-run; every count, state, row and published "
                  "file identical to 0.1"),
        "what_was_wrong": [
            {"where": "anomalies[A1].what_we_do_not_say",
             "published_0_1_text": V0_1_TEXT["anomalies[A1].what_we_do_not_say"],
             "defect": ("It left open whether '2026-07-28' is a real MCP protocol version. It is the current published MCP "
                        "specification revision, released 2026-07-28, 59 days before this probe. We had not checked; one "
                        "fetch settles it.")},
            {"where": "protocol_version.note (README: 'protocolVersion answered')",
             "published_0_1_text": V0_1_TEXT["protocol_version.note"],
             "defect": ("It stated the legacy negotiation rule without saying that the version we requested, 2025-11-25, is "
                        "itself a legacy revision and that we sent nothing in the current one. The distribution could be read "
                        "as describing what current servers support; it describes what they negotiated against an older request.")},
        ],
        "what_is_right": [
            ("2026-07-28 is a published MCP specification revision; the specification site labelled it '(latest)' when "
             "fetched (evidence below)."),
            ("It removes the initialize/initialized handshake and sessions: each request carries its protocol version in _meta "
             "and, on HTTP, the MCP-Protocol-Version header; servers MUST implement server/discover; an unsupported version is "
             "answered with UnsupportedProtocolVersionError (-32022) listing the supported ones. Revisions 2025-11-25 and "
             "earlier are 'legacy'."),
            ("Our 0.1 prober requested 2025-11-25 through a legacy initialize only. The protocolVersion distribution ("
             + ", ".join(f"{k}: {v:,}" for k, v in ans.items()) +
             ") is therefore servers' negotiation against an older requested version, not their maximum supported version. "
             "Under the 2025-11-25 lifecycle a server that supports the requested version MUST answer with it, so the "
             f"{ans.get('2025-11-25', 0):,} endpoints that answered 2025-11-25 include any that also support 2026-07-28; "
             "this probe could not see which."),
            (f"The {ans.get('2026-07-28', 0)} endpoints that answered '2026-07-28' ({n_g} getvda.ai hosts"
             + (f", plus {', '.join(two28_non_getvda)}" if two28_non_getvda else "") +
             ") named it inside a legacy initialize exchange, a handshake that revision retired. Under the 2025-11-25 "
             "lifecycle a server answers a version other than the one requested only when it does not support the requested "
             "one. We record what they answered and do not say which revision's behaviour they implement."),
        ],
        "brief_wording_not_found": ("The lane brief paraphrased the 0.1 record as calling 2026-07-28 'a version we did not "
                                    "ask for and have not checked is real'. Those words are not in the 0.1 record or README; "
                                    "the published texts that carried the defect are quoted verbatim above."),
        "evidence": {"file": EVIDENCE_REL, "sha256": fsha(out / EVIDENCE_REL), "verdict": ev["verdict"],
                     "sources": [{"url": r_["url"], "fetched_at": r_["fetched_at"], "sha256": r_["sha256"],
                                  "quotes": [q["quote"] for q in r_["quotes"]]} for r_ in ev["sources"]]},
        "prober_follow_up": {
            "file": "scripts/census/mcp-remote-probe.py", "schema": "csoai.census-probe/0.2", "commit": a.prober_commit,
            "what": ("offers 2026-07-28 first (server/discover with _meta and modern headers), follows -32022 to a listed "
                     "version it speaks, never falls back past a recognised modern error, otherwise falls back to a legacy "
                     "initialize requesting 2025-11-25; each row records protocol_versions_offered, "
                     "protocol_version_requested, protocol_version_negotiated and era separately."),
            "not_run_as_a_census": True,
            "smoke": smoke,
        },
    }
    new["producer"] = dict(old["producer"], correction_builder={
        "file": "scripts/census/build-mcp-remote-census-record.py (evidence, correct)",
        "sha256_at_build": fsha(pathlib.Path(__file__))})
    new["verify"] = dict(
        old["verify"],
        signature=old["verify"]["signature"].replace("record.signed.json", "record.v0.1.1.signed.json")
                                            .replace("sha256(record.json)", "sha256(record.v0.1.1.json)"),
        timestamp=("record.v0.1.1.json.ots is an OpenTimestamps proof over sha256(record.v0.1.1.json); its state at "
                   "publication is in record.v0.1.1.ots.json. A pending calendar commitment is not a Bitcoin attestation "
                   "until `ots upgrade` and `ots verify` say so."),
        supersedes="sha256(record.json) must equal supersedes.sha256; record.json, its signature and its proof are unchanged")
    (out / "record.v0.1.1.json").write_text(json.dumps(new, indent=1, ensure_ascii=False) + "\n")
    changed = sorted(k for k in set(old) | set(new) if old.get(k) != new.get(k))
    print("changed top-level keys:", changed)
    assert set(changed) <= {"schema", "record_version", "built_utc", "supersedes", "protocol_version", "anomalies",
                            "correction", "producer", "verify"}, changed
    assert new["protocol_version"]["answered"] == old["protocol_version"]["answered"]
    assert [x["measured"] for x in new["anomalies"]] == [x["measured"] for x in old["anomalies"]]
    print(f"record.v0.1.1.json sha256={fsha(out / 'record.v0.1.1.json')}")


def _corrections_md(out):
    new = json.loads((out / "record.v0.1.1.json").read_text()); c = new["correction"]
    sig = json.loads((out / "record.v0.1.1.signed.json").read_text())
    side = json.loads((out / "record.v0.1.1.ots.json").read_text())
    ev = "\n".join(f"| {s_['url']} | {s_['fetched_at']} | `{s_['sha256']}` | "
                   + " / ".join(f"\"{q}\"" for q in s_["quotes"]) + " |" for s_ in c["evidence"]["sources"])
    wrong = "\n".join(f"- `{w['where']}` said: \"{w['published_0_1_text']}\". {w['defect']}" for w in c["what_was_wrong"])
    right = "\n".join(f"- {x}" for x in c["what_is_right"])
    sm = c["prober_follow_up"]["smoke"]
    smd = ""
    if sm:
        smd = ("\n\nSmoke test of the corrected prober (5 endpoints, not a census; these rows are all of it):\n\n"
               "| endpoint | era | requested | negotiated | server lists | answered to the 0.1 initialize |\n"
               "|---|---|---|---|---|---|\n"
               + "\n".join(f"| {r_['endpoint']} | {r_['era']} | {r_['requested']} | {r_['negotiated']} | "
                           f"{', '.join(r_['server_supported_versions'] or []) or '-'} | "
                           f"{r_['answered_to_0.1_initialize_2025-11-25']} |" for r_ in sm["rows"]))
    return f"""## Corrections

### 2026-09-25: record 0.1.1 supersedes 0.1 (how to read protocolVersion)

`record.v0.1.1.json` (sha256 `{fsha(out / 'record.v0.1.1.json')}`) supersedes `record.json` (0.1, sha256
`{new['supersedes']['sha256']}`). The 0.1 record, its signature and its timestamp proof are kept here unchanged.
**Scope:** {c['scope']}. Text further down this card that repeats the 0.1 wording is superseded by this section.

**What was wrong**

{wrong}

**What is right**

{right}

**Primary sources** (fetched, hashed, quotes checked against the fetched bytes; `{c['evidence']['file']}` in the repo,
sha256 `{c['evidence']['sha256']}`):

| URL | fetched (UTC) | sha256 of bytes | quoted |
|---|---|---|---|
{ev}

**Prober.** `{c['prober_follow_up']['file']}` ({c['prober_follow_up']['schema']}, commit `{c['prober_follow_up']['commit']}`)
{c['prober_follow_up']['what']} It has not been re-run as a census.{smd}

**Verify 0.1.1.** `record.v0.1.1.signed.json`: Ed25519 by `{sig['signature']['did']}`, signed {sig['signature']['signed_at']},
payload sha256 `{sig['signature']['payload_sha256']}`; verify exactly as for 0.1 below, with the 0.1.1 file names.
`record.v0.1.1.json.ots`: {len(side['attestations'])} pending calendar attestations at publication, **{side['state']}**,
not a Bitcoin attestation.

"""


def publish_correction(a):
    from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download
    out = pathlib.Path(a.out)
    api = HfApi(token=pathlib.Path(os.path.expanduser(a.hf_token)).read_text().strip())
    old_files = ["record.json", "record.signed.json", "record.json.ots", "record.ots.json"]
    new_files = ["record.v0.1.1.json", "record.v0.1.1.signed.json", "record.v0.1.1.json.ots", "record.v0.1.1.ots.json"]
    before = api.dataset_info(HF_REPO).sha

    def remote(rev, names):
        return {n: fsha(pathlib.Path(hf_hub_download(HF_REPO, n, repo_type="dataset", revision=rev, token=api.token)))
                for n in names}
    rb = remote(before, old_files)
    local = {n: fsha(out / n) for n in old_files}
    assert rb == local, f"HF 0.1 files differ from the lane copies: {rb} vs {local}"
    md = pathlib.Path(hf_hub_download(HF_REPO, "README.md", repo_type="dataset", revision=before, token=api.token)).read_text()
    sec = _corrections_md(out)
    if "\n## Corrections\n" in md:
        head, rest = md.split("\n## Corrections\n", 1)
        nxt = rest.find("\n## ")
        md2 = head + "\n" + sec.rstrip("\n") + "\n" + (rest[nxt:] if nxt >= 0 else "")
    else:
        i = md.find("\n## ")
        md2 = md[:i + 1] + sec + md[i + 1:]
    ops = [CommitOperationAdd(path_in_repo=n, path_or_fileobj=str(out / n)) for n in new_files]
    ops.append(CommitOperationAdd(path_in_repo="README.md", path_or_fileobj=md2.encode()))
    ci = api.create_commit(HF_REPO, repo_type="dataset", operations=ops,
                           commit_message=("Correction: record 0.1.1 supersedes 0.1 (2026-07-28 is a real MCP revision; "
                                           "we requested 2025-11-25)"),
                           commit_description="0.1 files kept unchanged. Scope: protocolVersion interpretation only; no measurement changed.",
                           parent_commit=before)
    after = ci.oid
    ra = remote(after, old_files)
    assert ra == rb, f"0.1 files changed on HF: {rb} -> {ra}"
    rn = remote(after, new_files)
    assert rn == {n: fsha(out / n) for n in new_files}, rn
    receipt = {"schema": "csoai.hf-publication/0.1", "repo": f"datasets/{HF_REPO}", "parent": before, "commit": after,
               "commit_url": ci.commit_url, "added": rn, "readme_sha256": sha(md2.encode()),
               "old_files_before": rb, "old_files_after": ra, "old_files_unchanged": ra == rb}
    (out / "record.v0.1.1.hf-publication.json").write_text(json.dumps(receipt, indent=1) + "\n")
    print(json.dumps({k: receipt[k] for k in ("parent", "commit", "old_files_unchanged")}))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("cmd", choices=["build", "sign", "ots", "readme", "evidence", "correct", "publish-correction"])
    ap.add_argument("--frame"); ap.add_argument("--probe"); ap.add_argument("--out", required=True); ap.add_argument("--stage"); ap.add_argument("--other-read")
    ap.add_argument("--token", default="~/.secrets/board-sign-pod-token")
    ap.add_argument("--record", default="record.json")
    ap.add_argument("--prober-commit"); ap.add_argument("--smoke"); ap.add_argument("--hf-token", default="~/.secrets/hf_token")
    a = ap.parse_args()
    {"build": build, "sign": sign, "ots": ots, "readme": readme, "evidence": evidence, "correct": correct,
     "publish-correction": publish_correction}[a.cmd](a)
