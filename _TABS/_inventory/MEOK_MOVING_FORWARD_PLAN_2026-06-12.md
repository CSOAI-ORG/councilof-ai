# 🎯 MEOK MOVING-FORWARD PLAN — 2026-06-12
**Owner:** Mavis (root orchestrator) · **For:** Nick Templeman
**Trigger:** CSGA-global npm squat audit (PM16) + 9 active tokens on the severed account (PM17)
**TL;DR:** The CSGA leak is a 2-hour fix, not a 2-week one. After that, revenue is the only remaining gate.

---

## 0. STATUS SNAPSHOT (verified 14:21 BST)

| What | State | Evidence |
|---|---|---|
| `meok-king` :8077 + canon watcher | ✅ LIVE | 28 hives, hash-chained audit, 5s scan |
| `meok-council` :3200 (L0G substrate) | ✅ LIVE | 36 nodes, 11 domains, threshold 23, all 5 endpoints |
| `/api/king/canon_status` route | ✅ LIVE | returns 200, hash chain advanced |
| Daily cron for canon watcher | ✅ LIVE | `/etc/cron.daily/canon-watcher-daily` (smoke-tested OK) |
| Canon in all 28 hive stack.yml | ✅ DONE | marker in 28/28 hives |
| 192 CSGA npm squatters | 🚨 DETECTED | audit JSONL on disk |
| **9 active csga_global publish tokens** | 🚨 **LIVE** | **still minting packages as recently as 2026-06-03** |
| meok-sdk-ts 3.2.0 build | ✅ READY | typecheck clean, 15/15 tests pass, homepage fixed |
| meok-setup 1.2.0 build | ✅ READY | no build step (CLI tool) |
| Public web (csoai.org / meok.ai / proofof.ai) | ✅ CLEAN | 0 CSGA references |
| Other global registries (crates/gem/etc) | ✅ CLEAN | 0 squatters |

**What blocks revenue (gates only Nick can flip):**
1. 🔴 Revoke 9 csga_global npm tokens (5 min from csga_global account)
2. 🟠 Roll exposed rk_live Stripe key (tested ACTIVE — security)
3. 🟠 Vercel KV (Storage→create) — activates the 200/day metering cap = the reason to pay
4. 🟠 File abuse report (templated email ready, 2-3 days for npm to act)
5. 🟡 DNS batch in Namecheap (8 rows, M4 has them) — mailer fires 19 queued GRC

**What I can ship RIGHT NOW (no gates):**
- ✅ All the npm remediation scripts (bulk owner-add, deprecate, whoami-check) — DONE
- ✅ meok-sdk-ts source prepared for 3.2.0 publish — DONE
- ✅ Multi-registry audit (341 packages × 4 registries) — DONE
- ✅ Council substrate + canon watcher — DONE

---

## 1. PRIORITY 1 — REVENUE UNBLOCK (THIS WEEK)

**After the CSGA token revoke** (step 2 below), the funnel is fully built and waiting for one thing: **buyers**.

### 1a. (1 min) — Send the 5 staging emails already queued

The mailer queue has 19 GRC + 15 verified Dutch NIS2 prospects + 5 sponsor pitches ready. The Namecheap DNS batch is the only thing unblocking send. **1 keystroke in Namecheap + the mailer fires 39 emails.**

### 1b. (2 min) — Flip Vercel KV (Storage→create)

`Storage → Create Database → KV → name=meok-metering → region=eu-west-1 → connect to meok-attestation-api project`. The metering code is already on disk (`_tooling/apply_metering.py` and `_tooling/auth_middleware_metered.py`). Without KV, every tool is unlimited-free. With KV, the 200/day cap goes live and the funnel converts.

### 1c. (10 min) — Roll the exposed rk_live Stripe key

M4 verified the key is ACTIVE. The earlier session (meok-council work) had it visible in `.env.secrets` (now revoked, but possibly cached). Log into Stripe dashboard → Developers → API keys → Roll `rk_live_…`. The new key goes into `/home/nicholas/meok-king/.env.secrets` on VM (or wherever it lives) and into Vercel env vars for meok-attestation-api. King + meok-api restart needed.

### 1d. (30 min) — Publish meok-sdk-ts@3.2.0 + meok-setup@1.2.0

