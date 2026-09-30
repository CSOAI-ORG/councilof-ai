#!/usr/bin/env python3
"""Build numbers.json for "State of the Agent Internet: September 2026" from derive.py output.

    python3 build_numbers.py derived.json numbers.json

Every number on the page is one entry here: its value, what it counts, the source record it was
recomputed from (path + sha256 + signature state) and where a public copy can be fetched.
The page reads this file; it states no number that is not in it.
"""
import datetime
import hashlib
import json
import sys

src_path, out_path = sys.argv[1], sys.argv[2]
D = json.load(open(src_path))
N, S = D["numbers"], D["sources"]

HF = "https://huggingface.co/datasets/csoai"
PUBLIC = {
    "mcp_census_v0_2_1": f"{HF}/mcp-remote-census/blob/main/record.v0.2.1.json",
    "mcp_census_v0_2_superseded": f"{HF}/mcp-remote-census/blob/main/record.v0.2.json",
    "mcp_census_v0_2_rows": f"{HF}/mcp-remote-census/blob/main/results.v0.2.public.jsonl.gz",
    "hf_spaces": f"{HF}/hf-mcp-spaces-census/blob/main/record.json",
    "hf_spaces_rows": f"{HF}/hf-mcp-spaces-census/blob/main/data/spaces.jsonl.gz",
    "a2a_v0_1_1": f"{HF}/a2a-card-census/blob/main/record.v0.1.1.json",
    "a2a_v0_1_1_rows": f"{HF}/a2a-card-census/blob/main/data/cards.v0.1.1.jsonl.gz",
    "a2a_v0_1": f"{HF}/a2a-card-census/blob/main/record.json",
    "cp_v0_1_2": f"{HF}/mcp-contract-parity/blob/main/record.v0.1.2.json",
    "cp_v0_1_2_rows": f"{HF}/mcp-contract-parity/blob/main/rows.v0.1.2.jsonl.gz",
    "cp_v0_1_1": f"{HF}/mcp-contract-parity/blob/main/record.v0.1.1.json",
    "cp_v0_1": f"{HF}/mcp-contract-parity/blob/main/record.json",
    "x402_release_2026_09_26": f"{HF}/x402-bazaar-conformance/blob/main/release-2026-09-26.json",
    "x402_snapshot_2026_09_26": f"{HF}/x402-bazaar-conformance/blob/main/snapshots/conformance-2026-09-26.jsonl",
    "x402_summary_2026_09_26": f"{HF}/x402-bazaar-conformance/blob/main/summary-2026-09-26.json",
    "erc8004": f"{HF}/erc8004-agent-census/blob/main/record.json",
    "erc8004_agents_rows": f"{HF}/erc8004-agent-census/blob/main/agents.jsonl.gz",
    "xl_daily": f"{HF}/cross-ledger-supply/blob/main/xl-daily/2026-09-26/xl-daily-2026-09-26.json",
}
WHAT = {
    "index": "Measurement-capsule index v0.2 (26 Sep 2026): one signed root over every capsule batch",
    "mcp_census_v0_2_1": "Remote MCP endpoint census, record v0.2.1 (corrected label; counts identical to v0.2)",
    "mcp_census_v0_2_superseded": "Remote MCP endpoint census, record v0.2 (superseded, kept)",
    "mcp_census_v0_2_rows": "Remote MCP endpoint census v0.2 rows, one per endpoint",
    "hf_spaces": "Hugging Face Spaces tagged mcp-server, record of 25 Sep 2026",
    "hf_spaces_rows": "Hugging Face Spaces rows, one per Space",
    "a2a_v0_1_1": "A2A signed agent-card census, record v0.1.1 (correction)",
    "a2a_v0_1_1_rows": "A2A card census v0.1.1 rows, one per registry listing",
    "a2a_v0_1": "A2A signed agent-card census, record v0.1 (superseded, kept)",
    "cp_v0_1_2": "MCP contract parity, record v0.1.2 (correction)",
    "cp_v0_1_2_rows": "MCP contract parity v0.1.2 rows, one per endpoint",
    "cp_v0_1_1": "MCP contract parity, record v0.1.1 (superseded, kept)",
    "cp_v0_1": "MCP contract parity, record v0.1 (superseded, kept)",
    "x402_release_2026_09_26": "x402 Bazaar conformance, daily release 26 Sep 2026",
    "x402_release_2026_09_25": "x402 Bazaar conformance, daily release 25 Sep 2026",
    "x402_snapshot_2026_09_26": "x402 Bazaar conformance snapshot, one row per host",
    "x402_summary_2026_09_26": "x402 Bazaar conformance summary 26 Sep 2026",
    "x402_diff_2026_09_26": "x402 day-on-day diff 25 to 26 Sep 2026",
    "erc8004": "ERC-8004 agent census, record 26 Sep 2026",
    "erc8004_agents_rows": "ERC-8004 agent rows, one per registered agent id",
    "xl_daily": "Cross-ledger daily read of tokenised assets, 26 Sep 2026",
    "mill_batch1": "Cross-runtime reproduction, batch 1 (one model, 14 cards)",
    "mill_batch2": "Cross-runtime reproduction, batch 2 (10 models x 14 axes)",
    "mill_batch2_parity_summary": "Cross-runtime batch 2, per-card item comparison",
    "mill_batch2_admission": "Cross-runtime batch 2, item-level rule dry run",
    "self_parity": "Self-parity: how external indexes list our own offerings, 26 Sep 2026",
    "public_signals": "Public signals about ourselves, 26 Sep 2026",
    "tool_drift": "Tool-list drift between two observations (capsule batch)",
}

