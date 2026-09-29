#!/usr/bin/env python3
"""build_jobs.py -- assemble JOBS.json (lane automation-runpod-20260928) from read-only snapshots.

Inputs (all snapshots taken 2026-09-28 ~21:20Z, read-only):
  mac_plists.json      ~/Library/LaunchAgents/{ai,com}.csoai.* parsed (label, args, schedule, log mtimes, loaded state)
  hermes_jobs.json     ~/.hermes/cron/jobs.json (LISTED ONLY; Hermes is not touched)
  oracle_crontab.txt   `crontab -l` on oracle-micro-2 (after this lane's additions)
  jobs.yaml            oracle ~/fleet/sv/jobs.yaml (fleet-supervisor inventory; health defs reused verbatim)
  output_novelty.json  oracle ~/fleet/output_novelty.json 20:47Z (ops-guard: NEW vs mtime-only per job)
  pod_jobs.json        oracle ~/fleet/pod_jobs.json (3090 scheduler export, last 04:10Z)
Never invents a timestamp: last_new_output is copied from a named source or left null (UNMEASURED).
"""
import json, os, re, sys
from datetime import datetime, timezone

S = os.path.dirname(os.path.abspath(__file__))
AT = sys.argv[1] if len(sys.argv) > 1 else datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
ld = lambda n: json.load(open(os.path.join(S, n)))
plists = ld("mac_plists.json")
hermes = ld("hermes_jobs.json")["jobs"]
yml = "\n".join(l for l in open(os.path.join(S, "jobs.yaml")).read().splitlines() if not l.lstrip().startswith("#"))
sv = json.loads(yml)
nov = ld("output_novelty.json")
podj = ld("pod_jobs.json")
cron = open(os.path.join(S, "oracle_crontab.txt")).read().splitlines()

OK_RE = r"rc=0|DONE|\bOK\b|PUBLISHED|SIGNED|DEPLOYED|unchanged|triggered|REFRESHED|UPLOADED|state=OK|CONFIRMED|NEW"
BAD_RE = r"FAILED_DISK_FLOOR|Traceback|state=FAILED|FAILED stage=|\brc=[1-9]"  # narrow: generic OK words are NOT required (a steady check line need not say OK)


def period_s(expr):
    """Rough cron period in seconds (worst gap), for max_age = 2*period + 1h."""
    if not expr or expr.startswith("@"):
        return None
    f = expr.split()
    if len(f) != 5:
        return None
    mi, hr, dom, mon, dow = f
    if dow != "*" and dom == "*":
        return 7 * 86400
    if dom != "*":
        return 31 * 86400
    if hr == "*":
        if mi.startswith("*/"):
            return int(mi[2:]) * 60
        if mi == "*":
            return 60
        n = len(re.split(r"[,]", mi)) if "-" not in mi else 6
        return 3600 // max(n, 1)
    if hr.startswith("*/"):
        return int(hr[2:]) * 3600
    if "," in hr:
        return 86400 // len(hr.split(","))
    return 86400


def max_age(p):
    return None if p is None else 2 * p + 3600


def interval_s(sched):
    if not sched:
        return None
    if "StartInterval" in sched:
        return int(sched["StartInterval"])
    if "StartCalendarInterval" in sched:
        return 86400
    return None


jobs = []

# ---------------------------------------------------------------- Oracle (crontab is the source of truth)
sv_by_match = [(j.get("cron_match"), j) for j in sv["jobs"] if j.get("host") == "oracle-micro-2" and j.get("cron_match")]
nov_jobs = nov["jobs"] if isinstance(nov["jobs"], list) else list(nov["jobs"].values())
norm = lambda s: re.sub(r"[/]", "-", s)

