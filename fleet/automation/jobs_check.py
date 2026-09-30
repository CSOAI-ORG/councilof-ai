#!/usr/bin/env python3
"""jobs_check.py -- evaluate the expected-output checks in JOBS.json for the jobs of ONE host (read-only).

Lane automation-runpod-20260928. Stdlib only; Python >= 3.8. Reads files, writes nothing unless --out is given.
Verdict per job: OK (every evaluable check passes) | BAD (a check failed) | UNMEASURED (nothing evaluable here).
A check this host cannot read (Mac launchd/Hermes, HF, supervisor-only types) is UNMEASURED, never OK.
mtime alone never makes a job OK when the job also carries a content check (log_last_line / novelty).

Usage: jobs_check.py JOBS.json [--host oracle-micro-2] [--now ISO] [--out FILE] [--print]
       jobs_check.py --selftest   (must-CATCH cases; exit 1 if any guard fails to go red)
Exit 0 always unless the script itself breaks (it is a reader, not a gate).
"""
import glob, json, os, re, socket, sys
from datetime import datetime, timedelta, timezone

WEAK = {"file_mtime"}


def parse_iso(s):
    s = s.strip()
    if re.match(r"^\d{8}T\d{6}Z$", s):
        return datetime.strptime(s, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
    s = s.replace("Z", "+00:00")
    if "." in s:
        head, tail = s.split(".", 1)
        tz = re.search(r"[+-]\d\d:\d\d$", tail)
        s = head + (tz.group(0) if tz else "+00:00")
    d = datetime.fromisoformat(s)
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


ON_POD = os.path.isdir("/workspace/staging")


def exp(p):
    if p and p.startswith("pod:"):
        p = p[4:] if ON_POD else "/workspace/__not_on_this_host__" + p[4:]
    return os.path.expanduser(p) if p else p


def last_line(path, cap=65536):
    with open(path, "rb") as f:
        f.seek(0, 2)
        n = f.tell()
        f.seek(max(0, n - cap))
        lines = [l for l in f.read().decode("utf-8", "replace").splitlines() if l.strip()]
    return lines[-1] if lines else ""


def age_s(path, now):
    return (now - datetime.fromtimestamp(os.path.getmtime(path), timezone.utc)).total_seconds()


def check(c, now, novelty):
    t = c.get("type")
    try:
        if t in ("log_last_line", "pod_log_last_line"):
            p = exp(c["path"])
            if not os.path.exists(p):
                soft = t == "pod_log_last_line" or c.get("absent_ok") or p.startswith("/workspace")
                return ("UNMEASURED" if soft else "BAD"), "absent: " + p
            a = age_s(p, now)
            ll = last_line(p)
            if c.get("max_age_s") and a > c["max_age_s"]:
                return "BAD", "stale %ds > %ds: %s" % (a, c["max_age_s"], ll[:120])
            if c.get("bad_regex") and re.search(c["bad_regex"], ll):
                return "BAD", "bad line: " + ll[:160]
            if c.get("ok_regex") and not re.search(c["ok_regex"], ll):
                return "BAD", "no ok match: " + ll[:160]
            if c.get("must_contain") and c["must_contain"] not in ll:
                return "BAD", "missing %r: %s" % (c["must_contain"], ll[:160])
            return "OK", ll[:160]
        if t == "json_field_age":
            p = exp(c["path"])
            if not os.path.exists(p):
                return "BAD", "absent: " + p
            v = json.load(open(p)).get(c["field"])
            if not v:
                return "BAD", "field %s missing" % c["field"]
            a = (now - parse_iso(str(v))).total_seconds()
            return ("OK" if a <= c.get("max_age_s", 86400) else "BAD"), "%s=%s age=%ds" % (c["field"], v, a)
        if t == "status_json_job":
            d = json.load(open(exp(c["path"])))
            d = (d.get("jobs") if isinstance(d.get("jobs"), dict) else d).get(c["key"]) or {}
            v = d.get(c.get("field", "last_success"))
            if not v:
                return "BAD", "no %s for %s" % (c.get("field"), c["key"])
            a = (now - parse_iso(str(v))).total_seconds()
            return ("OK" if a <= c.get("max_age_s", 86400) else "BAD"), "%s age=%ds" % (c["key"], a)
        if t == "pod_job":
            src = exp(c.get("source") or c.get("path") or "~/fleet/pod_jobs.json")
            d = json.load(open(src))
            ea = (now - parse_iso(d["exported_at"])).total_seconds()
            lim = c.get("export_max_age_s") or c.get("max_export_age_s") or 7200
            if ea > lim:
                return "BAD", "pod export %ds old (> %ds): host not reporting" % (ea, lim)
            j = d["jobs"].get(c.get("key") or "") or {}
            return ("BAD" if j.get("paused_reason") else "OK"), "paused=%s last=%s" % (j.get("paused_reason"), j.get("last_ts"))
        if t == "file_mtime":
            p = exp(c["path"])
            if p.startswith("/workspace") and not os.path.exists(p):
                return "UNMEASURED", "pod path not on this host: " + p
            if "<" in p:
                return "UNMEASURED", "templated path"
            if not os.path.exists(p):
                return ("UNMEASURED" if p.startswith("/workspace") else "BAD"), "absent: " + p
            a = age_s(p, now)
            ok = not c.get("max_age_s") or a <= c["max_age_s"]
            return ("OK" if ok else "BAD"), "mtime age=%ds (weak: not content)" % a
        if t == "dated_file":
            p = exp(c.get("path") or c.get("pattern") or "")
            days = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in (0, 1)]
            hits = []
            for d in days:
                q = p.replace("<date>", d).replace("<D>", d)
                q = re.sub(r"<[^>]+>", "*", q)
                hits += glob.glob(q.rstrip("/") + ("/*" if q.endswith("/") else ""))
            return ("OK" if hits else "BAD"), ("%d file(s) for %s" % (len(hits), "/".join(days)))
        if t == "novelty":
            if not c.get("job"):
                return "UNMEASURED", "job not yet in output_novelty.json"
            if novelty is None:
                return "UNMEASURED", "no ~/fleet/output_novelty.json on this host"
            n = novelty.get(c["job"])
            if not n:
                return "UNMEASURED", "job absent from novelty"
            return ("OK" if n.get("verdict") in c.get("ok_verdicts", []) else "BAD"), "verdict=%s newest=%s" % (n.get("verdict"), n.get("newest_output"))
        if t in ("disabled", "none"):
            return "SKIP", t
        return "UNMEASURED", "type %s not evaluated here (supervisor or other host)" % t
    except Exception as e:  # a reader never crashes on one bad check
        return "UNMEASURED", "%s: %s" % (type(e).__name__, str(e)[:120])


