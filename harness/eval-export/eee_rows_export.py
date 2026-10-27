#!/usr/bin/env python3
"""Stage the published per-item rows as Every Eval Ever records with replayable instance sidecars.

WHY THIS EXISTS
───────────────
The card-derived export (``eee_export.py``) carries a number and no items: its
``bank_item_list`` field reads *"UNMEASURED: the item list is not published with the card"*, because
the signed card records an axis id and an accuracy, nothing else. A third party reading the
datastore could not check the number, re-score it, or see what was asked.

The per-item rows fix that. ``csoai/gspc-peritem-rows-2026-08-12`` publishes, for every model and
every bank, one line per item: the item text, the expected label, the model's raw answer, the
parsed label, and whether it was correct. The board's own numbers are read from those files —
the live board says so in its own bytes: *"mistral:7b 139/237 vs deepseek-r1:8b 128/237, both
read from the published per-item rows"*, and it flags the signed card for the same cell as
``CARD_RECORDS_A_DIFFERENT_MEASUREMENT`` because the card records an earlier run.

So this export is built FROM the rows, and every record carries a ``_samples.jsonl`` sidecar with
one line per item. The published score is recomputable from the sidecar: a third party can
re-score the run and get the same number, or compute the graded-only figure, because both
denominators and the unparsed count are published.

THE DENOMINATOR IS STATED, NOT ASSUMED
──────────────────────────────────────
The board's published number counts every item in the bank: an unparsed answer contributes 0 and
stays in the denominator (mistral:7b reads 139 of 237). The mill's own card rule differs — an
unparsed answer leaves the denominator there. Both figures are published here, and every unparsed
item is flagged in the sidecar, so a consumer can recompute either one. Neither is hidden and
neither is presented as the other.

STAGES ONLY. No upload, no pull request, no registry call. Submission is an owner decision.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
import uuid
from pathlib import Path

from every_eval_ever.converters.common.publication import publish_evaluation_logs
from every_eval_ever.eval_types import (
    DetailedEvaluationResults,
    EvaluationLog,
    Format,
    HashAlgorithm,
)
from every_eval_ever.helpers import SCHEMA_VERSION
from every_eval_ever.helpers.io import (
    SourceConversionResult,
    SourceRecordExclusion,
    SourceRecordFailure,
    datastore_output_dir,
    datastore_repo_file_path,
)
from every_eval_ever.instance_level_types import (
    AnswerAttributionItem,
    Evaluation,
    Input,
    InstanceLevelEvaluationLog,
    InteractionType,
    Output,
)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from eee_export import (  # noqa: E402  — the card exporter is the sibling that owns the shared tables
    KID,
    MODEL_IDS,
    SITE,
    iso_to_epoch,
    wilson,
)

COLLECTION = "councilof-ai__gspc-peritem-rows"
ROWS_DATASET = "csoai/gspc-peritem-rows-2026-08-12"
ROWS_URL = f"https://huggingface.co/datasets/{ROWS_DATASET}"
EXTRACTION_METHOD = "gspc-read-label"

# Which signed card axis names the same bank as a board axis. The board axes are the bank's
# published name; the cards use the "gspc-" prefixed axis id, and the older cards use the
# bare bank name. Both are looked up; a card that exists records an EARLIER run of the same
# bank, which the board itself flags as CARD_RECORDS_A_DIFFERENT_MEASUREMENT.
CARD_AXIS_FOR_BOARD = {
    "governance": ("gspc-governance", "gov"),
    "safety": ("gspc-safety",),
    "provenance": ("gspc-provenance",),
    "conformance": ("gspc-conformance",),
    "openness": ("gspc-openness",),
    "continuity": ("gspc-continuity",),
    "care": ("care",),
}


def canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def sample_hash(raw: str, reference: list[str]) -> str:
    """The ONE sample_hash recipe every EEE adapter must match (adapters/openeval.sample_hash)."""
    payload = json.dumps({"raw": raw, "reference": reference}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def file_uuid(seed: str) -> str:
    """A UUIDv4 the publisher accepts, derived deterministically from the cell's identity."""
    return str(uuid.UUID(bytes=hashlib.sha256(("eee-rows-export:" + seed).encode()).digest()[:16], version=4))


