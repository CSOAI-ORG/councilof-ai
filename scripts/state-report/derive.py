#!/usr/bin/env python3
# Read-only re-derivation of every number in "State of the Agent Internet, September 2026"
# from the newest signed records on the measurement host. Streams every row file.
# Prints one JSON object: {numbers..., sources: {id: {path, sha256, signature}}}.
import json, gzip, hashlib, base64, collections, os, glob
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

B = "/evac-bulk"
PUB_X = "k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA"  # did:web:csoai.org#board-attestation-1
pub = Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(PUB_X + "=="))
SRC = {}


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(1 << 20), b""):
            h.update(c)
    return h.hexdigest()


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def vsig(signed, rec):
    s = json.load(open(signed))
    pay, sg = s["payload"], s["signature"]
    ok_hash = hashlib.sha256(canon(pay)).hexdigest() == sg["payload_sha256"]
    try:
        pub.verify(bytes.fromhex(sg["sig_ed25519"]), canon(pay))
        v = "VERIFIES"
    except Exception:
        v = "FAILS"
    pinned = pay.get("artifact", {}).get("sha256") == sha(rec)
    return {"signature": v, "payload_sha256_ok": ok_hash, "artifact_sha256_pinned": pinned,
            "signed_at": sg.get("signed_at")}


def src(key, path, signed=None, note=None):
    d = {"path": path.replace(B + "/", ""), "sha256": sha(path)}
    if signed:
        d.update(vsig(signed, path))
    ots = path + ".ots"
    if os.path.exists(ots):
        d["ots_file_sha256"] = sha(ots)
    if note:
        d["note"] = note
    SRC[key] = d
    return d


def rows(p):
    op = gzip.open if p.endswith(".gz") else open
    with op(p, "rt") as f:
        for l in f:
            if l.strip():
                yield json.loads(l)


def rfc6962(leaves_hex):
    lv = sorted(bytes.fromhex(x) for x in leaves_hex)

    def mth(xs):
        if not xs:
            return hashlib.sha256(b"").digest()
        if len(xs) == 1:
            return hashlib.sha256(b"\x00" + xs[0]).digest()
        k = 1
        while k * 2 < len(xs):
            k *= 2
        return hashlib.sha256(b"\x01" + mth(xs[:k]) + mth(xs[k:])).digest()
    return mth(lv).hex()


N = {}

# 1. Measurement-capsule index v0.2 (newest)
IDX = f"{B}/measurement-index-v0.2-2026-09-26.json"
src("index", IDX, IDX.replace(".json", ".signed.json"))
idx = json.load(open(IDX))
all_ids, batches = [], []
for b in idx["batches"]:
    rec = json.load(open(os.path.join(b["dir"], "record.json")))
    cf = os.path.join(b["dir"], rec["capsules_file"]["path"])
    ids, st = [], collections.Counter()
    for c in rows(cf):
        ids.append(c["capsule_id"]); st[c["measurement_state"]] += 1
    all_ids += ids
    sg = vsig(os.path.join(b["dir"], "record.signed.json"), os.path.join(b["dir"], "record.json"))
    batches.append({"adapter": b["adapter"], "n": len(ids), "states": dict(sorted(st.items())),
                    "merkle_root": rfc6962(ids), "merkle_ok": rfc6962(ids) == b["merkle_root"],
                    "states_ok": dict(st) == b["states"], "capsules_sha_ok": sha(cf) == b["capsules_sha256"],
                    "record_sha256": sha(os.path.join(b["dir"], "record.json")), "signature": sg["signature"],
                    "record_pinned": sg["artifact_sha256_pinned"]})
root = rfc6962(all_ids)
N["index"] = {"as_of": idx["as_of"], "n_capsules": len(all_ids), "unique": len(set(all_ids)),
              "n_batches": len(batches), "index_root": root, "index_root_ok": root == idx["index_root"],
              "root_over_batch_merkle_roots": idx["root_over_batch_merkle_roots"],
              "root_over_batch_ok": rfc6962([b["merkle_root"] for b in idx["batches"]]) == idx["root_over_batch_merkle_roots"],
              "batches": batches, "ots_state": "PENDING_CALENDAR_COMMITMENT (as recorded by the index for every batch)"}

