#!/usr/bin/env python3
"""Render a source-pinned Academy lesson index and a reproducible notebook.

This module reads published source bytes and emits derived metadata. It does not
grade people, issue XP, change the original lessons, publish, or authorize training.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import urllib.request
from datetime import datetime
from pathlib import Path

LESSON_FILES = (
    "lesson-council-vote-is-evidence.md",
    "lesson-inception-tracking.md",
    "lesson-kev-delta-live.md",
    "lesson-mcp-handshake-census.md",
    "lesson-what-a-402-proves.md",
)
SOURCE_FILES = ("README.md", "axis-path.json", *LESSON_FILES)
SOURCE_DATASET = "csoai/gspc-academy"
SOURCE_REVISION = "d70acfc393cb947edabf9fab4a294f515b3b77b0"
MAX_SOURCE_BYTES = 1_000_000
SOURCE_CODE_PATH = "scripts/hf/academy_review_assets.py"
REPORTER_FILES = (
    "packages/evidence-fabric/render/learning_review_report.py",
    "packages/evidence-fabric/render/axis_referee_review.py",
    "packages/evidence-fabric/render/__init__.py",
    "packages/evidence-fabric/event.py",
    "scripts/evaluation_card_verify.py",
    "public/schemas/csoai-evaluation-card-0.1.schema.json",
    "public/schemas/csoai-evaluation-card-0.2.schema.json",
)
AI_DISCLOSURES = ({
    "name": "ChatGPT", "version": "GPT-6 Astra Pro",
    "role": "Assistance implementing and reviewing the exporter and report; zero model inference calls in the seven-file integrity measurement itself.",
    "evidence_event_ids": [],
},)
SECTION_PATTERNS = {
    "experience": r"\*\*Experience(?:\s|:|\*)",
    "expertise": r"\*\*Expertise(?:\s|:|\*)",
    "source": r"\*\*(?:Authoritativeness|Source of record)(?:\s|:|\*)",
    "verification": r"\*\*(?:Trustworthiness|Verify it yourself)(?:\s|:|\*)",
    "falsifier": r"\*\*What would falsify this(?:\s|:|\*)",
}


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def json_bytes(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode()


def source_url(path: str) -> str:
    return f"https://huggingface.co/datasets/{SOURCE_DATASET}/resolve/{SOURCE_REVISION}/{path}"


def validate_lock(lock: dict) -> None:
    if lock.get("source_dataset") != SOURCE_DATASET or lock.get("source_revision") != SOURCE_REVISION:
        raise ValueError("Unexpected source dataset/revision; review a new source lock explicitly")
    files = lock.get("files")
    if not isinstance(files, dict) or set(files) != set(SOURCE_FILES):
        raise ValueError("The lock must name exactly the five lessons, README and exercise manifest")
    for name, entry in files.items():
        if entry.get("url") != source_url(name):
            raise ValueError(f"Unpinned or unexpected source URL: {name}")
        if not re.fullmatch(r"[0-9a-f]{64}", entry.get("sha256", "")):
            raise ValueError(f"Invalid SHA-256: {name}")
        count = entry.get("bytes")
        if type(count) is not int or not 0 < count <= MAX_SOURCE_BYTES:
            raise ValueError(f"Invalid source size: {name}")


def checked_sources(lock: dict, source_dir: Path | None = None) -> dict[str, bytes]:
    """Read exact files, anonymously from pinned URLs or from an explicit directory."""
    validate_lock(lock)
    output = {}
    opener = urllib.request.build_opener()
    for name in SOURCE_FILES:
        entry = lock["files"][name]
        if source_dir is not None:
            target = source_dir / name
            if target.is_symlink():
                raise ValueError(f"Source symlink refused: {name}")
            raw = target.read_bytes()
        else:
            request = urllib.request.Request(entry["url"], headers={"User-Agent": "csoai-academy-source-review/1.0"})
            with opener.open(request, timeout=30) as response:
                raw = response.read(MAX_SOURCE_BYTES + 1)
        if len(raw) != entry["bytes"] or sha256(raw) != entry["sha256"]:
            raise ValueError(f"Source byte or digest mismatch: {name}")
        raw.decode("utf-8", errors="strict")
        output[name] = raw
    return output


def lesson_row(name: str, raw: bytes, lock: dict) -> dict:
    text = raw.decode("utf-8")
    title = re.search(r"^# ([^\n]+)$", text, re.M)
    if not title:
        raise ValueError(f"Missing source lesson title: {name}")
    sections = {key: bool(re.search(pattern, text, re.I)) for key, pattern in SECTION_PATTERNS.items()}
    urls = sorted(set(url.rstrip(".,;)") for url in re.findall(r"https?://[^\s<>`]+", text)))
    dates = sorted(set(re.findall(r"\b20\d{2}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}Z)?\b", text)))
    return {
        "lesson_id": name.removesuffix(".md"),
        "title": title.group(1),
        "source_dataset": SOURCE_DATASET,
        "source_revision": SOURCE_REVISION,
        "source_file": name,
        "source_url": lock["files"][name]["url"],
        "source_sha256": sha256(raw),
        "source_bytes": len(raw),
        "source_bytes_match_lock": True,
        "source_dates_json": json.dumps(dates, ensure_ascii=False),
        "referenced_urls_json": json.dumps(urls, ensure_ascii=False),
        "explicit_section_markers_json": json.dumps(sections, sort_keys=True),
        "verification_marker_present": sections["verification"],
        "falsifier_marker_present": sections["falsifier"],
        "current_use_review_state": "HISTORICAL_SOURCE_REQUIRES_CURRENT_REVIEW",
        "current_claims_retested": False,
        "source_license": "NOT_DECLARED_IN_SOURCE_DATASET_CARD",
        "training_authority": False,
        "human_learning_outcome_evaluated": False,
        "execution_authority": False,
        "exercise_manifest_url": lock["files"]["axis-path.json"]["url"],
        "exercise_manifest_sha256": lock["files"]["axis-path.json"]["sha256"],
    }


def build_assets(lock: dict, sources: dict[str, bytes]) -> tuple[list[dict], dict, str]:
    validate_lock(lock)
    # Callers cannot skip byte validation by supplying a custom source dictionary.
    if set(sources) != set(SOURCE_FILES):
        raise ValueError("Source dictionary is incomplete or contains unexpected files")
    for name, raw in sources.items():
        expected = lock["files"][name]
        if len(raw) != expected["bytes"] or sha256(raw) != expected["sha256"]:
            raise ValueError(f"Source byte or digest mismatch: {name}")
    exercise = json.loads(sources["axis-path.json"])
    if exercise.get("schema") != "csoai.academy-axis-path/0.1" or exercise.get("axis") != "gspc-live":
        raise ValueError("Unexpected existing exercise-manifest schema or axis")
    rows = [lesson_row(name, sources[name], lock) for name in LESSON_FILES]
    missing = {row["lesson_id"]: [key for key, present in json.loads(row["explicit_section_markers_json"]).items() if not present]
               for row in rows}
    review = {
        "source_dataset": SOURCE_DATASET,
        "source_revision": SOURCE_REVISION,
        "source_lock_sha256": sha256(json_bytes(lock)),
        "scope": "Executed source-byte integrity and metadata extraction only",
        "files_checked": len(sources),
        "lesson_rows": len(rows),
        "all_source_digests_match": True,
        "all_original_lesson_bytes_preserved": True,
        "explicit_section_marker_gaps": missing,
        "marker_check_limitation": "Text markers are syntax checks, not a judgment of truth or teaching quality.",
        "current_claims_retested": False,
        "human_responses_used": 0,
        "model_inference_calls": 0,
        "learning_outcome_status": "NOT_EVALUATED",
        "training_authority": False,
        "execution_authority": False,
        "source_license": "NOT_DECLARED_IN_SOURCE_DATASET_CARD",
        "exercise_status_retained_from_source": exercise.get("status"),
        "exercise_credential_state_retained_from_source": exercise.get("credential", {}).get("state"),
        "exercise_status_is_new_measurement": False,
        "limitations": [
            "Historical numerical and legal claims were not re-evaluated in this run.",
            "Mutable links inside a frozen lesson do not pin the bytes of their targets.",
            "Integrity does not establish source truth, human competence, endorsement or authority.",
            "No new licence or model-training permission is inferred from public availability.",
        ],
    }
    original = sources["README.md"].decode("utf-8")
    card = f"""---
