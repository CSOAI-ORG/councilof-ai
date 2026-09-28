#!/usr/bin/env python3
"""Build, sign and anchor the two 2026-09-25 "universe" census records:

    csoai.hf-mcp-spaces-census/0.1   Hugging Face Spaces tagged mcp-server (hf-spaces-mcp-probe.py)
    csoai.a2a-card-census/0.1        a2aregistry listings' agent cards (a2a-card-probe.py)

    build-universes-census-records.py build-hf  --run DIR --out DIR --stage DIR
    build-universes-census-records.py build-a2a --run DIR --superseded DIR --hub-read FILE --out DIR --stage DIR
    build-universes-census-records.py sign   --kind hf|a2a --out DIR [--token FILE]
    build-universes-census-records.py ots    --out DIR
    build-universes-census-records.py readme --kind hf|a2a --out DIR --stage DIR

Same family and the same method as build-mcp-remote-census-record.py (csoai.mcp-remote-census/0.1):
build recomputes every published figure from the row files and cross-checks the run summary against
them (it refuses to write a record if any check fails - the summary is never copied blind); sign posts
a compact payload pinning record.json by sha256 to POST https://councilof.ai/api/board-sign with the pod
caller token (never printed), verifies the Ed25519 signature against did:web:csoai.org#board-attestation-1
and runs altered-preimage controls that MUST fail; ots submits sha256(record.json) to three
OpenTimestamps calendars (a fresh stamp is a PENDING CALENDAR COMMITMENT, not a Bitcoin attestation);
readme renders the Hugging Face dataset card from record.json, so no figure in it is hand-typed.

Public rows carry no tool names, no tool descriptions, no serverInfo, and no agent-card text
(names, descriptions, skills). Gzip is written with mtime 0 so the bytes are reproducible.
Doctrine: we measure; nothing here says a Space or agent is safe, good, or endorsed.
"""
import argparse, base64, collections, datetime, gzip, hashlib, io, json, os, pathlib, re, subprocess, sys
import urllib.request

KINDS = {
    "hf": {"schema": "csoai.hf-mcp-spaces-census/0.1", "record_id": "hf-mcp-spaces-census-2026-09-25",
           "record_path": "/interop/hf-mcp-spaces-census-2026-09-25/record.json", "hf_repo": "csoai/hf-mcp-spaces-census"},
    "a2a": {"schema": "csoai.a2a-card-census/0.1", "record_id": "a2a-card-census-2026-09-25",
            "record_path": "/interop/a2a-card-census-2026-09-25/record.json", "hf_repo": "csoai/a2a-card-census"},
}
SIBLING = "csoai/mcp-remote-census"
MCP_CURRENT = {"revision": "2026-07-28", "checked": "2026-09-25",
               "source": "https://modelcontextprotocol.io/specification/latest (resolved to /specification/2026-07-28 on 2026-09-25)"}
HF_PUBLIC_KEYS = ["rank", "tier", "id", "likes_frame", "sdk", "stage", "stage_source", "state", "reason", "contacted",
                  "requests_to_space", "endpoint", "transport", "http_status", "protocol_version", "tools_list_status",
                  "tools_complete", "n_tools", "tool_names_sha256"]
A2A_PUBLIC_KEYS = ["order", "id", "host", "state", "reason", "card_url", "card_source", "card_sha256",
                   "card_protocolVersion", "listed_protocolVersion", "signed", "n_signatures", "sig_state",
                   "verify_results", "key_source_kinds", "algs"]


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


def git(*a):
    return subprocess.check_output(["git", *a], text=True).strip()


def at_head(p):
    return subprocess.check_output(["git", "show", f"HEAD:{p}"])


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def probe_quantiles(xs):
    """The probe's own method (hf-spaces-mcp-probe.py quantiles): median = statistics.median;
    p25/p75 = xs[min(n-1, int(f*(n-1)+0.5))] on the sorted list."""
    import statistics
    xs = sorted(xs)
    q = lambda f: xs[min(len(xs) - 1, int(f * (len(xs) - 1) + 0.5))]
    return {"n": len(xs), "median": statistics.median(xs), "p25": q(0.25), "p75": q(0.75), "max": xs[-1],
            "min": xs[0], "zero_tools": sum(1 for x in xs if x == 0)}


OFFHOST = re.compile(r"redirect off-host to (https?://)([^/\s]+)\S*")


def site(host):
    labels = host.split(".")
    return host if len(labels) <= 2 else "*." + ".".join(labels[-2:])


def public_reason(txt):
    # an off-host redirect target is a third party's URL (it can be a capture/canary URL, and a subdomain can be the token):
    # publish the last two labels of its host only
    return OFFHOST.sub(lambda m: f"redirect off-host to {m.group(1)}{site(m.group(2))}/<path not published>", txt or "")[:240]


def refuse_if_bad(checks):
    bad = [k for k, ok in checks.items() if not ok]
    if bad:
        sys.exit(f"REFUSING: summary disagrees with its own rows: {bad}")


def producers(paths):
    return {p: {"sha256_at_head": sha(at_head(p))} for p in paths}


def write_stage(stage, files, name, blob, rows=None):
    p = stage / name; p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(blob)
    files[name] = {"sha256": sha(blob), "bytes": len(blob), **({"rows": rows} if rows is not None else {})}


def verify_block():
    return {
        "signature": "record.signed.json: canonicalise its payload (JSON, keys sorted, no whitespace, UTF-8); sha256 must equal signature.payload_sha256; payload.artifact.sha256 must equal sha256(record.json); verify signature.sig_ed25519 (hex) with the #board-attestation-1 Ed25519 key in https://csoai.org/.well-known/did.json",
        "timestamp": "record.json.ots is an OpenTimestamps proof over sha256(record.json). When published it was a PENDING calendar commitment; `ots upgrade` then `ots verify record.json.ots` against a Bitcoin node decides whether it has become a Bitcoin attestation",
        "files": "sha256 of every published file is in published_files and is pinned by the signature through record.json",
    }


