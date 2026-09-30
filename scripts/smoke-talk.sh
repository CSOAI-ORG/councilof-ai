#!/usr/bin/env bash
# smoke-talk.sh — ask the live "talk to it" doors real questions and assert every answer is
# grounded in a named /mcp tool's output.
#
#   bash scripts/smoke-talk.sh [BASE]        (default BASE=https://councilof.ai)
#
# Checks, all against BASE:
#   POST /api/chat   x10 questions: state == "grounded", answered_by starts "tool:", every citation
#                    names a tool, the expected tool is among them, and no answer is "ungrounded".
#   POST /api/a2a    plain-text "what does the board say" -> data.kind GROUNDED_TOOL_ANSWER from
#                    board_totals.
#   POST /api/agui/run  streams RUN_STARTED, TOOL_CALL_START, TOOL_CALL_RESULT, TEXT_MESSAGE_CONTENT,
#                    RUN_FINISHED; a paid ask without confirm emits confirm_required and no tool call.
# Exit 0 only if every check passes. Read-only: the paid question returns a 402 challenge; nothing
# is paid (no x_payment is ever sent).
set -euo pipefail
BASE="${1:-${BASE:-https://councilof.ai}}"
BASE="${BASE%/}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
# Our own traffic, identified BY NAME so GET /api/usage excludes it (functions/_lib/usage.ts SELF_TOOLS).
SELF=(-A "csoai-smoke-talk/1 (+https://councilof.ai/api/usage)" -H "x-csoai-self: smoke-talk")
ok()   { PASS=$((PASS+1)); echo "PASS  $*"; }
bad()  { FAIL=$((FAIL+1)); echo "FAIL  $*"; }

# A real signed-card id, read from the live index (never typed here).
CARD_ID="$(curl "${SELF[@]}" -fsS --max-time 30 "$BASE/signed/card_index.json" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["cards"][0]["card"])' 2>/dev/null || true)"
# A real measured MCP endpoint's host, read from the live capsule index (never typed here).
HOST="$(python3 - "$BASE" <<'PY' 2>/dev/null || true
import json, sys, urllib.request
base = sys.argv[1]
def get(p):
    with urllib.request.urlopen(base + p, timeout=30) as r:
        return json.load(r)
for shard in ["00", "3a", "9f", "c4", "11", "7e"]:
    try:
        d = get(f"/measurement-capsules/v0.2/endpoints/{shard}.json")
    except Exception:
        continue
    for e in d.get("endpoints", {}).values():
        ep = e.get("endpoint", "")
        if ep.startswith("https://") and "councilof.ai" not in ep and ep.rstrip("/").endswith("/mcp"):
            print(ep.split("/")[2]); sys.exit(0)
PY
)"
[ -n "$HOST" ] || HOST="councilof.ai"

# question | tool that must be cited
QUESTIONS=(
  "what does the board say|board_totals"
  "how did safety measure|get_axis"
  "is $HOST trustworthy|mcp_trust"
  "how many mcp servers answered the handshake|mcp_trust"
  "x402 census|x402_trust"
  "show the public root|get_root"
  "show the measurement index|measurement_index"
  "list signed cards|list_cards"
  "commission a card for https://example.com/mcp|commission_card"
)
[ -n "$CARD_ID" ] && QUESTIONS+=("verify $CARD_ID|verify_card")

UNGROUNDED=0
i=0
for qa in "${QUESTIONS[@]}"; do
  i=$((i+1))
  q="${qa%|*}"; want="${qa##*|}"
  body="$(python3 -c 'import json,sys; print(json.dumps({"message": sys.argv[1]}))' "$q")"
  if ! curl "${SELF[@]}" -fsS --max-time 60 -X POST "$BASE/api/chat" -H 'content-type: application/json' -d "$body" -o "$TMP/c$i.json"; then
    bad "chat[$i] HTTP error: $q"; continue
  fi
  verdict="$(python3 - "$TMP/c$i.json" "$want" <<'PY'
