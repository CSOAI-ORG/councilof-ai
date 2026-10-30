#!/usr/bin/env python3
"""Third-party evaluation results → `EvaluationResult/v1` — Measure — 25 Oct 2026

Converts published third-party evaluation results into the `EvaluationResult/v1`
predicate, and — just as importantly — records which required pins a publisher
does **not** publish.

The converter is **fail-closed on pins**. A predicate needs six things the
schema requires:

    harness.name  harness.version  harness.commit  items.n  items.digest
    result.metric  result.aggregation  result.value

If a publisher does not publish one of them, the converter does **not** invent
it and does **not** emit a half-attestation that would pass a schema check by
accident. It emits a **candidate** with `pins_missing` naming exactly what is
absent, and `attestable: false`. A truncated commit is treated as absent: the
predicate says a prefix is not an identifier, so the converter *resolves* the
prefix against the declared harness repository and verifies the resolution
matches, and only then uses the full 40-hex.

What this produces is two numbers and one list:

  * `n_valid`   — candidates that carry every required pin and validate
  * `n_candidates` — candidates examined
  * `gaps`      — per publisher, which pins are missing and how often

The gaps are the finding. A publisher whose results are not attestable does not
have a problem with cryptography; it has a problem with *publishing*. This
file turns that into a list somebody can act on.

Usage:
    python3 packages/eval-ci/convert_third_party.py \
        --sources packages/eval-ci/third_party.sources.json \
        --out packages/eval-ci/third_party
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent.parent
UA = {"User-Agent": "csoai-third-party-converter/0.1 (one frozen source revision per record)"}

SCHEMA_VERSION = "councilof.ai/evaluation-result/1"
PREDICATE_TYPE = "https://councilof.ai/attestations/evaluation-result/v1"

# Metrics that are means of 0/1 indicators. Only these may carry a Wilson
# interval: the predicate gates the interval on the estimand, not on the metric
# name, and a proportion interval does not describe a mean of arbitrary values.
PROPORTION_METRICS = {"acc", "exact_match", "acc_norm", "exact_match_norm", "pass_at_1"}

COMMIT_RE = re.compile(r"^[0-9a-f]{40}$")
DIGEST_RE = re.compile(r"^[0-9a-f]{64}$")


# ---------------------------------------------------------------- utilities


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _canon(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _http(url: str, timeout: int = 60) -> tuple[bytes, str]:
    """Fetch bytes. Returns (raw, sha256). Raises on any failure."""
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
    return raw, _sha256(raw)


def _get_json(url: str, timeout: int = 60) -> tuple[Any, str]:
    raw, digest = _http(url, timeout)
    return json.loads(raw.decode("utf-8")), digest


# ------------------------------------------------------------ commit pinning


def resolve_commit(repo: str, prefix: str, timeout: int = 45) -> tuple[str | None, str]:
    """Resolve a truncated commit prefix to a full 40-hex sha.

    The predicate rejects truncated pins, so the source's 8-hex `git_hash` is
    not usable as-is. It IS resolvable: the harness repository is public and a
    short sha is an unambiguous abbreviation of exactly one commit. The
    resolution is verified - the resolved sha must start with the prefix - and
    only a verified resolution is used.

    Returns (full_sha | None, reason).
    """
    if COMMIT_RE.match(prefix or ""):
        return prefix, "already full"
    if not re.match(r"^[0-9a-f]{7,39}$", prefix or ""):
        return None, f"prefix {prefix!r} is not a hex sha"
    url = f"https://api.github.com/repos/{repo}/commits/{prefix}"
    try:
        doc, _ = _get_json(url, timeout)
    except Exception as exc:  # network, rate limit, unknown prefix
        return None, f"could not resolve {prefix!r}: {type(exc).__name__}"
    sha = doc.get("sha") if isinstance(doc, dict) else None
    if not isinstance(sha, str) or not COMMIT_RE.match(sha):
        return None, f"resolution for {prefix!r} returned no 40-hex sha"
    if not sha.startswith(prefix):
        return None, f"resolved sha {sha} does not start with prefix {prefix}"
    return sha, "resolved from prefix and verified against it"


def harness_version_at(repo: str, commit: str, timeout: int = 45) -> tuple[str | None, str]:
    """Read the harness's own version at a pinned commit.

    The version is read from the repository *at that exact commit*, so it
    describes the code the commit names. Returns (version | None, reason).
    """
    for path in ("pyproject.toml", "setup.py"):
        url = f"https://raw.githubusercontent.com/{repo}/{commit}/{path}"
        try:
            raw, _ = _http(url, timeout)
        except Exception:
            continue
        text = raw.decode("utf-8", "replace")
        m = re.search(r'^\s*version\s*=\s*["\']([^"\']+)["\']', text, re.M)
        if m:
            return m.group(1), f"{path} at {commit}"
    return None, "no version field found at the pinned commit"


# ------------------------------------------------------------- the interval


def wilson(successes: float, n: int, z: float = 1.959963984540054) -> tuple[float, float]:
    """Wilson score interval for a 0/1 proportion. 95% by default."""
    if n <= 0:
        raise ValueError("wilson needs n > 0")
    p = successes / n
    denom = 1.0 + z * z / n
    centre = p + z * z / (2 * n)
    margin = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    low = (centre - margin) / denom
    high = (centre + margin) / denom
    return max(0.0, low), min(1.0, high)


# ------------------------------------------------------------- the converter


class Candidate:
    """One third-party result, converted, with its pins accounted for."""

    def __init__(self, publisher: str, source_url: str, source_sha256: str, result_id: str):
        self.publisher = publisher
        self.source_url = source_url
        self.source_sha256 = source_sha256
        self.result_id = result_id
        self.pins_missing: list[str] = []
        self.predicate: dict | None = None
        self.direction: str | None = None
        self.subject: str | None = None
        self.metric: str | None = None
        self.value: float | None = None
        self.n: int | None = None

    def record(self) -> dict:
        return {
            "publisher": self.publisher,
            "source_url": self.source_url,
            "source_sha256": self.source_sha256,
            "result_id": self.result_id,
            "attestable": self.predicate is not None,
            "pins_missing": self.pins_missing,
            "subject": self.subject,
            "metric": self.metric,
            "value": self.value,
            "n": self.n,
            "direction": self.direction,
            "predicate": self.predicate,
        }


def _lm_eval_candidates(doc: dict, publisher: str, url: str, digest: str,
                         harness: dict, resolve) -> list[Candidate]:
    """Convert one lm-evaluation-harness results file.

    lm-eval's output carries a dataset sha256 per task (`task_hashes`), the
    number of instances actually scored (`n-samples`), the metric direction
    (`higher_is_better`), and a **truncated** `git_hash`. Everything the
    predicate needs is here except the full commit and the harness version,
    and both of those are resolvable from the harness repository.
    """
    out: list[Candidate] = []
    prefix = str(doc.get("git_hash") or "")
    commit, commit_reason = resolve(harness["repo"], prefix)
    version, version_reason = (None, "commit unresolved")
    if commit:
        version, version_reason = harness_version_at(harness["repo"], commit)

    config = doc.get("config") or {}
    config_sha = _sha256(_canon(config))
    results = doc.get("results") or {}
    samples = doc.get("n-samples") or {}
    hashes = doc.get("task_hashes") or {}
    direction_map = doc.get("higher_is_better") or {}
    task_versions = doc.get("versions") or {}
    date = doc.get("date")
    evaluated_at = (datetime.fromtimestamp(float(date), timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
                    if isinstance(date, (int, float)) else None)

    for task in sorted(results):
        task_res = results.get(task) or {}
        # Only the unfiltered ("none") metric of a task is converted. A filtered
        # metric is a different estimand over the same items and is not silently
        # merged into the same record.
        metrics = {k.split(",")[0]: v for k, v in task_res.items()
                   if isinstance(k, str) and "," in k and k.split(",")[1] == "none"
                   and not k.split(",")[0].endswith("_stderr")}
        if not metrics:
            continue
        for metric, value in sorted(metrics.items()):
            if not isinstance(value, (int, float)):
                continue
            cand = Candidate(publisher, url, digest, f"{task}::{metric}")
            cand.subject = f"{doc.get('model_name') or 'unknown-model'} on {task}"
            cand.metric = metric
            cand.value = float(value)

            ns = samples.get(task) or {}
            n_effective = ns.get("effective")
            n_original = ns.get("original")
            cand.n = n_effective if isinstance(n_effective, int) else None

            # --- the pin gate -------------------------------------------------
            if not commit:
                cand.pins_missing.append("harness.commit")
            if not version:
                cand.pins_missing.append("harness.version")
            if not isinstance(n_effective, int) or n_effective < 1:
                cand.pins_missing.append("items.n")
            item_digest = hashes.get(task)
            if not (isinstance(item_digest, str) and DIGEST_RE.match(item_digest)):
                item_digest = None
                cand.pins_missing.append("items.digest")
            if not evaluated_at:
                cand.pins_missing.append("evaluatedAt")
            if cand.pins_missing:
                out.append(cand)
                continue

            # --- direction ----------------------------------------------------
            higher = (direction_map.get(task) or {}).get(metric)
            cand.direction = "maximize" if higher is True else ("minimize" if higher is False else None)

            # --- the predicate -------------------------------------------------
            result: dict = {
                "metric": metric,
                "aggregation": "mean",
                "value": float(value),
                "grading": "deterministic",
            }
            # The interval gate: a Wilson interval is admissible only for a 0/1
            # proportion under a mean aggregation, and only with enough
            # instances for the interval to mean anything.
            if metric in PROPORTION_METRICS and n_effective >= 2:
                low, high = wilson(float(value) * n_effective, n_effective)
                result["interval"] = {
                    "kind": "wilson", "low": low, "high": high, "confidence": 0.95,
                }

            items_source = f"{url}#{task}"
            version_note = f" dataset version {task_versions[task]}" if task in task_versions else ""
            subsample = ""
            if isinstance(n_original, int) and n_original != n_effective:
                subsample = (f" The item set was subsampled: {n_effective} of {n_original} "
                             f"instances were scored.")

            predicate = {
                "schemaVersion": SCHEMA_VERSION,
                "evaluatedAt": evaluated_at,
                "harness": {
                    "name": harness["name"],
                    "version": version,
                    "commit": commit,
                    "config_sha256": config_sha,
                },
                "items": {
                    "n": n_effective,
                    "digest": item_digest,
                    "source": items_source,
                },
                "result": result,
                "establishes": [
                    f"{harness['name']} at commit {commit}, over these {n_effective} items "
                    f"(digest {item_digest}), scored {float(value)} on metric {metric} "
                    f"under aggregation mean.{version_note}{subsample}",
                ],
                "doesNotEstablish": [
                    "That the system scores this value on any other item set.",
                    "That the item set was sequestered from the system under test; the "
                    "publisher does not state it, and silence is not a clean bill.",
                    "That the item set is free of training contamination; the publisher "
                    "does not state it.",
                    "A ranking against any other system.",
                ],
            }
            cand.predicate = predicate
            cand.pins_missing = []
            out.append(cand)
    return out


# ------------------------------------------------------------ source readers


def read_hf_dataset(source: dict, resolve) -> list[Candidate]:
    """Every lm-eval results file in a Hugging Face dataset."""
    repo = source["repo"]
    list_url = (f"https://huggingface.co/api/datasets/{repo}/tree/main?recursive=1"
                f"&expand=false")
    tree, _ = _get_json(list_url)
    pattern = re.compile(source.get("match", r"/results_[^/]+\.json$"))
    prefix = source.get("path_prefix", "")
    files = [i["path"] for i in tree
             if i.get("type") == "file" and pattern.search(i["path"])
             and (not prefix or i["path"].startswith(prefix))]
    files.sort()
    limit = source.get("max_files", 4)
    cands: list[Candidate] = []
    for path in files[:limit]:
        url = f"https://huggingface.co/datasets/{repo}/resolve/main/{urllib.parse.quote(path)}"
        try:
            doc, digest = _get_json(url)
        except Exception:
            continue
        cands.extend(_lm_eval_candidates(doc, source["publisher"], url, digest,
                                         source["harness"], resolve))
    return cands


def read_url_json(source: dict, resolve) -> list[Candidate]:
    """A single published results file."""
    url = source["url"]
    doc, digest = _get_json(url)
    conv = source.get("converter", "lm_eval")
    if conv == "lm_eval":
        return _lm_eval_candidates(doc, source["publisher"], url, digest,
                                   source["harness"], resolve)
    return []


def read_gcs_run(source: dict, resolve) -> list[Candidate]:
    """A HELM benchmark-output run directory.

    HELM publishes its results as immutable per-run directories in a public
    bucket. Each carries the item set (`instances.json`), the metric means
    (`stats.json`) and the run spec. It carries **no code commit**: the
    benchmark-output releases are not git tags in the HELM repository, so the
    commit that produced a run cannot be named by a publisher reading this
    file. That absence is the point of including it.
    """
    out: list[Candidate] = []
    base = source["bucket_base"].rstrip("/")
    for run in source.get("runs", []):
        prefix = f"{source['prefix']}/{run}/"
        api = (f"https://storage.googleapis.com/storage/v1/b/{source['bucket']}/o"
               f"?prefix={urllib.parse.quote(prefix, safe='')}&maxResults=40")
        try:
            listing, _ = _get_json(api)
        except Exception:
            continue
        files = {i["name"].rsplit("/", 1)[-1]: i for i in listing.get("items", [])}
        if "stats.json" not in files or "instances.json" not in files:
            continue
        stats_url = f"{base}/{prefix}stats.json"
        inst_url = f"{base}/{prefix}instances.json"
        try:
            stats, stats_sha = _get_json(stats_url)
            instances, inst_sha = _get_json(inst_url)
        except Exception:
            continue
        ids = [i.get("id") for i in instances if isinstance(i, dict) and i.get("id")]
        item_digest = _sha256(_canon(sorted(ids)))
        n = len(ids)
        cand = Candidate(source["publisher"], stats_url, stats_sha, run)
        cand.subject = f"helm run {run}"
        cand.n = n
        # The metric: HELM's stats carry one entry per metric name. exact_match
        # is the one that is a 0/1 proportion under a mean.
        for entry in stats if isinstance(stats, list) else []:
            name = (entry.get("name") or {}).get("name")
            if name != "exact_match":
                continue
            if (entry.get("name") or {}).get("perturbation"):
                continue
            value = entry.get("mean")
            if not isinstance(value, (int, float)):
                continue
            cand.metric = "exact_match"
            cand.value = float(value)
            cand.direction = "maximize"
            # HELM publishes no code commit for a benchmark-output release. The
            # item set IS digestable, so items.n and items.digest are present;
            # harness.commit and harness.version are not.
            cand.pins_missing = ["harness.commit", "harness.version"]
            out.append(cand)
            break
    return out


READERS = {
    "hf_dataset": read_hf_dataset,
    "url_json": read_url_json,
    "gcs_run": read_gcs_run,
}


# ------------------------------------------------------------------ the main


def convert_all(sources: dict, resolve) -> tuple[list[Candidate], list[dict]]:
    cands: list[Candidate] = []
    problems: list[dict] = []
    for source in sources.get("sources", []):
        reader = READERS.get(source.get("reader", ""))
        if reader is None:
            problems.append({"source": source.get("id"), "reason": "unknown reader"})
            continue
        try:
            got = reader(source, resolve)
        except Exception as exc:
            problems.append({"source": source.get("id"), "reason": f"{type(exc).__name__}: {exc}"})
            continue
        cands.extend(got)
    return cands, problems


def build_gap_ledger(cands: list[Candidate]) -> dict:
    by_pub: dict[str, dict] = {}
    for c in cands:
        row = by_pub.setdefault(c.publisher, {
            "publisher": c.publisher, "candidates": 0, "attestable": 0,
            "missing_pins": {}, "sources": [],
        })
        row["candidates"] += 1
        if c.predicate is not None:
            row["attestable"] += 1
        else:
            for pin in c.pins_missing:
                row["missing_pins"][pin] = row["missing_pins"].get(pin, 0) + 1
        if c.source_url not in row["sources"]:
            row["sources"].append(c.source_url)
    return {
        "schema": "csoai.third-party-gaps/0.1",
        "publishers": sorted(by_pub.values(), key=lambda r: r["publisher"]),
        "n_candidates": len(cands),
        "n_valid": sum(1 for c in cands if c.predicate is not None),
        "what_this_is": (
            "Which required pins each publisher of third-party evaluation results does and "
            "does not publish. A candidate is attestable only when every required pin is "
            "present and resolved; a missing pin is recorded, never invented."
        ),
        "not_a_grade": True,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--sources", default=str(HERE / "third_party.sources.json"))
    ap.add_argument("--out", default=str(HERE / "third_party"))
    args = ap.parse_args(argv)

    sources = json.loads(Path(args.sources).read_text(encoding="utf-8"))
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    def resolve(repo: str, prefix: str) -> tuple[str | None, str]:
        return resolve_commit(repo, prefix)

    cands, problems = convert_all(sources, resolve)

    with (out_dir / "candidates.jsonl").open("w", encoding="utf-8") as fh:
        for c in cands:
            fh.write(json.dumps(c.record(), sort_keys=True) + "\n")

    gaps = build_gap_ledger(cands)
    gaps["generated_at"] = _now()
    gaps["source_manifest"] = str(Path(args.sources).name)
    gaps["problems"] = problems
    (out_dir / "gaps.json").write_text(json.dumps(gaps, indent=1, sort_keys=True) + "\n")

    report = {
        "schema": "csoai.third-party-conversion-report/0.1",
        "generated_at": _now(),
        "n_candidates": len(cands),
        "n_valid": gaps["n_valid"],
        "publishers": len(gaps["publishers"]),
        "limitations": [
            "a converted record is a candidate, not an attestation: nothing here is signed",
            "a truncated commit prefix is resolved against the declared harness repository and "
            "verified against the prefix; an unresolvable prefix is treated as a missing pin",
            "the harness version is read from the harness repository at the pinned commit",
            "heldOut is absent, which means unknown and not false: no publisher in this corpus "
            "states whether its item set was sequestered from the system under test",
            "contamination is absent, which means the question was not asked",
            "the Wilson interval is computed only for metrics that are means of 0/1 indicators "
            "and only when at least two instances were scored; a metric outside that set carries "
            "no interval rather than a borrowed one",
            "an item set that was subsampled records the original and the effective count",
            "the direction of each metric is recorded outside the predicate, because "
            "EvaluationResult/v1 has no field for it; that gap is the subject of the OTel "
            "crosswalk at docs/OTEL-GENAI-EVALUATION-CROSSWALK.md",
        ],
        "not_a_grade": True,
    }
    (out_dir / "report.json").write_text(json.dumps(report, indent=1, sort_keys=True) + "\n")

    print(json.dumps({"n_candidates": len(cands), "n_valid": gaps["n_valid"],
                      "publishers": len(gaps["publishers"])}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