nums = {}


def put(i, v, what, src, how):
    assert v is not None, i
    nums[i] = {"value": v, "what": what, "source": src, "recompute": how}


mc, fs = N["mcp_census"], N["mcp_census"]["frame_sources"]
st = mc["states_recount"]
put("registry.entries", fs["mcp-registry"]["rows_read"], "official MCP registry entries read (latest versions), read to its end", "mcp_census_v0_2_1", "record.population.frame_sources.mcp-registry.rows_read")
put("registry.endpoints", fs["mcp-registry"]["distinct_endpoints"], "distinct remote endpoints those registry entries list", "mcp_census_v0_2_1", "record.population.frame_sources.mcp-registry.distinct_endpoints")
put("registry.entries_prev", mc["frame_vs_prior"]["mcp-registry rows"][0], "registry entries in the 25 Sep read", "mcp_census_v0_2_1", "record.population.vs_2026-09-25_frame")
put("hf.spaces_listed", fs["hf-spaces"]["rows_read"], "Hugging Face Spaces tagged mcp-server (26 Sep frame)", "mcp_census_v0_2_1", "record.population.frame_sources.hf-spaces.rows_read")
put("a2a.listed", fs["a2aregistry"]["rows_read"], "A2A registry listings (26 Sep frame)", "mcp_census_v0_2_1", "record.population.frame_sources.a2aregistry.rows_read")
put("docker.entries", fs["docker-mcp-registry"]["rows_read"], "Docker MCP catalogue entries", "mcp_census_v0_2_1", "record.population.frame_sources.docker-mcp-registry.rows_read")
put("docker.endpoints", fs["docker-mcp-registry"]["distinct_endpoints"], "distinct remote endpoints the Docker catalogue lists", "mcp_census_v0_2_1", "record.population.frame_sources.docker-mcp-registry.distinct_endpoints")
put("smithery.distinct", 264, "distinct Smithery entries the anonymous API served (PARTIAL)", "mcp_census_v0_2_1", "record.population.frame_sources.smithery.reason ('500 rows served, 264 distinct')")
put("smithery.declared", mc["smithery_declared_total"], "Smithery's own declared total", "mcp_census_v0_2_1", "record.population.frame_sources.smithery.reason ('declared totalCount=17268')")
put("census.population", mc["population"], "remote endpoints listed by the MCP registry or the Docker catalogue", "mcp_census_v0_2_1", "rows in results.v0.2.public.jsonl.gz")
put("census.observed", mc["observed"], "endpoints with an observed state", "mcp_census_v0_2_rows", "rows whose state is not NOT_ATTEMPTED")
put("census.not_attempted", st["NOT_ATTEMPTED"], "endpoints not contacted, each with a reason", "mcp_census_v0_2_rows", "rows with state NOT_ATTEMPTED")
for k in ("RESPONDED", "AUTH_REQUIRED", "NOT_MCP", "UNREACHABLE", "TIMEOUT", "SSE_ENDPOINT_ONLY", "MCP_ERROR"):
    put(f"census.{k}", st[k], f"endpoints in state {k}", "mcp_census_v0_2_rows", f"rows with state {k}")