def selftest():
    """must-CATCH cases: each guard is shown to go red before it is trusted (memory silent-no-op-guards)."""
    import tempfile, time
    d = tempfile.mkdtemp(prefix="jobs_check_selftest_")
    now = datetime.now(timezone.utc)
    def w(name, text, age=0):
        p = os.path.join(d, name)
        open(p, "w").write(text)
        t = time.time() - age
        os.utime(p, (t, t))
        return p
    ok = w("ok.log", "x\n2026 rc=0 DONE\n")
    bad = w("bad.log", "2026 rc=1 state=FAILED step=x\n")
    old = w("old.log", "2026 rc=0 DONE\n", age=90000)
    js = w("s.json", json.dumps({"at": (now - timedelta(hours=30)).strftime("%Y-%m-%dT%H:%M:%SZ")}))
    nov = {"p": {"verdict": "NO_NEW_OUTPUT"}, "q": {"verdict": "NEW"}}
    cases = [
        ({"type": "log_last_line", "path": ok, "must_contain": "rc=0", "max_age_s": 3600}, "OK"),
        ({"type": "log_last_line", "path": bad, "bad_regex": r"state=FAILED|\brc=[1-9]", "max_age_s": 3600}, "BAD"),
        ({"type": "log_last_line", "path": old, "max_age_s": 3600}, "BAD"),
        ({"type": "log_last_line", "path": os.path.join(d, "absent.log"), "max_age_s": 3600}, "BAD"),
        ({"type": "log_last_line", "path": os.path.join(d, "absent.log"), "absent_ok": True}, "UNMEASURED"),
        ({"type": "json_field_age", "path": js, "field": "at", "max_age_s": 3600}, "BAD"),
        ({"type": "novelty", "job": "p", "ok_verdicts": ["NEW"]}, "BAD"),
        ({"type": "novelty", "job": "q", "ok_verdicts": ["NEW"]}, "OK"),
        ({"type": "launchd", "label": "x"}, "UNMEASURED"),
    ]
    fails = 0
    for c, want in cases:
        got, why = check(c, now, nov)
        if got != want:
            fails += 1
            print("SELFTEST FAIL %s want=%s got=%s (%s)" % (c["type"], want, got, why))
    # job-level: an mtime-only pass must not read as OK
    reg = {"jobs": [{"id": "m", "host": "h", "expected_output": [{"type": "file_mtime", "path": ok, "max_age_s": 3600}]}]}
    rp = w("reg.json", json.dumps(reg))
    import io, contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        main([rp, "--host", "h", "--print"])
    if '"UNMEASURED": 1' not in buf.getvalue():
        fails += 1
        print("SELFTEST FAIL mtime-only job did not read UNMEASURED: " + buf.getvalue()[:200])
    print("selftest: %d/%d passed" % (len(cases) + 1 - fails, len(cases) + 1))
    return 1 if fails else 0


