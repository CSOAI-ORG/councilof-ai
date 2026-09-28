#!/usr/bin/env python3
"""Stage the signed card corpus (corpus 3, /signed/card_index.json) as Every Eval Ever records.

STAGES ONLY. This script writes files under --out. It opens no pull request, calls no
registry resolver (the hosted resolver can create entries in a third-party registry), and
uploads nothing. Submission is an owner decision.

What goes in, and what stays out, is decided by published rules, never by hand:

  EXCLUDED  own models        rules R1/R2 of /independence/own-model-disclosure.json, plus the
                              tags that register leaves unconfirmed (counted on neither side
                              there, so exported on neither side here). Excluded rows are listed
                              by card sha256 only: their names are not repeated.
  INCLUDED  third-party tags  the register's no_rule_matched tags that ALSO resolve to a page in
                              the public Ollama library (evidence file --ollama-check).
  HELD      instrument-suspect cells, by the rules in HOLD_RULES below. A held cell is not a
                              zero and not a finding about the model: it is a card this export
                              declines to present as a measurement until the instrument is audited.

Every exported card is verified first: id == sha256(preimage) and Ed25519(preimage) under the key
published in the DID document (did:web:csoai.org#card-attestation-1). A card that does not verify
stops the run.

Run with the EEE v0.3.0 package installed (python >= 3.12):
  python eee_export.py --repo <councilof-ai checkout> --did-json did.json \
      --ollama-check ollama-library-check.json --retrieved-at 2026-09-28T14:00:00Z --out <dir>
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import json
import math
import re
import sys
import uuid
from pathlib import Path

import nacl.exceptions
import nacl.signing

from every_eval_ever.converters.common.publication import publish_evaluation_logs
from every_eval_ever.eval_types import EvaluationLog
from every_eval_ever.helpers.io import (
    SourceConversionResult,
    SourceRecordExclusion,
    SourceRecordFailure,
    default_failure_report_path,
    save_failure_report,
)
from every_eval_ever.schema import get_schema_version

COLLECTION = "councilof-ai__gspc-card-corpus"
KID = "did:web:csoai.org#card-attestation-1"
SITE = "https://councilof.ai"

# Exact-match table (never prefix-matched). Prefixes follow the datastore's existing precedent for
# Ollama-run models (data/wordle_arena/qwen/qwen3-14b). The ids are NOT registry-resolved.
MODEL_IDS = {
    "falcon3:7b": ("tiiuae/falcon3-7b", "Technology Innovation Institute"),
    "gemma3:12b": ("google/gemma3-12b", "Google"),
    "llama3.2:3b": ("meta-llama/llama3.2-3b", "Meta"),
    "mistral:7b": ("mistralai/mistral-7b", "Mistral AI"),
    "phi4:14b": ("microsoft/phi4-14b", "Microsoft"),
    "qwen2.5:0.5b": ("qwen/qwen2.5-0.5b", "Alibaba Cloud"),
    "qwen2.5:0.5b-instruct": ("qwen/qwen2.5-0.5b-instruct", "Alibaba Cloud"),
    "qwen2.5:1.5b": ("qwen/qwen2.5-1.5b", "Alibaba Cloud"),
    "qwen2.5:3b": ("qwen/qwen2.5-3b", "Alibaba Cloud"),
    "qwen2.5:7b": ("qwen/qwen2.5-7b", "Alibaba Cloud"),
    "qwen3:0.6b": ("qwen/qwen3-0.6b", "Alibaba Cloud"),
    "qwen3:4b": ("qwen/qwen3-4b", "Alibaba Cloud"),
    "deepseek-r1:8b": ("deepseek/deepseek-r1-8b", "DeepSeek"),
}

# Benchmark families whose items are multiple choice with at least 5 options at most, so a
# uniform guess scores >= 0.2 per item. Read from the axis labels in client/src/lib/axisRegulation.ts.
K_CHOICE_AXES = {"arc-30", "mmlu-30", "swag-30"}
MIN_CHANCE = 0.2

# Documented instrument defects (publisher's own record).
DOCUMENTED_DEFECTS = {
    "swarm-candidates": (
        "H2",
        "The keyword-graded swarm bank is recorded by the publisher as budget-limited: on 14 Sep 2026, "
        "1266 of 1295 swarm answers across 35 runs ended at the 64-token output cap "
        "(issue CSOAI-ORG/councilof-ai#2436), so a pass or a miss can measure the budget rather than "
        "the model. Whether this card's run was affected is UNMEASURED: its run log is not published.",
    ),
}

HOLD_RULES = {
    "H1": "Axis returns one identical value for every third-party model on it. An instrument that "
          "gives every model the same reading has not been shown to discriminate; held until its "
          "grader is audited. Publisher's own precedent: huggingface.co/datasets/csoai/lmeval-official-format "
          "INVALIDATED.md (2026-08-03), where five weight sets returning one identical score was the "
          "instrument, not the models.",
    "H2": "Axis carries a documented instrument defect in the publisher's own record.",
    "H3a": "Multiple-choice bank (declared n=30, chance >= 0.2 per item) on which at least half of the "
           "third-party models read exactly 0. P(0 of 30 by uniform guessing) <= 0.8^30 = 1.2e-3, so a "
           "run of such zeros points at answer extraction, not capability; the whole axis is held.",
    "H3b": "Model reads exactly 0 on a multiple-choice bank (declared n=30, chance >= 0.2) on an axis "
           "not already held. That is below chance at p <= 1.2e-3 and points at answer extraction for "
           "this model; every card of this model in the batch is held.",
}


def canon(body):
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def sha256_hex(b):
    return hashlib.sha256(b).hexdigest()


def pinned_key(did_path: Path) -> str:
    did = json.loads(did_path.read_text())
    for vm in did.get("verificationMethod", []):
        if vm.get("id") == KID:
            x = vm["publicKeyJwk"]["x"]
            return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)).hex()
    raise SystemExit(f"{KID} not in {did_path}")


def verify(card: dict, key_hex: str) -> None:
    pre = canon(card["body"])
    if sha256_hex(pre) != card["id"]:
        raise SystemExit(f"card {card['id']}: id != sha256(preimage)")
    if card.get("pubkey") != key_hex:
        raise SystemExit(f"card {card['id']}: pubkey is not the DID-published key")
    try:
        nacl.signing.VerifyKey(bytes.fromhex(key_hex)).verify(pre, bytes.fromhex(card["signature"]))
    except nacl.exceptions.BadSignatureError:
        raise SystemExit(f"card {card['id']}: signature does not verify")


def axis_meta(repo: Path) -> dict:
    src = (repo / "client/src/lib/axisRegulation.ts").read_text()
    out = {}
    for m in re.finditer(r'"?([a-z0-9-]+)"?\s*:\s*\{\s*id:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*blurb:\s*"([^"]+)"', src):
        out[m.group(2)] = {"label": m.group(3), "blurb": m.group(4)}
    return out


def bank_n(axis: str):
    m = re.search(r"-(\d+)$", axis)  # same rule as client/src/lib/gspcFleet.ts axisBankN
    return int(m.group(1)) if m else None


def wilson(p: float, n: int, z: float = 1.959963984540054):
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0.0, c - h), min(1.0, c + h)


def file_uuid(card_id: str) -> str:
    return str(uuid.UUID(bytes=hashlib.sha256(("eee-export:" + card_id).encode()).digest()[:16], version=4))


def iso_to_epoch(s: str) -> str:
    return repr(dt.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp())


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo", required=True, type=Path)
    ap.add_argument("--did-json", required=True, type=Path)
    ap.add_argument("--ollama-check", required=True, type=Path)
    ap.add_argument("--retrieved-at", required=True, help="ISO time this export was produced (UTC)")
    ap.add_argument("--out", required=True, type=Path, help="staging root; data/ and adapter_reports/ go under it")
    a = ap.parse_args(argv)

    repo = a.repo
    idx_bytes = (repo / "public/signed/card_index.json").read_bytes()
    idx = json.loads(idx_bytes)
    idx_sha = sha256_hex(idx_bytes)
    reg = json.loads((repo / "public/independence/own-model-disclosure.json").read_text())
    if reg["source_sha256"] != idx_sha:
        raise SystemExit("own-model register was derived from a different card_index.json; re-derive it first")
    third_party_tags = {t["model"] for t in reg["no_rule_matched"]["tags"]}
    unconfirmed_tags = {t["model"] for t in reg["unconfirmed"]["tags"]}
    ollama = json.loads(a.ollama_check.read_text())
    listed = {m for m, r in ollama["results"].items() if r.get("in_ollama_library") is True}
    key = pinned_key(a.did_json)
    meta = axis_meta(repo)
    retrieved_epoch = iso_to_epoch(a.retrieved_at)
    schema_version = get_schema_version()

    cards = []
    for row in idx["cards"]:
        card = json.loads((repo / "public/signed/cards" / f"{row['card']}.json").read_text())
        if card["id"] != row["card"] or card["signature"] != row["sig"]:
            raise SystemExit(f"index row {row['card']} disagrees with its card file")
        verify(card, key)
        cards.append(card)

    def own_rule(model: str):
        if model.startswith("sov") or model.startswith("clan"):
            return "R1"
        if model.startswith("council") or "(council specialist)" in model:
            return "R2"
        if model in unconfirmed_tags:
            return "unconfirmed"
        return None

    exclusions, failures, keep = [], [], []
    for c in cards:
        m = c["body"]["model"]
        r = own_rule(m)
        if r is not None:
            why = ("own model, rule %s of %s/independence/own-model-disclosure.json; a measurer does not "
                   "place its own models in a comparative datastore" % (r, SITE)) if r != "unconfirmed" else (
                  "tag left unconfirmed by the own-model register (counted on neither side there); not exported "
                  "until the owner confirms who built it")
            exclusions.append(SourceRecordExclusion(source_ref=c["id"], reason=why,
                                                    source_record={"card_sha256": c["id"], "axis": c["body"]["axis"], "rule": r}))
            continue
        if m not in third_party_tags or m not in listed or m not in MODEL_IDS:
            failures.append(SourceRecordFailure(source_ref=c["id"], reason="model tag not positively identified as third-party",
                                                source_record={"card_sha256": c["id"], "model": m}))
            continue
        keep.append(c)

    # ---- hold rules, axis level first, then model level
    by_axis = {}
    for c in keep:
        by_axis.setdefault(c["body"]["axis"], []).append(c)
    held_axes = {}
    for ax, cs in by_axis.items():
        vals = {c["body"]["accuracy"] for c in cs}
        if len(cs) > 1 and len(vals) == 1:
            held_axes[ax] = ("H1", HOLD_RULES["H1"] + f" ({len(cs)} of {len(cs)} models read {vals.pop()}.)")
        elif ax in DOCUMENTED_DEFECTS:
            held_axes[ax] = DOCUMENTED_DEFECTS[ax]
        elif ax in K_CHOICE_AXES and bank_n(ax) == 30:
            zeros = sum(1 for c in cs if c["body"]["accuracy"] == 0)
            if zeros * 2 >= len(cs):
                held_axes[ax] = ("H3a", HOLD_RULES["H3a"] + f" ({zeros} of {len(cs)} models read exactly 0.)")
    held_models = {}
    for c in keep:
        b = c["body"]
        if b["axis"] in K_CHOICE_AXES and b["axis"] not in held_axes and bank_n(b["axis"]) == 30 and b["accuracy"] == 0:
            held_models.setdefault(b["model"], []).append(b["axis"])

    logs, uuids, exported = [], [], []
    for c in keep:
        b, cid = c["body"], c["id"]
        if b["axis"] in held_axes:
            rule, why = held_axes[b["axis"]]
            failures.append(SourceRecordFailure(source_ref=cid, reason=f"HELD {rule}: {why}",
                                                source_record={"card_sha256": cid, "model": b["model"], "axis": b["axis"], "card_accuracy": b["accuracy"]}))
            continue
        if b["model"] in held_models:
            failures.append(SourceRecordFailure(source_ref=cid, reason="HELD H3b: " + HOLD_RULES["H3b"] +
                                                f" (this model read 0 on: {', '.join(sorted(held_models[b['model']]))}.)",
                                                source_record={"card_sha256": cid, "model": b["model"], "axis": b["axis"], "card_accuracy": b["accuracy"]}))
            continue
        model_id, developer = MODEL_IDS[b["model"]]
        ax = b["axis"]
        am = meta.get(ax, {"label": ax, "blurb": "A signed benchmark axis in the card corpus."})
        n = bank_n(ax)
        eval_id = f"{COLLECTION}/{b['model']}/{cid}"
        card_url = f"{SITE}/signed/cards/{cid}.json"
        score = {"score": b["accuracy"], "details": {"card_field": "body.accuracy", "card_value": json.dumps(b["accuracy"])}}
        if n:
            lo, hi = wilson(b["accuracy"], n)
            score["uncertainty"] = {
                "num_samples": n,
                "confidence_interval": {"lower": round(lo, 4), "upper": round(hi, 4), "confidence_level": 0.95,
                                        "method": f"Wilson score interval, derived by this exporter from the card's accuracy and the bank size n={n} declared by the axis id; not part of the signed card"},
            }
        else:
            score["details"]["num_samples"] = "UNMEASURED: the card does not record how many items were graded"
        src_details = {
            "bank_label": am["label"],
            "bank_description": am["blurb"],
            "bank_items": (f"{n} (declared by the axis id)" if n else "UNMEASURED: not recorded in the card"),
            "bank_item_list": "UNMEASURED: the item list is not published with the card",
            "bank_digest": "UNMEASURED: the card records the axis id only",
            "axis_register": f"{SITE}/signed/card-matrix.json",
        }
        log = {
            "schema_version": schema_version,
            "evaluation_id": eval_id,
            "evaluation_timestamp": b["created"],
            "retrieved_timestamp": retrieved_epoch,
            "source_metadata": {
                "source_name": "Council of AI signed card corpus (/signed/card_index.json)",
                "source_type": "documentation",
                "source_organization_name": "Council of AI (CSOAI Ltd, UK company 16939677)",
                "source_organization_url": SITE,
                "evaluator_relationship": "third_party",
                "additional_details": {
                    "card_sha256": cid,
                    "card_signature_ed25519": c["signature"],
                    "card_signing_key": KID,
                    "card_signing_pubkey_hex": key,
                    "card_preimage_rule": c["preimage_rule"],
                    "card_url": card_url,
                    "card_verified_by_exporter": f"id == sha256(preimage) and Ed25519(preimage) under {KID}, checked {a.retrieved_at}",
                    "card_index_url": f"{SITE}/signed/card_index.json",
                    "card_index_sha256": idx_sha,
                    "card_index_head": idx["head"],
                    "how_to_verify": f"{SITE}/signed/HOW-TO-VERIFY.md",
                    "corpus": "The signed card index (one of three separately counted card sets the publisher keeps). "
                              "These are benchmark axes, not the publisher's governance board, and the two are never added.",
                    "card_timestamp_note": "evaluation_timestamp is the card's signing stamp (body.created); the run's own start time is not in the card.",
                    "card_body_note": "The signed body also carries a public_framing string current at signing; it is not a live count. "
                                      f"The board's count authority is {SITE}/api/gspc.",
                    "what_this_does_not_establish": "That a model is good, or better than another. One score on one short bank on one date.",
                    "export_rules": "Own models excluded; instrument-suspect cells held. See the adapter report for every card not exported and why.",
                },
            },
            "eval_library": {
                "name": "councilof-ai-gspc-card-factory",
                "version": "unknown",
                "additional_details": {"card_kind": b["kind"], "card_chain_prev": b["prev"],
                                       "version_note": "The card records no harness version."},
            },
            "model_info": {
                "name": b["model"],
                "id": model_id,
                "developer": developer,
                "inference_platform": "ollama",
                "additional_details": {
                    "deployment_type": "self_deployed",
                    "model_availability": "open_weights",
                    "ollama_tag": b["model"],
                    "ollama_library_url": ollama["results"][b["model"]]["url"],
                    "ollama_library_checked_at": ollama["checked_at"],
                    "model_id_resolution": "UNVERIFIED. The eval-card-registry resolver was not called (it can create registry entries). "
                                           "The id follows the datastore's existing Ollama-tag precedent (data/wordle_arena/qwen/qwen3-14b). "
                                           "The weights digest behind the tag at run time is not recorded in the card.",
                    "runtime_basis": "The recorded model name is an Ollama library tag; the run log naming the runtime is not published.",
                },
            },
            "evaluation_results": [{
                "evaluation_result_id": f"{eval_id}#{ax}#accuracy",
                "evaluation_name": f"councilof-ai.{ax}",
                "source_data": {"dataset_name": f"councilof-ai/{ax}", "source_type": "other", "additional_details": src_details},
                "evaluation_timestamp": b["created"],
                "metric_config": {
                    "evaluation_description": am["blurb"],
                    "metric_id": "accuracy",
                    "metric_name": "Accuracy",
                    "metric_kind": "accuracy",
                    "metric_unit": "proportion",
                    "lower_is_better": False,
                    "score_type": "continuous",
                    "min_score": 0,
                    "max_score": 1,
                },
                "score_details": score,
            }],
        }
        logs.append(EvaluationLog.model_validate(log))
        uuids.append(file_uuid(cid))
        exported.append({"card_sha256": cid, "model": b["model"], "axis": ax, "uuid": uuids[-1]})

    data_dir = a.out / "data"
    paths = publish_evaluation_logs(logs, data_dir, uuids, collection_override=COLLECTION)
    result = SourceConversionResult(source_name=COLLECTION, total_records=len(cards), records=exported,
                                    failures=failures, exclusions=exclusions)
    rpt = save_failure_report(result, default_failure_report_path(data_dir / COLLECTION))
    summary = {
        "cards_in_index": len(cards), "cards_verified": len(cards),
        "excluded_own_or_unconfirmed": len(exclusions),
        "third_party_cards": len(keep), "held": sum(1 for f in failures if f.reason.startswith("HELD")),
        "unidentified": sum(1 for f in failures if not f.reason.startswith("HELD")),
        "exported": len(paths), "held_axes": {k: v[0] for k, v in sorted(held_axes.items())},
        "held_models": {k: sorted(v) for k, v in sorted(held_models.items())},
        "schema_version": schema_version, "card_index_sha256": idx_sha, "report": str(rpt.relative_to(a.out)),
    }
    print(json.dumps(summary, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