language:
- en
configs:
- config_name: default
  data_files:
  - split: lessons
    path: lessons.jsonl
---

# Council Academy — source-linked lesson index

This table makes the five existing lesson files available in the dataset viewer.
Each row links to the exact original Markdown revision and records its SHA-256,
historical dates, explicit section markers and current-use review boundary.
The original Markdown files remain unchanged.

**This is a historical source index.** Checking a file's hash does not verify its
claims, measure human learning, award XP, appoint a reviewer or approve an action.
No model training or learner data collection takes place. The source dataset card
does not declare a content licence; this table introduces no new licence grant.

## Source and reproduction

- Original dataset: `{SOURCE_DATASET}` at `{SOURCE_REVISION}`.
- `source-lock.json`: seven exact source files and their hashes.
- `lessons.jsonl` / `lessons.csv`: generated metadata; one row per existing lesson.
- `asset-review.json`: actual integrity and extraction results, including limits.
- `academy-evidence-review.ipynb`: a CPU-only replay once its source commit is pinned.
- `PUBLICATION.json`, when present: the committed generator source and mirror readback.

The `lessons` split is a reference index, not a held-out evaluation bank or a
training authorization. Original ORB questions, rank thresholds, progress and
decision records are outside this export. WG-SAFE references and reviewer
calibration are separate versioned review material; this index confers no
alliance endorsement or human authority.

