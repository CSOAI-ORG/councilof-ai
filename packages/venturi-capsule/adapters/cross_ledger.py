# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""cross_ledger: csoai.cross-ledger-supply records -> one capsule per issuer-listed deployment.

declared = the issuer's own published deployment list (page sha256, label, identifier; a supply claim only where
the issuer published one, kept NOT_COMPARED); observed = the ledger read with its evidence-ladder label exactly as
the source recorded it. A label is never upgraded: STATE_PROOF_VERIFIED is accepted only when the row carries a
proof this reader marked verified, and otherwise the build refuses; OPERATOR_API stays OPERATOR_API whatever else
the row carries. Deployments listed but not read are capsuled as LISTED_NOT_READ (not zero, not absent).
Source: --src = a dir of cross-ledger-*.json records, each with its .signed.json; every signature must verify.
"""
import collections, glob, json, pathlib
import venturi_capsule as v
from adapters import PendingSource

NAME = "cross_ledger"
KIND = "measurement.cross_ledger_supply"
LADDER = ("STATE_PROOF_VERIFIED", "STATE_PROOF_RECORDED", "OPERATOR_API", "UNCHECKABLE", "REJECTED")
COMMON_LIMITS = ["issued supply only: not AUM, NAV, reserves, backing, ownership, redeemability or compliance",
                 "no relationship with the issuer is stated or implied"]
LABEL_LIMITS = {
    "STATE_PROOF_VERIFIED": "a Merkle proof was checked here against a header's state commitment; the header itself was not checked against consensus (no light client)",
    "STATE_PROOF_RECORDED": "a proof was returned and its bytes kept, but it did not verify here; the supply figure is the operator's answer",
    "OPERATOR_API": "one operator's API answer, not a proof; two operators agreeing is still not a proof",
    "UNCHECKABLE": "the read failed; never a zero, never 'absent'",
    "REJECTED": "the on-chain identity check did not match; no supply is recorded against the asset",
}


class LabelInconsistent(ValueError):
    """A row's evidence label claims more than the row's own evidence shows. The adapter refuses; it never relabels."""


def proof_verified(p):
    if not isinstance(p, dict) or p.get("error"):
        return False
    if "verified" in p:
        return p["verified"] is True
    return p.get("account_proof_verified") is True and p.get("storage_proof_verified") is True


def evidence_label(row):
    """The source's own label, verbatim, after checking it does not claim more than the row shows."""
    k = row.get("evidence_kind")
    if k not in LADDER:
        raise LabelInconsistent(f"unknown evidence label {k!r}")
    if k == "STATE_PROOF_VERIFIED" and not proof_verified(row.get("proof")):
        raise LabelInconsistent(f"{row.get('ledger')}: labelled STATE_PROOF_VERIFIED without a verified proof")
    return k


def hexsha(x):
    return x if isinstance(x, str) and len(x) == 64 else None


def issuer_page(rec):
    ile = rec.get("issuer_list_evidence") or {}
    return {"page": ile.get("page") or ile.get("url"), "fetched_at": ile.get("fetched_at"), "state": ile.get("state"),
            "sha256": ile.get("sha256") or ile.get("md_sha256"), "html_sha256": ile.get("html_sha256")}


def supply_claim_for(rec, product):
    for ir in rec.get("issuer_reported") or []:
        if ir.get("applies_to_product") in (product, None):
            return {"kind": ir.get("kind"), "form": ir.get("form"), "report_date": ir.get("report_date"),
                    "accession": ir.get("accession"), "state": ir.get("state"),
                    "compared": "NOT_COMPARED: the issuer's statement is kept apart from measured supply and never summed with it"}
    return None


def ctx_for(rec, rec_sha, sig):
    return {"asset": rec.get("asset"), "issuer": rec.get("issuer"), "schema": rec["schema"], "record_sha256": rec_sha,
            "sig_payload_sha256": sig.get("payload_sha256"), "page": issuer_page(rec),
            "reconciliation_state": rec.get("reconciliation_state"), "as_of": rec.get("as_of") or rec.get("started_at")}


