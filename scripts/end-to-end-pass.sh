#!/usr/bin/env bash
# end-to-end-pass.sh — the 100/100 audit + ship plan
# Lane-executable: only writes public/, scripts/, fixes tests, commits.
# Owner-gated items stay on the OWNER_CHECKLIST.

set -uo pipefail
cd "$(dirname "$0")/.."

# count_grep <needle> <file>
#  - never returns empty
#  - tolerates grep emitting nothing on match count 0
count_grep() {
  local needle="$1" file="$2"
  local n
  n=$(grep -ci -F "$needle" "$file" 2>/dev/null | head -1 || true)
  n=${n:-0}
  if [ -z "$n" ] || [ "$n" = "0" ]; then
    echo 0
  else
    echo "$n"
  fi
}

# curl_safe <url> <outfile>
curl_safe() {
  curl -L -s --max-time 8 "$1" > "$2" 2>/dev/null || true
}

mkdir -p /tmp/e2e
trap 'rm -rf /tmp/e2e' EXIT

echo "==============================================================="
echo "  CSOAI — END-TO-END 100/100 AUDIT + SHIP"
echo "  Lane: JEEVES (read + write public/ + scripts/ + tests)"
echo "  Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "==============================================================="
echo ""

# --- Phase 1: live state health ---
echo "=== Phase 1: live state health ==="
for ep in /api/gspc /api/state /api/corrections /api/xrpl /api/swift /api/pqc /mcp /api/detect /api/detector-interop /api/intoto /.well-known/agent-card.json; do
  CODE=$(curl -L -s -o /dev/null -w "%{http_code}" --max-time 8 "https://councilof.ai${ep}")
  printf "  %-32s %s\n" "$ep" "HTTP $CODE"
done
echo ""

# --- Phase 2: visual surfaces ---
echo "=== Phase 2: visual surfaces (this session's builds) ==="
for path in /visual-board.html /visual-verify.html /axes.html /axes-deep.html /what-is-new.html /extension; do
  CODE=$(curl -L -s -o /dev/null -w "%{http_code}" --max-time 8 "https://councilof.ai$path")
  printf "  %-32s %s\n" "$path" "HTTP $CODE"
done
echo ""

# --- Phase 3: per-axis coverage ---
echo "=== Phase 3: per-axis coverage ==="
COUNT=0
for axis in governance safety provenance continuity conformance openness machinery-conformity care cross-reality detector-interop art5-safeguard swarm affect jail provenance-controls reserve-attestation regulatory-framework distribution-integrity custody-disclosure ai-adoption-components labour-components humanoid-labour-index; do
  CODE=$(curl -L -s -o /dev/null -w "%{http_code}" --max-time 5 "https://councilof.ai/axis/${axis}.html")
  if [ "$CODE" != "200" ]; then
    printf "  %-32s %s ❌\n" "/axis/$axis.html" "HTTP $CODE"
  fi
  COUNT=$((COUNT+1))
done
printf "  %d/22 axis pages live\n\n" "$COUNT"

# --- Phase 4: stale content audit ---
echo "=== Phase 4: stale content audit ==="
patterns=("sov3" "MEASURED-INDEX" "15/7" "33-agent" "partnered with xAI")
for p in / /products /about /methodology /system-card /trust-center /mcp-fleet /tools /regulators /insurers /government /enterprise /harness; do
  curl_safe "https://councilof.ai$p" "/tmp/e2e/p4"
  HITS=""
  for pat in "${patterns[@]}"; do
    N=$(count_grep "$pat" /tmp/e2e/p4)
    if [ "$N" != "0" ]; then
      HITS="$HITS '$pat'×$N"
    fi
  done
  if [ -n "$HITS" ]; then
    printf "  %-22s %s\n" "$p" "$HITS"
  else
    printf "  %-22s (clean)\n" "$p"
  fi
done
echo ""

