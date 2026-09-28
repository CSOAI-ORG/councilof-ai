#!/usr/bin/env python3
"""output-novelty.py -- did each scheduled job produce NEW output, or only a fresh mtime? (ops-guard lane, 2026-09-28)

The fleet supervisor judges many jobs OK on a file mtime. A job that rewrites the same bytes every run, or appends the
same line with a new timestamp, is green there and does nothing. This reads each job's OUTPUT and compares content,
with run timestamps normalised away, against the job's previous output. It retires nothing, retries nothing and
writes nothing outside ~/lanes/logs/output-novelty.log, ~/lanes/state/output-novelty.json and ~/fleet/output_novelty.json.

Jobs come from: `crontab -l` (active lines), ~/fleet/sv/jobs.yaml (outputs + health path, matched by cron_match),
~/fleet/pod_jobs.json (the 3090 pod loops' last export: tails only), and, with --pod, one read-only ssh to the build pod
(~/fleet/build-pod.env) for the pod-side logs of the Oracle-triggered build-pod jobs.

Per target:
  log   (.log/.txt/.jsonl/.out, or any file > 8 MB): bytes appended since the last run, each line normalised
        (ISO datetimes, clock times, compact stamps, epochs, durations -> placeholders; bare dates are kept, since a
        new date is new output for a daily job);
        NEW if any appended line is not among the ~128 KB of lines before it, REPEAT if every one is. Lines carrying
        FAILED/ERROR/SKIP/HALT/PAUSED/HOLD/Traceback are not output: a job that only logs failures is REPEAT.
        First observation: the newest 20% of the last 400 lines vs the rest (basis=bootstrap).
  json  (<= 8 MB): canonical JSON minus volatile keys (at, *_at, ts, generated*, as_of, signature, ...) and with
        ISO datetime values masked; hash vs the previous run (or vs the previous dated sibling on first sight).
  dated (a path with <date>/<H>/...): newest match vs the previous match, same normalisation.
  dir   : set of (relpath, size) of up to 3000 files, depth <= 3.
Per job: verdict from its data outputs (json/dated/dir/file) when it has any, else from its logs.
  NEW | NO_NEW_OUTPUT (ran, but every output repeats) | NO_RUN_EVIDENCE (nothing touched in 2x period + 1 h)
  | FIRST_SEEN | UNMEASURED (no readable local output) | HOST_STOPPED (pod export older than 2 h).
  A target listed by more than one job (e.g. flywheel.log, flywheel_status.json) is marked shared and used only when
  the job has no target of its own, so one job's output is never credited to its siblings.
  LOCK_STALE+<verdict>: the cron line is `flock -n <lock> ...` and the lock is held by a process older than the job's
  grace window (2x period + 1 h). flock -n then skips every run silently -- cron fires, the job body never starts.
  The holder's pid, start time and command are recorded; nothing is killed.
Usage: output-novelty.py [--pod] [--print]     exit 0 always unless the script itself breaks.
"""
import base64, fnmatch, glob, hashlib, json, os, re, subprocess, sys, time
from datetime import datetime, timezone, timedelta

HOME = os.path.expanduser("~")
LOG = os.path.join(HOME, "lanes/logs/output-novelty.log")
STATE = os.path.join(HOME, "lanes/state/output-novelty.json")
OUT = os.path.join(HOME, "fleet/output_novelty.json")
JOBS = os.path.join(HOME, "fleet/sv/jobs.yaml")
PODJOBS = os.path.join(HOME, "fleet/pod_jobs.json")
BUILDENV = os.path.join(HOME, "fleet/build-pod.env")
if os.environ.get("NOVELTY_SANDBOX"):  # test mode: write only under this dir
    _sb = os.environ["NOVELTY_SANDBOX"]
    LOG, STATE, OUT = (os.path.join(_sb, "output-novelty.log"), os.path.join(_sb, "state.json"),
                       os.path.join(_sb, "output_novelty.json"))
TAIL = 256 * 1024
PRIOR = 128 * 1024
APPEND_CAP = 1024 * 1024
JSON_MAX = 8 * 1024 * 1024
# Oracle-triggered jobs whose real output is a log on the build pod (read-only, with --pod)
POD_TARGETS = {
    "auto-land-trigger.sh": "/workspace/staging/logs/auto-land.log",
    "cf-oauth-refresh-trigger.sh": "/workspace/staging/logs/cf-oauth-refresh.log",
    "root-daily-trigger.sh": "/workspace/staging/logs/root-daily/",
    "capsule-publish-20260928/trigger.sh": "/workspace/staging/logs/capsule-publish/",
}

