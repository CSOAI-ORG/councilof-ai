#!/usr/bin/env python3
"""owm.py -- the reaction orchestrator's cycle: one outer world model (OWM) snapshot per cycle.

Lane reaction-orchestrator-20260928. Stdlib only (Python 3.8+). Runs from cron on the scheduler host.

One cycle:
  1. reads the one registry (owm-registry.json): stages -> job ids, subjects -> claim -> sources -> fields;
  2. reads job evidence from the output-novelty reader (~/fleet/output_novelty.json, new CONTENT, not mtime)
     and the estate job registry (~/fleet/jobs_registry.json = fleet/automation/JOBS.json);
  3. derives every stage's status: LIVE (a job produced new output within its window), STAGED (built but not
     producing: stale, host stopped, failing, or not enabled) or MISSING (nothing built);
  4. writes one STALE line per job whose newest output is older than stale_after_cycles x period + grace
     (the dead-man's switch), then one summary line ending rc=0 (nothing stale) or rc=3 (something stale);
  5. evaluates every subject: re-reads its surfaces (public GETs, no token; local files read-only), compares the
     declared fields and assigns one state:
       CONSISTENT      two or more surfaces answered and every compared field agrees
       INCONSISTENT    surfaces disagree, or a declared check on the single surface failed (on_fail)
       SINGLE_SURFACE  the subject has one surface by design; its value is recorded, nothing to compare it with
       UNCHECKABLE     a surface exists but could not be read or compared this cycle, or the capture failed
       UNMEASURED      nothing observed yet (no file, or the surface is not deployed: a 404 proves nothing more)
  6. appends one hash-linked csoai.reaction-event/0.1 line per subject whose state or evidence changed;
  7. writes the internal snapshot, the public snapshot (labels only: no host names, paths or job ids) and the
     heartbeat JSON.

Writes ONLY: ~/lanes/logs/owm.log, ~/fleet/owm_heartbeat.json, ~/fleet/owm_snapshot.json,
~/lanes/state/owm/{state.json,events.jsonl,public/latest.json}. Signs nothing (the snapshot is a new kind and
stays UNSIGNED), sends nothing, lands nothing, stops nothing. Canon changes go through the gated land path only.

  python3 owm.py                      # one cycle
  python3 owm.py --dry-run --out DIR  # one cycle, every output under DIR, the live log/state untouched
  python3 owm.py --offline            # skip public GETs (their subjects read UNCHECKABLE)
Exit: 0 nothing stale, 3 something stale, 1 the cycle itself failed.
"""
import argparse
import glob
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

SNAPSHOT_SCHEMA = "csoai.owm-snapshot/0.1"
EVENT_SCHEMA = "csoai.reaction-event/0.1"
STATES = ("CONSISTENT", "INCONSISTENT", "SINGLE_SURFACE", "UNCHECKABLE", "UNMEASURED")
STAGE_STATUSES = ("LIVE", "STAGED", "MISSING")
UA = "CSOAI-owm/0.1 (+https://councilof.ai; public reads only)"
HERE = os.path.dirname(os.path.abspath(__file__))
MAX_BYTES = 4 * 1024 * 1024
HASH_CAP = 64 * 1024 * 1024  # never hash more than this per file on a 1 GB host


# ---------------------------------------------------------------- small helpers
def iso(t):
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso(s):
    if not s or not isinstance(s, str):
        return None
    s = s.strip()
    for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y%m%dT%H%M%SZ"):
        try:
            return datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    try:
        d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    n = 0
    with open(path, "rb") as f:
        while True:
            chunk = f.read(1 << 20)
            if not chunk:
                break
            n += len(chunk)
            if n > HASH_CAP:
                raise ValueError("file larger than the hash cap")
            h.update(chunk)
    return h.hexdigest()


def xpath(p):
    return os.path.expanduser(p)


def newest(pattern):
    fs = sorted(glob.glob(xpath(pattern)))
    return fs[-1] if fs else None


def dig(doc, path):
    """Dotted path; a trailing '#len' gives the length; a {'value': x} leaf is unwrapped to x."""
    want_len = path.endswith("#len")
    if want_len:
        path = path[:-4]
    cur = doc
    for part in path.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        elif isinstance(cur, list) and part.isdigit() and int(part) < len(cur):
            cur = cur[int(part)]
        else:
            raise KeyError(path)
    if want_len:
        return len(cur)
    if isinstance(cur, dict) and "value" in cur and not isinstance(cur["value"], (dict, list)):
        return cur["value"]
    return cur


