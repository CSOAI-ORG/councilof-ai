#!/usr/bin/env python3
"""
generate_daily_report.py — Council of AI daily report generator (every axis on the live board).

22 Nov 2026: moved into the repository from the report host, where it read a fixed local folder and ran
unsigned. Run by .github/workflows/daily-report.yml:  generate_daily_report.py --out DIR
Sources: the live board (https://councilof.ai/api/gspc), the live corrections ledger
(https://councilof.ai/api/corrections; ids, dates and states only), client/src/data/axis-rankings.json, and the
optional DAILY_REPORT_SECURITY_SNAPSHOT / DAILY_REPORT_FLEETS_DIR / DAILY_REPORT_FRONTIER files. Holds: holds.json
beside this file names the axes whose figures stay out of the report while a correction is open.

Turns every axis's state into a daily, signed, public, reusable evidence report.
Emits one trio per run (per-axis sections + overall):

    daily-report-YYYY-MM-DD.md   human report
    daily-report-YYYY-MM-DD.json machine mirror (same content + source sha256 at read time)
    daily-report-YYYY-MM-DD.sig  Ed25519 signature over the exact .json bytes
                                 (only if ACTION_EVENT_SIGNING_KEY_PKCS8_B64 is set;
                                 otherwise unsigned and honestly noted)

ZERO FABRICATION: every number comes from the source files. A missing source is
reported as UNAVAILABLE, never guessed.

Regeneration rule: rerunnable daily. Yesterday's trio moves to archive/YYYY-MM-DD/
and the diff section compares consecutive reports (new SEPARATED events,
staleness aging, rank changes, corrections added).

Signing pattern replicated from seam-build-20261101/lib/action-event.mjs
(csoai.action-event/0.1): Ed25519 over canonical bytes, key from the
ACTION_EVENT_SIGNING_KEY_PKCS8_B64 env var (base64 PKCS8), one signer doctrine.
"""

import base64
import glob
import hashlib
import json
import re
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

# ---------------------------------------------------------------- constants

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
# The output folder (on the report host it was this script's own folder). main() sets both from --out.
ROOT = Path.cwd() / "daily-report-out"
ARCHIVE = ROOT / "archive"

API_URL = "https://councilof.ai/api/gspc"
CORRECTIONS_URL = "https://councilof.ai/api/corrections"


def _src(env, default=None):
    v = os.environ.get(env, "").strip()
    return Path(v) if v else default


# A source that is not set is reported UNAVAILABLE ("not produced in this repository"), never guessed.
SOURCES = {
    "axis_rankings": _src("DAILY_REPORT_AXIS_RANKINGS", REPO / "client" / "src" / "data" / "axis-rankings.json"),
    "security_snapshot": _src("DAILY_REPORT_SECURITY_SNAPSHOT"),
    "fleets_dir": _src("DAILY_REPORT_FLEETS_DIR"),
    "frontier": _src("DAILY_REPORT_FRONTIER"),
}
NOT_IN_REPO = "not produced in this repository; it was read from a local folder on the report host"
HOLDS = json.loads((_src("DAILY_REPORT_HOLDS", HERE / "holds.json")).read_text())
HELD_AXES = {a: dict(HOLDS["entries"][e], entry=e) for a, e in HOLDS["axes"].items()}
WITHHELD_FIELDS = ("n", "accuracy", "interval", "fleet_mean", "mean_harm", "leader", "separation_sentence", "api_note")

REPORT_SCHEMA = "csoai.daily-report/0.1"
SIG_SCHEMA = "csoai.daily-report-sig/0.1"
SIGNING_ENV = "ACTION_EVENT_SIGNING_KEY_PKCS8_B64"

# Freshness rule (documented in the report, applied fail-closed):
# a MEASURED axis is CURRENT only if its measurement evidence date is at most
# STALE_DAYS days old at report time; an expired NOT_AFTER bound or an
# UNCHECKABLE evidence date is STALE-DATE. A relying pipeline may set its own
# max age (measurement_time_contract.admission_note); 92 days (~a quarter) here.
STALE_DAYS = int(os.environ.get("GSPC_REPORT_MAX_AGE_DAYS", "92"))

UNAVAILABLE = "UNAVAILABLE"


# ---------------------------------------------------------------- helpers

def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return now_utc().strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def parse_iso(s: str):
    s = s.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def fetch_url(url: str, timeout: int = 30):
    """Fetch URL, return (raw_bytes, parsed_json_or_None, error_or_None)."""
    try:
        req = Request(url, headers={"User-Agent": "csoai-daily-report/0.1"})
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
        try:
            return raw, json.loads(raw.decode("utf-8")), None
        except json.JSONDecodeError as e:
            return raw, None, f"JSON decode error: {e}"
    except Exception as e:  # honest failure, never fabricated
        return None, None, f"{type(e).__name__}: {e}"


# ---------------------------------------------------------------- evidence-date / state

def evidence_date(axis: dict):
    """Extract (evidence_dt, precision_label, raw_evidence) from an axis, or (None, ...)."""
    mt = axis.get("measurement_time")
    if isinstance(mt, dict):
        st = mt.get("state")
        if st == "EXACT" and mt.get("observed_at"):
            return parse_iso(mt["observed_at"]), "EXACT (instant)", mt
        if st == "DAY" and mt.get("observed_on"):
            return parse_iso(mt["observed_on"]), "DAY (day precision)", mt
        if st == "NOT_AFTER" and mt.get("not_after"):
            return parse_iso(mt["not_after"]), "NOT_AFTER (instant upper bound)", mt
        if st == "UNCHECKABLE":
            return None, "UNCHECKABLE", mt
        return None, st or "UNKNOWN", mt
    if isinstance(mt, str):
        dt = parse_iso(mt)
        if dt:
            return dt, "EXACT (timestamp string)", mt
    return None, UNAVAILABLE, mt


def derive_state(axis: dict, report_dt: datetime):
    """Fail-closed state: MEASURED | STALE-DATE | UNMEASURED (+ reason)."""
    status = axis.get("status")
    if status != "MEASURED":
        return "UNMEASURED", "declared slot with no run behind it (status=UNMEASURED)", None, None
    dt, precision, raw = evidence_date(axis)
    if dt is None:
        return ("STALE-DATE",
                "no verifiable measurement-time evidence; CURRENT admission fails closed",
                None, raw)
    if precision.startswith("NOT_AFTER"):
        if dt < report_dt:
            return ("STALE-DATE",
                    f"NOT_AFTER upper bound expired {dt.isoformat()}: proves only that a "
                    f"measurement existed by then; freshness fails closed",
                    dt, raw)
        return "MEASURED", f"NOT_AFTER bound still holds (until {dt.isoformat()})", dt, raw
    age_days = (report_dt.date() - dt.date()).days
    if age_days > STALE_DAYS:
        return ("STALE-DATE",
                f"evidence date {dt.date().isoformat()} is {age_days} days old — beyond the "
                f"{STALE_DAYS}-day freshness window",
                dt, raw)
    return "MEASURED", f"evidence date {dt.date().isoformat()} within the {STALE_DAYS}-day window", dt, raw


