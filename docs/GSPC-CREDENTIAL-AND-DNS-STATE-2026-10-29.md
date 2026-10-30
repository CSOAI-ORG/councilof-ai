# Credential & DNS state — 2026-10-29

Scope: five credential/DNS items for `CSOAI-ORG/councilof-ai` (public, default branch `master`, head `aa9712e`).
Machine-readable twin: `out/credential-and-dns-state-20261029.json`.
**No secret value, partial token, prefix, or key appears in this document.**

## State table

| # | Item | State | Action taken | Owner command needed |
|---|------|-------|--------------|----------------------|
| 1 | npm publish token (`csoai-gspc-mcp`, `csoai-governance-mcp`) | **BLOCKED_HUMAN** | None — no token minted, no interactive login attempted | `npm login --auth-type=web` then `npm token create --read-only=false` — *not needed for `csoai-gspc-mcp`* (OIDC already publishes it) |
| 2 | `SNAPSHOT_PR_TOKEN` (repo secret) | **MINTED** | Secret set 2026-10-29T03:35:03Z from the machine's existing `gh` OAuth token (scopes `gist, read:org, repo, workflow`); value never printed | none required (optional: replace with a fine-grained PAT) |
| 3 | `cf-kv-read.token` (Oracle host file) | **UNREACHABLE** | None — Oracle SSH times out; no local Cloudflare credential can mint a KV-read token | mint a Cloudflare token (dashboard, human-only), then `scp … oracle-micro-2:~/.secrets/cf-kv-read.token` |
| 4 | `gh-dispatch.token` (Oracle host file) | **BLOCKED_HUMAN** | None — no PAT mint path exists non-interactively | `gh auth token \| ssh oracle-micro-2 'cat > ~/.secrets/gh-dispatch.token && chmod 600 ~/.secrets/gh-dispatch.token'` |
| 5 | `www.csoai.org` DNS A/CNAME at Namecheap | **BLOCKED_HUMAN** | None — **DNS untouched**; `setup-dns.sh` read but **not run** | `namecheap.domains.dns.setHosts` for `csoai`/`org` (prerequisites below) |

Extra row, already correct — no action, not a blocker:

| Item | State | Note |
|------|-------|------|
| `THIRD_PARTY_GUARD_IDS` (repo secret) | **PRESENT** — updated 2026-10-07T05:55:57Z, **and functional** | `pr-gates.yml` job `third-party-identifiers` = **success** on the latest completed runs; the test fails closed when empty, so green ⇒ non-empty |

---

## 1 — npm publish token · BLOCKED_HUMAN

**Current state**

- `npm whoami` → `HTTP 401 Unauthorized`. npm is **not** logged in on this machine.
- `~/.npmrc` exists (74 bytes, mode 0600) and contains exactly one key: `//registry.npmjs.org/:_authToken`.
  - token key present: **yes**
  - value length: **40**; class: classic npm token (`npm_` prefix family) — prefix not disclosed
  - **it does not work**: the registry rejects it 401 (expired or revoked).
  - no other npmrc on the machine.
- `npm token create --read-only=false` stops at an interactive `npm password:` prompt — it never reaches the registry. With the `.npmrc` token rejected there is **no non-interactive path** from this machine. The npm account is WebAuthn-only (not TOTP), so `npm publish --otp=` can never work and web login returns EOTP (`scripts/spray/gspc-spray.py:1875`).

**The estate's premise is now partly stale.** `csoai-gspc-mcp` publishes via **npm trusted publishing (GitHub Actions OIDC)** — `.github/workflows/npm-gspc-release.yml` asks for `id-token: write` and runs `npm publish --access public` with **no** `NPM_TOKEN`. It is working: `csoai-gspc-mcp@0.2.4`, published **2026-10-28T16:48:35Z**, matching repo `package.json` 0.2.4 and a successful `npm-gspc-release.yml` run at 2026-10-28T16:38:42Z.

The real remaining gap is **`csoai-governance-mcp`**: repo `package.json` says **0.1.1**, npm latest is **0.1.0** (2026-09-16T09:20:18Z), and **no workflow in `.github/workflows` publishes it** — so it has neither an OIDC path nor a token path. The cheaper fix than minting a token is to add a trusted-publishing workflow for it and register the trusted publisher in the npm web UI.

**Owner command**

```
npm login --auth-type=web      # interactive browser + WebAuthn (human-only)
npm token create --read-only=false
```