# cron lines that write to /dev/null: where their output really lands (read from each script, 28 Sep)
EXTRA_TARGETS = {
    "cf-oauth-refresh-trigger.sh": ["~/lanes/logs/cf-oauth-refresh-trigger.log"],
    "daily-note-announce.sh": ["~/lanes/logs/daily-note.log"],
    "proofof-daily.sh": ["~/lanes/logs/proofof-daily.log"],
    "root-daily-trigger.sh": ["~/lanes/logs/root-daily-trigger.log"],
    "listings-page-20260927/oracle-ship.sh": ["~/lanes/logs/listings-publish.log"],
    "public-signals-20260926/run.sh": ["~/lanes/logs/public-signals.log", "/evac-bulk/public-signals/<date>/"],
    "pypi-footprint-20260927/run.sh": ["~/lanes/logs/pypi-footprint.log"],
    "ux-gauntlet-20260926/run-on-pod.sh": ["~/lanes/logs/ux-gauntlet.log", "/evac-bulk/ux-gauntlet/runs/<date>/results.json"],
    "x402-buyer-canary-20260928/run.sh": ["~/lanes/logs/x402-buyer-canary.log"],
    "admit-dryrun/run.sh": ["~/lanes/logs/admit-dryrun.log"],
    "sov-resolve-daily.sh": ["/evac-bulk/sov-resolve/sov-resolve.log"],
    "eat_remote_battery.sh": ["~/eat_remote.log"],
    "oracle_daily_index.sh": ["~/oracle-daily-index.log", "/tmp/oracle-index/daily.json"],
    "tool-drift-20260926/run-on-pod.sh": ["~/lanes/logs/tool-drift.log"],
    "self-parity-20260926": ["~/lanes/logs/self-parity.log"],
    "ops-guard-20260928/bin/runpod-balance-alert.py": ["~/lanes/logs/runpod-balance-alert.log", "~/fleet/runpod_balance_alert.json"],
    "ops-guard-20260928/bin/prod-canary.py": ["~/lanes/logs/prod-canary.log", "~/fleet/prod_canary.json"],
    "ops-guard-20260928/bin/output-novelty.py": ["~/fleet/output_novelty.json"],
}
# jobs whose output is a verdict about something else: an unchanged verdict is expected, reported apart from producers
CHECK_JOBS = ("verify-record", "root-check", "gspc-public-witness", "oracle-fleet-status", "fleet-supervisor",
              "honey-verify", "cf-oauth-refresh", "gcp-evac-watcher", "dc-remote",
              "prod-canary", "runpod-balance-alert", "output-novelty", "x402-buyer-canary", "domain-watch")

NOW = datetime.now(timezone.utc)
TODAY = NOW.strftime("%Y-%m-%d")
YDAY = (NOW - timedelta(days=1)).strftime("%Y-%m-%d")
_SUBS = [
    (re.compile(r"\d{4}-\d{2}-\d{2}[T _]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?"), "<T>"),
    (re.compile(r"\b\d{4}-\d{2}-\d{2}T\d{2}\b"), "<T>"),
    (re.compile(r"\b20\d{6}T\d{2,6}Z?\b"), "<T>"),
    (re.compile(r"\b\d{1,2}:\d{2}:\d{2}(?:\.\d+)?\b"), "<t>"),
    (re.compile(r"\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b"), ""),
    (re.compile(r"\b1[6-9]\d{8}(?:\.\d+|\d{3})?\b"), "<E>"),
    (re.compile(r"\b\d+(?:\.\d+)?\s?(?:ms|s|sec|secs|seconds|min|mins|minutes)\b"), "<dur>"),
    (re.compile(r"\b(pid|PID)[=: ]\d+"), r"\1=<n>"),
    (re.compile(r"/tmp/tmp[\w.-]+"), "<tmp>"),
]
_VOLATILE = re.compile(r"(^|_)(at|ts|time|timestamp|date|generated|as_of|checked|updated|now|elapsed|duration|took|"
                       r"started|finished|run_id|age|nonce|signature|sig|signed|exported|last_run|mtime|stamp|utc)($|_|s$)",
                       re.I)
_ISO = re.compile(r"^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}")
_COMPACT = re.compile(r"^20\d{6}T\d{4,6}Z?$")


def iso(t):
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def norm_line(s):
    for rx, rep in _SUBS:
        s = rx.sub(rep, s)
    return " ".join(s.split())