na = mc["not_attempted_by_reason"]
put("census.na_robots", sum(v for k, v in na.items() if k.startswith("robots.txt")), "not contacted because robots.txt disallowed it or could not be read", "mcp_census_v0_2_1", "record.not_attempted_by_reason (robots.txt rows)")
put("census.na_templated", na["templated URL: path needs a caller-supplied value"], "not contacted because the listed URL is a template", "mcp_census_v0_2_1", "record.not_attempted_by_reason")
rbo = mc["rows_by_observation"]
put("census.rows_new", rbo["census-v0.2-2026-09-26"], "endpoints contacted on 26 Sep", "mcp_census_v0_2_1", "record.rows_by_observation")
put("census.rows_reused", rbo["census-firstparty-2026-09-25"] + rbo["census-probe-2026-09-25"], "endpoints whose observed state is carried from the 25 Sep runs (under 48 h old)", "mcp_census_v0_2_1", "record.rows_by_observation")
put("census.modern_protocol", mc["protocol_version"]["era_prober_0.2"]["modern"], "26 Sep responders that answered the 2026-07-28 protocol request", "mcp_census_v0_2_1", "record.protocol_version.era_prober_0.2.modern")
put("census.responded_new", mc["protocol_version"]["era_prober_0.2"]["modern"] + mc["protocol_version"]["era_prober_0.2"]["legacy"], "26 Sep responders", "mcp_census_v0_2_1", "record.protocol_version.era_prober_0.2 (modern + legacy)")
put("own.endpoints", sum(mc["own_estate"].values()), "registry endpoints under our own names", "mcp_census_v0_2_rows", "rows with own_estate true")
put("own.unreachable", mc["own_estate"]["UNREACHABLE"], "of those, unreachable", "mcp_census_v0_2_rows", "own_estate rows with state UNREACHABLE")

hs = N["hf_spaces"]["states"]
not_contacted = sum(hs.get(k, 0) for k in ("RUNTIME_ERROR", "SLEEPING", "PAUSED", "BUILD_ERROR", "CONFIG_ERROR", "RUNNING_NOT_GRADIO", "STAGE_UNREADABLE", "BUILDING"))
put("hfsp.total", sum(hs.values()), "Spaces covered (25 Sep)", "hf_spaces_rows", "rows in data/spaces.jsonl.gz")
put("hfsp.not_contacted", not_contacted, "Spaces not contacted because the Hub reported them not running", "hf_spaces_rows", "rows whose state is a Hub runtime stage")
for k, lab in (("RUNTIME_ERROR", "runtime error"), ("SLEEPING", "sleeping"), ("PAUSED", "paused"), ("BUILD_ERROR", "build error")):
    put(f"hfsp.{k}", hs[k], f"Spaces reported as {lab}", "hf_spaces_rows", f"rows with state {k}")
put("hfsp.contacted", sum(hs.values()) - not_contacted, "Spaces contacted (Hub stage RUNNING)", "hf_spaces_rows", "total minus not contacted")
put("hfsp.RESPONDED", hs["RESPONDED"], "Spaces that answered MCP initialize", "hf_spaces_rows", "rows with state RESPONDED")
put("hfsp.SSE", hs["SSE_ENDPOINT_ONLY"], "Spaces that offered only legacy SSE", "hf_spaces_rows", "rows with state SSE_ENDPOINT_ONLY")

a1, a0 = N["a2a_v0_1_1"], N["a2a_v0_1"]
put("a2a.census_listings", a1["listings"], "A2A registry listings read by the card census (25 Sep)", "a2a_v0_1_1_rows", "rows in cards.v0.1.1.jsonl.gz")
put("a2a.served", a1["states"]["CARD_SERVED"], "listings that served an agent card", "a2a_v0_1_1_rows", "rows with state CARD_SERVED")
signed = sum(v for k, v in a1["sig_states"].items() if k != "NO_SIGNATURES")
put("a2a.signed", signed, "served cards that carry a signature", "a2a_v0_1_1_rows", "rows with sig_state other than NO_SIGNATURES")
for k in ("VERIFIED", "FAILED", "UNCHECKABLE"):
    put(f"a2a.{k}", a1["sig_states"][k], f"signed cards {k} under the rules of the spec version they declare (v0.1.1)", "a2a_v0_1_1_rows", f"rows with sig_state {k}")
    put(f"a2a.v01_{k}", a0["sig_states"][k], f"signed cards {k} in the superseded v0.1 record", "a2a_v0_1", f"v0.1 rows with sig_state {k}")
r = a1["rule_states"]
put("a2a.1x_cards", sum(v for k, v in r.items() if k.startswith("a2a-1.x")), "signed cards judged under A2A 1.x rules (spec 8.4.3)", "a2a_v0_1_1_rows", "rows by canonicalisation_rule")
for k in ("VERIFIED", "FAILED", "UNCHECKABLE"):
    put(f"a2a.1x_{k}", r[f"a2a-1.x-8.4.3:{k}"], f"1.x cards {k}", "a2a_v0_1_1_rows", "canonicalisation_rule x sig_state")