def main(argv):
    if argv and argv[0] == "--selftest":
        return selftest()
    if not argv or argv[0].startswith("-"):
        print(__doc__)
        return 2
    reg = json.load(open(argv[0]))
    host = argv[argv.index("--host") + 1] if "--host" in argv else socket.gethostname()
    now = parse_iso(argv[argv.index("--now") + 1]) if "--now" in argv else datetime.now(timezone.utc)
    nov = None
    np_ = os.path.expanduser("~/fleet/output_novelty.json")
    if os.path.exists(np_):
        d = json.load(open(np_))
        js = d["jobs"] if isinstance(d["jobs"], list) else list(d["jobs"].values())
        nov = {j["id"]: j for j in js}
    res, counts = [], {}
    for j in reg["jobs"]:
        if j.get("host") != host:
            continue
        cs = []
        for c in j.get("expected_output", []):
            v, why = check(c, now, nov)
            cs.append({"type": c.get("type"), "verdict": v, "detail": why})
        ev = [c for c in cs if c["verdict"] in ("OK", "BAD")]
        strong = [c for c in ev if c["type"] not in WEAK]
        if any(c["verdict"] == "BAD" for c in strong):
            v = "BAD"
        elif any(c["verdict"] == "BAD" for c in ev):
            v = "WARN"  # only a weak (mtime) check failed
        elif strong:
            v = "OK"
        elif ev:
            v = "UNMEASURED"  # only an mtime passed: not proof of new output
        else:
            v = "SKIP" if cs and all(c["verdict"] == "SKIP" for c in cs) else "UNMEASURED"
        counts[v] = counts.get(v, 0) + 1
        res.append({"id": j["id"], "status_in_registry": j.get("status"), "verdict": v, "checks": cs})
    out = {"schema": "csoai.jobs-check/0.1", "at": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "host": host,
           "registry": os.path.abspath(argv[0]), "registry_generated_at": reg.get("generated_at"), "counts": counts, "jobs": res}
    if "--out" in argv:
        p = argv[argv.index("--out") + 1]
        tmp = p + ".tmp"
        json.dump(out, open(tmp, "w"), indent=1)
        os.replace(tmp, p)
    if "--print" in argv or "--out" not in argv:
        print(json.dumps({"at": out["at"], "host": host, "counts": counts}))
        for r in res:
            if r["verdict"] != "OK":
                print("%-10s %s  %s" % (r["verdict"], r["id"], "; ".join("%s=%s" % (c["type"], c["verdict"]) for c in r["checks"])))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