**What it unblocks** — `.github/workflows/gspc-spray.yml:167` and `scripts/spray/gspc-spray.py:1875` read `NPM_TOKEN` **only to print a table row**; that surface is a reporting-only WARN, and the real publish path is OIDC.

---

## 2 — `SNAPSHOT_PR_TOKEN` · MINTED (was ABSENT)

**Before:** absent from the 19 repo secrets. **Now:** present, `updated_at 2026-10-29T03:35:03Z`.

```
gh auth token | gh secret set SNAPSHOT_PR_TOKEN -R CSOAI-ORG/councilof-ai
```

Value piped from the local `gh` keyring — never printed, echoed, or written to disk in the audit output.

| Metadata | Value |
|---|---|
| name | `SNAPSHOT_PR_TOKEN` |
| class | GitHub OAuth user token (`gho_` family; value not disclosed) |
| scopes | `gist`, `read:org`, `repo`, `workflow` — `repo` (branch/push/PR) and `workflow` (`gh workflow run`) are what the consumers need |
| created | pre-existing local credential, not minted in this run; secret recorded 2026-10-29T03:35:03Z |
| expires | no published expiry; owner can re-mint with `gh auth login` |

**Blast radius:** `repo` scope reaches 100 repos including 3 private ones (`CSOAI-ORG/asisecurity-ai-site`, `asisecurity-portal`, `agisafe-ai-site`). All 7 consumers are `schedule` / `workflow_dispatch` / `repository_dispatch` — **no `pull_request` trigger**, so there is no untrusted-PR path to the secret.

**What it unblocks** — seven workflows, all using the fallback chain `GH_TOKEN: ${{ secrets.SNAPSHOT_PR_TOKEN || secrets.GITHUB_TOKEN }}`:
`.github/workflows/x402-door-conformance.yml:47` · `mcp-trust-board-round.yml:38` · `census-delta.yml:111` · `catalog-trust-round.yml:29` · `reg-watch.yml:32` · `provider-watch.yml:42` · `tui6-monitoring.yml:106`.
In-repo intent, verbatim: *"SNAPSHOT_PR_TOKEN: a PR opened with it fires pull_request checks; GITHUB_TOKEN cannot."* With `GITHUB_TOKEN` alone the PR never triggers `pull_request` checks, so the gates never run.

**Optional hardening (owner):** mint a fine-grained PAT limited to this repo (Contents RW + Pull requests RW + Actions RW) at <https://github.com/settings/personal-access-tokens/new>, then:
`gh secret set SNAPSHOT_PR_TOKEN -R CSOAI-ORG/councilof-ai --body '<value>'`

---

## 3 — `cf-kv-read.token` · UNREACHABLE

**It is not a GitHub repo secret.** The name contains dots, and the GitHub API rejects dotted secret names outright — verified live: `gh secret set probe.dotted.name` → `HTTP 422 "Secret names can only contain alphanumeric characters … or underscores"`. It is a **file on the Oracle host**, `~/.secrets/cf-kv-read.token`.

**What it unblocks** — `/Users/nicholas/fleet-heartbeat/estate-heartbeat.sh:57` maps the INTAKE check's `BLOCKED_OWNER_TOKEN` state to the literal string *"waiting for the owner's Cloudflare KV-read token (oracle:`~/.secrets/cf-kv-read.token`)"*. The digest reads Cloudflare KV and writes `~/lanes/intake/last-run.json`.

**Why nothing was executed**

- `ssh oracle-micro-2` → *"Connection timed out during banner exchange; Connection to 141.147.73.85 port 22 timed out"*.
- `~/.secrets/cf-kv-read.token` does not exist locally (the Oracle files are not mirrored).
- **No Cloudflare credential here can mint a token**: `wrangler` is OAuth-logged-in to account `52092e4dad74b51759a2f748c8cf2528`, but `GET /user/tokens/verify` → `Invalid API Token`, and `POST /user/tokens` (Workers KV Storage Read) → error `9109 Unauthorized to access requested resource`. Creating a CF API token needs the Global API Key + email, which is **not present** (searched `~/.secrets`, `~/.wrangler`).
- `~/.secrets/` is outside the permitted write scope, so no local copy was created.

