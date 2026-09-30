#!/usr/bin/env python3
"""runpod-balance-alert.py -- RunPod runway alert (ops-guard lane, 2026-09-28). Oracle cron, */15 at :07/:22/:37/:52.

Reads ~/fleet/runpod_funding.json (written every 15 min by ~/lanes/funding-watchdog.sh from `runpodctl user`).
If that file is missing or older than MAX_AGE_S, it reads the balance itself with `runpodctl user`, which uses the
RunPod key already configured on this host. The key and the raw API reply are never printed or logged.

Writes one line per event to ~/lanes/logs/runpod-balance-alert.log:
  ALERT    runway now < 24 h: balance/spend at the reading, minus the reading's age (every run while below)
  CLEAR    first run back at or above 24 h    (after an ALERT)
  STALE    funding file older than MAX_AGE_S  (plus the fallback read's result)
  ERROR    no balance could be read at all
  OK       at most one heartbeat line per UTC day
Each line also carries the burn observed from balance deltas in runpod-balance.log over the last 3 h, because the
instantaneous spend/hr can spike (3.242 $/h at 08:30Z on 28 Sep put runway at 5.9 h and the watchdog stopped three pods).
State: ~/lanes/state/runpod-balance-alert.json (last level) and ~/fleet/runpod_balance_alert.json (last read).
Sends nothing to anyone, changes no pod, touches no key. Exit 0 on OK/CLEAR, 2 on ALERT, 1 on ERROR.
"""
import json, os, subprocess, sys, time
from datetime import datetime, timezone, timedelta

HOME = os.path.expanduser("~")
FUND = os.path.join(HOME, "fleet/runpod_funding.json")
WLOG = os.path.join(HOME, "lanes/logs/runpod-balance.log")
LOG = os.path.join(HOME, "lanes/logs/runpod-balance-alert.log")
STATE = os.path.join(HOME, "lanes/state/runpod-balance-alert.json")
OUT = os.path.join(HOME, "fleet/runpod_balance_alert.json")
THRESH_H = float(os.environ.get("RUNWAY_ALERT_H", "24"))
MAX_AGE_S = int(os.environ.get("FUNDING_MAX_AGE_S", "2400"))


def now():
    return datetime.now(timezone.utc)


def iso(t):
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso(s):
    return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def read_funding():
    try:
        d = json.load(open(FUND))
        at = parse_iso(d["at"])
        return {"at": at, "balance": float(d["balance_usd"]), "spend": float(d["spend_usd_per_hr"]),
                "source": "runpod_funding.json"}
    except Exception as e:  # noqa: BLE001 - any unreadable file means fall back
        return {"error": "funding file unreadable: %s" % type(e).__name__}


def read_api():
    env = dict(os.environ, PATH=os.path.join(HOME, "bin") + ":" + os.environ.get("PATH", ""))
    try:
        r = subprocess.run(["runpodctl", "user"], capture_output=True, text=True, timeout=60, env=env)
        if r.returncode != 0:
            return {"error": "runpodctl user rc=%d" % r.returncode}
        d = json.loads(r.stdout)  # only two numeric fields are kept; the reply itself is discarded
        return {"at": now(), "balance": float(d["clientBalance"]), "spend": float(d["currentSpendPerHr"]),
                "source": "runpodctl user (fallback)"}
    except Exception as e:  # noqa: BLE001
        return {"error": "runpodctl user failed: %s" % type(e).__name__}


def observed_burn(hours=3.0):
    """$/h from the balance drop in the watchdog's own log over the last `hours` (None if < 2 points or a top-up)."""
    pts = []
    cutoff = now() - timedelta(hours=hours)
    try:
        with open(WLOG, "rb") as f:
            f.seek(0, 2)
            f.seek(max(0, f.tell() - 65536))
            tail = f.read().decode("utf-8", "replace").splitlines()
    except OSError:
        return None
    for ln in tail:
        parts = ln.split()
        if len(parts) < 2 or not parts[1].startswith("balance="):
            continue
        try:
            t = parse_iso(parts[0])
            b = float(parts[1].split("=", 1)[1])
        except ValueError:
            continue
        if t >= cutoff:
            pts.append((t, b))
    if len(pts) < 2:
        return None
    (t0, b0), (t1, b1) = pts[0], pts[-1]
    dt = (t1 - t0).total_seconds() / 3600.0
    if dt <= 0 or b1 > b0:  # a top-up inside the window makes the delta meaningless
        return None
    return round((b0 - b1) / dt, 3)


