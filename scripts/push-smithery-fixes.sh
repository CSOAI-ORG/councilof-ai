#!/bin/bash
cd /Users/nicholas/clawd/mcp-marketplace

for repo in *-mcp; do
    if [ -d "$repo/.git" ]; then
        echo "Processing $repo..."
        cd "$repo"
        # Update remote to SSH
        git remote set-url origin "git@github.com:CSOAI-ORG/$repo.git"
        
        # Commit smithery.yaml if changed
        if git status --porcelain | grep -q "smithery.yaml"; then
            git add smithery.yaml
            git commit -m "fix: add startCommand to smithery.yaml for Smithery publishing"
            git push
        fi
        cd ..
    fi
done
