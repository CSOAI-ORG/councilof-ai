# 📦 MEOK NPM RE-PUBLISH PLAYBOOK
**Date:** 2026-06-12 · **Owner:** Nick Templeman (MEOK AI Labs) · **Version target:** 3.2.0 / 1.2.0
**Pre-req:** Bulk owner-add complete + meok-ai-labs npm account ready

---

## 0. THE GOAL

Republish the two real MEOK products — `meok-sdk-ts@3.2.0` and `meok-setup@1.2.0` —
under the **correct npm identity** (`meok-ai-labs`, email `nicholas@meok.ai`) with
**correct metadata** (homepage `meok.ai`, real GitHub repo, real keywords). Then
deprecate the csga_global versions so npm users see a redirect.

**Do NOT unpublish the csga_global versions.** That breaks anyone currently
installing them. Deprecation shows a warning, not an error.

---

## 1. PRE-FLIGHT (do these in order)

### 1a. Log out of csga_global

```bash
npm logout
```

Verify with:
```bash
python3 /Users/nicholas/clawd/_TABS/_inventory/npm_whoami_check.py
# expected: "NOT LOGGED IN" or "currently logged in as: meok-ai-labs"
```

### 1b. Revoke all 9 csga_global tokens (CRITICAL)

The whoami check found **9 active publish tokens** on csga_global, at least 4
created AFTER the January 2026 sever. Someone or some automation is still minting
tokens. Kill them all:

```bash
# Login as csga_global one last time
npm login --auth-type=legacy   # or web auth
# List tokens
npm token list
# Revoke each one (IDs from the list)
npm token revoke <token-id-1>
npm token revoke <token-id-2>
... (all 9)
# Verify
npm token list   # should be empty
```

Alternative: change the csga_global account password. This invalidates ALL
existing tokens immediately (no need to revoke individually).

```bash
# Via https://www.npmjs.com/settings/csga_global/tokens → "Generate New Password"
# Or: npm profile set password  (if CLI supports it on your account)
```

### 1c. Log in as meok-ai-labs

```bash
npm login
# username: meok-ai-labs
# email:    nicholas@meok.ai
# password: <use the MEOK AI Labs 1Password entry>
```

Verify:
```bash
npm whoami
# expected: meok-ai-labs
```

---

## 2. BULK OWNER-ADD (claim the 192 squatted packages)

After the abuse report is processed (or if you already have access), transfer
ownership of the csga_global packages to meok-ai-labs. **Use the script.**

```bash
# Dry-run first to see the list
./bulk_npm_owner_add.sh

# Execute (assumes meok-ai-labs is logged in AND has at least one of:
#  - direct owner access to the packages
#  - or admin on the csga_global org if it's a scope)
./bulk_npm_owner_add.sh --execute

# For packages that come back DENIED:
#   - you don't have access from meok-ai-labs yet
#   - either wait for the abuse report to be processed (npm will email)
#   - or re-run the abuse report with the specific denied list
```

