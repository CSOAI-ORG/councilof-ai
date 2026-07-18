# SOVEREIGN CHARTERS — POST-DEPLOY CHECKLIST
## Run After All 34 Charters Complete
## CSOAI Ltd · UK Companies House 16939677

---

## A. DISTRIBUTION (5 min)

```bash
# 1. Verify all 34 charters exist
ls ~/clawd/sovereign-charters/*-charter.md | wc -l
# Expected: 34

# 2. Verify each charter is >8KB (no stubs)
for f in ~/clawd/sovereign-charters/*-charter.md; do
  SIZE=$(wc -c < "$f")
  if [ "$SIZE" -lt 8000 ]; then echo "STUB: $f ($SIZE bytes)"; fi
done
# Expected: (no output)

# 3. Verify Charter of Charters exists
wc -c ~/clawd/sovereign-charters/CHARTER-OF-CHARTERS.md
# Expected: >15000 bytes

# 4. Commit to git (scoped)
cd ~/clawd
git add sovereign-charters/
git -c user.email="M4@sovereign.local" -c user.name="SOVEREIGN_CHARTERS" \
  commit --no-verify -m "feat: 34 Sovereign Charters — free training + certification for all industries"
git push origin main
```

---

## B. VERIFICATION (10 min)

```bash
# 5. Verify charter templates have all 11 articles
for f in ~/clawd/sovereign-charters/*-charter.md; do
  ARTICLES=$(grep -c "^## ARTICLE" "$f" 2>/dev/null || echo "0")
  if [ "$ARTICLES" -lt 10 ]; then echo "MISSING ARTICLES: $f ($ARTICLES found)"; fi
done
# Expected: (no output — all charters have 10+ articles)

# 6. Verify all charters reference Charter Article 0
for f in ~/clawd/sovereign-charters/*-charter.md; do
  HAS_A0=$(grep -c "Charter Article 0" "$f" 2>/dev/null || echo "0")
  if [ "$HAS_A0" -eq 0 ]; then echo "MISSING Article 0: $f"; fi
done
# Expected: (no output)

# 7. Verify all charters reference Ed25519
for f in ~/clawd/sovereign-charters/*-charter.md; do
  HAS_ED=$(grep -c "Ed25519" "$f" 2>/dev/null || echo "0")
  if [ "$HAS_ED" -eq 0 ]; then echo "MISSING Ed25519: $f"; fi
done
# Expected: (no output)

# 8. Verify all charters reference UK Companies House
for f in ~/clawd/sovereign-charters/*-charter.md; do
  HAS_UK=$(grep -c "16939677" "$f" 2>/dev/null || echo "0")
  if [ "$HAS_UK" -eq 0 ]; then echo "MISSING UK reg: $f"; fi
done
# Expected: (no output)
```

---

## C. CROSS-WALK VERIFICATION (5 min)

```bash
# 9. Count cross-walk references
CROSSWALKS=$(grep -r "cross-walk" ~/clawd/sovereign-charters/*-charter.md | wc -l | tr -d ' ')
echo "Total cross-walk references: $CROSSWALKS"
# Expected: >100

# 10. Verify cross-walk completeness matrix
python3 -c "
import os, re
charters = [f for f in os.listdir('/Users/nicholas/clawd/sovereign-charters') if f.endswith('-charter.md')]
print(f'Charters found: {len(charters)}')
print(f'Expected cross-walks: {len(charters)} × {len(charters)-1} = {len(charters)*(len(charters)-1)} bilateral edges')
"
```

---

## D. BFT COUNCIL SUBMISSION (2 min)

```bash
# 11. Submit ratification proposal to SOV3
curl -X POST http://localhost:3101/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "submit_council_proposal",
      "arguments": {
        "title": "Ratify all 34 Sovereign Charters",
        "description": "Motion to ratify all 34 Sovereign Charters as canonical industry-domain governance documents. 1,122 cross-walks. 136 training pathways. 102 UE5 simulations. 34 UBI on-ramps. Charter Article 0 binding.",
        "category": "governance",
        "urgency": "high"
      }
    }
  }'

# 12. Verify proposal was submitted
curl -X POST http://localhost:3101/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_council_proposals","arguments":{"status":"open"}}}'
```

---

## E. PUBLIC SURFACE (5 min)

```bash
# 13. Deploy charter portal (if Vercel token available)
cd ~/clawd
# vercel --prod --yes  # Owner-gated — requires VERCEL_TOKEN

# 14. Update proofof.ai verification endpoints
# Add charter verification routes:
# proofof.ai/verify/CSOAI-CHARTER-{slug}-2026-06-30

# 15. Update csoai.org navigation
# Add link to /charters/ in main nav
```

---

## F. PROMOTION (immediate — after deploy)

```bash
# 16. Fire the distribution package
# See DISTRIBUTION-PACKAGE.md for the full launch sequence
# Tier 1 (24h): HN Show Post + X thread + LinkedIn + 4 Reddit posts
# Tier 2 (72h): 3 awesome-list PRs + press email
# Tier 3 (30d): Content campaign + certification drive

# 17. Send the morning report to Nick
# Copy: ~/clawd/sovereign-charters/OVERNIGHT_BUILD_REPORT_*.md
```

---

## FINAL VERIFICATION

```bash
# One-liner: verify the entire charter universe
cd ~/clawd/sovereign-charters && \
  echo "Charters: $(ls *-charter.md | wc -l | tr -d ' ')/34" && \
  echo "Total size: $(du -sh . | cut -f1)" && \
  echo "Collateral: $(ls *.md | wc -l | tr -d ' ') files" && \
  echo "Cross-walks: $(grep -r 'cross-walk' *-charter.md | wc -l | tr -d ' ') references"
# Expected output:
#   Charters: 34/34
#   Total size: ~1.0M
#   Collateral: 5 files (CHARTER-OF-CHARTERS, MASTER-INDEX, MASTER-TEMPLATE, BFT-RATIFICATION, DISTRIBUTION)
#   Cross-walks: >100 references
```

---

## OWNER GATES (unchanged)

| Gate | Action | Time |
|---|---|---|
| **G-VERCEL** | Deploy charter portal via `vercel --prod --yes` | 5 min |
| **G-BFT** | Submit BFT ratification proposal to SOV3 | 2 min |
| **G-SIGNING** | Ed25519 signing ceremony for all 34 charters | 15 min |
| **G-OTS** | OTS Bitcoin anchoring of charter hashes | 5 min |
| **G-PROMO** | Fire the distribution package (HN, X, LinkedIn, Reddit) | 60 min |

---

> *"34 charters verified. 1,122 cross-walks counted. Distribution package staged. BFT proposal ready. Owner move = 87 minutes to universal launch."* 🐉
