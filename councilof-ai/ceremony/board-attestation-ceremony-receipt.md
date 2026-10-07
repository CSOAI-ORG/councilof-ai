# Board Attestation Key — Ceremony Receipt (RECONSTRUCTED FROM RUNTIME EVIDENCE)

**Receipt compiled:** 2026-10-07 · **TUI 5 — Signing, Roots and Anchoring**
**Classification:** DOCUMENTATION of a ceremony that already ran — NOT a new key
generation, NOT a certification. Every fact below traces to a named artifact.
Facts that cannot be established from artifacts are marked `UNVERIFIED` — they
are not filled in with plausible text.

---

## 1. The ceremony, as executed

| Field | Value | Source |
|---|---|---|
| Ceremony mechanism | `.github/workflows/board-key-setup.yml` — "Board attestation key — one-time setup" | workflow file (master) |
| Run | `32266562512` | `gh api .../actions/runs/32266562512` |
| Executed at | `2026-08-19T14:51:53Z` (started same minute) | run metadata |
| Event | `workflow_dispatch` | run metadata |
| Triggering actor | `CSOAI-ORG` (owner account, dispatched on `master`) | run metadata `triggering_actor` |
| Conclusion | `success` | run metadata |
| Re-runnable? | Yes — the workflow regenerates and rotates (documented in its header). **Only one run exists** ⇒ no rotation since. | `gh run list --workflow=board-key-setup.yml` → 1 row |

## 2. What the ceremony did (verbatim mechanics from the workflow)

1. `node -e` generated an **Ed25519** keypair via `crypto.generateKeyPairSync("ed25519")`
   **inside the GitHub Actions runner**.
2. Private half exported as PKCS8/DER → base64 → `/tmp/priv.b64`.
3. Private half installed **via stdin** to a **Cloudflare Pages** secret:
   `cat /tmp/priv.b64 | npx wrangler@3 pages secret put BOARD_SIGN_KEY_PKCS8_B64 --project-name=councilof-ai`.
4. Public half (JWK `x`, base64url, last 32 bytes of SPKI) written **only** to the
   run's step summary, with the instruction: *add to
   `public/.well-known/did.json` as `#board-attestation-1`, then merge.*
5. `/tmp/priv.b64` removed in the same step. The workflow header states the
   contract: *"The private key is born and dies inside this runner + Cloudflare;
   it is never committed, never logged, never leaves."*

## 3. Custody state today

| Item | State | Evidence |
|---|---|---|
| Private key location | Cloudflare Pages project `councilof-ai`, secret `BOARD_SIGN_KEY_PKCS8_B64` | step 3 above; secret installed by that run |
| In GitHub repo secrets? | **No** | `gh secret list --repo CSOAI-ORG/councilof-ai` (2026-10-07): 17 secrets, none named `BOARD_SIGN_*` or `EAS_*` before today's `EAS_ATTESTER_PRIVATE_KEY` |
| In workflow env? | `public-root.yml` *references* `${{ secrets.BOARD_SIGN_KEY_PKCS8_B64 }}` — with the repo secret absent this resolves **empty**, so the workflow's local-PKCS8 path is dormant and the **OIDC relay is the live signing path** | `public-root.yml` env block + secret inventory |
| Public key published | `did:web:csoai.org#board-attestation-1`, JWK x = `k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA` (hex `9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170`) | `https://csoai.org/.well-known/did.json`, fetched 2026-10-07 |
| Private key in this repo / chat / logs / browser? | **No** (verified by TUI-5 pre-push private-key gate + `grep` of added lines) | pre-push gates, this branch |

## 4. Signing relay contract (`functions/api/board-sign.ts`)

The ceremony's key is used only behind this relay. Checks, in order:
1. Token audience = `https://councilof.ai/api/board-sign`; `payload.repository`
   must equal this repository.
2. **Workflow allowlist (substring match):** `["public-root", "hf-fin-shells",
   "hf-inference-mill", "auto-eat-sign"]` — a workflow whose `job_workflow_ref`
   contains none of these is rejected (`throw new Error("workflow")`).
3. Token `exp` not stale (>30 s past).
4. Signature verified against the issuer's live JWKS.
5. Alternative caller path: a **pod bearer token** (owner ruling 2026-09-22),
   with a response/`payload_sha256` equality check so the relay's answer can be
   re-derived by the caller.
6. Fail-closed everywhere: no PKCS8, no OIDC, no pod-token → the caller cannot
   obtain a signature (`"no PKCS8, no OIDC and no pod-token board-sign available"`).

Scripts that use this route structurally **cannot laptop-sign**:
`sign_financial_runs.sign_via_oidc()` raises unless the GHA OIDC env is present;
`publish_public_root.py` re-exports the same primitives from `lib/estate_sign`.

## 5. What this receipt does NOT establish

| Item | State | How to close it |
|---|---|---|
| That run `32266562512`'s step-summary public key equals today's DID key | `UNVERIFIED` — Actions step summaries are not retrievable via the API | Owner opens `https://github.com/CSOAI-ORG/councilof-ai/actions/runs/32266562512` and compares the summary's `publicKeyJwk.x` with the DID value in §3 (one page view) |
| Whether Cloudflare has logged/rotated the secret since | `UNVERIFIED` — no CF audit export pulled | `wrangler pages secret list --project-name=councilof-ai` shows **presence/name only** (values are unreadable by design) |
| Human witness / who watched the run | `MISSING` — not recorded anywhere in artifacts | Owner's recollection; record here if ever known |
| Secrets of the three en-dash GitHub environments (`Preview – councilof-ai-src` etc.) | `NOT_CHECKED` — the simple listing command rejected their names (argument splitting); repo-level listing is done and clean | `gh api "repos/CSOAI-ORG/councilof-ai/environments/<exact name>/secrets"` with quoted name |

---

## 6. Related keys (context only — not part of this ceremony)

The DID document publishes **5** verification methods:
`site-release-1`, `estate-chain-1`, `board-attestation-1` (this receipt),
`card-attestation-1` (the 335-card corpus key), `gspc-board-22axis-2026`.
Each has its own custody story; none of their private material appears in any
repository, artifact, log or browser storage checked by TUI 5.

*Measurement, not certification. Receipt reconstructed 2026-10-07 from run
metadata, workflow bytes and live endpoints; no ceremony was performed today.*
