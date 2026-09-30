"""fleetlib - the pure half of the fleet supervisor (stdlib only, Python >= 3.8).

Everything here is deterministic given (config, state, clock, probes) so the tests can drive it
with fixtures: health evaluation, the retry -> failover decision, the funding/budget gates, the
sandbox rule, leases over a compare-and-swap store, and the hash-chained action log.
Side effects (running a command, dispatching to HF/Kaggle/RunPod, writing the Hub) live in
supervisor.py / hub.py and are injected.
"""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import re
import uuid

UTC = datetime.timezone.utc


# ----------------------------------------------------------------------------- time / io
def utcnow():
    return datetime.datetime.now(UTC)


def iso(dt):
    return dt.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


_COMPACT_TS = re.compile(r"^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z$")


def parse_ts(s):
    """ISO-8601 (with Z or offset, optional fraction) -> aware datetime, else None.
    Also the compact basic form the flywheel stamps runs with: 20260926T010502Z (and ...T0105Z)."""
    if not isinstance(s, str) or not s:
        return None
    m = _COMPACT_TS.match(s.strip())
    if m:
        try:
            return datetime.datetime(*(int(x) for x in m.groups(default="0")), tzinfo=UTC)
        except ValueError:
            return None
    t = s.strip().replace("Z", "+00:00")
    m = re.match(r"^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})(\.\d+)?([+-]\d{2}:\d{2})?$", t)
    if not m:
        return None
    try:
        dt = datetime.datetime.fromisoformat(m.group(1).replace(" ", "T") + (m.group(3) or "+00:00"))
    except ValueError:
        return None
    return dt.astimezone(UTC)


def expand(p):
    return os.path.expandvars(os.path.expanduser(p)) if isinstance(p, str) else p


def load_config(path):
    """jobs.yaml is written in the JSON subset of YAML (so stdlib can read it); lines whose first
    non-blank character is '#' are comments."""
    with open(path) as fh:
        text = "".join(l for l in fh if not l.lstrip().startswith("#"))
    cfg = json.loads(text)
    ids = [j["id"] for j in cfg["jobs"]]
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        raise ValueError("duplicate job ids: %s" % dup)
    for j in cfg["jobs"]:
        for k in ("id", "host", "schedule", "command", "health", "supervise"):
            if k not in j:
                raise ValueError("job %s lacks %s" % (j.get("id"), k))
        if j["supervise"] not in ("active", "observe", "dormant", "self"):
            raise ValueError("job %s: supervise must be active|observe|dormant|self" % j["id"])
    return cfg


