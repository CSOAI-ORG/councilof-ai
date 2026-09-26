# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""contract_parity: csoai.mcp-contract-parity rows -> one capsule per (endpoint, dimension).

Source: the latest SIGNED published record in the record dir (rows.v0.1.2 only if record.v0.1.2 exists AND its
signature verifies; else v0.1.1). Only dimensions where two or more surfaces spoke (CONSISTENT / INCONSISTENT /
UNCHECKABLE with >= 2 surfaces declared or observed) become capsules; SINGLE_SURFACE, UNCHECKABLE with fewer than
two speaking surfaces (e.g. NO_PAYMENT_SURFACE) and not-attempted rows are counted in the record, never capsuled.
declared = what the registry / cards / manifests state (surface, path, value); observed = the live answer.
"""
import collections, gzip, json, pathlib
import venturi_capsule as v
from adapters import PendingSource

NAME = "contract_parity"
KIND = "measurement.contract_parity"
INCLUDE = ("CONSISTENT", "INCONSISTENT", "UNCHECKABLE")
DECL_KEYS = ("declared", "claims", "other_versions", "public_list")
OBS_KEYS = ("observed", "live", "live_dispatcher_tools")
LIVE_KEYS = ("state", "finished", "http_status", "protocol_version", "protocol_version_requested", "server_version",
             "n_tools", "tool_names_sha256", "tools_complete", "tools_list_status", "probe_source")
STATEMENT = {
    "AUTH": "the service's public surfaces state one current authentication requirement, and the discovery boundary behaves as stated",
    "PAYMENT": "the tools the payment manifest names are the tools the live server lists",
    "PROTOCOL": "the MCP protocol version the surfaces declare is the one the live server negotiates",
    "TOOLS": "the tool set the surfaces declare is the tool set the live server lists",
    "VERSION": "the server version the registry and cards state is the version the live server reports",
}
LIMITS = ["discovery boundary only (initialize + tools/list); tools/call, credentials and payments were never sent",
          "INCONSISTENT says two public statements disagree, not which one is true",
          "live answers and surface documents were read up to ~5.5 h apart (see the source record's timing caveat)"]


def pick(src):
    """Latest record version whose own signature verifies. v0.1.2 is used only when it exists AND is signed."""
    d = pathlib.Path(src)
    for ver in ("0.1.2", "0.1.1"):
        rec, rows, sig = d / f"record.v{ver}.json", d / f"rows.v{ver}.jsonl.gz", d / f"record.v{ver}.signed.json"
        if rec.exists() and rows.exists():
            s = v.verify_sidecar(rec, sig)
            if s["state"] == "VERIFIES":
                return ver, rec, rows, s
    raise PendingSource(f"no signed contract-parity record with rows under {d}")


def speakers(d):
    """Distinct surfaces that spoke to this dimension: each declaring document, the public list, and the live answer."""
    sp = set()
    for k in ("declared", "claims"):
        for e in d.get(k) or []:
            if isinstance(e, dict) and e.get("surface"):
                sp.add(e["surface"])
    if d.get("public_list") is not None:
        sp.add("public_list")
    if any(d.get(k) is not None for k in OBS_KEYS):
        sp.add("live")
    return sorted(sp)


def eligible(d):
    """CONSISTENT / INCONSISTENT mean two or more surfaces spoke (the source's state definitions). An UNCHECKABLE
    dimension is capsuled only when at least two surfaces were declared or observed; otherwise it is counted."""
    st = d.get("state")
    if st in ("CONSISTENT", "INCONSISTENT"):
        return True
    return st == "UNCHECKABLE" and len(speakers(d)) >= 2


def row_context(rec, rec_sha, rows_sha, sig):
    ch = {}
    corr = rec.get("correction") or {}
    for r in (corr.get("rows_changed") or {}).get("rows") or []:
        ch[(r["endpoint"], r["dimension"])] = r
    return {"record_version": rec.get("record_version"), "record_schema": rec["schema"], "record_sha256": rec_sha,
            "rows_sha256": rows_sha, "sig_payload_sha256": sig.get("payload_sha256"), "as_of": rec.get("as_of"),
            "supersedes_sha256": (rec.get("supersedes") or {}).get("sha256"),
            "fix_commit": (corr.get("fix") or {}).get("commit"), "changes": ch}


def capsules_from_row(row, ctx, stats):
    stats["rows"] = stats.get("rows", 0) + 1
    if not row.get("attempted"):
        stats["not_attempted_rows"] = stats.get("not_attempted_rows", 0) + 1
        return []
    live = {k: row["live"].get(k) for k in LIVE_KEYS if k in (row.get("live") or {})}
    surfaces = {}
    for kind_, lst in sorted((row.get("surfaces") or {}).items()):
        for s in lst or []:
            if s.get("sha256"):
                surfaces[f"{kind_} {s.get('url')}"] = s["sha256"]
    out = []
    for dim, d in sorted((row.get("dimensions") or {}).items()):
        st = d.get("state")
        if not eligible(d):
            k = f"{dim}:{st}" + (f"({d.get('reason')}):fewer_than_two_surfaces" if st == "UNCHECKABLE" else "")
            stats.setdefault("skipped", collections.Counter())[k] += 1
            if (row["endpoint"], dim) in ctx["changes"]:
                stats["corrections_on_skipped_rows"] = stats.get("corrections_on_skipped_rows", 0) + 1
            continue
        stats.setdefault("by_dimension", collections.Counter())[f"{dim}:{st}"] += 1
        declared = {k: d[k] for k in DECL_KEYS if k in d}
        observed = {k: d[k] for k in OBS_KEYS if k in d}
        observed["live_read"] = live
        differential = {k: val for k, val in d.items() if k not in DECL_KEYS + OBS_KEYS + ("state",)}
        if st == "UNCHECKABLE":
            differential["surfaces_speaking"] = speakers(d)
        if row.get("straddle"):
            differential["straddle"] = row["straddle"]
        cp = None
        c = ctx["changes"].get((row["endpoint"], dim))
        if c:
            cp = {"record_schema": ctx["record_schema"], "record_version": ctx["record_version"],
                  "record_sha256": ctx["record_sha256"], "supersedes_record_sha256": ctx["supersedes_sha256"],
                  "from": c.get("from"), "to": c.get("to"), "cause": c.get("cause"), "fix_commit": ctx["fix_commit"]}
            stats["corrections_on_capsules"] = stats.get("corrections_on_capsules", 0) + 1
        out.append(v.make_capsule(
            kind=KIND, subject_id=row["endpoint"],
            claim={"dimension": dim, "statement": STATEMENT.get(dim, dim), "host": row.get("host"),
                   "registry_ids": row.get("registry_ids"), "own_estate": row.get("own_estate"),
                   "inclusion": row.get("inclusion"), "in_watch_list": row.get("in_watch_list")},
            declared=declared, observed=observed, differential=differential,
            sources={"record_sha256": ctx["record_sha256"], "rows_file_sha256": ctx["rows_sha256"],
                     "record_signature_payload_sha256": ctx["sig_payload_sha256"], "surfaces_sha256": surfaces},
            measurement_state=st,
            limitations=LIMITS + (["own-estate row: measured and reported exactly like every other row"] if row.get("own_estate") else [])
            + ([f"read straddles a registry change: {row['straddle']}"] if row.get("straddle") else []),
            observed_at=(row.get("live") or {}).get("finished") or ctx["as_of"],
            correction_pointer=cp))
    return out


def capsules(src, stats, aux=None):
    ver, rec_p, rows_p, sig = pick(src)
    rec = json.loads(rec_p.read_bytes())
    rec_sha, rows_sha = v.file_sha(rec_p), v.file_sha(rows_p)
    pinned = (rec.get("published_files") or {}).get(rows_p.name, {}).get("sha256")
    if pinned != rows_sha:
        raise SystemExit(f"ROWS_NOT_PINNED: {rows_p.name} sha {rows_sha} != record pin {pinned}")
    stats["source"] = {"record": str(rec_p), "record_version": ver, "record_schema": rec["schema"], "record_sha256": rec_sha,
                       "record_signature": sig["state"], "record_signature_payload_sha256": sig.get("payload_sha256"),
                       "rows_file": str(rows_p), "rows_sha256": rows_sha, "rows_pinned_by_record": True,
                       "hf_dataset": rec.get("hf_dataset"),
                       "v0_1_2": "used" if ver == "0.1.2" else "not present as a signed record at build time; v0.1.1 used"}
    ctx = row_context(rec, rec_sha, rows_sha, sig)
    with gzip.open(rows_p, "rt", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                yield from capsules_from_row(json.loads(line), ctx, stats)


def meta(src, stats):
    return {"what_this_is": "MCP contract parity, one capsule per (endpoint, dimension) where two or more public surfaces "
                            "(registry, mcp.json, server card, x402 manifest, live initialize/tools/list) spoke to the same dimension.",
            "what_this_is_not": "Not a grade, ranking or approval of any service. INCONSISTENT says two public statements disagree, "
                                "not which one is true; nothing beyond the discovery boundary was sent.",
            "source": stats.get("source"),
            "rows": {"n_rows": stats.get("rows", 0), "not_attempted_rows": stats.get("not_attempted_rows", 0)},
            "included_states": list(INCLUDE),
            "inclusion_rule": "CONSISTENT and INCONSISTENT always (two or more surfaces spoke, by the source's state definitions); UNCHECKABLE only when >= 2 distinct surfaces (declaring documents, the public list, the live answer) were declared or observed",
            "capsules_by_dimension_state": dict(sorted((stats.get("by_dimension") or {}).items())),
            "skipped_not_capsuled": {"rule": "SINGLE_SURFACE (one surface only), UNCHECKABLE where fewer than two surfaces were declared or observed (key carries the reason), and not-attempted rows are counted here, never capsuled",
                                     "by_dimension_state": dict(sorted((stats.get("skipped") or {}).items())),
                                     "not_attempted_rows": stats.get("not_attempted_rows", 0)},
            "corrections": {"on_capsules": stats.get("corrections_on_capsules", 0),
                            "on_skipped_rows": stats.get("corrections_on_skipped_rows", 0),
                            "pointer": "correction_pointer names the record version + sha256 in which the (endpoint, dimension) changed"},
            "observed_at_rule": "the live read's finished time for the row (else the source record's as_of)"}