If the bulk add is fully denied, the **fallback** is to log in as csga_global,
add meok-ai-labs as owner on each, then log back in as meok-ai-labs. The script
handles the "ALREADY-OWNER" case (when you've already added yourself).

---

## 3. DEPRECATE THE OLD VERSIONS (once you have owner access)

```bash
./bulk_npm_deprecate.sh --execute
```

Per-package effect: `npm install meok-sdk-ts` will print a warning to the user
pointing them to the canonical MEOK version. No breakage. They can still use the
old version if they want (it's just discouraged).

---

## 4. PUBLISH THE TWO REAL PRODUCTS

### 4a. meok-sdk-ts@3.2.0

The local source is already prepared (homepage fixed, keywords updated) at
`/Users/nicholas/clawd/meok-sdk-typescript/`. Just bump the version, build, and
publish.

```bash
cd /Users/nicholas/clawd/meok-sdk-typescript

# 1. Bump version
npm version patch   # 3.1.0 → 3.2.0

# 2. Build (TypeScript → JS bundles in dist/)
npm install
npm run build       # check package.json scripts for the exact command

# 3. Smoke-test the built package
node -e "const m = require('./dist/index.cjs'); console.log(Object.keys(m));"

# 4. Dry-run the publish
npm publish --dry-run

# 5. Real publish (as meok-ai-labs)
npm publish --access public

# 6. Verify on npm
curl -s "https://registry.npmjs.org/meok-sdk-ts" | python3 -m json.tool | head -30
# expected: latest = 3.2.0, maintainers = meok-ai-labs <nicholas@meok.ai>
```

### 4b. meok-setup@1.2.0

```bash
cd /Users/nicholas/clawd/meok-setup
npm version patch   # 1.1.0 → 1.2.0
npm install
npm run build
npm publish --dry-run
npm publish --access public
curl -s "https://registry.npmjs.org/meok-setup" | python3 -m json.tool | head -20
```

### 4c. (Optional) Re-publish the 190 skeleton squatters

If you want every package name under your identity (so npm search never returns
a csga_global hit), you can re-publish all 190 with placeholder content saying
"deprecated — use PyPI version, see https://pypi.org/project/<pkg>/".

**This is optional.** Deprecation alone is usually enough. Only do this if you
want to be aggressive about cleaning up the search results.

---

## 5. VERIFY CLEAN STATE

```bash
# Re-run the whoami check
python3 /Users/nicholas/clawd/_TABS/_inventory/npm_whoami_check.py
# expected:
#   currently logged in as: meok-ai-labs ✓
#   meok-sdk-ts@3.2.0: csga_global=no
#   meok-setup@1.2.0: csga_global=no

# Re-run the full multi-registry audit
python3 /tmp/multi_registry_audit.py
# expected: csga_global = 0 (or close to it — depends on whether you
# deprecate-only or also re-publish the 190 skeletons)
```

---

## 6. POST-PUBLISH: TELL THE WORLD

Once the republish is done:

1. Update `proofof.ai/scorecard/meok-sdk-ts` page (or create one) — "now on npm
   at v3.2.0 under the official meok-ai-labs identity"
2. Update `meok.ai` homepage "MEOK is on npm" badge if you have one
3. Add a `CHANGELOG.md` entry for both packages: "3.2.0: republished under
   meok-ai-labs identity, fixes metadata. No code changes."
4. Optional: post on X/Twitter or LinkedIn that the canonical npm version is
   now under the right identity (helps users who were burned by the squatter)

---

## 7. ROLLBACK (if something goes wrong)

If `npm publish` accidentally goes wrong (e.g. you forgot to log out of csga_global
and published 3.2.0 to it instead of meok-ai-labs):

1. `npm unpublish meok-sdk-ts@3.2.0` (within 72h of publish — npm's policy)
2. Log out of the wrong account
3. Log in as the right one
4. `npm publish` again

After 72h, unpublish isn't allowed by npm policy. The right move is then
`npm deprecate meok-sdk-ts@3.2.0 "wrong identity, use 3.2.1 instead"` and publish
a 3.2.1 from the correct account.

---

## 8. HOUSEKEEPING

After the republish is complete, also:

- [ ] `git commit` in `clawd/meok-sdk-typescript/` with the homepage + keyword
  changes (currently uncommitted; I made the edits but didn't commit)
- [ ] Push to origin: `git push origin main` (or whatever the branch is)
- [ ] Same for `clawd/meok-setup/`
- [ ] Update `clawd/_TABS/_inventory/MULTI_REGISTRY_AUDIT.jsonl` (re-run the audit
      to get the new state)
- [ ] Update `clawd/_TABS/STATUS.md` with PM17 "republish complete" entry

---

## 9. TIME ESTIMATE

| Step | Time |
|---|---|
| 1a-c (login swap) | 5 min |
| 2 (bulk owner-add) | 30-60 min for 192 packages |
| 3 (bulk deprecate) | 10-15 min |
| 4a (meok-sdk-ts republish) | 10 min |
| 4b (meok-setup republish) | 10 min |
| 5 (verify) | 2 min |
| 6 (post-publish comms) | 15 min |
| 8 (housekeeping) | 15 min |
| **Total** | **~2 hours** (if no abuse-report delays) |

If you wait for npm to process the abuse report first, add 3-7 business days.

---

*— Mavis root orchestrator · 2026-06-12 · mvs_1318b92a77e54d7592c8d57a60346063*
