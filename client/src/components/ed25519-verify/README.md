# components/ed25519-verify — offline Ed25519 verifier (ported from csoai-org-v2)

Donor: `~/clawd/csoai-org-v2/src/app/verify/VerifyClient.tsx` (CONSOLIDATION.md surface #3:
"real Ed25519 verify"). Ported 2026-08-02. Theme: master wing (dark-emerald on `#03110b`).

## Files

| Component | Donor source | Wants route | What it is |
|---|---|---|---|
| `Ed25519Verify.tsx` | `src/app/verify/VerifyClient.tsx` | `/ed25519-verify` | Paste a signed report `{alg,pub,sig,body}` -> WebCrypto verifies the Ed25519 signature over the canonical JSON of `body`. Zero network involvement — the "don't trust us, verify" primitive. |

## Why this is not redundant with the master's existing verify surfaces

- `/system-card` — verifies signed System Cards against the live backend (`os.meok.ai`).
- `/gspc-verify` — recomputes the GSPC hash chain in the browser (chain scheme, not a pasted
  Ed25519 manifest).
- `/verify-certificate` — course attestation records via tRPC.
- **This one** — verifies ANY pasted `{alg,pub,sig,body}` Ed25519 manifest fully offline.
  Distinct tool, distinct input format.

## Changes from the donor

- The `?id=<report_id>` auto-load fetched `/api/reports/[id]` — a Next API route that does not
  exist in the master. Removed. The `?report=<base64>` hand-off (pure client-side) is kept.
- Result glyphs (✓/✗) replaced with VALID / INVALID text badges (no-emoji register).
- `canonical(o: any)` tightened to `unknown` with a record cast.
- Verification math is byte-for-byte the donor's: SPKI-DER key import, canonical JSON
  (sorted keys, recursive), `crypto.subtle.verify("Ed25519", ...)`.

## Wiring

See `client/WIRING-PATCH.md`. After wiring, add `/ed25519-verify` to
`client/src/lib/ai-surfaces.ts` as `rule_based`.
