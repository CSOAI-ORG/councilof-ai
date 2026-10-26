# OWNER ASKS — directory wave, 7 October 2026

Every blocker that needs a human, in ONE file, with the exact action. (M4 brief rule D.)

## 1. MCP Registry device code — 1 CLICK (code expires ~15 min from 05:55 BST)
- Go to: **https://github.com/login/device**
- Enter code: **AB52-49B9**
- Click Authorize
- Effect: `mcp-publisher` completes → `io.github.CSOAI-ORG/csoai-gspc` publishes to the official MCP Registry (server.json already validated; PyPI 0.2.20261007.1 already carries the ownership line).
- If the code lapsed: say "new code" and I mint a fresh one.

## 2. Smithery namespace scope — 1 SETTING
- Org: `01KP63P98PWZJHKXJNW27V99GS`, namespace `csoai`
- CLI is logged in but `publish` returns `403 no access to this namespace`.
- Action: grant the CLI token `servers:write` scope on that namespace (org plan may need the publishing tier).
- Then: `smithery mcp publish https://councilof.ai/mcp -n csoai/councilof-ai` completes.

## 3. OpenAI (ChatGPT Apps + Codex plugin directory) — 3 owner gates
The plugin package is built and ready at `/tmp/csoai-council-of-ai-plugin.zip`
(mcp.json → https://councilof.ai/mcp; .codex-plugin/plugin.json with 5 positive +
3 negative review cases). The submission dashboard needs:
- **Identity verification** in the OpenAI Platform Dashboard (owner KYC step)
- A project with **global** data residency (EU-residency projects cannot submit)
- `api.apps.write` permission (org owner has it by default)
- Dashboard: https://platform.openai.com (Plugins → Upload new plugin)

## 4. Claude directory listing update — 1 LOGIN + walkthrough
- Portal: **https://claude.ai/directory/manage** (paid Claude plan required)
- The current listing says "All 12 tools"; live is 19 (14 free + 5 paid x402).
- I can drive the form; sign-in click is yours (or say "use my browser").
- Have ready: icon (exists), docs URL (councilof.ai/interop), privacy policy URL
  (https://councilof.ai/privacy — confirm this page exists first).

## 5. Repo secret missing — THIRD_PARTY_GUARD_IDS (blocks the privacy guard)
- `scripts/privacy/test_third_party_identifiers.py` fails closed on EVERY PR since
  #2822: "THIRD_PARTY_GUARD_IDS is empty, so this guard cannot speak (UNMEASURED)".
- Action: Settings → Secrets and variables → Actions → add `THIRD_PARTY_GUARD_IDS`
  with the guarded identifiers (the privacy lane knows the list).
- Until then every merge carries one red check (non-required; 6 lanes merged today
  with it red, each by convention, none silently).

## 6. FYI — GitHub dependabot
24 vulnerabilities on the default branch (3 critical, 9 high) — worth a lane.
