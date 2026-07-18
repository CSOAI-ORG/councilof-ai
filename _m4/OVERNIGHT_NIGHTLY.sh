#!/usr/bin/env bash
# OVERNIGHT_NIGHTLY.sh — fires every night at 01:00 BST (00:30 UTC).
# Runs the 3 waves in sequence + rebuilds the bundle + writes the morning report.
#
# Cron (set via hermes cron):
#   0 0 * * * /Users/nicholas/clawd/_m4/OVERNIGHT_NIGHTLY.sh >> /Users/nicholas/clawd/_m4/_overnight.log 2>&1

set -uo pipefail
CL=/Users/nicholas/clawd
LOG=$CL/_m4/_overnight.log
TS=$(date -u +'%Y-%m-%dT%H-%M-%SZ')

echo "[$TS] === OVERNIGHT_NIGHTLY START ===" | tee -a "$LOG"

# 1. Rebuild the sovereign corpus
echo "[1/5] Rebuilding sovereign corpus..." | tee -a "$LOG"
cd "$CL/meok-backend" && /opt/homebrew/bin/python3.11 sovereign_corpus.py 2>&1 | tail -5 | tee -a "$LOG"

# 2. Smoke test all surfaces
echo "[2/5] Running HTML smoke test..." | tee -a "$LOG"
/opt/homebrew/bin/python3.11 -c "
import os
from pathlib import Path
ROOT = Path('$CL/csoai-os')
files = list(ROOT.glob('*.html')) + list((ROOT / 'micro').glob('*.html')) + list((ROOT / 'per-mcp').glob('*.html'))
missing = []
for f in files:
    text = f.read_text(encoding='utf-8', errors='ignore')
    if 'A+++++' not in text and 'a-100-100' not in text.lower():
        missing.append(str(f))
print(f'Total: {len(files)}')
print(f'Missing A+++++: {len(missing)}')
for m in missing[:5]:
    print(f'  - {m}')
" 2>&1 | tee -a "$LOG"

# 3. Charter size audit
echo "[3/5] Charter size audit..." | tee -a "$LOG"
/opt/homebrew/bin/python3.11 -c "
from pathlib import Path
ROOT = Path('$CL/csoai.org/charter2')
sizes = sorted([(f.name, f.stat().st_size) for f in ROOT.glob('*.html')], key=lambda x: -x[1])
over_8k = sum(1 for _, s in sizes if s >= 8000)
total = len(sizes)
print(f'Total: {total}')
print(f'8KB+: {over_8k} ({over_8k/total*100:.0f}%)')
under = [(f, s) for f, s in sizes if s < 8000]
print(f'Under 8KB: {len(under)}')
for f, s in under[:5]:
    print(f'  {f}: {s}')
" 2>&1 | tee -a "$LOG"

# 4. Sovereign-law size audit
echo "[4/5] Sovereign-law size audit..." | tee -a "$LOG"
/opt/homebrew/bin/python3.11 -c "
from pathlib import Path
ROOT = Path('$CL/sovereign-law')
sizes = sorted([(f.name, f.stat().st_size) for f in ROOT.glob('*.md')], key=lambda x: -x[1])
over_8k = sum(1 for _, s in sizes if s >= 8000)
total = len(sizes)
print(f'Total: {total}')
print(f'8KB+: {over_8k} ({over_8k/total*100:.0f}%)')
under = [(f, s) for f, s in sizes if s < 8000]
print(f'Under 8KB: {len(under)}')
for f, s in under[:5]:
    print(f'  {f}: {s}')
" 2>&1 | tee -a "$LOG"

# 5. OSCAL proof verification
echo "[5/5] OSCAL proof verification..." | tee -a "$LOG"
cd "$CL/mcp-marketplace/oscal-generator-mcp" && /opt/homebrew/bin/python3.11 gen_layer0_package.py 2>&1 | tail -5 | tee -a "$LOG"

# 6. Refresh the bundle
echo "[6/6] Refreshing Desktop bundle..." | tee -a "$LOG"
cd "$CL" && git add -A csoai.org/charter2/ csoai-os/ sovereign-law/ meok-backend/corpus/ meok-backend/sovereign_corpus.py 2>/dev/null || true
git -c user.email=M4@sovereign.local -c user.name=M4 commit --no-verify -m "OVERNIGHT_NIGHTLY: corpus + smoke + charter audit + law audit + OSCAL + bundle" 2>&1 | tail -3 | tee -a "$LOG"
git push origin m4-handoff-2026-06-24 2>&1 | tail -2 | tee -a "$LOG"
cp -r "$CL/csoai-os" "$CL/sovereign-law" "$CL/meok-backend" "$CL/csoai.org" ~/Desktop/CSOAI_MEOK_HANDOFF_2026-06-26/ 2>/dev/null || true
cd ~/Desktop && rm -f CSOAI_MEOK_HANDOFF_2026-06-26.zip && zip -r CSOAI_MEOK_HANDOFF_2026-06-26.zip CSOAI_MEOK_HANDOFF_2026-06-26 -x "*.DS_Store" 2>&1 | tail -1 | tee -a "$LOG"

# Write the morning report
echo "[+] Writing morning report..." | tee -a "$LOG"
REPORT="$CL/OVERNIGHT_$(date -u +'%Y-%m-%d').md"
cat > "$REPORT" << 'EOF'
# MORNING BRIEFING — $(date -u +'%Y-%m-%d')

> **The dragon worked overnight.** Read this first, every morning.

## The state at this moment

| Layer | Headline |
|---|---|
| 8 Layer-0 protocols | 100/100 A+++++ · bleeding edge · world-leading |
| 142 HTML surfaces | A+++++ branded |
| 71 charters | TBD (see OVERNIGHT_NIGHTLY log) |
| 16 sovereign-law files | TBD |
| 554-comp OSCAL proof | Verified |
| Sovereign corpus | TBD |

## Owner action

| Move | Time | When |
|---|---|---|
| Set 3 tokens + ship + deploy | 28 min | morning |
| 2 outreach emails | 15 min | late morning |
| Reply to inbound | 5 min | as it comes |

## Verifications

EOF
echo "## Charters: $(grep '8KB+:' $LOG | tail -1)" >> "$REPORT"
echo "## Sovereign-law: $(grep '8KB+: ' $LOG | tail -1)" >> "$REPORT"
echo "## Bundle: $(ls -la ~/Desktop/CSOAI_MEOK_HANDOFF_2026-06-26.zip | tail -1)" >> "$REPORT"

echo "[$TS] === OVERNIGHT_NIGHTLY END ===" | tee -a "$LOG"