# annotations: purpose / should_live / action for Oracle jobs, keyed by a command substring
ORACLE_NOTES = {
    "airbench_full.py": ("AIR-Bench verdict harvest -> signed airbench_full.json", "oracle", "none"),
    "gcp-evac-watcher": ("polls a GCP VM; GCP is settled-dead (memory gcp-dead-regenerate-dont-recover)", "retire", "propose-retire: SILENT-NO-OP, not CSOAI"),
    "oracle-fleet-status.sh": ("fleet status json for the supervisor", "oracle", "none"),
    "sov-town": ("SOV town sim (not CSOAI; 516 MB state on a 93% disk)", "not-csoai (MEOK/SOV lane)", "list-only"),
    "snapshot_pipe.py": ("airbench snapshot -> HF csoai-measurement-ledger", "oracle", "none (HF auth failures earlier; last run 18:43 IDLE)"),
    "sovereign_eater.py": ("SOV site eater (not CSOAI)", "not-csoai (MEOK/SOV lane)", "list-only"),
    "eat_remote_battery.sh": ("SOV remote battery -> gdrive; silent since 2026-08-09; LOCK_STALE", "retire", "propose-retire: supervisor lists it DISABLED but the cron line is live"),
    "honey_consolidator": ("honey mirror consolidator; mirror unchanged since 2026-08-09", "retire", "propose-retire: SILENT-NO-OP"),
    "honey_verify.py": ("honey mirror verify; 1274 rows unchanged since 2026-08-09", "retire", "propose-retire: SILENT-NO-OP"),
    "city-report.py": ("city report (SOV)", "not-csoai (MEOK/SOV lane)", "list-only"),
    "verify_record.sh": ("GSPC MCP health GET every 30 min", "oracle", "none"),
    "oracle_daily_index.sh": ("Oracle daily file index", "oracle", "none"),
    "oracle-root-check.sh": ("two GETs vs councilof.ai root, hourly", "oracle", "none"),
    "dc-remote.sh": ("Desktop Commander remote agent keepalive", "oracle", "none"),
    "gspc_public_witness.py": ("independent observation of public GSPC sources", "oracle", "none"),
    "xl-daily.sh": ("cross-ledger read -> sign -> OTS -> HF", "oracle", "none"),
    "funding-watchdog.sh": ("RunPod balance/runway -> ~/fleet/runpod_funding.json", "oracle", "none"),
    "hf-bundle.sh": ("private git bundle of canon -> HF csoai/councilof-ai-bundle", "oracle", "none"),
    "domain-watch.sh": ("RDAP expiry watch for owned domains", "oracle", "none"),
    "supervisor.py": ("fleet supervisor (jobs.yaml health, retry, failover, HF heartbeat)", "oracle", "none"),
    "flywheel/run.sh census-weekly": ("x402 census weekly", "oracle", "none"),
    "flywheel/run.sh x402-daily": ("x402 bazaar daily enumeration", "oracle", "none"),
    "flywheel/run.sh ots-upgrade": ("OTS upgrade of /evac-bulk proofs", "oracle", "none"),
    "flywheel/run.sh retention": ("flywheel retention", "oracle", "none"),
    "flywheel/run.sh harvest-e2e": ("harvest e2e candidate pack (publishes nothing)", "oracle", "none"),
    "flywheel/run.sh universe-refresh": ("x402 universe refresh", "oracle", "none"),
    "self-parity": ("own listings in external indexes vs catalogue; signed+OTS; publishes nothing", "oracle", "none"),
    "outward-gate": ("scores every public artifact PASS/FAIL/NA; measures only", "oracle", "none"),
    "tool-drift-20260926/run-on-pod.sh": ("MCP tools/list drift probe (500 endpoints) run on the backup pod", "lanes-pod or build-pod (backup pod dgj6roe9sazwsd is EXITED)", "HELD: re-point after RunPod funding; backup pod EXITED"),
    "public-signals-20260926/run.sh": ("daily outside-signal baseline; network reads on the backup pod", "lanes-pod or build-pod (backup pod EXITED)", "HELD: re-point after RunPod funding; backup pod EXITED"),
    "capsule-daily.sh": ("daily signed+OTS capsule batches", "oracle", "none"),
    "auto-land-trigger.sh": ("every 3h deploy councilof-ai master from the build pod iff it moved", "oracle trigger -> build-pod", "none"),
    "ux-gauntlet-20260926/run-on-pod.sh": ("daily UX gauntlet vs live sites (browser on build pod)", "oracle trigger -> build-pod", "none"),
    "proofof-daily.sh": ("proofof.ai rebuild+deploy from build pod", "oracle trigger -> build-pod", "FAILING today: step=backup_pod port=24817 unreachable (backup pod EXITED)"),
    "listings-page-20260927/oracle-ship.sh": ("listings page publish via build pod", "oracle trigger -> build-pod", "DEAD: scripts/listings/pod-daily.sh not on master (rc=128)"),
    "pypi-footprint-20260927/run.sh": ("PyPI footprint -> HF distribution-footprint", "oracle", "none"),
    "sov-resolve-daily.sh": ("SovSpace resolver (predictions; never on measurement surfaces)", "oracle trigger -> build-pod", "none"),
    "daily-note-announce.sh": ("observe /notes/daily/<today> + pod IndexNow for entity sitemaps", "oracle trigger -> build-pod", "none"),
    "mill-kaggle-daily/run.sh": ("GSPC mill daily on Kaggle 2xT4 -> signed slice -> mill branch on staging", "oracle trigger -> kaggle", "none"),
    "mirror-from-staging.sh": ("fetch staging canon into Oracle mirror (ff-only)", "oracle", "none (Oracle master DIVERGED 4e47de3f9 is logged by design)"),
    "root-daily-trigger.sh": ("daily public-root republish on build pod", "oracle trigger -> build-pod", "FAILING: preflight capacity (Pages 20k file cap)"),
    "newest_models_weekly.py": ("weekly newest-models report (not published)", "oracle", "none"),
    "claim-watch-20260928/run.sh": ("Pulse claim watch -> signed receipt", "oracle", "none"),
    "corrections-watch-oracle-20260928/run.sh": ("corrections-watch signed+OTS -> HF mirror", "oracle", "none"),
    "capsule-publish-20260928/trigger.sh": ("lay out day capsule index -> build pod commit/gate/land", "oracle trigger -> build-pod", "none"),
    "cf-oauth-refresh-trigger.sh": ("keep shared Wrangler OAuth on build-pod volume alive", "oracle trigger -> build-pod", "none"),
    "admit-dryrun/run.sh": ("dry-run admission over Kaggle mill slices; applies nothing", "oracle", "none"),
    "x402-buyer-canary-20260928/run.sh": ("x402 door canary; pays nothing", "oracle", "none"),
    "runpod-balance-alert.py": ("RunPod runway < 24h alert", "oracle", "none"),
    "prod-canary.py": ("councilof.ai canary (/mcp/free tools, root card floor)", "oracle", "none"),
    "output-novelty.py": ("NEW-output vs mtime judge for every job", "oracle", "none"),
    "automation-runpod-20260928/nsite-spray/run.sh": ("8-apex board/DID/governance spray report + prohibited-claim watch (read-only GETs)", "oracle", "MIGRATED from Mac com.csoai.nsite-spray 2026-09-28"),
    "automation-runpod-20260928/watchdog-audit/run.sh": ("4 public GETs on councilof.ai + read-only runpodctl pod get (audit-only receipts)", "oracle", "MIGRATED from Mac ai.csoai.watchdog-audit 2026-09-28"),
}
LOG_FOR = {  # expected-output log + ok regex for jobs the supervisor inventory lacks
    "automation-runpod-20260928/nsite-spray/run.sh": ("~/lanes/logs/nsite-spray.log", r"rc=0 .*board_http=200", r"rc=[1-9]|FAILED_DISK_FLOOR"),
    "automation-runpod-20260928/watchdog-audit/run.sh": ("~/lanes/logs/watchdog-audit.log", r"rc=0 .*endpoints_ok=4/4", r"rc=[1-9]|FAILED_DISK_FLOOR|UNREADABLE"),
}