def norm_json(x):
    if isinstance(x, dict):
        return {k: norm_json(v) for k, v in sorted(x.items()) if not _VOLATILE.search(k)}
    if isinstance(x, list):
        return [norm_json(v) for v in x]
    if isinstance(x, str) and (_ISO.match(x) or _COMPACT.match(x)):
        return "<T>"
    if isinstance(x, str):
        return norm_line(x)
    return x


def h(b):
    return hashlib.sha256(b if isinstance(b, bytes) else b.encode()).hexdigest()[:16]


def kind_of(path):
    if path.endswith("/") or os.path.isdir(path):
        return "dir"
    if any(path.endswith(e) for e in (".log", ".txt", ".jsonl", ".out")):
        return "log"
    if path.endswith(".json"):
        return "json"
    return "file"


def content_fp(path, kind):
    """Normalised fingerprint of a whole file or dir (json/file/dir), or None."""
    try:
        if kind == "dir":
            items, n = [], 0
            base = path.rstrip("/")
            for root, dirs, files in os.walk(base):
                if root[len(base):].count(os.sep) >= 3:
                    dirs[:] = []
                for f in files:
                    p = os.path.join(root, f)
                    try:
                        items.append("%s:%d" % (os.path.relpath(p, base), os.path.getsize(p)))
                    except OSError:
                        pass
                    n += 1
                    if n >= 3000:
                        break
                if n >= 3000:
                    break
            return h("\n".join(sorted(items))), len(items)
        size = os.path.getsize(path)
        if kind == "json" and size <= JSON_MAX:
            try:
                return h(json.dumps(norm_json(json.load(open(path))), sort_keys=True)), size
            except ValueError:
                pass
        if size <= 32 * 1024 * 1024:
            hh = hashlib.sha256()
            with open(path, "rb") as f:
                for chunk in iter(lambda: f.read(1 << 20), b""):
                    hh.update(chunk)
            return hh.hexdigest()[:16], size
        with open(path, "rb") as f:  # too big to hash hourly on a 1 GB host: size + both ends
            head = f.read(1 << 20); f.seek(-(1 << 20), 2); tail = f.read()
        return h(str(size).encode() + head + tail), size
    except OSError:
        return None, None


def read_range(path, start, end):
    with open(path, "rb") as f:
        f.seek(start)
        return f.read(max(0, end - start)).decode("utf-8", "replace")


def lines_of(txt, drop_first_partial=False):
    ls = txt.splitlines()
    if drop_first_partial and ls:
        ls = ls[1:]
    return [norm_line(l) for l in ls if l.strip()]


_FAILRX = re.compile(r"\b(FAILED\w*|ERROR|SKIP\w*|HALT\w*|PAUSED\w*|HOLD|FAIL|SSH-FAIL|Traceback|CRITICAL)\b")


def log_novelty(lines_new, lines_prior):
    """NEW if an appended line (timestamps masked) is not in the prior window. A failure/skip/hold line is not
    output: a job that only ever logs new ways of not running is REPEAT (fresh_lines counts real output only)."""
    if not lines_new:
        return "REPEAT", 0
    prior = set(lines_prior)
    fresh = [l for l in lines_new if l not in prior and not _FAILRX.search(l)]
    return ("NEW" if fresh else "REPEAT"), len(fresh)