# 2. MCP remote census v0.2.1 (PARTIAL)
C = f"{B}/census-v0.2-2026-09-26/pub"
src("mcp_census_v0_2_1", f"{C}/record.v0.2.1.json", f"{C}/record.v0.2.1.signed.json")
src("mcp_census_v0_2_superseded", f"{C}/record.v0.2.json", f"{C}/record.v0.2.signed.json")
src("mcp_census_v0_2_rows", f"{C}/results.v0.2.public.jsonl.gz")
cr = json.load(open(f"{C}/record.v0.2.1.json"))
st = collections.Counter(); own = collections.Counter(); obs = collections.Counter()
for r in rows(f"{C}/results.v0.2.public.jsonl.gz"):
    st[r["state"]] += 1
    if r.get("own_estate"):
        own[r["state"]] += 1
N["mcp_census"] = {"record_version": cr["record_version"], "read_state": cr["read_state"],
                   "population": cr["population"]["n"], "states_recount": dict(st),
                   "states_match_record": dict(st) == cr["states"],
                   "observed": sum(v for k, v in st.items() if k != "NOT_ATTEMPTED"),
                   "not_attempted_by_reason": cr["not_attempted_by_reason"],
                   "frame_sources": {k: {kk: v.get(kk) for kk in ("read_state", "rows_read", "distinct_endpoints")}
                                     for k, v in cr["population"]["frame_sources"].items()},
                   "smithery_declared_total": 17268,
                   "frame_vs_prior": cr["population"]["vs_2026-09-25_frame"],
                   "rows_by_observation": cr["rows_by_observation"],
                   "own_estate": dict(own), "protocol_version": cr["protocol_version"],
                   "correction": cr["correction"]["scope"]}

# 3. HF Spaces (newest signed record for Space liveness: 2026-09-25)
H = f"{B}/census-universes-publish-2026-09-25/hf"
src("hf_spaces", f"{H}/record.json", f"{H}/record.signed.json")
src("hf_spaces_rows", f"{H}/data/spaces.jsonl.gz")
N["hf_spaces"] = {"states": dict(collections.Counter(r.get("state") for r in rows(f"{H}/data/spaces.jsonl.gz")))}

# 4. A2A card census v0.1.1 (and v0.1)
A = f"{B}/cp-fix-20260926/a2a-corr/out"
A0 = f"{B}/census-universes-publish-2026-09-25/a2a"
src("a2a_v0_1_1", f"{A}/record.v0.1.1.json", f"{A}/record.v0.1.1.signed.json")
src("a2a_v0_1_1_rows", f"{A}/data/cards.v0.1.1.jsonl.gz")
src("a2a_v0_1", f"{A0}/record.json", f"{A0}/record.signed.json")
for key, p in (("a2a_v0_1_1", f"{A}/data/cards.v0.1.1.jsonl.gz"), ("a2a_v0_1", f"{A0}/data/cards.jsonl.gz")):
    s1, s2, rule = collections.Counter(), collections.Counter(), collections.Counter()
    for r in rows(p):
        s1[r.get("state")] += 1
        if r.get("sig_state"):
            s2[r["sig_state"]] += 1
        if r.get("n_signatures"):
            rule[f"{r.get('canonicalisation_rule')}:{r.get('sig_state')}"] += 1
    N[key] = {"listings": sum(s1.values()), "states": dict(s1), "sig_states": dict(s2), "rule_states": dict(rule)}
_sg = json.load(open(f"{A}/record.v0.1.1.json"))["signatures"]
N["a2a_v0_1_1"].update({"failed_that_verify_over_served_bytes": _sg["failed_that_verify_under_a_non_spec_serialisation"],
                        "uncheckable_points_to_no_key": _sg["uncheckable_reasons"].get("no jku, no embedded jwk, no did:web kid: the card points to no key"),
                        "declared_0x_where_1x_rules_differ": len(_sg["declared_0x_where_1x_rules_give_another_verdict"])})

