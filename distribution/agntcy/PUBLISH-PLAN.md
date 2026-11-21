# PUBLISH-PLAN — AGNTCY directory publication for the generated OASF records

Date: 2026-11-19 · Repo: CSOAI-ORG/councilof-ai (master) · Author: agent-7 (research + bounded execution; no publishes run)

## (a) Current artefact inventory

`distribution/agntcy/` on master contains **only `README.md`** (1,802 B, generator-emitted by `scripts/harness-x/render.mjs`, template at ~line 1956). The records themselves are generated + committed elsewhere and served from councilof.ai:

| artefact | content | live probe (2026-11-19) |
|---|---|---|
| `public/oasf/ai.councilof.gspc.oasf.json` | `ai.councilof/gspc` v**1.4.4**, `schema_version` **1.1.0** (OASF record object; skills 71001/71002, domains, `core/evaluation` module) | HTTP 200, 5,017 B; raw sha256 `95893d1bd718ebd5749f9083…`; attestation pins sha256(JCS) `ea7bf4174c29ab95…` |
| `public/oasf/ai.councilof.measurement-agent.oasf.json` | `ai.councilof/measurement-agent` v**1.6.0**, OASF 1.1.0 | HTTP 200, 28,176 B |
| `public/oasf/attestation.json` | **One combined** detached Ed25519 attestation (`csoai.oasf-record-attestation/0.1`) under `did:web:csoai.org#board-attestation-1`, signed_at 2026-09-30T17:17:53Z, covering both records | HTTP 200 |

Findings:

1. **README inaccuracy**: `distribution/agntcy/README.md` says "each record has `<name>.attestation.json` beside it". Reality: a single combined `public/oasf/attestation.json`; `GET https://councilof.ai/oasf/ai.councilof.gspc.attestation.json` → **404**.
2. **Stale attestation (concrete)**: the attestation payload pins `ai.councilof/measurement-agent` at **1.4.0**, but the served record is **1.6.0**. `scripts/harness-x/sign-oasf.mjs` `verifyAttestation()` returns `{state: "STALE", detail: "re-sign: digest differs for …"}` on version/digest drift, so `check.mjs`'s attestation check is not passing on master today. Re-signing requires the pod caller token (POST to the signing service) → owner step. Do **not** publish to ADS before re-signing.
3. Nothing has ever been pushed to ADS: no ADS identity, no CID, no announcement exists for either record.

## (b) Publication path decision: **no free, no-account path to public discovery exists today**

Evidence:

