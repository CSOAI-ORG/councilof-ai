#!/usr/bin/env python3
"""watchdog_charter_feed.py — turn the daily watchdog signal index into a HUMAN ROUTING QUEUE.

THE QUESTION THIS ANSWERS. The user asked: "does the daily report signal index feed the
charter of wg-safe so then all humans in the loop can deal with [it]?"

The honest answer before this script was: the index existed and the charter existed, and
NOTHING JOINED THEM. public/interop/watchdog-intake/_index.json is a per-source state table.
The WG-SAFE charter (OpenSecureAIAlliance/wg-safe) is a set of obligations. The estate's
human-in-the-loop path is /api/hitl with a HOLD gate on every consequential action. Three
documents, no seam between them.

This script is the seam, and it is deliberately SMALL. It reads:
  1. the daily signal index (what the public watchdog layer said today), and
  2. the estate's own axis grid (which axis each source touches), and
it produces ONE record per (source × obligation) that needs a human, stating:
  - what the source said (a fact, with the digest that binds it),
  - which obligation it bears on,
  - which axis it touches,
  - whether the estate's own gate requires a human before anything may move, and
  - WHAT A HUMAN IS BEING ASKED TO DO — and what they are NOT being asked to do.

WHAT IT DELIBERATELY DOES NOT DO.

  It does NOT decide anything. It does not score a source, rank it, grade it, or say
  whether an obligation is satisfied. "Relevant to" is not "non-compliant", and this
  record never turns into one. The estate's own rule is that a relevant-to answer is
  never a determination — this file inherits that rule and does not soften it.

  It does NOT open a HITL challenge. A challenge is a human decision with an authority
  epoch and an expiry, and creating one automatically would put a machine in the seat the
  HOLD gate reserves for a person. This file produces the QUEUE that a human works from;
  the challenge is raised by the human (or by the council-staff path, under a human's
  authority), with scripts/hitl/hitl_probe.py and the hitl-authority-effect-v0.2 schema.

  It does NOT create credentials, spend, deploy, or approve anything. Every row's
  human_decision is HOLD and may_apply is false. The axis-specialist registry already
  pins that shape for all 34 specialists, and this file holds the same line.

The output is a proposal queue: a short, prioritized list of what a human should LOOK at,
with enough context to decide and a digest to bind what they saw.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import re
from urllib.request import urlopen
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
INTEROP = ROOT / "public" / "interop" / "watchdog-intake"

# ── the charter obligations this estate tracks, and what each one means here ─────────────
#
# These are the obligations the estate's own /api/evidence-bundle surface accepts. The
# list is the estate's, not a re-derivation: the obligation set is the thing the WG-SAFE
# working group is chartered to make explicit, and the estate publishes against it.
#
# "grid" names the estate's own axis ids that bear on the obligation. "ask" is the
# question a human is being asked to answer — a QUESTION, never a verdict to confirm.
OBLIGATIONS = {
    "article-50": {
        "label": "Article 50 — AI-generated content marking",
        "grid": ["provenance", "provenance-controls"],
        "ask": "does the marking evidence for the subject in question still hold, and is the "
               "subject's own published marking still serving the mark it declared",
        "source_kind": "advisory-feed",
    },
    "article-53": {
        "label": "Article 53 — GPAI provider transparency documentation",
        "grid": ["serving-fidelity", "provenance", "provenance-controls"],
        "ask": "does the provider's published technical documentation still match what the "
               "serving path actually does, and is any change disclosed rather than silent",
        "source_kind": "standard-body",
    },
    "charter": {
        "label": "WG-SAFE charter — runtime enforcement and human oversight",
        "grid": ["hitl", "effect-binding"],
        "ask": "does the authority chain for the subject still bind — invocation, effect and "
               "verification as separate objects — and is the human gate still HOLD",
        "source_kind": "standard-body",
    },
    "dora": {
        "label": "DORA — ICT third-party oversight",
        "grid": ["supply-chain", "provenance-controls"],
        "ask": "for the third party in question, does the current public advisory state change "
               "any claim this estate has made about it",
        "source_kind": "advisory-feed",
    },
    "cra": {
        "label": "Cyber Resilience Act — products with digital elements",
        "grid": ["supply-chain", "effect-binding"],
        "ask": "does the current public vulnerability state for the products in question change "
               "any obligation this estate has mapped",
        "source_kind": "advisory-feed",
    },
}

# Which obligation a source KIND bears on, when its grid touches the obligation's grid.
# A source whose grid does not intersect an obligation's grid does not raise it — the
# intersection IS the relevance rule, and it is mechanical so it cannot drift.
def obligations_for(source: dict) -> list[str]:
    src_grid = set(source.get("grid") or [])
    out = []
    for oid, spec in OBLIGATIONS.items():
        if src_grid & set(spec["grid"]):
            out.append(oid)
    return out


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_index(path: pathlib.Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def build(index: dict, axis_reports=None) -> dict:
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    rows = []

    for sig in index.get("signals", []):
        for oid in obligations_for(sig):
            spec = OBLIGATIONS[oid]
            # A source that did not answer cannot bear on an obligation. It is still
            # routed — but as an UNREACHABLE row needing a human to say so, because a
            # watchdog that stopped answering is a fact a human must know about, and
            # silently dropping it would make the gap invisible.
            answered = sig.get("state") == "REACHABLE"
            rows.append({
                "row_id": f"{sig['source_id']}::{oid}",
                "source_id": sig["source_id"],
                "source_name": sig.get("name"),
                "source_kind": sig.get("kind"),
                "source_state": sig.get("state"),
                "obligation": oid,
                "obligation_label": spec["label"],
                "axis_touched": sorted(set(sig.get("grid") or []) & set(spec["grid"])),
                "observed_count": sig.get("count"),
                "observed_count_kind": sig.get("count_kind"),
                "source_digest": sig.get("body_sha256"),
                "question_for_the_human": spec["ask"],
                "routing_reason": (
                    "the source answered and its grid touches this obligation"
                    if answered else
                    f"the source did not answer ({sig.get('state')}), so it cannot bear on the "
                    f"obligation today — a human must decide whether that silence matters"
                ),
                "human_decision": "HOLD",
                "may_apply": False,
                "approval_may_be_inferred": False,
                "challenge_opened": False,
                "challenge_note": (
                    "No challenge is opened by this feed. A challenge carries a decision id, an "
                    "authority epoch, a scope digest and an expiry — creating one here would "
                    "put a machine in the seat the HOLD gate reserves for a person. Raise it "
                    "through the council-staff path (/api/hitl, hitl-authority-effect-v0.2)."
                ),
                "is_not": [
                    "a determination of compliance or non-compliance",
                    "a score, grade or ranking of the source",
                    "an approval to act",
                    "evidence that an obligation is satisfied or unsatisfied",
                ],
            })

    # Priority is a routing AID for a human's attention, not a risk score. It is a
    # coarse bucket over observable states, and the bucket names are stated plainly so
    # nobody reads "priority 1" as "critical finding".
    def bucket(r: dict) -> str:
        if r["source_state"] != "REACHABLE":
            return "A — the watchdog itself is not answering"
        if r["observed_count_kind"] == "count" and isinstance(r["observed_count"], int) \
                and r["observed_count"] > 0:
            return "B — the source answered with a count to read"
        return "C — the source answered; read the digest if it matters"

    for r in rows:
        r["routing_bucket"] = bucket(r)

    buckets: dict[str, int] = {}
    for r in rows:
        buckets[r["routing_bucket"]] = buckets.get(r["routing_bucket"], 0) + 1

    body = {
        "schema": "csoai.watchdog-charter-feed/0.1",
        "as_of": now.isoformat().replace("+00:00", "Z"),
        "producer": "scripts/watchdog_charter_feed.py",
        "measure": "A HUMAN ROUTING QUEUE derived from the daily public-watchdog signal index",
        "not_a": [
            "a compliance determination",
            "a conformity assessment or certification",
            "a score, grade or ranking",
            "an approval, or a challenge opened on a human's behalf",
            "evidence that any obligation is satisfied or unsatisfied",
        ],
        "count_grammar": (
            "rows count (SOURCE × OBLIGATION) pairs a human may need to look at. That is a "
            "routing count, not a measurement, and it is never pooled with an axis n. A row "
            "exists because the source's axis grid intersects the obligation's axis grid — "
            "a mechanical rule, so it cannot drift from the data."
        ),
        "source_index": {
            "run_id": index.get("run_id"),
            "as_of": index.get("as_of"),
            "run_artifact": index.get("run_artifact"),
        },
        "obligations_tracked": sorted(OBLIGATIONS.keys()),
        "totals": {
            "rows": len(rows),
            "sources_considered": len(index.get("signals", [])),
            "by_bucket": buckets,
        },
        "rows": rows,
        "unpinned_findings": index.get("unpinned_findings", []),
        "method_note": (
            "Relevance is a grid intersection: a source raises an obligation when the axes it "
            "touches meet the axes that obligation bears on. Nothing here decides anything. "
            "Every row's human_decision is HOLD and may_apply is false. The digests bind what "
            "the human saw, so a later reader can recompute the row from the same bytes."
        ),
    }
    if axis_reports is not None:
        axis_rows = axis_reports.get("rows")
        if (not isinstance(axis_rows, list) or not axis_rows
                or any(not isinstance(row, dict) or row.get("human_decision") != "HOLD"
                       or row.get("may_apply") is not False or row.get("approval_may_be_inferred") is not False
                       or row.get("challenge_opened") is not False for row in axis_rows)
                or len({row.get("axis") for row in axis_rows}) != len(axis_rows)
                or any("referee_history" in row and not held_referee_history(row["referee_history"])
                       for row in axis_rows)):
            raise ValueError("axis metadata cannot grant authority or duplicate axes")
        body["gspc_axis_reports"] = axis_reports
        body["totals"]["gspc_axis_report_rows"] = len(axis_reports["rows"])
        body["count_grammar"] += " GSPC axis-report rows are a separate metadata population; they are never pooled with source-obligation rows or any axis n."
    return body



# First-party measurement-report metadata only. This is not incident ingestion,
# a process-event store, a statistical grader, or human appointment/authority.
REPORT_REPO = "csoai/gspc-daily-reports"
MAX_REPORT_BYTES = 2 * 1024 * 1024

def strict_report(raw):
    def pairs(items):
        out = {}
        for key, value in items:
            if key in out:
                raise ValueError("duplicate JSON key")
            out[key] = value
        return out
    def bad(_):
        raise ValueError("nonfinite JSON number")
    def number(text):
        value = float(text)
        if not math.isfinite(value):
            raise ValueError("nonfinite JSON number")
        return value
    doc = json.loads(raw.decode("utf-8"), object_pairs_hook=pairs,
                     parse_constant=bad, parse_float=number)
    if not isinstance(doc, dict):
        raise ValueError("JSON object required")
    return doc

def report_day(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("invalid report day")
    if dt.date.fromisoformat(value).isoformat() != value:
        raise ValueError("invalid report day")
    return value

def public_bytes(url):
    with urlopen(url, timeout=10) as response:
        raw = response.read(MAX_REPORT_BYTES + 1)
    if len(raw) > MAX_REPORT_BYTES:
        raise ValueError("source byte bound")
    return raw

def published_reports(day, read=public_bytes):
    """Pin one existing public repository revision. Errors remain explicit gaps."""
    report_day(day)
    result = {"state": "UNAVAILABLE", "requested_day": day, "current": None,
              "previous": None, "current_ref": None, "previous_ref": None,
              "previous_state": "UNAVAILABLE", "limitations": []}
    try:
        metadata = strict_report(read(f"https://huggingface.co/api/datasets/{REPORT_REPO}"))
        revision = metadata.get("sha")
        if not isinstance(revision, str) or not re.fullmatch(r"[a-f0-9]{40}", revision):
            raise ValueError("invalid repository revision")
        def fetch(d, ext):
            url = f"https://huggingface.co/datasets/{REPORT_REPO}/resolve/{revision}/reports/{d}/daily-report-{d}.{ext}"
            return read(url), url
        raw, url = fetch(day, "json")
        doc = strict_report(raw)
        if doc.get("schema") != "csoai.daily-report/0.1" or doc.get("report_date") != day or not isinstance(doc.get("axes"), dict):
            raise ValueError("report identity invalid")
        sig_raw, _ = fetch(day, "sig")
        sig = strict_report(sig_raw)
        if (sig.get("schema") != "csoai.daily-report-sig/0.1"
                or sig.get("signed_file") != f"daily-report-{day}.json"
                or sig.get("signed_file_sha256") != sha256_hex(raw)):
            raise ValueError("report signature metadata hash mismatch")
        result.update(state="READ_HASH_BOUND_METADATA", current=doc,
            current_ref={"url": url, "revision": revision, "sha256": sha256_hex(raw),
                         "bytes": len(raw), "report_day": day,
                         "generated_at": doc.get("generated_at"),
                         "signature_state": "PRESENT_NOT_VERIFIED" if sig.get("signature") else "UNSIGNED_HASH_BOUND"})
        previous = (doc.get("changes_vs_previous") or {}).get("previous_report")
        expected = ((doc.get("source_hashes") or {}).get("previous_report")
                    or (doc.get("changes_vs_previous") or {}).get("previous_report_ref") or {})
        if previous is None:
            result["previous_state"] = "PREVIOUS_UNAVAILABLE"
        elif not isinstance(expected, dict) or not re.fullmatch(r"[a-f0-9]{64}", str(expected.get("sha256", ""))):
            result["previous_state"] = "PREVIOUS_REFERENCE_UNBOUND"
        else:
            report_day(previous)
            if previous >= day:
                raise ValueError("previous date is not older")
            old_raw, old_url = fetch(previous, "json")
            old = strict_report(old_raw)
            result["previous_ref"] = {"url": old_url, "revision": revision,
                                     "sha256": sha256_hex(old_raw), "expected_sha256": expected["sha256"],
                                     "bytes": len(old_raw), "report_day": previous}
            if sha256_hex(old_raw) != expected["sha256"]:
                result["previous_state"] = "PREVIOUS_BYTES_CONFLICT"
            elif old.get("schema") != "csoai.daily-report/0.1" or old.get("report_date") != previous or not isinstance(old.get("axes"), dict):
                result["previous_state"] = "PREVIOUS_IDENTITY_INVALID"
            else:
                result.update(previous=old, previous_state="EXACT_PREVIOUS_BYTES")
    except Exception as exc:
        # Never turn unavailable/private/invalid source data into zero events.
        result["limitations"].append("Report retrieval/identity gap: " + type(exc).__name__)
    return result

def held_referee_history(value):
    """The build boundary cannot accept action authority via nested metadata."""
    if not isinstance(value, dict):
        return False
    observations = (value.get("previous"), value.get("current"))
    return (value.get("human_decision") == "HOLD" and value.get("may_apply") is False
            and value.get("measurement_admission") == "NOT_ESTABLISHED_BY_REPORT_COMPARISON"
            and all(isinstance(item, dict) and item.get("human_decision") == "HOLD"
                    and item.get("may_apply") is False and item.get("bft_state") == "NOT_DEMONSTRATED"
                    and item.get("measurement_admission") == "NOT_ESTABLISHED_BY_REPORT_COMPARISON"
                    and item.get("signature_state") == "NOT_CHECKED_BY_CONSUMER"
                    and item.get("independence_state") in ("UNKNOWN", "NOT_ESTABLISHED", "DEPENDENT")
                    for item in observations))

def referee_projection(raw):
    """Carry first-party declarations without conferring reviewer authority."""
    out = {"metadata_state": "MISSING", "source_declared": None,
           "observation_sha256": None, "independence_state": "UNKNOWN",
           "bft_state": "NOT_DEMONSTRATED", "signature_state": "NOT_CHECKED_BY_CONSUMER",
           "measurement_admission": "NOT_ESTABLISHED_BY_REPORT_COMPARISON",
           "human_decision": "HOLD", "may_apply": False}
    if raw is None:
        return out
    out["metadata_state"] = "MALFORMED"
    if (not isinstance(raw, dict) or raw.get("schema") != "csoai.referee-observation/0.1"
            or raw.get("human_decision") != "HOLD" or raw.get("may_apply") is not False):
        return out
    fields = ("observation_state", "independence_state", "provenance_state", "bindings",
              "referees", "source_declared_verdict", "source_declared_independence",
              "source_declared_bft", "copied_decision_declared", "quorum_geometry",
              "referee_count", "distinct_implementation_count")
    declared = {key: raw.get(key) for key in fields}
    refs = declared.get("referees")
    if refs is not None and (not isinstance(refs, list) or len(refs) > 64
            or any(not isinstance(ref, dict) for ref in refs)):
        return out
    try:
        encoded = json.dumps(declared, sort_keys=True, separators=(",", ":"),
                             ensure_ascii=False, allow_nan=False).encode()
        if len(encoded) > 65536:
            return out
        # Copy instead of aliasing mutable input. Producer-supplied digests are not trusted.
        declared = json.loads(encoded)
    except (TypeError, ValueError, RecursionError):
        return out
    origins = [ref.get("decision_origin") for ref in (refs or [])
               if isinstance(ref.get("decision_origin"), str) and ref["decision_origin"]]
    copied = declared.get("copied_decision_declared") is True or len(origins) != len(set(origins))
    out.update(metadata_state="SOURCE_DECLARED", source_declared=declared,
               observation_sha256=sha256_hex(encoded),
               independence_state="DEPENDENT" if copied else "NOT_ESTABLISHED")
    return out

def referee_history(old_raw, new_raw):
    old, new = referee_projection(old_raw), referee_projection(new_raw)
    if new["metadata_state"] == "MISSING":
        event = "CURRENT_REFEREE_UNAVAILABLE"
    elif old["metadata_state"] == "MISSING":
        event = "PREVIOUS_REFEREE_UNAVAILABLE"
    elif old["metadata_state"] != "SOURCE_DECLARED" or new["metadata_state"] != "SOURCE_DECLARED":
        event = "REFEREE_METADATA_UNRESOLVED"
    elif old == new:
        event = "UNCHANGED_REFEREE_OBSERVATION"
    else:
        event = "REFEREE_OBSERVATION_CHANGED"
    def context(value):
        if value["metadata_state"] != "SOURCE_DECLARED":
            return None
        declared = value["source_declared"]
        if (declared.get("observation_state") != "SOURCE_DECLARED"
                or declared.get("provenance_state") != "DECLARED_BINDINGS_ONLY"):
            return None
        bindings = declared.get("bindings")
        required = ("artifact_sha256", "source_sha256", "bank_sha256", "grader_sha256",
                    "rubric_sha256", "measured_at", "subject", "scope")
        if (not isinstance(bindings, dict)
                or any(not isinstance(bindings.get(k), str) or not bindings[k] for k in required)
                or any(not re.fullmatch(r"[a-f0-9]{64}", bindings[k])
                       for k in required if k.endswith("_sha256"))):
            return None
        refs = declared.get("referees")
        keys = ("id", "implementation_sha256", "version", "failure_domain", "controller_id")
        if (not isinstance(refs, list) or not refs
                or any(any(not isinstance(ref.get(k), str) or not ref[k] for k in keys)
                       or not re.fullmatch(r"[a-f0-9]{64}", ref["implementation_sha256"]) for ref in refs)
                or len({ref["id"] for ref in refs}) != len(refs)):
            return None
        return {"bindings": bindings, "referees": [{k: ref[k] for k in keys} for ref in refs],
                "quorum_geometry": declared.get("quorum_geometry")}
    before, after = context(old), context(new)
    comparable = (before is not None and after is not None
                  and json.dumps(before, sort_keys=True, separators=(",", ":"), allow_nan=False)
                  == json.dumps(after, sort_keys=True, separators=(",", ":"), allow_nan=False))
    return {"previous": old, "current": new, "event": event,
            "comparison_state": "IDENTICAL_DECLARED_REFEREE_CONTEXT" if comparable
                                else "UNRESOLVED_OR_CHANGED_REFEREE_CONTEXT",
            "measurement_admission": "NOT_ESTABLISHED_BY_REPORT_COMPARISON",
            "human_decision": "HOLD", "may_apply": False}

def axis_report_history(registry, charter_map, reports):
    if registry.get("schema") != "csoai.axis-specialist-registry/1.0":
        raise ValueError("canonical registry schema mismatch")
    if not isinstance(charter_map, dict) or charter_map.get("schema") != "council.axis-charter-map/1.0":
        raise ValueError("charter cross-reference schema mismatch")
    specialists = registry.get("specialists")
    if not isinstance(specialists, list):
        raise ValueError("canonical specialist registry absent")
    names = [s.get("axis") if isinstance(s, dict) else None for s in specialists]
    if not names or any(not isinstance(a, str) or not a for a in names) or len(set(names)) != len(names):
        raise ValueError("canonical specialist registry ambiguous")
    mappings = charter_map.get("axes") if isinstance(charter_map, dict) else None
    if not isinstance(mappings, list):
        mappings = []
    mapped = {}
    for item in mappings:
        if not isinstance(item, dict) or not isinstance(item.get("axis"), str) or item["axis"] in mapped:
            raise ValueError("charter cross-reference ambiguous")
        mapped[item["axis"]] = item.get("articles")
    current = reports.get("current") if reports.get("state") == "READ_HASH_BOUND_METADATA" else None
    previous = reports.get("previous") if reports.get("previous_state") == "EXACT_PREVIOUS_BYTES" else None
    current_axes = (current or {}).get("axes") or {}
    previous_axes = (previous or {}).get("axes") or {}
    fields = ("kind", "status", "n", "measurement_time", "evidence_date",
              "separation", "leader", "accuracy", "interval")
    rows = []
    for specialist, name in zip(specialists, names):
        new, old = current_axes.get(name), previous_axes.get(name)
        if new is not None and not isinstance(new, dict):
            new = None
        if old is not None and not isinstance(old, dict):
            old = None
        old_context = (old or {}).get("comparison_identity")
        new_context = (new or {}).get("comparison_identity")
        required = ("kind", "bank_sha256", "method_sha", "model_versions", "applies_to", "n_note")
        complete = (isinstance(old_context, dict) and isinstance(new_context, dict)
            and all(bool(ctx.get(k)) for ctx in (old_context,new_context) for k in required)
            and all(isinstance(ctx.get(k),str) and re.fullmatch(r"[a-f0-9]{64}",ctx[k])
                    for ctx in (old_context,new_context) for k in ("bank_sha256","method_sha")))
        context = ("IDENTICAL_DECLARED_CONTEXT" if complete and old_context == new_context else
                   "CONTEXT_VARIATION" if complete else "UNRESOLVED_CONTEXT_BINDINGS")
        old_referee, new_referee = (old or {}).get("referee_observation"), (new or {}).get("referee_observation")
        referee = referee_history(old_referee, new_referee)
        if ((old_referee is not None or new_referee is not None)
                and referee["comparison_state"] != "IDENTICAL_DECLARED_REFEREE_CONTEXT"
                and context == "IDENTICAL_DECLARED_CONTEXT"):
            context = "UNRESOLVED_OR_CHANGED_REFEREE_CONTEXT"
        changed = [k for k in fields if old is not None and new is not None and old.get(k) != new.get(k)]
        if referee["previous"] != referee["current"]:
            changed.append("referee_observation")
        if new is None:
            event = "CURRENT_AXIS_UNAVAILABLE"
        elif previous is None:
            event = "PREVIOUS_UNRESOLVED"
        elif old is None:
            event = "AXIS_ADDED"
        elif (context == "CONTEXT_VARIATION" or
              (context == "UNRESOLVED_OR_CHANGED_REFEREE_CONTEXT" and changed)):
            event = "INCOMPARABLE_VARIATION"
        elif not changed:
            event = "UNCHANGED_EVIDENCE"
        elif new.get("kind") == old.get("kind") == "model-comparison" and new.get("separation") != old.get("separation"):
            event = ("SOURCE_DECLARED_SEPARATION_GAINED" if new.get("separation") == "SEPARATED" else
                     "SOURCE_DECLARED_SEPARATION_LOST" if old.get("separation") == "SEPARATED" else
                     "SOURCE_DECLARED_TIE" if new.get("separation") == "TIE" else "SOURCE_DECLARED_LABEL_CHANGED")
        else:
            event = "SOURCE_OBSERVATION_CHANGED"
        numeric_change = "NOT_COMPARED"
        if (context == "IDENTICAL_DECLARED_CONTEXT" and new is not None and old is not None
                and new.get("kind") == old.get("kind") == "model-comparison"
                and type(new.get("n")) is int and type(old.get("n")) is int
                and new["n"] == old["n"] and new["n"] > 0):
            before, after = old.get("accuracy"), new.get("accuracy")
            if type(before) in (int,float) and type(after) in (int,float) and math.isfinite(before) and math.isfinite(after):
                numeric_change = "OBSERVED_DECREASE" if after < before else "OBSERVED_INCREASE" if after > before else "UNCHANGED"
        rows.append({"row_id": "gspc-axis::" + name, "observed_metric_direction": numeric_change, "axis": name,
            "reviewer_role": specialist.get("reviewer_role"),
            "reviewer_acceptance": "NOT_ESTABLISHED", "event": event,
            "comparison_state": context, "changed_fields": changed, "referee_history": referee,
            "previous": {k: old.get(k) for k in fields} if old is not None else None,
            "current": {k: new.get(k) for k in fields} if new is not None else None,
            "previous_context_sha256": sha256_hex(json.dumps(old_context,sort_keys=True).encode()) if old_context else None,
            "current_context_sha256": sha256_hex(json.dumps(new_context,sort_keys=True).encode()) if new_context else None,
            "charter_articles": mapped.get(name),
            "charter_reference_state": "INTERNAL_CROSS_REFERENCE_NOT_EXTERNAL_ADOPTION" if name in mapped else "UNMAPPED",
            "measurement_admission": "NOT_ESTABLISHED_BY_REPORT_COMPARISON",
            "human_decision": "HOLD", "may_apply": False,
            "approval_may_be_inferred": False, "challenge_opened": False,
            "question_for_the_human": "Review source changes, scope, stale evidence and unresolved bindings before relying on this axis."})
    before_count = ((previous or {}).get("corrections") or {}).get("ledger_rows")
    after_count = ((current or {}).get("corrections") or {}).get("ledger_rows")
    count_known = type(before_count) is int and type(after_count) is int and before_count >= 0 and after_count >= 0
    correction_history = {"state": "COMPARED_SOURCE_ROW_COUNTS" if count_known else "UNAVAILABLE",
        "previous_rows": before_count if count_known else None, "current_rows": after_count if count_known else None,
        "row_count_delta": after_count-before_count if count_known else None,
        "axis_assignment": "NOT_ESTABLISHED_BY_AGGREGATE_LEDGER_COUNTS"}
    return {"correction_history": correction_history, "coverage": {"canonical_axes": len(names), "rows": len(rows),
                         "current_rows_missing": [r["axis"] for r in rows if r["current"] is None],
                         "axes_removed_from_registry": sorted(set(previous_axes)-set(names)),
                         "unexpected_current_axes": sorted(set(current_axes)-set(names))},
            "current_report": reports.get("current_ref"), "previous_report": reports.get("previous_ref"),
            "previous_state": reports.get("previous_state"), "source_state": reports.get("state"),
            "charter_provenance": charter_map.get("provenance") if isinstance(charter_map,dict) else None,
            "rows": rows, "limitations": list(reports.get("limitations") or []) + [
                "These are first-party measurement source observations, not incident counts or new GSPC scores.",
                "A generated report date does not refresh measurement_time; source-declared separation is not fresh statistical admission.",
                "Internal charter cross-references do not establish external WG-SAFE adoption, human staffing or action authority.",
                "Unknown or missing context stays unresolved; incompatible banks/methods/versions/scopes are not pooled.",
                "Referee declarations and their changes are metadata, not independent verification, BFT proof, acceptance or authority."]}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", default=str(INTEROP / "_index.json"))
    ap.add_argument("--out", default=str(INTEROP / "charter-feed.json"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--report-day")
    ap.add_argument("--offline-reports", action="store_true")
    ap.add_argument("--registry", default=str(ROOT / "council-os/axis-specialists/registry.json"))
    ap.add_argument("--charter-map", default=str(ROOT / "council-os/axis-specialists/charter-map.json"))
    args = ap.parse_args()

    index_path = pathlib.Path(args.index)
    if not index_path.exists():
        print(f"charter-feed: no signal index at {index_path} — run scripts/watchdog_intake.py first", file=sys.stderr)
        return 2

    index = load_index(index_path)
    registry = strict_report(pathlib.Path(args.registry).read_bytes())
    charter_map = strict_report(pathlib.Path(args.charter_map).read_bytes())
    day = report_day(args.report_day or str(index.get("as_of") or dt.datetime.now(dt.timezone.utc).isoformat())[:10])
    reports = ({"state":"UNAVAILABLE","previous_state":"UNAVAILABLE","limitations":["Report reads explicitly offline."]}
               if args.offline_reports else published_reports(day))
    feed = build(index, axis_report_history(registry, charter_map, reports))
    t = feed["totals"]
    print(f"charter-feed {feed['as_of']} — {t['rows']} routing rows from {t['sources_considered']} sources")
    for bucket, n in sorted(t["by_bucket"].items()):
        print(f"  {n:>3}  {bucket}")

    if args.dry_run:
        print("dry-run: nothing written")
        return 0
    out = pathlib.Path(args.out)
    out.write_text(json.dumps(feed, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