def main():
    t = now()
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    events = []
    f = read_funding()
    stale = "error" in f or (t - f["at"]).total_seconds() > MAX_AGE_S
    if stale:
        why = f.get("error") or "funding file age %ds > %ds" % ((t - f["at"]).total_seconds(), MAX_AGE_S)
        api = read_api()
        events.append("STALE %s; fallback=%s" % (why, "ok" if "error" not in api else api["error"]))
        if "error" not in api:
            f = api
        elif "error" in f:
            line = "%s ERROR no balance readable (%s; %s)" % (iso(t), f["error"], api["error"])
            open(LOG, "a").write(line + "\n")
            json.dump({"at": iso(t), "level": "ERROR"}, open(OUT, "w"))
            return 1
    bal, spend = f["balance"], f["spend"]
    age_h = max(0.0, (t - f["at"]).total_seconds() / 3600.0)
    runway_read = round(bal / spend, 1) if spend > 0 else None
    # runway NOW = the reading's runway minus the reading's age; a stale file whose fallback failed must not read as OK
    runway = round(runway_read - age_h, 1) if runway_read is not None else None
    burn = observed_burn()
    runway_obs = round(bal / burn - age_h, 1) if burn else None
    zero_at = iso(f["at"] + timedelta(hours=runway_read)) if runway_read is not None else "never"
    below_at = iso(t + timedelta(hours=runway - THRESH_H)) if runway is not None and runway >= THRESH_H else None
    level = "ALERT" if runway is not None and runway < THRESH_H else "OK"
    try:
        prev = json.load(open(STATE))
    except Exception:  # noqa: BLE001
        prev = {}
    detail = ("balance_usd=%.2f spend_usd_h=%s zero_at=%s burn_obs_3h=%s runway_obs_h=%s src=%s read_at=%s age_h=%.1f"
              % (bal, spend, zero_at, burn, runway_obs, f["source"].replace(" ", "_"), iso(f["at"]), age_h))
    lines = ["%s %s" % (iso(t), e) for e in events]
    if level == "ALERT":
        lines.append("%s ALERT runway_h=%s < %sh %s" % (iso(t), runway, THRESH_H, detail))
    elif prev.get("level") == "ALERT":
        lines.append("%s CLEAR runway_h=%s >= %sh %s" % (iso(t), runway, THRESH_H, detail))
    elif prev.get("ok_day") != t.strftime("%Y-%m-%d"):
        lines.append("%s OK runway_h=%s below_%sh_at=%s %s" % (iso(t), runway, int(THRESH_H), below_at, detail))
        prev["ok_day"] = t.strftime("%Y-%m-%d")
    if lines:
        with open(LOG, "a") as fh:
            fh.write("\n".join(lines) + "\n")
    st = {"level": level, "at": iso(t), "ok_day": prev.get("ok_day")}
    json.dump(st, open(STATE + ".tmp", "w")); os.replace(STATE + ".tmp", STATE)
    out = {"at": iso(t), "level": level, "threshold_h": THRESH_H, "balance_usd": round(bal, 4), "spend_usd_per_hr": spend,
           "runway_h": runway, "runway_at_read_h": runway_read, "reading_age_h": round(age_h, 2), "zero_at": zero_at, "below_threshold_at": below_at, "burn_observed_3h_usd_per_hr": burn,
           "runway_at_observed_burn_h": runway_obs, "source": f["source"], "read_at": iso(f["at"]),
           "stale_fallback": stale, "note": "alert only; sends nothing, stops nothing (funding-watchdog.sh owns stops)"}
    json.dump(out, open(OUT + ".tmp", "w"), indent=1); os.replace(OUT + ".tmp", OUT)
    return 2 if level == "ALERT" else 0


if __name__ == "__main__":
    sys.exit(main())
