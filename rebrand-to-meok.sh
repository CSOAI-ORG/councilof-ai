#!/bin/bash
# MEOK AI Labs Rebrand Script
# Replaces all CSOAI and CSGA references with MEOK AI Labs

TARGET="/Users/nicholas/clawd"

echo "🔄 MEOK AI Labs Rebrand — scanning $TARGET"
echo ""

# Find all relevant files and replace
find "$TARGET" -type f \( -name "*.py" -o -name "*.md" -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json5" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/venv/*" \
  ! -path "*/jarvis-env/*" \
  ! -path "*/__pycache__/*" \
  ! -path "*/.next/*" \
  -print0 2>/dev/null | while IFS= read -r -d '' file; do
    
    if grep -q "CSGA\|CSOAI" "$file" 2>/dev/null; then
        rel_path="${file#$TARGET/}"
        echo "  ✅ $rel_path"
        sed -i '' 's/CSGA/MEOK AI Labs/g' "$file"
        sed -i '' 's/CSOAI/MEOK AI Labs/g' "$file"
    fi
done

echo ""
echo "🎉 Rebrand complete!"

# Verify
remaining=$(find "$TARGET" -type f \( -name "*.py" -o -name "*.md" -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json5" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/venv/*" \
  ! -path "*/jarvis-env/*" \
  ! -path "*/__pycache__/*" \
  ! -path "*/.next/*" \
  -exec grep -l "CSGA\|CSOAI" {} \; 2>/dev/null | wc -l | tr -d ' ')

echo "Remaining files with CSOAI/CSGA: $remaining"
