# Rekor v2 + SCITT OpenTimestamps Bitcoin — GHA path design

**As-of:** 2026-09-01 · **Desk:** Infra · **Status:** design leftover (docs only)
**Owner lock:** CEO named this PR. GHA path only. No wrangler. No Cloud Agents. Board 22·15·7 untouched.

## Locks (never contradict)

- **Ed25519 stays CSOAI authority / keystone.** Signing identity remains `did:web:csoai.org` methods (card / board / site). Rekor / OTS / SCITT are *witnesses*, not new authorities.
- **Never put `BOARD_SIGN_KEY` (or `BOARD_SIGN_KEY_PKCS8_B64`) in Cloudflare Workers or Cursor.** Key lives only on the keystone path (GHA secret for `public-root` today; offline keystone when that lands). Never print the key. Never ship it to a Worker env.
- **No live Rekor submit until the keystone path exists.** This doc designs the GHA workflow shape only. Do not register inclusion proofs against production Rekor until CEO names the keystone ship.
- **Root publisher is GHA.** Existing `.github/workflows/public-root.yml` (hourly `7 * * * *`) is the one writer for `public/root.json` + cards + proofs. HF is a parallel record, not a live pipe. Do not claim HF↔pod wiring.
- **No wrangler. No clone for this leftover. Board 22·15·7 untouched.** Never stamp MEASURED. Never certify.

## What this adds (witness hygiene on roots)

| Layer | Role | Cadence | Authority? |
|---|---|---|---|
| Ed25519 (existing) | CSOAI statement signature on root / cards | on each `public-root` publish | **YES — keystone** |
| Rekor v2 inclusion proof | transparency-log receipt that the signed statement was registered | after successful public-root commit (fail-open until keystone named) | No — witness |
| SCITT (RFC 9943) envelope | same payload as existing statement, COSE-shaped for SCRAPI | same bytes as Ed25519 payload; receipt separate | No — envelope |
| OpenTimestamps → Bitcoin | calendar / Bitcoin block witness of the merkle root digest | hourly (align with `public-root` cron) | No — witness |

Thesis (from `docs/RECEIPT_INTEROP_2026-08-23.md` + `docs/operations/SCITT_RFC9943_PROFILE_2026-08-21.md`): **measurement content is ours; the envelope is standard; witnesses are additive.**

## GHA path design (not implemented in this PR)

### A. Extend `public-root` after commit (design only)

1. `scripts/publish_public_root.py` continues to fail closed if `BOARD_SIGN_KEY_PKCS8_B64` is missing (exit 3). Never publish unsigned NEW leaves.
2. After a successful commit of `public/root.json` + proofs, a **new job** (or step, still on `ubuntu-latest`, still master-only) would:
   - Read the committed root merkle (public) and the Ed25519 signature already published.
   - Build a Rekor v2 hashedrekord / DSSE entry from the **already-signed** statement (no re-sign; no key export).
   - **Gate:** `if: false` / workflow input `enable_rekor: false` until CEO names keystone live submit.
   - Persist the inclusion proof under `public/proofs/rekor/` (JSON receipt + uuid + logIndex) when enabled.
3. OTS hourly: take `sha256(public/root.json)` (or the published merkle hex), stamp via `ots stamp`, upgrade later via `ots upgrade`. Store `.ots` under `public/proofs/ots/`. Calendar servers are public; Bitcoin confirmation is best-effort and may lag — never block the board publish on Bitcoin confirmation.
4. Watcher (`public-root-watcher.yml`) stays a **reader**. Optionally verify Rekor inclusion + OTS pending/upgraded status on the three hosts; never a second writer.

### B. Secret inventory (names only)

| Secret | Where | Used for | Forbidden |
|---|---|---|---|
| `BOARD_SIGN_KEY_PKCS8_B64` | GitHub Actions secret on `CSOAI-ORG/councilof-ai` | Ed25519 sign in `public-root` | Workers, Cursor, laptop wrangler, chat |
| (future) none for Rekor | public submit of already-signed statement | Rekor v2 inclusion | do not add a Rekor API key that can sign |
| (future) none for OTS | public calendars | OpenTimestamps | do not add a paid relay that holds keys |

### C. Explicit non-goals

- No Workers that hold or see `BOARD_SIGN_KEY`.
- No live Rekor submit in this leftover.
- No board shape change (22·15·7). No MEASURED stamps. No certify language.
- No wrangler pages deploy. No Cloud Agent for this docs PR.
- No second mega-repo. Sync `/workspace/fire-playbook-2026-09-01/03-rekor-v2-ots-bitcoin.md` later if it was missing at open time.

## Acceptance for a future NAMED implement PR

1. Docs (this file) merged.
2. Keystone path named by CEO (where offline / GHA key lives, rotation pointer in KEY_GOVERNANCE).
3. Workflow behind an explicit enable flag; default off.
4. Rekor receipt verifies with public Rekor API against the published Ed25519 statement.
5. OTS file upgrades to Bitcoin without rewriting `root.json`.
6. Watcher reports OK / DRIFT including witness presence; board GET unchanged.

## Related

- `.github/workflows/public-root.yml` — one writer
- `.github/workflows/public-root-watcher.yml` — three-host reader
- `docs/KEY_GOVERNANCE_2026-08-23.md`
- `docs/RECEIPT_INTEROP_2026-08-23.md`
- `docs/operations/SCITT_RFC9943_PROFILE_2026-08-21.md`
- `public/.well-known/scitt.json`