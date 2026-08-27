# CSOAI ESTATE — MASTER CONNECT (Fleet Connection + Working Agreement)

**Version:** 2026-08-27 · canonical, verified-live snapshot
**Purpose:** paste this whole block to any agent (DSH, Cursor, Grok Bot, Claude).
Endpoints verified live at write-time. RunPod SSH ports MOVE when a pod restarts —
if a connect fails, re-resolve via the API (below), never assume the pod is dead.

> This consolidates the fleet paste + the durability/roadmap/identity paste, and
> adds the gaps found in the 2026-08-27 reconcile (two fleets, cross-account DNS,
> PyPI new-project cap). See "AMENDMENTS (verified 2026-08-27)" at the bottom.

---

## THE STACK, ONE LINE EACH
- **MacBook** — control plane ONLY. Never build here. ~4-6Gi free.
- **RunPod** — compute: builds, measurement, mining, GPU work.
- **Oracle** — micro-2 = always-on tiny RAG mirror box (cron, keepalives, 2 models).
  **micro-1 (145.241.232.16) = the OWEM model fleet, 145 models — see AMENDMENTS 1.**
- **GitHub** — CSOAI-ORG/councilof-ai = single source of truth. master only.
- **Cloudflare** — Pages project councilof-ai serves councilof.ai (production alias).
- **Cursor** — Codebase indexes 187 repos, synced from GitHub. Read-only truth-hint.

## RUNPOD PODS (RUNNING, ~$1.91/hr total)
```
ssh -p 12473 root@194.26.196.156    sov-repull-20260808        RTX3090 BUILD BOX
                                    repo at /workspace/councilof-ai, node22, deps
                                    installed. THIS is where site builds run.
ssh -p 13440 root@38.128.232.57     sovos-light-master-mine    A100-class $1.39/hr
                                    MEASUREMENT ENGINE: ollama (14 models),
                                    axis-engine.sh + arena-auto-loop.sh RUNNING.
                                    DO NOT STOP without checking nvidia-smi +
                                    pgrep -af "axis|arena|ollama" first — API shows
                                    gpu=0% BETWEEN batches; it lies.
ssh -p 39331 root@38.80.152.147     oowm-agent-01-hub          cpu  OOWM hub
ssh -p 53390 root@213.173.105.92    oowm-agent-03-mine         cpu  OOWM miner
ssh -p 33035 root@213.173.105.102   oowm-agent-04-route        cpu  OOWM router
ssh -p 41054 root@103.196.86.88     oowm-agent-05-product      cpu  OOWM product
ssh -p 55664 root@213.173.105.83    sov-volume-sink-cpu        cpu  durability sink
                                    (ONLY pod with a network volume attached:
                                     sovos-merge-800, 800GB, EU-RO-1)
```

Re-resolve moved SSH ports (key in `~/.runpod/config.toml` on the Mac):
```
K=$(grep -oE '[a-zA-Z0-9_-]{20,}' ~/.runpod/config.toml | head -1)
curl -s "https://api.runpod.io/graphql?api_key=$K" -H 'Content-Type: application/json' \
  -d '{"query":"query{myself{pods{name desiredStatus runtime{ports{ip isIpPublic privatePort publicPort}}}}}"}'
```

## NETWORK VOLUMES (survive pod stop; region-locked)
- sovos-merge-800  800GB  EU-RO-1  attached to sov-volume-sink-cpu. NEVER delete.
- k3-weights-2tb   2000GB EU-RO-1  model weights
- sov-models       300GB  CA-MTL-3 models
- sov-artifacts    200GB  CA-MTL-4 artifacts
- sov-workspace    200GB  CA-MTL-4 workspace

RULES: a volume attaches only to pods in ITS datacenter. Pod-local /workspace disks
survive STOP but die on TERMINATE — stop, never terminate, unless ruled. RunPod bills
provisioned volume disk on stopped pods too (their email 27 Aug) — stale stopped pods
still cost money; flag them, don't silently delete.

## ORACLE
```
ssh oracle-micro-2   (141.147.73.85, ubuntu; in ~/.ssh/config; up 3+ weeks)
```
956MB x86 free-tier. RAG mirror at /home/ubuntu/rag/. Cron + keepalive only. NOT 24GB
ARM — old docs claiming that are wrong. Nothing heavy runs here. **micro-1 is NOT in
~/.ssh/config by default; see AMENDMENTS 1.**

## GIT: ONE TREE, ONE TRUTH
- repo  git@github.com:CSOAI-ORG/councilof-ai.git
- branch master is the ONLY integration branch. Rebase onto origin/master first.
- source client/ — the root src/ dir is DEAD, never edit it.
- DO NOT create worktrees (yesterday 25 each ran a dev server on its own port; everyone
  saw a different site). Branch in the main checkout.
- DO NOT push in rapid bursts — Cursor's push treadmill starved the GitHub Actions
  queue (14 queued / 0 running). Batch pushes; one push per finished unit.
- Stage by name. Never `git add -A` in the main checkout.

## OWNER RULINGS — decisions, not bugs. DO NOT "FIX".
1. public/signed/card_index.json = EXACTLY 150 rows (commits 7294a9a5, 6657a4da).
   The 313 files on disk vs 150 index rows is INTENDED. Do not reconcile.
2. public/signed/chain.json is deliberately DELETED. Do not restore.
3. scripts/signed-json-guard.mjs enforces both. If you think they're wrong, SAY so to
   Nick — do not change them. It was reverted 4x yesterday. Never again.