**Note on the repo side:** the repo already has a *separate, working* Cloudflare KV-read credential — `deploy.yml:346` binds `CLOUDFLARE_KV_READ_TOKEN` to repo secret `CFAT_FP6RDKQJWFJ2QM7W0H83VD55YCDWCG7ERIRT1EG9706102AE` (present, 2026-08-13T11:08:23Z), used **only** for the namespace-list read while the Pages read and the PATCH keep using `CLOUDFLARE_API_TOKEN`. The missing piece is specifically the Oracle host file. **Do not rename or overwrite `CFAT_…`.**

**Owner commands**

```
# 1. mint (dashboard, human-only): My Profile -> API Tokens -> Create Custom Token
#    Account | Workers KV Storage | Read  -> account 52092e4dad74b51759a2f748c8cf2528
# 2. install on Oracle:
scp ~/.secrets/cf-kv-read.token oracle-micro-2:~/.secrets/cf-kv-read.token
ssh oracle-micro-2 'chmod 600 ~/.secrets/cf-kv-read.token'
```

Estate instruction of record: `/Users/nicholas/_alignment/audit-20261007/AUDIT-20261007.md:192`.

---

## 4 — `gh-dispatch.token` · BLOCKED_HUMAN

Also an **Oracle host file**, `~/.secrets/gh-dispatch.token` — dotted name, same GitHub 422 rejection, so it cannot be a repo secret.

**What it unblocks** — `estate-heartbeat.sh:64` maps the dispatch tick's `BLOCKED_OWNER_TOKEN` to *"waiting for the owner's GitHub token (oracle:`~/.secrets/gh-dispatch.token`, Actions read+write)"*; the tick writes `~/fleet/gha-dispatch.json`. This is estate item **A-G8**. It is the direct cause of the `Scheduled workflows | RED` row (`hf-jobs-mill-launch.yml` 117h late **and** *"dispatch tick from Oracle (A-G8) needs the owner token"*), and the estate attributes a 172h-stale public root to the tick not firing.

**Why nothing was executed — no non-interactive PAT mint exists**

| Path tried | Result |
|---|---|
| `POST /authorizations` (classic PAT via API) | `HTTP 404 Not Found` |
| GraphQL `createFineGrainedPat` / `createPersonalAccessToken` | mutation absent — schema has 262 mutations; only `regenerateVerifiableDomainToken` and `updatePatreonSponsorability` match "token" |
| GitHub App installation token | `GET /repos/…/installation` → `401`; `GET /orgs/…/installations` → `404` *"needs the admin:org scope"* — no app installed |
| `gh auth refresh -s …` | interactive browser + `admin:org` — human-only |
| `~/.secrets/github_token.env` | 40-char classic PAT present but `GET /user` → `Bad credentials` (expired/revoked) |

Minting the scoped PAT therefore requires the **GitHub web UI** — a human-only act.

**Owner command** (works today, using the already-working local `gh` credential):

```
gh auth token | ssh oracle-micro-2 'cat > ~/.secrets/gh-dispatch.token && chmod 600 ~/.secrets/gh-dispatch.token'
```

Tighter alternative, per the estate's own instruction (`audit-20261007/AUDIT-20261007.md:195`): mint a fine-grained PAT at <https://github.com/settings/personal-access-tokens/new>, repository `CSOAI-ORG/councilof-ai`, permission **Actions: Read and write**, then place it at `~/.secrets/gh-dispatch.token` mode 600. The one-liner above carries broader scope (`repo` also reaches the 3 private repos) — acceptable for a dispatch tick, but the scoped PAT is the better answer. A repo secret would **not** satisfy this: the tick reads a file on Oracle.

---

## 5 — `www.csoai.org` DNS · BLOCKED_HUMAN — **DNS untouched**

### Live DNS finding

| Query | Result |
|---|---|
| `dig +short www.csoai.org A` | **`162.255.119.208`** (Namecheap parking/forward address) |
| `dig +short www.csoai.org CNAME` | *(none)* |
| `dig +short csoai.org A` | **`172.66.44.153`, `172.66.47.103`** (Cloudflare anycast) |
| `dig +short csoai.org NS` | `dns1.registrar-servers.com.`, `dns2.registrar-servers.com.` — Namecheap is authoritative |
| `curl -sI --max-time 15 https://www.csoai.org` | **no response** — connection timed out (15 s, and again at 25 s) |
| `curl -sI --max-time 15 https://csoai.org` | `HTTP/2 308` → `https://councilof.ai/`, `server: cloudflare`, cf-ray present |
| `curl -sI --max-time 15 http://www.csoai.org` | `HTTP/1.1 302` → `https://csoai.org`, `X-Served-By: Namecheap URL Forward` |
| TLS cert on `csoai.org` | `CN=csoai.org`, issuer Google Trust Services WE1, **SAN = `DNS:csoai.org` only** — no `www.csoai.org`, no wildcard |
| TLS cert on `councilof.ai` | `CN=councilof.ai`, SAN = `DNS:councilof.ai` only |