# ---------------------------------------------------------------- source readers

def read_json_file(p: Path):
    """Return (data, source_hash_record, error)."""
    if p is None:
        return None, {"path": None, "error": NOT_IN_REPO}, NOT_IN_REPO
    rp = Path(p).resolve()
    rec = {"path": str(rp.relative_to(REPO)) if rp.is_relative_to(REPO) else str(p)}
    try:
        raw = p.read_bytes()
        rec.update({"sha256": sha256_bytes(raw), "bytes": len(raw), "read_at": iso_now()})
        return json.loads(raw.decode("utf-8")), rec, None
    except Exception as e:
        rec["error"] = f"{type(e).__name__}: {e}"
        return None, rec, str(e)


def read_jsonl(p: Path):
    """Return (list_of_rows, source_hash_record, error)."""
    rec = {"path": str(p)}
    try:
        raw = p.read_bytes()
        rec.update({"sha256": sha256_bytes(raw), "bytes": len(raw), "read_at": iso_now()})
        rows = []
        for i, line in enumerate(raw.decode("utf-8").splitlines(), 1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as e:
                rows.append({"_parse_error": True, "_line": i})
        return rows, rec, None
    except Exception as e:
        rec["error"] = f"{type(e).__name__}: {e}"
        return None, rec, str(e)


# ---------------------------------------------------------------- section builders

def build_axis_sections(api, rankings, prev, report_dt):
    """Per-axis evidence for all 33 axes."""
    raxes = (rankings or {}).get("axes", {})
    prev_axes = ((prev or {}).get("axes")) or {}
    out = {}
    for axis in api.get("axes", []):
        name = axis.get("axis", "unnamed")
        state, reason, ev_dt, ev_raw = derive_state(axis, report_dt)
        age_days = None
        if ev_dt is not None and not str(reason).startswith("NOT_AFTER bound still"):
            age_days = (report_dt.date() - ev_dt.date()).days

        # leaderboard top-3 — from the rankings file; fallback to API per_model (jail);
        # honest UNAVAILABLE otherwise.
        top3, board_source = [], UNAVAILABLE
        r = raxes.get(name)
        if r and r.get("models"):
            board_source = "axis-rankings.json (external-only re-rank of the published per-item rows)"
            for m in r["models"][:3]:
                top3.append({
                    "rank": m.get("rank"), "arm": m.get("arm"),
                    "accuracy": m.get("accuracy"), "ci95": m.get("ci95"),
                    "frontier": bool(m.get("frontier")),
                    "band": m.get("band"),
                    "measured_on": m.get("measured_on"),
                    "verdict": m.get("verdict"),
                })
        elif isinstance(axis.get("per_model"), dict) and axis["per_model"]:
            board_source = "API per_model rows (verbatim from the signed living board)"
            pm = axis["per_model"]
            acc_key = "accuracy"
            for arm, v in sorted(pm.items(), key=lambda kv: -(kv[1].get(acc_key) or 0))[:3]:
                top3.append({
                    "rank": len(top3) + 1, "arm": arm, "accuracy": v.get(acc_key),
                    "n": v.get("n"), "frontier": False,
                    "band": None, "measured_on": None,
                    "verdict": "per-model accuracy from the axis's own fleet rows; separation UNTESTED",
                })

        # changes vs previous report (per axis)
        changes = []
        if prev and name in prev_axes:
            p = prev_axes[name]
            if p.get("derived_state") != state:
                changes.append(f"derived state changed {p.get('derived_state')} -> {state}")
            if p.get("separation") != axis.get("separation"):
                changes.append(
                    f"separation changed {p.get('separation')} -> {axis.get('separation')}"
                    + (" — NEW SEPARATED EVENT" if axis.get("separation") == "SEPARATED" else ""))
            if p.get("leader") != axis.get("leader"):
                changes.append(f"leader changed {p.get('leader')} -> {axis.get('leader')}")
            if p.get("evidence_age_days") is not None and age_days is not None \
                    and age_days > p["evidence_age_days"]:
                changes.append(f"evidence aged +{age_days - p['evidence_age_days']} day(s) "
                               f"(now {age_days} days)")
            prev_arms = [t.get("arm") for t in (p.get("top3") or [])]
            cur_arms = [t.get("arm") for t in top3]
            if prev_arms and prev_arms != cur_arms:
                moves = [a for a in cur_arms if a not in prev_arms]
                drops = [a for a in prev_arms if a not in cur_arms]
                parts = []
                if moves:
                    parts.append("new: " + ", ".join(str(m) for m in moves))
                if drops:
                    parts.append("dropped: " + ", ".join(str(d) for d in drops))
                changes.append("top-3 changed: " + "; ".join(parts))
            if not changes:
                changes.append("no change vs previous report")
        elif prev:
            changes.append("axis not present in previous report")
        else:
            changes.append("first report — no previous report to diff against")

        out[name] = {
            "family": axis.get("family"),
            "kind": axis.get("kind"),
            "bench": axis.get("bench"),
            "task": axis.get("task"),
            "status": axis.get("status"),
            "derived_state": state,
            "state_reason": reason,
            "n": axis.get("n"),
            "separation": axis.get("separation"),
            "separation_sentence": axis.get("separation_sentence"),
            "leader": axis.get("leader"),
            "accuracy": axis.get("accuracy"),
            "interval": axis.get("interval"),
            "fleet_mean": axis.get("fleet_mean"),
            "mean_harm": axis.get("mean_harm"),
            "dataset": axis.get("dataset"),
            "dataset_url": axis.get("dataset_url"),
            "measurement_time": ev_raw if isinstance(ev_raw, dict) else ev_raw,
            "evidence_date": ev_dt.date().isoformat() if ev_dt else None,
            "evidence_age_days": age_days,
            "top3": top3,
            "top3_source": board_source,
            "api_note": axis.get("note"),
            "changes_vs_previous": changes,
        }
        h = HELD_AXES.get(name)
        if h:  # holds.json: keep the axis and its state, drop every figure and every comparison
            for k in WITHHELD_FIELDS:
                out[name][k] = None
            out[name].update(top3=[], top3_source="WITHHELD", withheld={"entry": h["entry"], "why": h["why"]},
                             changes_vs_previous=[f"withheld under {h['entry']}: no comparison with the previous report is published"])
            if h.get("limit"):
                out[name]["limit"] = h["limit"]
    return out


def build_frontier_section(frontier, frec):
    if frontier is None:
        return {"state": UNAVAILABLE,
                "note": f"frontier-vs-meok measurement file unreadable ({frec.get('error')}); "
                        f"no frontier numbers fabricated"}
    res = frontier.get("results", {})
    meok = res.get("meok", {})
    arms = res.get("arms", {})
    paired = res.get("paired", {})
    separated_pairs = []
    for arm, tests in sorted(paired.items()):
        for test, v in tests.items():
            if isinstance(v, dict) and v.get("separated"):
                separated_pairs.append({
                    "arm": arm, "test": test, "mcnemar_p": v.get("mcnemar_p"),
                    "b10": v.get("b10"), "c01": v.get("c01"),
                })
    sig = frontier.get("signature") or {}
    return {
        "state": "SEPARATED" if separated_pairs else "NOT SEPARATED",
        "schema": frontier.get("schema"),
        "measured_at": frontier.get("measured_at"),
        "source": frec,
        "bank": (frontier.get("instrument") or {}).get("bank"),
        "grader": (frontier.get("instrument") or {}).get("grader"),
        "meok": meok,
        "arms": arms,
        "blocked_arms": res.get("blocked_arms"),
        "separated_paired_tests": separated_pairs,
        "local_reproduction": frontier.get("local_reproduction"),
        "claims": frontier.get("claims"),
        "signature_present": bool(sig.get("value_b64")),
        "signature_alg": sig.get("alg"),
        "what_this_means": (
            "Frontier arm vs MEOK on the same frozen 237-item public bank: "
            + (f"{len(separated_pairs)} paired McNemar tests came back SEPARATED (p<0.05) — "
               "the difference is measured, not asserted; the referee-off arm is published "
               "alongside so the rule contribution stays visible."
               if separated_pairs else
               "no paired test separated — a point lead is not a measured advantage.")),
    }


def build_fleet_section(fleets_dir, frec):
    section = {"source": frec, "baselines": [], "state": UNAVAILABLE}
    if fleets_dir is None:
        section["note"] = f"fleet baselines: {NOT_IN_REPO}"
        return section
    if not fleets_dir.is_dir():
        section["note"] = f"fleets directory not found: {fleets_dir}"
        return section
    file_hashes = {}
    for p in sorted(fleets_dir.iterdir()):
        if not p.is_file():
            # Nested fleet dirs (e.g. fleets/m2-smalls/) are out of scope for
            # this top-level baseline scan; hashing them raised IsADirectoryError
            # once the M2 fleet landed as a subdirectory (found 2026-11-04).
            continue
        file_hashes[p.name] = sha256_file(p)
        entry = {"file": p.name, "sha256": file_hashes[p.name], "bytes": p.stat().st_size}
        if p.suffix == ".jsonl":
            try:
                rows = [json.loads(l) for l in p.read_text().splitlines() if l.strip()]
                n = len(rows)
                correct = sum(1 for r in rows if r.get("correct") is True)
                unparsed = sum(1 for r in rows if r.get("unparsed"))
                terrs = sum(1 for r in rows if r.get("transport_error"))
                entry.update({
                    "kind": "per-item rows (fleet baseline)", "rows": n,
                    "model": rows[0].get("model") if rows else None,
                    "correct": correct,
                    "accuracy": round(correct / n, 6) if n else None,
                    "unparsed": unparsed, "transport_errors": terrs,
                })
            except Exception as e:
                entry.update({"kind": "per-item rows (parse failed)", "error": str(e)})
        elif p.suffix == ".json":
            try:
                data = json.loads(p.read_text())
                if isinstance(data, list) and data:
                    n = len(data)
                    correct = sum(1 for r in data if r.get("correct") is True)
                    entry.update({
                        "kind": "self-rows baseline (list)", "rows": n,
                        "model": data[0].get("model"),
                        "correct": correct,
                        "accuracy": round(correct / n, 6) if n else None,
                    })
                else:
                    entry.update({"kind": "json (not a row list; hashed only)"})
            except Exception as e:
                entry.update({"kind": "json (parse failed)", "error": str(e)})
        else:
            entry.update({"kind": "log file (hashed only, not parsed for numbers)"})
        section["baselines"].append(entry)
    if section["baselines"]:
        section["state"] = "PRESENT"
        section["what_this_means"] = (
            "Fresh fleet baselines are the reference runs a future measurement must "
            "reproduce; each file carries its sha256 so drift is detectable.")
        # composite source hash over every fleet file at read time
        composite = hashlib.sha256()
        for name in sorted(file_hashes):
            composite.update(f"{name}:{file_hashes[name]}\n".encode())
        section["source"] = {
            "path": str(fleets_dir), "files": len(file_hashes),
            "composite_sha256": composite.hexdigest(),
            "composite_recipe": "sha256 over sorted 'name:sha256\\n' lines; per-file "
                                "sha256 values are in fleets.baselines[].sha256",
            "read_at": iso_now(),
        }
    return section


def build_security_section(security, frec):
    if security is None:
        return {"state": UNAVAILABLE,
                "note": f"security snapshot unavailable ({frec.get('error')})"}
    ratchet = security.get("nightly_hive_ratchet", {})
    owasp = security.get("owasp_asi", {})
    prot = security.get("protection_surface", {})
    news = security.get("news_derived_jail_tests_20261101", {})
    return {
        "state": "PRESENT",
        "generated_at": security.get("generated_at"),
        "nightly_hive_ratchet": {
            "attacks_total": ratchet.get("attacks_total"), "held": ratchet.get("held"),
            "missed": ratchet.get("missed"), "regressions": ratchet.get("regressions"),
            "layers": ratchet.get("layers"), "schedule": ratchet.get("schedule"),
            "detector_selftest": ratchet.get("detector_selftest"),
        },
        "owasp_asi": {"result": owasp.get("result"), "modules": owasp.get("modules"),
                      "hf_dataset": owasp.get("hf_dataset")},
        "protection_surface": {
            "routes_classified": prot.get("routes_classified"),
            "probed_unauthenticated": prot.get("probed_unauthenticated"),
            "open_non_read_on_lan": prot.get("open_non_read_on_lan"),
            "human_door": prot.get("human_door"),
        },
        "news_derived_jail_tests": {
            "targets": news.get("targets"), "verdicts": news.get("verdicts"),
            "honest_limitations": news.get("honest_limitations"),
        },
        "what_this_means": (
            f"Nightly ratchet: {ratchet.get('held')}/{ratchet.get('attacks_total')} attacks held, "
            f"{ratchet.get('missed')} missed, {ratchet.get('regressions')} regressions — the "
            "detector must re-prove itself daily and publishes its own falsifiable self-test."),
    }


def build_corrections_section(rows, frec):
    if rows is None:
        return {"state": UNAVAILABLE, "note": f"corrections.jsonl unreadable ({frec.get('error')})"}
    real = [r for r in rows if isinstance(r, dict) and not r.get("_parse_error")]
    parse_errors = len(rows) - len(real)
    by_action = {}
    for r in real:
        a = r.get("action") or "UNKNOWN"
        by_action[a] = by_action.get(a, 0) + 1
    latest = real[-1] if real else None
    return {
        "state": "PRESENT",
        "ledger_rows": len(real),
        "parse_errors": parse_errors,
        "by_action": by_action,
        "latest": ({k: latest.get(k) for k in
                    ("at", "action", "file", "content_id", "reason")} if latest else None),
        "what_this_means": (
            "Every correction is appended to the public ledger (" + CORRECTIONS_URL + ") and never "
            "rewritten. This report restates only entry ids, dates and states; read each entry there."),
    }


def build_overall(api, axes_sec, api_frec):
    totals = (api or {}).get("totals", {})
    counts = {"MEASURED": 0, "STALE-DATE": 0, "UNMEASURED": 0}
    for v in axes_sec.values():
        counts[v["derived_state"]] = counts.get(v["derived_state"], 0) + 1
    return {
        "api_state": UNAVAILABLE if api is None else "LIVE",
        "api_source": api_frec,
        "schema": (api or {}).get("schema"),
        "issuer": (api or {}).get("issuer"),
        "totals_from_api": {
            "axes": totals.get("axes"), "measured_axes": totals.get("measured_axes"),
            "unmeasured_axes": totals.get("unmeasured_axes"),
            "quotable_axes": totals.get("quotable_axes"),
            "public_count": totals.get("public_count"),
            "separation_public_count": totals.get("separation_public_count"),
            "count_grammar": totals.get("count_grammar"),
        },
        "derived_states_this_report": counts,
        "staleness_rule": (
            f"A MEASURED axis is CURRENT only while its measurement-evidence date is at most "
            f"{STALE_DAYS} days old at report time; an expired NOT_AFTER bound or an UNCHECKABLE "
            f"evidence date is STALE-DATE (fail closed). Set GSPC_REPORT_MAX_AGE_DAYS to change "
            "the window (measurement_time_contract.admission_note allows a pipeline max age)."),
        "measured_in_lane": (api or {}).get("measured_in_lane", []),
        "limitations": (api or {}).get("limitations", []),
        "what_this_means": (
            f"Under the {STALE_DAYS}-day rule: {counts.get('MEASURED',0)} of {len(axes_sec)} axes carry "
            f"current evidence, the evidence on {counts.get('STALE-DATE',0)} can no longer "
            f"prove freshness, and {counts.get('UNMEASURED',0)} are declared slots with no run "
            "behind them — quote both numbers or quote the smaller."),
    }


def build_changes_section(axes_sec, prev, corr, prev_corr, frontier):
    """Overall diff vs the previous report (consecutive reports)."""
    if not prev:
        return {"previous_report": None,
                "summary": "First report — no previous report to diff against."}
    prev_date = prev.get("report_date")
    sep_events, staleness, rank_changes = [], [], []
    for name, cur in axes_sec.items():
        p = (prev.get("axes") or {}).get(name)
        if not p:
            continue
        if cur.get("withheld"):  # a held axis: its state change is kept, its figures are not compared
            if cur["derived_state"] != p.get("derived_state"):
                staleness.append({"axis": name, "from": p.get("derived_state"),
                                  "to": cur["derived_state"], "reason": cur["state_reason"]})
            continue
        if cur["separation"] == "SEPARATED" and p.get("separation") != "SEPARATED":
            sep_events.append({"axis": name, "from": p.get("separation"), "to": "SEPARATED"})
        if cur["derived_state"] != p.get("derived_state"):
            staleness.append({"axis": name, "from": p.get("derived_state"),
                              "to": cur["derived_state"], "reason": cur["state_reason"]})
        prev_arms = [t.get("arm") for t in (p.get("top3") or [])]
        cur_arms = [t.get("arm") for t in (cur.get("top3") or [])]
        if prev_arms and prev_arms != cur_arms:
            rank_changes.append({"axis": name, "previous_top3": prev_arms,
                                 "current_top3": cur_arms})
    d_corr = None
    if corr.get("ledger_rows") is not None and prev_corr is not None:
        d_corr = corr["ledger_rows"] - prev_corr
    return {
        "previous_report": prev_date,
        "new_separated_events": sep_events,
        "staleness_changes": staleness,
        "rank_changes": rank_changes,
        "corrections_added": d_corr,
        "frontier_measured_at": frontier.get("measured_at"),
        "previous_frontier_measured_at": (prev.get("frontier") or {}).get("measured_at"),
        "summary": (
            f"Diff vs {prev_date}: {len(sep_events)} new SEPARATED event(s), "
            f"{len(staleness)} staleness change(s), {len(rank_changes)} top-3 change(s), "
            f"{d_corr if d_corr is not None else 'UNAVAILABLE'} correction(s) added."),
    }


# ---------------------------------------------------------------- rendering

def meaning_for_axis(sec):
    st = sec["derived_state"]
    kind = sec.get("kind")
    if sec.get("withheld"):
        return ("The axis is on the live board, but its figures are withheld here while a correction is open: "
                + sec["withheld"]["entry"] + " at " + CORRECTIONS_URL + ".")
    if st == UNAVAILABLE:
        return ("The live board API could not be read at generation time, so this axis's "
                "state is UNAVAILABLE — no state is invented for it.")
    if st == "UNMEASURED":
        return ("A declared slot with no run behind it — the gap is published, not hidden; "
                "a published slot is not evidence of anything having been measured.")
    if st == "STALE-DATE":
        return ("This axis carries a real measurement, but its evidence can no longer prove "
                "freshness under the fail-closed rule — treat the numbers as aging evidence, "
                "not current state.")
    if kind == "deterministic-facts":
        return ("Deterministic facts (issuer-account reads + public series) — no fleet, "
                "no leader and no accuracy; the measurement is only as current as its date.")
    m = "A published run stands behind this axis and its evidence date is within the freshness window."
    sep = sec.get("separation")
    if sep == "TIE":
        m += " No model separated from the next best (McNemar p>=0.05) — a tie band, not a winner."
    elif sep == "UNTESTED":
        m += (" No separation determination has been published — a point-estimate lead is "
              "not a measured advantage.")
    elif sep == "SEPARATED":
        m += " A separated determination is published for this axis (p<0.05)."
    return m


def render_md(report):
    L = []
    o = report["overall"]
    L.append(f"# Council of AI — GSPC Daily Report — {report['report_date']}")
    L.append("")
    L.append(f"schema: `{report['schema']}` · generated_at: `{report['generated_at']}` · "
             f"issuer: {o.get('issuer')}")
    L.append("")
    L.append("## Signature status")
    L.append("")
    sig_meta = report.get("signature") or {}
    sig_file = ROOT / f"daily-report-{report['report_date']}.sig"
    if sig_file.exists():
        try:
            sd = json.loads(sig_file.read_text())
            L.append(f"- status: **{'SIGNED' if sd.get('signature') else 'UNSIGNED'}** "
                     f"({sd.get('schema')}, {sd.get('algorithm')})")
            if sd.get("signature"):
                L.append(f"- {sd.get('note')}")
                L.append(f"- signed file sha256: `{sd.get('signed_file_sha256')}`")
            else:
                L.append(f"- {sd.get('note')}")
        except Exception as e:
            L.append(f"- signature file unreadable: {e}")
    else:
        L.append(f"- {sig_meta.get('note', UNAVAILABLE)}")
    L.append("")
    L.append("## Sources (sha256 at read time)")
    L.append("")
    for sid, rec in report["source_hashes"].items():
        if isinstance(rec, dict) and rec.get("sha256"):
            label = rec.get("url") or rec.get("path") or sid
            L.append(f"- `{sid}` {label} — sha256 `{rec['sha256']}` ({rec.get('bytes')} bytes)")
        elif isinstance(rec, dict) and rec.get("composite_sha256"):
            L.append(f"- `{sid}` {rec.get('path')} — composite sha256 over {rec.get('files')} "
                     f"files `{rec['composite_sha256']}` (per-file hashes in the Fleet "
                     "baselines section)")
        else:
            L.append(f"- `{sid}` {UNAVAILABLE} ({(rec or {}).get('error', 'not read')})")
    L.append("")

    # overall
    L.append("## Overall state")
    L.append("")
    t = o["totals_from_api"]
    L.append(f"- Board: **{t.get('public_count') or UNAVAILABLE}** "
             f"(measured {t.get('measured_axes')}, unmeasured {t.get('unmeasured_axes')}, "
             f"quotable {t.get('quotable_axes')})")
    L.append(f"- Separation (public): {t.get('separation_public_count') or UNAVAILABLE}")
    d = o["derived_states_this_report"]
    L.append(f"- Derived states under the freshness rule: **MEASURED {d.get('MEASURED',0)} · "
             f"STALE-DATE {d.get('STALE-DATE',0)} · UNMEASURED {d.get('UNMEASURED',0)}**")
    L.append(f"- Rule: {o['staleness_rule']}")
    L.append(f"- What this means: {o['what_this_means']}")
    if t.get("count_grammar"):
        L.append(f"- Count grammar (verbatim from the API): {t['count_grammar']}")
    L.append("")
    for lane in o.get("measured_in_lane", []):
        L.append(f"- In-lane axis **{lane.get('axis')}** ({lane.get('bench')}): {lane.get('task')} — "
                 f"status {lane.get('status')}, n={lane.get('n')}, leader "
                 f"{lane.get('leader')}, separation {lane.get('separation')}.")
    if o.get("measured_in_lane"):
        L.append("- What this means: in-lane axes are measured on our own models and are "
                 "deliberately NOT counted in the public ranking.")
    L.append("")

    # changes
    ch = report["changes_vs_previous"]
    L.append("## Changes vs previous report")
    L.append("")
    L.append(f"- {ch['summary']}")
    if ch.get("previous_report"):
        for e in ch.get("new_separated_events", []):
            L.append(f"- NEW SEPARATED EVENT: **{e['axis']}** {e['from']} -> {e['to']}")
        for s in ch.get("staleness_changes", []):
            L.append(f"- Staleness: **{s['axis']}** {s['from']} -> {s['to']} — {s['reason']}")
        for r in ch.get("rank_changes", []):
            L.append(f"- Top-3 change on **{r['axis']}**: {r['previous_top3']} -> {r['current_top3']}")
        if ch.get("corrections_added") is not None:
            L.append(f"- Corrections ledger: +{ch['corrections_added']} row(s) since previous report.")
        L.append("- What this means: consecutive-report diffs make drift visible — "
                 "new separations, aging evidence and rank movement are events, not state.")
    L.append("")

    # frontier
    f = report["frontier"]
    L.append("## Frontier vs MEOK")
    L.append("")
    if f.get("state") in (UNAVAILABLE, "WITHHELD"):
        L.append(f"- {f['state']}: {f['note']}")
    else:
        L.append(f"- measured_at: `{f.get('measured_at')}` · bank: "
                 f"{(f.get('bank') or {}).get('dataset')} "
                 f"(rows sha256 `{(f.get('bank') or {}).get('rows_sha256')}`)")
        meok = f.get("meok", {})
        L.append(f"- MEOK as shipped: {meok.get('as_shipped', {}).get('rate')} "
                 f"({meok.get('as_shipped', {}).get('pass')}/{meok.get('as_shipped', {}).get('n')}) · "
                 f"referee off: {meok.get('referee_off', {}).get('rate')} · "
                 f"base fleet (mistral:7b): {meok.get('base_fleet_mistral_7b', {}).get('rate')}")
        for arm, v in (f.get("arms") or {}).items():
            L.append(f"- Arm **{arm}** ({v.get('provider')}): raw {v.get('raw', {}).get('rate')} "
                     f"· strict {v.get('strict', {}).get('rate')} · refereed "
                     f"{v.get('refereed', {}).get('rate')} · errors {v.get('errors')}")
        for s in f.get("separated_paired_tests", []):
            L.append(f"- SEPARATED: {s['arm']} — {s['test']} (McNemar p={s['mcnemar_p']}, "
                     f"b10={s['b10']}, c01={s['c01']})")
        lr = f.get("local_reproduction") or {}
        if lr:
            L.append(f"- Local reproduction: meok-as-shipped reproduced {lr.get('meok_as_shipped_reproduced')}"
                     f"/{lr.get('published_meok_as_shipped')}; published no longer reproduces: "
                     f"{lr.get('published_no_longer_reproduces')} (drift {lr.get('drift_pp')} pp) — "
                     f"{lr.get('drift_cause_evidence')}")
        L.append(f"- Signature on the measurement record: "
                 f"{'present (' + str(f.get('signature_alg')) + ')' if f.get('signature_present') else 'ABSENT'}")
        L.append(f"- What this means: {f['what_this_means']}")
    L.append("")

    # fleets
    fl = report["fleets"]
    L.append("## Fleet baselines (fresh runs kept for reproduction)")
    L.append("")
    if fl.get("state") == UNAVAILABLE:
        L.append(f"- {fl.get('note')}")
    else:
        for b in fl.get("baselines", []):
            if "accuracy" in b:
                L.append(f"- `{b['file']}` — {b.get('model')}: {b.get('correct')}/{b.get('rows')} "
                         f"= **{b.get('accuracy')}** accuracy"
                         + (f", {b.get('unparsed')} unparsed, {b.get('transport_errors')} transport "
                            "errors" if b.get("unparsed") or b.get("transport_errors") else "")
                         + f" · sha256 `{b['sha256'][:16]}…`")
            else:
                L.append(f"- `{b['file']}` — {b.get('kind')} · sha256 `{b['sha256'][:16]}…`")
        L.append(f"- What this means: {fl['what_this_means']}")
    L.append("")

    # security
    sec = report["security"]
    L.append("## Security surface")
    L.append("")
    if sec.get("state") == UNAVAILABLE:
        L.append(f"- {sec.get('note')}")
    else:
        r = sec["nightly_hive_ratchet"]
        L.append(f"- Nightly hive ratchet: **{r.get('held')}/{r.get('attacks_total')} held**, "
                 f"{r.get('missed')} missed, {r.get('regressions')} regressions, "
                 f"{r.get('layers')} layers ({r.get('schedule')}); self-test: {r.get('detector_selftest')}")
        ow = sec["owasp_asi"]
        L.append(f"- OWASP ASI: {ow.get('result')} — {ow.get('modules')} ({ow.get('hf_dataset')})")
        p = sec["protection_surface"]
        L.append(f"- Protection surface: {p.get('routes_classified')} routes classified, "
                 f"{p.get('probed_unauthenticated')} probed unauthenticated, "
                 f"**{p.get('open_non_read_on_lan')} open non-read endpoints on LAN**, "
                 f"human door {p.get('human_door')}")
        nd = sec.get("news_derived_jail_tests") or {}
        if nd.get("verdicts"):
            L.append(f"- News-derived jail tests targets: {', '.join(nd.get('targets') or [])}")
            for tgt, verdict in (nd.get("verdicts") or {}).items():
                L.append(f"  - {tgt}: {verdict}")
        L.append(f"- What this means: {sec['what_this_means']}")
    L.append("")

    # corrections
    c = report["corrections"]
    L.append("## Corrections ledger")
    L.append("")
    if c.get("state") == UNAVAILABLE:
        L.append(f"- {c.get('note')}")
    else:
        L.append(f"- **{c.get('ledger_rows')}** ledger rows "
                 f"({', '.join(f'{k}: {v}' for k, v in sorted((c.get('by_action') or {}).items()))})")
        lat = c.get("latest")
        if lat:
            reason = (lat.get("reason") or "")
            if len(reason) > 240:
                reason = reason[:240] + "…"
            L.append(f"- Latest: `{lat.get('at')}` **{lat.get('action')}** `{lat.get('file')}`" + (f" — {reason}" if reason else ""))
        L.append(f"- What this means: {c['what_this_means']}")
    L.append("")

    # per-axis
    L.append(f"## Per-axis detail ({len(report['axes'])} axes)")
    L.append("")
    for i, (name, a) in enumerate(report["axes"].items(), 1):
        L.append(f"### {i}. {name} — {a['derived_state']}")
        L.append("")
        L.append(f"- kind: {a.get('kind')} · bench: {a.get('bench')} · task: {a.get('task')}")
        L.append(f"- status: {a.get('status')}" + ("" if a.get("withheld") else f" · n: {a.get('n')}")
                 + f" · separation: {a.get('separation')}")
        ev = f"{a.get('evidence_date') or UNAVAILABLE}"
        age = f" ({a['evidence_age_days']} days old at report time)" if a.get("evidence_age_days") is not None else ""
        L.append(f"- measurement evidence: {ev}{age} · {a['state_reason']}")
        if a.get("leader") or a.get("accuracy") is not None:
            L.append(f"- board leader: {a.get('leader') or UNAVAILABLE} · "
                     f"accuracy {a.get('accuracy') if a.get('accuracy') is not None else UNAVAILABLE}"
                     + (f" · interval {a.get('interval')}" if a.get("interval") else ""))
        if a.get("dataset"):
            L.append(f"- dataset: {a.get('dataset')}"
                     + (f" ({a.get('dataset_url')})" if a.get("dataset_url") else ""))
        if a.get("withheld"):
            L.append(f"- {a['withheld']['why']}")
            if a.get("limit"):
                L.append(f"- limit: {a['limit']}")
        else:
            L.append(f"- leaderboard top-3 ({a.get('top3_source')}):")
        if a.get("withheld"):
            pass
        elif a.get("top3"):
            for t3 in a["top3"]:
                L.append(f"  {t3.get('rank')}. {t3.get('arm')} — accuracy {t3.get('accuracy')}"
                         + (" (frontier arm)" if t3.get("frontier") else "")
                         + (f" · {t3.get('band')}" if t3.get("band") else "")
                         + (f" · CI95 {t3.get('ci95')}" if t3.get("ci95") else ""))
        else:
            L.append(f"  - {UNAVAILABLE} — "
                     + ("not a model comparison: deterministic-facts axis has no fleet, no "
                        "leader and no accuracy" if a.get("kind") == "deterministic-facts"
                        else "declared slot with no run behind it"))
        chg = "; ".join(a.get("changes_vs_previous") or [])
        L.append(f"- changes vs previous report: {chg}")
        L.append(f"- what this means: {meaning_for_axis(a)}")
        L.append("")

    L.append("---")
    L.append("")
    L.append("Reusability: every number above traces to a sha256-hashed source in "
             "`Sources`; the machine mirror (`daily-report-" + report['report_date'] + ".json`) "
             "carries the same content; the signature block is in the `.sig` file. "
             "Measurement only. Generated by scripts/daily-report/generate_daily_report.py "
             "(Council of AI).")
    L.append("")
    return "\n".join(L)


# ---------------------------------------------------------------- signing

def sign_report(json_path: Path, json_bytes: bytes):
    """Ed25519 over the exact .json bytes — pattern from action-event.mjs.
    Key from ACTION_EVENT_SIGNING_KEY_PKCS8_B64 (base64 PKCS8). No key = honest unsigned."""
    key_b64 = os.environ.get(SIGNING_ENV, "").strip()
    doc = {
        "schema": SIG_SCHEMA,
        "created_at": iso_now(),
        "signed_file": json_path.name,
        "signed_file_sha256": sha256_bytes(json_bytes),
        "algorithm": "Ed25519",
        "signature": None,
        "public_key_spki_b64": None,
    }
    if not key_b64:
        doc["note"] = ("UNSIGNED — " + SIGNING_ENV + " not set; the report is hash-bound only "
                       "(sha256 above), with no signer asserted. No signature is fabricated.")
        return doc, False
    data = json_bytes
    try:
        from cryptography.hazmat.primitives.serialization import (
            Encoding, PublicFormat, load_der_private_key)
        priv = load_der_private_key(base64.b64decode(key_b64), password=None)
        sig = priv.sign(data)
        pub = priv.public_key().public_bytes(Encoding.DER,
                                             PublicFormat.SubjectPublicKeyInfo)
        doc["signature"] = base64.b64encode(sig).decode()
        doc["public_key_spki_b64"] = base64.b64encode(pub).decode()
        doc["note"] = ("Signed with Ed25519 over the exact bytes of " + json_path.name +
                       " (one-signer doctrine, key material from " + SIGNING_ENV + "). " +
                       "Verify: openssl pkeyutl -verify -rawin -in <json> -pubkey <spki.pem> " +
                       "-sigfile <sig.raw>.")
        return doc, True
    except ImportError:
        pass
    except Exception as e:
        doc["note"] = f"UNSIGNED — signing failed honestly: {type(e).__name__}: {e}"
        return doc, False
    # openssl CLI fallback
    import tempfile
    try:
        with tempfile.TemporaryDirectory() as td:
            key_pem = Path(td) / "key.pem"
            der = base64.b64decode(key_b64)
            key_pem.write_bytes(
                b"-----BEGIN PRIVATE KEY-----\n" +
                base64.encodebytes(der).replace(b"\n", b"\n") +
                b"-----END PRIVATE KEY-----\n")
            data_f = Path(td) / "data.bin"
            data_f.write_bytes(data)
            sig_f = Path(td) / "sig.bin"
            r = subprocess.run(
                [shutil.which("openssl") or "openssl", "pkeyutl", "-sign", "-rawin",
                 "-inkey", str(key_pem), "-in", str(data_f), "-out", str(sig_f)],
                capture_output=True, timeout=30)
            if r.returncode != 0 or not sig_f.exists():
                doc["note"] = f"UNSIGNED — openssl signing failed: {r.stderr.decode()[:200]}"
                return doc, False
            doc["signature"] = base64.b64encode(sig_f.read_bytes()).decode()
            pub_f = Path(td) / "pub.pem"
            r2 = subprocess.run(
                [shutil.which("openssl") or "openssl", "pkey", "-in", str(key_pem),
                 "-pubout", "-out", str(pub_f)],
                capture_output=True, timeout=30)
            if r2.returncode == 0:
                pem = pub_f.read_text()
                b64 = "".join(
                    l for l in pem.splitlines() if "-----" not in l)
                doc["public_key_spki_b64"] = b64
            doc["note"] = ("Signed with Ed25519 over the exact bytes of " + json_path.name +
                           " (openssl pkeyutl -rawin; one-signer doctrine, key from " +
                           SIGNING_ENV + ").")
            return doc, True
    except Exception as e:
        doc["note"] = f"UNSIGNED — openssl fallback failed honestly: {type(e).__name__}: {e}"
        return doc, False


# ---------------------------------------------------------------- archive / previous

def archive_previous(today: str):
    """Move any previous-day trio at top level into archive/<date>/. Idempotent."""
    ARCHIVE.mkdir(exist_ok=True)
    moved = []
    for p in sorted(ROOT.glob("daily-report-*.md")) + sorted(ROOT.glob("daily-report-*.json")) \
            + sorted(ROOT.glob("daily-report-*.sig")):
        date = p.stem.replace("daily-report-", "")
        if date == today:
            continue
        dest = ARCHIVE / date
        dest.mkdir(exist_ok=True)
        target = dest / p.name
        if not target.exists():
            shutil.move(str(p), str(target))
            moved.append(p.name)
    return moved


def load_previous_report(today: str):
    """Newest archived report strictly older than today."""
    cands = []
    for p in ARCHIVE.glob("*/daily-report-*.json"):
        date = p.parent.name
        if date < today:
            try:
                cands.append((date, json.loads(p.read_text())))
            except Exception:
                continue
    cands.sort(key=lambda x: x[0])
    return cands[-1][1] if cands else None


# ---------------------------------------------------------------- main

def ledger_rows(doc):
    """The live corrections ledger as report rows: id, date and the first word of the state only. Entry texts are not
    restated (they quote the very figures some of them correct)."""
    rows = []
    for e in sorted((doc or {}).get("corrections") or [], key=lambda e: (str(e.get("date")), str(e.get("id")))):
        m = re.match(r"[A-Za-z_]+", str(e.get("status") or ""))
        rows.append({"at": e.get("date"), "action": m.group(0).upper() if m else "UNSTATED",
                     "file": e.get("id"), "content_id": None, "reason": None})
    return rows


def main():
    global ROOT, ARCHIVE
    import argparse
    ap = argparse.ArgumentParser(description="Council of AI daily report")
    ap.add_argument("--out", default=str(ROOT), help="output folder (archive/ inside it holds earlier reports)")
    args = ap.parse_args()
    ROOT = Path(args.out).resolve()
    ARCHIVE = ROOT / "archive"
    ROOT.mkdir(parents=True, exist_ok=True)
    report_dt = now_utc()
    today = report_dt.strftime("%Y-%m-%d")

    moved = archive_previous(today)
    prev = load_previous_report(today)

    source_hashes = {}

    # 1) live API
    api_raw, api, api_err = fetch_url(API_URL)
    api_frec = {"url": API_URL, "read_at": iso_now()}
    if api_raw is not None:
        api_frec.update({"sha256": sha256_bytes(api_raw), "bytes": len(api_raw)})
    else:
        api_frec["error"] = api_err
    source_hashes["gspc_api"] = api_frec
    if api is None:
        print(f"WARN: live API unavailable ({api_err}); building from local sources honestly.",
              file=sys.stderr)

    # 2) rankings
    rankings, rank_frec, rank_err = read_json_file(SOURCES["axis_rankings"])
    source_hashes["axis_rankings"] = rank_frec
    # 3) security
    security, sec_frec, sec_err = read_json_file(SOURCES["security_snapshot"])
    source_hashes["security_snapshot"] = sec_frec
    # 4) corrections: the live public ledger
    corr_raw, corr_doc, corr_err = fetch_url(CORRECTIONS_URL)
    corr_frec = {"url": CORRECTIONS_URL, "read_at": iso_now()}
    if corr_raw is not None:
        corr_frec.update({"sha256": sha256_bytes(corr_raw), "bytes": len(corr_raw)})
    else:
        corr_frec["error"] = corr_err
    corr_rows = ledger_rows(corr_doc) if corr_doc else None
    source_hashes["corrections"] = corr_frec
    # 5) fleets
    fd = SOURCES["fleets_dir"]
    fleets_sec = build_fleet_section(fd, {"path": str(fd) if fd else None, "error": None if fd else NOT_IN_REPO})
    source_hashes["fleets"] = fleets_sec["source"]
    # 6) frontier: withheld while its bank is under correction (holds.json frontier_section)
    if HOLDS.get("frontier_section"):
        e = HOLDS["frontier_section"]
        frontier, fron_frec = None, {"path": None, "error": f"withheld under {e}"}
    else:
        frontier, fron_frec, fron_err = read_json_file(SOURCES["frontier"])
    source_hashes["frontier"] = fron_frec

    # previous corrections count for delta: only against a report that read the same ledger
    same_ledger = ((prev or {}).get("source_hashes") or {}).get("corrections", {}).get("url") == CORRECTIONS_URL
    prev_corr = (prev or {}).get("corrections", {}).get("ledger_rows") if prev and same_ledger else None

    axes_sec = build_axis_sections(api if api is not None else {}, rankings, prev, report_dt) \
        if api is not None else {}
    if api is None:
        # Honest fallback: an UNAVAILABLE entry per axis we know exists from local
        # sources — never a fabricated state.
        names = set((rankings or {}).get("axes", {}).keys())
        names.update(["jail", "effect-binding"])  # axes known from the board grammar
        for n in sorted(names):
            axes_sec[n] = {
                "family": None, "kind": None, "bench": None, "task": None,
                "status": UNAVAILABLE, "derived_state": UNAVAILABLE,
                "state_reason": "live board API unreadable at generation time; no state invented",
                "n": None, "separation": None, "leader": None, "accuracy": None,
                "interval": None, "dataset": None, "dataset_url": None,
                "measurement_time": None, "evidence_date": None, "evidence_age_days": None,
                "top3": [], "top3_source": UNAVAILABLE, "api_note": None,
                "changes_vs_previous": ["live API unavailable this run"],
            }

    overall = build_overall(api, axes_sec, api_frec)
    frontier_sec = (build_frontier_section(frontier, fron_frec) if not HOLDS.get("frontier_section") else
                    {"state": "WITHHELD", "entry": HOLDS["frontier_section"],
                     "note": ("this comparison is scored on the governance bank, which is under correction "
                              + HOLDS["frontier_section"] + " (" + CORRECTIONS_URL + "); no figure from it is restated here.")})
    corrections_sec = build_corrections_section(corr_rows, corr_frec)

    report = {
        "schema": REPORT_SCHEMA,
        "report_date": today,
        "generated_at": iso_now(),
        "generator": "scripts/daily-report/generate_daily_report.py (CSOAI-ORG/councilof-ai)",
        "holds": {"file": "scripts/daily-report/holds.json", "axes": HOLDS["axes"], "frontier_section": HOLDS.get("frontier_section")},
        "issuer": (api or {}).get("issuer", UNAVAILABLE),
        "report_dt_utc": report_dt.isoformat(),
        "archived_on_this_run": moved,
        "overall": overall,
        "axes": axes_sec,
        "changes_vs_previous": build_changes_section(axes_sec, prev, corrections_sec,
                                                     prev_corr, frontier_sec),
        "frontier": frontier_sec,
        "fleets": fleets_sec,
        "security": build_security_section(security, sec_frec),
        "corrections": corrections_sec,
        "source_hashes": source_hashes,
        "zero_fabrication_note": (
            "Every number in this report comes from the hashed sources listed in "
            "source_hashes. A missing or unreadable source is reported as UNAVAILABLE, "
            "never estimated."),
        "signature": None,  # filled below (signature never signs itself)
    }

    # order axes for readability: measured, stale, unmeasured (alphabetical within)
    rank_order = {"MEASURED": 0, "STALE-DATE": 1, "UNMEASURED": 2}
    report["axes"] = dict(sorted(
        report["axes"].items(),
        key=lambda kv: (rank_order.get(kv[1]["derived_state"], 9), kv[0])))

    # Signature model: detached, over the FINAL on-disk .json bytes — anyone can
    # verify by hashing the published .json and checking the .sig. The .json's
    # signature block points at the .sig (a signature never signs itself).
    json_name = f"daily-report-{today}.json"
    sig_name = f"daily-report-{today}.sig"
    report["signature"] = {
        "status": "SEE_SIG",
        "schema": SIG_SCHEMA,
        "algorithm": "Ed25519",
        "signed_file": json_name,
        "signature_file": sig_name,
        "note": ("The detached signature covering these exact bytes is in " + sig_name +
                 " (" + SIG_SCHEMA + ", Ed25519, key from " + SIGNING_ENV + "). If that env "
                 "var was not set at generation time, the .sig records an honest UNSIGNED "
                 "note instead — no signature is ever fabricated."),
    }
    json_path = ROOT / json_name
    json_bytes = json.dumps(report, ensure_ascii=False, indent=2,
                            sort_keys=True).encode("utf-8")
    json_path.write_bytes(json_bytes)

    sig_doc, signed = sign_report(json_path, json_bytes)
    (ROOT / sig_name).write_text(
        json.dumps(sig_doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    md = render_md(report)
    md_path = ROOT / f"daily-report-{today}.md"
    md_path.write_text(md, encoding="utf-8")

    counts = overall["derived_states_this_report"]
    print(f"OK daily report {today}: "
          f"MEASURED {counts.get('MEASURED',0)} · STALE-DATE {counts.get('STALE-DATE',0)} · "
          f"UNMEASURED {counts.get('UNMEASURED',0)} · "
          f"signature: {'SIGNED' if signed else 'UNSIGNED'} · archived: {moved or 'none'}")
    print(f"  {md_path.name}  {json_path.name}  daily-report-{today}.sig")
    return 0


if __name__ == "__main__":
    sys.exit(main())
