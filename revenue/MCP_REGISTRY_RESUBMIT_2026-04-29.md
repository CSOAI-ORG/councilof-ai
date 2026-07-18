# MCP Registry — Resubmit Once GitHub Auth Refreshed

**Status:** 21 server.json files generated + saved to `/Users/nicholas/clawd/mcp-marketplace/{pkg}/server.json`. All fields validated against the Registry schema (description ≤100 chars, registryType=pypi, correct PyPI versions). The publish step failed because the saved mcp-publisher JWT is expired.

**To complete (~3 min of your time):**

1. Open a terminal in any directory:
   ```bash
   mcp-publisher login github
   ```

2. A browser will open → click "Authorize Anthropic" → close browser.

3. Run the batch script (already written, no edits needed):
   ```bash
   python3 /tmp/publish_mcps.py
   ```

4. Expected: 21 packages publish to the Registry. Output will show "✓ PUBLISHED" or "SKIP (already in registry)" for each.

5. Verify in browser:
   - https://registry.modelcontextprotocol.io/v0/servers?search=meok
   - Should show ~28-29 packages (existing 8 MEOK + new 21)

**Why this matters:**

Registry placement = each MCP gets surfaced when developers search Claude Code, Cursor, Cline, etc. for compliance tooling. Currently 8 of 31 MEOK packages are listed — the gap is leaving 70%+ of distribution surface on the table.

**Time to complete after you re-auth:** ~5-8 minutes for the script to run + verify.

---

## What's already done autonomously

- `server.json` written for all 21 packages with correct schema
- Description trimmed to ≤100 chars per Registry rules
- `registryType: pypi` (was incorrectly `npm` in default `mcp-publisher init` output)
- `version` pulled from live PyPI (current versions, not stale 1.0.0 defaults)
- Placeholder env variables removed (default template added a fake `YOUR_API_KEY` field)
- Repository URLs aligned to `github.com/CSOAI-ORG/{pkg}`

**You don't need to edit anything.** Just `mcp-publisher login github` then re-run the script.