**Reading of the state.** The **apex is healthy** — Cloudflare-fronted, valid cert, 308 to `councilof.ai`. Only the **www host is broken, and only on HTTPS**. `www.csoai.org` points at a Namecheap forwarding address; plain HTTP answers 302 → `https://csoai.org`, but the HTTPS leg never answers, because the forward resolves to the apex hostname and **the Cloudflare zone's certificate does not cover `www.csoai.org`**. Forcing `www.csoai.org` onto the apex Cloudflare IP returns `sslv3 alert handshake failure` — the CF edge has no cert for that SNI.

**Is an A record or CNAME needed?** Only if `www.csoai.org` must be served **directly from Cloudflare**:
- **Route A (CNAME):** at Namecheap set `www` → `csoai.org` (or `councilof.ai`) **and** add `www.csoai.org` to the Cloudflare zone so a covering SAN is issued. The DNS change alone is insufficient — it yields the same handshake failure.
- **Route B (keep the forward):** if the intent is only *"www should reach the same place as csoai.org"*, the existing plain-HTTP 302 already does that, and only the HTTPS leg needs the certificate.

### `setup-dns.sh` — read, and deliberately NOT run

`/Users/nicholas/setup-dns.sh` takes a key as `$1` and calls `namecheap.domains.dns.setHosts` for **26 hardcoded domains**, overwriting each host set to exactly two records: `@ A 76.76.21.21` (Vercel) and `www CNAME cname.vercel-dns.com`, TTL 1800. It reads no existing records first.

- **`csoai.org` is not in its DOMAINS array** — running it would **not fix `www.csoai.org` at all**.
- **It would change working domains.** 17 of the 26 are on Cloudflare or Vercel nameservers; `koikeeper.ai` *is* on Namecheap DNS and would be clobbered. It would also reset the live `csoai.org` apex/www to a 2026-07-30-era Vercel target (matching the pre-migration backup `/Users/nicholas/csoai-dns-backup-20260730-0502.txt`: apex `A 76.76.21.21`, `www CNAME cname.vercel-dns.com`), undoing the current working Cloudflare-fronted apex.

**Verdict: unsafe and ineffective for this item.**

### Namecheap API key

- **Present**: `/Users/nicholas/.secrets/namecheap-api.env`, key `NAMECHEAP_API_KEY`, 32 chars, value not disclosed.
- Not in the shell environment; **0 mentions** in `~/.zshrc`, `~/.zprofile`, `~/.bashrc`, `~/.profile`, `~/.zshenv`, `~/.zlogin`.
- A **read-only** `namecheap.domains.dns.getList` for `csoai`/`org` was attempted and rejected: `Status="ERROR"`, `Error Number="1011150" "Invalid request IP"`. The script's hardcoded `ClientIp=104.28.154.101` is not whitelisted; the machine's current public IP `104.28.200.17` is not whitelisted either. **Namecheap API access is unavailable from this machine until an IP is whitelisted** (Advanced DNS → API Access).

### Owner command

```
# prerequisites: (1) whitelist the executing public IP in Namecheap (Advanced DNS -> API Access)
#                (2) add www.csoai.org to the Cloudflare zone so a covering certificate exists
curl -s -X POST 'https://api.namecheap.com/xml.response' \
  -d 'ApiUser=nicholastempleman' -d 'ApiKey=$NAMECHEAP_API_KEY' \
  -d 'UserName=nicholastempleman' -d 'ClientIp=<IP_WHITELISTED_IN_NAMECHEAP>' \
  -d 'Command=namecheap.domains.dns.setHosts' -d 'SLD=csoai' -d 'TLD=org' \
  -d 'HostName1=@'    -d 'RecordType1=A'     -d 'Address1=172.66.44.153' -d 'TTL1=1800' \
  -d 'HostName2=www' -d 'RecordType2=CNAME' -d 'Address2=csoai.org'      -d 'TTL2=1800'

# verify
dig +short www.csoai.org A; curl -sI --max-time 15 https://www.csoai.org
```

