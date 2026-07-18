#!/bin/bash
# MEOK AI Labs — Staged push to hit 200+ GitHub repos
# Pushes 10 repos at a time with 60-second cooldowns
# Run: bash ~/clawd/scripts/staged-push-200.sh

cd /Users/nicholas/clawd/mcp-marketplace
total_pushed=0
stage=1

for d in */; do
  name="${d%/}"
  [ ! -f "$d/server.py" ] && continue

  # Skip if already on GitHub
  gh repo view "CSOAI-ORG/$name" >/dev/null 2>&1 && continue

  # Create repo
  result=$(gh repo create "CSOAI-ORG/$name" --public --description "MEOK AI Labs — ${name} MCP Server" 2>&1)
  if echo "$result" | grep -q "too many\|too quickly\|secondary rate"; then
    echo ""
    echo "⏳ Rate limited after $total_pushed pushes. Waiting 120 seconds..."
    sleep 120
    # Retry
    gh repo create "CSOAI-ORG/$name" --public --description "MEOK AI Labs — ${name} MCP Server" 2>&1 | tail -1
  fi

  # Prepare and push
  cd "$name"
  rm -rf .git __pycache__
  [ ! -f LICENSE ] && printf 'MIT License\nCopyright (c) 2026 MEOK AI Labs (meok.ai)\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software to deal in the Software without restriction.\nTHE SOFTWARE IS PROVIDED "AS IS".\n' > LICENSE
  [ ! -f .gitignore ] && printf '__pycache__/\n*.pyc\n.env\n.venv/\ndist/\n*.egg-info/\n*.db\n' > .gitignore
  [ ! -f pyproject.toml ] && cat > pyproject.toml <<TOML
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
[project]
name = "${name}"
version = "1.0.0"
description = "MEOK AI Labs — ${name} MCP Server"
license = {file = "LICENSE"}
requires-python = ">=3.10"
authors = [{name = "MEOK AI Labs", email = "nicholas@meok.ai"}]
dependencies = ["mcp>=1.0.0"]
[project.urls]
Homepage = "https://meok.ai"
Repository = "https://github.com/CSOAI-ORG/${name}"
TOML

  git init -q
  git config user.email "nicholas@meok.ai"
  git config user.name "MEOK AI Labs"
  git add -A
  git commit -q -m "MEOK AI Labs — ${name} MCP Server"
  git branch -M main
  git remote add origin "https://github.com/CSOAI-ORG/${name}.git" 2>/dev/null
  git push -u origin main --force 2>&1 | tail -1

  total_pushed=$((total_pushed+1))
  echo "[$total_pushed] ✅ $name"

  # Every 10 repos, take a break
  if [ $((total_pushed % 10)) -eq 0 ]; then
    stage=$((stage+1))
    current=$(gh repo list CSOAI-ORG --limit 250 --json name 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
    echo ""
    echo "=== STAGE $stage COMPLETE === GitHub: $current repos === Cooling 30s ==="
    echo ""
    sleep 30
  else
    sleep 5
  fi

  cd /Users/nicholas/clawd/mcp-marketplace
done

echo ""
echo "════════════════════════════════════════"
echo "  STAGED PUSH COMPLETE"
echo "  Total pushed this run: $total_pushed"
echo "════════════════════════════════════════"
gh repo list CSOAI-ORG --limit 250 --json name 2>/dev/null | python3 -c "import sys,json; r=json.load(sys.stdin); print(f'  TOTAL GITHUB REPOS: {len(r)}')"