## BUILD + GATES (run on the 3090, not the Mac)
```
cd /workspace/councilof-ai && git fetch origin master && git reset --hard origin/master
npm install --no-audit --no-fund
npm run build:client
node scripts/prerender.mjs --dist dist/client --wait 900 --min 350
for g in check-prerender price-gate brand-gate signed-json-guard facts-gate pages-size-guard; do
  node scripts/$g.mjs dist/client || exit 1
done
```
A GREEN BUILD IS NOT PROOF. check-prerender PASSES pages that crash on hydration
(React error boundary renders >350 chars — logged as C-2026-0826-01, bit us twice).
After gates: `cd dist/client && python3 -m http.server 4321`, then LOAD /, /os/,
/products/, /compare/ in a real browser. No error boundary, real text, or it does not ship.

## DEPLOY (all three aliases or the apex stays stale)
```
npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=production --commit-dirty=true
npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=main --commit-dirty=true
npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=master --commit-dirty=true
```
councilof.ai follows PRODUCTION. Verify on councilof.ai itself, never a preview URL.
csoai.org 301s to councilof.ai (project csoai-site serves the redirect). Leave it —
**but www.csoai.org is cross-account; see AMENDMENTS 2.**

## CONTENT RULES (gates enforce; violations block deploy)
- Never "certification" as a thing we issue. We measure. Never "we enforce".
- No public prices. No popularity claims. No internal codenames in public.
- NEVER type a count. Numbers derive from GET /api/gspc or GET /api/state (both carry
  kind + as_of). Board = 22 axes · 15 measured · 7 unmeasured — read it, don't write it.
- "unmeasured" is a first-class published status. Never hide, shrink or grey it.
- New routes must be registered in PRIMARY_PATHS (client/src/data/library-ia.ts) or they
  ship flagged "archived".

## THE DEFECT WE HUNT (before claiming any fix works)
A checker that cannot observe its own failure; a name promising what code doesn't
deliver. Real cases this week: prerender reading a never-written field (515 failures →
"0 errored"); "signed": true with no signature bytes; a verifier passing a FORGED card;
a TSA "ok" recorded from an RFC-3161 REJECTION; UNMEASURED reported for five measured
axes. So: feed your fix the bad input it used to accept and SHOW it failing. A verify
that cannot fail is not a verify.

## VERIFY CARDS (anyone, offline, no account)
```
curl -s https://councilof.ai/signed/verify-card.mjs -o v.mjs && node v.mjs card.json
```
Pins did:web:csoai.org#card-attestation-1. Three states, never two:
VALID / INVALID(reason) / UNCHECKABLE. Could-not-check ≠ forged.

## LANE ETIQUETTE (all agents)
- Announce your lane in council-os/LANES.md before starting; check it first.
- One lane = one branch = one concern. Do not touch another lane's files.
- Kill every dev server you start. Check `lsof -iTCP -sTCP:LISTEN` before adding one.
- Report failures verbatim. Never summarize a red gate as "mostly passing".

---

# AMENDMENTS — verified 2026-08-27 (the "what's missing")

### 1. TWO FLEETS, NOT ONE (highest-value correction)
The original paste named ONLY `sovos-light-master-mine` as the measurement engine. That
is correct (14 models, axis/arena loops), but it is NOT the fleet the OWEM router
consumes. There is a second, separate, larger fleet:

| Host | Models | Role |
|---|---|---|
| `sovos-light-master-mine` (A100, :13440) | 14 | measurement engine — axis-engine.sh + arena-auto-loop.sh |
| **Oracle micro-1 (145.241.232.16)** | **145** | **OWEM model fleet — the OWEM router/`:11436` backend** |
| oracle-micro-2 (141.147.73.85) | 2 | RAG mirror |

**Do NOT conflate them.** If a task says "the OWEM fleet / the router's models," it means
micro-1 via `:11436` (145 models), NOT the A100 measurement engine.
- `:11436` → micro-1 (145) — the OWEM router + pipeline backend.
- `:11437` → micro-2 (2).  `:11439` → runpod (5).
- micro-1 direct: `ssh -i ~/.ssh/id_ed25519 ubuntu@145.241.232.16` (may not be in
  ~/.ssh/config — add it; the `runpod-ollama-bridge.sh` already tunnels it to `:11436`).

### 2. www.csoai.org SSL is CROSS-ACCOUNT (don't re-attempt the same dead-end)
- `www.csoai.org` was attached to the `councilof-ai` Pages project (2026-08-26) but stays
  **`pending` cert**. The `csoai.org` DNS **zone lives in a DIFFERENT Cloudflare account**
  than the one holding the Pages projects (confirmed: the accessible account has 22 zones,
  none is `csoai.org`). Final validation needs the CNAME repointed to `councilof-ai.pages.dev`
  **from the other CF account** — an owner step, not an agent-API one.

### 3. PyPI new-project cap (distribution pacing)
- PyPI limits new project names to roughly **~5/day** per account (HTTP 429 "too many new
  projects created"). The `sovos-*` family is large — publish a few per day, space them,
  and schedule retries for the next window when you see 429. **Do not treat 429 as a failure;
  it's the cap.**

### 4. Machine-readable connect (nice-to-have next)
The base block is prose. A companion `fleet.json` (hosts, ports, roles, models) would let
any agent machine-read the topology instead of parsing prose — cheap and removes the
"which host is the fleet?" class of error.