# 5. Contract parity v0.1.2 (and chain)
P = f"{B}/cp-fix-20260926"
src("cp_v0_1_2", f"{P}/v012/rec/record.v0.1.2.json", f"{P}/v012/rec/record.v0.1.2.signed.json")
src("cp_v0_1_2_rows", f"{P}/v012/rec/rows.v0.1.2.jsonl.gz")
src("cp_v0_1_1", f"{P}/record/record.v0.1.1.json", f"{P}/record/record.v0.1.1.signed.json")
src("cp_v0_1", f"{B}/contract-parity-2026-09-25/record/record.json", f"{B}/contract-parity-2026-09-25/record/record.signed.json")
dim = collections.defaultdict(collections.Counter); n = 0; anyinc = 0; vonly = 0; nonv = 0
vlive = collections.Counter(); v127 = {"rows": 0, "hosts": set(), "inconsistent": 0, "reg_versions": set()}
sdk = {"rows": 0, "inconsistent": 0}; pair = collections.Counter()
for r in rows(f"{P}/v012/rec/rows.v0.1.2.jsonl.gz"):
    n += 1
    ds = r.get("dimensions") or {}
    incs = {d for d, v in ds.items() if v.get("state") == "INCONSISTENT"}
    for d, v in ds.items():
        dim[d][v.get("state", "?")] += 1
    if incs:
        anyinc += 1
        if incs == {"VERSION"}:
            vonly += 1
        else:
            nonv += 1
    lv = (r.get("live") or {}).get("server_version")
    V = ds.get("VERSION") or {}
    if V.get("state") == "INCONSISTENT":
        vlive[lv] += 1
    if lv == "1.27.0":
        v127["rows"] += 1; v127["hosts"].add(r["host"])
        if V.get("state") == "INCONSISTENT":
            v127["inconsistent"] += 1
            for dcl in V.get("claims") or []:
                if str(dcl.get("surface", "")).startswith("registry"):
                    v127["reg_versions"].add(str(dcl.get("value")))
    if isinstance(lv, str) and lv.startswith(("1.24.", "1.25.", "1.26.", "1.27.", "1.28.", "1.29.")):
        sdk["rows"] += 1
        if V.get("state") == "INCONSISTENT":
            sdk["inconsistent"] += 1
cp = json.load(open(f"{P}/v012/rec/record.v0.1.2.json"))
N["contract_parity"] = {"record_version": "0.1.2", "rows": n, "hosts": cp.get("hosts"),
                        "dimension_states": {d: dict(c) for d, c in sorted(dim.items())},
                        "endpoints_with_any_inconsistent": anyinc,
                        "matches_record": anyinc == cp["endpoints_with_any_inconsistent"],
                        "version_only": vonly, "non_version": nonv,
                        "per_endpoint": cp["inconsistent_dimensions_per_endpoint"],
                        "registry_vs_live_version": cp["version_namespaces"]["registry_version_vs_live_serverinfo"],
                        "version_inconsistent_by_live_top": vlive.most_common(6),
                        "v1_27_0": {"rows": v127["rows"], "hosts": len(v127["hosts"]), "inconsistent": v127["inconsistent"],
                                    "distinct_registry_versions": len(v127["reg_versions"])},
                        "v1_24_to_1_29": sdk,
                        "history_any_inconsistent": cp["correction"]["endpoints_with_any_inconsistent"],
                        "population": cp["run"]["population"] if "population" in cp["run"] else cp.get("population"),
                        "read_gaps": cp["run"].get("read_gaps", {}).get("endpoints_with_an_unread_surface")}

# 6. x402 daily (newest release 2026-09-26)
X = f"{B}/flywheel/x402"
src("x402_release_2026_09_26", f"{X}/release-2026-09-26.json", f"{X}/release-2026-09-26.signed.json")
src("x402_release_2026_09_25", f"{X}/release-2026-09-25.json", f"{X}/release-2026-09-25.signed.json")
src("x402_snapshot_2026_09_26", f"{X}/snapshots/conformance-2026-09-26.jsonl")
src("x402_summary_2026_09_26", f"{X}/summary-2026-09-26.json")
src("x402_diff_2026_09_26", f"{X}/diff-2026-09-26.json")
rel = json.load(open(f"{X}/release-2026-09-26.json"))
snap_ok = sha(f"{X}/snapshots/conformance-2026-09-26.jsonl") == rel["files"]["snapshots/conformance-2026-09-26.jsonl"]["sha256"]
c = collections.Counter()
for r in rows(f"{X}/snapshots/conformance-2026-09-26.jsonl"):
    c["hosts"] += 1; c["conformant"] += bool(r.get("conformant"))
    if r.get("status") == 402: c["answered_402"] += 1
    if r.get("status") is None: c["unreachable"] += 1
