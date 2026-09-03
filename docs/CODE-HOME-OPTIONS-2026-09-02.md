# Code home options — 2 Sep 2026

**Question from the owner:** "Can we use something other than GitHub — a living codebase, something newer and better, on Hugging Face or another platform?" (including https://cursor.com/codebase).

**Trigger:** on 2 Sep 2026 GitHub limited the `CSOAI-ORG` account — Actions runs terminated at runner start, `workflow_dispatch` refused, org pages public 404. Reinstatement ticket **#4720908** is open.

**Scope of this note:** research only. No accounts created, nothing posted, no keys touched. Every external claim carries a URL and the date it was read (all fetched 2026-09-02 unless stated). Claims I could not confirm from a primary source are marked **UNVERIFIED**.

---

## 0. Short answer

1. **There is no "newer and better" forge for this estate.** The two newest platforms (Cursor Origin, Radicle) are the *weakest* on the things we actually need — public visibility, hosted CI with secrets, OIDC identity, and cron.
2. **The "living codebase" the owner wants is a property of the compute lane, not the forge.** Hourly mills, signing loops and prerender deploys already run as jobs; Hugging Face Jobs runs them for cents. Which git host holds the bytes is a separate, smaller decision.
3. **Recommended shape: thin forge, fat compute.** GitLab.com (free, public group) as the second full forge and the canonical home *if* GitHub does not reinstate; Hugging Face Jobs as the scheduled/compute lane regardless; GitHub kept (never deleted) for the `io.github.CSOAI-ORG` namespace, redirects and the Action marketplace.
4. **Do nothing irreversible yet.** Stand up the free insurance (Phase 0, ~6 h, £0) now; flip canonical only if the threshold in §7 is crossed.
5. **Cursor "Codebase" = Cursor Origin** (early beta, 17 Aug 2026) — a real git host the owner already has (`origin.cursor.com/nicholas-templeman/councilof-ai.git`) with a Depot CI app that runs GitHub-Actions YAML *without GitHub*, with secrets, cron and its own OIDC issuer. **Origin + Depot could run `deploy.yml` and `public-root.yml` this week** — but Origin has **no public repositories** (Internal/Private only, paid plans only), so it cannot be the code *home* for a public-standards estate. Verdict and costs in §5.

---

## 1. What the estate actually needs (measured from the worktree at `103ec792`)

| # | Requirement | Evidence in repo |
|---|---|---|
| R1 | CI holding ~25 secrets, a ~15–20 min prerender with headless Chromium, hourly cron, OIDC identity for the signing relay | 40 workflow files; 18 with `schedule:` (4 hourly, 1 every 30 min, 4 every 2–3 h, rest daily); 4 use Playwright/Chromium (`deploy.yml`, `claims-e2e.yml`, `public-root.yml`, `sov-stack-e2e.yml`); 4 request `id-token: write` (`public-root.yml`, `auto-eat-sign.yml`, `hf-fin-shells*.yml`); 25 distinct `secrets.*` names; `deploy.yml` `timeout-minutes: 45` |
| R2 | Deploy path to Cloudflare Pages project `councilof-ai` | `deploy.yml` uses `npx wrangler pages deploy dist/client --project-name=councilof-ai` with `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` — i.e. **API upload from CI, not the Pages Git integration**. The Git auto-build is the thing that keeps clobbering the apex (memory: prod clobber recurs). |
| R3 | Public visibility; PR/MR checks for outside contributors and standards-body reviewers (IETF SCITT, C2PA, Vaara) | protect-verified-*, lane-guard, conflict-guard, one-door-guard run on PRs |
| R4 | GitHub-URL dependencies | `mcp/gspc-server/server.json` name `io.github.CSOAI-ORG/gspc` (listed v1.1.0 in the official MCP Registry via GitHub OAuth); `public/.well-known/mcp.json`, `public/openapi.json`, `public/llms.txt`, `public/AGENT-ONBOARDING.md` all cite `github.com/CSOAI-ORG/...`; 16 refs to `councilof-ai`, 13 to `cobol-bridge-mcp`, 7 to `action-verify-attestation` (a GitHub Action — only runs on GitHub), ~30 `*-mcp` repos |
| R5 | Low cost, solo UK founder | today: £0/mo (public repo = unlimited GitHub minutes) |
| R6 | Two places or it doesn't count | already true: private HF dataset `csoai/councilof-ai-mirror`; HF Jobs proven as second runner with image `csoai/ci-runner`; pack size **642.6 MiB** (`git count-objects`) |

**Signing relay detail (matters for every alternative):** `functions/api/board-sign.ts` pins `iss = https://token.actions.githubusercontent.com`, fetches that JWKS, and checks `payload.repository === "CSOAI-ORG/councilof-ai"` and an `aud` allow-list. `scripts/publish_public_root.py` only signs via OIDC when `ACTIONS_ID_TOKEN_REQUEST_URL` is present. So the relay is GitHub-shaped in three places (issuer, JWKS URL, claim name). Any move must either (a) add a second accepted issuer, or (b) sign from a runner-held key — and memory rules say no laptop keys.

**Monthly compute (estimate, UNVERIFIED — run logs are 401 while limited):** drift-guard 1,440 runs × ~3 min, three hourly mills 720 × 5–8 min, deploy 240 × ~25 min, every-2-h lanes 360 × 5–10 min, dailies. Order of **20–30k job-minutes/month**. This single number disqualifies every hosted free tier except GitHub's own; it costs about **$4–5/month on HF `cpu-basic`** ($0.01/h) or **$0 on a self-hosted runner** (Oracle free ARM, which the estate already uses).

---

## 2. Requirements-vs-platform matrix

Legend: ✅ meets · ◐ meets with work · ❌ fails · ? UNVERIFIED

| Platform | R1 CI (secrets / 15-min browser / cron / OIDC) | R2 Cloudflare Pages | R3 Public + PR checks | R4 GitHub URLs & MCP ns | R5 Cost | R6 Durability | Verdict |
|---|---|---|---|---|---|---|---|
| **GitHub (status quo, limited)** | ✅ all four — when not flagged | ✅ Git integration + wrangler | ✅ | ✅ | £0 | ◐ (single point of policy failure — proven 2 Sep) | keep, never delete; not sole home |
| **GitLab.com Free (public group)** | ◐ secrets ✅ (masked/protected vars); browser ✅ on `saas-linux-small` (2 vCPU) but only **400 compute-min/mo** (public projects cost-factor 0.5 → ~800 job-min) — must bring own runner; cron ✅ Free; **OIDC `id_tokens` ✅ Free** | ✅ native GitLab Git integration **and** wrangler upload | ✅ public; "Pipelines must succeed" + protected branches on Free; 5-user cap does **not** apply to public top-level groups | ❌ URLs break; MCP ns needs DNS-verified rename | £0 forge + £0 Oracle runner (or ~$5/mo HF) | ✅ push-mirroring **to** GitHub is Free (pull-mirroring from GitHub is Premium) | **best second forge / canonical-if-needed** |
| **Codeberg (Forgejo)** | ◐ secrets ✅; hosted runners exist but **max runtime 2/5/10 min**, public+libre only, "don't jam the queue" → our load is out of policy; self-hosted runner ✅; cron ✅ (Forgejo Actions); OIDC ❌ (no id-token issuer, ?) | ◐ no Pages Git integration (Cloudflare supports GitHub/GitLab only) — wrangler upload only | ✅ public; PR + required status ◐ | ❌ | £0 (donation-funded e.V.) | ◐ 750 MB git soft quota per user; our pack is 642 MiB | values-aligned mirror; not the CI home |
| **Gitea Cloud** | ◐ Actions auto-enabled, on-demand runners; minute limits **?** | ◐ wrangler only | ✅ | ❌ | **no permanent free tier found** — 30-day trial; per-seat price ? | ◐ | no |
| **sourcehut** | ◐ builds.sr.ht **requires a paid account** (€4/8/12 from Jan 2026; financial aid available); secrets ✅; cron ❌ (no scheduler, ?); OIDC ❌ | ◐ wrangler only | ◐ public ✅ but email-patch workflow, no web PR checks reviewers expect | ❌ | €4–12/mo | ◐ | no |
| **Radicle (p2p)** | ❌ CI = a broker you host yourself (radicle-ci-broker + adapters); no hosted CI; secrets unaddressed; OIDC ❌ | ❌ | ◐ web explorer exists, patch flow unfamiliar to standards reviewers | ❌ | £0 + a node | ✅ **excellent extra replica** (seed node) | optional 3rd copy only |
| **Bitbucket Cloud** | ❌ **50 build-min/mo** free; 1 GB storage (pack 642 MiB) | ◐ wrangler only | ✅ | ❌ | £0 | ◐ | no |
| **Azure DevOps** | ◐ public projects: up to 10 parallel hosted jobs, 360 min each, request form (2–3 business days); secrets ✅; cron ✅; OIDC ◐ (workload-identity for service connections, not a generic id-token, ?) | ◐ wrangler only | ◐ public projects + build-validation policies | ❌ | £0 | ◐ same corporate policy engine as GitHub (Microsoft) | credible compute fallback, poor fit culturally |
| **Hugging Face Hub as code host** | ◐ **Jobs**: secrets ✅ (encrypted), cron ✅ (`@hourly`, cron exprs), timeout configurable (default 30 min), `cpu-basic` 2 vCPU/16 GB **$0.01/h**; webhooks→jobs ✅; **OIDC ❌ (no job identity token found, ?)**; no push-triggered CI on git push (webhooks cover it) | ◐ wrangler from a Job ✅ | ❌ PRs are `refs/pr/N` without forks; **no branch protection, required checks or CI status** in the docs; not a forge reviewers will use | ❌ | $5–10/mo | ✅ already the mirror | **best compute lane + mirror; not the forge** |
| **Cursor Origin + Depot CI** (`cursor.com/codebase/*`, `origin.cursor.com`) | ◐ via Depot CI app: secrets ✅ (`depot ci secrets`), cron ✅ (`on.schedule` ✅ on the compatibility page; the migrate tool page says schedule is stripped — **contradiction, UNVERIFIED**), 15-min browser ✅ (Linux x86/arm sandboxes), **OIDC ✅ own issuer `https://identity.depot.dev`** (relay must accept it); fork PRs ❌ | ◐ no Pages Git integration; wrangler from Depot ✅ | ❌ **Internal/Private only — no public repos, no anonymous clone**; PR + required checks exist (API) but only for logged-in team members | ❌ | Cursor Pro $20/mo + Depot Developer $20/mo + $0.006/min over 2,000 → **~$60–230/mo** at our load | ❌ early beta, tarball export only, acquisition-option overhang | **emergency CI lane at most; not the home** (§5) |

---

## 3. Platform notes with sources

### GitLab.com Free
- 400 compute minutes/month per top-level namespace; public projects on the open-source cost factor use "1 minute per 2 minutes of job time" (0.5). Additional minutes purchasable. — https://docs.gitlab.com/ci/pipelines/compute_minutes/
- Self-hosted (project/group) runners do not consume the hosted quota — standard GitLab behaviour, **UNVERIFIED this session** (not re-quoted from the page).
- `id_tokens`: "Tier: Free, Premium, Ultimate"; issuer is the instance domain (`https://gitlab.com`), claims include `project_path`, `namespace_path`, `ref`, `ref_protected`, `project_visibility`, `sha`, `job_id`. — https://docs.gitlab.com/ci/secrets/id_token_authentication/
- Merge checks incl. "Pipelines must succeed": Free, Premium, Ultimate. — https://docs.gitlab.com/user/project/merge_requests/auto_merge/
- Scheduled pipelines: Free tier; instance-level max frequency and max schedules per project (values not on the page, **UNVERIFIED**; hourly is well within). — https://docs.gitlab.com/ci/pipelines/schedules/
- 5-user cap applies only to *private* top-level namespaces; "User limits do not apply to ... Public top-level groups". — https://docs.gitlab.com/user/free_user_limit/
- Pull mirroring (GitHub→GitLab) is Premium/Ultimate; push mirroring (GitLab→anywhere) is Free. — https://docs.gitlab.com/user/project/repository/mirror/push/ and forum thread https://forum.gitlab.com/t/mirror-repo-to-free-tier-account/115774
- Cloudflare Pages GitLab integration: OAuth "Cloudflare Workers" app, auto-deploy on push, commit status in GitLab. Whether an *existing* Pages project can be re-pointed from GitHub to GitLab is **not documented (UNVERIFIED)**; the only stated restriction is "If you deploy using the Git integration, you cannot switch to Direct Upload later". — https://developers.cloudflare.com/pages/configuration/git-integration/gitlab-integration/ , https://developers.cloudflare.com/pages/configuration/git-integration/
- Hosted Linux runner sizes (`saas-linux-small-amd64`, privileged). — https://docs.gitlab.com/ci/runners/hosted_runners/linux/

### Codeberg / Forgejo
- "we are currently providing hosted Actions in limited fashion"; "If you need Codeberg to host your CI, please use Woodpecker CI instead"; own runners may be connected. — https://docs.codeberg.org/ci/actions/
- Hosted runner labels `codeberg-tiny` (1 CPU/2 GB/**2 min**), `codeberg-small` (2 CPU/4 GB/**5 min**), `codeberg-medium` (4 CPU/8 GB/**10 min**), `-lazy` variants target completion within 24 h; projects must be public under a libre licence; "Don't jam the queue"; Docker-in-runner unsupported. Last updated 23 Jul 2026. — https://codeberg.org/actions/meta
- Storage: 750 MB git per user default (100 MB private), 1.5 GB LFS/packages combined; no hard quota for valid use. — https://blog.codeberg.org/new-storage-limits-on-codeberg-what-you-need-to-know.html
- Forgejo Actions is GitHub-Actions-syntax compatible, so translation cost is far lower than GitLab's — but no OIDC id-token issuer (**UNVERIFIED**; not found in docs).

### Gitea Cloud
- "Gitea Actions is enabled automatically ... Runners are started on demand"; "Start your 30-day free trial". No permanent free tier and no per-seat price on the product/pricing pages I could fetch; third-party listings say "from $3/user/mo" (**UNVERIFIED**). — https://about.gitea.com/products/cloud/ , https://about.gitea.com/pricing

### sourcehut
- Proposed prices from Jan 2026: €4/€8/€12 (US $5/$10/$15), reduced €2/$2; "never pricing anyone out". — https://sourcehut.org/blog/2025-12-01-proposed-pricing-changes/
- builds.sr.ht requires a paid account. — https://lists.sr.ht/~sircmpwn/sr.ht-discuss/%3C32e85430-b650-4774-ad14-00688e473c5b@benaaron.dev%3E , https://man.sr.ht/billing-faq.md

### Radicle
- Radicle 1.10.2 released 26 Aug 2026 (active). CI is a broker the operator runs; adapters for native/container, GitHub Actions, Concourse, Woodpecker; no hosted CI; secrets not addressed. — https://radicle.dev/ , https://radicle-ci.liw.fi/ , https://lib.rs/crates/radicle-ci-broker

### Bitbucket Cloud
- Free: 5 users, 50 build-min/mo, 1 GB storage. — https://www.atlassian.com/software/bitbucket/pricing

### Azure DevOps
- Public projects: 10 free hosted parallel jobs, 360 min each; private: 1 job/1,800 min after a request form (2–3 business days). — https://devblogs.microsoft.com/devops/change-in-azure-pipelines-grant-for-private-projects/ (2021, still current per 2026 sources, e.g. https://cicdcalculator.com/azure-pipelines-pricing)

### Hugging Face Hub + Jobs
- Jobs: "available to any user or organization with a positive credit balance"; billed per minute; default timeout 30 min (configurable); `secrets={}` encrypted server-side; scheduled jobs with `@hourly` or cron; `trigger_scheduled_job`, `suspend`, `resume`; webhooks can trigger a Job on repo/discussion events; `cpu-basic` 2 vCPU/16 GB $0.01/h, `cpu-upgrade` 8 vCPU/32 GB $0.03/h. — https://huggingface.co/docs/huggingface_hub/guides/jobs , https://huggingface.co/docs/hub/jobs-pricing
- Hub PRs: "no forks are involved: contributors push to a special ref branch directly on the source repo"; "no hard distinction between discussions and PRs"; "streamlined for ML ... not arbitrary repos". No mention of branch protection, required checks or CI status. — https://huggingface.co/docs/hub/repositories-pull-requests-discussions
- No OIDC/workload-identity token for Jobs found in docs or search (**UNVERIFIED — absent**).

### GitHub reinstatement norms (to judge ticket #4720908)
- Observed spread in community threads: **10 minutes**, **2 days**, **3 days** (Dec 2025 false positive, https://github.com/orgs/community/discussions/188610), support's own stated target "up to 7 business days", then documented tails of **1–4 weeks**, **50+ days with no human review** (Mar→May 2026, https://github.com/orgs/community/discussions/191242), and **>2 months unresolved** (Apr→Jun 2026, https://github.com/orgs/community/discussions/192402). Older thread with the full spread incl. "3 months": https://github.com/orgs/community/discussions/27294
- Triggers named by GitHub staff/commenters: "unusual activity patterns, rapid repository changes, automation scripts, login anomalies"; 2026 threads specifically cite agentic tools making rapid API calls from cloud IPs and an OAuth app (Cursor GitHub App) regenerating tokens 15+ times in days. Our estate matches that profile (22-lane harness, Cursor push treadmill in memory).
- Process advice that recurs: one ticket only; follow up on the same thread after 7–10 business days; do not open duplicates. Transfers/renames keep redirects *within* GitHub only; GitHub Pages are not redirected; creating a new repo at the old location kills the redirect. — https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository

### MCP Registry namespace
- Names are reverse-DNS; `io.github.*` is verified via GitHub OAuth/OIDC; custom namespaces (e.g. `ai.councilof/*`) via **DNS TXT or HTTP challenge** — "Publishers must verify ownership of their namespace through GitHub, DNS, or HTTP challenges". Registry is in preview; renaming an existing entry is not documented (**UNVERIFIED** — assume a new name is a new server). — https://modelcontextprotocol.io/registry/about

---

## 4. Honest recommendation

**Platform:** GitLab.com, public top-level group (e.g. `gitlab.com/csoai`), as the second full forge now and the canonical home only if §7's threshold trips. **Hugging Face Jobs** as the scheduled-compute lane in both worlds. **GitHub kept, never deleted.**

**Why GitLab over Codeberg/HF/others:**
- It is the only free platform that clears R1 *including OIDC id-tokens on the Free tier* and R3 with the MR checks reviewers expect, and R2 with a native Cloudflare Pages Git integration as well as the wrangler path we already use.
- Public groups are exempt from the 5-user cap, so outside contributors cost nothing.
- Free push-mirroring means GitLab can *feed* GitHub (and the HF mirror) automatically — the reverse of what we have today, which is exactly the durability direction we want after 2 Sep.
- Codeberg is closer to our values and cheaper to translate (same YAML), but its hosted-runner policy (10-min cap, "don't jam the queue") makes our 20–30k min/month load a bad citizen, and its git soft-quota is within 15% of our pack size.

**What breaks:**
1. **Signing relay** — `board-sign.ts` must accept a second issuer (`https://gitlab.com`, JWKS at the GitLab discovery endpoint, claim `project_path == "csoai/councilof-ai"` and `ref_protected == true`) and `publish_public_root.py` needs a GitLab branch (`CI_JOB_JWT_V2`/`id_tokens` env instead of `ACTIONS_ID_TOKEN_REQUEST_URL`). Keep the GitHub issuer too; both are Ed25519-neutral. HF Jobs cannot use the relay (no OIDC) — signing steps stay in GitLab jobs; mills that only *measure* can run on HF.
2. **Hosted minutes** — 400/mo is enough for MR guards only. The 15–20 min deploy and the hourly mills need either an Oracle-hosted GitLab runner (£0, arm64 Playwright works) or HF Jobs launched from a thin GitLab job (`hf jobs run --image csoai/ci-runner ...`, ~$0.01–0.03/h).
3. **Workflow translation** — 40 GitHub Actions files → `.gitlab-ci.yml` includes. Only ~8 are load-bearing (deploy, public-root, drift-guard, hub-queue-mill, hf-inference-mill, auto-eat-sign, claims-e2e, evidence-smoke); the guards (`protect-verified-*`, `lane-guard`, `conflict-guard`, `one-door-guard`) are `node scripts/*.mjs` calls and translate in minutes.
4. **`action-verify-attestation`** is a GitHub Action; it only runs on GitHub. Keep the repo there; publish the same verifier as a GitLab CI template/component later (optional).
5. **MCP namespace** — `io.github.CSOAI-ORG/gspc` stays as-is (it is the org's, and the remote URL `https://councilof.ai/mcp` never changes). Add a DNS-verified `ai.councilof/gspc` listing when the registry's DNS flow is exercised; never delete the io.github entry.
6. **Public links** — every `github.com/CSOAI-ORG/...` in `public/` should be routed through `councilof.ai/code/<repo>` (a `_redirects` rule we own, mind the 100-dynamic-rule guard) so the next platform event is a one-line change, not a sweep.
7. **npm provenance** for `csoai-gspc-mcp` — npm supports provenance from GitLab CI as well as GitHub Actions (**UNVERIFIED this session**); until verified, publish from GitHub or without provenance.

**Migration cost:**

| Phase | What | Hours | Money |
|---|---|---|---|
| 0 — insurance (do now, reversible) | GitLab public group + project pushed from the local clone (`git push --mirror`); push-mirror to HF dataset mirror; "Pipelines must succeed" + protected `master`; the 4 hourly mills as HF scheduled jobs (cron already proven); `councilof.ai/code/*` redirect rules | **~6 h** | **£0** (+ HF Jobs ≈ $2–5/mo) |
| 1 — canonical flip (only on §7 trigger) | translate the 8 load-bearing workflows; dual-issuer `board-sign.ts` + `publish_public_root.py`; Oracle GitLab runner or HF-launch shim; GitLab masked variables for the 25 secrets (owner types them — never an agent); Cloudflare: disconnect the GitHub Git auto-build from `councilof-ai` (owner, dashboard), keep wrangler-only; DNS-verified MCP namespace; docs/links sweep | **~24–32 h** | £0 forge; ≈ **$5–10/mo** HF; £0 Oracle |
| 2 — tail | remaining ~30 workflows: translate or retire (many are one-off probes); GitLab CI component for the attestation verifier | **~20 h over weeks** | £0 |

Total to a fully independent home: **~50–60 h and under $10/month**. Phase 0 alone buys most of the durability for 6 h.

**Keep on GitHub even if we move:**
- The `CSOAI-ORG` org and every repo (archived or push-mirrored) — deleting kills redirects and frees the name for squatting.
- `io.github.CSOAI-ORG/gspc` registry entry; `action-verify-attestation` (marketplace); any npm-provenance publishing until GitLab provenance is verified.
- A README banner "canonical: gitlab.com/csoai/councilof-ai" on each mirrored repo once reinstated.

---

## 5. Cursor "Codebase" / Origin + Depot — first-class evaluation

**What it is (verified).** `cursor.com/codebase` is the logged-in Codebase tab of **Cursor Origin**, Cursor's code host, "rolling out today in early beta on all paid plans" (17 Aug 2026). Native repos are cloned/pushed at `https://origin.cursor.com/{owner}/{repo}.git`; PRs, code browsing, GitHub sync, an apps marketplace (docs list Vercel, Depot, Buildkite; the owner's dashboard also shows CircleCI, EngFlow, Render — owner-observed, not in docs). The URL `cursor.com/codebase` itself 307-redirects unauthenticated readers to `cursor.com/api/auth/login` → WorkOS. — https://cursor.com/changelog/origin-code-hosting , https://cursor.com/docs/origin , https://cursor.com/docs/origin/create-repository

**Visibility (verified, the decisive fact).** "An **Internal** repo is visible to anyone on your Cursor team with access to the codebase. A **Private** repo is visible only to members granted access directly or through codebase permissions." There is no Public option and no anonymous read; "Origin code storage is available on Pro, Teams, and Enterprise plans. It is not available on free plans." Hands-on reviews (25 Aug 2026) confirm "only documents Internal and Private visibility". — https://cursor.com/docs/origin/settings , https://cursor.com/docs/origin , https://flaviocopes.com/cursor-origin/ , https://www.datacamp.com/tutorial/cursor-origin-tutorial

**PR / review / checks (verified).** "Open, review, and merge pull requests." The Origin API (`https://api.cursor.com/v1/origin`) has full PR CRUD, reviews, labels, and a check-run endpoint: apps "upsert a check suite + check run using an installation access token"; "required-check configuration is keyed on" stable check keys — so required checks exist for apps like Depot. Webhooks: signed `POST`s, EdDSA over `SHA-256("<webhook-id>.<webhook-timestamp>.<body>")` against Origin JWKS, at-least-once delivery, events `repository.pushed`, `pull_request.created/merged`, reviews, comments. Installation tokens (`oit_…`, ≤15 min) authenticate git over HTTPS. — https://cursor.com/docs/api/origin

**GitHub mirror → Origin (verified).** "Sync from GitHub" mirrors history, branches, tags and PRs two-way; "GitHub stays the source of truth and Origin is the mirror." Issues, Actions workflows, **secrets** and branch protections do not sync. "**Detach from GitHub** stops syncing with GitHub and makes the Origin copy a standalone Origin-hosted repository." Depot/Buildkite "apply to Origin-hosted repositories, not mirrored copies" — so to run CI on Origin the repo must be detached (native). Redirects: Origin offers none for GitHub URLs; a detached repo does not touch the GitHub copy. — https://cursor.com/docs/origin/settings , https://www.datacamp.com/tutorial/cursor-origin-tutorial

**Depot CI (verified).** "Depot CI is a programmable CI system for engineers and agents. Workflows in Depot CI run entirely on Depot compute"; "GitHub Actions is the first syntax Depot CI supports". Connect with `depot ci migrate --forge=origin` ("Forge that hosts the repository and sends CI events, `github` or `origin`", CLI ≥ v2.102.7).
- Triggers: `push, pull_request, pull_request_target, pull_request_review, deployment_status, repository_dispatch, schedule, workflow_call, workflow_dispatch, workflow_run, merge_group`; compatibility table marks `on.schedule` "Cron schedule triggers ✅" and `on.workflow_dispatch` ✅; `concurrency` ✅; `services` ✅; `timeout-minutes` ✅. **Contradiction:** the CLI reference for `depot ci migrate` says "Unsupported triggers (like `release` or `schedule`) are removed from the `on:` block" — possibly stale. **UNVERIFIED which is current; a one-workflow trial settles it.**
- Secrets: `depot ci secrets add|set|bulk|list|remove`, encrypted, never readable back, scoped by `--repo/--env/--branch/--workflow`; `${{ secrets.* }}` works unchanged. Import from GitHub via a one-shot workflow (`depot ci migrate secrets-and-vars`) — **unavailable to us while Actions is dark**; the owner would bulk-load 25 secrets from a dotenv on the Mac (`depot ci secrets bulk`), never an agent.
- OIDC: "Set `permissions: id-token: write` in the workflow for the token to be issued; the issuer is `https://identity.depot.dev`", JWKS `https://identity.depot.dev/keys`; `ACTIONS_ID_TOKEN_REQUEST_URL` is injected so `publish_public_root.py`'s `oidc_available()` returns true unchanged. Claims: `sub` = `spiffe://identity.depot.dev/org/<org>/ci/github/<owner>/<repo>/ref/<ref>/sandbox/<id>`, plus `repository`, `ref`, `workflow`, `actor`, `event_name`, `org_id`, `job_id`, `sha`. Docs show `ci/github/...` subjects only; the Origin-forge subject shape is **UNVERIFIED**.
- Not supported: fork-triggered PRs ("planned"), cross-repo reusable workflows, deployment environments, `GITHUB_TOKEN` against GitHub Packages, Windows/macOS. Runner labels map to `depot-ubuntu-latest` (x86_64; `-arm` since 24 Aug 2026).
- Price: Developer **$20/mo incl. 2,000 min, $0.006/min after**; Startup $200/mo incl. 20,000; per-second metering. 7-day trial, no permanent free tier.
— https://depot.dev/docs/ci/overview , https://depot.dev/docs/ci/compatibility , https://depot.dev/docs/cli/reference/depot-ci , https://depot.dev/docs/ci/oidc , https://depot.dev/pricing , https://raw.githubusercontent.com/depot/skills/main/skills/depot-ci/SKILL.md , https://depot.dev/changelog

**Could Origin + Depot run our two critical workflows as-is this week?** Technically, mostly yes:

| Workflow | What runs unchanged | What must change |
|---|---|---|
| `deploy.yml` (prerender + `wrangler pages deploy`, 45-min timeout, `concurrency: site-deploy`) | checkout, setup-node, guards, Playwright prerender in a Linux sandbox, wrangler upload with `CLOUDFLARE_API_TOKEN`/`ACCOUNT_ID` from Depot secrets, `concurrency` honoured | `runs-on` label; the `schedule` re-stamp every 3 h (if the contradiction resolves to "stripped", trigger from an HF scheduled job via `depot ci dispatch` instead); Pages **Git integration cannot point at Origin** — wrangler is the only door (already true) |
| `public-root.yml` (hourly, `id-token: write`, signs via `/api/board-sign`) | secrets, checkout, Python, `ACTIONS_ID_TOKEN_REQUEST_URL` flow | `functions/api/board-sign.ts` must accept issuer `https://identity.depot.dev` + JWKS `/keys`, and check `repository`/`sub` for the Origin repo (subject shape unverified) — ~2 h plus a test signature; hourly `schedule` same caveat as above |

**Cost at our load.** ~20–30k job-min/month (estimate, §1) on Depot Developer ≈ $20 + 23,000 × $0.006 ≈ **$158/mo**; on Startup ≈ **$230/mo**. If the hourly mills move to HF Jobs and Depot only carries deploy + PR checks (~6–8k min) ≈ **$44–56/mo**. Plus Cursor Pro **$20/mo** (already paid by the owner). Against **£0** on GitHub, **$5–10** on HF Jobs, **£0** on a GitLab self-hosted runner.

**What breaks if Origin became the home:**
1. **R3 — public visibility.** Standards-body reviewers (IETF SCITT, C2PA) and outside contributors cannot read, clone or open PRs without a Cursor seat and team membership. Fork PRs are unsupported in Depot anyway. This alone disqualifies Origin as the canonical home for an Apache-2.0, "measure in public" estate.
2. **R4 — links and namespace.** `io.github.CSOAI-ORG/gspc` is unaffected only as long as the GitHub org exists (the namespace is the org's, verified via GitHub OAuth, and the remote `https://councilof.ai/mcp` never changes). `server.json` `repository.url` must stay a *public* URL — an Origin URL would fail the registry's "publicly accessible" rule. Every `github.com/CSOAI-ORG/...` link in `public/` breaks with no redirect on either side.
3. **R2 — Cloudflare Pages Git integration** does not exist for Origin (GitHub/GitLab only); wrangler-from-CI is the sole door. Acceptable — it is already our one door — but the GitHub auto-build must be disconnected by the owner so it stops clobbering.
4. **R6 — durability.** Early beta; export is a tarball endpoint plus `git clone` with an installation token; xAI holds an option to acquire Cursor (reported Apr 2026). Origin is a mirror-grade home, not a canonical one.
5. **Cron contradiction** (schedule ✅ vs. stripped) must be settled by trial before any hourly lane depends on it.

**Verdict.** Origin + Depot is a *workable emergency CI lane* — one day of work (issuer swap in `board-sign.ts`, `depot ci migrate --forge=origin`, 25 secrets bulk-loaded by the owner, `runs-on` mapping) would get the site deploy and the signed root moving again for ~$40–60/month. It is **not a code home**: no public repos, paid seats for every reader, fork PRs unsupported, beta export story, ~10× the cost of the GitLab + HF Jobs shape at full load. Use it as what it already is — the owner's agent-facing private mirror — and re-evaluate only when Origin ships public repositories and a stable GA.

**If the owner wants the emergency lane this week (order, ~6–8 h, owner-gated steps marked):**
1. Owner: Depot Developer trial; `depot ci migrate --forge=origin` on the *detached* Origin repo (or a fresh native Origin repo pushed from the Mac — keep the GitHub mirror untouched).
2. Owner: `depot ci secrets bulk < .env.ci` for the 25 names (values never through an agent).
3. Agent: `board-sign.ts` dual-issuer (GitHub + `https://identity.depot.dev`, JWKS `/keys`, allow `repository` ∈ {`CSOAI-ORG/councilof-ai`, the Origin slug}); deploy via wrangler from the Mac pipeline; verify with one signed test payload.
4. Agent: run `deploy.yml` once via `depot ci dispatch`; confirm the apex serves the prerendered build; then `public-root.yml` once; check `/proof` pointer MATCH.
5. Settle the `schedule` question with `public-root.yml`'s hourly cron; if stripped, drive it from an HF scheduled job calling `depot ci dispatch`.
6. Do **not** move `server.json`, `public/` links or the MCP listing — they keep pointing at GitHub (or GitLab after §6).

---

## 6. Step-by-step plan for the recommended option

**Phase 0 — insurance, this week, no irreversible action**
1. Owner creates the GitLab.com public top-level group (suggest `csoai`; keeps the 5-user cap away) and an empty public project `councilof-ai`. (Owner action: account creation is owner-only.)
2. From the Mac clone: `git remote add gitlab git@gitlab.com:csoai/councilof-ai.git && git push --mirror gitlab` (642 MiB pack; within the 10 GiB free storage).
3. Project → Settings → Repository → Mirroring: **push** mirror to `https://huggingface.co/datasets/csoai/councilof-ai-mirror` (HTTPS, HF write token as the mirror password — owner types it). GitLab now feeds HF; the HF side is unchanged.
4. Settings → Merge requests: "Pipelines must succeed"; protect `master` (maintainers push, everyone can MR).
5. Add a minimal `.gitlab-ci.yml` that runs the four `node scripts/*-guard.mjs` checks on MR (≤1 compute-min each; well inside 400/mo).
6. HF Jobs: `hf jobs scheduled run --schedule "41 * * * *" --image csoai/ci-runner --namespace csoai ...` for `hub-queue-mill`, `hf-inference-mill`, `drift-guard` (every 30 min) and `evidence-smoke` — each cloning from GitLab (public, no token) and using HF secrets. Signing-dependent lanes (`public-root`, `auto-eat-sign`) stay off until Phase 1.
7. Add `public/_redirects` rules `/code/:repo  https://github.com/CSOAI-ORG/:repo 302` today (one rule, GitHub target); swap the target later in one line. Run `scripts/redirects-guard.mjs` first.
8. Record the GitLab URL in `docs/csoai-estate-structure` and MEMORY (docs only; no public announcement yet).

**Phase 1 — canonical flip (only when §7 trips)**
1. `functions/api/board-sign.ts`: accept issuers `{github, gitlab}`; for GitLab verify `project_path === "csoai/councilof-ai"`, `ref_protected === "true"`, `aud` in the same allow-list; JWKS from GitLab's OIDC discovery document. Deploy via wrangler; verify with a throwaway signing call from a GitLab job before cutting over.
2. `scripts/publish_public_root.py` + the three `sign_*` scripts: add `GITLAB_OIDC_TOKEN` (`id_tokens:` block, `aud: https://councilof.ai/api/board-sign`) alongside the GitHub path.
3. Translate the 8 load-bearing workflows into `.gitlab-ci/` includes; keep `timeout` and the `concurrency`-equivalent (`resource_group: site-deploy`) for the deploy.
4. Runner: Oracle free ARM VM registers a GitLab project runner with tag `oracle`; the deploy and browser jobs use `tags: [oracle]`. Fallback: thin GitLab job that calls `hf jobs run --flavor cpu-upgrade --timeout 40m --image csoai/ci-runner` and polls `hf jobs wait`.
5. Owner enters the 25 secrets as masked+protected CI variables (no agent ever sees values).
6. Cloudflare dashboard (owner): Pages project `councilof-ai` → Builds → disconnect the GitHub Git integration (this also ends the apex-clobber loop). Do **not** connect GitLab Git auto-build — wrangler from CI is the one door.
7. Flip `public/_redirects` `/code/*` target to GitLab; update `mcp/gspc-server/server.json` `repository.url`, `public/.well-known/mcp.json`, `openapi.json`, `llms.txt`, `AGENT-ONBOARDING.md`.
8. MCP registry: `mcp-publisher login dns` for `ai.councilof` (TXT record on councilof.ai — owner adds), publish `ai.councilof/gspc` v1.1.x with identical remotes. Leave `io.github.CSOAI-ORG/gspc` listed.
9. When GitHub reinstates: set GitLab → GitHub push mirror (Free) so `github.com/CSOAI-ORG/councilof-ai` stays byte-identical; add the README banner; optionally archive.

**Phase 2 — tail**: translate or retire the remaining workflows one lane at a time; ship the verifier as a GitLab CI component.

---

## 7. "Do nothing yet" threshold

Business days counted from Wed 2 Sep 2026 (UK).

| Condition | Action |
|---|---|
| Reinstated by **day 5 (Tue 9 Sep)** | Keep GitHub canonical. Still complete Phase 0 (6 h, £0) — the flag can recur and the profile that triggers it (agentic pushes, hourly mills) is ours. |
| Not reinstated by day 5, no human reply on #4720908 | Follow up once on the same ticket (community norm: 7–10 business days before a nudge). Start Phase 1 items 1–3 in a branch (no cutover). |
| Not reinstated by **day 10 (Tue 16 Sep)**, **or** any second limit event at any time | Flip canonical to GitLab (Phase 1 cutover). The observed tail (50+ days, 2+ months) says the expected wait past day 10 is weeks, and the site deploy and signed root are already stale by then. |
| Reinstated after a flip | Do not flip back. GitHub becomes the push-mirror target; the redirect layer at `councilof.ai/code/*` means nothing public changes again. |

Interim, in every branch of the table: the estate's daily proof is the signed public root, which needs OIDC. Until Phase 1 item 1 lands, the only honest posture is "root unchanged since 2 Sep" on `/honesty` — not a laptop-key signature.

---

## Sources (all read 2026-09-02)

- Cursor Origin — https://cursor.com/changelog/origin-code-hosting ; https://cursor.com/docs/origin ; https://cursor.com/docs/origin/create-repository ; https://cursor.com/docs/origin/settings ; https://cursor.com/docs/api/origin ; https://flaviocopes.com/cursor-origin/ ; https://www.datacamp.com/tutorial/cursor-origin-tutorial
- Depot CI — https://depot.dev/docs/ci/overview ; https://depot.dev/docs/ci/compatibility ; https://depot.dev/docs/cli/reference/depot-ci ; https://depot.dev/docs/ci/oidc ; https://depot.dev/pricing ; https://depot.dev/docs/github-actions/overview ; https://raw.githubusercontent.com/depot/skills/main/skills/depot-ci/SKILL.md ; https://depot.dev/changelog ; https://depot.dev/blog/migrate-to-depot-ci
- `cursor.com/codebase` → 307 to `cursor.com/api/auth/login` → WorkOS; reviews: https://appwrite.io/blog/post/cursor-origin-review-an-engineers-perspective , https://www.digitalocean.com/resources/articles/cursor-origin-vs-github , https://www.sitepoint.com/cursor-origin-github-sync-code-hosting-beta/ , https://siliconangle.com/2026/08/17/cursor-launches-origin-code-hosting-service-to-compete-with-github/
- GitLab — compute minutes https://docs.gitlab.com/ci/pipelines/compute_minutes/ ; id_tokens https://docs.gitlab.com/ci/secrets/id_token_authentication/ ; merge checks https://docs.gitlab.com/user/project/merge_requests/auto_merge/ ; schedules https://docs.gitlab.com/ci/pipelines/schedules/ ; free user limit https://docs.gitlab.com/user/free_user_limit/ ; push mirroring https://docs.gitlab.com/user/project/repository/mirror/push/ ; hosted runners https://docs.gitlab.com/ci/runners/hosted_runners/linux/
- Cloudflare Pages — https://developers.cloudflare.com/pages/configuration/git-integration/ ; https://developers.cloudflare.com/pages/configuration/git-integration/gitlab-integration/
- Codeberg — https://docs.codeberg.org/ci/actions/ ; https://codeberg.org/actions/meta ; https://blog.codeberg.org/new-storage-limits-on-codeberg-what-you-need-to-know.html
- Gitea Cloud — https://about.gitea.com/products/cloud/ ; https://about.gitea.com/pricing
- sourcehut — https://sourcehut.org/blog/2025-12-01-proposed-pricing-changes/ ; https://man.sr.ht/billing-faq.md
- Radicle — https://radicle.dev/ ; https://radicle-ci.liw.fi/ ; https://lib.rs/crates/radicle-ci-broker
- Bitbucket — https://www.atlassian.com/software/bitbucket/pricing
- Azure DevOps — https://devblogs.microsoft.com/devops/change-in-azure-pipelines-grant-for-private-projects/
- Hugging Face — https://huggingface.co/docs/huggingface_hub/guides/jobs ; https://huggingface.co/docs/hub/jobs-pricing ; https://huggingface.co/docs/hub/repositories-pull-requests-discussions
- GitHub norms — https://github.com/orgs/community/discussions/192402 ; https://github.com/orgs/community/discussions/191242 ; https://github.com/orgs/community/discussions/188610 ; https://github.com/orgs/community/discussions/27294 ; https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository
- MCP Registry — https://modelcontextprotocol.io/registry/about
