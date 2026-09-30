# SPDX-License-Identifier: Apache-2.0
"""Renderers: csoai.evidence-event/0.1 -> OCSF 1.9 / OTel / SARIF 2.1.0 / in-toto v1 / ECS (HEC) / W3C ACR v0.1.

Each renderer changes shape only. Every one calls event.check_renderable() first, so an event that
breaks the doctrine (for example UNMEASURED carrying a number) is refused, not rendered.
"""
import datetime, os, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import event as E  # noqa: E402

PRODUCT = {"name": "GSPC evidence", "vendor_name": "CSOAI Ltd", "version": E.FABRIC_VERSION}
INFO_URI = "https://councilof.ai/spec/evidence-event/v0.1"


def when(ev):
    """The read time of the claim, else the observed side's time, as an aware datetime (UTC)."""
    for t in ((ev.get("claim") or {}).get("read_at"), (ev.get("observed") or {}).get("read_at") if isinstance(ev.get("observed"), dict) else None):
        if isinstance(t, str) and t:
            return datetime.datetime.fromisoformat(t.replace("Z", "+00:00")).astimezone(datetime.timezone.utc)
    raise E.DoctrineError("event has no claim.read_at: a render needs a time it did not invent")


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