def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(obj, f, indent=1, sort_keys=False, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)


def read_json(path, default=None):
    try:
        with open(xpath(path)) as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


# ---------------------------------------------------------------- cron
def _field(spec, lo, hi):
    out = set()
    for part in spec.split(","):
        step = 1
        if "/" in part:
            part, s = part.split("/", 1)
            step = int(s)
        if part == "*":
            a, b = lo, hi
        elif "-" in part:
            a, b = (int(x) for x in part.split("-", 1))
        else:
            a = b = int(part)
            if step != 1:
                b = hi
        out.update(range(a, b + 1, step))
    return out


def cron_parse(expr):
    """Five-field cron -> (minutes, hours, doms, months, dows, dom_star, dow_star); None for @reboot/blank."""
    if not expr or not isinstance(expr, str) or expr.startswith("@"):
        return None
    f = expr.split()
    if len(f) != 5:
        return None
    dows = _field(f[4], 0, 7)
    if 7 in dows:
        dows = (dows - {7}) | {0}
    return (_field(f[0], 0, 59), _field(f[1], 0, 23), _field(f[2], 1, 31), _field(f[3], 1, 12), dows,
            f[2] == "*", f[4] == "*")


def _matches(c, t):
    mins, hrs, doms, mons, dows, dom_star, dow_star = c
    if t.minute not in mins or t.hour not in hrs or t.month not in mons:
        return False
    dow = (t.weekday() + 1) % 7  # cron: 0 = Sunday
    if dom_star or dow_star:  # POSIX: when both are restricted, either may match
        return (t.day in doms) and (dow in dows)
    return (t.day in doms) or (dow in dows)


def cron_fires(expr, start, horizon_min=8 * 1440, limit=None):
    c = cron_parse(expr)
    if c is None:
        return []
    t = start.replace(second=0, microsecond=0) + timedelta(minutes=1)
    out = []
    for _ in range(horizon_min):
        if t.hour in c[1] and _matches(c, t):
            out.append(t)
            if limit and len(out) >= limit:
                break
        t += timedelta(minutes=1)
    return out


def cron_next(expr, now):
    f = cron_fires(expr, now, limit=1)
    return f[0] if f else None


def cron_period_s(expr, now):
    """Largest gap between consecutive fires over the next 8 days (conservative for staleness)."""
    fires = cron_fires(expr, now)
    if len(fires) < 2:
        return 7 * 86400 if len(fires) == 1 else None
    return int(max((b - a).total_seconds() for a, b in zip(fires, fires[1:])))


# ---------------------------------------------------------------- jobs and stages
def load_jobs(cfg, now):
    nov = read_json(cfg["sources"]["novelty"], {}) or {}
    reg = read_json(cfg["sources"]["jobs_registry"], {}) or {}
    nov_at = parse_iso(nov.get("at"))
    nov_age = (now - nov_at).total_seconds() if nov_at else None
    rows = {r.get("id"): r for r in (nov.get("jobs") or []) if isinstance(r, dict)}
    regrows = {r.get("id"): r for r in (reg.get("jobs") or []) if isinstance(r, dict)}
    return {"novelty": rows, "registry": regrows, "novelty_at": nov_at, "novelty_age_s": nov_age,
            "registry_at": reg.get("generated_at")}