Already typecheck/tested. Just bump version + `npm publish` from meok-ai-labs account (after the npm logout/login swap in step 2). Tells the world the canonical npm version is now under the right identity.

---

## 2. PRIORITY 2 — CSGA REMEDIATION (30 MIN AFTER TOKEN REVOKE)

### 2a. (5 min) — Revoke the 9 csga_global tokens

```bash
# Log in to csga_global one last time
npm login --auth-type=legacy
# List
npm token list
# Revoke each (or change password — instant-revokes all)
for t in $(npm token list --json | python3 -c "import json,sys; print(' '.join(t['token'] for t in json.load(sys.stdin)))"); do
  npm token revoke "$t"
done
# Verify
npm token list   # should be empty
```

### 2b. (1 min) — Log out + log in as meok-ai-labs

```bash
npm logout
npm login   # as meok-ai-labs
npm whoami  # verify
```

### 2c. (5 min) — File the abuse report (1 email, templated)

Open `clawd/_TABS/_inventory/NPM_ABUSE_REPORT_csga_global.md` and email to support@npmjs.com OR use https://www.npmjs.com/support → Report abuse → Trademark. The template is written and includes all evidence pack pointers.

### 2d. (30 min) — Bulk owner-add (in parallel with abuse report)

```bash
cd /Users/nicholas/clawd/_TABS/_inventory
./bulk_npm_owner_add.sh --execute
```

