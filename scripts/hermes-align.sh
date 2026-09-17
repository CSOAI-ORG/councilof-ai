#!/usr/bin/env bash
# hermes-align.sh — bring an M2 or M4 Hermes machine into the state the estate now requires.
#
# Run it on either machine. It reports by default and changes nothing until you pass --apply.
set -uo pipefail

APPLY=0
REPO="${CSOAI_REPO:-$HOME/clawd/councilof-ai-work}"
for a in "$@"; do
  case "$a" in
    --apply) APPLY=1 ;;
    --repo=*) REPO="${a#--repo=}" ;;
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

head2 "1. The env file parses, and holds no prose pretending to be a credential"
if [ ! -f "$ENVF" ]; then
  bad "$ENVF does not exist"
else
  if ( set -a; . "$ENVF" ) >/dev/null 2>&1; then
    ok "env file sources cleanly"
  else
    bad "env file does NOT parse"
  fi
  PROSE=$(grep -nE '^[A-Za-z_][A-Za-z0-9_]*=.*[<>]' "$ENVF" | cut -d: -f2 | cut -d= -f1 | tr '\n' ' ')
  if [ -n "$PROSE" ]; then
    bad "prose in a credential slot: $PROSE"
    if [ "$APPLY" = "1" ]; then
      cp "$ENVF" "$ENVF.bak-align-$(date +%Y%m%d-%H%M%S)"
      sed -i.bak '/=.*[<>].*/d' "$ENVF" 2>/dev/null
      ok "removed"
    fi
  else
    ok "no prose in any credential slot"
  fi
  PH=$(grep -cE '^[A-Za-z_][A-Za-z0-9_]*=\$\{' "$ENVF" || true)
  if [ "${PH:-0}" -gt 0 ]; then
    bad "$PH slot(s) hold an unexpanded \${NAME}"
  else
    ok "no unexpanded placeholders"
  fi
fi

head2 "2. No dead key is shadowing a working OAuth session"
if [ -f "$HOME/.hermes/auth.json" ] && python3 -c "
import json,sys,os
d=json.load(open(os.path.expanduser('~/.hermes/auth.json')))
sys.exit(0 if 'xai-oauth' in (d.get('providers') or {}) else 1)" 2>/dev/null; then
  if grep -qE '^XAI_API_KEY=' "$ENVF" 2>/dev/null; then
    bad "XAI_API_KEY shadows xai-oauth session"
    [ "$APPLY" = "1" ] && sed -i.bak '/^XAI_API_KEY=/d' "$ENVF" && ok "XAI_API_KEY removed"
  else
    ok "xai-oauth session present with no env key shadowing"
  fi
else
  warn "no xai-oauth session on this machine"
fi

head2 "3. Reasoning level is one every provider accepts"
if [ -f "$CFG" ]; then
  RE=$(python3 -c "
import yaml,os
d=yaml.safe_load(open(os.path.expanduser('~/.hermes/config.yaml')))
print((d.get('agent') or {}).get('reasoning_effort',''))" 2>/dev/null)
  case "$RE" in
    xhigh) bad "reasoning_effort is xhigh — xAI-only"
           [ "$APPLY" = "1" ] && python3 -c "
import yaml,os,pathlib
p=pathlib.Path(os.path.expanduser('~/.hermes/config.yaml'))
d=yaml.safe_load(p.read_text()); d['agent']['reasoning_effort']='high'
p.write_text(yaml.safe_dump(d,sort_keys=False))" && ok "set to high" ;;
    minimal|low|medium|high) ok "reasoning_effort is $RE" ;;
    "") warn "reasoning_effort is unset" ;;
    *) warn "reasoning_effort is '$RE'" ;;
  esac
else
  bad "$CFG does not exist"
fi

head2 "4. No file claims to be a timestamp without being one"
if [ -d "$REPO" ]; then
  if [ -f "$REPO/scripts/ots_guard.py" ]; then
    if ( cd "$REPO" && python3 scripts/ots_guard.py >/tmp/align-ots.log 2>&1 ); then
      ok "every .ots under public/ is a real proof and still covers its file"
    else
      FAKE=$(grep -c 'NOT OpenTimestamps proofs' /tmp/align-ots.log); FAKE=${FAKE:-0}
      ORPH=$(grep -c 'ORPHANED' /tmp/align-ots.log); ORPH=${ORPH:-0}
      [ "$FAKE" -gt 0 ] && bad "$FAKE file(s) carry the .ots name without being timestamps"
      [ "$ORPH" -gt 0 ] && bad "$ORPH orphaned proof(s)"
      if [ "$APPLY" = "1" ] && [ -f "$REPO/scripts/ots_manifest_rebuild.py" ]; then
        ( cd "$REPO" && python3 scripts/ots_manifest_rebuild.py --apply ) | tail -5 | sed 's/^/        /'
        # Also quarantine the fake .ots files (rename to .ots.invalid)
        python3 - <<'PY'
import os, glob, shutil
base = os.environ.get('CSOAI_REPO', '/Users/nicholas/clawd/councilof-ai-work')
interop = f'{base}/public/interop'
q = 0
for fp in glob.glob(f'{interop}/**/*.ots', recursive=True):
    if 'ots/' in fp.replace(interop, ''): continue
    with open(fp, 'rb') as f: b = f.read()
    if not b.startswith(b'\x00\x4f\x70\x65\x6e\x54'):
        np = fp + '.invalid'
        if not os.path.exists(np):
            shutil.move(fp, np); q += 1
print(f'        quarantined: {q} fake .ots files')
PY
      fi
    fi
  else
    bad "scripts/ots_guard.py missing"
  fi
else
  warn "repo not found at $REPO"
fi

head2 "5. This machine cannot push straight to master"
if command -v gh >/dev/null 2>&1; then
  PROT=$(gh api repos/CSOAI-ORG/councilof-ai/branches/master/protection --jq '.enforce_admins.enabled' 2>/dev/null || echo "none")
  case "$PROT" in
    true) ok "master is protected and applies to admins too" ;;
    false) bad "admins exempt from branch protection" ;;
    *) bad "master has no branch protection" ;;
  esac
else
  warn "gh not installed"
fi

head2 "6. Scheduled work is not failing in silence"
HB="$HOME/.hermes/hermes-agent/venv/bin/hermes"
if [ -x "$HB" ]; then
  CRON=$("$HB" cron list 2>/dev/null)
  F=$(printf '%s' "$CRON" | grep -c "failures in a row"); F=${F:-0}
  T=$(printf '%s' "$CRON" | grep -cE '^[[:space:]]{2}[0-9a-f]{12} \['); T=${T:-0}
  if [ "${F:-0}" -eq 0 ]; then ok "no cron job carries a failure streak (of $T)"
  else bad "$F of $T cron job(s) failing"
  fi
else
  warn "hermes binary not at $HB"
fi

head2 "7. Which providers actually complete a request"
echo "  hermes doctor marks green when key is present. This calls them."
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

head2 "Result"
printf "  %d ok · %d warn · %d FAIL · %d for the owner\n" "$PASS" "$WARN" "$FAIL" "$OWNER"
if [ "$APPLY" = "0" ] && [ "$FAIL" -gt 0 ]; then
  echo "  This was a report. Re-run with --apply to fix what is safely fixable."
fi
echo "  Never fixed automatically: the xAI spending limit, the Cloudflare zone setting, the GitHub"
echo "  account restriction, and the board signing key. Those are the owner's, by design."
[ "$FAIL" -gt 0 ] && exit 2 || exit 0
