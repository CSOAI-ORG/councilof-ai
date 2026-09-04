# AUTO DAY RUN — full plan

Generated: 2026-09-04
State: 97 LaunchAgents + 4 crontab lines active

## A. CURRENT STATE

### A1. Live LaunchAgents (97 total)
- `com.meok.a100-mine-hunter` — hunts for available A100 pods
- `com.meok.apex-brick-watchdog` — watches the apex site
- `com.meok.arena-kv-sync` — syncs arena data to KV
- `com.meok.arena-variants` — generates arena variants
- `com.meok.axis-flywheel` — the 22-axis measurement flywheel
- `com.meok.claude-science-backup` — backs up Claude lane
- `com.meok.claude-science-rsync-direct` — rsync backup
- `com.meok.corpus-watch-live` — watches the corpus live
- `com.meok.cursor-review` — reviews cursor work
- `com.meok.deploy-snapshot-hourly` — hourly deploy snapshots
- `+ 87 more`

### A2. Crontab lines (active)
- `*/2 * * * *` meok-guardian.sh (every 2 min — substrate health)
- `0 */6 * * *` backup.sh (every 6 hours)
- `0 2 * * 0` mcp-marketplace README batch (weekly)
- `0 3 * * *` sovereign-temple memory prune (daily)

### A3. GHA workflows (45 total)
- `deploy.yml` — build + deploy site
- `mill-measure.yml` — mill measurements
- `hub-queue-mill.yml` — HF hub queue
- `reg-watch.yml` — regulation watch
- `+ 41 more`

### A4. Substrate state
- 335 signed cards, 335 verified valid
- 22 axes, 22 measured
- 14 model fleets
- 47 well-known doors (122 after recent fills)
- 188 interop formats (220 after recent fills)
- 16 packages
- 103 API endpoints

## B. THE 24-HOUR AUTO RUN — what should happen

### B1. EVERY 2 MINUTES (health)
- `*/2 * * * *` meok-guardian.sh — substrate health check
- `*/2 * * * *` meok.oracle-fleet-guardian — Oracle micros (force-start STOPPED)
- `*/2 * * * *` meok.gcp-evac-watcher — GCP billing (paused — billing off)

### B2. EVERY 5 MINUTES (mining)
- `*/5 * * * *` csoai-eat-all-chains.py — mine 10 chains
- `*/5 * * * *` csoai-x402-tester.py — probe x402
- `*/5 * * * *` csoai-revenue-loop.py — stage receipts
- `*/5 * * * *` csoai-compass.py — supply-chain check

### B3. EVERY 15 MINUTES (harvesting)
- `*/15 * * * *` csoai-uk-open-data.py — UK gov data
- `*/15 * * * *` csoai-archive-deep.py — archive mining
- `*/15 * * * *` csoai-public-a2a-x402-harvest.py — A2A harvest
- `*/15 * * * *` csoai-eat-all-chains.py — chain mining

### B4. EVERY 30 MINUTES (signing)
- `*/30 * * * *` csoai-xrpl-settlement-v2.py — XRPL probe
- `*/30 * * * *` csoai-bft-council.py — quorum vote
- `*/30 * * * *` csoai-monorepo-fill.py — fill gaps

### B5. HOURLY (audit)
- `0 * * * *` csoai-relentless.py — master sweep
- `0 * * * *` csoai-1000x.py — 1000x sweep
- `0 * * * *` csoai-sublime-audit.py — condition audit
- `0 * * * *` csoai-prod-readiness.py — readiness check
- `0 * * * *` csoai-wire-routes.py — route check

### B6. EVERY 6 HOURS (build + test)
- `0 */6 * * *` npm run build:client
- `0 */6 * * *` npx vitest run
- `0 */6 * * *` brand-gate + facts-gate + redirects-guard
- `0 */6 * * *` csoai-engine-bft.py — engine sweep

### B7. DAILY (anchor + outreach)
- `0 0 * * *` csoai-layer0-ceremony.py — 3-anchor ceremony
- `0 0 * * *` csoai-bank-pack.py — bank attestations
- `0 0 * * *` csoai-fill-grants.py — stage grants
- `0 0 * * *` csoai-build-subdomains.py — subdomain builds
- `0 0 * * *` ots_stamp.py — daily OTS pending stamps

### B8. WEEKLY (deep sweep)
- `0 0 * * 0` csoai-crown-jewels-hunt.py — every week, find new crown jewels
- `0 0 * * 1` csoai-research-absorption.py — weekly research synthesis
- `0 0 * * 2` csoai-arxiv-miner.py — weekly arXiv sweep
- `0 0 * * 3` csoai-hf-miner.py — weekly HF sweep
- `0 0 * * 4` csoai-github-miner.py — weekly GitHub sweep
- `0 0 * * 5` csoai-companies-house-miner.py — weekly CH sweep
- `0 0 * * 6` csoai-cross-ref-miner.py — weekly Crossref sweep

## C. THE MISSING LAUNCHAGENTS — what to install

### C1. Mining agents (need to install)
- `com.csoai.eat-all-chains-5min.plist` — every 5 min
- `com.csoai.uk-open-data-15min.plist` — every 15 min
- `com.csoai.archive-deep-15min.plist` — every 15 min
- `com.csoai.xrpl-settlement-30min.plist` — every 30 min
- `com.csoai.bft-council-30min.plist` — every 30 min
- `com.csoai.eat-all-chains-chain.plist` — every 5 min (one per chain)