import json, sys
d = json.load(open(sys.argv[1])); want = sys.argv[2]
cites = d.get("citations") or []
tools = [c.get("tool") for c in cites]
probs = []
if d.get("state") != "grounded": probs.append(f"state={d.get('state')}")
if not str(d.get("answered_by", "")).startswith("tool:"): probs.append(f"answered_by={d.get('answered_by')}")
if not cites or not all(tools): probs.append("no tool citation")
if want not in tools: probs.append(f"{want} not cited (cited {tools})")
if not d.get("label"): probs.append("no state label")
print("OK " + ",".join(tools) + " label=" + str(d.get("label")) if not probs else "BAD " + "; ".join(probs))
PY
)"
  grep -q '"state": *"ungrounded"' "$TMP/c$i.json" && UNGROUNDED=$((UNGROUNDED+1))
  case "$verdict" in OK*) ok "chat: \"$q\" -> ${verdict#OK }";; *) bad "chat: \"$q\" -> ${verdict#BAD }";; esac
done
[ "$UNGROUNDED" -eq 0 ] && ok "chat: 0 ungrounded answers" || bad "chat: $UNGROUNDED ungrounded answers"

# A2A plain text
curl "${SELF[@]}" -fsS --max-time 60 -X POST "$BASE/api/a2a" -H 'content-type: application/json' -H 'A2A-Version: 1.0' \
  -d '{"jsonrpc":"2.0","id":1,"method":"SendMessage","params":{"message":{"messageId":"smoke-1","role":"ROLE_USER","parts":[{"text":"what does the board say"}]}}}' \
  -o "$TMP/a2a.json" || true
v="$(python3 - "$TMP/a2a.json" <<'PY'
import json, sys
try: d = json.load(open(sys.argv[1]))
except Exception as e: print("BAD unreadable", e); sys.exit()
parts = (((d.get("result") or {}).get("message") or {}).get("parts")) or []
data = next((p.get("data") for p in parts if isinstance(p.get("data"), dict)), {})
tools = [c.get("tool") for c in data.get("citations", [])]
ok = data.get("kind") == "GROUNDED_TOOL_ANSWER" and "board_totals" in tools
print(("OK " if ok else "BAD ") + json.dumps({"kind": data.get("kind"), "tools": tools, "label": data.get("label"), "error": d.get("error")})[:300])
PY
)"
case "$v" in OK*) ok "a2a text: ${v#OK }";; *) bad "a2a text: ${v#BAD }";; esac

# AG-UI stream
curl "${SELF[@]}" -fsS -N --max-time 60 -X POST "$BASE/api/agui/run" -H 'content-type: application/json' -H 'accept: text/event-stream' \
  -d '{"threadId":"smoke","runId":"smoke-1","messages":[{"id":"u1","role":"user","content":"what does the board say"}]}' \
  -o "$TMP/agui.txt" || true
missing=""
for ev in RUN_STARTED TOOL_CALL_START TOOL_CALL_RESULT TEXT_MESSAGE_CONTENT RUN_FINISHED; do
  grep -q "\"type\":\"$ev\"" "$TMP/agui.txt" || missing="$missing $ev"
done
[ -z "$missing" ] && ok "agui run: RUN_STARTED..RUN_FINISHED streamed ($(grep -c '^data: ' "$TMP/agui.txt") events)" || bad "agui run: missing$missing"

curl "${SELF[@]}" -fsS -N --max-time 60 -X POST "$BASE/api/agui/run" -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"commission a card for https://example.com/mcp"}]}' -o "$TMP/agui-paid.txt" || true
if grep -q '"name":"confirm_required"' "$TMP/agui-paid.txt" && ! grep -q '"type":"TOOL_CALL_START"' "$TMP/agui-paid.txt"; then
  ok "agui paid ask: confirm_required, no tool call without confirm"
else
  bad "agui paid ask: confirm gate not observed"
fi

echo "---- smoke-talk: $PASS passed, $FAIL failed (base $BASE)"
[ "$FAIL" -eq 0 ]