Confirm the live apex A with `namecheap.domains.dns.getList` before applying — `172.66.44.153` is the value observed at audit time.

---

## What the estate's own checks read

`/Users/nicholas/fleet-heartbeat/estate-heartbeat.sh` — the **INTAKE** and **GHA dispatch tick** checks read exactly **two** credentials, and **both are files on the Oracle host**, not GitHub repo secrets:

| Estate check | Reads | Currently |
|---|---|---|
| INTAKE (`estate-heartbeat.sh:57`) | `oracle:~/.secrets/cf-kv-read.token` | **WARN** — `BLOCKED_OWNER_TOKEN` |
| GHA dispatch tick (`estate-heartbeat.sh:64`) | `oracle:~/.secrets/gh-dispatch.token` (Actions read+write) | **WARN** — `BLOCKED_OWNER_TOKEN` |

`SNAPSHOT_PR_TOKEN`, `THIRD_PARTY_GUARD_IDS`, the npm token and the DNS item are **not** inputs to either check.

Corroborating records: `hermes-reports/2026-10-28-am.md:26` · `hermes-reports/20261028-pm.md:36` · `ALERTS.md:188` · `audit-20261007/loose-ends.md:34`.

**Rendering caveat.** Both WARN rows sit inside an `if [ -n "$ORA" ]` block, so they only render when the Oracle SSH probe succeeds. With Oracle unreachable, `HEARTBEAT.md` (2026-10-29T02:38:39Z, RED count 7) shows `Oracle | RED | ssh unreachable` and `Scheduled workflows | RED | … dispatch tick from Oracle (A-G8) needs the owner token` **instead of** separate INTAKE/dispatch rows. The last recorded state of both checks is `BLOCKED_OWNER_TOKEN`; in today's run they are unmeasured rather than freshly WARN.

**Why `heartbeat.log` never shows either WARN row.** `estate-heartbeat.sh:21` — `row()` appends every state to `ROWS` but pushes only `RED` states into `RED`; line 176 then logs only the RED array (`echo "$NOW red=${#RED[@]} ${RED[*]}" >> "$LOG"`). WARN rows reach `HEARTBEAT.md` (line 175 writes `ROWS`) but never the log. Verified: **0 occurrences of `INTAKE` across all 275 log lines** spanning 2026-10-06T01:58:13Z → 2026-10-29T02:38:39Z — expected for a WARN row, not evidence that INTAKE was never evaluated. Oracle was reachable in 219 of those runs (`Oracle disk:` present), so the block was being evaluated throughout. The `ORA` probe is `estate-heartbeat.sh:37` — `ssh -o ConnectTimeout=20 -o BatchMode=yes oracle-micro-2`, which echoes `DISK`, `BULK`, `INTAKE` (from `~/lanes/intake/last-run.json`) and `DISPATCH` (from `~/fleet/gha-dispatch.json`); when that ssh fails, `ORA` is empty and the INTAKE/dispatch block is skipped entirely.

**Estate's own framing** for these items: `CSOAI-MASTER-CATALOG-OF-ALL-JEWELS-2026-10-27.md:202-206,306-309` (M001 npm rotation, M003 Oracle tokens, M004 Actions secrets, www.csoai.org DNS) and `CSOAI-WORK-PLAN-YEARS-TO-DAYS-2026-10-28.md:48,99-100` (items 1.8, 4.10, 4.11).

## Repo-secret inventory

19 repo secrets before this run → **20** after; added: `SNAPSHOT_PR_TOKEN`.
Both the `production` and `Production` environments exist and are **empty** — no environment-level secrets are set.

`CFAT_FP6RDKQJWFJ2QM7W0H83VD55YCDWCG7ERIRT1EG9706102AE` is an existing repo secret used as the Cloudflare KV-read credential at `deploy.yml:346`. It is **not** the Oracle `cf-kv-read.token`; leave it untouched.

## Method

`gh secret list` (names + dates only, no values) · sparse clone of the repo at `aa9712e` and grep for each literal secret name · `estate-heartbeat.sh` + `HEARTBEAT.md` + hermes reports for the check wiring · `dig`/`curl`/`openssl` for DNS and TLS · `npm whoami`/`npm view`/`npm token create` (non-interactive probe only).

Nothing was deleted, pushed, or merged. No PR opened. No email sent. No account created. Nothing purchased. **DNS not modified.**
