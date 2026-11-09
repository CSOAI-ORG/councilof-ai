#!/bin/bash
# durability-mirror.sh -- give the repository of record more than one home, and PROVE each
# home by reading its tip back rather than by trusting the push's exit code.
#
# Registered 2026-09-22 by the durability lane. Before it, /workspace/git/councilof-ai.git
# held 6,295 commits with `git remote -v` EMPTY: the site deployed from it, every lane
# pushed to it, and a billing failure on a rented GPU box would have taken the estate with
# it. GitHub held a copy but nothing kept it current -- it was 43 commits behind when this
# lane measured it, which is the exact failure mode this loop exists to make visible.
#
# WHAT IT DOES, per mirror:
#   1. push every ref;
#   2. read the mirror's OWN master tip back over the wire (ls-remote / HF API);
#   3. record that tip sha in the receipt -- never "push exited 0".
# A mirror that silently stops updating is worse than no mirror, so a mirror whose tip is
# not an ancestor of ours, or whose tip commit is more than $STALE_H hours older than ours,
# is LOUD: an ALERT line in the log, a line in ALERTS.log, and status "ALERT" in STATUS.json.
#
# The scheduler owns the stamp. This script takes --now and never stamps itself: a second
# stamp would find the first already written and the run would exit 0 having mirrored nothing.
# One receipt line per run INCLUDING the runs with nothing to push.
#
# Mirrors (see /workspace/lanes/out/durability/DURABILITY.md for the restore procedure):
#   oracle  ubuntu@141.147.73.85:mirrors/councilof-ai.git   -- live git remote, every ref
#   github  CSOAI-ORG/councilof-ai refs/mirror/*            -- live, under a ref namespace no
#                                                              workflow watches, so mirroring
#                                                              can never trigger a deploy
#   iok     IOKs-MacBook-Air ~/clawd/mirrors/councilof-ai.git -- PULL-side; a laptop cannot
#                                                              receive a push, so it fetches
#                                                              from oracle on its own timer and
#                                                              this loop only REPORTS its lag,
#                                                              read from the receipt it leaves.
#   hf      csoai/councilof-ai-source                       -- NOT a git mirror. Hugging Face's
#                                                              pre-receive hook refuses any push
#                                                              containing a file over 10 MiB and this
#                                                              history has 15 of them. HF carries two
#                                                              DATED artifacts instead: a browsable
#                                                              source/ snapshot (the public source link
#                                                              the MCP registry entries need, because
#                                                              the GitHub org is anonymously invisible)
#                                                              and a full-history git bundle. Weekly,
#                                                              and every check is anonymous.
set -u
. "$(dirname "$0")/lib.sh"

LOG=durability-mirror
SRC=${SRC_REPO:-/workspace/git/councilof-ai.git}
DUR=$OUT/durability
STALE_H=${STALE_H:-3}          # hours a mirror's tip may trail ours before it is LOUD
BUNDLE_MAX_DAYS=${BUNDLE_MAX_DAYS:-8}

mkdir -p "$DUR"

[ "${1:-}" = "--now" ] || { log $LOG "SKIP not invoked with --now (the scheduler owns the stamp)"; exit 0; }

exec 9>"$STATE/$LOG.lock"
flock -n 9 || { log $LOG "SKIP another run holds the lock"; exit 0; }

[ -d "$SRC" ] || { log $LOG "ALERT source repo absent at $SRC -- nothing mirrored"; exit 0; }

SRC_TIP=$(git -C "$SRC" rev-parse master 2>/dev/null || echo "")
SRC_COUNT=$(git -C "$SRC" rev-list --count master 2>/dev/null || echo 0)
SRC_REFS=$(git -C "$SRC" for-each-ref --format='%(refname)' 2>/dev/null | wc -l)
SRC_EPOCH=$(git -C "$SRC" log -1 --format=%ct master 2>/dev/null || echo 0)
[ -n "$SRC_TIP" ] || { log $LOG "ALERT source master unreadable at $SRC"; exit 0; }

RESULTS=""   # name|status|tip|count|detail
LOUD=0

