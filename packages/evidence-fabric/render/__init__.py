# SPDX-License-Identifier: Apache-2.0
"""Renderers: csoai.evidence-event/0.1 -> OCSF 1.9 / OTel / SARIF 2.1.0 / in-toto v1 / ECS (HEC) / W3C ACR v0.1.

Each renderer changes shape only. Every one calls event.check_renderable() first, so an event that
breaks the doctrine (for example UNMEASURED carrying a number) is refused, not rendered.
"""
import datetime, os, re, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import event as E  # noqa: E402

PRODUCT = {"name": "GSPC evidence", "vendor_name": "CSOAI Ltd", "version": E.FABRIC_VERSION}
INFO_URI = "https://councilof.ai/spec/evidence-event/v0.1"
_EPOCH = datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc)
_ISO_FRAC_RE = re.compile(r"^(.*\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$")
_HEX32_RE = re.compile(r"^[0-9a-fA-F]{32}$")
_HEX16_RE = re.compile(r"^[0-9a-fA-F]{16}$")


def _parse_iso_utc(raw):
    """Parse an ISO-8601 timestamp into (UTC datetime, sub-microsecond nanoseconds 0..999)."""
    if not isinstance(raw, str) or not raw:
        raise E.DoctrineError("timestamp must be a non-empty ISO-8601 string")
    m = _ISO_FRAC_RE.match(raw)
    extra_ns = 0
    norm = raw
    if m:
        head, frac, tz = m.groups()
        if frac and len(frac) > 6:
            extra_ns = int((frac[6:9]).ljust(3, "0"))
            frac = frac[:6]
        norm = f"{head}.{frac}{tz}" if frac else f"{head}{tz}"
    dt = datetime.datetime.fromisoformat(norm.replace("Z", "+00:00")).astimezone(datetime.timezone.utc)
    return dt, extra_ns


def unix_nano(dt_or_iso):
    """Return exact integer Unix nanoseconds as a string without float/int second truncation."""
    if isinstance(dt_or_iso, datetime.datetime):
        dt = dt_or_iso.astimezone(datetime.timezone.utc)
        extra_ns = 0
    else:
        dt, extra_ns = _parse_iso_utc(dt_or_iso)
    delta = dt - _EPOCH
    us = (delta.days * 86400 + delta.seconds) * 1_000_000 + delta.microseconds
    return str(us * 1000 + extra_ns)


def when(ev):
    """The read time of the claim, else the observed side's time, as an aware datetime (UTC)."""
    for t in ((ev.get("claim") or {}).get("read_at"), (ev.get("observed") or {}).get("read_at") if isinstance(ev.get("observed"), dict) else None):
        if isinstance(t, str) and t:
            dt, _ = _parse_iso_utc(t)
            return dt
    raise E.DoctrineError("event has no claim.read_at: a render needs a time it did not invent")


def when_otel(ev):
    """Return (timeUnixNano, observedTimeUnixNano) preserving subsecond precision and clock meaning.

    observedTimeUnixNano is when the claim/evidence was read/collected (claim.read_at, fallback observed.read_at).
    timeUnixNano is the source/observation occurrence time when explicitly supplied on observed.read_at or
    claim.source_read_at; otherwise it equals observedTimeUnixNano (never invented).
    """
    claim = ev.get("claim") if isinstance(ev.get("claim"), dict) else {}
    obs = ev.get("observed") if isinstance(ev.get("observed"), dict) else {}
    claim_t = claim.get("read_at")
    obs_t = obs.get("read_at") or claim.get("source_read_at")
    collected_raw = claim_t if (isinstance(claim_t, str) and claim_t) else (obs_t if (isinstance(obs_t, str) and obs_t) else None)
    if not collected_raw:
        raise E.DoctrineError("event has no claim.read_at: a render needs a time it did not invent")
    occurred_raw = obs_t if (isinstance(obs_t, str) and obs_t) else collected_raw
    return unix_nano(occurred_raw), unix_nano(collected_raw)


def trace_context(ev):
    """Extract optional qualified OpenTelemetry traceId/spanId when present; never synthesize from event_id."""
    corr = ev.get("correlation")
    if not isinstance(corr, dict) and isinstance(ev.get("observed"), dict):
        corr = ev["observed"].get("correlation")
    if not isinstance(corr, dict):
        return {}
    out = {}
    tid = corr.get("trace_id") or corr.get("traceId")
    sid = corr.get("span_id") or corr.get("spanId")
    if isinstance(tid, str) and _HEX32_RE.match(tid) and tid.lower() != "0" * 32:
        out["traceId"] = tid.lower()
    if isinstance(sid, str) and _HEX16_RE.match(sid) and sid.lower() != "0" * 16:
        out["spanId"] = sid.lower()
    return out


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def sig_summary(ev):
    s = ev.get("signature")
    return s if isinstance(s, dict) else {"state": "UNSIGNED"}


def anchors(ev):
    return ev.get("anchors") or {"ots": "none", "rekor": {"log_index": None, "uuid": None}}


def measured_value(ev):
    """The number, or None. Only ever non-None for a measured state (check_renderable guarantees it)."""
    v = ev.get("value")
    return None if ev["state"] in E.NO_NUMBER_STATES else v


def guard(ev):
    """The single doctrine gate every renderer passes through."""
    return E.check_renderable(ev)