put("a2a.0x_cards", sum(v for k, v in r.items() if k.startswith("a2a-0.x")), "signed cards judged under 0.x rules (no canonicalisation step defined)", "a2a_v0_1_1_rows", "rows by canonicalisation_rule")
put("a2a.0x_VERIFIED", r["a2a-0.x-served-bytes:VERIFIED"], "0.x cards that verify", "a2a_v0_1_1_rows", "canonicalisation_rule x sig_state")
put("a2a.failed_verify_served", a1["failed_that_verify_over_served_bytes"], "FAILED cards that verify only over the card as served, defaults included", "a2a_v0_1_1", "record.signatures.failed_that_verify_under_a_non_spec_serialisation")
put("a2a.no_key", a1["uncheckable_points_to_no_key"], "UNCHECKABLE cards that point to no key at all", "a2a_v0_1_1", "record.signatures.uncheckable_reasons")
put("a2a.0x_differ_under_1x", a1["declared_0x_where_1x_rules_differ"], "0.x cards that would get another verdict under 1.x rules", "a2a_v0_1_1", "record.signatures.declared_0x_where_1x_rules_give_another_verdict")

cp = N["contract_parity"]
put("cp.rows", cp["rows"], "endpoints in the contract-parity plan, all attempted", "cp_v0_1_2_rows", "rows in rows.v0.1.2.jsonl.gz")
put("cp.any", cp["endpoints_with_any_inconsistent"], "endpoints with at least one dimension where two public statements disagree", "cp_v0_1_2_rows", "rows with any dimension INCONSISTENT")
put("cp.any_v011", cp["history_any_inconsistent"]["0.1.1"], "same count in the superseded v0.1.1 record", "cp_v0_1_1", "record.endpoints_with_any_inconsistent")
put("cp.any_v01", cp["history_any_inconsistent"]["0.1"], "same count in the superseded v0.1 record", "cp_v0_1", "record.endpoints_with_any_inconsistent")
put("cp.version_only", cp["version_only"], "endpoints inconsistent on VERSION only", "cp_v0_1_2_rows", "rows whose INCONSISTENT set is exactly {VERSION}")
put("cp.non_version", cp["non_version"], "endpoints inconsistent on tools, auth, protocol or payment", "cp_v0_1_2_rows", "rows with an INCONSISTENT dimension other than VERSION")
for d, v in cp["dimension_states"].items():
    put(f"cp.{d}.compared", v.get("CONSISTENT", 0) + v.get("INCONSISTENT", 0), f"endpoints where two or more surfaces speak to {d}", "cp_v0_1_2_rows", f"{d} CONSISTENT + INCONSISTENT")
    put(f"cp.{d}.inconsistent", v.get("INCONSISTENT", 0), f"endpoints INCONSISTENT on {d}", "cp_v0_1_2_rows", f"{d} INCONSISTENT")
put("cp.reg_vs_live", cp["registry_vs_live_version"]["differ"], "VERSION contradictions between the registry server.version and the live serverInfo.version", "cp_v0_1_2", "record.version_namespaces.registry_version_vs_live_serverinfo.differ")
top = dict(cp["version_inconsistent_by_live_top"])
put("cp.live_1_0_0", top["1.0.0"], "VERSION contradictions whose live value is 1.0.0", "cp_v0_1_2_rows", "INCONSISTENT VERSION rows by live.server_version")
put("cp.live_0_1_0", top["0.1.0"], "VERSION contradictions whose live value is 0.1.0", "cp_v0_1_2_rows", "INCONSISTENT VERSION rows by live.server_version")
v = cp["v1_27_0"]
put("cp.v127.rows", v["rows"], "endpoints whose live serverInfo.version is 1.27.0", "cp_v0_1_2_rows", "rows with live.server_version == 1.27.0")
put("cp.v127.hosts", v["hosts"], "distinct hosts among them", "cp_v0_1_2_rows", "distinct host")
put("cp.v127.inconsistent", v["inconsistent"], "of those, VERSION INCONSISTENT", "cp_v0_1_2_rows", "VERSION state")
put("cp.v127.reg_versions", v["distinct_registry_versions"], "distinct registry versions they contradict", "cp_v0_1_2_rows", "registry claims on those rows")
put("cp.v124_129.rows", cp["v1_24_to_1_29"]["rows"], "endpoints whose live version is between 1.24.x and 1.29.x", "cp_v0_1_2_rows", "live.server_version prefix 1.24.-1.29.")
put("cp.v124_129.inconsistent", cp["v1_24_to_1_29"]["inconsistent"], "of those, VERSION INCONSISTENT", "cp_v0_1_2_rows", "VERSION state")
put("cp.unread_surface", cp["read_gaps"], "endpoints with a surface that did not answer (why the run is PARTIAL)", "cp_v0_1_2", "record.run.read_gaps.endpoints_with_an_unread_surface")

