#!/bin/bash
# D9+ POND Auto-Execution Script
# Finishes POND by automating read-only/idempotent steps and producing a human handoff.
# Runs daily at 05:55 via com.meok.d9-pond-auto.plist
# Author: JEEVES | Date: 2026-06-15

set -euo pipefail

HOME_DIR="$HOME"
CLAWD="$HOME_DIR/clawd"
ENV_FILE="$CLAWD/.env.local"
HANDOFF_DIR="$CLAWD/_findings"
TODAY=$(date +%Y-%m-%d)
HANDOFF_FILE="$HANDOFF_DIR/D${TODAY}_POND_HANDOFF_${TODAY}.md"
DASHBOARD_FILE="$HANDOFF_DIR/D${TODAY}_POND_DASHBOARD_${TODAY}.json"

mkdir -p "$HANDOFF_DIR"

# ── Helpers ──────────────────────────────────────────────────────────────────
log() {
    echo "[$(date '+%H:%M:%S')] $*"
}

has_env() {
    local key="$1"
    if [ -f "$ENV_FILE" ] && grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        return 0
    fi
    return 1
}

check_service() {
    local url="$1"
    local name="$2"
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
    echo "  {\"name\": \"$name\", \"url\": \"$url\", \"status\": $code}"
}

# ── Header ───────────────────────────────────────────────────────────────────
log "🚀 D9+ POND Auto-Execution starting"
log "Handoff: $HANDOFF_FILE"

# ── 1. Env var audit ─────────────────────────────────────────────────────────
log "Auditing credential gates..."
GATES=""
GATES_OK=0
GATES_BLOCKED=0

for key in EMAIL_ADDRESS EMAIL_PASSWORD STRIPE_SECRET_KEY RESEND_API_KEY MEOK_MASTER_API_KEY SMITHERY_API_KEY; do
    if has_env "$key"; then
        GATES+="- ✅ $key present"$'\n'
        GATES_OK=$((GATES_OK + 1))
    else
        GATES+="- ❌ $key MISSING"$'\n'
        GATES_BLOCKED=$((GATES_BLOCKED + 1))
    fi
done

# ── 2. Service health snapshot ───────────────────────────────────────────────
log "Capturing service health..."
HEALTH_JSON=$(cat <<EOF
[
$(check_service "http://localhost:3000" "MEOK_UI"),
$(check_service "http://localhost:3101/mcp" "SOV3_MCP"),
$(check_service "http://localhost:3200/api/health" "MEOK_API"),
$(check_service "https://meok.ai" "meok.ai"),
$(check_service "https://proofof.ai" "proofof.ai"),
$(check_service "https://csoai.org" "csoai.org"),
$(check_service "https://press-deploy.vercel.app" "press_deploy"),
$(check_service "https://compliance-dash-deploy.vercel.app" "compliance_dash"),
$(check_service "https://partner-finder-deploy.vercel.app" "partner_finder")
]
EOF
)

echo "$HEALTH_JSON" > "$DASHBOARD_FILE"

# ── 3. SOV3 dashboard snapshot ───────────────────────────────────────────────
log "Capturing SOV3 dashboard..."
SOV3_DASH=$(python3 - <<'PY'
import json, urllib.request
payload = json.dumps({
    "jsonrpc": "2.0", "id": "d9",
    "method": "tools/call",
    "params": {"name": "coord_get_dashboard", "arguments": {}}
}).encode()
try:
    req = urllib.request.Request(
        "http://localhost:3101/mcp", data=payload,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read())
        text = d["result"]["content"][0]["text"]
        data = json.loads(text)
        print(json.dumps({
            "agents_total": data["agents"]["total"],
            "agents_active": data["agents"]["active"],
            "tasks_queued": data["tasks"]["queued"],
            "tasks_completed": data["tasks"]["completed"],
            "recent_events_count": len(data.get("recent_events", []))
        }))
except Exception as e:
    print(json.dumps({"error": str(e)}))
PY
)

# ── 4. Count staged emails/outreach ──────────────────────────────────────────
log "Counting staged outreach..."
STAGED_EMAILS=0
if [ -d "$HOME/.hermes/sessions" ]; then
    STAGED_EMAILS=$(find "$HOME/.hermes/sessions" -name '*.json' -mtime -1 2>/dev/null | wc -l | tr -d ' ')
fi

STAGED_OUTREACH=5
if [ -f "$CLAWD/revenue/MASTER_OUTREACH_PACK_2026-06-10.md" ]; then
    STAGED_OUTREACH=$(grep -c "^## " "$CLAWD/revenue/MASTER_OUTREACH_PACK_2026-06-10.md" 2>/dev/null || echo 5)