for line in cron:
    s = line.strip()
    if not s or s.startswith("#") or re.match(r"^[A-Z_]+=", s):
        continue
    if s.startswith("@"):
        sched, cmd = s.split(None, 1)
    else:
        p = s.split(None, 5)
        sched, cmd = " ".join(p[:5]), p[5]
    comment = ""
    if "   # " in cmd:
        cmd, comment = cmd.split("   # ", 1)
    svj = next((j for m, j in sv_by_match if m and m in cmd), None)
    nv = None
    for n in nov_jobs:
        if n.get("host") != "oracle-micro-2" or n.get("schedule") != sched:
            continue
        if svj and n["id"] == svj["id"]:
            nv = n; break
        if norm(n["id"].split("#")[0]) in norm(cmd):
            nv = n; break
    note = next((v for k, v in ORACLE_NOTES.items() if k in cmd), None)
    per = period_s(sched)
    jid = "nsite-spray" if "nsite-spray/run.sh" in cmd else "watchdog-audit" if "watchdog-audit/run.sh" in cmd else svj["id"] if svj else (nv["id"] if nv else re.sub(r"[^a-z0-9]+", "-", (re.findall(r"[\w.-]+\.(?:sh|py)", cmd) or ["job"])[-1].lower()).strip("-"))
    if any(j["id"] == jid for j in jobs):
        jid = jid + "#" + sched.replace(" ", "")
    checks = []
    if svj and svj.get("health", {}).get("type") not in (None, "none", "disabled"):
        checks.append(dict(svj["health"], source="fleet/sv/jobs.yaml"))
    lf = next((v for k, v in LOG_FOR.items() if k in cmd), None)
    if lf:
        checks.append({"type": "log_last_line", "path": lf[0], "ok_regex": lf[1], "bad_regex": lf[2], "max_age_s": max_age(per)})
    elif nv:
        logt = [t for t in nv.get("targets", []) if t.get("kind") == "log"]
        datat = [t for t in nv.get("targets", []) if t.get("kind") != "log"]
        for t in datat[:2]:
            checks.append({"type": "file_mtime" if t["kind"] != "dated" else "dated_file", "path": t["path"], "max_age_s": max_age(per)})
        for t in logt[:1]:
            checks.append({"type": "log_last_line", "path": t["path"], "bad_regex": BAD_RE, "max_age_s": max_age(per), "absent_ok": True})
    okv = ["NEW", "IDLE_SINCE_LAST_CHECK", "FIRST_SEEN"]
    if ((nv or {}).get("role") == "check" and not (note and "SILENT-NO-OP" in note[2])) or "mirror-from-staging.sh" in cmd:
        okv.append("NO_NEW_OUTPUT")  # a steady health check (or an idle canon mirror) repeats by design
    checks.append({"type": "novelty", "source": "~/fleet/output_novelty.json", "job": nv["id"] if nv else None,
                   "ok_verdicts": okv,
                   "note": "ops-guard output-novelty: new CONTENT, not mtime"})
    v = (nv or {}).get("verdict")
    last = (nv or {}).get("newest_output")
    ll = (nv or {}).get("last_log_line") or ""
    role = (nv or {}).get("role")
    status = {"NEW": "FRESH", "IDLE_SINCE_LAST_CHECK": "FRESH",
              "NO_NEW_OUTPUT": "CHECK-STEADY" if role == "check" else "SILENT-NO-OP",
              "LOCK_STALE+NO_RUN_EVIDENCE": "DEAD"}.get(v, "UNMEASURED" if not v else v)
    if re.search(r"state=FAILED|FAILED stage|FAILED_|rc=[1-9]", ll):
        status = "FAILING"
    if note and "SILENT-NO-OP" in note[2]:
        status = "SILENT-NO-OP"
    if "mirror-from-staging.sh" in cmd:
        status = "IDLE"  # canon unchanged since 982fe3f6d; DIVERGED Oracle master is logged by design
    if note and note[2].startswith("MIGRATED"):
        status = "FRESH"
    jobs.append({
        "id": jid, "host": "oracle-micro-2", "runs_on": note[1] if note else "oracle", "schedule": sched,
        "command": cmd.strip(), "comment": comment.strip()[:300] or None,
        "purpose": note[0] if note else (svj or {}).get("note") or comment[:160] or None,
        "csoai": not (note and note[1].startswith("not-csoai")),
        "status": status, "novelty_verdict": v, "novelty_role": role,
        "last_new_output": last if v in ("NEW", "IDLE_SINCE_LAST_CHECK") else ("2026-09-28T21:22:56Z" if "nsite-spray/run.sh" in cmd else "2026-09-28T21:23:29Z" if "watchdog-audit/run.sh" in cmd else None),
        "last_output_seen": last, "last_log_line": ll[:200] or None,
        "evidence_source": "oracle ~/fleet/output_novelty.json at %s" % nov["at"] if nv else None,
        "should_live": note[1] if note else "oracle", "action": note[2] if note else "none",
        "expected_output": checks,
        "supervise": (svj or {}).get("supervise", "observe"),
    })

