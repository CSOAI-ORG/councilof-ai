# Item 1 receipt — attestation defect / served-bytes verification — 2026-09-20

Audit work order item 1: "Resolve the active GSPC attestation defect through its
existing isolated repair path once GitHub Actions is restored; then verify the
served bytes." Read-only diagnosis only; nothing mutated, nothing triggered.

## Authenticated GitHub diagnosis (gh api, token account CSOAI-ORG, scopes gist/read:org/repo/workflow; retrieved 2026-09-20T02:46:53Z)

| Check | Result | Interpretation |
|---|---|---|
| `GET /orgs/CSOAI-ORG` | 404 "Not Found" + "needs the admin:org scope" | NOT determinate for deletion: the token lacks `admin:org`, and GitHub intentionally 404s resources the credential cannot see. The anonymous-404 premise stays FALSE/NOT DETERMINATE, now also under an authenticated read. |
| `GET /repos/CSOAI-ORG/councilof-ai` | 200: public, default_branch master, `pushed_at` 2026-09-20T02:45:32Z | The organisation's flagship repo EXISTS and was pushed one minute before readback. Any "GitHub is gone" claim is contradicted. |
| `GET .../actions/permissions` | `{"enabled":true,"allowed_actions":"all"}` | Actions are ENABLED at API level. The historical "GHA dead (ticket #4720908)" state is not the current state. |
| Recent runs, all workflows | pr-gates ×5 `failure`, 2026-09-15 | Failures present; not yet attributed to attestation. |
| Runs: `board-key-setup`, `auto-eat-sign`, `card-root`, `csoai-verify-selftest` | **zero runs, ever** | The "Board attestation key — one-time setup" workflow has never executed. Candidate context for the audit's "attestation defect", but the plan document naming the defect and its "isolated repair path" is NOT in this repo, so the named defect is recorded here as UNIDENTIFIED, not guessed. |
| Runs: `deploy` | last success 2026-09-14 (workflow_dispatch) | Deployment path has worked recently via dispatch. |

## Served-bytes verification (retrieved 2026-09-20T02:45:58Z)

- `GET https://councilof.ai/root.json` → sha256 `dedb49d05cf8a37a65a5eb19332881d804240ef741171edf153cbe053b1368e4`, 24,454 bytes, `as_of` 2026-09-15T07:13:43Z, `card_count` 305.
- **Byte-identical** to the committed `public/interop/root-witness-latest.json` `artifact` block — no drift at readback time.
- OTS: proof `public/interop/root-dedb49d0.json.ots` binds this exact digest and carries `BitcoinBlockHeaderAttestation` at blocks 967093/967098/967150; block 967093's 80-byte header byte-identical under independent blockstream readback (transparency-augmentation bundle, `ots/ots-blockheader-readback.txt`). → the CURRENTLY SERVED bytes are the Bitcoin-anchored bytes.
- Rekor: entry uuid `108e9186…f6c04` binds the 274-byte signed preimage of this root (sha256 `b6220613…`); log_identity/SET/inclusion/checkpoint all VALID offline; tree position = inclusionProof.logIndex 2719646948 (API/virtual index 2841551210 differs by design — canonicalised duplicates).
- Ed25519 envelope signature verified against `did:web:csoai.org#board-attestation-1` (per HOW-TO-VERIFY-ROOT.md §1; re-verified in the transparency bundle).

**Consequence for the audit's "Required evidence" list: "Exact current-root Rekor/OTS proof binding" — PRESENT as of 2026-09-20T02:46Z.** Binding is exact-byte for OTS (served bytes) and exact-preimage for Rekor; the distinction is documented, not smoothed over.

## Honest residual gap

The audit item's named defect and its "existing isolated repair path" come from the
plan document (`CSOAI_GITHUB_EXIT_SUPER_HYBRID_PLAN_2026-09-20.md`), which is not in
this repository. The precondition "once GitHub Actions is restored" is met at API
level (enabled:true), but the specific repair action is NOT EXECUTED because the
defect is unidentified from in-repo evidence. No workflow was triggered; no secret,
key, or deployment was touched.
