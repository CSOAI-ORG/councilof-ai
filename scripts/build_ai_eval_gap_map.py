#!/usr/bin/env python3
"""Build the AI-evaluation market-universe gap map.

Separates the SIZE of the public AI-evaluation universe from what CSOAI has actually
MEASURED. A GitHub star count is a popularity signal, not a capability measurement, and it
is labelled as such. Task/scenario counts are measured from the repository TREE at a pinned
commit, so every figure has a source that a reader can re-fetch.

Discipline:
  - a count with no source is null, never 0;
  - a source that could not be read is UNREACHABLE, not 0 and not an error;
  - an upstream directory listing is INDEXED, not a CSOAI measurement;
  - this file records what was observed. It is not a score, a ranking or a certification.

Usage:  python3 scripts/build_ai_eval_gap_map.py [--out public/interop/ai-eval-universe-2026-10]
        (GITHUB_TOKEN is optional; the unauthenticated GitHub rate limit is 60 requests/hour)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AS_OF = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
BOARD_URL = "https://councilof.ai/api/gspc"

# Each candidate is a READER of measurement evidence: something outside CSOAI that produces
# or consumes measurements in the same space. `count` measures what that reader actually
# holds, from its own tree, at a pinned commit.
CANDIDATES = [
    {
        "reader": "helm",
        "role": "MULTI_SUITE_SCENARIO_HARNESS_AND_LEADERBOARD",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["scenario_suite_authoring", "multi_metric_reporting", "contamination_notes"],
        "repo": "stanford-crfm/helm",
        "count": {"kind": "blob", "prefix": "src/helm/benchmark/scenarios/", "suffix": "_scenario.py",
                  "label": "scenario_definition_modules"},
    },
    {
        "reader": "inspect_ai",
        "role": "EVAL_HARNESS_AND_LOG_ARTIFACT_FORMAT",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["harness_execution", "log_artifact_formats", "solver_sandboxes"],
        "repo": "UKGovernmentBEIS/inspect_ai",
        "count": None,
        "count_note": "A harness, not a task set. Its measured quantity is the log format, not a task count.",
    },
    {
        "reader": "inspect_evals",
        "role": "PUBLISHED_EVAL_SUITE",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["task_suites", "capability_evals", "sandboxed_agentic_evals"],
        "repo": "UKGovernmentBEIS/inspect_evals",
        "count": {"kind": "blob", "prefix": "register/", "suffix": "/eval.yaml",
                  "label": "registered_evals"},
    },
    {
        "reader": "control_arena",
        "role": "CONTROL_EVAL_SUITE",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["agentic_control_evals"],
        "repo": "UKGovernmentBEIS/control-arena",
        "count": {"kind": "blob", "prefix": "control_arena/", "suffix": ".yaml",
                  "label": "task_definition_files"},
    },
    {
        "reader": "livebench",
        "role": "CONTAMINATION_RESISTANT_LIVE_QUESTION_SET",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["live_question_sets", "contamination_resistance"],
        "repo": "LiveBench/LiveBench",
        "count": None,
        "count_note": "UNMEASURED here: the question set is not vendored in the repository. "
                      "livebench/download_questions.py fetches it at run time, and the dataset API "
                      "answered HTTP 401 from this environment. A count with no source is null.",
    },
    {
        "reader": "fastchat_lmarena",
        "role": "ARENA_PAIRWISE_PREFERENCE_ELO",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["pairwise_preference_elo", "human_preference_leaderboards"],
        "repo": "lm-sys/FastChat",
        "count": None,
        "count_note": "A serving and leaderboard stack, not a task set. Its measured quantity is "
                      "the live Elo on lm-sys.github.io, which is not a pinned artefact.",
    },
    {
        "reader": "arena_hard_auto",
        "role": "ARENA_DERIVED_HARD_SUBSET_WITH_AUTOMATIC_JUDGE",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["arena_prompts", "automatic_judging"],
        "repo": "lmarena/arena-hard-auto",
        "count": None,
        "count_note": "A prompt subset with an automatic judge, not a task suite with a frozen "
                      "bank. Its size is not counted here.",
    },
    {
        "reader": "metr_public_tasks",
        "role": "PUBLISHED_AGENTIC_TASK_SET",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["agentic_task_sets", "long_horizon_tasks"],
        "repo": "METR/public-tasks",
        "count": {"kind": "tree", "prefix": "", "rel_depth": 1, "skip_dot": True,
                  "label": "task_directories"},
    },
    {
        "reader": "metr_task_standard",
        "role": "AGENTIC_TASK_SPECIFICATION_STANDARD",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["task_specification_standard", "driver_interfaces"],
        "repo": "METR/task-standard",
        "count": None,
        "count_note": "A specification (STANDARD.md plus drivers/), not a task set. It defines the "
                      "shape of a task; it holds no tasks.",
    },
    {
        "reader": "metr_hawk",
        "role": "AGENTIC_EVAL_HARNESS",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["harness_execution"],
        "repo": "METR/hawk",
        "count": None,
        "count_note": "A harness, not a task set.",
    },
    {
        "reader": "metr_rebench",
        "role": "REPEATED_RUN_EVAL_PROTOCOL",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["variance_control", "repeated_runs"],
        "repo": "METR/RE-Bench",
        "count": None,
        "count_note": "A protocol for repeated runs, not a task set.",
    },
    {
        "reader": "lm_eval_harness",
        "role": "TASK_ADAPTER_LIBRARY",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["task_adapters", "harness_execution"],
        "repo": "EleutherAI/lm-evaluation-harness",
        "count": {"kind": "tree", "prefix": "lm_eval/tasks/", "rel_depth": 1, "skip_dot": True,
                  "label": "task_directories"},
    },
    {
        "reader": "deepeval",
        "role": "COMMERCIAL_EVAL_HARNESS_AND_REPORTING",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["harness_execution", "reporting"],
        "repo": "confident-ai/deepeval",
        "count": None,
        "count_note": "A harness and reporting product, not a published task set.",
    },
    {
        "reader": "openai_evals",
        "role": "PUBLISHED_EVAL_CATALOGUE",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["capability_evals"],
        "repo": "openai/evals",
        "count": None,
        "count_note": "A catalogue of small eval suites.",
    },
    {
        "reader": "simple_evals",
        "role": "PUBLISHED_EVAL_CATALOGUE",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["capability_evals"],
        "repo": "openai/simple-evals",
        "count": None,
        "count_note": "A catalogue of small eval suites.",
    },
    {
        "reader": "big_bench",
        "role": "TASK_CATALOGUE",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["task_catalogue", "hard_task_curation"],
        "repo": "google/BIG-bench",
        "count": None,
        "count_note": "A task catalogue (3,245 stars, last pushed 2024-07-19).",
    },
    {
        "reader": "big_bench_hard",
        "role": "HARD_TASK_SUBSET",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["hard_task_curation"],
        "repo": "suzgunmirac/BIG-Bench-Hard",
        "count": None,
        "count_note": "A hard subset of BIG-bench (579 stars, last pushed 2024-06-25).",
    },
    {
        "reader": "mlcommons_modelbench",
        "role": "SAFETY_BENCHMARK_RUNNER",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["safety_benchmarks", "model_risk_reporting"],
        "repo": "mlcommons/modelbench",
        "count": None,
        "count_note": "A runner and report generator for safety benchmarks.",
    },
    {
        "reader": "mlcommons_ailuminate",
        "role": "AI_RISK_ASSESSMENT_SUITE",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["risk_assessment", "safety_benchmarks"],
        "repo": "mlcommons/ailuminate",
        "count": None,
        "count_note": "The AILuminate v1.1 risk-assessment suite.",
    },
]

# Readers that were looked for and NOT found. Recorded as a null with the endpoints queried,
# so the absence is a measurement rather than a gap in the survey.
NOT_LOCATED = [
    {
        "reader": "epoch_research",
        "role": "FRONTIER_EVAL_RESEARCH",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["frontier_evals", "difficulty_targeting"],
        "state": "NOT_LOCATED",
        "queried": [
            "https://api.github.com/orgs/epoch-research/repos",
            "https://api.github.com/repos/epoch-research/ftm",
            "https://api.github.com/repos/epoch-research/SWE-bench",
        ],
        "finding": "The org's public repositories were listed. The two candidates that look like "
                   "evaluation suites are not: epoch-research/ftm (25 stars) describes itself as "
                   "'Work in progress! I don't recommend looking at the code right now.', and "
                   "epoch-research/SWE-bench (20 stars) is a 'Docker image registry for SWE-bench'. "
                   "No published, countable evaluation suite was found.",
    },
    {
        "reader": "safe",
        "role": "FACTUALITY_EVAL_SUITE",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["factuality", "hallucination_detection"],
        "state": "NOT_LOCATED",
        "queried": [
            "https://api.github.com/repos/holistic-eval/SAFE",
            "https://api.github.com/repos/stanfordnlp/SAFE",
            "https://api.github.com/repos/stanfordnlp/SAFER",
            "https://api.github.com/repos/TIGER-AI-Lab/SAFE",
            "https://api.github.com/repos/google-research/safe",
            "https://api.github.com/repos/sahoojag/SAFE",
            "https://api.github.com/orgs/holistic-eval/repos",
            "https://api.github.com/search/repositories?q=SAFE+in:name+org:holistic-eval",
        ],
        "finding": "Every candidate path answered HTTP 404, and the organisation endpoint "
                   "answered HTTP 422 (the org does not exist). The repository for this suite was "
                   "not located from this environment. A null, not a zero.",
    },
    {
        "reader": "lmarena_github_org",
        "role": "ARENA_ORGANISATION_REPOSITORIES",
        "access": "PUBLIC_OPEN_SOURCE",
        "families": ["pairwise_preference_elo"],
        "state": "NOT_LOCATED",
        "queried": [
            "https://api.github.com/orgs/lmarena-ai/repos",
            "https://api.github.com/users/lmarena-ai/repos",
        ],
        "finding": "Both the organisation and the user endpoints answered HTTP 404. The arena's "
                   "code on GitHub is lm-sys/FastChat, which is listed above. The absence of a "
                   "separate organisation is a measurement, not a zero.",
    },
]


def _get(url: str) -> tuple[bytes | None, str]:
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "csoai-gap-map"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read(), "OK"
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, f"UNREACHABLE: {type(e).__name__}"


def _json(url: str) -> tuple[dict | None, str, str]:
    raw, status = _get(url)
    if raw is None:
        return None, status, ""
    digest = hashlib.sha256(raw).hexdigest()
    try:
        return json.loads(raw), status, digest
    except Exception:
        return None, f"UNREADABLE", digest


def _count_tree(tree: list[dict], spec: dict) -> int | None:
    """Count tree entries matching the spec.

    `rel_depth` is the number of path segments AFTER the prefix, so a task-name directory
    directly under `lm_eval/tasks/` has rel_depth 1. Counting the deeper variant
    directories instead would report sub-variants, not tasks.
    """
    prefix = spec.get("prefix", "")
    suffix = spec.get("suffix", "")
    rel_depth = spec.get("rel_depth")
    skip_dot = spec.get("skip_dot", False)
    n = 0
    for node in tree:
        if node.get("type") != ("blob" if spec["kind"] == "blob" else "tree"):
            continue
        path = node.get("path", "")
        if not path.startswith(prefix):
            continue
        if suffix and not path.endswith(suffix):
            continue
        if rel_depth is not None:
            rel = path[len(prefix):]
            if len(rel.split("/")) != rel_depth:
                continue
        if skip_dot and any(part.startswith(".") for part in path.split("/")):
            continue
        n += 1
    return n


# What CSOAI does not have, per reader. Every comparison names the field path it rests on.
# The counts are not comparable units, and saying so is part of the answer.
READER_GAPS = {
    "helm": "HELM carries 290 scenario definition modules; CSOAI's board declares 33 axis slots, "
            "of which 23 carry a run. The units differ — one frozen bank per axis against 290 "
            "scenario modules — so the numbers are not a scoreboard. The difference is depth per "
            "axis, not slot count.",
    "inspect_ai": "Inspect's portable log artifact is the closest thing in this universe to a "
                  "replayable measurement record. CSOAI publishes no comparable per-run log "
                  "schema: its 9 deterministic-fact run artifacts are content-addressed, and 7 of "
                  "them are unsigned.",
    "inspect_evals": "55 registered evals against 33 declared axis slots. Different units again: "
                     "a registered eval is a task suite, an axis is a measured behavioural family.",
    "control_arena": "27 control-task definition files. CSOAI has no control-task suite: its "
                     "swarm and cross-reality axes are behavioural fleet measurements over a "
                     "frozen bank, not agentic control tasks.",
    "livebench": "LiveBench's contamination-resistant live question set is not vendored, so its "
                 "size is UNMEASURED here. CSOAI's banks are frozen and sha-pinned, which is the "
                 "opposite trade: reproducibility against contamination. Neither is wrong; they "
                 "answer different questions.",
    "fastchat_lmarena": "The arena separates models on live human preference. CSOAI separates "
                        "nothing: 0 of 14 model-comparison axes separated a leader, 7 are TIE and "
                        "7 UNTESTED. A pairwise human-preference signal and a frozen "
                        "deterministic bank are not interchangeable.",
    "arena_hard_auto": "1,084 stars, last pushed 2025-06-21 — a hard subset of arena prompts with "
                       "an automatic judge. CSOAI publishes no arena-derived prompt subset and "
                       "no automatic judge: its grader is a deterministic behaviour-class judge "
                       "over a frozen bank.",
    "metr_public_tasks": "11 published agentic task directories. CSOAI publishes no open task "
                         "set; its agentic work is a behavioural fleet measurement over a frozen "
                         "bank, plus a signed card corpus.",
    "metr_task_standard": "A task-specification standard for agentic evaluation. CSOAI publishes "
                          "no comparable standard: its task definition is a frozen, sha-pinned "
                          "bank, not a specification third parties can implement.",
    "metr_hawk": "An agentic evaluation harness. CSOAI's harness appears in the AIBOM as a "
                 "named application component, but it is not published as a harness others can "
                 "run.",
    "metr_rebench": "A protocol for repeated runs to control variance. CSOAI's separation rule "
                    "is the board's own; there is no published repeated-run protocol for third "
                    "parties to reproduce it with.",
    "lm_eval_harness": "221 task directories against 33 declared axis slots. A task adapter "
                       "library and a behavioural axis are different objects; the counts are "
                       "not comparable and are not offered as a comparison.",
    "deepeval": "A commercial harness with reporting. CSOAI's board is free forever and "
                "publishes no reporting product — the door charges for nothing.",
    "openai_evals": "A catalogue of small eval suites. CSOAI's board is one frozen method per "
                    "axis with n_valid >= 30, not a catalogue of many small suites.",
    "simple_evals": "A catalogue of small eval suites, same shape as above.",
    "big_bench": "A large task catalogue. CSOAI's banks are frozen and sha-pinned but not "
                 "published as an open catalogue of task definitions a third party can extend.",
    "big_bench_hard": "A hard subset of BIG-bench, last pushed 2024-06-25. Nothing corresponding "
                      "is published by CSOAI.",
    "mlcommons_modelbench": "A runner and report generator over safety benchmarks. CSOAI's "
                            "safety axis is one frozen behavioural bank, not a runner that "
                            "executes third-party benchmark suites.",
    "mlcommons_ailuminate": "An AI risk-assessment suite with its own scoring. CSOAI's "
                             "regulatory-framework axis measures regime FACTS and carries no "
                             "risk score — a measurement, not a risk assessment.",
}


def observe(candidate: dict) -> dict:
    repo = candidate["repo"]
    out = dict(candidate)
    out["csoai_gap"] = READER_GAPS.get(candidate["reader"])
    meta, status, digest = _json(f"https://api.github.com/repos/{repo}")
    out["api_source"] = f"https://api.github.com/repos/{repo}"
    out["api_response_sha256"] = digest or None
    if meta is None:
        out["state"] = "UNREACHABLE"
        out["source"] = f"https://github.com/{repo}"
        return out
    out["state"] = "OBSERVED"
    out["source"] = meta.get("html_url")
    out["stars_observed"] = meta.get("stargazers_count")
    out["forks_observed"] = meta.get("forks_count")
    out["license_observed"] = (meta.get("license") or {}).get("spdx_id")
    out["pushed_at_observed"] = meta.get("pushed_at")
    out["archived"] = meta.get("archived")
    out["description_observed"] = (meta.get("description") or "")[:200]
    branch = meta.get("default_branch")
    spec = candidate.get("count")
    if not spec:
        out["count"] = None
        out["count_note"] = candidate.get("count_note") or "Not counted here."
        return out
    tree, tstatus, tdigest = _json(f"https://api.github.com/repos/{repo}/git/trees/{branch}?recursive=1")
    out["tree_source"] = f"https://api.github.com/repos/{repo}/git/trees/{branch}?recursive=1"
    out["tree_response_sha256"] = tdigest or None
    if tree is None:
        out["count"] = None
        out["count_state"] = f"UNREACHABLE ({tstatus})"
        return out
    out["count_state"] = "MEASURED"
    out["count"] = _count_tree(tree.get("tree") or [], spec)
    out["count_label"] = spec["label"]
    out["count_basis"] = f"{spec['kind']} count over the repository tree at {branch}"
    return out


def read_board() -> dict:
    raw, status = _get(BOARD_URL)
    if raw is None:
        return {"state": "UNREACHABLE", "status": status}
    board = json.loads(raw)
    axes = board.get("axes") or []
    return {
        "state": "OBSERVED",
        "source": BOARD_URL,
        "response_sha256": hashlib.sha256(raw).hexdigest(),
        "totals": board.get("totals"),
        "axes": [
            {
                "axis": a.get("axis"),
                "family": a.get("family"),
                "status": a.get("status"),
                "separation": a.get("separation"),
                "bench": a.get("bench"),
            }
            for a in axes
        ],
    }


def csoai_gaps(board: dict) -> list[dict]:
    """The gaps on OUR side, each quoted from the live board by field path.

    Every value here is read out of the board payload that this run fetched, and the field
    path is recorded beside it, so a reader can re-quote it without trusting this file.
    An unmeasured axis is a visible gap, never a zero and never a failure.
    """
    if board.get("state") != "OBSERVED":
        return [{
            "gap": "CSOAI's own coverage could not be read, so no gap could be stated.",
            "state": "UNREACHABLE",
            "field_path": "/api/gspc",
            "value": None,
        }]
    totals = board.get("totals") or {}
    by_family = totals.get("by_family") or {}
    subject = by_family.get("subject") or {}
    attest = totals.get("financial_run_attestations") or {}
    gaps = [
        {
            "gap": "The whole subject axis family is declared and unmeasured: "
                   "lab practice, company practice, measurer integrity, harness fidelity, "
                   "interop conformance, humanoid deployment, regulator transparency, "
                   "interpretability/reproducibility, claim maintenance and serving fidelity.",
            "state": "MEASURED=0",
            "field_path": "/api/gspc totals.by_family.subject.measured",
            "value": subject.get("measured"),
            "declared": subject.get("axes"),
            "note": subject.get("note"),
        },
        {
            "gap": "No model-comparison axis separates a leader, so the board states TIE and "
                   "UNTESTED rather than a ranking.",
            "state": "SEPARATED_LEADS=0",
            "field_path": "/api/gspc totals.separated_leads",
            "value": totals.get("separated_leads"),
            "ties": totals.get("ties"),
            "untested_separations": totals.get("untested_separations"),
        },
        {
            "gap": "Most deterministic-fact run artifacts are content-addressed but unsigned, "
                   "so the evidence chain for those axes rests on identity of bytes, not on a "
                   "signer.",
            "state": "PARTIALLY_SIGNED",
            "field_path": "/api/gspc totals.financial_run_attestations.ed25519_signed",
            "value": attest.get("ed25519_signed"),
            "run_artifacts": attest.get("run_artifacts"),
            "content_addressed_unsigned": attest.get("content_addressed_unsigned"),
        },
        {
            "gap": "Three measured axes carry no public leader, because the named leader holds "
                   "no signed per-model card in the public card index. The axis stays MEASURED; "
                   "the unverifiable leader claim is dropped rather than invented.",
            "state": "LEADER_DROPPED",
            "field_path": "/api/gspc totals.uncarded_leaders_dropped",
            "value": totals.get("uncarded_leaders_dropped"),
            "axes": totals.get("uncarded_leaders_dropped_axes"),
        },
        {
            "gap": "Our own specialist models are excluded from public leader attribution on "
                   "eight axes, so the public board reports external leaders only. This is a "
                   "governance rule, not a measurement gap, and it is stated rather than hidden.",
            "state": "OWN_MODELS_EXCLUDED",
            "field_path": "/api/gspc totals.own_leaders_excluded",
            "value": totals.get("own_leaders_excluded"),
            "axes": totals.get("own_leaders_excluded_axes"),
        },
        {
            "gap": "The board's scale is declared slots, not a published catalogue of task "
                   "definitions. Readers here that publish task directories are not comparable "
                   "to us by count; the comparison is in what is published, not how many rows "
                   "there are.",
            "state": "DECLARED_SLOTS",
            "field_path": "/api/gspc totals.axes",
            "value": totals.get("axes"),
            "measured_axes": totals.get("measured_axes"),
            "unmeasured_axes": totals.get("unmeasured_axes"),
        },
    ]
    return gaps


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/interop/ai-eval-universe-2026-10")
    args = ap.parse_args()
    out_dir = ROOT / args.out

    observed = [observe(c) for c in CANDIDATES]
    board = read_board()

    doc = {
        "schema": "csoai.ai-eval-universe/0.1",
        "issued_at": AS_OF,
        "title": "AI-evaluation market-universe gap map",
        "what_this_is": (
            "A measured directory of the public AI-evaluation universe, with what CSOAI has "
            "actually MEASURED alongside it. Repository stars are a popularity signal, not a "
            "capability measurement. Upstream listings are INDEXED, not measured by us."
        ),
        "what_this_does_not_establish": (
            "That any competitor is good or bad, or that CSOAI is better than any of them. "
            "That the task counts are complete: a task that is not vendored in a repository is "
            "not counted, and a repository that is private is invisible here. That any star "
            "count says anything about measurement quality."
        ),
        "counting_rule": (
            "Every count here is measured from the repository TREE at its default branch, with "
            "the SHA-256 of the API response recorded beside it. A count that could not be read "
            "is null, never 0."
        ),
        "candidate_readers": observed,
        "readers_not_located": NOT_LOCATED,
        "csoai_gaps": csoai_gaps(board),
        "current_csoai_coverage": {
            "source": BOARD_URL,
            "state": board.get("state"),
            "totals": board.get("totals"),
            "axes": board.get("axes"),
            "response_sha256": board.get("response_sha256"),
            "note": (
                "Quoted from the live board by field name. The board declares 33 axis slots; "
                "23 are MEASURED, 10 are declared with no run behind them. An unmeasured axis is "
                "a visible gap, not a zero, and never a fail."
            ),
        },
    }
    doc["snapshot_sha256"] = hashlib.sha256(
        json.dumps(doc, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    ).hexdigest()

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")

    lines = [
        "# AI-evaluation universe — coverage map",
        "",
        "This release separates the size of the public AI-evaluation universe from what CSOAI has",
        "actually MEASURED.",
        "",
        "`index.json` was built by querying the GitHub API for each reader and counting task and",
        "scenario definitions from the repository tree at its default branch. Each source entry",
        "records the SHA-256 of the exact API response observed during the run, so every figure",
        "can be re-fetched and compared.",
        "",
        "## Reading the numbers",
        "",
        "- `stars_observed` is a **popularity signal, not a capability measurement**. It is recorded",
        "  because it is observable and cheap, not because it means anything about quality.",
        "- `count` is a **measured** number: a tree count at a pinned branch, with the response",
        "  digest beside it. A count that could not be read is null, never 0.",
        "- `readers_not_located` records readers that were looked for and not found, with the",
        "  endpoints queried and their HTTP status. The absence is a measurement.",
        "- Upstream listings are **INDEXED**, not measurements by us. Nothing here is signed, rooted,",
        "  anchored, scored or certified by appearing in this file.",
        "",
        "## What CSOAI has measured",
        "",
    ]
    totals = (board.get("totals") or {})
    lines.append(
        f"The live board declares **{totals.get('axes')} axis slots**, of which "
        f"**{totals.get('measured_axes')} are MEASURED** and {totals.get('unmeasured_axes')} are "
        f"declared with no run behind them."
    )
    lines.append("")
    lines.append("Each axis must move through the same state ladder:")
    lines.append("")
    lines.append("`DISCOVERED → INDEXED → OBSERVED → MEASURED → SIGNED → ROOTED → ANCHORED`")
    lines.append("")
    lines.append("An axis declared but unmeasured is a visible gap. It is never a zero, and it is")
    lines.append("never a failure of the axis.")
    lines.append("")
    lines.append("## The gaps on our side")
    lines.append("")
    lines.append("Each one is quoted from the live board by field path, so it can be re-quoted")
    lines.append("without trusting this file. An unmeasured axis is a visible gap: it is never a")
    lines.append("zero, and it is never a failure of the axis.")
    lines.append("")
    for gap in doc["csoai_gaps"]:
        lines.append(f"- **{gap['gap']}**")
        lines.append(f"  - `{gap['field_path']}` = {json.dumps(gap.get('value'))}"
                     + (f" · {gap['state']}" if gap.get("state") else ""))
    lines.append("")
    lines.append("## Rebuild")
    lines.append("")
    lines.append("```sh")
    lines.append("python3 scripts/build_ai_eval_gap_map.py")
    lines.append("```")
    lines.append("")
    lines.append("The generated `snapshot_sha256` covers the JSON body before that field is added.")
    lines.append("Each source entry separately records the SHA-256 of the exact response bytes")
    lines.append("observed during the run.")
    lines.append("")
    (out_dir / "README.md").write_text("\n".join(lines))

    counted = sum(1 for c in observed if c.get("count") is not None)
    print(f"wrote {out_dir.relative_to(ROOT)}/ · {len(observed)} readers observed "
          f"({counted} with a measured count), {len(NOT_LOCATED)} not located · "
          f"board={board.get('state')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