def load_rows(rows_dir: Path) -> tuple[dict, dict, dict]:
    """Return (rows_by_cell, file_digests, manifest)."""
    manifest = json.loads((rows_dir / "MANIFEST.json").read_text())
    separation_path = rows_dir / "SEPARATION_RESULT.json"
    separation = json.loads(separation_path.read_text()) if separation_path.exists() else {}
    rows_by_cell: dict[tuple[str, str], list[dict]] = {}
    digests: dict[str, str] = {}
    board_axis_of: dict[str, str] = {}
    for entry in manifest["files"]:
        path = rows_dir / Path(entry["path"]).name
        raw = path.read_bytes()
        digest = sha256_hex(raw)
        if digest != entry["sha256"]:
            raise SystemExit(f"{path.name}: sha256 {digest} does not match the manifest's {entry['sha256']}")
        digests[entry["board_axis"]] = digest
        axis = entry["board_axis"]
        board_axis_of[axis] = entry["board_axis"]
        for line in raw.decode("utf-8").splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            rows_by_cell.setdefault((row["model"], axis), []).append(row)
    return rows_by_cell, digests, board_axis_of, {"manifest": manifest, "separation": separation}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--rows-dir", required=True, type=Path, help="directory holding the per-item rows and MANIFEST.json")
    ap.add_argument("--repo", required=True, type=Path, help="councilof-ai checkout, for the signed cards")
    ap.add_argument("--retrieved-at", required=True, help="ISO time this export was produced (UTC)")
    ap.add_argument("--out", required=True, type=Path, help="staging root; data/ and adapter_reports/ go under it")
    a = ap.parse_args(argv)

    rows_by_cell, digests, board_axis_of, meta = load_rows(a.rows_dir)
    manifest = meta["manifest"]
    separation = meta["separation"]
    repo = a.repo

    # the cards, for corroboration only: a card may record a DIFFERENT measurement of the same cell
    cards: dict[tuple[str, str], dict] = {}
    idx_path = repo / "public/signed/card_index.json"
    if idx_path.exists():
        idx = json.loads(idx_path.read_text())
        for row in idx["cards"]:
            c = json.loads((repo / "public/signed/cards" / f"{row['card']}.json").read_text())
            cards[(c["body"]["model"], c["body"]["axis"])] = c["body"]

    third_party = sorted({m for m, _ in rows_by_cell if m in MODEL_IDS})
    excluded = [SourceRecordExclusion(
        source_ref=m,
        reason="own model (rule R1/R2 of /independence/own-model-disclosure.json); a measurer does not place its own "
               "models in a comparative datastore",
        source_record={"model": m},
    ) for m in sorted({m for m, _ in rows_by_cell} - set(third_party))]

    logs, uuids, exported, failures = [], [], [], []
    seen_order: dict[str, list[str]] = {}

    for model in third_party:
        model_id, developer = MODEL_IDS[model]
        for axis in sorted({ax for m, ax in rows_by_cell if m == model}):
            rows = rows_by_cell[(model, axis)]
            total = len(rows)
            correct = sum(1 for r in rows if r["correct"])
            unparsed = sum(1 for r in rows if r["unparsed"])
            graded = total - unparsed
            graded_correct = sum(1 for r in rows if r["correct"] and not r["unparsed"])
            score = correct / total if total else 0.0
            graded_score = (graded_correct / graded) if graded else None
            if graded < 30:
                failures.append(SourceRecordFailure(
                    source_ref=f"{model}/{axis}",
                    reason=f"only {graded} graded items (below the 30 this estate requires before a figure is quotable)",
                    source_record={"model": model, "axis": axis, "graded": graded}))
                continue

            # do the rows for the same bank run in the same item order across models?
            order = [r["item"] for r in rows]
            if axis in seen_order and seen_order[axis] != order:
                failures.append(SourceRecordFailure(
                    source_ref=f"{model}/{axis}",
                    reason="the per-item rows for this bank are not in the same item order as another model's; "
                           "the per-item pairing cannot be asserted",
                    source_record={"model": model, "axis": axis}))
                continue
            seen_order.setdefault(axis, order)

            board_axis = board_axis_of.get(axis, axis)
            cell_id = f"{model}|{axis}"
            fuuid = file_uuid(cell_id)
            eval_id = f"{COLLECTION}/{model_id}/{fuuid}"
            result_id = f"{eval_id}#{board_axis}#accuracy"

            src_details = {
                "bank_label": f"GSPC {board_axis} axis",
                "bank_description": "A signed GSPC benchmark axis, graded by the Council of AI's own grader.",
                "bank_items": str(total),
                "bank_item_list": f"every item, published: {ROWS_URL}/blob/main/rows/peritem_{axis}.jsonl "
                                  f"(sha256 {digests[axis]}); the same items are in this record's _samples.jsonl sidecar",
                "bank_digest": f"sha256 {digests[axis]} of the published rows file for this bank",
                "axis_register": f"{SITE}/signed/card-matrix.json",
                "items_total": str(total),
                "items_graded": str(graded),
                "items_unparsed": str(unparsed),
                "denominator_rule": "the published score counts EVERY item in the bank: an unparsed answer contributes 0 "
                                    "and stays in the denominator. The graded-only figure is published beside it, and every "
                                    "unparsed item is flagged in the sidecar, so either figure can be recomputed.",
                "accuracy_graded_only": f"{graded_score:.6f}" if graded_score is not None else
                                        "UNMEASURED: no item in this cell was parsed",
                "per_item_rows": f"dataset {ROWS_DATASET} · file rows/peritem_{axis}.jsonl · sha256 {digests[axis]} · "
                                 f"measured {manifest.get('measured')} · licence {manifest.get('licence')}",
            }

            # the signed card for the same cell, when there is one: corroboration, and an explicit
            # note when it records a different measurement of the same bank
            card = None
            card_axis = None
            for candidate in CARD_AXIS_FOR_BOARD.get(board_axis, ()):
                if (model, candidate) in cards:
                    card, card_axis = cards[(model, candidate)], candidate
                    break
            if card is not None:
                src_details["signed_card_corroboration"] = (
                    f"the signed card for {model} on {card_axis} records accuracy {card['accuracy']}, a different "
                    f"measurement of the same bank (an earlier run with a different item count); the number published here "
                    f"is the one the board reads from the per-item rows, and the sidecar beside it is the evidence"
                )

            lo, hi = wilson(score, total)
            log = {
                "schema_version": SCHEMA_VERSION,
                "evaluation_id": eval_id,
                "evaluation_timestamp": manifest.get("measured", "").split(" ")[0] or None,
                "retrieved_timestamp": iso_to_epoch(a.retrieved_at),
                "source_metadata": {
                    "source_name": "Council of AI published per-item rows (csoai/gspc-peritem-rows-2026-08-12)",
                    "source_type": "documentation",
                    "source_organization_name": "Council of AI (CSOAI Ltd, UK company 16939677)",
                    "source_organization_url": SITE,
                    "evaluator_relationship": "third_party",
                    "additional_details": {
                        "rows_dataset": ROWS_DATASET,
                        "rows_url": ROWS_URL,
                        "rows_file": f"rows/peritem_{axis}.jsonl",
                        "rows_file_sha256": digests[axis],
                        "rows_manifest_sha256": sha256_hex((a.rows_dir / "MANIFEST.json").read_bytes()),
                        "rows_measured": manifest.get("measured"),
                        "rows_frozen": manifest.get("frozen"),
                        "rows_published": manifest.get("published"),
                        "rows_transport_errors": str(manifest.get("transport_errors")),
                        "live_board": f"{SITE}/api/gspc",
                        "board_axis": board_axis,
                        "board_leader_note": "the live board reads its own numbers from these rows",
                        "how_to_verify": f"{SITE}/signed/HOW-TO-VERIFY.md",
                        "what_this_does_not_establish": "That a model is good, or better than another. One score on one bank "
                                                        "on one date, over a fleet of 6 published models.",
                        "replayable": "the score in this record is recomputable from the _samples.jsonl sidecar beside it: "
                                      "count the lines whose evaluation.is_correct is true, and divide by the number of lines.",
                    },
                },
                "eval_library": {
                    "name": "councilof-ai-gspc-peritem-rows",
                    "version": manifest.get("frozen", "unknown"),
                    "additional_details": {"rows_licence": manifest.get("licence"),
                                           "grader": EXTRACTION_METHOD,
                                           "grader_note": "the published rows carry the grader's own parsed label and "
                                                          "correct flag; this exporter does not re-grade"},
                },
                "model_info": {
                    "name": model,
                    "id": model_id,
                    "developer": developer,
                    "inference_platform": "ollama",
                    "additional_details": {
                        "deployment_type": "self_deployed",
                        "model_availability": "open_weights",
                        "ollama_tag": model,
                        "runtime_basis": "The recorded model name is an Ollama library tag; the run log naming the runtime "
                                         "is not published.",
                        "model_id_resolution": "UNVERIFIED. The eval-card-registry resolver was not called (it can create "
                                               "registry entries). The id follows the datastore's existing Ollama-tag precedent.",
                    },
                },
                "evaluation_results": [{
                    "evaluation_result_id": result_id,
                    "evaluation_name": f"councilof-ai.{board_axis}",
                    "source_data": {"dataset_name": f"councilof-ai/{board_axis}", "source_type": "other",
                                    "additional_details": src_details},
                    "evaluation_timestamp": manifest.get("measured", "").split(" ")[0] or None,
                    "metric_config": {
                        "evaluation_description": f"Accuracy over the GSPC {board_axis} bank, graded by {EXTRACTION_METHOD}.",
                        "metric_id": "accuracy",
                        "metric_name": "Accuracy",
                        "metric_kind": "accuracy",
                        "metric_unit": "proportion",
                        "lower_is_better": False,
                        "score_type": "continuous",
                        "min_score": 0,
                        "max_score": 1,
                    },
                    "score_details": {
                        "score": score,
                        "details": {
                            "correct": str(correct),
                            "items_total": str(total),
                            "items_graded": str(graded),
                            "items_unparsed": str(unparsed),
                            "denominator": "every item in the bank",
                            "accuracy_graded_only": f"{graded_score:.6f}" if graded_score is not None else
                                                    "UNMEASURED: no item in this cell was parsed",
                            "rows_file_sha256": digests[axis],
                            "replay": "count the sidecar lines whose evaluation.is_correct is true and divide by the number "
                                      "of lines; that is the score published here",
                        },
                        "uncertainty": {
                            "num_samples": total,
                            "confidence_interval": {"lower": round(lo, 4), "upper": round(hi, 4),
                                                    "confidence_level": 0.95,
                                                    "method": f"Wilson score interval, derived by this exporter from the "
                                                              f"published rows' correct count over n={total}; not part of the rows"},
                        },
                    },
                }],
            }
            evaluation_log = EvaluationLog.model_validate(log)

            # ---- the instance-level sidecar: one line per item, so the score is replayable
            lines, digest = [], hashlib.sha256()
            for i, r in enumerate(rows):
                reference = [str(r["expected"])]
                rec = InstanceLevelEvaluationLog(
                    schema_version=SCHEMA_VERSION,
                    evaluation_id=eval_id,
                    evaluation_result_id=result_id,
                    evaluation_name=f"councilof-ai.{board_axis}",
                    model_id=model_id,
                    sample_id=f"{board_axis}_{i:04d}",
                    sample_hash=sample_hash(r["item"], reference),
                    interaction_type=InteractionType.single_turn,
                    input=Input(raw=r["item"], reference=reference, formatted=None),
                    output=Output(raw=[str(r["raw"])]),
                    answer_attribution=[AnswerAttributionItem(
                        turn_idx=0, source="output.raw",
                        extracted_value=str(r["parsed"] or ""),
                        extraction_method=EXTRACTION_METHOD,
                        is_terminal=True)],
                    evaluation=Evaluation(score=1.0 if r["correct"] else 0.0, is_correct=bool(r["correct"])),
                    token_usage=None,
                    metadata={"subject": str(r.get("axis_item") or f"{board_axis}_{i:04d}"),
                              "unparsed": bool(r["unparsed"]),
                              "expected": str(r["expected"]),
                              "item_index": i},
                )
                line = (json.dumps(rec.model_dump(mode="json", exclude_none=True), ensure_ascii=False) + "\n").encode("utf-8")
                digest.update(line)
                lines.append(line)

            evaluation_log.detailed_evaluation_results = DetailedEvaluationResults(
                format=Format.jsonl,
                file_path=datastore_repo_file_path(COLLECTION, model_id, developer, f"{fuuid}_samples.jsonl"),
                hash_algorithm=HashAlgorithm.sha256,
                checksum=digest.hexdigest(), total_rows=len(lines))

            # stage the sidecar where the publisher expects to find it: it re-reads and
            # re-checksums the staged bytes, and refuses to publish a file it cannot match
            stage_dir = datastore_output_dir(a.out / "staged" / "data", COLLECTION, model_id, developer)
            stage_dir.mkdir(parents=True, exist_ok=True)
            (stage_dir / f"{fuuid}_samples.jsonl").write_bytes(b"".join(lines))

            logs.append(evaluation_log)
            uuids.append(fuuid)
            exported.append({
                "model": model, "model_id": model_id, "developer": developer, "axis": axis,
                "board_axis": board_axis, "uuid": fuuid, "score": score, "n": total,
                "graded": graded, "unparsed": unparsed, "items": len(lines),
                "samples_sha256": digest.hexdigest(),
            })

    if not logs:
        raise SystemExit("no cell survived the rules; nothing to publish")

    data_dir = a.out / "data"
    staged_dir = a.out / "staged" / "data"
    paths = publish_evaluation_logs(logs, data_dir, uuids, staged_output_dir=staged_dir,
                                    collection_override=COLLECTION)

    # the manifest: what was published, from which bytes, and what was held back
    files = sorted(p for p in data_dir.rglob("*") if p.is_file())
    manifest_out = {
        "schema": "csoai.eee-rows-export-manifest/0.1",
        "produced_at": a.retrieved_at,
        "state": "STAGED — not submitted. Submission to huggingface.co/datasets/evaleval/EEE_datastore "
                 "is an owner decision.",
        "collection": COLLECTION,
        "eee": {"version": "0.3.0", "source": "https://github.com/evaleval/every_eval_ever/tree/v0.3.0"},
        "inputs": {
            "rows_dataset": ROWS_DATASET,
            "rows_url": ROWS_URL,
            "rows_manifest_sha256": sha256_hex((a.rows_dir / "MANIFEST.json").read_bytes()),
            "rows_files_sha256": digests,
            "rows_measured": manifest.get("measured"),
            "rows_frozen": manifest.get("frozen"),
            "rows_published": manifest.get("published"),
            "rows_licence": manifest.get("licence"),
        },
        "counts": {
            "records": len(logs),
            "files": len(files),
            "items_total": sum(e["items"] for e in exported),
            "models": len(third_party),
            "axes": len({e["axis"] for e in exported}),
            "excluded_own_models": len(excluded),
            "held_below_30_graded": len(failures),
        },
        "held": [{"cell": f.source_ref, "reason": f.reason} for f in failures],
        "excluded_own_models": [{"model": e.source_ref} for e in excluded],
        "files_sha256": {str(p.relative_to(a.out)): sha256_hex(p.read_bytes()) for p in files},
    }
    (a.out / "EXPORT-MANIFEST.json").write_text(json.dumps(manifest_out, indent=1) + "\n")

    print(json.dumps({
        "collection": COLLECTION,
        "records": len(logs),
        "files": len(files),
        "models": sorted({e["model"] for e in exported}),
        "axes": sorted({e["axis"] for e in exported}),
        "items_total": sum(e["items"] for e in exported),
        "excluded_own_models": len(excluded),
        "failures": len(failures),
        "manifest": str((a.out / "EXPORT-MANIFEST.json")),
    }, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