x = N["x402"]
h = x["headline"]
put("x402.hosts", x["recount"]["hosts"], "distinct hosts across both public x402 Bazaar indexes", "x402_snapshot_2026_09_26", "rows in the snapshot")
put("x402.cdp", x["indexes"]["cdp"]["resources"], "resources in one index (read complete)", "x402_summary_2026_09_26", "indexes.cdp.resources")
put("x402.payai", x["indexes"]["payai"]["resources"], "resources in the other index (read complete)", "x402_summary_2026_09_26", "indexes.payai.resources")
put("x402.answered_402", x["recount"]["answered_402"], "hosts that answered HTTP 402", "x402_snapshot_2026_09_26", "rows with status 402")
put("x402.header", h["carried_payment_required_header"], "hosts that sent a PAYMENT-REQUIRED header", "x402_summary_2026_09_26", "headline.carried_payment_required_header")
put("x402.v2", h["x402_version_2"], "hosts that declared x402Version 2 in the body", "x402_summary_2026_09_26", "headline.x402_version_2")
put("x402.conformant", x["recount"]["conformant"], "hosts fully conformant (402 + header + v2 body + Bazaar block)", "x402_snapshot_2026_09_26", "rows with conformant true")
put("x402.conformant_pct", "17.58", "conformant share of hosts, per cent", "x402_summary_2026_09_26", "headline.conformant_pct")
put("x402.header_only", x["header_only"], "hosts that pass on the header but not in the body", "x402_summary_2026_09_26", "header_v2_bazaar_not_body")
put("x402.unreachable", x["recount"]["unreachable"], "hosts unreachable", "x402_snapshot_2026_09_26", "rows with no status")
df = x["diff"]
put("x402.prev_hosts", df["previous_hosts"], "hosts the day before", "x402_diff_2026_09_26", "previous_hosts")
put("x402.prev_conformant", df["conformant_previous"], "conformant the day before", "x402_diff_2026_09_26", "conformant_previous")
for k in ("hosts_added", "hosts_dropped", "newly_conformant", "lost_conformance"):
    put(f"x402.{k}", df[k], k.replace("_", " "), "x402_diff_2026_09_26", k)

e = N["erc8004"]
put("erc.agents", e["agents"], "agent ids registered on the ERC-8004 identity registry on three chains", "erc8004_agents_rows", "rows in agents.jsonl.gz")
for c in ("ethereum", "base", "bsc"):
    put(f"erc.{c}", e["per_chain"][c], f"agent ids on {c}", "erc8004_agents_rows", "rows by chain")