# ---------------------------------------------------------------- Mac LaunchAgents (CSOAI labels)
CONDOR = ("condor-gspc fabric: runs from the UNTRACKED hummingbot/condor clone ~/clawd/councilof-ai-work/condor "
          "(branch csoai/gspc-harness-fabric-20260924, uv venv, data/ 1.1 GB, hummingbot docker stack; execution disabled)")
MAC_NOTES = {
    "ai.csoai.business-engine": ("condor business engine summary", "fabric"),
    "ai.csoai.gspc-episode-ledger": ("condor episode heartbeat ledger (KeepAlive)", "fabric"),
    "ai.csoai.gspc-episode-replay": ("replay condor episodes on the 3090 over ssh", "fabric-ssh"),
    "ai.csoai.gspc-event-plane": ("condor event plane --once", "fabric"),
    "ai.csoai.gspc-execution-readiness": ("condor execution-readiness report (execution stays disabled)", "fabric"),
    "ai.csoai.gspc-fred-context": ("FRED 15-series economic context -> councilof-ai-work/measurement/fred-economic-*", "fabric-input"),
    "ai.csoai.gspc-market-scan": ("condor crypto market-state scan daemon (60 s)", "fabric"),
    "ai.csoai.gspc-media-plane": ("condor media plane --once", "fabric"),
    "ai.csoai.gspc-multivenue-confirmation": ("condor multi-venue price confirmation", "fabric"),
    "ai.csoai.gspc-onchain-context": ("condor on-chain context", "fabric"),
    "ai.csoai.gspc-oracle-context": ("condor price-oracle context (60 s)", "fabric"),
    "ai.csoai.gspc-paper-observer": ("condor paper observer (binance_futures, paper only)", "fabric"),
    "ai.csoai.gspc-powerhouse-manager": ("condor powerhouse manager --network --services", "fabric"),
    "ai.csoai.gspc-public-surface-watch": ("condor watch of public CSOAI surfaces", "fabric"),
    "ai.csoai.gspc-runpod-motif": ("hourly motif run on the 3090 over ssh", "fabric-ssh"),
    "ai.csoai.gspc-sec-context": ("SEC EDGAR AI-filings context every 15 min -> measurement/sec-filings-* (788 files, content changes only by timestamp)", "fabric-input"),
    "ai.csoai.gspc-storage-guard": ("condor data/ storage guard", "fabric"),
    "ai.csoai.gspc-ui-projection": ("condor UI projection (60 s)", "fabric"),
    "ai.csoai.hummingbot-stack-watchdog": ("keeps the local hummingbot docker stack up (60 s)", "fabric"),
    "ai.csoai.m2-m4-paper-reconcile": ("M2<->M4 paper reconcile heartbeat", "fabric-ssh"),
    "ai.csoai.m2-shadow-sync": ("sync M2 shadow evidence to M4", "fabric-ssh"),
    "ai.csoai.oracle-gspc-witness-sync": ("pull Oracle gspc-witness output onto the Mac for condor", "fabric-input"),
    "ai.csoai.powerhouse-alignment": ("sync powerhouse alignment over ssh", "fabric-ssh"),
    "ai.csoai.powerhouse-cycle": ("powerhouse cycle --summary (condor venv) -> ~/.local/share/csoai/powerhouse-cycle/status.json", "fabric"),
    "ai.csoai.runpod-engine-runtime-check": ("heartbeat of the 3090 engine over ssh (KeepAlive)", "fabric-ssh"),
    "ai.csoai.runpod-evidence-sync": ("pull 3090 engine evidence onto the Mac over ssh", "fabric-ssh"),
}
OTHER = {
    "ai.csoai.watchdog-audit": dict(purpose="audit-only: 4 public GETs on councilof.ai + read-only runpodctl pod get", status="MIGRATED", should_live="oracle", action="MIGRATED to Oracle 13,43 * * * * (tested 21:23Z endpoints_ok=4/4); Mac plist moved to ~/Library/LaunchAgents/_disabled_automation_runpod_20260928/ (backup .bak kept)"),
    "com.csoai.nsite-spray": dict(purpose="8-apex spray report + prohibited-claim watch (read-only GETs)", status="MIGRATED", should_live="oracle", action="MIGRATED to Oracle 28 * * * * (tested 21:22Z blockers=0 claim_ok=7/8); Mac plist moved to _disabled_automation_runpod_20260928/ (backup kept)"),
    "com.csoai.1000x-master": dict(purpose="badger csoai-1000x.py harvester", status="DEAD", should_live="retire", action="inert: target scripts/badger/csoai-1000x.py missing, not loaded; last log 2026-09-04"),
    "com.csoai.harvest-fast": dict(purpose="badger csoai-1000x.py --harvesters-only", status="DEAD", should_live="retire", action="inert: target missing, not loaded; last log 2026-09-04"),
    "com.csoai.eat-all-chains": dict(purpose="badger csoai-eat-all-chains.py", status="DEAD", should_live="retire", action="inert: target missing, not loaded, log never created"),
    "com.csoai.axis-loop": dict(purpose="monorepo ops/cron/axis-loop.sh", status="DEAD", should_live="retire", action="inert: not loaded, /tmp/axis-loop.log never created"),
    "com.csoai.claim-capture-publish": dict(purpose="hourly publication lane: claim capture, operations, discovery, RAS intake (HF/site publishing)", status="FAILING", should_live="oracle (holds the HF token) or build-pod", action="HELD: exit 2 every hour ('Pod host key changed; refused connection', HELD_STORAGE); a publishing job needs owner OK + new pod target before any move"),
    "com.csoai.desktop-commander-remote": dict(purpose="Desktop Commander remote agent (controls this Mac)", status="FRESH", should_live="mac (infrastructure; must stay)", action="none"),
    "com.csoai.gspc-ollama-tunnel": dict(purpose="ssh -L 11434 to rp-3090-now ollama", status="DEAD", should_live="retire (mill moved to Kaggle; 3090 has gpuCount 0; ssh port drifted 12000->22434)", action="propose-retire: KeepAlive respawns every ~10 s, exit 255"),
    "com.csoai.ots-anchor": dict(purpose="daily OTS upgrade of .ots proofs in ~/councilof-ai-ops (atom-root dry-run)", status="SILENT-NO-OP", should_live="build-pod root-daily OTS stage (canon), not a dirty Mac tree", action="propose-retire after the pod OTS stage lands: upgrades land in a working tree with 3819 dirty paths, last commit 2026-09-15; nothing reaches canon"),
    "com.csoai.sovos-master-tunnel": dict(purpose="ssh -L 9000 to a SOVOS pod (MEOK product, not CSOAI)", status="DEAD", should_live="not-csoai (MEOK lane)", action="list-only: exit 255"),
}
for p in plists:
    lab = p.get("label")
    if not lab:
        continue
    logs = p.get("logs") or {}
    out_logs = [(k, v) for k, v in logs.items() if isinstance(v, list) and not k.endswith(("err.log", ".err", "stderr.log"))]
    err_logs = [(k, v) for k, v in logs.items() if isinstance(v, list) and k.endswith(("err.log", ".err", "stderr.log"))]
    newest_out = max((v[0] for k, v in out_logs if v[1] > 0), default=None)
    loaded = p.get("loaded")
    exit_code = loaded[1] if loaded else None
    per = interval_s(p.get("sched")) or (60 if (p.get("sched") or {}).get("KeepAlive") else None)
    if lab in OTHER:
        o = OTHER[lab]
        purpose, status, should, action = o["purpose"], o["status"], o["should_live"], o["action"]
        csoai = not should.startswith("not-csoai")
    else:
        purpose, kind = MAC_NOTES.get(lab, ("unannotated", "fabric"))
        purpose = purpose + " -- " + CONDOR
        if lab == "ai.csoai.powerhouse-cycle":
            newest_out = "2026-09-28T21:20Z"  # ~/.local/share/csoai/powerhouse-cycle/status.json ran_at, exit 0 (launchd logs are empty by design)
        lim = max_age(per) or 7200
        fresh = bool(newest_out) and (datetime.strptime(AT, "%Y-%m-%dT%H:%M:%SZ") - datetime.strptime(newest_out, "%Y-%m-%dT%H:%MZ")).total_seconds() <= lim
        if kind == "fabric-ssh" or exit_code == "255":
            status = "FAILING" if fresh else "DEAD"
            should = "retire with the fabric move (Mac->3090 ssh hops; 3090 ssh port drifted 12000->22434, no GPU)"
        else:
            status = "FRESH" if fresh else ("STALE" if newest_out else "UNMEASURED")
            should = "lanes-pod or backup-pod as ONE unit (venv + hummingbot stack + data/), after RunPod funding is GREEN"
        action = "HELD: owner decides whether the condor market fabric is CSOAI at all (memory evidence-compiler-claim-overstated); too heavy/coupled for a light move"
        csoai = True
    checks = [{"type": "launchd", "label": lab, "host": "mac", "readable_from": "mac only (Oracle cannot read the Mac: UNMEASURED there)",
               "log": (out_logs[0][0] if out_logs else None), "max_age_s": max_age(per) if per else None, "last_exit_ok": ["0", "-"]}]
    if lab == "com.csoai.nsite-spray" or lab == "ai.csoai.watchdog-audit":
        checks = [{"type": "disabled", "note": "moved to Oracle; see the oracle-micro-2 entry"}]
    jobs.append({
        "id": "mac-" + lab, "host": "mac", "runs_on": "mac", "schedule": p.get("sched"), "command": " ".join(a for a in p.get("args", []) if a),
        "purpose": purpose, "csoai": csoai, "status": status,
        "loaded": bool(loaded), "last_exit": exit_code,
        "last_new_output": newest_out, "last_output_seen": newest_out,
        "evidence_source": "stdout log mtime+size>0 via plist StandardOutPath (mtime is NOT proof of new content)",
        "err_log_mtime": max((v[0] for k, v in err_logs), default=None),
        "should_live": should, "action": action, "expected_output": checks, "supervise": "observe",
    })