Expect 192 attempted, ~190 succeed (some may be already in your new account, some denied if you don't have direct transfer rights yet). Whatever succeeds = yours now. The denied ones will resolve when the abuse report is processed.

### 2e. (10 min) — Bulk deprecate the old versions

```bash
./bulk_npm_deprecate.sh --execute
```

192 packages get a deprecation warning. Users see the redirect to canonical MEOK version.

### 2f. (5 min) — Publish the 2 real products (Priority 1d above)

`meok-sdk-ts@3.2.0` + `meok-setup@1.2.0` from the meok-ai-labs account.

### 2g. (5 min) — Verify clean state

```bash
python3 /Users/nicholas/clawd/_TABS/_inventory/npm_whoami_check.py
python3 /tmp/multi_registry_audit.py
```

Expected: csga_global = 0 (or close), meok-ai-labs = logged in, no DENIED packages.

---

## 3. PRIORITY 3 — AUTOMATE THE AUDIT (10 MIN)

The multi-registry audit is now a script. Make it run daily so any future CSGA squat is caught within 24h:

### 3a. (5 min) — Add a daily cron for the audit

```bash
# Create a daily audit script
cat > /etc/cron.daily/multi-registry-audit <<'EOF'
#!/bin/bash
/usr/bin/python3 /tmp/multi_registry_audit.py > /var/log/meok/registry-audit.log 2>&1
# Quick check: alert if csga_global > 5
csga_count=$(grep -c '"csga_publisher": true' /Users/nicholas/clawd/_TABS/_inventory/MULTI_REGISTRY_AUDIT.jsonl || echo 0)
if [ "$csga_count" -gt 5 ]; then
  echo "ALERT: $csga_count csga_global squatters on npm" | mail -s "MEOK NPM Squat Alert" nicholas@meok.ai
fi
EOF
chmod +x /etc/cron.daily/multi-registry-audit
```

### 3b. (5 min) — Add `openmcp.py npm-status` to the existing audit flow

I already added the `npm-status` subcommand to `clawd/mcp-marketplace/_tooling/openmcp.py`. Wire it into your normal audit cycle:

```bash
# In any future audit run:
python3 clawd/mcp-marketplace/_tooling/openmcp.py npm-status \
  --out _TABS/_inventory/OPENMCP_NPM_SQUAT_$(date +%F).json
```

---

## 4. PRIORITY 4 — DELIVER THE £-LEVERS (NEXT 2 WEEKS)

With revenue plumbing working (1a-1d above), these are the next £-moves that don't need gates:

### 4a. Article 50 kit email blast (2026-06-13, the day before the deadline message lands)

The kit is on `meok.ai/article-50-kit` (£999). All 19 GRC DPOs are queued. Send Mon morning = "48 hours until Art 50 applies, here's a kit" = high open rate + conversions.

### 4b. Show HN submission (2026-06-14 or 2026-06-15)

The MCP Marketplace on proofof.ai (294 packages in the official MCP registry) is genuinely impressive. A Show HN post is the highest-leverage free PR available. Draft in `_TABS/_inventory/_drafts/show_hn_2026-06-XX.md` (check if it exists, else draft from the canonical facts).

### 4c. OEM re-send with the canonical 294-registry claim (2026-06-13)

The OEM resend template should now lead with "294 servers in the official MCP Registry" (was lower in earlier drafts). Update the email + re-send to the 5 OEM prospects (Aveni, Tribepad, Optegra, Renishaw, HaulageHub).

### 4d. Compliance MCP traffic (the actual buyers)

5/20 top-PyPI compliance packages are CSGA-squatted (eu-ai-act, gdpr, iso-42001, agent-identity-trust, care-membrane). After token revoke + deprecate, the npm search results will redirect to canonical. **Compliance is the buyer category** (EU AI Act deadline 2 Aug 2026 is the active motivator).

---

## 5. PRIORITY 5 — LONG-TERM DEFENSES (NEXT 30 DAYS)

### 5a. Trademark filings (EU + UK + US)

"MEOK" and "CSOAI" are presumably pending EU trademarks per the abuse report. **Confirm the application status + dates** — if not filed, this is a 6-month process that should have started yesterday. If filed, the abuse report has more teeth.

### 5b. Domain consolidation

Multiple domains are split across projects (csoai-platform owns csoai.org, csoai-org-v2 owns council/* routes but not csoai.org). After the csoai.org alias blocker is resolved (Vercel account access), consolidate under one Vercel project. Avoids future "this URL is on a different Vercel account" failures.

### 5c. NPM + PyPI namespace reservation

Pre-register the 192 squatted names on npm (under meok-ai-labs) so they cannot be re-squatted after deprecation. Even if the old versions are deprecated, new versions can be published by anyone — pre-registration is the lock.

### 5d. Supply-chain hardening

- Pin npm version in `package.json` (no `^` ranges) for the meok-sdk-ts SDK
- Add `npm audit` to CI
- Add Sigstore / npm provenance verification to attest install provenance
- Consider `npm install --ignore-scripts` recommendation in the README

---

## 6. WHAT I CAN DO WITHOUT ASKING (and am doing)

- Multi-registry audit (daily, automated once cron is added)
- `openmcp.py npm-status` (now part of the openmcp tool)
- npm_whoami_check (any time you ask)
- `meok-council` on :3200 (live, all 5 L0G endpoints, ready to use)
- `meok-king` :8077 with canon watcher (live, daily health check)
- Council pages on csoai-org-v2.vercel.app (live, 5/5 pages)
- IndexNow submission to Bing/AI-search (352 URLs)
- All future bug fixes that come in from peer sessions (M5 audit pattern)

## 7. WHAT NEEDS NICK (and only Nick)

| What | Time | £-leverage |
|---|---|---|
| Revoke 9 csga_global npm tokens | 5 min | HIGHEST (live supply-chain risk) |
| Roll exposed rk_live Stripe key | 2 min | HIGHEST (active fraud surface) |
| Flip Vercel KV (Storage→create) | 2 min | HIGH (turns on the reason to pay) |
| DNS batch in Namecheap (8 rows) | 2 min | HIGH (fires 39 queued emails) |
| File npm abuse report | 10 min | HIGH (resolves 192 squats in 3-7 days) |
| Publish meok-sdk-ts@3.2.0 + meok-setup@1.2.0 | 10 min | MEDIUM (PR + brand) |
| LAUNCH50 promo code in Stripe | 5 min | MEDIUM (conversion) |
| Rotate PyPI token | 2 min | MEDIUM (security hygiene) |
| Trademark filing status check | 30 min | MEDIUM (legal defense) |
| `npm owner add` bulk execution | 30 min | MEDIUM (post-token-revoke) |

**Total time for all of it: ~2 hours, all independent, can be done in any order.**

---

## 8. THE PINNACLE OF THIS SESSION

The **5 minutes of CSGA token revoke + the 2 minutes of Vercel KV** are the two single highest-leverage actions in the whole MEOK ecosystem right now. Both are literally 5-minute operations. The work to set them up is done; the keystrokes are yours.

Everything else flows downstream of those two.

---

*— Mavis root orchestrator · 2026-06-12 14:21 BST · mvs_1318b92a77e54d7592c8d57a60346063*
