# CI/CD GATE SPEC v0.1 — signed measurement card as a pipeline gate (EXP 125)

**Doc ID:** `csoai-ci-gate-spec-v0.1` · **Revision:** 2026-08-24
**Purpose:** verify-or-fail semantics for a signed measurement card/artifact in any CI/CD build
path. The moment measurement enters the build path, adoption becomes dependency by design.

## The gate rule (binding)

A build step **fails closed** if the signed artifact does not verify:

1. **Recompute the canonical body** — sorted keys, `separators=(",", ":")`, `ensure_ascii=False`
   (the estate canonical form). Exclude integrity fields (`content_id`, `signature`, `sha256`, `sig`).
2. **Derive content_id** — `sha256(canonical)`.
3. **Verify Ed25519** — signature over the content_id bytes, against the **embedded pubkey**
   (and, where a trust anchor is available, against the published `did:web:csoai.org` key).
4. **Compare** — recomputed content_id MUST equal the stated content_id.

**Fail-closed:** any of (missing artifact, missing signature, pubkey mismatch, content_id mismatch,
Ed25519 failure) → **exit non-zero** → the pipeline gate blocks.

## Properties

- **Offline-capable**: the reference Action runs entirely on the runner (`python3`, `cryptography`);
  no network, no phone-home, no telemetry.
- **No score assertion**: the gate verifies provenance; it never asserts a score/rank. A card that
  verifies proves the measurement body is the signed one — not that the score is "good".
- **Portable**: same spec for GitHub Actions (reference: `.github/workflows/verify-card.yml`),
  GitLab CI, Jenkins (templates follow the same three steps).

## Usage

```yaml
- uses: CSOAI-ORG/verify-card@v0.1
  with:
    artifact: public/signals/gov.signed.json   # relative to repo root
    fail_on_mismatch: "true"                   # default: fail-closed
```

## Get the reference

- GitHub Action: `github.com/CSOAI-ORG/verify-card` (or inline the three-step script; the spec is
  the contract, the script is an example).
- A stranger can verify the reference gate passes on a good fixture and fails on a tampered one
  (the CI demonstration).