# ---------------------------------------------------------------- Mac crontab (2 live lines)
jobs += [
    {"id": "mac-cron-meok-gaming-revenue", "host": "mac", "runs_on": "mac", "schedule": "*/15 * * * *", "command": "meok .venv python _intake/kimi_mmo/mcp-gaming-empress/api/daily_revenue_cron.py",
     "purpose": "MEOK gaming revenue cron", "csoai": False, "status": "UNMEASURED", "should_live": "not-csoai (MEOK lane)", "action": "list-only", "expected_output": [{"type": "none"}], "supervise": "observe", "last_new_output": None},
    {"id": "mac-cron-hermes-session-prune", "host": "mac", "runs_on": "mac", "schedule": "0 5 * * *", "command": "find ~/.hermes/sessions -name 'request_dump*.json' -mtime +30 -delete",
     "purpose": "Hermes housekeeping", "csoai": False, "status": "UNMEASURED", "should_live": "mac (Hermes)", "action": "list-only (Hermes: not touched)", "expected_output": [{"type": "none"}], "supervise": "observe", "last_new_output": None},
]

# ---------------------------------------------------------------- Hermes (LIST ONLY -- never touched)
H_CSOAI = {"csoai-standing-cycle": "oracle or build-pod as a plain cron (its mirror stage ssh-es to the 3090 at a drifted port)",
           "hf-evidence-mirror": "oracle (holds the HF token); its ssh source 194.26.196.156:12000 drifted to :22434",
           "ots-anchor-upgrade": "oracle flywheel ots-upgrade already covers /evac-bulk proofs; repo proofs belong to the build-pod root-daily OTS stage",
           "Run the hourly root/OTS integrity check": "oracle root-check (hourly :05) + prod-canary already cover it; this copy dies on LLM 429s",
           "Run the daily interop probe": "oracle as a plain script (no LLM provider in the loop)",
           "k3-autodeploy-watchdog": "oracle auto-land trigger log already records every deploy decision",
           "eu-ai-act-monitor": "wave-2 regulatory-watch lane owns this surface",
           "vercel-health-check": "retire (Vercel projects deleted 31 Aug)",
           "PUBLIC WATCHDOG SCANNER": "retire (target dir missing)",
           "daily-revenue-check": "oracle x402-revenue lane jobs",
           "funding-rounds-watch": "grants lane (wave 2)"}
