#!/usr/bin/env bash
# hermes-align.sh — bring an M2 or M4 Hermes machine into the state the estate now requires.
#
# Run it on either machine. It reports by default and changes nothing until you pass --apply.
#
# WHY THIS EXISTS. On 16 and 17 September 2026 the two machines drifted apart in ways that each
# looked fine locally and were expensive together:
#   * One produced 1,915 files carrying the .ots extension that were not OpenTimestamps proofs, and
#     published manifests asserting each was awaiting Bitcoin confirmation. A random sample of 60
#     contained zero real proofs. The deploy gate caught them; nothing else did.
#   * A dead XAI_API_KEY in the env file shadowed the working OAuth session the paid subscription
#     uses, so Hermes appeared to have no providers at all.
#   * agent.reasoning_effort was xhigh, an xAI-only value that OpenAI rejects outright, so every
#     fallback died on a parameter rather than on capacity.
#   * A value containing < or > was pasted into the env file, breaking shell parsing of every line
#     below it.
#   * Direct pushes to master bypassed every gate.
#
# Each check below exists because one of those happened. None is hypothetical.
set -uo pipefail

APPLY=0
REPO="${CSOAI_REPO:-$HOME/clawd/councilof-ai-work}"
for a in "$@"; do
  case "$a" in
    --apply) APPLY=1 ;;
    --repo=*) REPO="${a#--repo=}" ;;
    --selftest) SELFTEST=1 ;;
    -h|--help) sed -n '1,30p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  esac
done

PASS=0; WARN=0; FAIL=0; OWNER=0
ok()    { printf '  \033[32mok\033[0m    %s\n' "$*"; PASS=$((PASS+1)); }
warn()  { printf '  \033[33mwarn\033[0m  %s\n' "$*"; WARN=$((WARN+1)); }
bad()   { printf '  \033[31mFAIL\033[0m  %s\n' "$*"; FAIL=$((FAIL+1)); }
owner() { printf '  \033[36mOWNER\033[0m %s\n' "$*"; OWNER=$((OWNER+1)); }
head2() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

ENVF="$HOME/.hermes/.env"
CFG="$HOME/.hermes/config.yaml"

# ─────────────────────────────────────────────────────────────────────────────
head2 "1. The env file parses, and holds no prose pretending to be a credential"
# ─────────────────────────────────────────────────────────────────────────────
if [ ! -f "$ENVF" ]; then
  bad "$ENVF does not exist"
else
  if ( set -a; . "$ENVF" ) >/dev/null 2>&1; then
    ok "env file sources cleanly"
  else
    bad "env file does NOT parse — every line below the bad one is silently lost"
    ( set -a; . "$ENVF" ) 2>&1 | head -3 | sed 's/^/        /'
  fi

  # A value containing < or > is a placeholder someone pasted, not a secret.
  PROSE=$(grep -nE '^[A-Za-z_][A-Za-z0-9_]*=.*[<>]' "$ENVF" | cut -d: -f2 | cut -d= -f1 | tr '\n' ' ')
  if [ -n "$PROSE" ]; then
    bad "prose in a credential slot (contains < or >): $PROSE"
    if [ "$APPLY" = "1" ]; then
      cp "$ENVF" "$ENVF.bak-align-$(date +%Y%m%d-%H%M%S)"
      python3 - "$ENVF" <<'PY'
import re,sys,pathlib
p=pathlib.Path(sys.argv[1]); out=[]
for l in p.read_text().splitlines():
    m=re.match(r'^([A-Za-z_][A-Za-z0-9_]*)=(.*)$',l)
    if m and ('<' in m.group(2) or '>' in m.group(2)):
        out.append(f"# REMOVED by hermes-align (prose, not a credential): {m.group(1)}")
    else: out.append(l)
p.write_text("\n".join(out)+"\n")
PY
      ok "removed, original backed up"
    fi
  else
    ok "no prose in any credential slot"
  fi

  # An unexpanded ${NAME} is sent to the provider as a literal string.
  PH=$(grep -cE '^[A-Za-z_][A-Za-z0-9_]*=\$\{' "$ENVF" || true)
  if [ "${PH:-0}" -gt 0 ]; then
    bad "$PH slot(s) hold an unexpanded \${NAME} and would be sent as a literal API key"
  else
    ok "no unexpanded placeholders"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
head2 "2. No dead key is shadowing a working OAuth session"
# ─────────────────────────────────────────────────────────────────────────────
if [ -f "$HOME/.hermes/auth.json" ] && python3 -c "
import json,sys,os
d=json.load(open(os.path.expanduser('~/.hermes/auth.json')))
sys.exit(0 if 'xai-oauth' in (d.get('providers') or {}) else 1)" 2>/dev/null; then
  if grep -qE '^XAI_API_KEY=' "$ENVF" 2>/dev/null; then
    bad "XAI_API_KEY is set AND an xai-oauth session exists — the env key shadows the paid session"
    [ "$APPLY" = "1" ] && sed -i.bak-align '/^XAI_API_KEY=/d' "$ENVF" && ok "XAI_API_KEY removed"
  else
    ok "xai-oauth session present with no env key shadowing it"
  fi