put("erc.plan", e["plan"], "agents in the top-20% plan whose registration files were fetched", "erc8004", "record.plan.n_plan")
es = e["states_recount"]
put("erc.NO_URI", es["NO_URI"], "agent ids with no registration URI at all", "erc8004_agents_rows", "state NO_URI")
put("erc.NOT_FETCHED", es["NOT_FETCHED"], "agent ids whose file was not fetched (outside the plan, or refused)", "erc8004_agents_rows", "state NOT_FETCHED")
put("erc.NO_ENDPOINT", es["NO_ENDPOINT"], "registration files that declare no MCP, A2A or web endpoint", "erc8004_agents_rows", "state NO_ENDPOINT")
put("erc.DECLARES_ENDPOINT", es["DECLARES_ENDPOINT"], "agent ids that declare an MCP, A2A or web endpoint", "erc8004_agents_rows", "state DECLARES_ENDPOINT")
put("erc.URI_UNREACHABLE", es["URI_UNREACHABLE"], "registration URIs that could not be read", "erc8004_agents_rows", "state URI_UNREACHABLE")
put("erc.mcp_planned", e["mcp_probe"]["n_planned"], "distinct declared MCP endpoints planned for a probe", "erc8004", "record.declared_endpoint_probes.mcp.n_planned")
put("erc.mcp_attempted", e["mcp_probe"]["n_attempted"], "declared MCP endpoints contacted", "erc8004", "record.declared_endpoint_probes.mcp.n_attempted")
put("erc.mcp_RESPONDED", e["mcp_probe_recount"]["RESPONDED"], "declared MCP endpoints that answered as MCP", "erc8004", "probe-mcp rows RESPONDED")
put("erc.mcp_NOT_MCP", e["mcp_probe_recount"]["NOT_MCP"], "declared MCP endpoints that answered but not as MCP", "erc8004", "probe-mcp rows NOT_MCP")
put("erc.mcp_UNREACHABLE", e["mcp_probe_recount"]["UNREACHABLE"], "declared MCP endpoints unreachable", "erc8004", "probe-mcp rows UNREACHABLE")
put("erc.a2a_attempted", e["a2a_probe"]["n_attempted"], "distinct declared A2A endpoints contacted", "erc8004", "record.declared_endpoint_probes.a2a.n_attempted")
put("erc.a2a_served", e["a2a_probe_recount"]["CARD_SERVED"], "declared A2A endpoints that served a card", "erc8004", "probe-a2a rows CARD_SERVED")
put("erc.a2a_not_found", e["a2a_probe_recount"]["NOT_FOUND"], "declared A2A endpoints with no card at the well-known path", "erc8004", "probe-a2a rows NOT_FOUND")
put("erc.a2a_signed", e["a2a_sig_recount"]["VERIFIED"] + e["a2a_sig_recount"]["UNCHECKABLE"], "served cards with a signature", "erc8004", "probe-a2a sig_state")
put("erc.a2a_verified", e["a2a_sig_recount"]["VERIFIED"], "of those, verified", "erc8004", "probe-a2a sig_state VERIFIED")

xl = N["xl_daily"]
put("xl.frame", xl["frame_n"], "tokenised-asset candidates with a positive value in the public value sources", "xl_daily", "selection.frame_n")
put("xl.k", xl["k"], "top fifth selected to read first", "xl_daily", "selection.k")
put("xl.assets_wired", xl["assets_wired"], "selected assets with an issuer list reader wired", "xl_daily", "len(assets)")
put("xl.unmeasured", xl["unmeasured_selected"], "selected assets not read (no issuer-list reader wired): UNMEASURED", "xl_daily", "len(unmeasured_selected)")
put("xl.deployments", xl["deployments"], "issuer-listed deployments read", "xl_daily", "len(deployments)")
for k, lab in (("STATE_PROOF_VERIFIED", "proof verified"), ("STATE_PROOF_RECORDED", "proof recorded"), ("OPERATOR_API", "operator API"), ("UNCHECKABLE", "uncheckable")):
    put(f"xl.{k}", xl["evidence_kinds"][k], f"deployments read at evidence level {k}", "xl_daily", f"deployments with evidence_kind {k}")
    put(f"xl.{k}.ledgers", len(xl["ledgers_by_kind"][k]), f"distinct ledgers at evidence level {k}", "xl_daily", "distinct ledger")
il = xl["issuer_list_states"]
put("xl.list_read", il["READ"], "assets whose issuer publishes a readable deployment list", "xl_daily", "assets.issuer_list_state READ")
put("xl.list_permissioned", il["PERMISSIONED_NOT_READABLE"], "assets on private, permissioned ledgers: nothing a third party can read", "xl_daily", "PERMISSIONED_NOT_READABLE")
put("xl.list_unavailable", il["ISSUER_LIST_UNAVAILABLE"], "assets with no public deployment list", "xl_daily", "ISSUER_LIST_UNAVAILABLE")
put("xl.list_uncheckable", il["UNCHECKABLE"], "assets whose list page could not be read", "xl_daily", "UNCHECKABLE")
ps_ = xl["parity_asset_states"]
for k in ("CONSISTENT", "INCONSISTENT", "UNCHECKABLE"):
    put(f"xl.parity.{k}", ps_[k], f"assets whose issuer claims vs ledgers are {k}", "xl_daily", "parity.asset_states")
fk = xl["findings_inconsistent_by_kind"]
put("xl.f.deprecated", fk["SUPPLY_ON_DEPRECATED_DEPLOYMENT"], "deployments an issuer lists as deprecated that still show issued supply", "xl_daily", "parity.findings_inconsistent kind")
put("xl.f.unlisted", fk["UNLISTED_CONTRACT_WITH_PRODUCT_SYMBOL_AT_A_LISTED_ADDRESS"], "contracts on a ledger the issuer does not list, at a listed address, answering with the product symbol", "xl_daily", "parity.findings_inconsistent kind")
LEDGERS = {k: xl["ledgers_by_kind"][k] for k in xl["ledgers_by_kind"]}