def eval_component(comp, jobs, cfg, now, self_id):
    """One stage component -> status LIVE | STALE | FAILING | OFF | STAGED | MISSING (+ evidence)."""
    if "missing" in comp:
        return {"label": comp["label"], "status": "MISSING", "detail": comp["missing"]}
    if "staged" in comp:
        return {"label": comp["label"], "status": "STAGED", "detail": comp["staged"]}
    jid = comp["job"]
    out = {"label": comp["label"], "job": jid}
    cyc = cfg["cycle"]
    if jid == self_id:
        sched = cyc["schedule"]
        out.update(status="LIVE", schedule=sched, period_s=cron_period_s(sched, now),
                   newest_output=iso(now), basis="this cycle")
        return out
    row = jobs["novelty"].get(jid)
    reg = jobs["registry"].get(jid) or {}
    out["registry_status"] = reg.get("status")
    if row is None:
        out.update(status="OFF" if reg else "MISSING",
                   detail=("in the job registry (%s) but not in the active schedule" % reg.get("status")) if reg
                   else "not in the job registry or the active schedule")
        return out
    verdict = row.get("verdict") or ""
    sched = row.get("schedule") or reg.get("schedule")
    period = cron_period_s(sched, now) if isinstance(sched, str) else None
    newest_out = parse_iso(row.get("newest_output"))
    out.update(schedule=sched if isinstance(sched, str) else None, period_s=period, verdict=verdict,
               newest_output=iso(newest_out) if newest_out else None, basis="output-novelty reader")
    if verdict.startswith("HOST_STOPPED"):
        out.update(status="OFF", detail="host stopped")
        return out
    if jobs["novelty_age_s"] is None or jobs["novelty_age_s"] > cyc["novelty_max_age_s"]:
        out.update(status="STALE", detail="the output-novelty reader itself is stale; job output UNMEASURED")
        return out
    if verdict.startswith("LOCK_STALE"):
        out.update(status="STALE", detail="a stale lock holder skips every run")
        return out
    if period is None or newest_out is None:
        out.update(status="STALE" if newest_out is None else "LIVE",
                   detail="no schedule period" if period is None else "no output seen")
        return out
    age = (jobs["novelty_at"] - newest_out).total_seconds()
    window = cyc["stale_after_cycles"] * period + cyc["grace_s"]
    out.update(age_s=int(age), window_s=int(window),
               missed_cycles=max(0, int((age - cyc["grace_s"]) // period)))
    if age > window:
        out.update(status="STALE", detail="no new output for %d cycles" % out["missed_cycles"])
    elif (reg.get("status") or "") == "FAILING":
        out.update(status="FAILING", detail="runs, but the job registry reads its last result as FAILING")
    else:
        out["status"] = "LIVE"
    return out


def stage_status(components):
    st = [c["status"] for c in components]
    if "LIVE" in st:
        return "LIVE"
    if any(s in ("STALE", "FAILING", "OFF", "STAGED") for s in st):
        return "STAGED"
    return "MISSING"


# ---------------------------------------------------------------- surfaces
def http_get(base, url, timeout=25):
    req = urllib.request.Request(base.rstrip("/") + url, headers={
        "User-Agent": UA, "Accept": "application/json", "Cache-Control": "no-cache"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read(MAX_BYTES + 1)
    except urllib.error.HTTPError as e:
        return e.code, b""


def read_source(src, cfg, now, fetch, cache):
    """-> dict(id, answered, http?, raw_sha256?, atoms{}, error?, absent?)"""
    t = src["type"]
    res = {"id": src["id"], "type": t, "answered": False, "atoms": {}}
    try:
        if t == "http":
            key = src["url"]
            if key not in cache:
                cache[key] = fetch(cfg["sources"]["base_url"], src["url"])
            status, body = cache[key]
            res["http"] = status
            if status == 404:
                res.update(absent=True, error="HTTP 404 (not deployed)")
                return res
            if status != 200:
                res["error"] = "HTTP %s" % status
                return res
            if len(body) > MAX_BYTES:
                res["error"] = "body larger than the read cap"
                return res
            res["raw_sha256"] = sha256_bytes(body)
            doc = json.loads(body.decode("utf-8"))
        elif t in ("local_json", "local_file"):
            path = newest(src["path"])
            if not path:
                res.update(absent=True, error="no record yet")
                return res
            res["_path"] = path
            res["raw_sha256"] = sha256_file(path)
            mt = datetime.fromtimestamp(os.path.getmtime(path), timezone.utc)
            res["mtime"] = iso(mt)
            if src.get("max_age_s") and (now - mt).total_seconds() > src["max_age_s"]:
                res["error"] = "record older than %ss" % src["max_age_s"]
                return res
            if t == "local_file":
                res["answered"] = True
                res["atoms"] = {"sha256": res["raw_sha256"]}
                return res
            with open(path) as f:
                doc = json.load(f)
        elif t == "flywheel_job":
            fw = read_json(cfg["sources"]["flywheel_status"], {}) or {}
            j = (fw.get("jobs") or {}).get(src["job"])
            if not j:
                res.update(absent=True, error="no run recorded")
                return res
            rf = j.get("result_file")
            doc = {"result": j.get("result"), "rc": j.get("rc"), "finished_utc": j.get("finished_utc")}
            if rf and os.path.exists(rf):
                doc["result_file_sha256"] = sha256_file(rf)
                res["raw_sha256"] = doc["result_file_sha256"]
            res["mtime"] = j.get("finished_utc")
            res["answered"] = True
            res["atoms"] = doc
            return res
        elif t == "claim_watch":
            return read_claim_watch(src, res)
        else:
            res["error"] = "unknown source type"
            return res
    except Exception as e:  # noqa: BLE001 - network, parse, IO: all mean "could not read"
        res["error"] = "%s: %s" % (type(e).__name__, str(e)[:120])
        return res
    missing = []
    for canon_name, path in (src.get("fields") or {}).items():
        try:
            res["atoms"][canon_name] = dig(doc, path)
        except (KeyError, TypeError):
            missing.append(canon_name)
    if missing:
        res["missing_fields"] = missing
    res["answered"] = True
    return res


BAD_CHANGE = {"CHANGED", "IMPACTED", "QUARANTINED", "CORRECTED", "CHECK_FAILED"}


def read_claim_watch(src, res):
    d = xpath(src["dir"])
    ev_path = os.path.join(d, "history", "events.jsonl")
    if not os.path.exists(ev_path):
        res.update(absent=True, error="no events yet")
        return res
    with open(ev_path) as f:
        events = [json.loads(line) for line in f if line.strip()]
    if not events:
        res.update(absent=True, error="no events yet")
        return res
    last_run = events[-1].get("run_id")
    run = [e for e in events if e.get("run_id") == last_run]
    receipt = next((e.get("receipt_sha256") for e in reversed(run) if e.get("receipt_sha256")), None)
    bad = sorted({e.get("change_state") for e in run if e.get("change_state") in BAD_CHANGE}
                 | {"QUARANTINED" for e in run if e.get("object_state") == "QUARANTINED"})
    changed_at = [e.get("at") for e in events if e.get("change_state") in BAD_CHANGE]
    res["answered"] = True
    res["raw_sha256"] = sha256_file(ev_path)
    res["mtime"] = events[-1].get("at")
    res["atoms"] = {
        "last_run_id": last_run,
        "claims_confirmed": sum(1 for e in run if e.get("change_state") == "CONFIRMED" and e.get("claim_id") != "*"),
        "bad_change_states": bad,
        "signed": any(e.get("object_state") == "SIGNED" for e in run),
        "receipt_sha256": receipt,
        "event_head_sha256": sha256_bytes(canon(events[-1])),
    }
    res["claim_last_change"] = changed_at[-1] if changed_at else None
    return res


def eval_subject(subj, cfg, now, fetch, cache, offline):
    sources = subj["sources"]
    reads = []
    for s in sources:
        if offline and s["type"] == "http":
            reads.append({"id": s["id"], "type": "http", "answered": False, "atoms": {}, "error": "offline run"})
        else:
            reads.append(read_source(s, cfg, now, fetch, cache))
    answered = [r for r in reads if r["answered"]]
    atoms = {r["id"]: r["atoms"] for r in answered}
    evidence = sha256_bytes(canon(atoms)) if answered else None
    single = subj.get("mode") == "single_surface" or len(sources) == 1
    state, reason, diffs = None, None, []
    if not answered:
        if all(r.get("absent") for r in reads):
            state, reason = "UNMEASURED", "; ".join(sorted({r.get("error", "") for r in reads}))
        else:
            state = "UNCHECKABLE"
            reason = "; ".join("%s: %s" % (r["id"], r.get("error")) for r in reads if not r["answered"])
    elif subj["kind"] == "claim":
        a = answered[0]["atoms"]
        if a.get("bad_change_states"):
            state, reason = "INCONSISTENT", "last run: %s" % ",".join(a["bad_change_states"])
        else:
            state = "CONSISTENT"
            reason = ("last run: %d claims reproduced on fresh prints, same instrument and host (not an "
                      "independent-runtime reproduction)%s" % (a.get("claims_confirmed", 0),
                                                              "; receipt signed" if a.get("signed") else ""))
    elif single:
        state, reason = "SINGLE_SURFACE", "one surface by design; value recorded, nothing to compare it with"
    else:
        if len(answered) < len(sources):
            state = "UNCHECKABLE"
            reason = "only %d of %d surfaces answered: %s" % (len(answered), len(sources), "; ".join(
                "%s: %s" % (r["id"], r.get("error")) for r in reads if not r["answered"]))
        else:
            fields = sorted({k for r in answered for k in r["atoms"]})
            compared = 0
            for k in fields:
                vals = [(r["id"], r["atoms"][k]) for r in answered if k in r["atoms"]]
                if len(vals) < 2:
                    continue
                compared += 1
                if len({json.dumps(v, sort_keys=True) for _, v in vals}) > 1:
                    diffs.append({"field": k, "values": {i: v for i, v in vals}})
            if compared == 0:
                state, reason = "UNCHECKABLE", "no field was readable on two surfaces"
            elif diffs:
                state = "INCONSISTENT"
                reason = "%d of %d compared fields disagree: %s" % (len(diffs), compared,
                                                                    ", ".join(d["field"] for d in diffs))
            else:
                state, reason = "CONSISTENT", "%d fields agree across %d surfaces" % (compared, len(answered))
    ok_if = subj.get("ok_if") or {}
    if state in ("CONSISTENT", "SINGLE_SURFACE") and ok_if:
        merged = {}
        for r in answered:
            merged.update(r["atoms"])
        failed = ["%s=%s" % (k, merged.get(k)) for k, allowed in ok_if.items() if merged.get(k) not in allowed]
        if failed:
            state = subj.get("on_fail", "UNCHECKABLE")
            reason = "declared check failed: %s" % ", ".join(failed)
            if merged.get("result") is not None and not any(f.startswith("result=") for f in failed):
                reason += " (result=%s)" % merged["result"]
    missing = sorted({"%s.%s" % (r["id"], f) for r in answered for f in r.get("missing_fields", [])})
    if missing and state == "CONSISTENT":
        reason += "; fields not found: %s" % ", ".join(missing)
    return {"id": subj["id"], "state": state, "reason": reason, "evidence_sha256": evidence, "atoms": atoms,
            "diffs": diffs, "reads": reads,
            "claim_last_change": next((r.get("claim_last_change") for r in answered if "claim_last_change" in r), None),
            "first_mtime": next((r.get("mtime") for r in answered if r.get("mtime")), None)}


# ---------------------------------------------------------------- the cycle
def run_cycle(cfg, now, paths, fetch=http_get, offline=False, dry_run=False):
    run_id = now.strftime("%Y%m%dT%H%M%SZ")
    self_id = cfg["cycle"]["id"]
    jobs = load_jobs(cfg, now)
    prev_state = read_json(paths["state"], {}) or {}
    prev_subjects = prev_state.get("subjects", {})

    # stages + dead-man's switch
    stages, stale_lines, stale_jobs = [], [], {}
    for st in sorted(cfg["stages"], key=lambda s: s["order"]):
        comps = [eval_component(c, jobs, cfg, now, self_id) for c in st["components"]]
        stages.append({"stage": st["stage"], "order": st["order"], "label": st["label"],
                       "status": stage_status(comps), "components": comps})
        for c in comps:
            if c["status"] == "STALE" and c.get("job") and c["job"] not in stale_jobs:
                stale_jobs[c["job"]] = c
                stale_lines.append("%s STALE stage=%s job=%s missed_cycles=%s age_s=%s period_s=%s "
                                   "newest_output=%s detail=%s" % (
                                       iso(now), st["stage"], c["job"], c.get("missed_cycles", "?"),
                                       c.get("age_s", "?"), c.get("period_s", "?"), c.get("newest_output"),
                                       (c.get("detail") or "").replace(" ", "_")))
    prev_hb = parse_iso(prev_state.get("last_cycle_at"))
    own_period = cron_period_s(cfg["cycle"]["schedule"], now) or 1800
    if prev_hb and (now - prev_hb).total_seconds() > cfg["cycle"]["stale_after_cycles"] * own_period + 600:
        stale_lines.append("%s STALE stage=state job=%s detail=previous_cycle_%ss_ago_(resumed)" % (
            iso(now), self_id, int((now - prev_hb).total_seconds())))
        stale_jobs.setdefault(self_id, {"job": self_id, "detail": "resumed after a gap"})

    # subjects
    cache, subjects, events_out = {}, [], []
    sched_next = {}
    for subj in cfg["subjects"]:
        r = eval_subject(subj, cfg, now, fetch, cache, offline)
        job = subj.get("schedule_job") or self_id
        if job not in sched_next:
            sched = cfg["cycle"]["schedule"] if job == self_id else (
                (jobs["novelty"].get(job) or {}).get("schedule") or (jobs["registry"].get(job) or {}).get("schedule"))
            nx = cron_next(sched, now) if isinstance(sched, str) else None
            sched_next[job] = iso(nx) if nx else None
        prev = prev_subjects.get(subj["id"]) or {}
        if r["evidence_sha256"] and prev.get("evidence_sha256") == r["evidence_sha256"]:
            last_change, basis = prev.get("last_change"), prev.get("last_change_basis")
        elif r["evidence_sha256"] and prev.get("evidence_sha256"):
            last_change, basis = iso(now), "evidence changed between two cycles"
        elif r["evidence_sha256"]:
            last_change = r.get("claim_last_change") or r.get("first_mtime")
            basis = ("claim-watch change event" if r.get("claim_last_change") else
                     "record time at first observation" if r.get("first_mtime") else None)
            if last_change is None:
                basis = "UNMEASURED: first observation, no earlier record of a change"
        else:
            last_change, basis = prev.get("last_change"), prev.get("last_change_basis")
        change = ("FIRST_SEEN" if not prev else
                  "CHANGED" if prev.get("evidence_sha256") != r["evidence_sha256"] else
                  "STATE_CHANGED" if prev.get("state") != r["state"] else None)
        if change:
            events_out.append({"object_id": subj["id"], "object_state": r["state"], "change_state": change,
                               "reason": r["reason"],
                               "refs": {"evidence_sha256": r["evidence_sha256"],
                                        "prev_evidence_sha256": prev.get("evidence_sha256"),
                                        "prev_state": prev.get("state")}})
        subjects.append({"id": subj["id"], "label": subj["label"], "kind": subj["kind"], "claim": subj["claim"],
                         "state": r["state"], "reason": r["reason"], "last_change": last_change,
                         "last_change_basis": basis, "evidence_sha256": r["evidence_sha256"],
                         "next_check": sched_next[job], "diffs": r["diffs"], "atoms": r["atoms"],
                         "reads": r["reads"], "source_defs": subj["sources"]})

    by_state = {s: 0 for s in STATES}
    for s in subjects:
        by_state[s["state"]] += 1
    by_stage = {s: 0 for s in STAGE_STATUSES}
    for s in stages:
        by_stage[s["status"]] += 1
    rc = 3 if stale_jobs else 0
    summary = ("%s OWM cycle=%s subjects=%d %s stages=%s stale=%d%s rc=%d" % (
        iso(now), run_id, len(subjects), " ".join("%s=%d" % (k, v) for k, v in by_state.items()),
        ",".join("%s:%s" % (s["stage"], s["status"]) for s in stages), len(stale_jobs),
        (" STALE jobs=" + ",".join(sorted(stale_jobs))) if stale_jobs else "", rc))

    internal = {"schema": SNAPSHOT_SCHEMA + "+internal", "generated_at": iso(now), "run_id": run_id,
                "cycle": cfg["cycle"], "novelty_at": iso(jobs["novelty_at"]) if jobs["novelty_at"] else None,
                "job_registry_generated_at": jobs["registry_at"], "stages": stages, "subjects": subjects,
                "counts": {"by_state": by_state, "by_stage_status": by_stage}, "stale_jobs": sorted(stale_jobs),
                "signature": unsigned_block()}
    public = public_view(cfg, internal)
    heartbeat = {"schema": "csoai.owm-heartbeat/0.1", "updated": iso(now), "run_id": run_id, "rc": rc,
                 "stale_jobs": [{"job": k, "stage_detail": v.get("detail"), "missed_cycles": v.get("missed_cycles"),
                                 "newest_output": v.get("newest_output")} for k, v in sorted(stale_jobs.items())],
                 "stages": {s["stage"]: s["status"] for s in stages}, "by_state": by_state,
                 "readers": ["fleet supervisor (jobs.yaml owm-cycle: log_last_line must_contain rc=0, max_age)",
                             "ops-guard output-novelty (crontab line)", "ops-guard prod-canary (staged patch)"]}

    # event log: append-only, hash-linked
    tail = read_tail_event(paths["events"])
    seq = (tail or {}).get("seq", -1)
    prev_sha = sha256_bytes(canon(tail)) if tail else None
    lines = []
    for e in events_out:
        seq += 1
        rec = {"schema": EVENT_SCHEMA, "seq": seq, "prev_sha256": prev_sha, "at": iso(now), "run_id": run_id}
        rec.update(e)
        prev_sha = sha256_bytes(canon(rec))
        lines.append(json.dumps(rec, sort_keys=True, ensure_ascii=False))
    new_state = {"last_cycle_at": iso(now), "run_id": run_id,
                 "subjects": {s["id"]: {"state": s["state"], "evidence_sha256": s["evidence_sha256"],
                                        "last_change": s["last_change"], "last_change_basis": s["last_change_basis"]}
                              for s in subjects}}
    public["events_head"] = {"seq": seq if seq >= 0 else None, "sha256": prev_sha,
                             "appended_this_cycle": len(lines)}
    internal["events_head"] = public["events_head"]

    if lines:
        os.makedirs(os.path.dirname(paths["events"]), exist_ok=True)
        with open(paths["events"], "a") as f:
            f.write("\n".join(lines) + "\n")
    write_json(paths["snapshot_internal"], internal)
    write_json(paths["snapshot_public"], public)
    write_json(paths["heartbeat"], heartbeat)
    write_json(paths["state"], new_state)
    os.makedirs(os.path.dirname(paths["log"]), exist_ok=True)
    with open(paths["log"], "a") as f:
        f.write("\n".join(stale_lines + [summary]) + "\n")
    return rc, internal, public, stale_lines + [summary]


def read_tail_event(path):
    try:
        with open(path, "rb") as f:
            f.seek(0, 2)
            size = f.tell()
            f.seek(max(0, size - 65536))
            data = f.read().decode("utf-8", "replace").strip().splitlines()
        return json.loads(data[-1]) if data else None
    except (OSError, ValueError, IndexError):
        return None


def unsigned_block():
    return {"state": "UNSIGNED",
            "reason": "csoai.owm-snapshot is a new kind. The board signer is used only for kinds that already sign; "
                      "this snapshot carries sha256 digests of the signed evidence it read, and is itself unsigned."}


def public_view(cfg, internal):
    """Labels, states, digests and times only: no host names, file paths, job ids or raw values from sealed sets."""
    def pub_surface(d, r):
        if d["type"] == "http":
            where = d["url"]
        else:
            where = d.get("label") or "scheduler-host record"
        out = {"surface": where, "answered": bool(r.get("answered")), "raw_sha256": r.get("raw_sha256")}
        if d["type"] == "http" and r.get("http") is not None:
            out["http"] = r["http"]
        return out

    subjects = []
    for s in internal["subjects"]:
        reads = {r["id"]: r for r in s["reads"]}
        p = {"id": s["id"], "label": s["label"], "kind": s["kind"], "claim": s["claim"], "state": s["state"],
             "reason": public_reason(s), "last_change": s["last_change"], "last_change_basis": s["last_change_basis"],
             "evidence_sha256": s["evidence_sha256"], "next_check": s["next_check"],
             "surfaces": [pub_surface(d, reads.get(d["id"], {})) for d in s["source_defs"]]}
        if s["kind"] == "own_surface":
            p["compared"] = {r["id"]: r["atoms"] for r in s["reads"] if r.get("answered")}
            if s["diffs"]:
                p["diffs"] = [d for d in s["diffs"]]
        subjects.append(p)
    stages = []
    for st in internal["stages"]:
        stages.append({"stage": st["stage"], "order": st["order"], "label": st["label"], "status": st["status"],
                       "components": [{"label": c["label"], "status": c["status"],
                                       "newest_output": c.get("newest_output"),
                                       "missed_cycles": c.get("missed_cycles"),
                                       "detail": c.get("detail")} for c in st["components"]]})
    by_state = {k: 0 for k in STATES}
    for s in subjects:
        by_state[s["state"]] += 1
    by_stage = {k: 0 for k in STAGE_STATUSES}
    for s in stages:
        by_stage[s["status"]] += 1
    return {
        "schema": SNAPSHOT_SCHEMA,
        "title": "Outer world model: every observed subject, its state and the evidence behind it",
        "generated_at": internal["generated_at"],
        "run_id": internal["run_id"],
        "cycle_schedule_utc": cfg["cycle"]["schedule"],
        "stale_after_s": cfg["cycle"]["publish_stale_after_s"],
        "state_enum": {
            "CONSISTENT": "two or more surfaces answered and every compared field agrees",
            "INCONSISTENT": "surfaces disagree, or a declared check on the one surface failed",
            "SINGLE_SURFACE": "one surface by design; its value is recorded, nothing to compare it with",
            "UNCHECKABLE": "a surface exists but could not be read or compared this cycle, or its capture failed",
            "UNMEASURED": "nothing observed yet; a 404 means not deployed and proves nothing more"},
        "stage_status_enum": {
            "LIVE": "a scheduled job carrying this stage produced new output within its window",
            "STAGED": "built, but not producing: stale, host stopped, failing, or not enabled",
            "MISSING": "nothing built for this stage"},
        "counts": {"subjects": len(subjects), "by_state": by_state, "stages": len(stages),
                   "by_stage_status": by_stage, "stale_components": sum(
                       1 for st in stages for c in st["components"] if c["status"] == "STALE")},
        "stages": stages,
        "subjects": subjects,
        "excluded": cfg.get("excluded", []),
        "signature": unsigned_block(),
        "doctrine": "Measurement, not certification. States describe whether surfaces agree; they are not a grade "
                    "or ranking of anything. UNMEASURED is a state, never a zero.",
    }


def public_reason(s):
    r = s["reason"] or ""
    for read in s["reads"]:
        if read.get("_path"):
            r = r.replace(read["_path"], "record")
    return r


def paths_for(cfg, out_dir=None):
    o = cfg["outputs"]
    if out_dir:
        return {
            "log": os.path.join(out_dir, "owm.log"), "heartbeat": os.path.join(out_dir, "owm_heartbeat.json"),
            "snapshot_internal": os.path.join(out_dir, "owm_snapshot.json"),
            "snapshot_public": os.path.join(out_dir, "public", "latest.json"),
            "state": os.path.join(out_dir, "state.json"), "events": os.path.join(out_dir, "events.jsonl")}
    return {k: xpath(v) for k, v in o.items()}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--registry", default=os.path.join(HERE, "owm-registry.json"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--out", help="with --dry-run: directory for every output")
    ap.add_argument("--offline", action="store_true")
    ap.add_argument("--seed-state", help="with --dry-run: read the previous cycle state from this file")
    a = ap.parse_args(argv)
    with open(a.registry) as f:
        cfg = json.load(f)
    now = datetime.now(timezone.utc).replace(microsecond=0)
    if a.dry_run:
        out = a.out or os.path.join(os.getcwd(), "owm-dry-run")
        paths = paths_for(cfg, out)
        if a.seed_state and os.path.exists(a.seed_state):
            os.makedirs(out, exist_ok=True)
            with open(a.seed_state) as src, open(paths["state"], "w") as dst:
                dst.write(src.read())
    else:
        paths = paths_for(cfg)
    try:
        rc, _, _, lines = run_cycle(cfg, now, paths, offline=a.offline, dry_run=a.dry_run)
    except Exception as e:  # noqa: BLE001 - the cycle failed; say so on the log the supervisor reads
        msg = "%s FAILED owm cycle: %s: %s rc=1" % (iso(now), type(e).__name__, str(e)[:200])
        try:
            os.makedirs(os.path.dirname(paths["log"]), exist_ok=True)
            with open(paths["log"], "a") as f:
                f.write(msg + "\n")
        except OSError:
            pass
        print(msg, file=sys.stderr)
        return 1
    print(lines[-1])
    return rc


if __name__ == "__main__":
    sys.exit(main())