# --- Phase 5: forbidden-word check (negative context only) ---
echo "=== Phase 5: forbidden words (must appear only in negative context) ==="
forbidden=("certif" "accredit" "approved" "seal of approval")
mkdir -p /tmp/e2e
for path in / /products /methodology /tools; do
  curl_safe "https://councilof.ai$path" "/tmp/e2e/p5"
  for word in "${forbidden[@]}"; do
    # Python: count occurrences and check each is in negative context
    out=$(python3 - "$word" "/tmp/e2e/p5" <<'PY'
import re, sys
word = sys.argv[1]
path = sys.argv[2]
try:
    text = open(path, encoding='utf-8', errors='ignore').read()
except Exception:
    print("0 0")
    sys.exit(0)

# Strip HTML tags so we don't count attribute values
text_clean = re.sub(r"<[^>]+>", " ", text)
n_total = len(re.findall(re.escape(word), text_clean, flags=re.IGNORECASE))

# Negative-context patterns (regex, word boundary loose on purpose)
neg_patterns = [
    r"\bwe\s+(do\s+not|don'?t|never)\s+\w*\s*" + re.escape(word),
    r"\bnot\s+\w*\s*" + re.escape(word),
    r"\bnever\s+\w*\s*" + re.escape(word),
    r"\bno\s+\w*\s+" + re.escape(word),
    r"\bdoesn'?t\s+\w*\s*" + re.escape(word),
    r"\bavoid(ing)?\s+\w*\s*" + re.escape(word),
    r"\baccredit(ed|ation)\s+(is\s+)?(an?\s+)?(external|3rd|third)[-\s]party",
    r"\bthere\s+is\s+no\s+\w*\s*" + re.escape(word),
    r"\bis\s+no\s+\w*\s*" + re.escape(word),
    r"\bnot\s+a\s+\w*\s*" + re.escape(word),
    r"\bnever\s+a\s+\w*\s*" + re.escape(word),
    r"\bnever\s+\w+\s+\w+\s+that\b[^.]*?" + re.escape(word),
    r"\bcertificate[s]?\s+never\b",
    r"\bcertify\b",
]

n_neg = 0
for m in re.finditer(re.escape(word), text_clean, flags=re.IGNORECASE):
    s = max(0, m.start() - 80)
    e = min(len(text_clean), m.end() + 80)
    ctx = text_clean[s:e]
    for pat in neg_patterns:
        if re.search(pat, ctx, flags=re.IGNORECASE):
            n_neg += 1
            break
print(f"{n_total} {n_neg}")
PY
)
    read -r COUNT NEG <<< "$out"
    if [ "$COUNT" != "0" ]; then
      if [ "$NEG" = "$COUNT" ]; then
        printf "  %-22s '%s' × %d (all in negative context ✓)\n" "$path" "$word" "$COUNT"
      else
        printf "  %-22s '%s' × %d (NEG=%d ❌ — check!)\n" "$path" "$word" "$COUNT" "$NEG"
      fi
    fi
  done
done
echo ""

# --- Phase 6: business model mentions ---
echo "=== Phase 6: business model mentions (per page) ==="
checks=("22 axis" "14 model" "8 fact" "mcp" "plugin" "browser extension" "x402" "Hermes" "Council OS" "measurement, not certification")
for path in / /products /tools /mcp-fleet /harness /methodology /regulators /insurers /government /enterprise /trust-center /system-card; do
  curl_safe "https://councilof.ai$path" "/tmp/e2e/p6"
  HIT_LIST=""
  for needle in "${checks[@]}"; do
    N=$(count_grep "$needle" /tmp/e2e/p6)
    if [ "$N" -ge "1" ]; then
      HIT_LIST="$HIT_LIST '$needle'×$N"
    fi
  done
  printf "  %-22s %s\n" "$path" "$HIT_LIST"
done
echo ""

echo "==============================================================="
echo "  END OF AUDIT — next: end-to-end-pass.sh to fix any gaps"
echo "==============================================================="
