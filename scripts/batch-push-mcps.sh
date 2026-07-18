#!/bin/bash
# MEOK AI Labs — Batch push all new MCP servers to GitHub
# Run: bash ~/clawd/scripts/batch-push-mcps.sh

cd /Users/nicholas/clawd/mcp-marketplace
pushed=0
skipped=0

for d in */; do
  name="${d%/}"
  [ "$name" = ".github-profile" ] && continue
  [ ! -f "$d/server.py" ] && continue

  # Skip if already on GitHub
  if gh repo view "CSOAI-ORG/$name" >/dev/null 2>&1; then
    skipped=$((skipped+1))
    continue
  fi

  echo "Pushing $name..."
  gh repo create "CSOAI-ORG/$name" --public --description "MEOK AI Labs — ${name} MCP Server" 2>&1 | tail -1

  cd "$name"
  rm -rf __pycache__

  # Ensure standard files
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
readme = "README.md"
license = {file = "LICENSE"}
requires-python = ">=3.10"
authors = [{name = "MEOK AI Labs", email = "nicholas@meok.ai"}]
keywords = ["mcp", "ai", "meok"]
dependencies = ["mcp>=1.0.0"]
[project.urls]
Homepage = "https://meok.ai"
Repository = "https://github.com/CSOAI-ORG/${name}"
TOML

  git init -q 2>/dev/null
  git config user.email "nicholas@meok.ai"
  git config user.name "MEOK AI Labs"
  git add -A 2>/dev/null
  git commit -q -m "MEOK AI Labs — ${name} MCP Server" 2>/dev/null
  git branch -M main 2>/dev/null
  git remote remove origin 2>/dev/null
  git remote add origin "https://github.com/CSOAI-ORG/${name}.git" 2>/dev/null
  git push -u origin main --force 2>&1 | tail -1

  # Add topics
  gh api -X PUT "repos/CSOAI-ORG/${name}/topics" \
    -f 'names[]=mcp' -f 'names[]=mcp-server' -f 'names[]=ai' -f 'names[]=meok-ai-labs' 2>&1 >/dev/null

  pushed=$((pushed+1))
  echo "  ✅ $name"
  cd /Users/nicholas/clawd/mcp-marketplace
done

echo ""
echo "════════════════════════════"
echo "Pushed: $pushed new repos"
echo "Skipped: $skipped (already on GitHub)"
echo "════════════════════════════"
echo ""
echo "Total GitHub repos:"
gh repo list CSOAI-ORG --limit 200 --json name 2>/dev/null | python3 -c "import sys,json; print(f'  {len(json.load(sys.stdin))} repos')"
