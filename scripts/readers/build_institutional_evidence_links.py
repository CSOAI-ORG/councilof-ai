#!/usr/bin/env python3
"""Emit institutional-evidence-links.json: for each institution in the estate's binding layer
(ras_hive_os/institutional_bindings.py, another lane's file — READ, never edited), the measured
cross-ledger records now available (URL + sha256 + evidence kinds), or UNMEASURED with the reason.

The consumer joins on the binding layer's own keys. This file states no relationship: every
institution stays PUBLIC_EVIDENCE_TARGET_NOT_CLIENT in the consumer's own field.

    build_institutional_evidence_links.py --date 2026-09-25 --binding-sha256 HEX --out FILE
"""
import collections, datetime, hashlib, json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(REPO))
from scripts.readers.cross_ledger_funds import fetch_page  # noqa: E402

HF = "https://huggingface.co/datasets/csoai/cross-ledger-supply/resolve/main"
BINDING_KEYS = ["swift", "wells-fargo", "franklin-templeton-benji", "jpmorgan", "citi", "hsbc", "bny", "blackrock-buidl"]
KEY_TO_ASSETS = {"franklin-templeton-benji": ["benji"], "jpmorgan": ["jpmd"], "blackrock-buidl": ["buidl"],
                 "citi": ["citi-token-services"], "hsbc": ["hsbc-tokenised-deposit-service"], "bny": ["bny-digital-cash"],
                 "swift": [], "wells-fargo": []}
SWIFT_PR = ("https://www.swift.com/news-events/press-releases/swifts-blockchain-ledger-ready-use-17-banks-set-pioneer-"
            "tokenised-cross-border-payments-trusted-global-infrastructure")


def sha(b):
    return hashlib.sha256(b).hexdigest()


def main(a):
    date = a[a.index("--date") + 1]
    out = pathlib.Path(a[a.index("--out") + 1])
    bsha = a[a.index("--binding-sha256") + 1]
    inter = REPO / "public" / "interop"
    records, inst = [], {}
    for key in BINDING_KEYS:
        entry = {"records": [], "evidence_kinds": {}, "products": []}
        for asset in KEY_TO_ASSETS[key]:
            p = inter / f"cross-ledger-{asset}-{date}.json"
            raw = p.read_bytes()
            rec = json.loads(raw)
            sp = p.with_suffix(".signed.json")
            ots = p.with_name(p.name + ".ots")
            kinds = collections.Counter(r["evidence_kind"] for r in rec["per_ledger"])
            r = {"asset": rec["asset"], "path": f"/interop/{p.name}", "sha256": sha(raw),
                 "hf_url": f"{HF}/interop/{p.name}", "councilof_path": f"/interop/{p.name} (served on councilof.ai only after this lane merges and deploys)",
                 "signed": {"path": f"/interop/{sp.name}", "sha256": sha(sp.read_bytes()),
                            "signed_at": json.loads(sp.read_text())["signature"]["signed_at"]} if sp.exists() else None,
                 "ots": {"path": f"/interop/{ots.name}", "state": json.loads(p.with_suffix(".ots.json").read_text())["state"]} if ots.exists() else None,
                 "issuer_list_state": rec["issuer_list_evidence"]["state"],
                 "issuer_list_source": rec["issuer_list_evidence"].get("page") or [t["url"] for t in rec["issuer_list_evidence"].get("tried", [])],
                 "evidence_kinds": dict(kinds), "products": sorted({x["product"] for x in rec["per_ledger"]}),
                 "reconciliation_state": rec["reconciliation_state"],
                 "issuer_reported_present": bool(rec.get("issuer_reported"))}
            records.append(r)
            entry["records"].append(r["path"])
            for k, v in kinds.items():
                entry["evidence_kinds"][k] = entry["evidence_kinds"].get(k, 0) + v
            entry["products"] += r["products"]
            entry["issuer_list_state"] = r["issuer_list_state"]
            entry["reconciliation_state"] = r["reconciliation_state"]
        if entry["evidence_kinds"]:
            entry["state"] = "MEASURED_RECORDS_AVAILABLE"
            entry["what_is_measured"] = ("issued token supply per public ledger at recorded heights, each read labelled by "
                                         "evidence kind; NOT AUM, NAV, ownership, redeemability or compliance; unreconciled "
                                         "with the controlling record")
        elif entry.get("issuer_list_state") in ("ISSUER_LIST_UNAVAILABLE", "PERMISSIONED_NOT_READABLE"):
            entry["state"] = "UNMEASURED"
            entry["reason"] = entry["issuer_list_state"] + (
                ": no issuer-published deployment list was found; explorer/aggregator addresses are not read"
                if entry["issuer_list_state"] == "ISSUER_LIST_UNAVAILABLE" else
                ": the issuer's own page says the token lives on a private/permissioned ledger; nothing public to read")
        else:
            entry["state"] = "UNMEASURED"
            if key == "swift":
                ev = fetch_page(SWIFT_PR)
                ev.pop("_body")
                entry["reason"] = ("NO_ISSUED_TOKEN_WITH_PUBLIC_ADDRESS: Swift is infrastructure, not a token issuer; no "
                                   "Swift-published deployment on a permissionless ledger was found. The binding layer's "
                                   "press-release source was re-fetched and its status is recorded.")
                entry["source_fetch"] = ev
            else:
                entry["reason"] = ("NO_ISSUED_TOKEN_WITH_PUBLIC_ADDRESS: no Wells Fargo token with an issuer-published address "
                                   "on a permissionless ledger was found; the binding layer lists it as a Swift-cohort target")
        entry["relationship_statement"] = "none — this file states no relationship; the consumer's relationship_state is unchanged"
        inst[key] = entry
    doc = {"schema": "csoai.institutional-evidence-links/0.1",
           "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "what_this_is": ("A join table for the estate's institutional binding layer: per binding key, the cross-ledger "
                            "records measured today, or UNMEASURED with the reason. Produced by the cross-ledger-funds lane "
                            "so the binding layer can consume it without anyone editing that layer."),
           "binding_layer_source": {"path": "ras_hive_os/institutional_bindings.py (lane ras-hive-os-20260924; read only)",
                                    "sha256_when_read": bsha, "keys": BINDING_KEYS},
           "institutions": inst, "records": records,
           "laws": ["target is not client", "public evidence is not private connectivity",
                    "on-chain observation is not legal ownership, AUM, settlement finality or compliance",
                    "UNMEASURED is a published state, not an omission", "verification of published CSOAI evidence remains free"],
           "producer": "scripts/readers/build_institutional_evidence_links.py"}
    out.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    print({k: v["state"] for k, v in inst.items()})


if __name__ == "__main__":
    main(sys.argv[1:])
