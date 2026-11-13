#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""OTLP/JSON Traces & Logs -> csoai.evidence-event/0.1 (3-dialect normaliser).

Accepts OTLP/JSON traces or logs from three observability dialects and normalises them
into `csoai.evidence-event/0.1` records:
  1. OpenTelemetry GenAI (`gen_ai.*` current & legacy semantic conventions)
  2. OpenInference / Arize Phoenix (`llm.*`, `openinference.span.kind`)
  3. Langfuse (`langfuse.observation.*`)

Rules:
- Absence of an evaluation score (`gen_ai.evaluation.name` present without `score.value` or `score.label`)
  yields `UNMEASURED`, never a pass.
- Silent model rerouting (`request_model != response_model`) yields `DIVERGENT`.
- Redacted thinking yields `UNCHECKABLE`.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import time
from typing import Any, Dict, Iterable, List, Optional, Tuple

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402


def _attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for a in rec.get("attributes", []) or []:
        k = a.get("key")
        v = a.get("value", {}) or {}
        val = next(iter(v.values())) if v else None
        if k is not None:
            out[k] = val
    return out


def detect_dialect(a: Dict[str, Any]) -> str:
    if any(k.startswith("llm.") for k in a) or "openinference.span.kind" in a:
        return "openinference"
    if any(k.startswith("langfuse.") for k in a):
        return "langfuse"
    return "gen_ai"


def _first(a: Dict[str, Any], *keys: str) -> Any:
    for k in keys:
        if a.get(k) not in (None, "", []):
            return a[k]
    return None


def normalise_attributes(a: Dict[str, Any]) -> Dict[str, Any]:
    d = detect_dialect(a)
    return {
        "dialect": d,
        "op": _first(a, "gen_ai.operation.name", "openinference.span.kind", "langfuse.observation.type"),
        "provider": _first(a, "gen_ai.provider.name", "gen_ai.system", "llm.provider", "llm.system"),
        "req_model": _first(a, "gen_ai.request.model", "llm.model_name", "langfuse.observation.model.name"),
        "resp_model": _first(a, "gen_ai.response.model", "llm.model_name", "langfuse.observation.model.name"),
        "tool": _first(a, "gen_ai.tool.name", "tool.name", "langfuse.observation.tool.name"),
        "out_tokens": _first(
            a,
            "gen_ai.usage.output_tokens",
            "llm.token_count.completion",
            "gen_ai.usage.completion_tokens",
        ),
        "reasoning_tokens": _first(
            a,
            "gen_ai.usage.reasoning.output_tokens",
            "gen_ai.usage.reasoning_tokens",
        ),
        "error": _first(a, "error.type", "exception.type"),
        "finish": _first(a, "gen_ai.response.finish_reasons"),
        "redacted": "redacted_thinking" in json.dumps(a),
        "eval_name": _first(a, "gen_ai.evaluation.name"),
        "eval_score": _first(a, "gen_ai.evaluation.score.value"),
        "eval_label": _first(a, "gen_ai.evaluation.score.label"),
    }


def state_for_norm(norm: Dict[str, Any], has_records: bool = True) -> str:
    if not has_records:
        return "UNMEASURED"
    if norm["eval_name"] is not None:
        if norm["eval_score"] is None and norm["eval_label"] is None:
            return "UNMEASURED"
        label = str(norm["eval_label"] or "").lower()
        return "DIVERGENT" if label in ("fail", "failed", "invalid", "error") else "CONSISTENT"
    if norm["error"]:
        return "DIVERGENT"
    if norm["finish"] and re.search(r"length|error", json.dumps(norm["finish"]).lower()):
        return "DIVERGENT"
    if norm["req_model"] and norm["resp_model"] and norm["req_model"] != norm["resp_model"]:
        return "DIVERGENT"
    if norm["redacted"]:
        return "UNCHECKABLE"
    if not norm["req_model"] and not norm["resp_model"]:
        return "NOT_DISCRIMINATING"
    if not norm["resp_model"] or norm["out_tokens"] is None:
        return "PARTIAL"
    return "CONSISTENT"