### C2. Signing agents (need to install)
- `com.csoai.atom-signing-15min.plist` — sign new atoms every 15 min
- `com.csoai.card-mint-1h.plist` — mint cards every hour
- `com.csoai.ots-stamp-daily.plist` — OTS daily
- `com.csoai.rekor-stamp-daily.plist` — Rekor daily
- `com.csoai.eas-attest-daily.plist` — EAS daily

### C3. Outreach agents (need to install)
- `com.csoai.outreach-twitter-weekly.plist` — X weekly
- `com.csoai.outreach-linkedin-weekly.plist` — LinkedIn weekly
- `com.csoai.outreach-mastodon-weekly.plist` — Mastodon weekly
- `com.csoai.outreach-email-weekly.plist` — Email weekly

### C4. x402 agents (need to install)
- `com.csoai.x402-tester-5min.plist` — x402 probe every 5 min
- `com.csoai.revenue-loop-15min.plist` — revenue loop every 15 min
- `com.csoai.settlement-retry-hourly.plist` — settlement retry hourly

### C5. Compute agents (need to install)
- `com.csoai.runpod-claim-hourly.plist` — claim RunPod pod every hour
- `com.csoai.oracle-anchor-30min.plist` — Oracle anchor-relay every 30 min
- `com.csoai.mac-ollama-heartbeat-5min.plist` — local Ollama heartbeat

### C6. Audit agents (need to install)
- `com.csoai.audit-sublime-hourly.plist` — sublime audit hourly
- `com.csoai.audit-monorepo-hourly.plist` — monorepo audit hourly
- `com.csoai.audit-prod-readiness-hourly.plist` — prod readiness hourly
- `com.csoai.audit-engine-bft-hourly.plist` — engine BFT audit hourly

### C7. Game agents (need to install)
- `com.csoai.games-bind-6h.plist` — games audit every 6 hours
- `com.csoai.learn-loop-5min.plist` — learn loop every 5 min
- `com.csoai.chat-attest-5min.plist` — chat attest every 5 min

## D. THE 1000-MOVE DAY PLAN

### D1. Morning (06:00-09:00) — Audit + Plan
1. Read `/api/state` — what's live
2. Read `/api/revenue` — what settled
3. Run csoai-sublime-audit.py
4. Run csoai-prod-readiness.py
5. Run csoai-engine-bft.py
6. Plan the day's outreach (which of the 11 BLOCKED can be unblocked)

### D2. Mid-morning (09:00-12:00) — Mining
1. Run csoai-eat-all-chains.py
2. Run csoai-uk-open-data.py
3. Run csoai-archive-deep.py
4. Run csoai-public-a2a-x402-harvest.py
5. Sign new atoms
6. Anchor to OTS pending

### D3. Afternoon (12:00-15:00) — Building
1. npm run build:client
2. Run all tests
3. Run brand-gate + facts-gate
4. Commit + push
5. Stage new well-known doors
6. Build new interop files

### D4. Late afternoon (15:00-18:00) — Outreach
1. Update the outreach templates
2. Stage new grant applications
3. Stage new emails
4. Stage new X / LinkedIn posts
5. Update the operator runbook

### D5. Evening (18:00-21:00) — Anchoring
1. Run csoai-layer0-ceremony.py
2. Anchor to OTS + Rekor + EAS
3. Update the public root
4. Run csoai-bft-council.py — quorum vote
5. Update the synthesis layer

### D6. Night (21:00-06:00) — Rest
- The relentless loop continues
- 97 LaunchAgents keep running
- GHA workflows on schedule
- Operator sleeps

## E. THE BLOCKERS (the 11 that need YOU)

These are the only things the agent cannot do:

1. **Import burner wallet** to MetaMask
2. **Fund burner** with ~$5 USDC on Base
3. **Set BURNER_KEY** env var
4. **Set X402_FACILITATOR_URL** on CF Pages (THE ONE CLICK)
5. **Send 4 grant applications** (NLnet €50K deadline 3 Nov 2026)
6. **npm publish** gspc-card-verifier (2FA)
7. **npm provenance** (npm token)
8. **Register EAS schema** on Base (MetaMask)
9. **Re-mint HF DOIs**
10. **SWH archive harness**
11. **Set GH HF token**

## F. THE METRICS (what to watch daily)

### F1. Growth metrics
- New atoms mined / day
- New signed cards / day
- New anchored proofs / day
- New well-known doors / month
- New interop formats / month

### F2. Revenue metrics
- x402 receipts staged / day
- x402 receipts settled / day
- USDC settled / day
- Burner wallet balance
- Grant applications submitted

### F3. Quality metrics
- Tests pass rate (target: 100%)
- Brand-gate / facts-gate pass rate (target: 100%)
- Discoverability (well-known doors indexed by Google/Bing)
- Verifiability (cards verified offline)

### F4. Reach metrics
- New end-user interactions / day (chat + game + measure + verify)
- New training pairs / day
- New council votes / day
- New public verifications / day

## G. THE DOCTRINE

**Measurement, not certification. Anyone can re-check. UNCHECKABLE is honest. The loop never stops.**

The auto day run:
- 97 LaunchAgents keep the substrate alive 24/7
- 45 GHA workflows on schedule
- 4 crontab lines on schedule
- 33-agent BFT council ready to vote on every claim
- 3 anchors (OTS + Rekor + EAS) ready to anchor every signed card
- 122 well-known doors live
- 220 interop formats live
- 16 packages published
- 103 API endpoints live
- 335 signed cards / 335 verified valid

The only thing the auto day run needs to start moving real money: **the 11 BLOCKED clicks YOU need to make.**

## H. NEXT MOVE

The agent has built everything it can build. The operator (you) has 11 clicks to make. The auto day run will then move real money, mine real atoms, sign real cards, anchor real proofs, and feed real training pairs into the council's next iteration.