sm = json.load(open(f"{X}/summary-2026-09-26.json")); df = json.load(open(f"{X}/diff-2026-09-26.json"))
N["x402"] = {"recount": dict(c), "snapshot_pinned_by_release": snap_ok, "headline": sm["headline"],
             "header_only": sm["header_v2_bazaar_not_body"], "indexes": sm["indexes"],
             "diff": {k: df[k] for k in ("previous_hosts", "current_hosts", "hosts_added", "hosts_dropped",
                                         "conformant_previous", "conformant_now", "newly_conformant", "lost_conformance")}}

# 7. ERC-8004 agent census (public on HF csoai/erc8004-agent-census)
E = f"{B}/stage/erc8004-agent-census"
src("erc8004", f"{E}/record.json", f"{E}/record.signed.json")
src("erc8004_agents_rows", f"{E}/agents.jsonl.gz")
er = json.load(open(f"{E}/record.json"))
es = collections.Counter(); ec = collections.Counter()
for r in rows(f"{E}/agents.jsonl.gz"):
    es[r["state"]] += 1; ec[r["chain"]] += 1
a2 = collections.Counter(); sg2 = collections.Counter()
for r in rows(f"{E}/probe-a2a.jsonl.gz"):
    a2[r["state"]] += 1; sg2[r.get("sig_state")] += 1
m2 = collections.Counter(r["state"] for r in rows(f"{E}/probe-mcp.jsonl.gz"))
N["erc8004"] = {"read_state": er["read_state"], "agents": sum(es.values()), "per_chain": dict(ec),
                "states_recount": dict(es), "states_match_record": {k: v for k, v in es.items()} == {k: v for k, v in er["states"].items() if v},
                "declares_endpoint": er["declares_endpoint"], "a2a_probe_recount": dict(a2), "a2a_sig_recount": dict(sg2),
                "mcp_probe_recount": dict(m2), "mcp_probe": {k: er["declared_endpoint_probes"]["mcp"][k] for k in ("n_planned", "n_attempted", "read_state")},
                "a2a_probe": {k: er["declared_endpoint_probes"]["a2a"][k] for k in ("n_planned", "n_attempted", "read_state")},
                "fetch": {k: er["fetch"][k] for k in ("planned", "hosts", "requests")}, "plan": er["plan"]["n_plan"]}

# 8. Cross-ledger daily loop (xl-daily)
XL = f"{B}/xl-daily/2026-09-26/xl-daily-2026-09-26.json"
src("xl_daily", XL, XL.replace(".json", ".signed.json"))
xl = json.load(open(XL))
led = collections.defaultdict(collections.Counter)
for r in xl["deployments"]:
    led[r["evidence_kind"]][r["ledger"]] += 1
N["xl_daily"] = {"frame_n": xl["selection"]["frame_n"], "k": xl["selection"]["k"], "assets_wired": len(xl["assets"]),
                 "deployments": len(xl["deployments"]),
                 "evidence_kinds": {k: sum(v.values()) for k, v in led.items()},
                 "ledgers_by_kind": {k: sorted(v) for k, v in led.items()},
                 "issuer_list_states": dict(collections.Counter(a["issuer_list_state"] for a in xl["assets"].values())),
                 "parity_asset_states": dict(collections.Counter(xl["parity"]["asset_states"].values())),
                 "findings_inconsistent_by_kind": dict(collections.Counter(f["kind"] for f in xl["parity"]["findings_inconsistent"])),
                 "unmeasured_selected": len(xl["unmeasured_selected"]),
                 "listed_not_read": sum(len(a.get("listed_not_read") or []) for a in xl["assets"].values())}

