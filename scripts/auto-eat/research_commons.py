#!/usr/bin/env python3
"""Bounded daily PUBLIC metadata commons for the existing Council auto-EAT feed.

Only predefined GitHub repository metadata and Crossref bibliographic metadata
are fetched. No code, model weights, papers, abstracts, identities, execution
tools, tokens, private content, or paid APIs are harvested. A public repo is not
a blanket licence. This is DISCOVERY for human-approved RAS measurements, not
itself an independent grading or measurement service.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time
import tempfile
import urllib.error
import urllib.parse
import urllib.request

SCHEMA = "csoai.auto-eat.research-commons/0.1"
USER_AGENT = "CSOAI-public-metadata-commons/0.1 (mailto:contacts@csoai.org)"
ALLOW_HOSTS = frozenset({"api.github.com", "api.crossref.org"})
MAX_RESPONSE_BYTES = 350_000
MAX_PUBLIC_SNAPSHOT_BYTES = 80_000  # match CouncilOS research-commons MAX_BODY
GITHUB_WORKERS = 5
MAX_REPOS = 25
TOPIC_ROWS = 8
TOPIC_RESULTS_PER_SEARCH = 3
MAX_PAPERS = 21
TIMEOUT_SECONDS = 9
DEFAULT_OUTPUT = "public/interop/auto-eat/research-commons.json"

# Explicit inclusion = relevant to Council's existing architecture, NOT a
# relationship, endorsement, licence to redistribute source, or certification.
SOURCES = (
    ("ai-openshell/openshell", "sandbox_runtime", "DENY_ALLOW_POLICY_OBSERVATION"),
    ("NVIDIA/NeMo-Relay", "agent_middleware", "TOOL_LIFECYCLE_TELEMETRY"),
    ("NVIDIA-NeMo/Guardrails", "runtime_guardrail", "REFUSAL_FALSE_POSITIVE_CONTROLS"),
    ("langfuse/langfuse", "trace_experiment_platform", "OTEL_EXPERIMENT_SOURCE_CROSSWALK"),
    ("Arize-ai/phoenix", "trace_experiment_platform", "OTEL_LICENSE_AND_DATA_BOUNDARY"),
    ("UKGovernmentBEIS/inspect_ai", "evaluation_framework", "PINNED_TASK_SCORER_REPLAY"),
    ("microsoft/PyRIT", "red_team_framework", "BOUNDED_ADVERSARIAL_FIXTURE"),
    ("open-telemetry/semantic-conventions", "interoperability_standard", "GENAI_EVENT_FIELD_MAPPING"),
    ("OpenLineage/OpenLineage", "lineage_standard", "GSPC_DATASET_JOB_RUN_PINS"),
    ("ocsf/ocsf-schema", "security_event_standard", "SECURITY_EVENT_TYPED_CROSSWALK"),
    ("guacsec/guac", "supply_chain_graph", "SBOM_ATTESTATION_REFERENCE_GRAPH"),
    ("ossf/scorecard", "supply_chain_measurement", "SECURITY_HEALTH_SOURCE_REPLAY"),
    ("open-policy-agent/opa", "policy_engine", "AUTHORITY_SCOPE_DENY_ALLOW_TEST"),
    ("in-toto/in-toto", "provenance_framework", "SOURCE_TO_BUILD_CHAIN_REPLAY"),
    ("sigstore/cosign", "attestation_toolkit", "EXACT_BYTE_SIGNED_EVIDENCE_CHECK"),
    ("forecastingresearch/forecastbench", "temporal_forecasting", "PROSPECTIVE_BRIER_CALIBRATION"),
    ("centerforaisafety/emergent-values", "utility_engineering", "PAIRWISE_PREFERENCE_STABILITY"),
    ("Mesh-LLM/mesh-llm", "distributed_inference", "MEMORY_NETWORK_FAILURE_ISOLATION"),
    ("ml-explore/mlx", "data_local_inference", "LOCAL_VS_REMOTE_RESOURCE_COST"),
    ("UKGovernmentBEIS/inspect_evals", "agent_evaluation", "OUTCOME_VS_TOOL_ACK_CONTROL"),
    ("open-quantum-safe/liboqs", "crypto_agility", "HYBRID_SIGNATURE_DOWNGRADE_CONTROL"),
    ("w3c/coga", "cognitive_accessibility", "HUMAN_COMPREHENSION_TASK_REPLAY"),
    ("modelcontextprotocol/registry", "permissionless_discovery", "REGISTRY_REVISION_AND_CURSOR_REPLAY"),
    ("a2aproject/A2A", "agent_interop", "DELEGATION_AND_RECEIVER_EFFECT_CONTROL"),
    ("CrowdStrike/falconpy", "commercial_sdk", "TENANT_AUTHORISED_READONLY_ADAPTER"),
)
TOPICS = (
    "AI agent evaluation reproducibility",
    "AI safety benchmark calibration",
    "autonomous agent runtime authorization",
    "language model forecasting temporal leakage calibration",
    "language model utility preference stability",
    "agent safety interaction effects factorial evaluation",
    "distributed inference data locality memory bandwidth",
)
assert len(SOURCES) <= MAX_REPOS

TOPIC_RULES = {
    TOPICS[0]: (r"\bagents?\b|\bmulti.agent\b", r"evaluat|reproduc|benchmark"),
    TOPICS[1]: (r"\bai\b|artificial intelligence|\bllm\b|\bmodel", r"\bsafety\b|\bassurance\b|\bharm\b", r"benchmark|calibrat|evaluat"),
    TOPICS[2]: (r"\bagents?\b|autonom", r"authoriz|permission|access control|governance|policy|security"),
    TOPICS[3]: (r"forecast|predict", r"temporal|calibrat|leakage|time.series", r"model|agent|AI"),
    TOPICS[4]: (r"language model|LLM|agent", r"utility|preference|value", r"stabil|consisten|align|engineer"),
    TOPICS[5]: (r"agent|language model|LLM", r"safety|robust|failure", r"interact|factorial|compos|joint"),
    TOPICS[6]: (r"inference|language model|LLM", r"distributed|locality|memory|bandwidth"),
}

REPO_ID = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
SHA40 = re.compile(r"^[0-9a-f]{40}$")
DOI = re.compile(r"^10\.\d{4,9}/[^\s<>]{1,220}$", re.I)


class Uncheckable(ValueError):
    pass


def canonical(data: object) -> bytes:
    return json.dumps(data, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False, allow_nan=False).encode("utf-8")


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def utc(text: str) -> datetime:
    if not isinstance(text, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?Z", text
    ):
        raise Uncheckable("EXPLICIT_UTC_REQUIRED")
    try:
        return datetime.fromisoformat(text[:-1] + "+00:00")
    except ValueError as exc:
        raise Uncheckable("INVALID_UTC_CLOCK") from exc


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def allow_url(url: str) -> None:
    if not isinstance(url, str) or len(url) > 1800:
        raise Uncheckable("URL_INVALID")
    p = urllib.parse.urlsplit(url)
    if (p.scheme != "https" or p.hostname not in ALLOW_HOSTS
            or p.port is not None or p.username or p.password or p.fragment):
        raise Uncheckable("URL_SOURCE_NOT_ALLOWLISTED")
    if p.hostname == "api.github.com" and not (
        p.path.startswith("/repos/") and ".." not in p.path and
        re.fullmatch(r"/repos/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:/commits)?", p.path)
    ):
        raise Uncheckable("GITHUB_URL_PATH_NOT_ALLOWLISTED")
    if p.hostname == "api.crossref.org" and p.path != "/works":
        raise Uncheckable("CROSSREF_URL_PATH_NOT_ALLOWLISTED")


def fetch_json(url: str, *, token: str | None = None,
               opener=None) -> dict | list:
    """Bounded, fixed-origin read; never follow redirects to arbitrary hosts."""
    allow_url(url)
    parsed = urllib.parse.urlsplit(url)
    headers = {"Accept": "application/vnd.github+json" if parsed.hostname == "api.github.com"
               else "application/json",
               "User-Agent": USER_AGENT}
    if token and parsed.hostname == "api.github.com":
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, headers=headers, method="GET")
    opener = opener or urllib.request.build_opener(NoRedirect())
    try:
        with opener.open(req, timeout=TIMEOUT_SECONDS) as response:
            status = response.status
            if status != 200:
                raise Uncheckable("SOURCE_HTTP_" + str(status))
            length = response.headers.get("Content-Length")
            if length is not None and int(length) > MAX_RESPONSE_BYTES:
                raise Uncheckable("SOURCE_PAYLOAD_TOO_LARGE")
            raw = response.read(MAX_RESPONSE_BYTES + 1)
    except urllib.error.HTTPError as exc:
        if exc.code in (301, 302, 303, 307, 308):
            raise Uncheckable("SOURCE_REDIRECT_HELD") from exc
        raise Uncheckable("SOURCE_HTTP_" + str(exc.code)) from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise Uncheckable("SOURCE_UNREACHABLE") from exc
    if len(raw) > MAX_RESPONSE_BYTES:
        raise Uncheckable("SOURCE_PAYLOAD_TOO_LARGE")
    try:
        result = json.loads(raw)
    except (UnicodeError, ValueError) as exc:
        raise Uncheckable("SOURCE_INVALID_JSON") from exc
    if not isinstance(result, (dict, list)):
        raise Uncheckable("SOURCE_SHAPE_INVALID")
    return result


def safe_text(raw: object, max_chars=240) -> str | None:
    if not isinstance(raw, str):
        return None
    # Whitelist only presentational characters; no HTML/script fragments.
    val = re.sub(r"\s+", " ", raw.replace("<", "").replace(">", "")).strip()
    return val[:max_chars] if val else None


def github_source(src: tuple[str, str, str], *, token=None,
                  fetch=fetch_json) -> dict:
    slug, kind, experiment = src
    if not REPO_ID.fullmatch(slug) or any(part in (".", "..") for part in slug.split("/")):
        raise Uncheckable("INVALID_STATIC_REPOSITORY")
    base = "https://api.github.com/repos/" + slug
    try:
        doc = fetch(base, token=token)
        if not isinstance(doc, dict) or doc.get("full_name", "").lower() != slug.lower():
            raise Uncheckable("GITHUB_REPO_ID_MISMATCH")
        if doc.get("private") is not False:
            raise Uncheckable("GITHUB_PUBLIC_VISIBILITY_UNCHECKABLE")
        source_metadata_digest = sha(canonical(doc))
        repo_id = doc.get("id")
        if isinstance(repo_id, bool) or not isinstance(repo_id, int):
            raise Uncheckable("GITHUB_REPOSITORY_ID_INVALID")
        license_doc = doc.get("license")
        licence = (license_doc.get("spdx_id") if isinstance(license_doc, dict) else None)
        if not isinstance(licence, str) or len(licence) > 100 or licence in ("NOASSERTION", "NONE"):
            licence = None
        commit_list = fetch(base + "/commits?per_page=1", token=token)
        if not isinstance(commit_list, list) or not commit_list:
            raise Uncheckable("GITHUB_COMMIT_UNCHECKABLE")
        commit_metadata_digest = sha(canonical(commit_list))
        head = commit_list[0].get("sha") if isinstance(commit_list[0], dict) else None
        if not isinstance(head, str) or not SHA40.fullmatch(head):
            raise Uncheckable("GITHUB_HEAD_SHA_UNCHECKABLE")
        return {
            "source": "github_public_api", "repository": slug, "project_role": kind,
            "candidate_experiment": experiment, "status": "SOURCE_METADATA_OBSERVED",
            "repository_id": repo_id, "head_sha": head,
            "repository_metadata_canonical_sha256": source_metadata_digest,
            "commit_metadata_canonical_sha256": commit_metadata_digest,
            "pushed_at_source_declared": safe_text(doc.get("pushed_at"), 35),
            "archived_source_declared": doc.get("archived") if type(doc.get("archived")) is bool else None,
            "license_spdx_source_declared": licence,
            "license_review": "REQUIRED_FOR_CODE_DATA_MODEL_WEIGHTS_AND_DEPENDENCIES",
            "source_link": "https://github.com/" + slug,
            "human_review": "UNASSIGNED",
            "independent_verification": "NOT_PERFORMED",
            "ras_measurement_permission": "NOT_GRANTED",
        }
    except (Uncheckable, TypeError, ValueError, KeyError) as exc:
        return {
            "source": "github_public_api", "repository": slug, "project_role": kind,
            "candidate_experiment": experiment, "status": "SOURCE_UNCHECKABLE",
            "reason": str(exc)[:75],
            "license_review": "REQUIRED",
            "human_review": "UNASSIGNED",
            "independent_verification": "NOT_PERFORMED",
            "ras_measurement_permission": "NOT_GRANTED",
        }


def title_relevant(topic: str, title: str) -> bool:
    """Conservative, documented title keyword check. Not scientific review."""
    if topic not in TOPIC_RULES or not isinstance(title, str):
        return False
    return all(re.search(pat, title, re.I) is not None for pat in TOPIC_RULES[topic])


def crossref_topic(topic: str, *, from_date: str, fetch=fetch_json) -> dict:
    query = urllib.parse.urlencode({
        "query.bibliographic": topic,
        "filter": "from-index-date:" + from_date,
        "rows": str(TOPIC_ROWS),
        "select": "DOI,title,URL,indexed,published,type",
        "mailto": "contacts@csoai.org",
    })
    try:
        doc = fetch("https://api.crossref.org/works?" + query)
        rows = (doc.get("message") or {}).get("items") if isinstance(doc, dict) else None
        if not isinstance(rows, list) or len(rows) > TOPIC_ROWS:
            raise Uncheckable("CROSSREF_ITEMS_INVALID")
        papers = []
        seen = set()
        for row in rows:
            if not isinstance(row, dict):
                raise Uncheckable("CROSSREF_ITEM_INVALID")
            doi = row.get("DOI")
            titles = row.get("title")
            if not isinstance(doi, str) or not DOI.fullmatch(doi):
                continue
            title = safe_text(titles[0] if isinstance(titles, list) and titles else None)
            if not title or not title_relevant(topic, title) or doi.lower() in seen:
                continue
            seen.add(doi.lower())
            published = row.get("published", {})
            indexed = row.get("indexed", {})
            papers.append({
                "title_relevance": "HEURISTIC_KEYWORD_MATCH_NOT_SCIENTIFIC_JUDGEMENT",
                "doi": doi, "title_metadata": title, "doi_url": "https://doi.org/" + doi,
                "crossref_published_date_parts": (published.get("date-parts", [None])[0]
                                                  if isinstance(published, dict) else None),
                "crossref_indexed_at_source_declared": (indexed.get("date-time")
                                                        if isinstance(indexed, dict) else None),
                "full_text_copied": False,
                "full_text_rights": "NOT_ESTABLISHED",
                "reproducibility_status": "NOT_TESTED",
                "human_review": "UNASSIGNED",
            })
            if len(papers) >= TOPIC_RESULTS_PER_SEARCH:
                break
        return {"topic": topic, "status": "SOURCE_METADATA_OBSERVED",
                "source_response_canonical_sha256": sha(canonical(doc)),
                "papers": papers, "recently_indexed_not_necessarily_newly_published": True,
                "coverage": "TOP_8_API_SEARCH_MATCHES_ONLY_NOT_EXHAUSTIVE",
                "candidate_selection": "TWO_PART_TITLE_KEYWORD_HEURISTIC_REVIEW_REQUIRED"}
    except (Uncheckable, TypeError, ValueError, KeyError) as exc:
        return {"topic": topic, "status": "SOURCE_UNCHECKABLE",
                "reason": str(exc)[:75], "papers": [],
                "recently_indexed_not_necessarily_newly_published": True}


def summarize(previous: dict | None, observed: list[dict],
              topics: list[dict], when: datetime, *, registry: tuple = SOURCES) -> dict:
    if when.tzinfo is None or when.utcoffset() is None or when.utcoffset().total_seconds() != 0:
        raise Uncheckable("CLOCK_NOT_UTC")
    if len(registry) > MAX_REPOS or len(observed) != len(registry) or len(topics) != len(TOPICS):
        raise Uncheckable("COLLECTION_COVERAGE_INVALID")
    obs = [r for r in observed if r.get("status") == "SOURCE_METADATA_OBSERVED"]
    uncheckable = len(observed) - len(obs)
    before = {}
    if isinstance(previous, dict) and previous.get("schema") == SCHEMA:
        for record in previous.get("repositories", []):
            if isinstance(record, dict) and record.get("status") == "SOURCE_METADATA_OBSERVED":
                before[record.get("repository")] = record.get("head_sha")
    changes = []
    for r in obs:
        prior = before.get(r["repository"])
        now_head = r["head_sha"]
        if (isinstance(prior, str) and SHA40.fullmatch(prior) and prior != now_head):
            changes.append({
                "repository": r["repository"], "old_head_sha": prior, "new_head_sha": now_head,
                "meaning": "SOURCE_REPOSITORY_REVISION_CHANGED_NOT_A_SECURITY_OR_SAFETY_FINDING",
                "review": "HUMAN_METHOD_AND_LICENSE_REVIEW_REQUIRED",
                "action_executed": False,
            })
    papers = sum(len(row["papers"]) for row in topics)
    return {
        "schema": SCHEMA,
        "observed_at": iso(when),
        "publication_state": "RESEARCH_DISCOVERY_ONLY_UNSIGNED",
        "catalog_scope": "FIXED_ALLOWLIST_SOURCE_METADATA_ONLY",
        "registry_sha256": sha(canonical(registry)),
        "repositories_checked": len(observed),
        "repositories_observed": len(obs),
        "repositories_uncheckable": uncheckable,
        "repository_status": "PARTIAL" if uncheckable else "FULL_SOURCE_METADATA_READBACK",
        "repositories": observed,
        "crossref_topics_checked": len(topics),
        "crossref_topics_observed": sum(t["status"] == "SOURCE_METADATA_OBSERVED" for t in topics),
        "crossref_candidate_metadata_rows": papers,
        "crossref_topics": topics,
        "changed_source_revisions_observed": changes,
        "changed_source_revision_count": len(changes),
        "estimated_source_coverage": "ALLOWLIST_ONLY_NOT_GLOBAL_ECOSYSTEM",
        "paper_full_text_copied": False,
        "third_party_code_copied": False,
        "model_weights_copied": False,
        "incident_records_copied": False,
        "machine_training_from_sources_performed": False,
        "paper_reproducibility_assessed": False,
        "vendor_endorsement_claimed": False,
        "gspc_measurement_or_board_written": False,
        "human_authority_issued": False,
        "external_executor_invoked": False,
        "receiving_party_effect_verified": False,
        "ras_paid_request_executed": False,
        "ras_candidate_state": "FREE_RESEARCH_INDEX_ONLY_HUMAN_REVIEW_BEFORE_ANY_FRESH_MEASUREMENT",
        "independent_verifier_state": "NOT_APPOINTED_OR_VERIFIED",
        "safety_note": ("Discovery is not evaluation, licensing clearance, training authorisation, independent "
                        "verification, compliance, source-code ownership or permission to perform an effect."),
    }


def collect(previous: dict | None, *, now: datetime,
            fetch=fetch_json, sources: tuple = SOURCES, topics: tuple = TOPICS,
            token: str | None = None) -> dict:
    if len(sources) > MAX_REPOS or len(topics) != len(TOPICS):
        raise Uncheckable("FIXED_COLLECTION_BUDGET_EXCEEDED")
    future = []
    with ThreadPoolExecutor(max_workers=GITHUB_WORKERS) as pool:
        for src in sources:
            future.append(pool.submit(github_source, src, token=token, fetch=fetch))
        observed = [f.result() for f in future]
    from_date = (now.date() - timedelta(days=14)).isoformat()
    studies = []
    for idx, topic in enumerate(topics):
        # Polite public API pacing; only the real network path sleeps.
        if idx and fetch is fetch_json:
            time.sleep(1.5)
        studies.append(crossref_topic(topic, from_date=from_date, fetch=fetch))
    return summarize(previous, observed, studies, now, registry=sources)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path(DEFAULT_OUTPUT))
    parser.add_argument("--min-hours", type=int, default=20)
    parser.add_argument("--force", action="store_true",
                        help="Explicit source readback, bounded public API requests only")
    parser.add_argument("--offline", action="store_true",
                        help="Print only prior locally retained summary, no network")
    args = parser.parse_args(argv)
    try:
        if not 0 <= args.min_hours <= 168:
            raise Uncheckable("INVALID_CADENCE")
        if args.out.is_symlink():
            raise Uncheckable("OUTPUT_SYMLINK_REFUSED")
        now = datetime.now(timezone.utc)
        previous = None
        if args.out.exists():
            if args.out.stat().st_size > 200_000:
                raise Uncheckable("PREVIOUS_INDEX_TOO_LARGE")
            previous_bytes = args.out.read_bytes()
            previous = json.loads(previous_bytes)
            if not isinstance(previous, dict) or previous.get("schema") != SCHEMA:
                raise Uncheckable("PREVIOUS_INDEX_SCHEMA_CHANGED")
            previously = utc(previous["observed_at"])
            hours = (now - previously).total_seconds() / 3600
            if hours < -0.025:
                raise Uncheckable("PREVIOUS_SOURCE_IN_THE_FUTURE")
            if args.offline or (not args.force and hours < args.min_hours):
                print(json.dumps({"state": "PREVIOUS_METADATA_ONLY_NO_NEW_PROBES",
                                  "last_observed_at": previous["observed_at"],
                                  "previous_repository_status": previous["repository_status"]}))
                return 0
        elif args.offline:
            raise Uncheckable("OFFLINE_INDEX_NOT_AVAILABLE")
        output = collect(previous, now=now, token=os.getenv("GH_API_TOKEN") or None)
        if previous is not None:
            output["previous_snapshot_sha256"] = sha(previous_bytes)
            output["previous_snapshot_observed_at"] = previous["observed_at"]
        else:
            output["previous_snapshot_sha256"] = None
            output["previous_snapshot_observed_at"] = None
        if output["repositories_observed"] == 0:
            raise Uncheckable("ALL_PUBLIC_REPOSITORY_METADATA_UNCHECKABLE")
        raw = json.dumps(output, indent=2, ensure_ascii=False, sort_keys=True,
                         allow_nan=False).encode("utf-8") + b"\n"
        if len(raw) > MAX_PUBLIC_SNAPSHOT_BYTES:
            raise Uncheckable("OUTPUT_METADATA_TOO_LARGE")
        args.out.parent.mkdir(parents=True, exist_ok=True)
        staged_path = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="wb", prefix=".research-commons-", dir=args.out.parent,
                delete=False
            ) as staged:
                staged_path = Path(staged.name)
                staged.write(raw)
                staged.flush()
                os.fsync(staged.fileno())
            if args.out.is_symlink():
                raise Uncheckable("OUTPUT_SYMLINK_REFUSED")
            os.replace(staged_path, args.out)
        finally:
            if staged_path is not None and staged_path.exists():
                staged_path.unlink()
        print(json.dumps({"state": output["repository_status"],
                          "repos_observed": output["repositories_observed"],
                          "repos_uncheckable": output["repositories_uncheckable"],
                          "papers_metadata_only": output["crossref_candidate_metadata_rows"],
                          "changed_revisions": output["changed_source_revision_count"],
                          "sha256": sha(raw), "out": str(args.out)}))
        return 0
    except (Uncheckable, OSError, ValueError, TypeError, KeyError) as exc:
        print("RESEARCH_COMMONS_UNCHECKABLE: " + str(exc)[:140], file=sys.stderr)
        return 4


if __name__ == "__main__":
    raise SystemExit(main())
