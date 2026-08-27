# CSOAI estate — fleet connection + working agreement

**Paste block for agents (DSH, Cursor, Grok, Claude).**  
Endpoints verified at time of writing. RunPod SSH ports **move** when a pod restarts — re-resolve via API; never assume the pod is dead.

Full ops crosswalk: `docs/ESTATE_CROSSWALK.md` · ownership register: `docs/NEXT_300_MOVES.md`

---

## The stack (one line each)

| Layer | Role |
|-------|------|
| **MacBook** | Control plane ONLY. Never build here (~5GB free). |
| **RunPod** | Compute: builds, measurement, mining, GPU work. |
| **Oracle** | `oracle-micro-2` — always-on tiny box: RAG mirror, cron, keepalives. |
| **GitHub** | `CSOAI-ORG/councilof-ai` — single source of truth. **`master` only** for prod. |
| **Cloudflare** | Pages project `councilof-ai` serves **councilof.ai** (production alias). |
| **Cursor** | Indexes repos from GitHub. Read-only truth-hint; cloud agents push via branch. |

---

## RunPod pods (re-resolve ports before SSH)

```bash
K=$(grep -oE '[a-zA-Z0-9_-]{20,}' ~/.runpod/config.toml | head -1)
curl -s "https://api.runpod.io/graphql?api_key=$K" -H 'Content-Type: application/json' \
  -d '{"query":"query{myself{pods{name desiredStatus runtime{ports{ip isIpPublic privatePort publicPort}}}}}}"}'
```

Example pods (ports as of 2026-08-27 — **will move**):

| SSH | Pod | Role |
|-----|-----|------|
| `ssh -p 12473 root@194.26.196.156` | sov-repull-20260808 | RTX3090 **build box** — `/workspace/councilof-ai`, node22 |
| `ssh -p 13440 root@38.128.232.57` | sovos-light-master-mine | A100 **measurement engine** — ollama, axis-engine, arena |
| `ssh -p 55664 root@213.173.105.83` | sov-volume-sink-cpu | **Durability sink** — 800GB volume `sovos-merge-800` |

OOWM CPU pods: hub, miner, router, product — see owner paste for full list.

**GPU idle lie:** API shows `gpu=0%` between batches. Check `nvidia-smi` and `pgrep -af "axis|arena|ollama"` before stopping measurement pods.

---

## Network volumes

| Volume | Size | Region | Notes |
|--------|------|--------|-------|
| sovos-merge-800 | 800GB | EU-RO-1 | Attached to sink. **NEVER delete.** |
| k3-weights-2tb | 2TB | EU-RO-1 | Model weights |
| sov-models | 300GB | CA-MTL-3 | Models |
| sov-artifacts | 200GB | CA-MTL-3 | Artifacts |
| sov-workspace | 200GB | CA-MTL-4 | Workspace |

**Rules:** Volume attaches only in its datacenter. Pod-local `/workspace` survives **stop**, dies on **terminate**. Stopped pods still bill for provisioned volume disk.

---

## Oracle

```bash
ssh oracle-micro-2   # 141.147.73.85 — ubuntu; in ~/.ssh/config
```

956MB x86 free-tier. RAG mirror at `/home/ubuntu/rag/`. Cron + keepalive only — **not** 24GB ARM (old docs wrong).

**`/api/oracle-fleet`** (on councilof.ai) = infra status proxy only — **not** a grade oracle, not labour scores (`docs/ORACLE_FLEET.md`).

---

## Git: one tree, one truth