else
  warn "no xai-oauth session on this machine (fine if this machine does not use it)"
fi

# ─────────────────────────────────────────────────────────────────────────────
head2 "3. Reasoning level is one every provider accepts"
# ─────────────────────────────────────────────────────────────────────────────
if [ -f "$CFG" ]; then
  RE=$(python3 -c "
import yaml,os
d=yaml.safe_load(open(os.path.expanduser('~/.hermes/config.yaml')))
print((d.get('agent') or {}).get('reasoning_effort',''))" 2>/dev/null)
  case "$RE" in
    xhigh) bad "agent.reasoning_effort is xhigh — xAI-only; OpenAI rejects it and every fallback dies on it"
           if [ "$APPLY" = "1" ]; then
             python3 -c "
import yaml,os,pathlib
p=pathlib.Path(os.path.expanduser('~/.hermes/config.yaml'))
d=yaml.safe_load(p.read_text()); d['agent']['reasoning_effort']='high'
p.write_text(yaml.safe_dump(d,sort_keys=False,allow_unicode=True,width=4096))"
             ok "set to high"
           fi ;;
    minimal|low|medium|high) ok "agent.reasoning_effort is $RE" ;;
    "") warn "agent.reasoning_effort is unset" ;;
    *) warn "agent.reasoning_effort is '$RE' — verify every configured provider accepts it" ;;
  esac
else
  bad "$CFG does not exist"
fi

# ─────────────────────────────────────────────────────────────────────────────
head2 "4. No file claims to be a timestamp without being one"
# ─────────────────────────────────────────────────────────────────────────────
if [ -d "$REPO" ]; then
  if [ -f "$REPO/scripts/ots_guard.py" ]; then
    if ( cd "$REPO" && python3 scripts/ots_guard.py >/tmp/align-ots.log 2>&1 ); then
      ok "every .ots under public/ is a real proof and still covers its file"
    else
      # Two different defects, and conflating them sends you to the wrong fix. A FAKE is bytes that
      # are not a proof. An ORPHAN is a real proof whose artefact was regenerated underneath it.
      FAKE=$(grep -c 'NOT OpenTimestamps proofs' /tmp/align-ots.log); FAKE=${FAKE:-0}
      ORPH=$(grep -c 'ORPHANED' /tmp/align-ots.log); ORPH=${ORPH:-0}
      if [ "$FAKE" -gt 0 ]; then
        bad "file(s) carry the .ots name without being timestamps"
        echo "        A manifest is generated FROM THE BYTES, never from a list of files you meant to stamp."
      fi
      if [ "$ORPH" -gt 0 ]; then
        bad "a real proof no longer covers its artefact — the artefact was regenerated under its stamp"
        grep -A 1 'ORPHANED' /tmp/align-ots.log | tail -2 | sed 's/^/        /'
        echo "        fix: re-stamp the artefact. Never regenerate underneath an existing stamp."
      fi
      if [ "$APPLY" = "1" ] && [ -f "$REPO/scripts/ots_manifest_rebuild.py" ]; then
        ( cd "$REPO" && python3 scripts/ots_manifest_rebuild.py --apply ) | sed 's/^/        /'
      else
        echo "        fix: cd $REPO && python3 scripts/ots_manifest_rebuild.py --apply"
      fi
    fi
  else
    bad "scripts/ots_guard.py missing — this machine cannot detect fake proofs at all"
  fi
else
  warn "repo not found at $REPO (pass --repo=/path)"
fi

# ─────────────────────────────────────────────────────────────────────────────
head2 "5. This machine cannot push straight to master"
# ─────────────────────────────────────────────────────────────────────────────
if command -v gh >/dev/null 2>&1; then
  PROT=$(gh api repos/CSOAI-ORG/councilof-ai/branches/master/protection --jq '.enforce_admins.enabled' 2>/dev/null || echo "none")
  case "$PROT" in
    true) ok "master is protected and the protection applies to admins too" ;;
    false) bad "master is protected but admins are exempt — an admin agent bypasses every gate"
           echo "        fix: gh api -X POST repos/CSOAI-ORG/councilof-ai/branches/master/protection/enforce_admins" ;;
    *) bad "master has no branch protection; direct pushes bypass every gate" ;;
  esac
else
  warn "gh not installed; cannot check branch protection"
fi