m1, m2 = N["mill_batch1"], N["mill_batch2"]
put("m1.cards", m1["cards"], "signed cards re-run on a second runtime (one model)", "mill_batch1", "capsules")
put("m1.itemwise", m1["states"]["REPRODUCED_ITEMWISE"], "reproduced item by item", "mill_batch1", "REPRODUCED_ITEMWISE")
put("m1.aggregate_only", m1["states"]["REPRODUCED_AGGREGATE_ONLY"], "reproduced the score only", "mill_batch1", "REPRODUCED_AGGREGATE_ONLY")
put("m1.not", m1["states"]["NOT_REPRODUCED"], "did not reproduce", "mill_batch1", "NOT_REPRODUCED")
put("m1.items", m1["items"], "items compared", "mill_batch1", "sum differential.n_items")
put("m1.grade_differ", m1["grade_differ"], "item grades that differed", "mill_batch1", "items - grade_equal_items")
put("m1.raw_differ", m1["raw_differ"], "raw outputs that differed", "mill_batch1", "raw_output_differing_item_ids")
put("m2.models", m2["models"], "models in batch 2", "mill_batch2_parity_summary", "distinct model")
put("m2.axes", m2["axes"], "axes in batch 2", "mill_batch2_parity_summary", "distinct axis")
put("m2.cards", m2["cards"], "signed cards re-run on a second runtime", "mill_batch2", "capsules")
put("m2.itemwise", m2["states"]["REPRODUCED_ITEMWISE"], "cards with the same grade on every item", "mill_batch2", "REPRODUCED_ITEMWISE")
put("m2.aggregate_only", m2["states"]["REPRODUCED_AGGREGATE_ONLY"], "cards that reproduced the score only", "mill_batch2", "REPRODUCED_AGGREGATE_ONLY")
put("m2.not", m2["states"]["NOT_REPRODUCED"], "cards that did not reproduce", "mill_batch2", "NOT_REPRODUCED")
put("m2.rule_met", m2["itemwise_with_equal_counts"], "cards meeting the item-level rule (same counts and same grade on every item)", "mill_batch2", "REPRODUCED_ITEMWISE with declared.counts == observed.counts; equals the dry run")
put("m2.rule_met_n30", m2["admission_dry_run"]["ADMITTED_n_ge_30"], "of those, cards with at least 30 graded items, released for quoting", "mill_batch2_admission", "dry-run rows meeting the rule with n >= 30")
put("m2.items", m2["items"], "items compared", "mill_batch2", "sum differential.n_items")
put("m2.grade_equal", m2["grade_equal"], "item grades equal on both runtimes", "mill_batch2", "sum differential.grade_equal_items")
put("m2.grade_equal_pct", "97.2", "item grades equal, per cent", "mill_batch2", "grade_equal / items")
put("m2.raw_equal", m2["raw_equal_summary"], "raw outputs byte-equal on both runtimes", "mill_batch2_parity_summary", "sum raw_eq")
put("m2.repeat_not_identical", m2["same_runtime_repeat_not_identical"], "model-axis pairs where a same-runtime repeat was not byte-identical", "mill_batch2_parity_summary", "repeat_raw_eq not n/n")
assert round(100 * m2["grade_equal"] / m2["items"], 1) == 97.2

sp = N["self_parity"]
put("sp.cells", sp["cells"], "cells: our offerings x the indexes that could list them", "self_parity", "capsules")
for k in ("CONSISTENT", "INCONSISTENT", "NOT_LISTED", "UNCHECKABLE", "NOT_DECLARED"):
    put(f"sp.{k}", sp["states"][k], f"cells {k}", "self_parity", f"state {k}")
put("sp.x402_url", sp["inconsistent_by_kind"]["x402_listing_url"], "our x402 listings whose listed URL query string differs from our manifest", "self_parity", "INCONSISTENT x402 cells")
put("sp.tools", sp["inconsistent_by_kind"]["tools"], "directory tool list that differs from what our MCP server serves", "self_parity", "INCONSISTENT tools cells")
put("sp.version", sp["inconsistent_by_kind"]["version"], "registry package version that lags the package index", "self_parity", "INCONSISTENT version cells")
pss = N["public_signals"]
put("ps.signals", pss["n_signals"], "public signals about ourselves recorded daily", "public_signals", "summary.n_signals")
put("ps.measured", pss["by_state"]["MEASURED"], "of those, measured", "public_signals", "summary.by_state")
put("ps.self", pss["by_self_or_external"]["SELF"], "signals that are our own activity", "public_signals", "summary.by_self_or_external")
put("ps.external", pss["by_self_or_external"]["EXTERNAL"], "signals from outside", "public_signals", "summary.by_self_or_external")
put("ps.mixed", pss["by_self_or_external"]["MIXED_UNSEPARABLE"], "signals where ours and others' cannot be separated", "public_signals", "summary.by_self_or_external")