1. **Docs** ([quickstart](https://dir.agntcy.org/latest/dir/dir-quickstart/), [choosing a setup](https://dir.agntcy.org/latest/dir/dir-choosing-a-setup/), [local deployment](https://dir.agntcy.org/latest/dir/dir-deployment-local/)): the only documented deployment is **self-hosted**. `dirctl push` stores locally (CID); `dirctl routing publish` announces to a DHT that a node joins **only** via `server.routing.bootstrap_peers`, which the docs say is "provided by the remote Directory operator" — no public bootstrap list is published. The quickstart itself notes network discovery "returns nothing in a single-node setup". There is no hosted, signup-open directory in the docs.
2. **Hosted AGNTCY directory** `ads.outshift.io` (OIDC IdP `idp.ads.outshift.io`; both hosts named in the official [agntcy/dir discussion #455](https://github.com/agntcy/dir/discussions/455), not in docs): probed 2026-11-19 — `GET /` → **401**; unauthenticated `dirctl v1.9.1 search --server-addr ads.outshift.io:443` → gateway error (server replies HTTP/1.1 to plain gRPC; unusable without auth); `dirctl auth status` → "Not authenticated". Independent third parties in #455 report: OIDC login succeeds but **push and search return PermissionDenied** pending a granted publish role; the testbed's initial phase is **technical steering committee members only**; joining federation = fork `agntcy/dir`, add SPIRE trust bundle + federation config, **merged PR**.
3. **No public DHT query surface**: `dirctl routing search` outside a configured node errors with "server_address is required" — the DHT cannot be queried read-only by an outsider.

Closest free-ish option (and why it is not "publication"): the documented **public-store node** — push records as OCI artifacts to **your own** public registry (e.g. GHCR); anyone with `dirctl sync create --registry` can pull them. This is stored-only, pull-on-demand: **no announcements, no network discovery**. GHCR under csoai-org is org-owned infrastructure, so it remains an outward send → owner-gated. Label it "stored (CID …), pull-on-demand from ghcr.io/…" — never "discoverable".

## (c) Owner actions, in order (all gated; nothing below has been run)

0. **Re-sign the stale attestation** before any ADS push: `node scripts/harness-x/sign-oasf.mjs --token-file <pod caller token>`; then `node scripts/harness-x/sign-oasf.mjs --verify` must print `VALID`, and `scripts/harness-x/check.mjs` must be green.
1. **Pick topology**:
   - (A) Hosted: request a publish grant for the owner principal on `ads.outshift.io` (TSC / #455 thread). Free of charge, but **account+grant gated**.
   - (B) Federation: fork `agntcy/dir`, add SPIRE trust bundle + federation config, submit PR, wait for merge; TSC-phase gated.
   - (C) Public-store only (no discovery, ever): push OCI artifacts to GHCR under csoai-org.
2. Install CLI: `brew tap agntcy/dir https://github.com/agntcy/dir && brew trust agntcy/dir && brew install dirctl` (v1.9.1 probed), then `dirctl init --yes`.
3. (A only) `dirctl auth login` (browser PKCE via idp.ads.outshift.io) **after** the grant exists.

## (d) Exact commands awaiting owner approval (none run by the agent)

Stage 1 — local store only (no outward send; still **stored-only**, not discovery):
```bash
dirctl daemon start
CID=$(dirctl push public/oasf/ai.councilof.gspc.oasf.json --output raw)
dirctl verify "$CID"                            # sigstore check of our own push
dirctl search --annotation 'owner:*'            # LOCAL index
dirctl routing list --skill "agent_evaluation"  # LOCAL index
```
Stage 2 — announce (only after (c)1-A or (c)1-B exists):
```bash
dirctl sign "$CID"            # ADS signing = identity that pushes, at push time
dirctl routing publish "$CID" # announce CID+skills on the DHT; TTL — republish periodically
```
Stage 3 — repeat with `public/oasf/ai.councilof.measurement-agent.oasf.json`.

## (e) What readback would prove discovery

Does **not** prove: `push` success (store-only), local `routing list`/`search`, the localhost:8889 dashboard, or our own pull.

Proves discovery — from a node **we do not operate**, on the same network/federation:
1. `dirctl routing search --skill "agent_evaluation"` returns the gspc CID;
2. `dirctl pull "$CID" --output json` returns record bytes;
3. equality holds: `name == ai.councilof/gspc`, `version == 1.4.4`, sha256(JCS(bytes)) == `ea7bf4174c29ab95…`, and the detached Ed25519 attestation verifies under `did:web:csoai.org#board-attestation-1`;
4. only after 1–3 may copy say "discoverable in ADS"; before that, at most "stored (CID …)". No "connected"/"published" language for stored-only records.

## Statuses recorded 2026-11-19

| target | result |
|---|---|
| `GET councilof.ai/oasf/ai.councilof.gspc.oasf.json` | 200 (5,017 B) |
| `GET councilof.ai/oasf/ai.councilof.measurement-agent.oasf.json` | 200 (28,176 B) |
| `GET councilof.ai/oasf/attestation.json` | 200 — payload pins measurement-agent **1.4.0** vs served **1.6.0** |
| `GET councilof.ai/oasf/ai.councilof.gspc.attestation.json` | 404 |
| `GET https://ads.outshift.io/` | 401 |
| `dirctl v1.9.1 search --server-addr ads.outshift.io:443` | gateway error (HTTP/1.1 reply to unauth gRPC) |
| `dirctl auth status` (ads.outshift.io) | "Not authenticated" |
| `dirctl routing search` (no node configured) | error: server_address required |
| dir.agntcy.org docs (quickstart/setup/local/OIDC/routing) | self-hosted only; bootstrap peers operator-provided; no open hosted signup |