H_OUTREACH = ("monday-outreach-brief", "weekly-newsletter-draft")
for h in hermes:
    nm = h.get("name", "")
    key = next((k for k in H_CSOAI if nm.startswith(k)), None)
    outreach = nm in H_OUTREACH
    err = (h.get("last_error") or "")
    err = re.sub(r"(?i)(key|token|secret|password)[=: ]+\S+", r"\1=<redacted>", err)[:160]
    st = "DISABLED" if not h.get("enabled") else ("FRESH" if h.get("last_status") == "ok" else ("FAILING" if h.get("last_status") == "error" else "UNMEASURED"))
    jobs.append({
        "id": "hermes-" + h["id"], "host": "mac", "runs_on": "mac:hermes", "schedule": (h.get("schedule") or {}).get("display"),
        "command": "hermes cron job '%s'%s" % (nm[:60], (" script=" + os.path.basename(h["script"])) if isinstance(h.get("script"), str) and h.get("script") else " (LLM prompt)"),
        "purpose": nm[:120], "csoai": bool(key) or outreach, "outreach": outreach, "status": st,
        "deliver": h.get("deliver"),
        "last_new_output": None, "last_run_at": h.get("last_run_at"), "last_status": h.get("last_status"), "last_error": err or None,
        "evidence_source": "~/.hermes/cron/jobs.json last_run_at/last_status (a run, not proof of new output)",
        "should_live": ("mac:hermes (outreach: owner-only, not touched)" if outreach else (H_CSOAI[key] if key else "not-csoai / Hermes-internal")),
        "action": "list-only: Hermes and its outreach crons are not touched by this lane" + ("; HELD owner: move/retire proposal in should_live" if key else ""),
        "expected_output": [{"type": "hermes", "id": h["id"], "field": "last_status", "ok": "ok", "readable_from": "mac only"}],
        "supervise": "observe",
    })

# ---------------------------------------------------------------- 3090 pod scheduler (fpowppss5ngtkw)
POD3090_NOTE = ("3090 pod fpowppss5ngtkw: RUNNING, gpuCount 0, resumed 2026-09-28T15:53:57Z; ssh port now 22434 (was 12000). "
                "No scheduler/loop process after the resume (ps, 21:20Z); fleet-export last 04:10Z; newest loop log line 08:21Z.")