def iter_otlp_records(doc: Dict[str, Any]) -> Iterable[Tuple[str, Dict[str, Any], str]]:
    if "resourceSpans" in doc:
        for rs in doc.get("resourceSpans") or []:
            res = _attrs((rs or {}).get("resource", {}) or {})
            for ss in (rs or {}).get("scopeSpans", []) or []:
                for sp in (ss or {}).get("spans", []) or []:
                    merged = dict(res)
                    merged.update(_attrs(sp or {}))
                    yield (sp or {}).get("traceId", "no-trace"), merged, "span"
    if "resourceLogs" in doc:
        for rl in doc.get("resourceLogs") or []:
            for sl in (rl or {}).get("scopeLogs", []) or []:
                for lr in (sl or {}).get("logRecords", []) or []:
                    a = _attrs(lr or {})
                    tid = (lr or {}).get("traceId") or (lr or {}).get("trace_id") or a.get("trace_id") or "no-trace"
                    yield tid, a, "log"


def ingest(
    raw: bytes,
    *,
    origin: str = "otlp-export",
    read_at: Optional[str] = None,
    source_url: Optional[str] = None,
) -> List[Dict[str, Any]]:
    doc = json.loads(raw.decode("utf-8"))
    if not isinstance(doc, dict):
        raise ValueError("OTLP payload must be a JSON object")
    sha = hashlib.sha256(raw).hexdigest()
    code_sha = hashlib.sha256(open(__file__, "rb").read()).hexdigest()
    ts = read_at or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    groups: Dict[str, List[Dict[str, Any]]] = {}
    for tid, a, _kind in iter_otlp_records(doc):
        groups.setdefault(tid, []).append(normalise_attributes(a))

    out: List[Dict[str, Any]] = []
    for trace_id, norms in sorted(groups.items()):
        norm = norms[0]
        state = state_for_norm(norm)
        control = state_for_norm({**norm, "resp_model": None, "eval_score": None, "eval_label": None})
        val = float(norm["eval_score"]) if isinstance(norm["eval_score"], (int, float)) else None
        ev = E.build(
            subject={
                "kind": "model_run",
                "locator": f"otlp:{origin}:{trace_id}",
                "declared_by": f"third_party:{origin}",
            },
            claim={
                "text": "the exported trace describes what the agent did in this session",
                "source_url": source_url,
                "source_sha256": sha,
                "read_at": ts,
            },
            method={
                "id": f"csoai.otlp-ingest/{norm['dialect']}",
                "version": "0.2",
                "holder": "csoai",
                "code_sha256": code_sha,
            },
            declared={
                "dialect": norm["dialect"],
                "operation": norm["op"],
                "provider": norm["provider"],
                "request_model": norm["req_model"],
                "response_model": norm["resp_model"],
                "evaluation": norm["eval_name"],
            },
            observed={
                "tool_calls": [n["tool"] for n in norms if n["tool"]],
                "output_tokens": norm["out_tokens"],
                "reasoning_tokens": norm["reasoning_tokens"],
                "finish_reasons": norm["finish"],
                "errors": [n["error"] for n in norms if n["error"]],
                "records": len(norms),
            },
            state=state,
            value=val,
            negative_control={
                "id": "same-record-with-response-model-and-score-stripped",
                "expected": "UNMEASURED" if norm["eval_name"] else "PARTIAL",
                "got": control,
            },
            limits=[
                "A trace shows what the exporter chose to emit, not everything the agent did.",
                "Reasoning tokens are recorded only where disclosed; redacted thinking yields UNCHECKABLE, never a guess.",
                "The GenAI registry carries no permission or authorisation event, so consent is out of scope here.",
                "An evaluation event without a score is UNMEASURED, never a pass.",
            ],
        )
        out.append(ev)
    return out