# 9. Cross-runtime reproduction: batch 1 (14) and batch 2 (140)
M1 = f"{B}/measurement-capsules-v0.2-2026-09-26-mill_cross_runtime"
M2 = f"{B}/measurement-capsules-v0.2-2026-09-26-mill_cross_runtime-batch2"
src("mill_batch1", f"{M1}/record.json", f"{M1}/record.signed.json")
src("mill_batch2", f"{M2}/record.json", f"{M2}/record.signed.json")
src("mill_batch2_parity_summary", f"{B}/mill-kaggle-batch2-2026-09-26/parity-summary.json")
src("mill_batch2_admission", f"{B}/mill-kaggle-batch2-2026-09-26/admission-dryrun.txt.gz")
for key, d in (("mill_batch1", M1), ("mill_batch2", M2)):
    st = collections.Counter(); items = 0; geq = 0; rawd = 0; models = set(); counts_eq_itemwise = 0
    for cap in rows(f"{d}/capsules.jsonl.gz"):
        st[cap["measurement_state"]] += 1
        df_ = cap["differential"]; items += df_["n_items"]; geq += df_["grade_equal_items"]
        rawd += len(df_.get("raw_output_differing_item_ids") or [])
        if cap["measurement_state"] == "REPRODUCED_ITEMWISE" and cap["declared"]["counts"] == cap["observed"]["counts"]:
            counts_eq_itemwise += 1
    N[key] = {"cards": sum(st.values()), "states": dict(st), "items": items, "grade_equal": geq,
              "grade_differ": items - geq, "raw_differ": rawd,
              "itemwise_with_equal_counts": counts_eq_itemwise}
ps = json.load(open(f"{B}/mill-kaggle-batch2-2026-09-26/parity-summary.json"))
adm = collections.Counter()
for l in gzip.open(f"{B}/mill-kaggle-batch2-2026-09-26/admission-dryrun.txt.gz", "rt"):
    s = l.split()
    if s and s[0] in ("ADMITTED", "NOT_ADMITTED") and len(s) > 1 and s[1].endswith(".json"):
        adm[s[0]] += 1
        nn = [int(x[2:]) for x in s if x.startswith("n=") and x[2:].isdigit()]
        if s[0] == "ADMITTED" and nn and nn[0] >= 30:
            adm["ADMITTED_n_ge_30"] += 1
N["mill_batch2"].update({"models": len({r["model"] for r in ps}), "axes": len({r["axis"] for r in ps}),
                         "raw_equal_summary": sum(r.get("raw_eq") or 0 for r in ps),
                         "grade_equal_summary": sum(r.get("grade_eq") or 0 for r in ps),
                         "items_summary": sum(r.get("items") or 0 for r in ps),
                         "admission_dry_run": dict(adm),
                         "same_runtime_repeat_not_identical": sum(1 for r in ps if r.get("repeat_raw_eq") and r["repeat_raw_eq"].split("/")[0] != r["repeat_raw_eq"].split("/")[1])})

# 10. Self-parity (ourselves first)
S = f"{B}/self-parity/2026-09-26"
src("self_parity", f"{S}/record.json", f"{S}/record.signed.json")
SB = f"{B}/measurement-capsules-v0.2-2026-09-26-self_parity"
spc = collections.Counter(c["measurement_state"] for c in rows(f"{SB}/capsules.jsonl.gz"))
_sp = json.load(open(f"{S}/record.json"))
_inc = collections.Counter()
for c in _sp["cells"]:
    if c.get("state") == "INCONSISTENT":
        f = {x["field"] for L in c.get("listings", []) for x in L.get("fields", []) if x.get("verdict") not in ("AGREES", None)}
        _inc["x402_listing_url" if c["offering"].startswith("x402:") else ("tools" if "tools" in f else ("version" if "version" in f else ",".join(sorted(f))))] += 1
N["self_parity"] = {"cells": sum(spc.values()), "states": dict(spc), "inconsistent_by_kind": dict(_inc),
                    "inconsistent_by_index": dict(collections.Counter(c["index"] for c in _sp["cells"] if c.get("state") == "INCONSISTENT"))}

# 11. Public signals about ourselves
PS = f"{B}/public-signals/2026-09-26/record.json"
src("public_signals", PS, PS.replace(".json", ".signed.json"))
N["public_signals"] = json.load(open(PS))["summary"]

# 12. Tool drift (name-granularity, two observations)
TD = f"{B}/measurement-capsules-v0.2-2026-09-26-tool_drift"
src("tool_drift", f"{TD}/record.json", f"{TD}/record.signed.json")
N["tool_drift"] = {"states": dict(collections.Counter(c["measurement_state"] for c in rows(f"{TD}/capsules.jsonl.gz")))}

def fix(o):
    if isinstance(o, dict):
        return {str(k): fix(v) for k, v in o.items()}
    if isinstance(o, (list, tuple, set)):
        return [fix(x) for x in o]
    return o
print(json.dumps(fix({"numbers": N, "sources": SRC}), indent=1, sort_keys=True))