MOVED = {"corrections-watch": "MOVED to oracle corrections-watch-oracle (28 Sep)", "root-check-pod": "MOVED to oracle root-check (22 Sep)"}
POD_SHOULD = {
    "mill-hourly": "kaggle (oracle mill-kaggle-daily already runs 1 model x 14 axes daily)",
    "arena-hourly": "kaggle, same kernel as the mill", "mill-hourly-land": "retire: Kaggle slices land via the staging mill branch",
    "harness-outcomes": "lanes-pod/build-pod reading canon (was reading stale 1f61fc707)",
    "durability-mirror": "oracle mirror-from-staging + hf-bundle already cover canon durability",
    "durability-hf-publish": "oracle (paused by owner-ruling need: target repo private)",
    "gspc-spray-hf": "oracle (HF token) or build-pod", "trust-chain": "oracle", "revenue-snapshot": "oracle", "settlement-dry": "oracle",
    "drift-draft": "build-pod or lanes-pod", "hubcard-refresh": "build-pod (canon checkout)", "capability-probe": "lanes-pod",
    "census-capture": "lanes-pod (OOM at 512 MB on the 3090)", "distribution-measure": "oracle (pypi-footprint overlaps)",
    "swh-archive": "oracle", "swh-visit-readback": "oracle", "claim-watch-measure": "oracle (claim-watch overlaps)",
    "indexnow-ping": "retire (duplicate of build-pod per-deploy IndexNow)", "register-402index": "oracle (third-party POST: owner-gated)",
    "settle-all-doors": "PAUSED: no payer key; keep paused (wallet/payment is out of scope)", "commission-dispatch": "PAUSED_NO_WORKER",
    "bazaar-conformance": "retire (duplicate of oracle flywheel x402-daily; OOM)", "hf-flush": "oracle", "watchdog": "retire with the pod",
    "runpod-upload-heartbeat": "retire with the pod",
}
for name, j in sorted(podj["jobs"].items()):
    nv = next((n for n in nov_jobs if n["id"] == "pod-" + name), None)
    jobs.append({
        "id": "pod3090-" + name, "host": "pod:fpowppss5ngtkw", "runs_on": "3090 pod scheduler (scripts/pod-loops/scheduler.sh)",
        "schedule": None, "command": "/workspace/lanes/loops/%s.sh" % name,
        "purpose": (j.get("tail") or [""])[-1][:160] or None, "csoai": True,
        "status": MOVED.get(name) and "MOVED" or "DEAD",
        "paused_reason": j.get("paused_reason"),
        "last_new_output": (nv or {}).get("newest_output") if (nv or {}).get("verdict", "").endswith("+NEW") else None,
        "last_output_seen": (nv or {}).get("newest_output") or j.get("last_ts"),
        "evidence_source": "oracle ~/fleet/pod_jobs.json exported %s + output_novelty %s" % (podj.get("exported_at"), nov["at"]),
        "should_live": MOVED.get(name) or POD_SHOULD.get(name, "decide per job"),
        "action": "HELD: owner decides whether to restart the 3090 scheduler or retire the pod ($0.11/h, no GPU); this lane did not restart it",
        "expected_output": [{"type": "pod_job", "host": "pod:fpowppss5ngtkw", "log": j.get("log"), "source": "~/fleet/pod_jobs.json", "max_export_age_s": 7200}],
        "supervise": "observe", "note": POD3090_NOTE,
    })

# ---------------------------------------------------------------- non-cron hosts
jobs += [
    {"id": "buildpod-none", "host": "pod:bdtrt0pxi1zp3b", "runs_on": "build pod", "schedule": None, "command": None,
     "purpose": "build pod runs NO cron (no crontab binary); every build-pod job is an Oracle-triggered entry above (auto-land, root-daily, capsule-publish, cf-oauth-refresh, proofof-daily, ux-gauntlet, sov-resolve, listings-publish, daily-note IndexNow)",
     "csoai": True, "status": "INFO", "should_live": "build-pod", "action": "HELD: set start command bash /workspace/ci/pod-start-hook.sh (needs a pod restart)",
     "expected_output": [{"type": "pod_log_last_line", "host": "build-pod", "path": "/workspace/staging/logs/auto-land.log", "ok_regex": "unchanged|DEPLOYED|triggered", "bad_regex": "FAILED|HELD", "max_age_s": 3 * 3600 * 2 + 3600}], "supervise": "observe", "last_new_output": None},
    {"id": "lanespod-none", "host": "pod:wrrks6yswt9qft", "runs_on": "lanes pod", "schedule": None, "command": None,
     "purpose": "lanes pod (8 vCPU/16 GB, 28 Sep) runs no scheduled job; lane builds only", "csoai": True, "status": "INFO",
     "should_live": "-", "action": "none", "expected_output": [{"type": "none"}], "supervise": "observe", "last_new_output": None},
    {"id": "backuppod-exited", "host": "pod:dgj6roe9sazwsd", "runs_on": "backup pod", "schedule": None, "command": None,
     "purpose": "backup pod EXITED (runpodctl 21:20Z); Oracle jobs that ssh to it (port 24817): tool-drift, public-signals, proofof-daily step backup_pod, sov-push-from-oracle",
     "csoai": True, "status": "DEAD", "should_live": "-", "action": "HELD: owner funds RunPod, then re-point those four via ~/fleet/build-pod.env or start the backup pod",
     "expected_output": [{"type": "none"}], "supervise": "observe", "last_new_output": None},
]
for j in sv["jobs"]:
    if j["host"].startswith(("hf-jobs", "github")):
        jobs.append({"id": j["id"], "host": j["host"], "runs_on": j["host"], "schedule": j.get("schedule"), "command": j.get("command"),
                     "purpose": j.get("note"), "csoai": True, "status": "DEAD" if j["host"].startswith("github") else "UNMEASURED",
                     "should_live": "retire (GitHub account flagged since 2 Sep; deploy is the build pod)" if j["host"].startswith("github") else "hf-jobs",
                     "action": "none", "expected_output": [{"type": "none"}], "supervise": "observe", "last_new_output": None})