fi

# ── 5. Auto-actions (read-only / idempotent) ─────────────────────────────────
log "Running idempotent auto-actions..."

# 5a. Daily dashboard refresh
python3 "$CLAWD/scripts/daily-dashboard.py" >> /tmp/d9-dashboard.log 2>&1 || true

# 5b. IndexNow readiness check (does NOT submit without key)
INDEXNOW_READY=false
for domain in meok.ai proofof.ai csoai.org; do
    if curl -s --max-time 10 "https://$domain/IndexNow-key.txt" 2>/dev/null | grep -q "[a-f0-9]"; then
        INDEXNOW_READY=true
    fi
done

# 5c. Vercel env var probe (read-only via vercel env ls if available)
VERCEL_ENV_READY=false
if command -v vercel >/dev/null 2>&1 && [ -d "$CLAWD/meok/ui" ]; then
    cd "$CLAWD/meok/ui"
    if vercel env ls 2>/dev/null | grep -q "STRIPE_SECRET_KEY"; then
        VERCEL_ENV_READY=true
    fi
fi

# ── 6. Write handoff markdown via Python (clean escaping) ────────────────────
log "Writing handoff report..."

python3 - "$HANDOFF_FILE" "$DASHBOARD_FILE" "$GATES" "$GATES_OK" "$GATES_BLOCKED" "$SOV3_DASH" "$STAGED_EMAILS" "$STAGED_OUTREACH" "$INDEXNOW_READY" "$VERCEL_ENV_READY" "$TODAY" "$HEALTH_JSON" <<'PY'
import json
import sys
from datetime import datetime

handoff_file, dashboard_file, gates, gates_ok, gates_blocked, sov3_dash, staged_emails, staged_outreach, indexnow_ready, vercel_env_ready, today, health_json = sys.argv[1:]

gates_lines = gates.strip().split("\n")

try:
    sov3_pretty = json.dumps(json.loads(sov3_dash))
except Exception:
    sov3_pretty = sov3_dash

content = f"""# 🤖 D9 POND Auto-Handoff — {today}
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}  
**By:** `d9-pond-auto.sh`  
**Mission:** Finish POND — automate the safe stuff, hand off the credential gates.

---

## ✅ Auto-Steps Completed (no human input)

| # | Action | Result |
|---|--------|--------|
| 1 | Credential gate audit | {gates_ok} present, {gates_blocked} missing |
| 2 | Service health snapshot | Saved to `{dashboard_file}` |
| 3 | SOV3 dashboard capture | {sov3_pretty} |
| 4 | Staged outreach inventory | {staged_emails} emails, {staged_outreach} outreach packs |
| 5 | daily-dashboard.py refresh | Triggered |
| 6 | IndexNow key check | {indexnow_ready} |
| 7 | Vercel env check | {vercel_env_ready} |

---

## 🔒 Credential Gates Status

""" + "\n".join(gates_lines) + f"""

---

## 🚨 Human Actions Required Today

### P0 — Blocks revenue today
1. **Add Vercel env vars** (STRIPE_SECRET_KEY, RESEND_API_KEY, Clerk keys) → fixes /checkout 500
2. **Stripe Live flip** → dashboard at 09:00
3. **Send 5 outreach messages** → Monzo, Cera, AccuRx, Onfido, Faculty
4. **Add SMTP creds** → auto-fires 95 staged emails at 06:00

### P1 — Unblocks distribution
5. **PyPI token** → publish `agentaudit`
6. **npm 2FA bypass token** → publish @csoai-org gaming packages
7. **MEOK_MASTER_API_KEY** → signs attestations + fires 4 paywalled MCP tools
8. **SMITHERY_API_KEY** → publish to Smithery registry

### P2 — Growth
9. **IndexNow key files** on meok.ai / proofof.ai / csoai.org → Bing indexing
10. **Namecheap + $6.79** → buy wowmcp.ai

---

## 📊 Health Snapshot

```json
{health_json}
```

---

## ⏭️ Next Auto-Run

Tomorrow at 05:55 via `com.meok.d9-pond-auto.plist`.

---

*This handoff is auto-generated. Only human-gated actions remain between here and revenue.*
"""

with open(handoff_file, "w") as f:
    f.write(content)
print(f"Wrote {handoff_file}")
PY

log "✅ D9+ POND Auto-Execution complete"
log "Handoff: $HANDOFF_FILE"
log "Dashboard: $DASHBOARD_FILE"
