# npm OIDC Trusted Publisher Fix

## Problem
npm publish via GitHub Actions fails with E404: "csoai-gspc-mcp@0.2.2 could not be found or you do not have permission to access it."

## Root Cause
The GitHub Actions workflow has `id-token: write` permission (correct), but npmjs.com doesn't have GitHub Actions configured as a trusted publisher for the `csoai-gspc-mcp` package.

## Fix (owner action, 2 minutes)

1. Go to https://www.npmjs.com/package/csoai-gspc-mcp
2. Click "Settings" tab
3. Scroll to "Publishing access" → "Trusted publishing"
4. Click "Add trusted publisher"
5. Enter:
   - Repository owner: `CSOAI-ORG`
   - Repository name: `councilof-ai`
   - Workflow filename: `npm-gspc-release.yml`
   - Environment: (leave blank)
6. Save

## Then trigger the publish
```bash
gh workflow run npm-gspc-release.yml -R CSOAI-ORG/councilof-ai --ref master -f version=0.2.2
```

## Verification
The workflow will use OIDC to authenticate with npm — no NPM_TOKEN secret needed.
Check the run at: https://github.com/CSOAI-ORG/councilof-ai/actions/workflows/npm-gspc-release.yml