# ─────────────────────────────────────────────────────────────────────────────
head2 "6. Scheduled work is not failing in silence"
# ─────────────────────────────────────────────────────────────────────────────
HB="$HOME/.hermes/hermes-agent/venv/bin/hermes"
if [ -x "$HB" ]; then
  CRON=$("$HB" cron list 2>/dev/null)
  # grep -c exits 1 on no match; `|| echo 0` then appends a SECOND value and the integer test
  # below fails with "0\n0: integer expected". Force a single value instead.
  F=$(printf '%s' "$CRON" | grep -c "failures in a row"); F=${F:-0}
  T=$(printf '%s' "$CRON" | grep -cE '^[[:space:]]{2}[0-9a-f]{12} \['); T=${T:-0}
  if [ "${F:-0}" -eq 0 ]; then ok "no cron job carries a failure streak (of $T)"
  else bad "$F of $T cron job(s) are failing repeatedly"
       printf '%s' "$CRON" | grep -B 6 "failures in a row" | grep "Name:" | sed 's/^/        /' | head -8
       echo "        A job that fails on 'cd: no such file' is pointing at a corpus that moved. Find the corpus."
  fi
else
  warn "hermes binary not at $HB"
fi

# ─────────────────────────────────────────────────────────────────────────────
head2 "7. Which providers actually complete a request (not merely hold a key)"
# ─────────────────────────────────────────────────────────────────────────────
echo "  hermes doctor marks a provider green when a key is merely present. This calls them."
python3 - <<'PY'
import os,re,json,pathlib,urllib.request,urllib.error,concurrent.futures as cf
env={}
p=pathlib.Path(os.path.expanduser('~/.hermes/.env'))
if p.exists():
    for line in p.read_text().splitlines():
        m=re.match(r'^(?:export\s+)?([A-Z0-9_]+)=(.*)$',line.strip())
        if m:
            v=m.group(2).strip().strip('"').strip("'")
            if v and not v.startswith('${'): env[m.group(1)]=v
T=[("OPENAI_API_KEY","https://api.openai.com/v1/chat/completions","gpt-4o-mini"),
   ("GROQ_API_KEY","https://api.groq.com/openai/v1/chat/completions","openai/gpt-oss-120b"),
   ("DEEPSEEK_API_KEY","https://api.deepseek.com/v1/chat/completions","deepseek-chat")]
def probe(t):
    k,url,model=t
    if k not in env: return (k,"absent","")
    body=json.dumps({"model":model,"max_tokens":8,"messages":[{"role":"user","content":"ok"}]}).encode()
    h={"Authorization":"Bearer "+env[k],"Content-Type":"application/json",
       # Without this, some provider edges answer 403 (Cloudflare 1010) to the probe itself and a
       # working provider is reported dead. Measured on 17 Sep 2026 against api.groq.com.
       "User-Agent":"Mozilla/5.0 (csoai-hermes-align)"}
    try:
        urllib.request.urlopen(urllib.request.Request(url,data=body,headers=h),timeout=45)
        return (k,"COMPLETES","")
    except urllib.error.HTTPError as e:
        return (k,f"HTTP {e.code}", e.read()[:60].decode('utf8','replace').replace('\n',' '))
    except Exception as e: return (k,"error",str(e)[:40])
with cf.ThreadPoolExecutor(3) as ex: res=list(ex.map(probe,T))
live=[k for k,s,_ in res if s=="COMPLETES"]
for k,s,d in res: print(f"        {s:10} {k:22} {d}")
print(f"        -> {len(live)} provider(s) can actually serve a request")
PY
# xAI OAuth is the paid path on these machines; check it separately because it is not an env key.
python3 - <<'PY'
import json,os,pathlib,urllib.request,urllib.error
p=pathlib.Path(os.path.expanduser('~/.hermes/auth.json'))
if not p.exists(): raise SystemExit
d=json.loads(p.read_text()).get('providers',{}).get('xai-oauth')
if not d: raise SystemExit
tok=d['tokens']['access_token']
try:
    urllib.request.urlopen(urllib.request.Request("https://api.x.ai/v1/models",
        headers={"Authorization":"Bearer "+tok,"User-Agent":"Mozilla/5.0"}),timeout=30)
    print("        COMPLETES  xai-oauth (the paid subscription)")
except urllib.error.HTTPError as e:
    body=e.read()[:120].decode('utf8','replace')
    print(f"        HTTP {e.code}   xai-oauth  {body[:90]}")
    if 'spending-limit' in body:
        print("        OWNER: raise the spending limit at the xAI console; the session itself is healthy")
PY

# ─────────────────────────────────────────────────────────────────────────────
head2 "Result"
# ─────────────────────────────────────────────────────────────────────────────
printf "  %d ok · %d warn · %d FAIL · %d for the owner\n" "$PASS" "$WARN" "$FAIL" "$OWNER"
if [ "$APPLY" = "0" ] && [ "$FAIL" -gt 0 ]; then
  echo "  This was a report. Re-run with --apply to fix what is safely fixable."
fi
echo "  Never fixed automatically: the xAI spending limit, the Cloudflare zone setting, the GitHub"
echo "  account restriction, and the board signing key. Those are the owner's, by design."
[ "$FAIL" -gt 0 ] && exit 2 || exit 0