## Current-use review

Review source applicability, dates, rights and teaching claims before using a
historical lesson for assessment. The extraction report checks the presence of
named text sections only. Missing markers do not by themselves prove missing
reasoning; present markers do not prove correctness.

## Preserved original description

The following text is the original description at the pinned revision. Its use of
“live” describes that historical source, not a new measurement by this export.

---

{original}"""
    return rows, review, card


def write_assets(out: Path, lock: dict, rows: list[dict], review: dict, card: str) -> None:
    out.mkdir(parents=True, exist_ok=True)
    (out / "source-lock.json").write_bytes(json_bytes(lock))
    (out / "lessons.jsonl").write_text("".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n" for row in rows), encoding="utf-8")
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(rows)
    (out / "lessons.csv").write_text(stream.getvalue(), encoding="utf-8", newline="")
    (out / "asset-review.json").write_bytes(json_bytes(review))
    (out / "dataset-README.md").write_text(card, encoding="utf-8")


def evaluation_card(lock: dict, sources: dict[str, bytes], *, as_of: str,
                    generator_sha256: str, source_commit: str | None = None) -> tuple[dict, bytes]:
    """Describe the actual deterministic integrity run using the existing card schema."""
    # Revalidate all bytes before producing a measured card or item ledger.
    build_assets(lock, sources)
    parsed = datetime.fromisoformat(as_of.replace("Z", "+00:00"))
    if parsed.tzinfo is None or not re.fullmatch(r"[0-9a-f]{64}", generator_sha256):
        raise ValueError("A timezone-qualified run time and generator digest are required")
    if source_commit is not None and not re.fullmatch(r"[0-9a-f]{40}", source_commit):
        raise ValueError("Exact source commit required")
    ledger_rows = [{"item_id": name, "arm_id": "source-integrity", "answerer": "rule",
                    "expected_sha256": lock["files"][name]["sha256"], "observed_sha256": sha256(sources[name]),
                    "expected_bytes": lock["files"][name]["bytes"], "observed_bytes": len(sources[name]),
                    "source_url": lock["files"][name]["url"], "match": True} for name in SOURCE_FILES]
    ledger = "".join(json.dumps(row, sort_keys=True) + "\n" for row in ledger_rows).encode()
    card = {
        "schema": "https://councilof.ai/schemas/csoai-evaluation-card-0.1.schema.json",
        "id": "academy-source-integrity-" + sha256(ledger)[:16],
        "kind": "evaluation-card",
        "title": "Council Academy: seven-file source integrity check",
        "description": "Executed deterministic comparison of seven pinned public source files with declared SHA-256 and byte lengths. The five-row metadata export was generated from these bytes. This is a source integrity check, not a model benchmark, lesson-content review or human learning experiment. The card timestamp records creation of this result artifact; external release/readback is recorded separately.",
        "subject": {"id": SOURCE_DATASET, "kind": "dataset", "version": SOURCE_REVISION,
                    "url": f"https://huggingface.co/datasets/{SOURCE_DATASET}/tree/{SOURCE_REVISION}"},
        "instrument": {"name": "academy_review_assets.checked_sources", "version": "1", "kind": "probe",
                       "grader_sha256": generator_sha256, "rubric_sha256": sha256(json_bytes(lock))},
        "suite": {"id": "academy-seven-source-files", "version": SOURCE_REVISION, "items_total": 7,
                  "items_held_out": 0, "bank_sha256": sha256(json_bytes(lock))},
        "arms": [{"id": "source-integrity", "kind": "rule", "items": 7, "answered_by_model": 0,
                  "answered_by_rule": 7, "description": "Deterministic SHA-256 and byte-length comparisons; zero model calls and zero human review responses."}],
        "item_ledger": {"path": "integrity-ledger.jsonl", "sha256": sha256(ledger), "items": 7},
        "result": {"state": "MEASURED", "value": 1.0, "unit": "fraction_of_pinned_files_matching_hash_and_size",
                   "per_arm": [{"arm_id": "source-integrity", "items": 7, "value": 1.0, "unit": "fraction_of_pinned_files_matching_hash_and_size", "partition": "seven-listed-source-files"}],
                   "p_value": None, "separated": None, "band": "Exact finite-file integrity count; no population estimate or model comparison."},
        "claim_boundary": "Matching bytes establish integrity against this manifest only. They do not establish factual accuracy of lessons, source rights, learner identity or competence, reviewer calibration, WG-SAFE endorsement, GSPC admission or action authority.",
        "reproduction": {"state": "REPRODUCIBLE" if source_commit else "NOT_PUBLISHED",
                         "command": "python3 scripts/hf/academy_review_assets.py --lock qualification/academy-review-20261111/source-lock.json --out ./academy-review-replay --as-of YYYY-MM-DDTHH:MM:SSZ",
                         "inputs": ["qualification/academy-review-20261111/source-lock.json"],
                         "environment": "Python 3.10+ standard library; anonymous access to pinned public source files; CPU only.",
                         "reason": None if source_commit else "Source candidate generated for review; public source release and hosted replay have not yet been verified."},
        "provenance": {"published_at": as_of, "as_of": as_of,
                       "source_urls": [source_url(name) for name in SOURCE_FILES], "did": None, "sig_ed25519": None},
        "limitations": ["Seven declared public files only; the sample is not representative of all CSOAI materials.",
                        "Zero held-out tasks; the source files were inspected while the exporter was built.",
                        "Source claims and mutable target URLs were not re-tested.",
                        "No model inference, real learner responses, reviewer calibration or human approval was evaluated.",
                        "The source dataset card does not declare a content licence; this export does not infer a new licence."],
        "not_established": ["Current truth of historical lesson claims", "Human learning gain or calibrated reviewer competence",
                            "External independent reproduction", "Model capability improvement", "Approval or execution authority"],
        "corrections": None,
        "every_eval_ever": {"license": None, "task": "source-integrity", "dataset": SOURCE_DATASET, "model": None,
                            "metrics": [{"name": "matching_file_fraction", "value": 1.0, "unit": "fraction", "higher_is_better": True}],
                            "eval_type": "deterministic-source-audit", "eval_date": as_of[:10],
                            "not_applicable_reason": "No model answered any item. The source dataset does not declare a content licence; no licence is inferred."},
    }
    if source_commit:
        card["provenance"]["source_urls"].append(f"https://github.com/CSOAI-ORG/councilof-ai/blob/{source_commit}/{SOURCE_CODE_PATH}")
    return card, ledger


def reporter_manifest(repo: Path) -> dict:
    """Capture the reviewed renderer files; the notebook checks every byte before import."""
    output = {}
    for name in REPORTER_FILES:
        path = repo / name
        if path.is_symlink():
            raise ValueError(f"Reporter symlink refused: {name}")
        raw = path.read_bytes()
        output[name] = {"sha256": sha256(raw), "bytes": len(raw)}
    return output


def validate_reporter_manifest(reporter: dict) -> None:
    if not isinstance(reporter, dict) or set(reporter) != set(REPORTER_FILES):
        raise ValueError("Reporter manifest must name exactly the reviewed dependency paths")
    for name, entry in reporter.items():
        if (not isinstance(entry, dict) or set(entry) != {"sha256", "bytes"}
                or not re.fullmatch(r"[0-9a-f]{64}", str(entry["sha256"]))
                or type(entry["bytes"]) is not int or not 0 <= entry["bytes"] <= MAX_SOURCE_BYTES):
            raise ValueError(f"Invalid reporter dependency: {name}")


def notebook(source_commit: str, lock: dict, builder_digest: str, reporter: dict | None = None) -> dict:
    """Build a notebook that downloads only pinned source; no API credentials."""
    validate_lock(lock)
    if not re.fullmatch(r"[0-9a-f]{40}", source_commit):
        raise ValueError("An exact released source commit is required")
    if not re.fullmatch(r"[0-9a-f]{64}", builder_digest):
        raise ValueError("A complete generator source SHA-256 is required")
    if reporter is not None:
        validate_reporter_manifest(reporter)
    cells = []
    def markdown(text):
        cells.append({"cell_type": "markdown", "metadata": {}, "source": text.splitlines(keepends=True)})
    def code(text):
        cells.append({"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [], "source": text.splitlines(keepends=True)})
    markdown("# Council Academy: reproduce the source-linked review\n\nThis CPU-only notebook verifies seven published source files, regenerates the five-row reference index and records actual extraction results. It uses no credentials, model calls, learner responses, XP or action authority. Historical source claims are not re-tested.\n")
    code("import hashlib, importlib.util, json, pathlib, urllib.request\n"
         f"SOURCE_COMMIT = {source_commit!r}\n"
         f"BUILDER_SHA256 = {builder_digest!r}\n"
         f"SOURCE_LOCK = {lock!r}\n"
         "OUTPUT = pathlib.Path('/kaggle/working/academy-evidence-review') if pathlib.Path('/kaggle/working').is_dir() else pathlib.Path('academy-evidence-review-output')\n"
         "OUTPUT.mkdir(parents=True, exist_ok=True)\n"
         f"url = 'https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/' + SOURCE_COMMIT + '/{SOURCE_CODE_PATH}'\n"
         "with urllib.request.urlopen(url, timeout=30) as response:\n    builder_bytes = response.read(1000000)\n"
         "assert hashlib.sha256(builder_bytes).hexdigest() == BUILDER_SHA256, 'Generator digest mismatch'\n"
         "builder_path = OUTPUT / 'academy_review_assets.py'\n"
         "builder_path.write_bytes(builder_bytes)\n"
         "spec = importlib.util.spec_from_file_location('academy_review_assets', builder_path)\n"
         "builder = importlib.util.module_from_spec(spec)\nspec.loader.exec_module(builder)\n")
    code("sources = builder.checked_sources(SOURCE_LOCK)\n"
         "rows, integrity_review, dataset_card = builder.build_assets(SOURCE_LOCK, sources)\n"
         "builder.write_assets(OUTPUT, SOURCE_LOCK, rows, integrity_review, dataset_card)\n"
         "print(json.dumps(integrity_review, indent=2))\n")
    code("from datetime import datetime, timezone\n"
         "RUN_AS_OF = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')\n"
         "eval_card, ledger = builder.evaluation_card(SOURCE_LOCK, sources, as_of=RUN_AS_OF, generator_sha256=BUILDER_SHA256, source_commit=SOURCE_COMMIT)\n"
         "card_bytes = builder.json_bytes(eval_card)\n"
         "(OUTPUT / 'integrity-evaluation-card.json').write_bytes(card_bytes)\n"
         "(OUTPUT / 'integrity-ledger.jsonl').write_bytes(ledger)\n"
         "print(json.dumps({'rule_items': 7, 'model_items': 0, 'held_out_items': 0, 'measurement': 'source byte integrity only'}))\n")
    if reporter is not None:
        markdown("## Retained-evidence learning review\n\nThe report uses the existing evaluation-card validator and learning-review renderer. It receives an empty event array: there are no learner responses or human-review observations in this run. It reports human calibration and learning outcomes as **NOT_ESTABLISHED**. The runtime must already provide Python 3.10+ and jsonschema 4.x; its actual version is recorded.\n")
        code("import importlib.metadata, platform\n"
             f"REPORTER_MANIFEST = {reporter!r}\n"
             "JSONSCHEMA_VERSION = importlib.metadata.version('jsonschema')\n"
             "assert JSONSCHEMA_VERSION.split('.')[0] == '4', 'Replay requires the preinstalled jsonschema 4.x validator'\n"
             "MODULE_ROOT = OUTPUT / 'source'\n"
             "for name, expected in REPORTER_MANIFEST.items():\n"
             "    source_url = 'https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/' + SOURCE_COMMIT + '/' + name\n"
             "    with urllib.request.urlopen(source_url, timeout=30) as response:\n"
             "        raw = response.read(1000001)\n"
             "    assert len(raw) == expected['bytes'] and hashlib.sha256(raw).hexdigest() == expected['sha256'], 'Reporter dependency digest mismatch: ' + name\n"
             "    destination = MODULE_ROOT / name\n"
             "    destination.parent.mkdir(parents=True, exist_ok=True)\n"
             "    destination.write_bytes(raw)\n"
             "reporter_path = MODULE_ROOT / 'packages/evidence-fabric/render/learning_review_report.py'\n"
             "spec = importlib.util.spec_from_file_location('academy_learning_review', reporter_path)\n"
             "reporter = importlib.util.module_from_spec(spec)\n"
             "spec.loader.exec_module(reporter)\n"
             f"learning_review = reporter.build_report(card_bytes, b'[]', as_of=RUN_AS_OF, ai_tools={AI_DISCLOSURES!r})\n"
             "assert learning_review['calibration']['human_calibration'] == 'NOT_ESTABLISHED'\n"
             "assert learning_review['denominators']['raw_events'] == 0\n"
             "(OUTPUT / 'learning-review.json').write_bytes(builder.json_bytes(learning_review))\n"
             "(OUTPUT / 'learning-review.md').write_text(learning_review['markdown'], encoding='utf-8')\n"
             "(OUTPUT / 'reporter-source-lock.json').write_bytes(builder.json_bytes(REPORTER_MANIFEST))\n"
             "(OUTPUT / 'runtime.json').write_bytes(builder.json_bytes({'python': platform.python_version(), 'jsonschema': JSONSCHEMA_VERSION}))\n"
             "print(learning_review['markdown'])\n")
    code("receipt = {'source_commit': SOURCE_COMMIT, 'generator_sha256': BUILDER_SHA256, 'source_revision': builder.SOURCE_REVISION, 'lesson_rows': len(rows), 'source_files_verified': len(sources), 'human_responses_used': 0, 'model_inference_calls': 0, 'training_authority': False, 'execution_authority': False, 'files_sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(OUTPUT.iterdir()) if p.is_file() and p.name != 'replay-receipt.json'}}\n"
         "(OUTPUT / 'replay-receipt.json').write_text(json.dumps(receipt, indent=2) + '\\n')\nprint(json.dumps(receipt, indent=2))\n")
    markdown("## Interpretation\n\nA successful replay establishes that these derived rows came from the pinned public bytes. Review the extracted section gaps and historical dates before selecting a lesson. Human reviewer calibration, learning gain, source truth and action approval require separately recorded evidence.\n")
    return {"cells": cells, "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}, "language_info": {"name": "python"}}, "nbformat": 4, "nbformat_minor": 5}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lock", type=Path, required=True)
    parser.add_argument("--source-dir", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--notebook-source-commit")
    parser.add_argument("--as-of", help="Timezone-qualified time of this integrity run; emits an evaluation card and item ledger")
    args = parser.parse_args()
    lock = json.loads(args.lock.read_text(encoding="utf-8"))
    sources = checked_sources(lock, args.source_dir)
    rows, review, card = build_assets(lock, sources)
    write_assets(args.out, lock, rows, review, card)
    if args.as_of:
        eval_card, ledger = evaluation_card(lock, sources, as_of=args.as_of,
                                           generator_sha256=sha256(Path(__file__).read_bytes()),
                                           source_commit=args.notebook_source_commit)
        (args.out / "integrity-evaluation-card.json").write_bytes(json_bytes(eval_card))
        (args.out / "integrity-ledger.jsonl").write_bytes(ledger)
    if args.notebook_source_commit:
        manifest = reporter_manifest(Path(__file__).resolve().parents[2])
        document = notebook(args.notebook_source_commit, lock, sha256(Path(__file__).read_bytes()), manifest)
        (args.out / "academy-evidence-review.ipynb").write_bytes(json_bytes(document))
    print(json.dumps({"source_files_verified": len(sources), "lesson_rows": len(rows), "human_responses_used": 0, "model_inference_calls": 0}))


if __name__ == "__main__":
    main()