def atomic_write_json(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(obj, fh, indent=1, sort_keys=True)
        fh.flush()
        os.fsync(fh.fileno())
    os.replace(tmp, path)


def canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


# ----------------------------------------------------------------------------- action log
class ActionLog:
    """Append-only JSONL; each line carries prev (sha256 of the previous line's canonical bytes)
    and its own sha256, so the file is a hash chain whose head can be signed (board-sign takes a
    record hash). Lines are fsync'd before the call returns."""

    def __init__(self, path):
        self.path = path

    def _head(self):
        if not os.path.exists(self.path):
            return "0" * 64
        last = None
        with open(self.path, "rb") as fh:
            for line in fh:
                if line.strip():
                    last = line
        if last is None:
            return "0" * 64
        return json.loads(last)["sha256"]

    def append(self, rec):
        body = dict(rec)
        body["prev"] = self._head()
        body["sha256"] = sha256_bytes(canon(body).encode())
        with open(self.path, "a") as fh:
            fh.write(canon(body) + "\n")
            fh.flush()
            os.fsync(fh.fileno())
        return body

    def verify(self):
        prev = "0" * 64
        n = 0
        if not os.path.exists(self.path):
            return True, 0
        with open(self.path) as fh:
            for line in fh:
                if not line.strip():
                    continue
                r = json.loads(line)
                sha = r.pop("sha256")
                if r.get("prev") != prev or sha256_bytes(canon(r).encode()) != sha:
                    return False, n
                prev = sha
                n += 1
        return True, n


# ----------------------------------------------------------------------------- health
OK, STALE, FAILED, MISSING, UNMEASURED, PENDING, NOT_INSTALLED = (
    "OK", "STALE", "FAILED", "MISSING", "UNMEASURED", "PENDING_FIRST_RUN", "NOT_INSTALLED")
# NOOP: the job runs and exits clean, but its last N runs did nothing (0 items / UNCHANGED) - a
#       silent no-op is not OK. PAUSED: the job itself declared it cannot run (e.g. no GPU) and logged
#       that once. DISABLED: switched off on purpose (commented cron line / scheduler stanza).
# None of the three is BAD: a same-host retry cannot fix any of them.
NOOP, PAUSED, DISABLED = "NOOP", "PAUSED", "DISABLED"
BAD = (STALE, FAILED, MISSING, NOT_INSTALLED)
STATES = (OK, NOOP, PAUSED, DISABLED, PENDING, UNMEASURED, STALE, FAILED, MISSING, NOT_INSTALLED)
DEFAULT_FAIL_RE = r"\b(?:FAIL(?:ED)?|HALT|ALERT|ERROR|Traceback)\b|\brc=[1-9]\d*\b|\bexit=[1-9]\d*\b"


def _last_line(path):
    last = None
    with open(path, "rb") as fh:
        try:
            fh.seek(-4096, os.SEEK_END)
        except OSError:
            fh.seek(0)
        for line in fh.read().splitlines():
            if line.strip():
                last = line
    return last.decode("utf-8", "replace") if last is not None else None


def _tail_lines(path, n=40, nbytes=32768):
    with open(path, "rb") as fh:
        try:
            fh.seek(-nbytes, os.SEEK_END)
        except OSError:
            fh.seek(0)
        data = fh.read().splitlines()
    return [l.decode("utf-8", "replace") for l in data if l.strip()][-n:]


def _dig(d, dotted):
    for k in dotted.split("."):
        if not isinstance(d, dict):
            return None
        d = d.get(k)
    return d


def result_lines(lines, noop_cfg=None):
    """The lines that report a run's outcome: START/progress lines are not outcomes."""
    rr = (noop_cfg or {}).get("result_re")
    if rr:
        return [l for l in lines if re.search(rr, l)]
    return [l for l in lines if not re.search(r"\bSTART\b", l)]


def noop_from_lines(lines, cfg):
    """cfg {"patterns": [regex], "runs": N, "result_re": regex?}. NOOP when each of the last N result
    lines matches a no-op pattern. Returns a detail string or None."""
    if not cfg or not lines:
        return None
    res = result_lines(lines, cfg)
    n = int(cfg.get("runs", 3))
    if len(res) < n:
        return None
    pats = [re.compile(p) for p in cfg.get("patterns", [])]
    last = res[-n:]
    if pats and all(any(p.search(l) for p in pats) for l in last):
        return "NOOP: last %d runs exited clean having done nothing; last: %s" % (n, last[-1][:140])
    return None


def noop_from_results(results, cfg):
    """results: run-result dicts oldest->newest (clean runs only). cfg {"runs": N, "zero": [dotted],
    "same": [dotted]}: a run is a no-op when every `zero` field is 0/empty and every `same` field equals
    the previous run's. NOOP when the last N runs are all no-ops."""
    if not cfg:
        return None
    n = int(cfg.get("runs", 3))
    zero, same = cfg.get("zero") or [], cfg.get("same") or []
    need = n + (1 if same else 0)
    if len(results) < need:
        return None
    window = results[-need:]
    flags = []
    for i in range(len(window) - n, len(window)):
        r = window[i]
        ok = all(_dig(r, z) in (0, None, "", [], {}) for z in zero)
        if same:
            ok = ok and all(_dig(r, s) is not None and _dig(r, s) == _dig(window[i - 1], s) for s in same)
        flags.append(ok)
    if all(flags):
        what = ", ".join(["%s=0" % z for z in zero] + ["%s unchanged" % s for s in same])
        return "NOOP: last %d clean runs did nothing (%s)" % (n, what)
    return None


def _load_results(glob_pat, key):
    import glob
    out = []
    for p in sorted(glob.glob(expand(glob_pat.replace("{key}", key)))):
        try:
            with open(p) as fh:
                r = json.load(fh)
        except Exception:
            continue
        if isinstance(r, dict) and int(r.get("rc", 0) or 0) == 0 and not r.get("dry_run"):
            out.append(r)
    return out


def _pod_job(job, h, now, probes, res):
    if "pod_jobs" in probes:
        doc = probes["pod_jobs"]
    else:
        p = expand(h.get("path", "~/fleet/pod_jobs.json"))
        try:
            with open(p) as fh:
                doc = json.load(fh)
        except Exception:
            doc = None
    if not isinstance(doc, dict):
        return res(UNMEASURED, None, "no readable pod export: pod scheduler not observed from here")
    exp = parse_ts(doc.get("exported_at"))
    if exp is None or (now - exp).total_seconds() > h.get("export_max_age_s", 1800):
        return res(UNMEASURED, None, "pod export stale (exported_at %s): pod scheduler not observed" % doc.get("exported_at"))
    e = (doc.get("jobs") or {}).get(h["key"])
    if not isinstance(e, dict):
        return res(MISSING, None, "pod export has no entry %r" % h["key"])
    if e.get("disabled"):
        return res(DISABLED, None, "disabled on pod: %s" % str(e["disabled"])[:160])
    ps = parse_ts(e.get("paused_since"))
    if ps is not None:
        return res(PAUSED, (now - ps).total_seconds(), "%s since %s" % (e.get("paused_reason") or "PAUSED", e["paused_since"]))
    lines = [l for l in (e.get("tail") or []) if isinstance(l, str) and l.strip()]
    ts = parse_ts(e.get("last_ts"))
    if not lines or ts is None:
        return res(MISSING, None, "no log lines on the pod for %s" % h["key"])
    age = (now - ts).total_seconds()
    outcome = (result_lines(lines) or lines)[-1]  # the last non-START line: any HALT/FAIL counts
    if age > h.get("max_age_s", 5400):
        sm = parse_ts(e.get("stamp_mtime"))
        if sm is not None and (now - sm).total_seconds() <= h.get("max_age_s", 5400):
            # launched this period (scheduler stamp) yet wrote no log line: a silent no-op, not a dead job
            return res(NOOP, age, "NOOP: launched %s (stamp %s) but logged nothing since %s" % (e["stamp_mtime"], e.get("stamp"), e.get("last_ts")))
        return res(STALE, age, outcome[:160])
    if re.search(h.get("fail_re", DEFAULT_FAIL_RE), outcome):
        return res(FAILED, age, outcome[:160])
    nd = noop_from_lines(lines, h.get("noop"))
    if nd:
        return res(NOOP, age, nd)
    return res(OK, age, outcome[:160])


def evaluate_health(job, now, probes=None):
    """Return {"state", "age_s", "detail"}. Never guesses: no signal -> UNMEASURED.
    probes: optional dict of injected readers {"hf_last_modified": fn(repo, repo_type) -> datetime|None,
    "crontab": str}."""
    probes = probes or {}
    h = job["health"]
    kind = h.get("type", "none")
    max_age = h.get("max_age_s")
    nb = parse_ts(job.get("not_before"))

    def res(state, age=None, detail=""):
        if state in (MISSING, STALE) and nb and now < nb:
            state = PENDING
        return {"state": state, "age_s": None if age is None else int(age), "detail": detail}

    if kind == "disabled":
        return {"state": DISABLED, "age_s": None, "detail": h.get("why", "disabled")}

    # installation check first: a job whose cron line is gone is not "stale", it is not installed
    cm = job.get("cron_match")
    if cm and "crontab" in probes and probes["crontab"] is not None:
        if cm not in probes["crontab"]:
            return {"state": NOT_INSTALLED, "age_s": None, "detail": "no crontab line contains %r" % cm}

    if kind == "none":
        return res(UNMEASURED, None, h.get("why", "no health signal defined"))
    if kind == "remote":
        return res(UNMEASURED, None, "signal lives on %s; not readable from this host" % job["host"])
    if kind == "pod_job":
        return _pod_job(job, h, now, probes, res)

    if kind == "hf_repo_fresh":
        fn = probes.get("hf_last_modified")
        if fn is None:
            return res(UNMEASURED, None, "no hub reader on this host")
        try:
            lm = fn(h["repo"], h.get("repo_type", "dataset"))
        except Exception as e:  # network failure is not a job failure
            return res(UNMEASURED, None, "hub read failed: %s" % type(e).__name__)
        if lm is None:
            return res(MISSING, None, "repo %s has no commits" % h["repo"])
        age = (now - lm).total_seconds()
        return res(OK if age <= max_age else STALE, age, "last commit %s" % iso(lm))

    if kind == "dated_file":
        # a dated output that must exist by a daily deadline: path has <date>; the date due is (the last deadline
        # passed) minus lag_days. E.g. capsule chain: yesterday's measurement index by 09:00Z. Absent = MISSING (BAD).
        lag = int(h.get("lag_days", 1))
        hh, mm = (int(x) for x in str(h.get("deadline_utc", "09:00")).split(":"))
        cut = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
        ref = now if now >= cut else now - datetime.timedelta(days=1)
        due = (ref - datetime.timedelta(days=lag)).strftime("%Y-%m-%d")
        dp = expand(str(h.get("path", "")).replace("<date>", due))
        if dp and os.path.exists(dp):
            return res(OK, now.timestamp() - os.path.getmtime(dp),
                       "%s present (due by %sT%02d:%02dZ)" % (os.path.basename(dp), ref.strftime("%Y-%m-%d"), hh, mm))
        return res(MISSING, None, "ALERT no %s: the %s output was due by %sT%02d:%02dZ (%s)"
                   % (dp, due, ref.strftime("%Y-%m-%d"), hh, mm, h.get("why", "a missed day")))

    path = expand(h.get("path"))
    if not path or not os.path.exists(path):
        return res(MISSING, None, "%s absent" % path)

    if kind == "file_mtime":
        age = now.timestamp() - os.path.getmtime(path)
        st = OK if age <= max_age else STALE
        bad = h.get("bad_if_last_line_contains")
        if st == OK and bad:
            ll = _last_line(path) or ""
            if any(b in ll for b in bad):
                return res(FAILED, age, "last line: %s" % ll[:160])
        if st == OK and h.get("noop"):
            nd = noop_from_lines(_tail_lines(path), h["noop"])
            if nd:
                return res(NOOP, age, nd)
        return res(st, age, "mtime")

    if kind in ("json_field_age", "status_json_job"):
        try:
            with open(path) as fh:
                d = json.load(fh)
        except Exception as e:
            return res(FAILED, None, "unreadable json: %s" % type(e).__name__)
        if kind == "status_json_job":
            d = (d.get("jobs") or d).get(h["key"]) if isinstance(d, dict) else None
            if not isinstance(d, dict):
                return res(MISSING, None, "no entry %r" % h["key"])
        raw = d.get(h["field"])
        if raw is None:
            # never succeeded yet: absent, not broken (not_before turns this into PENDING_FIRST_RUN)
            return res(MISSING, None, "field %s absent (no successful run recorded; last result %s)" % (h["field"], d.get("result")))
        ts = parse_ts(raw)
        if ts is None:
            return res(FAILED, None, "field %s unparseable: %r" % (h["field"], str(raw)[:40]))
        age = (now - ts).total_seconds()
        for fld, badvals in (h.get("fail_if") or {}).items():
            if str(d.get(fld)) in [str(b) for b in badvals]:
                return res(FAILED, age, "%s=%s" % (fld, d.get(fld)))
        for fld, goodvals in (h.get("fail_unless") or {}).items():
            if str(d.get(fld)) not in [str(g) for g in goodvals]:
                return res(FAILED, age, "%s=%s (last run; last success %s)" % (fld, d.get(fld), raw))
        if age > max_age:
            return res(STALE, age, "%s=%s" % (h["field"], raw))
        nc = h.get("noop")
        if nc and nc.get("history_glob"):
            nd = noop_from_results(_load_results(nc["history_glob"], h.get("key", job["id"])), nc)
            if nd:
                return res(NOOP, age, nd)
        return res(OK, age, "%s=%s result=%s" % (h["field"], raw, d.get("result")))

    if kind == "log_last_line":
        ll = _last_line(path)
        if ll is None:
            return res(MISSING, None, "empty log")
        ts = parse_ts(ll.split()[0]) if ll.split() else None
        if ts is None:
            return res(FAILED, None, "last line has no leading timestamp: %s" % ll[:120])
        age = (now - ts).total_seconds()
        if age > max_age:
            return res(STALE, age, ll[:160])
        mc = h.get("must_contain")
        if mc and mc not in ll:
            return res(FAILED, age, ll[:160])
        if h.get("noop"):
            nd = noop_from_lines(_tail_lines(path), h["noop"])
            if nd:
                return res(NOOP, age, nd)
        return res(OK, age, ll[:160])

    return res(UNMEASURED, None, "unknown health type %s" % kind)


# ----------------------------------------------------------------------------- gates
def funding_level(policy, now):
    """Read the funding watchdog's state. Missing / stale / unreadable => 'UNKNOWN' (treated as not GREEN)."""
    b = policy.get("budget", {})
    p = expand(b.get("funding_state", "~/fleet/runpod_funding.json"))
    try:
        with open(p) as fh:
            d = json.load(fh)
    except Exception:
        return "UNKNOWN", "funding state unreadable"
    ts = parse_ts(d.get("at"))
    if ts is None or (now - ts).total_seconds() > b.get("funding_max_age_s", 3600):
        return "UNKNOWN", "funding state stale (%s)" % d.get("at")
    return str(d.get("level", "UNKNOWN")), "runway_h=%s" % d.get("runway_h")


def budget_ok(policy, state, target_type, flavor, now):
    """Per-day dispatch caps. Returns (ok, why)."""
    b = policy.get("budget", {})
    day = now.strftime("%Y-%m-%d")
    used = state.setdefault("budget", {}).get(day, {})
    if target_type == "hf_job":
        key = "hf_jobs_cpu" if str(flavor or "cpu-basic").startswith("cpu") else "hf_jobs_gpu"
    else:
        key = target_type
    cap = b.get("caps_per_day", {}).get(key, 0)
    n = used.get(key, 0)
    if n >= cap:
        return False, "budget cap %s=%s/day reached (%s used)" % (key, cap, n)
    return True, "%s %s/%s today" % (key, n, cap)


def budget_charge(state, target_type, flavor, now):
    day = now.strftime("%Y-%m-%d")
    key = ("hf_jobs_cpu" if str(flavor or "cpu-basic").startswith("cpu") else "hf_jobs_gpu") if target_type == "hf_job" else target_type
    b = state.setdefault("budget", {})
    for d in list(b):
        if d < (now - datetime.timedelta(days=7)).strftime("%Y-%m-%d"):
            del b[d]
    b.setdefault(day, {})[key] = b.get(day, {}).get(key, 0) + 1


def target_allowed(job, target, policy, state, now):
    """Every rule that can refuse a dispatch, in one place. Returns (ok, why)."""
    t = target["type"]
    cls = job.get("class", "production")
    if cls == "experimental":
        # proofof.ai twin rules: default-deny, no production credentials, only the twin runner
        if t != "proofof_twin" or target.get("secrets"):
            return False, "REFUSED sandbox rule: experimental jobs run only on the proofof.ai twin, with no credentials"
    if target.get("secrets") and cls not in ("production", "measurement"):
        return False, "REFUSED: %s job may not receive secrets" % cls
    if job.get("gpu") and t == "hf_job" and not str(target.get("flavor", "")).startswith(("t4", "a10", "a100", "l4", "l40", "h1", "h2")):
        return False, "gpu job needs a GPU flavor"
    if t in ("runpod_backup", "runpod_pod"):
        lvl, why = funding_level(policy, now)
        need = policy.get("budget", {}).get("runpod_requires_level", "GREEN")
        if lvl != need:
            return False, "RunPod blocked: funding %s (%s), need %s" % (lvl, why, need)
    if t == "kaggle" and not target.get("kernel_dir"):
        return False, "no Kaggle kernel artifact for this job"
    if t in ("hf_job", "runpod_backup") and not job.get("portable"):
        return False, "job has no portable implementation"
    ok, why = budget_ok(policy, state, t, target.get("flavor"), now)
    if not ok:
        return False, why
    return True, why


# ----------------------------------------------------------------------------- decision
def decide(job, health, jstate, policy, now, this_host):
    """Pure decision for one job. Returns one of:
       ("none", why) | ("record", why) | ("retry", why) | ("failover", why) | ("wait", why)"""
    sup = job["supervise"]
    st = health["state"]
    if st not in BAD:
        return ("none", "healthy" if st == OK else st)
    if sup != "active":
        return ("record", "%s (%s, not auto-acted)" % (st, sup))
    if st == NOT_INSTALLED:
        return ("record", "cron line missing: an install is a human/lane act, not a retry")
    retry_cfg = policy.get("retry", {})
    max_retry = retry_cfg.get("same_host_max", 1)
    retries = jstate.get("retries", [])
    if job["host"] == this_host and len(retries) < max_retry:
        return ("retry", "%s -> retry %d/%d on %s" % (st, len(retries) + 1, max_retry, this_host))
    last_retry = parse_ts(retries[-1]) if retries else None
    wait_s = job.get("retry_wait_s", retry_cfg.get("wait_s", 1200))
    if last_retry and (now - last_retry).total_seconds() < wait_s:
        return ("wait", "retried at %s; waiting %ss for its health signal" % (retries[-1], wait_s))
    fo = jstate.get("failovers", [])
    cool = job.get("failover_cooldown_s", job["health"].get("max_age_s") or 3600)
    if fo:
        last = parse_ts(fo[-1].get("at"))
        if last and (now - last).total_seconds() < cool and fo[-1].get("status") in ("DISPATCHED", "SUCCEEDED", "RUNNING"):
            return ("wait", "failover %s at %s covers this period" % (fo[-1].get("target"), fo[-1].get("at")))
    if not job.get("failover"):
        return ("record", "%s after retry; no failover target configured" % st)
    return ("failover", "%s after retry -> failover chain" % st)


def pick_target(job, jstate, policy, state, now):
    """First target in the chain that passes every gate and has not already failed in this bad streak."""
    tried_failed = {f["target"] for f in jstate.get("failovers", []) if f.get("status") in ("FAILED", "ERROR")}
    refusals = []
    for tgt in job.get("failover", []):
        name = tgt.get("name", tgt["type"])
        if name in tried_failed:
            refusals.append((name, "already failed this streak"))
            continue
        ok, why = target_allowed(job, tgt, policy, state, now)
        if ok:
            return tgt, refusals
        refusals.append((name, why))
    return None, refusals


# ----------------------------------------------------------------------------- leases
class LeaseStore:
    """Interface: get(path) -> (obj|None, rev); put({path: obj}, parent_rev) -> bool (False on CAS conflict)."""

    def get(self, path):  # pragma: no cover - interface
        raise NotImplementedError

    def put(self, files, parent_rev, message=""):  # pragma: no cover - interface
        raise NotImplementedError


def lease_state(lease, now):
    if not lease:
        return "FREE"
    exp = parse_ts(lease.get("expires_at"))
    if exp is None or exp <= now:
        return "EXPIRED"
    return "HELD"


def take_lease(store, name, holder, ttl_s, now, extra_files=None, message=None):
    """Take or renew lease `name` for `holder`. CAS on the store revision: two supervisors racing
    for the same lease cannot both win. Returns (won, lease_obj_or_current_holder)."""
    path = "lease/%s.json" % name
    for _ in range(3):
        cur, rev = store.get(path)
        if lease_state(cur, now) == "HELD" and cur.get("holder") != holder:
            return False, cur
        new = {"name": name, "holder": holder, "taken_at": iso(now),
               "expires_at": iso(now + datetime.timedelta(seconds=ttl_s)), "nonce": uuid.uuid4().hex}
        files = {path: new}
        files.update(extra_files or {})
        if store.put(files, rev, message or "lease %s -> %s" % (name, holder)):
            back, _ = store.get(path)
            if back and back.get("nonce") == new["nonce"]:
                return True, new
            return False, back
    return False, store.get(path)[0]


def release_lease(store, name, holder, now):
    path = "lease/%s.json" % name
    cur, rev = store.get(path)
    if not cur or cur.get("holder") != holder:
        return False
    rel = dict(cur, expires_at=iso(now), released_at=iso(now))
    return store.put({path: rel}, rev, "release %s by %s" % (name, holder))


class MemoryStore(LeaseStore):
    """In-memory CAS store (tests, dry runs)."""

    def __init__(self):
        self.files, self.rev = {}, 0

    def get(self, path):
        o = self.files.get(path)
        return (json.loads(json.dumps(o)) if o is not None else None), str(self.rev)

    def put(self, files, parent_rev, message=""):
        if parent_rev is not None and str(parent_rev) != str(self.rev):
            return False
        for k, v in files.items():
            self.files[k] = json.loads(json.dumps(v))
        self.rev += 1
        return True


# ----------------------------------------------------------------------------- spray assignment
def host_of(url):
    m = re.match(r"^[a-z]+://([^/:?#]+)", url or "", re.I)
    return m.group(1).lower() if m else ""


def assign_by_host(rows, runners):
    """Split rows across runners BY HOST (a host is never on two runners), balancing endpoint
    counts greedily, deterministic: hosts by (-count, host); ties go to the earlier runner."""
    by_host = {}
    for r in rows:
        by_host.setdefault(host_of(r["endpoint"]), []).append(r)
    load = {k: 0 for k in runners}
    shards = {k: [] for k in runners}
    for h in sorted(by_host, key=lambda h: (-len(by_host[h]), h)):
        k = min(runners, key=lambda r: (load[r], runners.index(r)))
        shards[k].extend(sorted(by_host[h], key=lambda r: r["endpoint"]))
        load[k] += len(by_host[h])
    return shards


def merge_verdict(plan, manifests):
    """plan: {"shards": {name: {"endpoints": [...], "hosts": [...]}}}; manifests: {name: manifest|None}
    (manifest includes endpoints_seen, results_sha256, results_sha256_recomputed, states).
    COMPLETE only if every shard arrived, verified, covers exactly its endpoints, hosts disjoint.
    Otherwise PARTIAL and totals is None - a partial read is never totalled."""
    problems = []
    seen_hosts = {}
    for name, sh in plan["shards"].items():
        for h in sh["hosts"]:
            if h in seen_hosts:
                problems.append("host %s on two shards (%s, %s)" % (h, seen_hosts[h], name))
            seen_hosts[h] = name
    per = {}
    for name, sh in plan["shards"].items():
        m = manifests.get(name)
        if not m:
            problems.append("shard %s missing" % name)
            per[name] = "MISSING"
            continue
        if m.get("results_sha256") != m.get("results_sha256_recomputed"):
            problems.append("shard %s results sha256 mismatch" % name)
            per[name] = "CORRUPT"
            continue
        if sorted(m.get("endpoints_seen", [])) != sorted(sh["endpoints"]):
            problems.append("shard %s covered %d of %d endpoints" % (name, len(set(m.get("endpoints_seen", [])) & set(sh["endpoints"])), len(sh["endpoints"])))
            per[name] = "INCOMPLETE"
            continue
        per[name] = "ARRIVED"
    if problems:
        return {"state": "PARTIAL", "totals": None, "per_shard": per, "problems": problems}
    totals = {}
    for name in plan["shards"]:
        for k, v in (manifests[name].get("states") or {}).items():
            totals[k] = totals.get(k, 0) + v
    n = sum(len(sh["endpoints"]) for sh in plan["shards"].values())
    return {"state": "COMPLETE", "totals": totals, "n_endpoints": n, "per_shard": per, "problems": []}