| | |
|---|---|
| Repo | `git@github.com:CSOAI-ORG/councilof-ai.git` |
| Integration | **`master` only** for production. Rebase onto `origin/master` first. |
| Source | **`client/`** — root `src/` is **DEAD**, never edit. |
| Worktrees | **DO NOT** create worktrees (25 dev servers = 25 different sites). |
| Push | Batch pushes; one push per finished unit. Stage by name — never `git add -A`. |
| Agent branch | Feature work on `cursor/*` until owner merge (#130, #370). |

---

## Owner rulings — decisions, not bugs

1. `public/signed/card_index.json` = **exactly 150 rows** (313 files on disk is **intended** mismatch).
2. `public/signed/chain.json` is **deliberately deleted** — do not restore.
3. `scripts/signed-json-guard.mjs` enforces both. If wrong, **tell Nick** — do not change (reverted 4×).

---

## Cursor / cloud agents

| Rule | Detail |
|------|--------|
| Push fallback | `git push` may 401 → GitHub MCP `push_files` with **full file bytes** |
| Tip writer | **One** agent writes branch tip at a time (`docs/AGENT_COORDINATION.md` §374) |
| MCP batches | Small, one concern per push — no multi-tree dumps (#373) |
| Corrupt tip | `LOAD_ME`, `LOAD_FROM_DISK`, `PLACEHOLDER` → restore before more writes |

### Do-not-corrupt byte guards (`wc -c` before/after)

| File | Bytes |
|------|------:|
| `client/src/pages/NewHome-v3.tsx` | 35406 |
| `client/src/AppMainRoutes.tsx` | 847 |
| `client/src/AppLazy.tsx` | 24241 |

Restore: `docs/ROLLBACK_APP_TRUNCATE.md`

---

## Build + gates (3090 build box, not Mac)

```bash
cd /workspace/councilof-ai && git fetch origin master && git reset --hard origin/master
npm install --no-audit --no-fund
npm run build:client
node scripts/prerender.mjs --dist dist/client --wait 900 --min 350
for g in check-prerender price-gate brand-gate signed-json-guard facts-gate pages-size-guard; do
  node scripts/$g.mjs dist/client || exit 1
done
```

**Green build ≠ proof.** `check-prerender` passes pages that crash on hydration (C-2026-0826-01). After gates:

```bash
cd dist/client && python3 -m http.server 4321
```

Load `/`, `/os/`, `/products/`, `/compare/` in a **real browser** — no error boundary.

### Branch pre-merge lints (also in `build:client`)

```bash
npm run lint:refutations    # ledger = 10 surfaces
npm run lint:evm-catalog    # Stage 3 catalog stays UNMEASURED
npm run lint:wilson-banks && npm run lint:demo-play
BASE_URL=http://127.0.0.1:43125 npm run crawl:honesty
```

### Local dev (smoke only — not prod build)

```bash
npm run dev    # honesty API :3001 + vite (UNMEASURED /api/indices fixtures)
```

RunPod policy: GPU for **model axes only** — not RWA churn, not invented labour MEASURED (`docs/RUNPOD_POLICY.md`).

---

## Deploy

**councilof.ai** → project `councilof-ai` (all three aliases or apex stays stale):

```bash
npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=production --commit-dirty=true
npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=main --commit-dirty=true
npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=master --commit-dirty=true
```

Verify on **councilof.ai** itself — not a preview URL.

**csoai.org** → 301 to councilof.ai (`csoai-site` redirect). Do **not** use `scripts/deploy-prod.sh` (targets `csoai-org` / www.csoai.org — different project).

Required Pages env: `AGUI_WIRE_URL`, KV `SOV_ARENA_STATE` — see `docs/PRODUCTION_CHECKLIST.md`.

---

## Content rules

- Never "certification" as a thing we issue. We **measure**.
- No public prices. No popularity claims. No internal codenames in public.
- **Never type a count** — numbers derive from `GET /api/gspc` or `GET /api/state` (`kind` + `as_of`).
- Public board: **14-slot, 13 measured of 14** (GSPC + jail). Financial-extension 18–25 is separate crosswalk — not homepage grid.
- `unmeasured` is first-class — never hide, shrink, or grey it.
- New routes → `PRIMARY_PATHS` in `client/src/data/library-ia.ts` or they ship flagged archived.

---

## Corrections (live)

| ID | Topic |
|----|-------|
| C-2026-0826-01 | Hub `MEASURED-INDEX-v0.1` ≠ OS product MEASURED — `/indices` stays UNMEASURED |
| C-2026-0825-01 | Labour indices firewall; GPU cannot promote to MEASURED |

`GET /api/corrections` — append re-issues signature; STALE = published defect, not silent edit.

---

## Verify cards (offline)

```bash
curl -s https://councilof.ai/signed/verify-card.mjs -o v.mjs && node v.mjs card.json
```

Pins `did:web:csoai.org#card-attestation-1`. Three states: **VALID** / **INVALID(reason)** / **UNCHECKABLE**.

---

## Durability

Sink pod (`sov-volume-sink-cpu`) runs `/workspace/durability-sync.sh` cron :17 every 2h.

- Log: `/workspace/durability-sync.log` on sink
- Backups: `/workspace/durability/3090-build/`, `/workspace/durability/a100-measure/`
- FAIL after pod restart → update hardcoded SSH ports (and IPs if pod recreated)

S3 keystone path: RunPod volume S3 API — keys minted in console (owner step).

---

## HF Hub

- `HF_TOKEN` in `~/.env` is **DEAD** — use `hf auth login` (org `csoai`)
- MCP OAuth may be read-only
- Staged UNMEASURED packs: `datasets/labour-economy-unmeasured/`, `datasets/rwa-testnet-unmeasured/`
- Upload when auth works: `npm run hf:upload-staged` — see `docs/HF_UPLOAD_RUNBOOK.md`

---

## Lane etiquette

Announce lane in `council-os/LANES.md` before starting. One lane = one branch = one concern.

---

## Business identity

| | |
|---|---|
| Email | nicholas@csoai.org |
| Company | CSOAI LTD · Companies House **16939677** |
| GitHub | org **CSOAI-ORG** |
| HF | user Nicholastempleman; org **csoai** |
| DID | `did:web:csoai.org` — cards pin `#card-attestation-1` |

---

## Auth boundary (pods)

Agents may drive **already-authenticated** Chromium/Playwright sessions on A100.  
Agents must **not**: create accounts, enter passwords, complete sign-ups, accept ToS, or send email without explicit owner go.

---

## The defect we hunt

A checker that cannot observe its own failure. Feed bad input the fix used to accept and **show it failing**. A verify that cannot fail is not a verify.

---

## 90-day roadmap (decisions — do not relitigate)

1. **Canonicalization** — RFC 8785 JCS v2; `canon: "jcs-rfc8785"` on new cards only
2. **Omission gap** — linear hash cannot detect withheld runs; COSE Receipts + Merkle target
3. **Signing** — FROST-Ed25519 across trust domains; DID rotation runbook before compromise
4. **Measurement** — Inspect AI primary; sign runs as MEASURED with config digest
5. **Distribution** — verify-card.mjs MIT + browser demo; HF Space

**Do-not:** ERC-3643 tokenization; Sigstore keyless; C2PA trust lists for high-stakes; n8n for third parties.
