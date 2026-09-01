#!/usr/bin/env python3
"""OpenTelemetry GenAI semantic-convention spans — file exporter, no collector.

Doctrine: runtime provenance a card MAY carry, never a claim it must.

- Behind a flag. `CSOAI_OTEL` unset/0/false => every call here is a cheap no-op and
  `card_fields()` returns `{}` (the two optional card fields are ABSENT = UNCHECKABLE,
  never faked). Normal harness runs are unaffected.
- No OTLP collector to run, no Langfuse to rebuild. Spans are appended in-process and
  `export()` writes ONE OTLP/JSON file to disk. The sha256 of those exact bytes is the
  `otel_trace_hash`; the OTLP `traceId` is the `otel_trace_id`.
- Attribute keys follow the OpenTelemetry GenAI semantic conventions (gen_ai.*). We emit
  only the fields the caller actually passes — a token count we did not measure stays absent,
  not zero.

This module has NO third-party dependency (no opentelemetry SDK): it emits the OTLP/JSON
wire shape directly so it runs anywhere the harness runs, including CI. It does not sign,
does not write /signed, does not touch the board.
"""
from __future__ import annotations

import hashlib
import json
import os
import secrets
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

_SCHEMA_URL = "https://opentelemetry.io/schemas/1.28.0"
_SCOPE = {"name": "csoai.harness.genai", "version": "0.1.0"}


def enabled() -> bool:
    """True only when CSOAI_OTEL is an explicit on value. Default OFF."""
    return os.environ.get("CSOAI_OTEL", "").strip().lower() in ("1", "true", "yes", "on")


def _export_dir() -> Path:
    d = os.environ.get("CSOAI_OTEL_DIR")
    base = Path(d) if d else Path(__file__).resolve().parent / "exports"
    base.mkdir(parents=True, exist_ok=True)
    return base


def _attrs(d: dict[str, Any]) -> list[dict[str, Any]]:
    """Render a flat dict as OTLP KeyValue[]. Skips None (absent, not zero)."""
    out: list[dict[str, Any]] = []
    for k, v in d.items():
        if v is None:
            continue
        if isinstance(v, bool):
            val = {"boolValue": v}
        elif isinstance(v, int):
            val = {"intValue": str(v)}
        elif isinstance(v, float):
            val = {"doubleValue": v}
        else:
            val = {"stringValue": str(v)}
        out.append({"key": k, "value": val})
    return out


class Tracer:
    """Collects GenAI spans in-process, one trace id per Tracer. No-op-safe when disabled."""

    def __init__(self, service_name: str) -> None:
        self.on = enabled()
        self.service_name = service_name
        self.trace_id = secrets.token_hex(16) if self.on else None  # 16 bytes -> 32 hex
        self._spans: list[dict[str, Any]] = []
        self._export_path: Path | None = None
        self._export_hash: str | None = None

    @contextmanager
    def genai_span(
        self,
        operation: str,
        model: str | None = None,
        system: str | None = None,
        extra: dict[str, Any] | None = None,
    ) -> Iterator[dict[str, Any]]:
        """A GenAI span. `operation` is gen_ai.operation.name (chat / execute_tool / …).

        Yields a mutable dict the caller can add result attributes to
        (e.g. gen_ai.usage.output_tokens, gen_ai.response.finish_reasons).
        When disabled, yields the dict but records nothing.
        """
        bag: dict[str, Any] = dict(extra or {})
        if not self.on:
            yield bag
            return
        span_id = secrets.token_hex(8)
        start = time.time_ns()
        status_code = 1  # OK
        try:
            yield bag
        except Exception as exc:  # record the error honestly, then re-raise
            status_code = 2  # ERROR
            bag.setdefault("error.type", type(exc).__name__)
            raise
        finally:
            end = time.time_ns()
            base = {
                "gen_ai.system": system,
                "gen_ai.operation.name": operation,
                "gen_ai.request.model": model,
            }
            base.update(bag)
            self._spans.append(
                {
                    "traceId": self.trace_id,
                    "spanId": span_id,
                    "name": f"{operation} {model}" if model else operation,
                    "kind": 3,  # SPAN_KIND_CLIENT
                    "startTimeUnixNano": str(start),
                    "endTimeUnixNano": str(end),
                    "attributes": _attrs(base),
                    "status": {"code": status_code},
                }
            )

    def _otlp(self) -> dict[str, Any]:
        return {
            "resourceSpans": [
                {
                    "resource": {
                        "attributes": _attrs(
                            {"service.name": self.service_name, "telemetry.sdk.name": "csoai-genai-file-exporter"}
                        )
                    },
                    "scopeSpans": [{"scope": _SCOPE, "spans": self._spans, "schemaUrl": _SCHEMA_URL}],
                }
            ]
        }

    def export(self) -> tuple[str | None, str | None]:
        """Write the OTLP/JSON file and return (otel_trace_id, otel_trace_hash).

        Disabled, or no spans recorded => (None, None): the card fields stay ABSENT.
        """
        if not self.on or not self._spans:
            return (None, None)
        raw = json.dumps(self._otlp(), sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        self._export_hash = hashlib.sha256(raw).hexdigest()
        self._export_path = _export_dir() / f"trace-{self.trace_id}.otlp.json"
        self._export_path.write_bytes(raw)
        return (self.trace_id, self._export_hash)

    def card_fields(self) -> dict[str, str]:
        """Optional fields a card emitter CAN merge. Empty when disabled/unexported.

        Absent fields == UNCHECKABLE. A signed GSPC card is valid without them; they only
        make the run observable. Call export() first.
        """
        tid, thash = (self.trace_id, self._export_hash) if self._export_path else self.export()
        if not tid or not thash:
            return {}
        return {"otel_trace_id": tid, "otel_trace_hash": thash}


if __name__ == "__main__":  # tiny self-demo: CSOAI_OTEL=1 python3 genai_spans.py
    t = Tracer("csoai-demo")
    with t.genai_span("chat", model="clan-csoai-plain:latest", system="ollama") as s:
        s["gen_ai.usage.input_tokens"] = 42
        s["gen_ai.response.finish_reasons"] = "stop"
    print(json.dumps({"enabled": t.on, "card_fields": t.card_fields()}, indent=2))