ix = N["index"]
put("index.capsules", ix["n_capsules"], "measurement capsules under the index root", "index", "union of capsule ids over all batches")
put("index.batches", ix["n_batches"], "capsule batches in the index", "index", "batches")
assert ix["index_root_ok"] and ix["root_over_batch_ok"] and ix["unique"] == ix["n_capsules"]
assert all(b["merkle_ok"] and b["states_ok"] and b["capsules_sha_ok"] and b["signature"] == "VERIFIES" and b["record_pinned"] for b in ix["batches"])

sources = {}
for k, s in S.items():
    d = {"what": WHAT[k], "path": s["path"], "sha256": s["sha256"], "public_copy": PUBLIC.get(k)}
    if "signature" in s:
        d["board_signature"] = s["signature"]
        d["signature_pins_this_sha256"] = s["artifact_sha256_pinned"]
        d["signed_at"] = s["signed_at"]
    sources[k] = d
bad = [k for k, s in sources.items() if s.get("board_signature") not in (None, "VERIFIES") or s.get("signature_pins_this_sha256") is False]
assert not bad, bad
for i, n in nums.items():
    assert n["source"] in sources, (i, n["source"])

doc = {
    "schema": "csoai.state-report-numbers/0.1",
    "title": "State of the Agent Internet: September 2026",
    "page": "https://councilof.ai/state/2026-09/",
    "publisher": "CSOAI Ltd (Council of AI), registered in England and Wales, no. 16939677",
    "as_of": ix["as_of"],
    "built_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "doctrine": "Measurement, not endorsement. No score, ranking or approval of any company, service or operator.",
    "what_this_is": "Every number on the page, each with the record it was recomputed from (path and sha256 on the measuring host, board signature state, and a public copy where one exists).",
    "what_this_is_not": [
        "not a grade, ranking or endorsement of any service, operator, issuer or model",
        "not a population total across catalogues (one catalogue was read only in part)",
        "not a statement about which of two disagreeing public statements is true",
        "not a statement about reserves, backing, redeemability or ownership of any asset",
    ],
    "measurement_index": {
        "schema": "csoai.measurement-capsule-index/0.2",
        "sha256": S["index"]["sha256"],
        "index_root": ix["index_root"],
        "index_root_rule": "RFC 6962 Merkle Tree Hash over the sorted capsule_id leaves of all batches: leaf = SHA-256(0x00 || id), node = SHA-256(0x01 || left || right)",
        "root_over_batch_merkle_roots": ix["root_over_batch_merkle_roots"],
        "n_capsules": ix["n_capsules"], "n_batches": ix["n_batches"],
        "board_signature": S["index"]["signature"], "signed_at": S["index"]["signed_at"],
        "timestamp": "OpenTimestamps: pending calendar commitment at build time, not yet in Bitcoin",
        "batches": [{k: b[k] for k in ("adapter", "n", "merkle_root", "record_sha256", "signature")} for b in ix["batches"]],
        "published": "not yet: the index and its capsule batches are held on the measuring host; the root is given so that a later publication can be checked against it",
    },
    "ledgers_by_evidence_level": LEDGERS,
    "numbers": nums,
    "sources": sources,
    "producer": {"derive": "scripts/state-report/derive.py (run read-only on the measuring host; streams every row file)",
                 "build": "scripts/state-report/build_numbers.py",
                 "derived_output_sha256": hashlib.sha256(open(src_path, "rb").read()).hexdigest()},
    "external_context_not_ours": [
        {"source": "Visa and Artemis, Agentic Payments from the Ground Up (July 2026)",
         "url": "https://www.visa.com/en-us/thought-leadership/innovation/agentic-payments-from-the-ground-up"},
        {"source": "TRM Labs, Who's Actually Paying? Measuring AI Agent Payments Onchain (9 Sep 2026)",
         "url": "https://www.trmlabs.com/trm-tech-blog/whos-actually-paying-measuring-ai-agent-payments-onchain"},
    ],
}
with open(out_path, "w") as f:
    json.dump(doc, f, indent=1, sort_keys=True, ensure_ascii=False)
    f.write("\n")
print(len(nums), "numbers,", len(sources), "sources ->", out_path)
