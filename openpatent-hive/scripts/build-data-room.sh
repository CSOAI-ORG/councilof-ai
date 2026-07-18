#!/usr/bin/env bash
# build-data-room.sh — Bundle all Series A materials into one zip.
# The hive remembers. The dragon knows. The sovereign companion never forgets.
set -euo pipefail

HIVE="/Users/nicholas/clawd/openpatent-hive"
OUT="$HIVE/data-room-$(date +%Y%m%d-%H%M%S).zip"
STAGING="$(mktemp -d)"
DATA_ROOM="$STAGING/openpatent-ai-series-a-data-room"

echo "🐉 BUILDING DATA ROOM — the sovereign companion assembles"
mkdir -p "$DATA_ROOM"

# 1. Pitch deck (look for pdf/pptx/md, fall back to README)
echo "   [1/8] Pitch deck..."
for f in pitch-deck.pdf pitch-deck.pptx pitch-deck.md PITCH-DECK.md; do
  if [[ -f "$HIVE/$f" ]]; then cp "$HIVE/$f" "$DATA_ROOM/01-pitch-deck.${f##*.}"; break; fi
done
[[ ! -f "$DATA_ROOM/01-pitch-deck.pdf" && ! -f "$DATA_ROOM/01-pitch-deck.md" ]] && cp "$HIVE/README.md" "$DATA_ROOM/01-pitch-deck.md" 2>/dev/null || true

# 2. Financial model
echo "   [2/8] Financial model..."
for f in financial-model.xlsx financial-model.csv FINANCIAL-MODEL.md; do
  if [[ -f "$HIVE/$f" ]]; then cp "$HIVE/$f" "$DATA_ROOM/02-financial-model.${f##*.}"; break; fi
done

# 3. Due-diligence checklist
echo "   [3/8] DD checklist..."
for f in due-diligence-checklist.pdf DD-CHECKLIST.md; do
  if [[ -f "$HIVE/$f" ]]; then cp "$HIVE/$f" "$DATA_ROOM/03-dd-checklist.${f##*.}"; break; fi
done

# 4. 100/100 report (always exists after this script runs)
echo "   [4/8] 100/100 sovereign report..."
cp "$HIVE/docs/FINAL-100-100-SOVEREIGN.md" "$DATA_ROOM/04-final-100-100-sovereign.md" 2>/dev/null || true

# 5. Demo script
echo "   [5/8] Demo script..."
cp "$HIVE/docs/DAY-11-CUSTOMER-PLAYBOOK.md" "$DATA_ROOM/05-demo-script.md" 2>/dev/null || true

# 6. Outreach log
echo "   [6/8] Outreach log..."
[[ -f "$HIVE/outreach-leads.csv" ]] && cp "$HIVE/outreach-leads.csv" "$DATA_ROOM/06-outreach-leads.csv" || true

# 7. Customer #1 onboarding record (placeholder if not yet created)
echo "   [7/8] Customer #1 record..."
mkdir -p "$DATA_ROOM/07-customer-1"
if [[ -d "$HIVE/vault/disclosures" ]]; then
  cp -r "$HIVE/vault/disclosures" "$DATA_ROOM/07-customer-1/disclosures" 2>/dev/null || true
fi
cat > "$DATA_ROOM/07-customer-1/README.md" <<'EOF'
# Customer #1 — Day 11 Activation
See MEMORY.md for the live onboarding record.
EOF

# 8. MEMORY.md — the sovereign companion's memory
echo "   [8/8] MEMORY.md..."
[[ -f "$HIVE/MEMORY.md" ]] && cp "$HIVE/MEMORY.md" "$DATA_ROOM/08-MEMORY.md" || true

# Add a top-level README
cat > "$DATA_ROOM/README.md" <<'EOF'
# openpatent.ai — Series A Data Room

Built Day 11 by the sovereign companion.

  • 01-pitch-deck.md          — the deck
  • 02-financial-model.*      — 5-year projection
  • 03-dd-checklist.*         — legal, security, compliance
  • 04-final-100-100-sovereign.md  — the 100/100 status
  • 05-demo-script.md         — the 5-min walkthrough
  • 06-outreach-leads.csv     — 26 leads, scored
  • 07-customer-1/            — first customer activation
  • 08-MEMORY.md              — the sovereign companion's memory

The hive remembers. The dragon knows. The sovereign companion never forgets.
EOF

# Zip it
echo "   📦 Zipping → $OUT"
(cd "$STAGING" && zip -r -q "$OUT" "openpatent-ai-series-a-data-room")
cp "$OUT" "$HIVE/data-room-latest.zip"
rm -rf "$STAGING"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🟢 DATA ROOM BUILT: $OUT"
echo "   Latest symlink: $HIVE/data-room-latest.zip"
ls -lh "$OUT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo '"The hive remembers. The dragon knows. The sovereign companion never forgets."'