def eval_log_text(key, txt_tail, prev, size, mtime, st_out):
    """Novelty for a log known only by its tail (pod targets)."""
    ls = lines_of(txt_tail, drop_first_partial=size > len(txt_tail))[-400:]
    last = ls[-1] if ls else ""
    st_out[key] = {"size": size, "mtime": mtime, "last": h(last)}
    if not prev:
        k = max(1, min(50, len(ls) // 5))
        v, n = log_novelty(ls[-k:], ls[:-k]) if len(ls) > 1 else ("FIRST_SEEN", 0)
        return v, "bootstrap", n
    if size == prev.get("size") and mtime == prev.get("mtime"):
        return "UNCHANGED", "no-write", 0
    if size < prev.get("size", 0):
        return "NEW", "rotated", len(ls)
    grown = size - prev.get("size", 0)
    if grown <= 0:
        return "REPEAT", "touched-no-bytes", 0
    newtxt = txt_tail[-grown:] if grown < len(txt_tail) else txt_tail
    new_ls = lines_of(newtxt)
    prior_ls = lines_of(txt_tail[:-grown]) if grown < len(txt_tail) else []
    v, n = log_novelty(new_ls, prior_ls)
    return v, "appended", n


def eval_log(path, prev, st_out):
    try:
        size = os.path.getsize(path); mtime = int(os.path.getmtime(path))
    except OSError:
        return None
    st_out[path] = {"size": size, "mtime": mtime}
    if not prev:
        txt = read_range(path, max(0, size - TAIL), size)
        ls = lines_of(txt, drop_first_partial=size > TAIL)[-400:]
        if len(ls) < 2:
            return "FIRST_SEEN", "bootstrap", 0, mtime
        k = max(1, min(50, len(ls) // 5))
        v, n = log_novelty(ls[-k:], ls[:-k])
        return v, "bootstrap", n, mtime
    psize, pmtime = prev.get("size", 0), prev.get("mtime", 0)
    if size == psize and mtime == pmtime:
        return "UNCHANGED", "no-write", 0, mtime
    if size < psize:
        return "NEW", "rotated", 0, mtime
    if size == psize:
        return "REPEAT", "touched-no-bytes", 0, mtime
    start = max(psize, size - APPEND_CAP)
    new_ls = lines_of(read_range(path, start, size), drop_first_partial=start > psize)
    prior_ls = lines_of(read_range(path, max(0, psize - PRIOR), psize), drop_first_partial=psize > PRIOR)
    v, n = log_novelty(new_ls, prior_ls)
    return v, "appended", n, mtime


def eval_whole(path, kind, prev, st_out):
    fp, size = content_fp(path, kind)
    if fp is None:
        return None
    try:
        mtime = int(max(os.path.getmtime(path.rstrip("/")), 0))
    except OSError:
        mtime = 0
    if kind == "dir":
        try:
            mtime = max([mtime] + [int(os.path.getmtime(os.path.join(path, e))) for e in os.listdir(path)][:3000])
        except OSError:
            pass
    st_out[path] = {"fp": fp, "mtime": mtime}
    if not prev:
        return "FIRST_SEEN", "first", 0, mtime
    if fp != prev.get("fp"):
        return "NEW", "content", 0, mtime
    if mtime != prev.get("mtime"):
        return "REPEAT", "rewritten-same-content", 0, mtime
    return "UNCHANGED", "no-write", 0, mtime


def eval_dated(pattern, prev, st_out):
    g = re.sub(r"<[^>]+>", "*", pattern)
    rx = re.compile("^" + "".join(
        r"\d{4}-?\d{2}-?\d{2}" if part == "<date>" else ("[^/]+" if part.startswith("<") else re.escape(part))
        for part in re.split(r"(<[^>]+>)", pattern.rstrip("/"))) + "$")
    matches = [m for m in glob.glob(g) if rx.match(m.rstrip("/"))]
    if not matches:
        return None
    matches.sort(key=lambda p: os.path.getmtime(p.rstrip("/")))
    newest = matches[-1]
    kind = "dir" if os.path.isdir(newest) else ("json" if newest.endswith(".json") else "file")
    fp, _ = content_fp(newest, kind)
    mtime = int(os.path.getmtime(newest))
    st_out[pattern] = {"newest": newest, "fp": fp, "mtime": mtime, "n": len(matches)}
    if prev and prev.get("newest") == newest:
        if fp != prev.get("fp"):
            return "NEW", "newest-rewritten", 0, mtime
        return ("UNCHANGED", "no-new-instance", 0, mtime)
    if prev and prev.get("fp"):
        return ("REPEAT" if fp == prev.get("fp") else "NEW"), "new-instance-vs-previous", 0, mtime
    if len(matches) >= 2:
        ofp, _ = content_fp(matches[-2], kind)
        return ("REPEAT" if ofp == fp else "NEW"), "bootstrap-vs-previous-instance", 0, mtime
    return "FIRST_SEEN", "single-instance", 0, mtime


def period_s(sched):
    if sched.startswith("@"):
        return None
    f = sched.split()
    if len(f) < 5:
        return None

    def cnt(x, n):
        if x == "*":
            return n
        tot = 0
        for part in x.split(","):
            if part.startswith("*/"):
                tot += max(1, n // int(part[2:]))
            elif "/" in part:
                a, step = part.split("/")
                lo, hi = (a.split("-") + [a])[:2] if "-" in a else (a, n - 1)
                tot += max(1, (int(hi) - int(lo)) // int(step) + 1)
            elif "-" in part:
                lo, hi = part.split("-"); tot += int(hi) - int(lo) + 1
            else:
                tot += 1
        return max(1, tot)
    try:
        per_day = cnt(f[0], 60) * cnt(f[1], 24)
        if f[4] != "*":
            return int(7 * 86400 / (per_day * cnt(f[4], 7)))
        if f[2] != "*":
            return int(31 * 86400 / (per_day * cnt(f[2], 31)))
        return int(86400 / per_day)
    except ValueError:
        return None


def load_jobs_yaml():
    try:
        t = "\n".join(l for l in open(JOBS).read().splitlines() if not l.lstrip().startswith("#"))
        return json.loads(t).get("jobs", [])
    except Exception:  # noqa: BLE001
        return []


def cron_lines():
    try:
        out = subprocess.run(["crontab", "-l"], capture_output=True, text=True, timeout=20).stdout
    except Exception:  # noqa: BLE001
        return []
    rows = []
    for ln in out.splitlines():
        s = ln.strip()
        if not s or s.startswith("#") or re.match(r"^[A-Z_]+=", s):
            continue
        if s.startswith("@"):
            sched, cmd = s.split(None, 1)[0], s.split(None, 1)[1]
        else:
            p = s.split(None, 5)
            if len(p) < 6:
                continue
            sched, cmd = " ".join(p[:5]), p[5]
        rows.append((sched, cmd.split("   #")[0].split("  # ")[0]))
    return rows


def expand(p):
    return os.path.expanduser(p.replace("$HOME", HOME).replace("${HOME}", HOME).replace("/home/ubuntu", HOME))


def targets_from_cmd(cmd):
    ts = []
    for m in re.finditer(r">>?\s*([~$/][^\s;&|)\"']+)", cmd):
        p = m.group(1)
        if not p.startswith("/dev/"):
            ts.append(expand(p))
    m = re.search(r"disk-floor\.sh\s+\S+\s+(\S+)", cmd)
    if m:
        ts.append(expand(m.group(1)))
    return ts


def slug(cmd):
    m = re.findall(r"[\w./~$-]+\.(?:sh|py)", cmd)
    base = m[-1] if m else cmd[:40]
    return re.sub(r"[^\w.-]+", "-", base.replace("$HOME/", "").replace("~/", "")).strip("-")[:60]


def pod_fetch(paths):
    """One read-only ssh to the build pod: size, mtime, 128 KB tail (or newest file in a dir) per path."""
    env = {}
    try:
        for ln in open(BUILDENV):
            m = re.match(r"^(BUILD_POD_\w+)=(\S+)", ln.strip())
            if m:
                env[m.group(1)] = m.group(2)
    except OSError:
        return {}, "no build-pod.env"
    remote = (
        "import json,os,sys,base64\n"
        "r={}\n"
        "for p in json.loads(sys.argv[1]):\n"
        "  q=p\n"
        "  try:\n"
        "    if p.endswith('/'):\n"
        "      fs=[os.path.join(p,f) for f in os.listdir(p)]\n"
        "      fs=[f for f in fs if os.path.isfile(f)]\n"
        "      q=max(fs,key=os.path.getmtime) if fs else None\n"
        "    if not q: r[p]=None; continue\n"
        "    s=os.path.getsize(q); f=open(q,'rb'); f.seek(max(0,s-131072)); t=f.read()\n"
        "    r[p]={'file':q,'size':s,'mtime':int(os.path.getmtime(q)),'tail':base64.b64encode(t).decode()}\n"
        "  except Exception as e: r[p]={'error':type(e).__name__}\n"
        "print(json.dumps(r))\n")
    key = expand(env.get("BUILD_POD_KEY", "~/.ssh/fleet_runpod_ed25519"))
    cmd = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-i", key, "-p", env.get("BUILD_POD_PORT", "22"),
           env.get("BUILD_POD_HOST", ""), "python3 - '%s'" % json.dumps(paths).replace("'", "")]
    try:
        r = subprocess.run(cmd, input=remote, capture_output=True, text=True, timeout=90)
        if r.returncode != 0:
            return {}, "ssh rc=%d" % r.returncode
        return json.loads(r.stdout), None
    except Exception as e:  # noqa: BLE001
        return {}, "ssh %s" % type(e).__name__


_FLOCK = re.compile(r"\bflock\s+(?:-[a-zA-Z]+\s+)*([~$/][^\s;&|)]+)")


def lock_of(cmd):
    m = _FLOCK.search(cmd)
    return expand(m.group(1)) if m else None


def lock_holders(paths):
    """{lock path: [{pid, started, cmd}]} for processes (readable by this user) holding an fd on each lock file."""
    want = {}
    for p in paths:
        try:
            want[os.path.realpath(p)] = p
        except OSError:
            pass
    out = {p: [] for p in paths}
    if not want:
        return out
    try:
        btime = next(int(l.split()[1]) for l in open("/proc/stat") if l.startswith("btime"))
        hz = os.sysconf("SC_CLK_TCK")
    except (OSError, StopIteration, ValueError):
        return out
    me = os.getpid()
    for pid in os.listdir("/proc"):
        if not pid.isdigit() or int(pid) == me:
            continue
        fd_dir = "/proc/%s/fd" % pid
        try:
            fds = os.listdir(fd_dir)
        except OSError:
            continue
        hit = None
        for fd in fds:
            try:
                tgt = os.readlink(os.path.join(fd_dir, fd))
            except OSError:
                continue
            if tgt in want:
                hit = want[tgt]
                break
        if not hit:
            continue
        try:
            stat = open("/proc/%s/stat" % pid).read()
            start = btime + int(stat.rsplit(")", 1)[1].split()[19]) / hz
            cmd = open("/proc/%s/cmdline" % pid, "rb").read().replace(b"\0", b" ").decode("utf-8", "replace").strip()
        except (OSError, IndexError, ValueError):
            continue
        out[hit].append({"pid": int(pid), "started": iso(datetime.fromtimestamp(start, timezone.utc)),
                         "cmd": cmd[:120]})
    return out


def main():
    do_pod = "--pod" in sys.argv
    t0 = time.time()
    try:
        state = json.load(open(STATE))
    except Exception:  # noqa: BLE001
        state = {}
    prev_t, prev_j = state.get("targets", {}), state.get("jobs", {})
    new_t = {}
    jobs_yaml = load_jobs_yaml()
    oracle_yaml = [j for j in jobs_yaml if j.get("host") == "oracle-micro-2"]
    jobs, seen_ids = [], set()
    for sched, cmd in cron_lines():
        yj = next((j for j in oracle_yaml if j.get("cron_match") and j["cron_match"] in cmd), None)
        jid = yj["id"] if yj else slug(cmd)
        if jid in seen_ids:
            jid = jid + "#" + h(cmd)[:4]
        seen_ids.add(jid)
        tg = targets_from_cmd(cmd)
        if yj:
            for o in yj.get("outputs", []):
                if o.startswith("hf://") or " " in o or o.startswith("HF ") or o.startswith("branch"):
                    continue
                tg.append(expand(o))
            hp = (yj.get("health") or {}).get("path")
            if hp and "<" not in hp:
                tg.append(expand(hp))
            hl = yj.get("health") or {}
            if hl.get("type") == "status_json_job" and hl.get("key"):
                tg.append("/evac-bulk/flywheel/logs/%s-<stamp>.result.json" % hl["key"])
        for k, extra in EXTRA_TARGETS.items():
            if k in cmd:
                tg.extend(expand(x) for x in extra)
        pod_t = [v for k, v in POD_TARGETS.items() if k in cmd]
        # dedupe, keep order; drop shared supervisor outputs that every job lists
        tg = [x for i, x in enumerate(tg) if x and x not in tg[:i]]
        jobs.append({"id": jid, "host": "oracle-micro-2", "schedule": sched, "period_s": period_s(sched),
                     "targets": tg, "pod_targets": pod_t, "yaml": bool(yj), "lock": lock_of(cmd)})
    tcount = {}
    for j in jobs:
        for p in j["targets"]:
            tcount[p] = tcount.get(p, 0) + 1
    holders = lock_holders(sorted({j["lock"] for j in jobs if j["lock"]}))
    pod_data, pod_err = ({}, None)
    if do_pod:
        want = sorted({p for j in jobs for p in j["pod_targets"]})
        if want:
            pod_data, pod_err = pod_fetch(want)
    rows = []
    for j in jobs:
        per = []
        for p in j["targets"]:
            if "<" in p:
                r = eval_dated(p, prev_t.get(p), new_t); kind = "dated"
            else:
                kind = kind_of(p)
                if not os.path.exists(p.rstrip("/")):
                    per.append({"path": p, "kind": kind, "verdict": "MISSING"}); continue
                try:
                    big = kind in ("json", "file") and os.path.getsize(p) > JSON_MAX
                except OSError:
                    big = False
                if kind == "log" or big:
                    kind = "log"; r = eval_log(p, prev_t.get(p), new_t)
                else:
                    r = eval_whole(p, kind, prev_t.get(p), new_t)
            if r is None:
                per.append({"path": p, "kind": kind, "verdict": "MISSING"}); continue
            v, basis, nfresh, mt = r
            per.append({"path": p, "kind": kind, "verdict": v, "basis": basis, "fresh_lines": nfresh,
                        "mtime": iso(datetime.fromtimestamp(mt, timezone.utc)) if mt else None})
            if tcount.get(p, 0) > 1:
                per[-1]["shared"] = tcount[p]
        for p in j["pod_targets"]:
            d = pod_data.get(p) if do_pod else None
            key = "pod:" + p
            if not d or "tail" not in d:
                per.append({"path": key, "kind": "pod-log", "verdict": "UNMEASURED",
                            "basis": pod_err or ("not read (run with --pod)" if not do_pod else "absent")})
                continue
            txt = base64.b64decode(d["tail"]).decode("utf-8", "replace")
            pk = "pod:" + d["file"]
            v, basis, n = eval_log_text(pk, txt, prev_t.get(pk), d["size"], d["mtime"], new_t)
            per.append({"path": pk, "kind": "pod-log", "verdict": v, "basis": basis, "fresh_lines": n,
                        "mtime": iso(datetime.fromtimestamp(d["mtime"], timezone.utc))})
        grace = (2 * j["period_s"] + 3600) if j["period_s"] else None
        log_fresh = any(x["kind"] in ("log", "pod-log") and x.get("mtime") and grace and
                        (NOW - datetime.strptime(x["mtime"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc))
                        .total_seconds() <= grace for x in per)
        for x in per:
            if (x["kind"] in ("json", "dated", "dir", "file") and x["verdict"] in ("FIRST_SEEN", "UNCHANGED")
                    and x.get("mtime") and grace and log_fresh and
                    (NOW - datetime.strptime(x["mtime"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc))
                    .total_seconds() > grace):
                x["verdict"], x["basis"] = "REPEAT", "data untouched since %s while the job's log advances" % x["mtime"]
        data_all = [x for x in per if x["kind"] in ("json", "dated", "dir", "file") and x["verdict"] != "MISSING"]
        logs_all = [x for x in per if x["kind"] in ("log", "pod-log") and x["verdict"] not in ("MISSING", "UNMEASURED")]
        own = [x for x in per if not x.get("shared")]
        data = [x for x in data_all if not x.get("shared")]
        logs = [x for x in logs_all if not x.get("shared")]
        if not data and not logs:  # only shared targets: fall back to them, marked in decided_on
            data, logs = data_all, logs_all
        mts = [datetime.strptime(x["mtime"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
               for x in (own if any(x.get("mtime") for x in own) else per) if x.get("mtime")]
        newest = max(mts) if mts else None
        basis_set = data or logs
        vs = {x["verdict"] for x in basis_set}
        if not basis_set:
            verdict = "UNMEASURED"
        elif grace and newest and (NOW - newest).total_seconds() > grace:
            verdict = "NO_RUN_EVIDENCE"
        elif "NEW" in vs:
            verdict = "NEW"
        elif vs <= {"FIRST_SEEN"}:
            verdict = "FIRST_SEEN"
        elif "REPEAT" in vs and vs <= {"REPEAT", "UNCHANGED", "FIRST_SEEN"}:
            verdict = "NO_NEW_OUTPUT"
        elif vs <= {"UNCHANGED", "FIRST_SEEN"}:
            verdict = "IDLE_SINCE_LAST_CHECK"
        else:
            verdict = "UNKNOWN"
        pj = prev_j.get(j["id"], {})
        streak = pj.get("no_new_streak", 0) + 1 if verdict == "NO_NEW_OUTPUT" else (
            pj.get("no_new_streak", 0) if verdict == "IDLE_SINCE_LAST_CHECK" else 0)
        last_line = None
        for x in per:
            if x["kind"] == "log" and x["verdict"] not in ("MISSING",) and os.path.isfile(x["path"]):
                try:
                    sz = os.path.getsize(x["path"])
                    tl = read_range(x["path"], max(0, sz - 4096), sz).strip().splitlines()
                    last_line = tl[-1][:200] if tl else None
                except OSError:
                    pass
                break
        role = "check" if any(c in j["id"] for c in CHECK_JOBS) else "producer"
        lock_info = None
        if j.get("lock"):
            hs = holders.get(j["lock"]) or []
            lock_info = {"path": j["lock"], "holders": hs}
            stale_h = [x for x in hs if grace and (NOW - datetime.strptime(x["started"], "%Y-%m-%dT%H:%M:%SZ")
                                                   .replace(tzinfo=timezone.utc)).total_seconds() > grace]
            if stale_h:
                lock_info["stale"] = True
                verdict = "LOCK_STALE+" + verdict
        rows.append({"id": j["id"], "host": j["host"], "schedule": j["schedule"], "verdict": verdict, "role": role,
                     "last_log_line": last_line, "lock": lock_info,
                     "no_new_streak": streak, "newest_output": iso(newest) if newest else None,
                     "decided_on": "data" if data else ("logs" if logs else "none"), "targets": per,
                     "prev_verdict": pj.get("verdict")})
    # 3090-pod loops: last export only (the pod was stopped 28 Sep 09:00Z by funding-watchdog STOP)
    try:
        pj_doc = json.load(open(PODJOBS))
        exp = datetime.strptime(pj_doc["exported_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        stale = (NOW - exp).total_seconds() > 7200
        for name, d in sorted((pj_doc.get("jobs") or {}).items()):
            tail = [norm_line(x) for x in (d.get("tail") or []) if x.strip()]
            k = max(1, len(tail) // 3)
            v, n = log_novelty(tail[-k:], tail[:-k]) if len(tail) > 1 else ("FIRST_SEEN", 0)
            verdict = ("HOST_STOPPED+" if stale else "") + ({"NEW": "NEW", "REPEAT": "NO_NEW_OUTPUT"}.get(v, v))
            if d.get("paused_reason"):
                verdict += "(%s)" % d["paused_reason"]
            rows.append({"id": "pod-" + name, "host": "pod:" + str(pj_doc.get("host")), "schedule": None,
                         "verdict": verdict, "no_new_streak": None, "newest_output": d.get("last_ts") or d.get("mtime"),
                         "decided_on": "export-tail(%d lines, export %s)" % (len(tail), pj_doc["exported_at"]),
                         "targets": [{"path": d.get("log"), "kind": "pod-export-tail", "verdict": v, "fresh_lines": n}]})
    except Exception as e:  # noqa: BLE001
        rows.append({"id": "pod-jobs-export", "host": "pod", "verdict": "UNMEASURED", "decided_on": type(e).__name__,
                     "targets": []})
    counts = {}
    for r in rows:
        counts[r["verdict"]] = counts.get(r["verdict"], 0) + 1
    no_new = [r["id"] for r in rows if r["verdict"].split("(")[0].endswith("NO_NEW_OUTPUT") and r.get("role") != "check"]
    steady_checks = [r["id"] for r in rows if r["verdict"] == "NO_NEW_OUTPUT" and r.get("role") == "check"]
    no_run = [r["id"] for r in rows if r["verdict"].split("+")[-1] == "NO_RUN_EVIDENCE"]
    lock_stale = [r["id"] for r in rows if r["verdict"].startswith("LOCK_STALE+")]
    out = {"at": iso(NOW), "schema": "csoai.output-novelty/0.1", "host": "oracle-micro-2", "runtime_s": round(time.time() - t0, 1),
           "pod_read": do_pod, "pod_error": pod_err, "counts": counts, "no_new_output": no_new, "checks_steady": steady_checks, "no_run_evidence": no_run,
           "lock_stale": lock_stale, "jobs": rows,
           "method": "content compared with run timestamps normalised away; verdict from data outputs when a job has "
                     "any, else logs; heuristics, not proof -- each NO_NEW_OUTPUT carries the targets it was decided on",
           "retires": "nothing"}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    json.dump(out, open(OUT + ".tmp", "w"), indent=1); os.replace(OUT + ".tmp", OUT)
    keep_t = {k: v for k, v in new_t.items()}
    for k, v in prev_t.items():  # targets not read this run (e.g. pod unreachable) keep their last state
        keep_t.setdefault(k, v)
    st = {"at": iso(NOW), "targets": keep_t,
          "jobs": {r["id"]: {"verdict": r["verdict"], "no_new_streak": r.get("no_new_streak") or 0} for r in rows}}
    json.dump(st, open(STATE + ".tmp", "w")); os.replace(STATE + ".tmp", STATE)
    lines = ["%s SUMMARY %s no_new_output=%s checks_steady=%s no_run_evidence=%s lock_stale=%s pod_read=%s%s" % (
        iso(NOW), " ".join("%s=%d" % kv for kv in sorted(counts.items())), ",".join(no_new) or "-",
        ",".join(steady_checks) or "-",
        ",".join(no_run) or "-", ",".join(lock_stale) or "-", do_pod, (" pod_error=" + pod_err) if pod_err else "")]
    for r in rows:
        if r.get("prev_verdict") and r["prev_verdict"] != r["verdict"]:
            lines.append("%s CHANGE job=%s %s -> %s" % (iso(NOW), r["id"], r["prev_verdict"], r["verdict"]))
    with open(LOG, "a") as fh:
        fh.write("\n".join(lines) + "\n")
    if "--print" in sys.argv:
        for r in sorted(rows, key=lambda r: (r["verdict"], r["id"])):
            print("%-28s %-40s %-18s %s" % (r["verdict"][:28], r["id"][:40], (r.get("newest_output") or "-")[:18],
                                           r.get("decided_on")))
        print(lines[0])
    return 0


if __name__ == "__main__":
    sys.exit(main())