def capsule_for_row(row, rec, ctx):
    label = evidence_label(row)
    product = row.get("product") or ctx["asset"]
    listed = row.get("issuer_listed") or {}
    p = row.get("proof") or None
    sr = row.get("second_read") or {}
    declared = {"issuer": ctx["issuer"], "asset": ctx["asset"], "product": product,
                "issuer_page": ctx["page"]["page"], "issuer_label": row.get("issuer_label") or row.get("circle_label"),
                "identifier": row.get("deployment_id"), "scope": row.get("scope"),
                "supply_claim": supply_claim_for(rec, product)}
    observed = {"ledger": row.get("ledger"), "evidence_kind": label, "supply_base_units": row.get("supply_base_units"),
                "decimals": row.get("decimals"), "supply_decimal": row.get("supply_decimal"), "height": row.get("height"),
                "operator": row.get("operator"), "endpoint": row.get("endpoint"),
                "two_operators_agree": row.get("two_operators_agree"), "identity": row.get("identity")}
    differential = {"identifier_in_issuer_bytes": listed.get("in_rendered_html", listed.get("in_page_bytes")),
                    "two_operators_agree": row.get("two_operators_agree"),
                    "second_operator_supply_base_units": sr.get("supply_base_units") or sr.get("supply_decimal"),
                    "proof": ({k: p.get(k) for k in ("type", "verified", "account_proof_verified", "storage_proof_verified", "error")
                               if k in p} if p else None),
                    "supply_claim_compared": False,
                    "reconciliation_state": ctx["reconciliation_state"]}
    sources = {"record_sha256": ctx["record_sha256"], "record_signature_payload_sha256": ctx["sig_payload_sha256"],
               "issuer_page_sha256": hexsha(ctx["page"]["sha256"]), "issuer_page_html_sha256": hexsha(ctx["page"]["html_sha256"]),
               "response_sha256": hexsha(row.get("response_sha256")), "second_read_response_sha256": hexsha(sr.get("response_sha256")),
               "proof_response_sha256": hexsha((p or {}).get("response_sha256")),
               "proof_file_sha256": hexsha(((p or {}).get("file") or {}).get("sha256"))}
    return v.make_capsule(
        kind=KIND, subject_id=f"{ctx['asset']}:{product}:{row.get('ledger')}:{row.get('deployment_id')}",
        claim={"statement": f"{product} at this identifier is the issuer's deployment on {row.get('ledger')}, and the ledger's own state says how much is issued",
               "issuer": ctx["issuer"], "asset": ctx["asset"], "product": product, "ledger": row.get("ledger")},
        declared=declared, observed=observed, differential=differential, sources=sources,
        measurement_state=label, limitations=COMMON_LIMITS + [LABEL_LIMITS[label]],
        observed_at=row.get("observed_at") or ctx["as_of"])


def capsule_not_read(item, rec, ctx):
    label = item.get("circle_label") or item.get("label")
    return v.make_capsule(
        kind=KIND, subject_id=f"{ctx['asset']}:{ctx['asset']}:{label}:{item.get('identifier')}",
        claim={"statement": f"{ctx['asset']} at this identifier is the issuer's deployment on {label}", "issuer": ctx["issuer"],
               "asset": ctx["asset"], "product": ctx["asset"], "ledger": label},
        declared={"issuer": ctx["issuer"], "asset": ctx["asset"], "issuer_page": ctx["page"]["page"], "issuer_label": label,
                  "identifier": item.get("identifier"), "supply_claim": None},
        observed={"read": None, "reason": item.get("reason")},
        differential={"compared": False},
        sources={"record_sha256": ctx["record_sha256"], "record_signature_payload_sha256": ctx["sig_payload_sha256"],
                 "issuer_page_sha256": hexsha(ctx["page"]["sha256"])},
        measurement_state="LISTED_NOT_READ",
        limitations=COMMON_LIMITS + ["listed by the issuer but not read by this reader: not zero, not absent"],
        observed_at=ctx["as_of"])