from collections import Counter
by = Counter((j["host"].split(":")[0] if not j["host"].startswith("pod:") else j["host"], j["status"]) for j in jobs)
out = {
    "schema": "csoai.jobs-registry/0.1",
    "lane": "automation-runpod-20260928",
    "generated_at": AT,
    "readers": ["ops-guard output-novelty/supervisor (Oracle)", "fleet/automation/jobs_check.py"],
    "check_types": {
        "log_last_line": "last non-empty line of path matches ok_regex, not bad_regex, and file age <= max_age_s",
        "json_field_age": "ISO field in a JSON file younger than max_age_s (fleet-supervisor semantics)",
        "file_mtime": "file age <= max_age_s (weak: mtime is not new content; pair with novelty)",
        "dated_file": "newest file under a <date> path is today's or yesterday's",
        "novelty": "ops-guard ~/fleet/output_novelty.json verdict for job is in ok_verdicts (new CONTENT)",
        "hf_repo_fresh": "HF repo lastModified younger than max_age_s",
        "pod_job": "3090 scheduler export (~/fleet/pod_jobs.json) newer than max_export_age_s, job not PAUSED",
        "pod_log_last_line": "log_last_line on a pod path (/workspace is shared by build + lanes pods)",
        "launchd": "Mac-only; UNMEASURED from Oracle",
        "hermes": "Mac-only Hermes job last_status; listed, never acted on",
        "disabled": "job moved or retired; no check",
        "none": "no machine-readable output",
    },
    "sources": {
        "mac": "~/Library/LaunchAgents (ai|com).csoai.* plists + launchctl list, crontab -l, ~/.hermes/cron/jobs.json (read-only) at ~21:18Z",
        "oracle": "crontab -l, ~/fleet/sv/jobs.yaml, ~/fleet/output_novelty.json (%s)" % nov["at"],
        "pod3090": "~/fleet/pod_jobs.json (%s) + ssh -p 22434 ps/logs 21:20Z" % podj.get("exported_at"),
        "runpod": "runpodctl get pod -a on Oracle 21:20Z: build bdtrt0pxi1zp3b RUNNING, lanes wrrks6yswt9qft RUNNING, 3090 fpowppss5ngtkw RUNNING gpu 0, backup dgj6roe9sazwsd EXITED, old build otq1ayv55jcm2c EXITED",
        "funding": "~/fleet/runpod_funding.json 21:15Z: balance $31.31, spend $3.402/h, runway 9.2 h, level RED",
    },
    "counts": {"jobs": len(jobs), "by_host_status": {"%s|%s" % k: v for k, v in sorted(by.items())}},
    "migrated_this_lane": [
        {"from": "mac com.csoai.nsite-spray (hourly)", "to": "oracle 28 * * * * ~/lanes/automation-runpod-20260928/nsite-spray/run.sh", "tested": "2026-09-28T21:22:56Z rc=0 blockers=0 sites=8 claim_ok=7/8", "mac_copy": "launchctl bootout + plist moved to ~/Library/LaunchAgents/_disabled_automation_runpod_20260928/ (.bak kept)"},
        {"from": "mac ai.csoai.watchdog-audit (5 min)", "to": "oracle 13,43 * * * * ~/lanes/automation-runpod-20260928/watchdog-audit/run.sh", "tested": "2026-09-28T21:23:29Z rc=0 endpoints_ok=4/4 runpod=ok/RUNNING", "mac_copy": "same"},
    ],
    "held": [
        {"item": "build pod start command = bash /workspace/ci/pod-start-hook.sh", "why": "changing dockerStartCmd restarts the pod (container disk wiped; bootstrap-pod.sh rebuilds ~2 min)",
         "proposed_time": "2026-09-28T22:30Z-23:30Z (between the 21:20Z and 00:20Z auto-land runs; no Oracle->build-pod daily job in that window), or during the RunPod top-up; if the balance hits $0 first (~06:30Z 29 Sep) set it while the pod is stopped, before resuming",
         "owner_ask": "OK to restart build pod bdtrt0pxi1zp3b once to set its start command?"},
    ],
    "jobs": jobs,
}
json.dump(out, open(os.path.join(S, "JOBS.json"), "w"), indent=1, default=str)
print(json.dumps(out["counts"], indent=1))
