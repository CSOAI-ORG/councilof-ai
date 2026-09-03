#!/bin/bash
# agent-health.sh — one place that says which launchd agents are actually working.
#
# WHY. On 2026-09-03 six of sixteen com.csoai agents were failing and had been for
# as long as they were installed. Nothing surfaced it: each agent writes to its own
# log, nobody reads sixteen logs, and `launchctl list` shows the exit status in a
# column that scrolls past. The master EAT cron had NEVER completed a single run.
#
#   com.csoai.eat-all-chains    2    /bin/bash running a .py  → dies on the docstring
#   com.csoai.csoai-t2-atoms    2    same
#   com.csoai.csoai-t3-atoms    2    same
#   com.csoai.corrections-check 127  target script never existed
#   com.csoai.axis-loop         255  ssh to a pod that no longer exists
#   com.csoai.sovos-master-tunnel 255 same
#
# Two failure modes are checked structurally rather than by exit code, because both
# fail BEFORE the agent can write anything a log would show:
#   - interpreter mismatch: launchd execs argv[0] literally and ignores shebangs
#   - missing target: launchd cannot open StandardOutPath either, so there is no log
#
#   bash scripts/badger/agent-health.sh          # report
#   bash scripts/badger/agent-health.sh --quiet  # exit 1 if anything is broken
set -uo pipefail
quiet=0; [ "${1:-}" = "--quiet" ] && quiet=1
bad=0

for f in "$HOME"/Library/LaunchAgents/com.csoai.*.plist; do
  [ -e "$f" ] || continue
  label=$(basename "$f" .plist)
  interp=$(/usr/libexec/PlistBuddy -c "Print :ProgramArguments:0" "$f" 2>/dev/null)
  target=$(/usr/libexec/PlistBuddy -c "Print :ProgramArguments:1" "$f" 2>/dev/null)
  status=$(launchctl list 2>/dev/null | awk -v l="$label" '$3==l{print $2}')
  notes=""

  case "$target" in
    /*)
      [ -f "$target" ] || notes="${notes}TARGET-MISSING "
      case "$interp:$target" in
        */bash:*.py|*/sh:*.py)   notes="${notes}BASH-RUNS-PYTHON " ;;
        */python*:*.sh)          notes="${notes}PYTHON-RUNS-SHELL " ;;
      esac
      ;;
  esac
  # A non-zero exit is not automatically a broken agent. Some agents exit
  # non-zero as their DESIGNED signal: com.csoai.site-watch returns 1 when the
  # site it monitors is failing, which is the agent working, not the agent
  # broken. Reporting those identically buries a real outage among plumbing
  # faults — this check flagged site-watch as BROKEN while www.csoai.org had
  # been down for 235 consecutive probes. Separate the two.
  case "$label" in
    com.csoai.site-watch)
      [ "${status:-0}" != "0" ] && notes="${notes}REPORTING-AN-OUTAGE(exit=${status}) "
      ;;
    *)
      case "${status:-}" in
        ""|0) ;;
        *) notes="${notes}exit=${status} " ;;
      esac
      ;;
  esac

  if [ -n "$notes" ]; then
    bad=$((bad+1))
    [ "$quiet" -eq 1 ] || printf "  BROKEN  %-32s %s\n" "$label" "$notes"
  else
    [ "$quiet" -eq 1 ] || printf "  ok      %-32s\n" "$label"
  fi
done

echo
if [ "$bad" -eq 0 ]; then
  echo "  agent-health: all agents healthy."
  exit 0
fi
echo "  agent-health: $bad agent(s) broken."
echo "  BASH-RUNS-PYTHON / TARGET-MISSING fail before they can write a log —"
echo "  an empty log is the symptom, not evidence the agent was quiet."
exit 1