def capsule_no_list(rec, ctx):
    ile = rec.get("issuer_list_evidence") or {}
    state = ile.get("state") or "ISSUER_LIST_UNAVAILABLE"
    return v.make_capsule(
        kind=KIND, subject_id=f"{ctx['asset']}:issuer-deployment-list",
        claim={"statement": "the issuer publishes where this asset lives, on a ledger a third party can read",
               "issuer": ctx["issuer"], "asset": ctx["asset"]},
        declared={"issuer": ctx["issuer"], "asset": ctx["asset"],
                  "issuer_statement": ile.get("issuer_sentence"), "pages_tried": [t.get("url") for t in ile.get("tried") or []] or [ctx["page"]["page"]]},
        observed={"issuer_list_state": state, "deployments_read": 0},
        differential={"compared": False, "reconciliation_state": ctx["reconciliation_state"]},
        sources={"record_sha256": ctx["record_sha256"], "record_signature_payload_sha256": ctx["sig_payload_sha256"],
                 "issuer_page_sha256": hexsha(ctx["page"]["sha256"]),
                 "pages_tried_sha256": [hexsha(t.get("sha256")) for t in ile.get("tried") or []]},
        measurement_state=state,
        limitations=COMMON_LIMITS + ["nothing on-chain was read for this asset: no deployment list a third party can read"],
        observed_at=ctx["as_of"])


def capsules_from_record(rec, rec_sha, sig, stats):
    ctx = ctx_for(rec, rec_sha, sig)
    out = [capsule_for_row(r, rec, ctx) for r in rec.get("rows") or []]
    out += [capsule_not_read(x, rec, ctx) for x in rec.get("listed_not_read") or []]
    read_ids = {r.get("deployment_id") for r in rec.get("rows") or []} | {x.get("identifier") for x in rec.get("listed_not_read") or []}
    for lr in rec.get("issuer_list_rows") or []:
        if lr.get("identifier") not in read_ids:
            out.append(capsule_not_read({"label": lr.get("label"), "identifier": lr.get("identifier"),
                                         "reason": "on the issuer list; no read row in the record"}, rec, ctx))
    if not out:
        out.append(capsule_no_list(rec, ctx))
    stats.setdefault("by_asset", {})[ctx["asset"]] = dict(collections.Counter(c["measurement_state"] for c in out))
    return out


def capsules(src, stats, aux=None):
    files = [pathlib.Path(p) for p in sorted(glob.glob(str(pathlib.Path(src) / "cross-ledger-*.json")))
             if not p.endswith((".signed.json", ".ots.json"))]
    if aux:  # an additional signed record dir (e.g. the daily top-20% loop), when it exists
        files += [pathlib.Path(p) for p in sorted(glob.glob(str(pathlib.Path(aux) / "**" / "*.json"), recursive=True))
                  if pathlib.Path(p.replace(".json", ".signed.json")).exists() and not p.endswith((".signed.json", ".ots.json"))]
    if not files:
        raise PendingSource(f"no cross-ledger records under {src}")
    stats["records"] = []
    for f in files:
        sig = v.verify_sidecar(f, f.with_name(f.stem + ".signed.json"))
        if sig["state"] != "VERIFIES":
            raise SystemExit(f"SOURCE_SIGNATURE {f.name}: {sig}")
        rec = json.loads(f.read_bytes())
        if not str(rec.get("schema", "")).startswith("csoai.cross-ledger-supply/"):
            stats.setdefault("skipped_files", []).append(f.name); continue
        rec_sha = v.file_sha(f)
        stats["records"].append({"file": str(f), "asset": rec.get("asset"), "schema": rec["schema"], "sha256": rec_sha,
                                 "signature": sig["state"], "signature_payload_sha256": sig["payload_sha256"],
                                 "issuer_list_state": (rec.get("issuer_list_evidence") or {}).get("state")})
        yield from capsules_from_record(rec, rec_sha, sig, stats)


def meta(src, stats):
    return {"what_this_is": "Cross-ledger supply: one capsule per issuer-listed deployment (USDC pilot, BENJI, JPMD, BUIDL and the "
                            "permissioned deposit-token services), the issuer's own list vs what each ledger's state shows, with the "
                            "evidence-ladder label exactly as read.",
            "what_this_is_not": "Not a reserve attestation, proof of backing, AUM, NAV or ownership statement. No cross-kind or cross-asset total.",
            "source": {"records": stats.get("records"), "skipped_files": stats.get("skipped_files", [])},
            "capsules_by_asset_state": stats.get("by_asset"),
            "label_rule": "measurement_state = the source's evidence label verbatim; STATE_PROOF_VERIFIED only with a proof marked verified in the row (else the build refuses); never upgraded",
            "daily_loop": "the top-20% daily loop (lane xl-loop-20260926) had no signed record at build time: PENDING_SOURCE, not included",
            "observed_at_rule": "the row's own read time (else the record's as_of)"}
