#!/usr/bin/env python3
"""
Watchdog Signal Registry, Coverage Ledger & Cloud Offload Producer (v1)
Aligns Council OS, GSPC (33 slots: 23 MEASURED, 10 UNMEASURED), Hugging Face
(10 TB public + 1 TB private), Kaggle (two-phase staged parity), and RunPod
compute with the COAI Watchdog Signal System Blueprint (2026-10-31).

Doctrine: Measurement, never certification. No banned words, no prices.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = REPO_ROOT / "public" / "interop" / "watchdog-signal-ledger-v1.json"


def sha256_canonical(obj: Any) -> str:
    raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _derive_board_slot_counts() -> tuple[int, int, int]:
    aliases_path = REPO_ROOT / "functions" / "mcp" / "axis-aliases.json"
    if aliases_path.exists():
        aliases = json.loads(aliases_path.read_text(encoding="utf-8")).get("axes", {})
        slots = len(aliases)
        measured = 23
        return slots, measured, max(0, slots - measured)
    return 33, 23, 10


def build_watchdog_signal_ledger() -> dict[str, Any]:
    declared_slots, measured_axes, unmeasured_axes = _derive_board_slot_counts()
    payload: dict[str, Any] = {
        "schema": "csoai.watchdog-signal-ledger/1.0",
        "as_of": "2026-10-31T13:17:05Z",
        "doctrine": "Independent AI-behaviour measurement only. Anyone can re-check at https://councilof.ai/verify",
        "gspc_board_boundary": {
            "source_url": "https://councilof.ai/api/gspc",
            "board_schema": "csoai.gspc-axes/0.5",
            "declared_slots": declared_slots,
            "measured_axes": measured_axes,
            "unmeasured_axes": unmeasured_axes,
            "model_comparison_axes": {
                "total": 14,
                "separated": 0,
                "tie": 7,
                "untested": 7,
            },
            "subject_family_measured_axes": 9,
            "slot_34_gate_rule": (
                "Declared positions and measured runs remain strictly separated and are never summed. "
                "Watchdog operational reach, freshness, and case review live in this Watchdog Coverage Ledger "
                "until Gate 5 criteria are met (frozen method, defined unit of evaluation, n_valid >= 30, "
                "reproducible scoring, signed Ed25519 receipts, and public verification support)."
            ),
        },
        "evidence_planes": [
            {
                "plane_id": "plane-1-benchmark-performance",
                "name": "GSPC Benchmark Performance",
                "authority": "https://councilof.ai/api/gspc",
                "unit": "Frozen item bank evaluation (n_valid >= 30) with exact McNemar separation (p < 0.05)",
                "separation_rule": (
                    "Product traces and incident intakes never enter frozen GSPC denominators directly; "
                    "they only enter the Candidate Evaluation Queue after human review."
                ),
            },
            {
                "plane_id": "plane-2-product-reliability",
                "name": "Product & Harness Reliability",
                "authority": "https://councilof.ai/interop/watchdog-signal-ledger-v1.json",
                "unit": "Real workflow traces open-coded into narrow binary evaluators for recurring failure modes",
                "separation_rule": (
                    "Diagnoses one specific recurring operational failure mode per evaluator "
                    "(schema drift, duplicate case merge, stale source snapshot, or parity lag)."
                ),
            },
            {
                "plane_id": "plane-3-operating-outcomes",
                "name": "Customer & Operating Outcomes",
                "authority": "https://councilof.ai/dashboard?tab=corrections",
                "unit": "Registered source freshness, triage latency, verification completion, and independent re-checks",
                "separation_rule": (
                    "Published in the Daily Watchdog Signal Index, strictly distinct from the Daily Evidence Digest."
                ),
            },
        ],
        "data_provenance_records": [
            {
                "order": 1,
                "record_type": "Source",
                "description": "Named external feed or intake channel with owner, cadence, license, and provenance rules.",
            },
            {
                "order": 2,
                "record_type": "Source snapshot",
                "description": "Timestamped fetch result with HTTP status, payload SHA-256 digest, and explicit health state.",
            },
            {
                "order": 3,
                "record_type": "Source record",
                "description": "Normalized incident or advisory item linked to the immutable raw snapshot digest.",
            },
            {
                "order": 4,
                "record_type": "Council case",
                "description": "Deduplicated issue with affected system, severity, axis crosswalk tags, and 3 governed views.",
            },
            {
                "order": 5,
                "record_type": "Decision or action",
                "description": "Triage, verification, redaction, publication, or WG-SAFE package action bound to a named key.",
            },
        ],
        "case_governed_views": [
            {
                "view_id": "private_case_view",
                "visibility": "PRIVATE_BY_DEFAULT",
                "contents": "Raw reporter narrative, attachments, contact metadata, and internal triage working notes.",
            },
            {
                "view_id": "reporter_view",
                "visibility": "REPORTER_SCOPED",
                "contents": "Case identifier, SHA-256 intake receipt, status transitions, clarification requests, and outcome summary.",
            },
            {
                "view_id": "public_view",
                "visibility": "REDACTED_AFTER_REVIEW",
                "contents": "Redacted summary, source provenance, and axis crosswalk published only after human verification and privacy review.",
            },
        ],
        "feed_health_states": [
            "CURRENT",
            "PARTIAL",
            "STALE",
            "UNAVAILABLE",
            "RESTRICTED",
            "PAUSED",
            "RETIRED",
        ],
        "registered_sources": [
            {
                "source_id": "src-aiid-public",
                "name": "AI Incident Database (AIID) Public Snapshot Feed",
                "category": "Public Incident Tracker",
                "cadence": "daily",
                "health_state": "CURRENT",
                "candidate_axes": ["safety", "governance", "provenance"],
                "storage_target": "hf://datasets/csoai/runpod-gspc-intake (private 1 TB vault)",
            },
            {
                "source_id": "src-oecd-aim",
                "name": "OECD.AI Incident & Hazard Monitor",
                "category": "Intergovernmental Tracker",
                "cadence": "daily",
                "health_state": "CURRENT",
                "candidate_axes": ["governance", "regulatory-framework", "labour-components"],
                "storage_target": "hf://datasets/csoai/runpod-gspc-intake (private 1 TB vault)",
            },
            {
                "source_id": "src-nist-nvd-ai",
                "name": "NIST AI RMF & NVD Advisory Feed",
                "category": "Standards & Vulnerability Advisories",
                "cadence": "daily",
                "health_state": "CURRENT",
                "candidate_axes": ["conformance", "effect-binding", "jail"],
                "storage_target": "hf://datasets/csoai/runpod-gspc-intake (private 1 TB vault)",
            },
            {
                "source_id": "src-owasp-mcp-agentic",
                "name": "OWASP MCP & Agentic Security Advisories",
                "category": "Protocol & Tooling Advisories",
                "cadence": "daily",
                "health_state": "CURRENT",
                "candidate_axes": ["mcp-trust", "conformance", "swarm", "effect-binding"],
                "storage_target": "hf://datasets/csoai/runpod-gspc-intake (private 1 TB vault)",
            },
            {
                "source_id": "src-zenodo-doi-anchor",
                "name": "Zenodo Deposit Status Monitor (10.5281/zenodo.21991104)",
                "category": "Archival DOI Registry",
                "cadence": "hourly",
                "health_state": "UNAVAILABLE",
                "status_url": "https://councilof.ai/interop/zenodo-status.json",
                "candidate_axes": ["claim-maintenance", "provenance"],
                "storage_target": "https://councilof.ai/interop/zenodo-status.json",
            },
            {
                "source_id": "src-direct-reporter-intake",
                "name": "Council OS Direct Reporter Intake (Private-by-Default)",
                "category": "Direct Intake",
                "cadence": "continuous",
                "health_state": "CURRENT",
                "candidate_axes": ["care", "affect", "safety", "governance"],
                "storage_target": "hf://datasets/csoai/runpod-gspc-intake (private 1 TB vault)",
            },
        ],
        "meok_human_qualification": {
            "enrolled_human_operator_keys": 0,
            "specialist_taxonomy_slots": declared_slots,
            "initial_qualified_functions": [
                {
                    "function_id": "fn-1-incident-triage",
                    "title": "Incident triage",
                    "scope": "Severity assignment, duplicate case linking, and privacy redaction check.",
                },
                {
                    "function_id": "fn-2-evidence-verification",
                    "title": "Evidence verification",
                    "scope": "Independent check of raw snapshot SHA-256 digest, source reachability, and replay recipe.",
                },
                {
                    "function_id": "fn-3-authority-action-scope",
                    "title": "Authority and action scope",
                    "scope": "Explicit human sign-off required before any public case view release or external WG-SAFE transmission.",
                },
            ],
            "layer0_action_boundary": [
                "1. Observe (automated collector records Source Snapshot + SHA-256)",
                "2. Recommend (AI specialist drafts Source Record + candidate tags)",
                "3. Human-Approved (named reviewer signs disposition)",
                "4. Execute (gated worker publishes redacted view or transmits package)",
                "5. Receipt (Ed25519 / SHA-256 audit entry linked to public root)",
            ],
        },
        "wg_safe_crosswalk": {
            "states": [
                "NOT_MAPPED",
                "MAPPED_INTERNAL",
                "HUMAN_APPROVED",
                "SUBMITTED",
                "ACKNOWLEDGED",
                "SUPERSEDED",
            ],
            "rule": (
                "Internal crosswalk mappings are never described as external adoption. "
                "Transmission to WG-SAFE requires HUMAN_APPROVED status and records an external receipt before ACKNOWLEDGED."
            ),
        },
        "cloud_compute_and_storage_offload": {
            "local_operator_machine_policy": (
                "Zero heavy dataset or backup retention on local Mac M4 SSD. "
                "All snapshot archives, raw intake feeds, and evaluation artifacts are stored on Hugging Face "
                "(10 TB public + 1 TB private) and processed on RunPod GPU/CPU workers and GitHub Actions runners."
            ),
            "surfaces": [
                {
                    "surface": "Hugging Face Public Datasets & Space",
                    "repo": "https://huggingface.co/datasets/csoai/gspc-board",
                    "space": "https://huggingface.co/spaces/csoai/gspc-board",
                    "capacity": "10 TB public org storage (100 datasets, 149,207 downloads)",
                    "viewer_columns": ["axis", "family", "kind", "status", "n", "separation", "leader", "dataset"],
                    "sync_mechanism": "scripts/spray/gspc-spray.py (--hf) with PyArrow 25/26 table equality guard (#3632)",
                },
                {
                    "surface": "Hugging Face Private Vault",
                    "repo": "https://huggingface.co/datasets/csoai/runpod-gspc-intake",
                    "capacity": "1 TB private org storage",
                    "purpose": "Durable RunPod 24x7 unsigned run intake, raw Watchdog source snapshots, and off-M4 estate backups",
                    "sync_mechanism": ".github/workflows/runpod-intake.yml + scripts/runpod_gspc_bridge_to_mill.py",
                },
                {
                    "surface": "Kaggle Living Board Dataset",
                    "repo": "https://www.kaggle.com/datasets/nicholastempleman/gspc-living-board",
                    "capacity": "Kaggle Datasets archive + community benchmark cells",
                    "sync_mechanism": (
                        "scripts/spray/gspc-spray.py (--kaggle) two-phase staged metadata update verified by "
                        "scripts/spray/verify-gspc-parity.py"
                    ),
                },
                {
                    "surface": "RunPod 24x7 Compute Fleet",
                    "workflow": ".github/workflows/runpod-intake.yml & .github/workflows/runpod-land.yml",
                    "purpose": "Continuous GSPC model evaluation and Watchdog candidate evaluator replay off local hardware",
                },
            ],
        },
        "execution_gates": [
            {"gate": "Gate 0", "title": "Truth & Parity Across Web, HF & Kaggle (Declared Positions vs Measured Runs)", "status": "ACTIVE_ENFORCED"},
            {"gate": "Gate 1", "title": "Watchdog Case Desk & Private-by-Default Intake Schema", "status": "SCHEMA_PUBLISHED"},
            {"gate": "Gate 2", "title": "Tier-1 Registered Source Collectors & 7 Feed-Health States", "status": "LEDGER_PUBLISHED"},
            {"gate": "Gate 3", "title": "MEOK 3-Function Human Qualification & Layer-0 Action Boundary", "status": "BOUNDARY_PINNED"},
            {"gate": "Gate 4", "title": "Daily Watchdog Signal Index (Separated from Daily Evidence Digest) + WG-SAFE Crosswalk", "status": "SEPARATED"},
            {"gate": "Gate 5", "title": "Candidate Evaluation Queue -> Frozen Axis Admission Gate (Prerequisite for Slot 34)", "status": "GATED"},
        ],
    }
    payload["artifact_sha256"] = sha256_canonical(payload)
    return payload


def main() -> int:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    doc = build_watchdog_signal_ledger()
    OUT_PATH.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH} (sha256={doc['artifact_sha256']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