# ------------------------------------------------------------------------------------------------ HF
def build_hf(a):
    K = KINDS["hf"]
    run, out, stage = map(pathlib.Path, (a.run, a.out, a.stage))
    out.mkdir(parents=True, exist_ok=True); stage.mkdir(parents=True, exist_ok=True)
    s = json.load(open(run / "summary.json")); s1 = json.load(open(run / "summary.run1.json"))
    rows = jl(run / "results.jsonl.gz"); rows1 = jl(run / "results.run1.jsonl.gz")
    na = jl(run / "not_attempted.jsonl.gz")
    pages = json.load(open(run / "raw/listing/pages.json"))
    listing = {}
    page_sha_ok = True
    for p in pages:
        raw = gzip.open(run / "raw/listing" / p["file"]).read()
        page_sha_ok &= sha(raw) == p["sha256"] and len(raw) == p["bytes"]
        for d in json.loads(raw):
            if isinstance(d, dict) and isinstance(d.get("id"), str):
                listing[d["id"]] = ((d.get("runtime") or {}).get("stage"))
    ids = [r["id"] for r in rows]
    states = collections.Counter(r["state"] for r in rows)
    by_tier = {t: dict(collections.Counter(r["state"] for r in rows if r["tier"] == t)) for t in ("top20", "beyond")}
    contacted = [r for r in rows if r.get("hf_space_requested")]
    resp = [r for r in rows if r["state"] == "RESPONDED"]
    complete = [r for r in resp if r.get("tools_list_status") == "ok" and r.get("tools_complete") and isinstance(r.get("n_tools"), int)]
    sets = collections.Counter(r["tool_names_sha256"] for r in complete)
    rq = [r.get("requests_to_space") or 0 for r in rows]
    tstats = probe_quantiles([r["n_tools"] for r in complete])
    ls_frame = collections.Counter(listing[i] for i in ids if i in listing)
    mcp_contacted = {k: v for k, v in collections.Counter(r["state"] for r in contacted).items()}
    changed_ids = {r["id"] for r, r1 in zip(rows, rows1) if r != r1}
    reread_ids = {r["id"] for r in rows if "reread" in r}
    trans = collections.Counter(f"{r['run1']['state']} -> {r['state']}" for r in rows if "reread" in r)
    lag = sorted(r["stage_read_to_request_s"] for r in contacted)
    checks = {
        "result rows == summary.n_planned": len(rows) == s["n_planned"],
        "result rows == summary.n_reached": len(rows) == s["n_reached"],
        "not_attempted rows == summary.n_not_attempted": len(na) == s["n_not_attempted"],
        "distinct Space ids == result rows": len(set(ids)) == len(rows),
        "top20 rows == summary.n_planned_top20": sum(1 for r in rows if r["tier"] == "top20") == s["n_planned_top20"],
        "state counts == summary.states": dict(states) == s["states"],
        "state counts by tier == summary.states_by_tier": by_tier == s["states_by_tier"],
        "contacted rows == summary.n_contacted": len(contacted) == s["n_contacted"],
        "contacted rows whose stage at request was not RUNNING == 0 == summary invariant":
            sum(1 for r in contacted if r.get("stage_at_request") != "RUNNING") == 0 == s["never_woke_invariant"]["spaces_contacted_whose_last_stage_read_was_not_RUNNING"],
        "rows not contacted carry no requests": all(not (r.get("requests_to_space") or 0) for r in rows if not r.get("hf_space_requested")),
        "sum(requests_to_space) == summary.requests.to_spaces_total": sum(rq) == s["requests"]["to_spaces_total"],
        "max(requests_to_space) == summary max_to_one_space and <= 4":
            max(rq) == max(s["requests"]["run1"]["max_to_one_space"], s["requests"]["reread"]["max_to_one_space"]) and max(rq) <= 4,
        "MCP states over contacted rows == summary (non-zero entries)":
            mcp_contacted == {k: v for k, v in s["mcp_states_over_contacted_spaces"].items() if v},
        "responded rows == summary.responded.n": len(resp) == s["responded"]["n"],
        "protocolVersion answered == summary": dict(collections.Counter(r.get("protocol_version") for r in resp)) == s["responded"]["protocol_version"],
        "tools_list_status == summary": dict(collections.Counter(r.get("tools_list_status") for r in resp)) == s["responded"]["tools_list_status"],
        "tool-count stats (probe's quantile method) == summary":
            all(tstats[k] == s["responded"]["tools_per_responding_space_complete_lists"][k] for k in ("n", "median", "p25", "p75", "max", "min", "zero_tools")),
        "distinct tool-name sets == summary": len(sets) == s["responded"]["distinct_tool_name_sets"],
        "largest identical tool-name set == summary": sets.most_common(1)[0][1] == s["responded"]["largest_identical_tool_name_set"],
        "hardware of contacted == summary": dict(collections.Counter(r.get("hardware_current") for r in contacted)) == s["hardware_of_contacted"],
        "listing page bytes match pages.json sha256": page_sha_ok,
        "listing page_set_sha256 recomputed == summary": sha("".join(p["sha256"] for p in pages).encode()) == s["stage_listing_walk"]["page_set_sha256"],
        "listing pages == summary": len(pages) == s["stage_listing_walk"]["pages"],
        "listing unique ids == summary.rows_read": len(listing) == s["stage_listing_walk"]["rows_read"],
        "frame ids in listing == summary": sum(1 for i in ids if i in listing) == s["stage_listing_walk"]["frame_ids_in_listing_now"],
        "listing ids not in frame == summary": len(set(listing) - set(ids)) == s["stage_listing_walk"]["listing_ids_not_in_frame"],
        "stage of frame Spaces per listing == summary": dict(ls_frame) == s["stage_listing_walk"]["stage_of_frame_spaces_per_listing"],
        "run1 -> final: only the re-read rows changed": changed_ids == reread_ids and len(rows1) == len(rows),
        "re-read rows == summary.corrections.spaces_reread": len(reread_ids) == s["corrections"][0]["spaces_reread"],
        "re-read transitions == summary.corrections.transitions": dict(trans) == s["corrections"][0]["transitions"],
        "run1 summary state counts == run1 rows": dict(collections.Counter(r["state"] for r in rows1)) == s1["states"],
    }
    refuse_if_bad(checks)

    not_contacted = collections.Counter(r["state"] for r in rows if not r.get("hf_space_requested"))
    why = {
        "SLEEPING": "a request would wake the Space and spend its owner's compute",
        "PAUSED": "paused by its owner; a request could restart it or is refused",
        "RUNTIME_ERROR": "stage is an error; a request could trigger a restart",
        "BUILD_ERROR": "stage is an error; no app is served",
        "CONFIG_ERROR": "stage is an error; no app is served",
        "BUILDING": "not yet serving; a request could interfere with start-up",
        "STAGE_UNREADABLE": "the Hub API gave no stage (HTTP 401 anonymously: private or removed since the frame); without a stage we do not contact",
        "RUNNING_NOT_GRADIO": "RUNNING, but the sdk is not gradio, so there is no documented MCP path to request",
    }
    listing_to_perid = collections.Counter(f"{r['stage_listing']} -> {r['stage']}" for r in rows
                                           if r.get("stage_listing") and r.get("stage_listing") != r.get("stage"))
    top_set_sha, top_set_n = sets.most_common(1)[0]
    top_set_ntools = next(r["n_tools"] for r in complete if r["tool_names_sha256"] == top_set_sha)
    p1 = [r for r in resp if r.get("p1_binding_fields")]
    offhost = collections.Counter(site(m.group(2)) for r in contacted for m in [OFFHOST.search(r.get("reason") or "")] if m)
    si = collections.Counter((r.get("server_info") or {}).get("name") for r in resp)
    rq_dist = dict(sorted(collections.Counter(r["requests_to_space"] for r in contacted).items()))
    proto_req = re.search(r'^PROTO_REQUESTED\s*=\s*"([^"]+)"', at_head("scripts/census/mcp-remote-probe.py").decode(), re.M).group(1)

    pub = []
    for r in sorted(rows, key=lambda r: r["rank"]):
        x = {k: r.get(k) for k in HF_PUBLIC_KEYS if k != "contacted"}
        x["contacted"] = bool(r.get("hf_space_requested"))
        x["reason"] = public_reason(r.get("reason"))
        pub.append(x)
    files = {}
    write_stage(stage, files, "data/spaces.jsonl.gz", gz_bytes(pub), len(pub))
    write_stage(stage, files, "run/summary.json", (run / "summary.json").read_bytes())
    write_stage(stage, files, "run/summary.run1.json", (run / "summary.run1.json").read_bytes())
    write_stage(stage, files, "run/listing-pages.json", (run / "raw/listing/pages.json").read_bytes())

    record = {
        "schema": K["schema"], "record_id": K["record_id"], "as_of": s["finished"], "built_utc": utcnow(),
        "publisher": "Council of AI (CSOAI), councilof.ai", "licence": {"data": "CC-BY-4.0"},
        "family": {"sibling_of": "csoai.mcp-remote-census/0.1", "sibling_dataset": f"https://huggingface.co/datasets/{SIBLING}",
                   "why_separate": "mcp-remote-probe.py refuses every *.hf.space host because a request wakes a sleeping Space; this census reads the Space's stage from the Hub API first and contacts only Spaces that are RUNNING at that moment"},
        "what_this_is": ("A dated measurement of every Hugging Face Space in the 2026-09-25 census frame tagged mcp-server "
                         f"({s['n_planned']:,} Spaces): its runtime stage from the Hub API, and - only for Spaces that were RUNNING "
                         "Gradio apps at that moment - what the Space's MCP endpoint answered to initialize and tools/list, from one place."),
        "read_state_vocabulary": {
            "EXHAUSTED": "the upstream signalled its end and every planned row reached exactly one state",
            "PARTIAL": "some rows were not read; counts are over what was read and are never a population total",
        },
        "units": {
            "Space": "one Hugging Face Space id (owner/name) in the census frame, tagged mcp-server",
            "stage": "runtime.stage from https://huggingface.co/api (never from the Space itself)",
            "contacted Space": "a Space that received at least one HTTP request from the prober (robots.txt at least)",
            "tool count": "len(tools) over tools/list pages for ONE Space, only when the listing completed",
            "tool_names_sha256": "sha256 of the sorted tool names joined by \\n, UTF-8",
            "requests_to_space": "HTTP requests sent to the Space's own host (*.hf.space); Hub API reads are not counted here",
        },
        "producer": {"repo": "councilof-ai (lane census-universes-20260925)", "commit": git("rev-parse", "HEAD"),
                     "files": producers(["scripts/census/hf-spaces-mcp-probe.py", "scripts/census/mcp-remote-probe.py", "scripts/census/read_state.py"]),
                     "this_builder": "scripts/census/build-universes-census-records.py"},
        "inputs": {n: fsha(run / n) for n in ("summary.json", "summary.run1.json", "results.jsonl.gz", "results.run1.jsonl.gz",
                                              "not_attempted.jsonl.gz", "raw/listing/pages.json")},
        "summary_cross_checks": checks,
        "read": {
            "read_state": s["read_state"], "read_state_top20": s["read_state_top20"], "read_state_rule": s["read_state_rule"],
            "window": [s["started"], s["finished"]], "user_agent": s["user_agent"],
            "frame_spaces": s["frame"]["hf_spaces_in_frame"], "n_planned": s["n_planned"], "n_reached": len(rows), "n_not_attempted": len(na),
            "top20": {"n": s["n_planned_top20"], "ranking": s["frame"]["ranking"]},
            "stage_listing_walk": {k: s["stage_listing_walk"][k] for k in ("read_state", "reason", "pages", "pages_valid", "rows_read", "url", "page_set_sha256",
                                                                         "frame_ids_in_listing_now", "frame_ids_not_in_listing_now", "listing_ids_not_in_frame",
                                                                         "stage_of_frame_spaces_per_listing")},
        },
        "states": dict(states.most_common()),
        "states_by_tier": {t: dict(collections.Counter(r["state"] for r in rows if r["tier"] == t).most_common()) for t in ("top20", "beyond")},
        "state_meanings": {
            "SLEEPING / PAUSED / RUNTIME_ERROR / BUILD_ERROR / CONFIG_ERROR / BUILDING": "the Hub API's runtime.stage, verbatim; the Space was NOT contacted",
            "STAGE_UNREADABLE": "the Hub API gave no stage; NOT contacted",
            "RUNNING_NOT_GRADIO": "RUNNING, sdk not gradio: no documented MCP path; NOT contacted",
            "ROBOTS_DISALLOWED": "RUNNING Gradio Space whose robots.txt (or a 5xx robots.txt, treated as disallow-all per RFC 9309) forbids the MCP path; only robots.txt was requested",
            "RESPONDED": "answered initialize with an MCP result at <host>/gradio_api/mcp/",
            "SSE_ENDPOINT_ONLY": "legacy SSE transport: served an endpoint event; no session was opened",
            "NOT_MCP": "answered, but not with MCP",
            "AUTH_REQUIRED": "refused without a credential; no credential was ever sent",
            "TIMEOUT": "no answer within 10 s connect / 20 s read",
        },
        "not_contacted": {
            "rule": "A Space is contacted only if its most recent Hub API stage read (at most 60 s old) said RUNNING and its sdk is gradio. Sleeping, paused and error Spaces are never requested.",
            "n": sum(not_contacted.values()),
            "by_state": {k: {"spaces": v, "why_not_contacted": why.get(k, "")} for k, v in not_contacted.most_common()},
            "listing_to_per_id_stage_changes": {"transitions": dict(listing_to_perid),
                                                 "meaning": (f"{sum(listing_to_perid.values())} Spaces the listing walk showed RUNNING were SLEEPING at the per-id read moments before contact; "
                                                             "they were not contacted. This is why SLEEPING is higher in the rows than in the listing walk.")},
        },
        "contacted": {
            "n": len(contacted), "states": dict(collections.Counter(r["state"] for r in contacted).most_common()),
            "never_woke_invariant": {"contacted_spaces_whose_last_stage_read_was_not_RUNNING": 0, "must_be": 0,
                                     "stage_read_to_first_request_s": {"median": lag[len(lag) // 2], "max": lag[-1]}},
            "hardware_current": dict(collections.Counter(r.get("hardware_current") for r in contacted).most_common()),
            "sent": s["sent_to_spaces"], "never_sent": s["never_sent"], "limits": s["limits"],
        },
        "owner_cost_note": {
            "statement": ("A request to a RUNNING Space does not start it, but it counts as activity and can postpone the Space's sleep timer, "
                          "so contact can keep a Space awake (and, on paid hardware, billing) longer than it otherwise would have been. "
                          f"Each contacted Space received at most {max(rq)} requests to its own host."),
            "requests_to_space_distribution": {str(k): v for k, v in rq_dist.items()},
            "requests_to_spaces_total": sum(rq), "hub_api_requests_total": s["requests"]["hub_api_total"],
            "note_from_the_run": s["cost_to_owners_note"],
        },
        "measured_tool_surface": {
            "over": "RESPONDED Spaces whose tools/list completed (all pages read, status ok)",
            "responded": len(resp), "tools_list_status": dict(collections.Counter(r.get("tools_list_status") for r in resp)),
            "tools_per_responding_space": tstats,
            "percentile_method": "median = statistics.median; p25/p75 = sorted[min(n-1, int(q*(n-1)+0.5))] (the probe's method)",
            "sum_of_tool_counts_is_not_a_population_figure": True,
            "distinct_tool_name_sets": len(sets), "largest_identical_tool_name_set": {"spaces": top_set_n, "n_tools": top_set_ntools, "tool_names_sha256": top_set_sha},
            "transport": dict(collections.Counter(r.get("transport") for r in resp)),
            "serverInfo_name": {"Gradio": si.get("Gradio", 0), "another server-chosen name (not published)": sum(v for k, v in si.items() if k != "Gradio")},
            "declared_binding_field_P1": {"spaces": len(p1), "meaning": "initialize capabilities or tools/list schemas carry a field NAME from the effect-binding probe's P1 list; a declared name, not a measured binding"},
        },
        "protocol_version": {
            "requested": proto_req,
            "answered": dict(collections.Counter(r.get("protocol_version") for r in resp).most_common()),
            "current_specification": MCP_CURRENT,
            "statement": (f"The current MCP specification revision is {MCP_CURRENT['revision']} (checked {MCP_CURRENT['checked']}). "
                          f"Our prober requested {proto_req}, an earlier revision. A server answers with the requested version when it "
                          "supports it, otherwise with one of its own; so this distribution is conditional on our request and says nothing "
                          f"about which Spaces support {MCP_CURRENT['revision']}."),
        },
        "anomalies": [
            {"id": "H1", "what_we_say": (f"{sum(listing_to_perid.values())} Spaces were RUNNING in the listing walk and SLEEPING in the per-id Hub API read "
                                          "made immediately before contact. The per-id read won: none was contacted.")},
            {"id": "H2", "what_we_say": (f"The largest identical tool-name set ({top_set_ntools} tool{'s' if top_set_ntools != 1 else ''}, sha256 {top_set_sha[:16]}...) is served by {top_set_n} Spaces; "
                                          f"{len(sets):,} distinct sets over {len(complete):,} complete listings. Duplicated Spaces weight per-Space counts.")},
            {"id": "H3", "what_we_say": ("serverInfo.version values (e.g. " + ", ".join(list(s["responded"]["serverInfo_version_not_gradio_version"])[:4]) +
                                         ") are not Gradio release numbers; we record them and do not interpret them.")},
            {"id": "H4", "what_we_say": (f"Frame vs today's listing: {s['stage_listing_walk']['frame_ids_not_in_listing_now']} frame Spaces were no longer listed and "
                                         f"{s['stage_listing_walk']['listing_ids_not_in_frame']} listed Spaces were not in the frame; "
                                         f"{states.get('STAGE_UNREADABLE', 0)} Spaces returned HTTP 401 to an anonymous Hub API read (private or removed) and were not contacted.")},
            {"id": "H6", "what_we_say": (f"{sum(offhost.values())} contacted Space(s) answered the MCP request with a redirect to another host "
                                         f"({', '.join(sorted(offhost))}); redirects off the Space's host are never followed, so no request went there. "
                                         "Its subdomain and path are not published (they may be a capture token).")},
            {"id": "H5", "what_we_say": ("Correction inside the run: " + s["corrections"][0]["what"] + ". Transitions: " +
                                         ", ".join(f"{k} {v}" for k, v in trans.items()) + ". Run 1 kept (its summary is published; its rows are not).")},
        ],
        "not_evidence_of": [
            "that any Space, tool or operator is safe, secure, correct, maintained, or fit for any purpose",
            "that a tool does what its name says; tools were listed, never called",
            "endorsement, ranking, grading, or approval of any Space or owner",
            "anything about a Space that was not contacted beyond its Hub API stage at that moment",
            "which MCP protocol revisions a Space supports (see protocol_version)",
            "a population total of MCP servers on Hugging Face: the frame is the Spaces tagged mcp-server on 2026-09-25, and a tag is self-declared",
            "reachability or stage at any other moment",
        ],
        "published_files": files,
        "hf_dataset": f"https://huggingface.co/datasets/{K['hf_repo']}",
        "verify": verify_block(),
    }
    (out / "record.json").write_text(json.dumps(record, indent=1, ensure_ascii=False) + "\n")
    print(f"record.json sha256={fsha(out / 'record.json')} checks={len(checks)} all_hold={all(checks.values())}")


# ------------------------------------------------------------------------------------------------ A2A
def build_a2a(a):
    K = KINDS["a2a"]
    run, sup, out, stage = map(pathlib.Path, (a.run, a.superseded, a.out, a.stage))
    out.mkdir(parents=True, exist_ok=True); stage.mkdir(parents=True, exist_ok=True)
    s = json.load(open(run / "summary.json")); s1 = json.load(open(sup / "summary.json"))
    rows = jl(run / "results.jsonl.gz"); rows1 = jl(sup / "results.jsonl.gz")
    cards = jl(run / "cards.jsonl.gz")
    hub = json.load(open(a.hub_read))
    by_id = {r["id"]: r for r in rows}
    states = collections.Counter(r["state"] for r in rows)
    served = [r for r in rows if r["state"] == "CARD_SERVED"]
    ns = len(served)
    sig = collections.Counter(r["signature_check"]["sig_state"] for r in served)
    signed = [r for r in served if r["signature_check"]["n_signatures"] > 0]
    block = [r for r in served if r["card"]["signatures_block"]]
    pct = lambda n: round(100.0 * n / ns, 2)
    ver_src = collections.Counter(x for r in served if r["signature_check"]["sig_state"] == "VERIFIED" for x in r["signature_check"].get("verified_key_sources", []))
    unc = collections.Counter(d.get("reason", "")[:80] for r in served for d in r["signature_check"].get("signatures", []) if d.get("result") == "UNCHECKABLE")
    ks_x_res = collections.Counter(f"{d.get('key_source')} / {d.get('result')}" for r in served for d in r["signature_check"].get("signatures", []))
    served_ids = {r["id"] for r in served}
    card_by_id = {c["id"]: c for c in cards}
    body_ok = set(card_by_id) == served_ids and all(sha(card_by_id[r["id"]]["body"].encode()) == r["card_sha256"] for r in served)
    healthy_not_served = sum(1 for r in rows if r.get("registry_is_healthy") and r["state"] != "CARD_SERVED")
    pv_mismatch = sum(1 for r in served if r["card"].get("protocolVersion") is not None and r.get("listed_protocolVersion") is not None
                      and str(r["card"]["protocolVersion"]) != str(r["listed_protocolVersion"]))
    hf_rows = [r for r in rows if r["host"].endswith(".hf.space") or any(str(h).endswith(".hf.space") for h in (r.get("candidate_hosts") or []))]
    reqs = lambda r: r.get("requests") if isinstance(r.get("requests"), list) else []
    hf_contacted_run2 = [(r["id"], q) for r in rows for q in reqs(r) if ".hf.space" in q]
    hf_contacted_run1 = [(r["id"], q) for r in rows1 for q in reqs(r) if ".hf.space" in q]
    checks = {
        "result rows == summary.n_planned == summary.n_attempted == frame a2aregistry entries":
            len(rows) == s["n_planned"] == s["n_attempted"] == s["frame"]["a2aregistry_entries"],
        "distinct listing ids == result rows": len(by_id) == len(rows),
        "state counts == summary.states (non-zero entries)": dict(states) == {k: v for k, v in s["states"].items() if v},
        "CARD_SERVED rows == summary.cards_served.n": ns == s["cards_served"]["n"],
        "card_source == summary": dict(collections.Counter(r["card_source"] for r in served)) == s["cards_served"]["card_source"],
        "card bodies file rows == CARD_SERVED rows (same ids)": len(cards) == ns and set(card_by_id) == served_ids,
        "every card body's sha256 == its row's card_sha256": body_ok,
        "distinct card sha256 == summary": len({r["card_sha256"] for r in served}) == s["cards_served"]["distinct_card_sha256"],
        "sig_state counts == summary": dict(sig) == s["signatures"]["sig_state"],
        "signed (n_signatures > 0) == served - NO_SIGNATURES": len(signed) == ns - sig.get("NO_SIGNATURES", 0),
        "pct_signed recomputed == summary": pct(len(signed)) == s["signatures"]["pct_signed"],
        "pct_verifying recomputed == summary": pct(sig.get("VERIFIED", 0)) == s["signatures"]["pct_verifying"],
        "cards with a signatures key == summary": len(block) == s["signatures"]["cards_with_signatures_block"],
        "verified by key source == summary": dict(ver_src) == s["signatures"]["verified_by_key_source"],
        "uncheckable reasons == summary": dict(unc) == s["signatures"]["uncheckable_reasons"],
        "FAILED that verify under a non-spec serialisation == 0 == summary":
            sum(1 for r in served for d in r["signature_check"].get("signatures", []) if d.get("result") == "FAILED" and d.get("alt_serialisations_verifying")) == 0 == s["signatures"]["failed_that_verify_under_a_non_spec_serialisation"],
        "registry healthy but no card served == summary": healthy_not_served == s["registry_is_healthy_but_no_card_served"],
        "protocolVersion differs from listing == summary": pv_mismatch == s["cards_served"]["protocolVersion_differs_from_listing"],
        "run 2 rows sent no request to any *.hf.space host": not hf_contacted_run2,
        "run 1 (superseded) state counts == its summary (non-zero)": dict(collections.Counter(r["state"] for r in rows1)) == {k: v for k, v in s1["states"].items() if v},
        "run 1 (superseded) *.hf.space requests == exactly one, a robots.txt GET": len(hf_contacted_run1) == 1 and "robots.txt" in hf_contacted_run1[0][1],
    }
    refuse_if_bad(checks)

    def pub_row(r):
        sc = r.get("signature_check") or {}
        sigs = sc.get("signatures") or []
        return {"order": r["order"], "id": r["id"], "host": r["host"], "state": r["state"], "reason": public_reason(r.get("reason")),
                "card_url": r.get("card_fetched_url") or r.get("listed_wellKnownURI"), "card_source": r.get("card_source"),
                "card_sha256": r.get("card_sha256"),
                "card_protocolVersion": (r.get("card") or {}).get("protocolVersion"), "listed_protocolVersion": r.get("listed_protocolVersion"),
                "signed": ((sc.get("n_signatures") or 0) > 0) if sc else None, "n_signatures": sc.get("n_signatures"),
                "sig_state": sc.get("sig_state"), "verify_results": [d.get("result") for d in sigs],
                "key_source_kinds": [d.get("key_source") for d in sigs], "algs": [d.get("alg") for d in sigs]}
    pub = [pub_row(r) for r in sorted(rows, key=lambda r: r["order"])]
    assert all(set(x) == set(A2A_PUBLIC_KEYS) for x in pub)
    files = {}
    write_stage(stage, files, "data/cards.jsonl.gz", gz_bytes(pub), len(pub))
    write_stage(stage, files, "run/summary.json", (run / "summary.json").read_bytes())
    write_stage(stage, files, "run/superseded-run1-summary.json", (sup / "summary.json").read_bytes())
    write_stage(stage, files, "run/superseded-run1-SUPERSEDED.txt", (sup / "SUPERSEDED.txt").read_bytes())

    b1 = next(r for r in rows1 if r["id"] == hf_contacted_run1[0][0])
    b2 = by_id[b1["id"]]
    run_diff = collections.Counter(f"{x['state']} -> {by_id[x['id']]['state']}" for x in rows1 if x["state"] != by_id[x["id"]]["state"])
    sc_types = collections.Counter(t for r in served for t in (r["card"].get("security_scheme_types") or []))
    record = {
        "schema": K["schema"], "record_id": K["record_id"], "as_of": s["finished"], "built_utc": utcnow(),
        "publisher": "Council of AI (CSOAI), councilof.ai", "licence": {"data": "CC-BY-4.0"},
        "family": {"sibling_of": "csoai.mcp-remote-census/0.1", "sibling_dataset": f"https://huggingface.co/datasets/{SIBLING}"},
        "what_this_is": (f"A dated measurement of every a2aregistry listing in the 2026-09-25 census frame ({s['n_planned']} listings): "
                         "whether its A2A agent card was served, and whether the card's signatures verify under a key the card itself points to, from one place."),
        "read_state_vocabulary": {"EXHAUSTED": "every listing of the frame reached exactly one state",
                                  "PARTIAL": "some listings were not read; counts are never a population total"},
        "units": {
            "listing": "one a2aregistry entry in the census frame (registry uuid)",
            "card": "one JSON agent card served at a candidate URL (listing wellKnownURI, then <origin>/.well-known/agent-card.json, then agent.json)",
            "signed card": "a served card whose `signatures` array has at least one entry",
            "percentages": "denominator is cards served (CARD_SERVED), not listings",
        },
        "producer": {"repo": "councilof-ai (lane census-universes-20260925)", "commit": git("rev-parse", "HEAD"),
                     "files": producers(["scripts/census/a2a-card-probe.py", "scripts/census/mcp-remote-probe.py"]),
                     "this_builder": "scripts/census/build-universes-census-records.py"},
        "inputs": {**{n: fsha(run / n) for n in ("summary.json", "results.jsonl.gz", "cards.jsonl.gz")},
                   **{f"superseded run 1 / {n}": fsha(sup / n) for n in ("summary.json", "results.jsonl.gz", "SUPERSEDED.txt")},
                   "hub api read of the one hf.space Space": fsha(a.hub_read)},
        "summary_cross_checks": checks,
        "read": {"read_state": s["read_state"], "read_state_rule": s["read_state_rule"], "window": [s["started"], s["finished"]],
                 "user_agent": s["user_agent"], "n_planned": s["n_planned"], "n_attempted": len(rows)},
        "states": dict(states.most_common()),
        "states_zero": sorted(k for k, v in s["states"].items() if not v),
        "state_meanings": {
            "CARD_SERVED": "a JSON object that parses as an agent card", "AUTH_REQUIRED": "401/403 and no candidate served a card",
            "NOT_FOUND": "every candidate answered 404/410 (or another 4xx)", "UNREACHABLE": "DNS, refused, TLS, reset, 5xx, or an off-host redirect only",
            "ROBOTS_DISALLOWED": "robots.txt forbids the card paths for CSOAI-census; only robots.txt was requested",
            "NON_PUBLIC_ADDRESS": "a candidate host resolves to a non-global address; not contacted",
            "HF_SPACE_NOT_CONTACTED": "every candidate is a *.hf.space host; not contacted",
        },
        "not_contacted": {
            "rule": "no request to a host that resolves to a non-global address (checked for every candidate host) and none to *.hf.space (a request could wake a sleeping Space); robots.txt honoured",
            "robots_disallowed_card_not_requested": states.get("ROBOTS_DISALLOWED", 0),
            "hf_space_listings": [{"id": r["id"], "state": r["state"], "requests": r.get("requests"), "reason": r.get("reason")} for r in hf_rows],
            "hf_space_note": ("The one listing whose card URL is on *.hf.space is recorded UNREACHABLE, not HF_SPACE_NOT_CONTACTED, because its other candidate "
                              "(an unqualified internal hostname from the listing's url) failed DNS. It received no request in this run; the DNS query for the internal name went to our resolver only."),
        },
        "cards_served": {
            "n": ns, "card_source": s["cards_served"]["card_source"],
            "protocolVersion_declared": s["cards_served"]["protocolVersion"],
            "protocolVersion_note": "what the card declares; no protocol negotiation took place and no A2A call was made",
            "protocolVersion_differs_from_listing": pv_mismatch,
            "no_transport_declared": s["cards_served"]["no_transport_declared"],
            "declares_security_requirement": sum(1 for r in served if r["card"].get("has_security_requirement")),
            "security_scheme_types": dict(sc_types.most_common()),
            "distinct_card_sha256": len({r["card_sha256"] for r in served}),
        },
        "signatures": {
            "denominator": "cards served", "cards_served": ns,
            "signed": len(signed), "pct_signed": pct(len(signed)),
            "verified": sig.get("VERIFIED", 0), "pct_verified": pct(sig.get("VERIFIED", 0)),
            "failed": sig.get("FAILED", 0), "uncheckable": sig.get("UNCHECKABLE", 0), "no_signatures": sig.get("NO_SIGNATURES", 0),
            "verified_by_key_source": dict(ver_src),
            "key_source_by_result": dict(ks_x_res.most_common()),
            "uncheckable_reasons": dict(unc.most_common()),
            "failed_that_verify_under_a_non_spec_serialisation": 0,
            "state_meanings": {
                "VERIFIED": "at least one signature verifies under a key the card points to, and none fails. embedded_jwk = the card vouches for its own key: integrity, not identity",
                "FAILED": "a key was found and a signature did not verify under it over JCS(card without signatures)",
                "UNCHECKABLE": "signatures present, but no key the card points to could be obtained; never counted as VERIFIED",
                "NO_SIGNATURES": "no `signatures` array, or an empty one",
            },
            "canonicalisation": s["signatures"]["canonicalisation"],
            "failed_note": s["signatures"]["failed_note"],
            "key_documents_requested": s["requests"]["key_documents"],
        },
        "requests": s["requests"], "limits": s["limits"], "sent": s["sent"], "never_sent": s["never_sent"],
        "protocol_note": {"a2a": "protocolVersion figures are declarations in served cards, not negotiated versions",
                          "mcp": (f"No MCP request is made by this census. For the sibling MCP censuses: the current MCP specification revision is "
                                  f"{MCP_CURRENT['revision']} (checked {MCP_CURRENT['checked']}), and our MCP probers request 2025-11-25.")},
        "anomalies": [
            {"id": "B1", "kind": "DISCLOSED BREACH OF OUR OWN RULE (superseded run kept)",
             "what_we_say": (f"Run 1 of this census ({s1['started']} to {s1['finished']}) applied the non-public-address check to the first candidate host only "
                             "and did not exclude *.hf.space. It sent ONE request, GET /robots.txt, to " + b1["host"] + " without first reading the Space's stage "
                             "from the Hub API - the stage check our rule requires. It also asked our resolver for the unqualified internal hostname in that listing; "
                             "DNS failed and no connection was made. Run 1 is superseded by run 2 (this record) and kept for audit; its rows are not published as data."),
             "run1_row": {"id": b1["id"], "state": b1["state"], "requests": b1.get("requests"), "candidate_hosts": b1.get("candidate_hosts")},
             "run2_row": {"id": b2["id"], "state": b2["state"], "requests": b2.get("requests")},
             "space_stage_per_hub_api": {"space": hub["id"], "stage": hub["stage"], "read_at": hub["read_at"], "http_status": hub["http_status"],
                                         "read_by": "huggingface.co/api/spaces/<id> (the Hub API, not the Space)",
                                         "also_per_lane_note": "SUPERSEDED.txt (run 1) records the Hub API reporting RUNTIME_ERROR after run 1",
                                         "meaning": ("Both Hub API reads made after the request (the lane's, after run 1; this builder's, above) report RUNTIME_ERROR. "
                                                     "The stage at the moment of the request was NOT read - that is the breach - so we cannot prove it; "
                                                     "an errored Space is not started by a request the way a sleeping one is woken.")},
             "run1_vs_run2_state_changes": dict(run_diff),
             "fix": "a2a-card-probe.py now address-checks every candidate host and never contacts *.hf.space (tests in test_a2a_card_probe.py)"},
            {"id": "B2", "what_we_say": (f"{len(block) - len(signed)} served cards carry a `signatures` key with zero entries; they count as NO_SIGNATURES. "
                                         f"So {len(block)} cards have the key and {len(signed)} are signed.")},
            {"id": "B3", "what_we_say": f"{healthy_not_served} listings the registry marks healthy served no card to us."},
            {"id": "B4", "what_we_say": (f"{ns - len({r['card_sha256'] for r in served})} served cards are byte-identical to another listing's card "
                                         f"({len({r['card_sha256'] for r in served})} distinct of {ns}).")},
            {"id": "B5", "what_we_say": (f"{pv_mismatch} cards declare a protocolVersion different from their registry listing; declared values include strings "
                                         "that are not A2A release numbers (see cards_served.protocolVersion_declared).")},
        ],
        "not_evidence_of": [
            "that any agent works, is safe, is who it says, or does what its skills say",
            "that a VERIFIED signature proves identity: it proves only that the key the card points to signed these bytes (embedded_jwk: integrity only)",
            "that a FAILED or UNCHECKABLE card is malicious; it may be a canonicalisation or key-publication mistake",
            "endorsement, ranking, grading, or approval of any agent or operator",
            "a population total of A2A agents: the frame is one registry's listings on 2026-09-25",
            "reachability at any other moment or from any other network location",
        ],
        "published_files": files,
        "hf_dataset": f"https://huggingface.co/datasets/{K['hf_repo']}",
        "verify": verify_block(),
    }
    (out / "record.json").write_text(json.dumps(record, indent=1, ensure_ascii=False) + "\n")
    print(f"record.json sha256={fsha(out / 'record.json')} checks={len(checks)} all_hold={all(checks.values())}")


# ------------------------------------------------------------------------------------------------ sign / ots
def sign(a):
    from cryptography.hazmat.primitives.asymmetric import ed25519
    K = KINDS[a.kind]
    out = pathlib.Path(a.out)
    raw = (out / "record.json").read_bytes(); rec = json.loads(raw)
    assert rec["schema"] == K["schema"]
    tok = pathlib.Path(os.path.expanduser(a.token)).read_text().strip()
    payload = {
        "schema": "csoai.signed-artifact/0.1",
        "artifact": {"path": K["record_path"], "sha256": sha(raw), "schema": rec["schema"], "as_of": rec["as_of"]},
        "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign (pod caller token)",
        "not_a_grade": "The signature proves these bytes were signed by the board key on the date below; it does not prove any claim inside beyond what the record's own instruments measured.",
        "read_state": rec["read"]["read_state"], "n_planned": rec["read"]["n_planned"],
        "states": rec["states"],
        "summary_cross_checks_hold": all(rec["summary_cross_checks"].values()),
        "published_files": {k: v["sha256"] for k, v in rec["published_files"].items()},
    }
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
    tampered = bytearray(raw); tampered[len(tampered) // 2] ^= 0x01
    controls["record.json with one bit flipped vs payload.artifact.sha256"] = (
        "equal (CONTROL FAILED)" if sha(bytes(tampered)) == payload["artifact"]["sha256"] else "differs (control holds)")
    print("controls:", controls)
    if any("FAILED" in v for v in controls.values()):
        sys.exit(3)
    doc = {"schema": "csoai.signed-run/0.1", "payload": payload,
           "signature": {"did": r["did"], "alg": "Ed25519", "sig_ed25519": r["sig_ed25519"], "payload_sha256": r["payload_sha256"],
                         "canonical": "JSON.stringify of key-sorted object, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
                         "signer_auth": r.get("signer_auth"), "signed_at": r.get("signed_at")},
           "local_verification": {"did_document": "https://csoai.org/.well-known/did.json", "result": "VERIFIES", "altered_preimage_controls": controls},
           "verify": "canonicalise payload as above, sha256 must equal signature.payload_sha256, verify sig_ed25519 (hex) with the #board-attestation-1 key in https://csoai.org/.well-known/did.json"}
    (out / "record.signed.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(f"SIGNED record.json sha256={sha(raw)} signed_at={r.get('signed_at')}")


def ots(a):
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
    cals = ["https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org",
            "https://finney.calendar.eternitywall.com"]
    out = pathlib.Path(a.out); raw = (out / "record.json").read_bytes(); d = hashlib.sha256(raw).digest()
    ts = Timestamp(d); got = []; failed = {}
    for u in cals:
        try:
            ts.merge(RemoteCalendar(u).submit(d, timeout=30)); got.append(u)
        except Exception as e:
            failed[u] = f"{type(e).__name__}: {str(e)[:80]}"
    if not got:
        sys.exit("NOT_STAMPED: no calendar accepted the digest; no .ots written")
    ctx = BytesSerializationContext(); DetachedTimestampFile(OpSHA256(), ts).serialize(ctx); proof = ctx.getbytes()
    (out / "record.json.ots").write_bytes(proof)
    back = DetachedTimestampFile.deserialize(BytesDeserializationContext((out / "record.json.ots").read_bytes()))
    atts = [type(x[1]).__name__ for x in back.timestamp.all_attestations()]
    side = {"schema": "csoai.ots-state/0.1", "file": "record.json", "sha256": sha(raw), "ots_file": "record.json.ots",
            "ots_sha256": sha(proof), "stamped_utc": utcnow(),
            "calendars_accepted": got, "calendars_failed": failed, "proof_parses": True,
            "proof_binds_to_file_digest": back.file_digest == d, "attestations": atts,
            "state": "PENDING_CALENDAR_COMMITMENT",
            "state_meaning": ("Calendars accepted this digest and promised future Bitcoin inclusion. This is NOT a Bitcoin attestation "
                              "and is not described as one. It becomes one only after `ots upgrade` returns a BitcoinBlockHeaderAttestation "
                              "and `ots verify` checks it against the chain."),
            "signing_is_separate": "record.signed.json says WHO attests to these bytes; this proof, once upgraded, says WHEN they existed."}
    assert all(a_ == "PendingAttestation" for a_ in atts), atts
    (out / "record.ots.json").write_text(json.dumps(side, indent=1) + "\n")
    print(f"OTS {len(got)} calendars, {len(atts)} pending attestations, binds={side['proof_binds_to_file_digest']}")


# ------------------------------------------------------------------------------------------------ README
VERIFY_MD = """## How to verify

**Signature.** In `record.signed.json`: serialise `payload` as JSON with keys sorted recursively, no whitespace, UTF-8.
Its sha256 must equal `signature.payload_sha256`. `payload.artifact.sha256` must equal sha256 of `record.json`, and
`payload.published_files` pins every data file by sha256. Verify `signature.sig_ed25519` (hex) over those bytes with the
Ed25519 key `#board-attestation-1` (`publicKeyJwk.x`, base64url) in https://csoai.org/.well-known/did.json.
Change one byte of the payload and it must fail.

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
s = json.load(open("record.signed.json"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("record.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
for f, h in s["payload"]["published_files"].items():
    assert hashlib.sha256(open(f, "rb").read()).hexdigest() == h, f
# the site's bot filter answers 403 to Python's default user agent, so send a browser-like one
did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"user-agent": "Mozilla/5.0"})))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
pk = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
pk.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)   # must pass
from cryptography.exceptions import InvalidSignature
try:                                                          # control: one extra byte must fail
    pk.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c + b" ")
    raise SystemExit("CONTROL VERIFIED - do not trust this check")
except InvalidSignature:
    pass
```
"""


def readme(a):
    K = KINDS[a.kind]
    out, stage = pathlib.Path(a.out), pathlib.Path(a.stage)
    rec = json.loads((out / "record.json").read_text()); sig = json.loads((out / "record.signed.json").read_text())
    side = json.loads((out / "record.ots.json").read_text())
    rsha = hashlib.sha256((out / "record.json").read_bytes()).hexdigest()
    ne = "\n".join(f"- {x}" for x in rec["not_evidence_of"])
    fl = "\n".join(f"| `{k}` | {v.get('rows', '')} | `{v['sha256']}` |" for k, v in rec["published_files"].items())
    an = "\n".join(f"- **{x['id']}**{' (' + x['kind'] + ')' if x.get('kind') else ''} - {x['what_we_say']}" for x in rec["anomalies"])
    ck = rec["summary_cross_checks"]
    ots_md = (f"**Timestamp.** `pip install opentimestamps-client`, then `ots upgrade record.json.ots` and `ots verify record.json.ots`\n"
              f"(verification needs a Bitcoin node or a block explorer). At publication the proof held {len(side['attestations'])} pending\n"
              f"calendar attestations from {', '.join(side['calendars_accepted'])}: a **pending calendar commitment, not a Bitcoin\n"
              f"attestation**. It proves nothing about time until it is upgraded and verified against the chain.")
    head = (f"Record: `record.json` sha256 `{rsha}`, signed (Ed25519, `{sig['signature']['did']}`) at {sig['signature']['signed_at']};\n"
            f"OpenTimestamps state **{side['state']}** at publication. The builder cross-checked the run summary against the row files\n"
            f"({len(ck)} checks, {'all hold' if all(ck.values()) else 'NOT ALL HOLD'}) before writing the record.")
    sib = (f"Siblings: [{SIBLING}](https://huggingface.co/datasets/{SIBLING}) (remote MCP endpoints listed in public catalogues), "
           + ("[csoai/a2a-card-census](https://huggingface.co/datasets/csoai/a2a-card-census)." if a.kind == "hf"
              else "[csoai/hf-mcp-spaces-census](https://huggingface.co/datasets/csoai/hf-mcp-spaces-census)."))
    if a.kind == "hf":
        r, st, nc, c, ts, pv, oc = rec["read"], rec["states"], rec["not_contacted"], rec["contacted"], rec["measured_tool_surface"], rec["protocol_version"], rec["owner_cost_note"]
        tt = ts["tools_per_responding_space"]
        st_md = "\n".join(f"| {k} | {v:,} | {'yes' if k in c['states'] else 'no'} |" for k, v in st.items())
        nc_md = "\n".join(f"| {k} | {v['spaces']:,} | {v['why_not_contacted']} |" for k, v in nc["by_state"].items())
        pv_md = "\n".join(f"| {k} | {v:,} |" for k, v in pv["answered"].items())
        body = f"""---
license: cc-by-4.0
pretty_name: Hugging Face MCP Spaces census (measured read, 2026-09-25)
tags:
- mcp
- model-context-protocol
- huggingface-spaces
- measurement
- census
configs:
- config_name: spaces-2026-09-25
  data_files: data/spaces.jsonl.gz
---

# Hugging Face MCP Spaces census - measured read, 2026-09-25

Every Hugging Face Space tagged `mcp-server` in our 2026-09-25 census frame ({r['n_planned']:,} Spaces): its runtime stage
from the Hub API, and - **only for Spaces that were RUNNING Gradio apps at that moment** - what its MCP endpoint answered to
`initialize` and `tools/list`, {r['window'][0]} to {r['window'][1]}, from one network location. Published by Council of AI (CSOAI).
We **measure**. We do not certify, grade, rank or endorse any Space.

**Read state: {r['read_state']}.** All {r['n_reached']:,} planned Spaces reached exactly one state ({r['n_not_attempted']} not attempted).
The stage listing walk was {r['stage_listing_walk']['read_state']} ({r['stage_listing_walk']['pages']} pages, {r['stage_listing_walk']['rows_read']:,} listed Spaces).
The frame is the Spaces that carry the self-declared `mcp-server` tag; it is not a population total of MCP servers on Hugging Face.

{head}

{sib}

## 1. States

| state | Spaces | contacted |
|---|---|---|
{st_md}

## 2. Not contacted, and why

{nc['rule']} **{nc['n']:,} Spaces received no request at all.**

| state | Spaces | why not contacted |
|---|---|---|
{nc_md}

{nc['listing_to_per_id_stage_changes']['meaning']}

## 3. Contacted Spaces ({c['n']:,})

Sent: {'; '.join(c['sent'])}. **Never sent:** {', '.join(c['never_sent'])}.
Invariant: Spaces contacted whose last stage read was not RUNNING = **{c['never_woke_invariant']['contacted_spaces_whose_last_stage_read_was_not_RUNNING']}**
(stage read to first request: median {c['never_woke_invariant']['stage_read_to_first_request_s']['median']} s, max {c['never_woke_invariant']['stage_read_to_first_request_s']['max']} s).

**Cost to Space owners.** {oc['statement']} Requests per contacted Space: {', '.join(f'{k} requests: {v:,} Spaces' for k, v in oc['requests_to_space_distribution'].items())}.
{oc['requests_to_spaces_total']:,} requests to Spaces in total, plus {oc['hub_api_requests_total']:,} Hub API reads (huggingface.co, not the Spaces).

### Tool surface (RESPONDED, tools/list complete)

Units: tools listed by one Space. A sum of tool counts is not a population figure. Method: {ts['percentile_method']}.

| n | min | p25 | median | p75 | max | zero tools |
|---|---|---|---|---|---|---|
| {tt['n']:,} | {tt['min']} | {tt['p25']} | {tt['median']} | {tt['p75']} | {tt['max']} | {tt['zero_tools']} |

{ts['distinct_tool_name_sets']:,} distinct tool-name sets; the largest identical set is served by {ts['largest_identical_tool_name_set']['spaces']} Spaces.

### protocolVersion answered (we requested `{pv['requested']}`)

| protocolVersion | Spaces |
|---|---|
{pv_md}

**Protocol note.** {pv['statement']}

## 4. Anomalies

{an}

## 5. What this is not evidence of

{ne}

## Files

| file | rows | sha256 |
|---|---|---|
| `record.json` | | `{rsha}` |
{fl}

`record.signed.json` (signature), `record.json.ots` (OpenTimestamps proof), `record.ots.json` (its stated state).
Rows in `data/spaces.jsonl.gz` carry: {', '.join(HF_PUBLIC_KEYS)}. They carry **no** tool names, tool descriptions or serverInfo;
`tool_names_sha256` is sha256 of the sorted tool names joined by `\\n`, UTF-8. `contacted` is false for every Space that received no request.

"""
    else:
        r, st, cs, sg, nc = rec["read"], rec["states"], rec["cards_served"], rec["signatures"], rec["not_contacted"]
        st_md = "\n".join(f"| {k} | {v:,} | {rec['state_meanings'].get(k, '')} |" for k, v in st.items())
        ks_md = "\n".join(f"| {k} | {v} |" for k, v in sg["key_source_by_result"].items())
        un_md = "\n".join(f"| {k} | {v} |" for k, v in sg["uncheckable_reasons"].items())
        b1 = rec["anomalies"][0]
        body = f"""---
license: cc-by-4.0
pretty_name: A2A agent card census (measured read, 2026-09-25)
tags:
- a2a
- agent2agent
- agent-card
- jws
- measurement
- census
configs:
- config_name: cards-2026-09-25
  data_files: data/cards.jsonl.gz
---

# A2A agent card census - measured read, 2026-09-25

Every a2aregistry listing in our 2026-09-25 census frame ({r['n_planned']} listings): whether its A2A agent card was served,
and whether the card's signatures verify under a key the card itself points to, {r['window'][0]} to {r['window'][1]}, from one
network location. Published by Council of AI (CSOAI). We **measure**. We do not certify, grade, rank or endorse any agent.

**Read state: {r['read_state']}.** All {r['n_attempted']} listings reached exactly one state. The frame is one registry's listings;
it is not a population total of A2A agents.

{head}

{sib}

## 1. States (per listing)

| state | listings | meaning |
|---|---|---|
{st_md}

States with zero listings: {', '.join(rec['states_zero'])}.
Not contacted: {nc['rule']}. {nc['hf_space_note']}

## 2. Signatures (denominator: {sg['cards_served']} cards served)

| | cards | % of served |
|---|---|---|
| signed (at least one signature) | {sg['signed']} | {sg['pct_signed']} |
| VERIFIED | {sg['verified']} | {sg['pct_verified']} |
| FAILED | {sg['failed']} | |
| UNCHECKABLE | {sg['uncheckable']} | |
| NO_SIGNATURES | {sg['no_signatures']} | |

Canonicalisation: {sg['canonicalisation']}. VERIFIED by key source: {', '.join(f'{k} {v}' for k, v in sg['verified_by_key_source'].items())}
(embedded_jwk = the card vouches for its own key: integrity, not identity). {sg['failed_note']}.
FAILED cards that verify under any of 4 non-spec serialisations: {sg['failed_that_verify_under_a_non_spec_serialisation']}.

| key source / result (per signature) | signatures |
|---|---|
{ks_md}

| why UNCHECKABLE | signatures |
|---|---|
{un_md}

Card protocolVersion is what the card declares ({cs['protocolVersion_differs_from_listing']} differ from their listing); no A2A call was made.
{rec['protocol_note']['mcp']}

## 3. Anomalies, including a disclosed breach of our own rule

{an}

Hub API read of that Space (the Hub API, not the Space itself): stage **{b1['space_stage_per_hub_api']['stage']}** at {b1['space_stage_per_hub_api']['read_at']}.
Run 1 is kept for audit (`run/superseded-run1-summary.json`, `run/superseded-run1-SUPERSEDED.txt`); its rows are not published as data.

## 4. What this is not evidence of

{ne}

## Files

| file | rows | sha256 |
|---|---|---|
| `record.json` | | `{rsha}` |
{fl}

`record.signed.json` (signature), `record.json.ots` (OpenTimestamps proof), `record.ots.json` (its stated state).
Rows in `data/cards.jsonl.gz` carry: {', '.join(A2A_PUBLIC_KEYS)}. They carry **no** card text (names, descriptions, skills);
`card_sha256` pins the card bytes we received. `card_url` is the URL the card was served from, or the listed wellKnownURI when none was served.

"""
    md = body + VERIFY_MD + "\n" + ots_md + f"""

## Licence

Data: CC-BY-4.0. Cite as: Council of AI (CSOAI), *{'Hugging Face MCP Spaces census' if a.kind == 'hf' else 'A2A agent card census'}, measured read 2026-09-25*, {K['hf_repo']}.
"""
    (stage / "README.md").write_text(md)
    for n in ("record.json", "record.signed.json", "record.json.ots", "record.ots.json"):
        (stage / n).write_bytes((out / n).read_bytes())
    print(f"README.md {len(md)} chars; staged record files")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("cmd", choices=["build-hf", "build-a2a", "sign", "ots", "readme"])
    ap.add_argument("--run"); ap.add_argument("--superseded"); ap.add_argument("--hub-read")
    ap.add_argument("--kind", choices=list(KINDS)); ap.add_argument("--out", required=True); ap.add_argument("--stage")
    ap.add_argument("--token", default="~/.secrets/board-sign-pod-token")
    a = ap.parse_args()
    {"build-hf": build_hf, "build-a2a": build_a2a, "sign": sign, "ots": ots, "readme": readme}[a.cmd](a)