add() { RESULTS="$RESULTS$1|$2|$3|$4|$5
"; [ "$2" = "ALERT" ] && LOUD=1; return 0; }

# verdict <mirror-tip> -> VERIFIED (identical) | BEHIND (ancestor, within STALE_H) | ALERT
verdict() {
  local tip=$1
  [ -n "$tip" ] || { echo "ALERT|mirror reported no master tip"; return; }
  [ "$tip" = "$SRC_TIP" ] && { echo "VERIFIED|tip identical to source"; return; }
  if ! git -C "$SRC" cat-file -e "$tip" 2>/dev/null; then
    echo "ALERT|mirror tip $tip is an object this repo does not have -- divergence, not lag"; return
  fi
  if ! git -C "$SRC" merge-base --is-ancestor "$tip" "$SRC_TIP" 2>/dev/null; then
    echo "ALERT|mirror tip $tip is NOT an ancestor of source -- divergence"; return
  fi
  local behind age_h mepoch
  behind=$(git -C "$SRC" rev-list --count "$tip..$SRC_TIP" 2>/dev/null || echo "?")
  mepoch=$(git -C "$SRC" log -1 --format=%ct "$tip" 2>/dev/null || echo 0)
  age_h=$(( (SRC_EPOCH - mepoch) / 3600 ))
  if [ "$age_h" -ge "$STALE_H" ]; then
    echo "ALERT|behind by $behind commits / ${age_h}h -- over the ${STALE_H}h floor"
  else
    echo "BEHIND|behind by $behind commits / ${age_h}h (a lane landed during the run)"
  fi
}

# ---------------------------------------------------------------- oracle (live git remote)
if git -C "$SRC" remote | grep -qx oracle; then
  po=$(git -C "$SRC" push --mirror oracle 2>&1); prc=$?
  pushed=$(printf '%s' "$po" | grep -cE '^ [*=+!-]|->' || true)
  tip=$(git -C "$SRC" ls-remote oracle master 2>/dev/null | awk '{print $1}' | head -1)
  if [ $prc -ne 0 ] && [ -z "$tip" ]; then
    add oracle ALERT "" "" "push rc=$prc and tip unreadable: $(printf '%s' "$po" | tail -1 | head -c 160)"
  else
    v=$(verdict "$tip"); st=${v%%|*}; det=${v#*|}
    cnt=$(git -C "$SRC" rev-list --count "$tip" 2>/dev/null || echo "?")
    [ "$pushed" -eq 0 ] && det="$det; nothing to push"
    add oracle "$st" "$tip" "$cnt" "$det"
  fi
else
  add oracle ALERT "" "" "remote 'oracle' is not configured on $SRC"
fi

# ---------------------------------------------- github (refs/mirror/* -- triggers no workflow)
if git -C "$SRC" remote | grep -qx ghmirror; then
  po=$(git -C "$SRC" push --prune ghmirror \
        '+refs/heads/*:refs/mirror/heads/*' '+refs/tags/*:refs/mirror/tags/*' 2>&1); prc=$?
  pushed=$(printf '%s' "$po" | grep -cE '^ [*=+!-]|->' || true)
  tip=$(git -C "$SRC" ls-remote ghmirror 'refs/mirror/heads/master' 2>/dev/null | awk '{print $1}' | head -1)
  if [ $prc -ne 0 ] && [ -z "$tip" ]; then
    add github ALERT "" "" "push rc=$prc and tip unreadable: $(printf '%s' "$po" | tail -1 | head -c 160)"
  else
    v=$(verdict "$tip"); st=${v%%|*}; det=${v#*|}
    cnt=$(git -C "$SRC" rev-list --count "$tip" 2>/dev/null || echo "?")
    [ "$pushed" -eq 0 ] && det="$det; nothing to push"
    add github "$st" "$tip" "$cnt" "$det (refs/mirror/heads/master)"
  fi
else
  # NOT an alert: it is a true, deliberate absence. The pod holds no GitHub credential and
  # this lane would not mint one on its own -- a token on the pod is a wider blast radius
  # than the problem it solves. GitHub already holds a copy (CSOAI-ORG/councilof-ai) but
  # nothing keeps it current: it was 43 commits behind when this lane measured it, and it
  # only moves when somebody pushes from the Mac. To turn this into a live fourth home the
  # owner runs, once, on the pod:
  #   git -C /workspace/git/councilof-ai.git remote add ghmirror \
  #       https://<user>:<PAT-with-repo-scope>@github.com/CSOAI-ORG/councilof-ai.git
  # refs/mirror/* is used on purpose: no workflow watches that namespace, so mirroring can
  # never trigger a deploy and can never clobber prod.
  add github NOT-CONFIGURED "" "" "no ghmirror remote on the pod (no GitHub credential here); GitHub holds a stale copy that only moves when someone pushes from the Mac"
fi

# ------------------------------------------------------- iok (pull-side; we only report lag)
IOK_RECEIPT=$DUR/iok-receipt.json
# The laptop is behind NAT and cannot be pushed to or polled. It leaves its receipt on
# oracle -- the one box both of them can reach -- and we read it from there. If the
# laptop has been shut for a week that is exactly what the lag will say.
ssh -o BatchMode=yes -o ConnectTimeout=20 oracle-mirror \
    "cat mirrors/iok-receipt.json" > "$IOK_RECEIPT.new" 2>/dev/null \
  && [ -s "$IOK_RECEIPT.new" ] && mv "$IOK_RECEIPT.new" "$IOK_RECEIPT"
rm -f "$IOK_RECEIPT.new"
if [ -f "$IOK_RECEIPT" ]; then
  tip=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('tip',''))" "$IOK_RECEIPT" 2>/dev/null || echo "")
  seen=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('as_of',''))" "$IOK_RECEIPT" 2>/dev/null || echo "")
  v=$(verdict "$tip"); st=${v%%|*}; det=${v#*|}
  cnt=$(git -C "$SRC" rev-list --count "$tip" 2>/dev/null || echo "?")
  add iok "$st" "$tip" "$cnt" "$det; pull-side, receipt as_of=$seen"
else
  add iok ALERT "" "" "no receipt at $IOK_RECEIPT -- the laptop has not reported since this loop was installed"
fi

# ------------------------------------------------------------- hf (dated full-history bundle)
HF_STATE=$DUR/hf-bundle-latest.json
if [ -f "$HF_STATE" ]; then
  read -r hb_tip hb_count hb_date hb_days <<<"$(python3 - "$HF_STATE" <<'PY'
import json,sys,datetime
d=json.load(open(sys.argv[1]))
t=d.get("tip","") or "-"
c=d.get("commit_count","?")
dt=d.get("as_of","")
try:
    age=(datetime.datetime.now(datetime.timezone.utc)-datetime.datetime.fromisoformat(dt.replace("Z","+00:00"))).days
except Exception:
    age=999
print(t,c,dt or "-",age)
PY
)"
  if [ "${hb_days:-999}" -gt "$BUNDLE_MAX_DAYS" ]; then
    add hf ALERT "$hb_tip" "$hb_count" "newest bundle is ${hb_days}d old (> ${BUNDLE_MAX_DAYS}d); as_of=$hb_date"
  else
    behind=$(git -C "$SRC" rev-list --count "$hb_tip..$SRC_TIP" 2>/dev/null || echo "?")
    add hf SNAPSHOT "$hb_tip" "$hb_count" "dated source/ snapshot + full-history bundle, ${hb_days}d old, behind by $behind commits; public at https://huggingface.co/datasets/csoai/councilof-ai-source; NOT a live mirror (HF refuses >10MiB files); as_of=$hb_date"
  fi
else
  add hf ALERT "" "" "no bundle recorded at $HF_STATE"
fi

# ------------------------------------------------------------------------------- receipts
TS=$(now)
DUR="$DUR" TS="$TS" SRC_TIP="$SRC_TIP" SRC_COUNT="$SRC_COUNT" SRC_REFS="$SRC_REFS" \
LOUD="$LOUD" RESULTS="$RESULTS" python3 <<'PY'
import json, os
dur = os.environ["DUR"]; ts = os.environ["TS"]
tip = os.environ["SRC_TIP"]; count = os.environ["SRC_COUNT"]
refs = os.environ["SRC_REFS"]; loud = os.environ["LOUD"]
rows = []
for line in os.environ["RESULTS"].splitlines():
    if not line.strip():
        continue
    n, st, t, c, d = (line.split("|", 4) + ["", "", "", ""])[:5]
    rows.append({"mirror": n, "status": st, "tip": t or None,
                 "commit_count": (int(c) if c.isdigit() else None), "detail": d})
rec = {"as_of": ts,
       "source": {"path": "/workspace/git/councilof-ai.git", "tip": tip,
                  "commit_count": int(count), "ref_count": int(refs)},
       "mirrors": rows, "loud": loud == "1"}
with open(os.path.join(dur, "receipts.jsonl"), "a") as f:
    f.write(json.dumps(rec) + "\n")
with open(os.path.join(dur, "STATUS.json"), "w") as f:
    json.dump(rec, f, indent=2)
if loud == "1":
    with open(os.path.join(dur, "ALERTS.log"), "a") as f:
        for r in rows:
            if r["status"] == "ALERT":
                f.write("%s %s %s\n" % (ts, r["mirror"], r["detail"]))
PY

SUMMARY=$(printf '%s' "$RESULTS" | awk -F'|' 'NF{printf "%s=%s(%s) ", $1, $2, (substr($3,1,12)=="" ? "-" : substr($3,1,12))}')
if [ "$LOUD" = "1" ]; then
  log $LOG "ALERT src=${SRC_TIP:0:12} n=$SRC_COUNT refs=$SRC_REFS | $SUMMARY| see $DUR/ALERTS.log"
  printf '%s\n' "$RESULTS" | awk -F'|' '$2=="ALERT"{print "  ALERT " $1 ": " $5}'
else
  log $LOG "OK src=${SRC_TIP:0:12} n=$SRC_COUNT refs=$SRC_REFS | $SUMMARY"
fi
exit 0
