# components/evidence — per-record evidence package (ported from csoai-org-v2)

Donor: `~/clawd/csoai-org-v2/src/app/evidence/page.tsx` (CONSOLIDATION.md surface #3).
Ported 2026-08-02. Theme: master wing (dark-emerald on `#03110b`).

## Files

| Component | Donor source | Wants route | What it is |
|---|---|---|---|
| `EvidencePackage.tsx` | `src/app/evidence/page.tsx` | `/evidence-package` | Enter a cert_id -> fetch the signed record live from the attestation API -> signature, chain position, plain-English gloss. Plus the chain explainer, example records, bulk-verify API docs. |

Route note: master `/evidence` is already taken by `pages/EvidenceHub.tsx` (compliance
evidence-collection demo — a different product), so this component asks for `/evidence-package`.

## Changes from the donor

- **Donor bug fixed:** the donor's verify form POSTed the cert_id to `/api/subscribe` (a
  newsletter endpoint). The port fetches `/verify/<cert_id>` on
  `https://meok-attestation-api.vercel.app` — the endpoint the donor page itself documents
  further down. Fetch has an 8s timeout and three honest outcomes: record / not_found /
  unreachable (a failed fetch is reported as "verification did not complete", never as
  "invalid").
- **"Measured results" block NOT ported** — those figures (GovComp-Bench 1.000/32, frontier
  0.489, 3 real primaries, refusal 0.0% FP, 15/15 citations) were already harvested into the
  master's `/layer0` in P3 (commit `fefb1d0`). A "Where the measured numbers live" strip links
  to `/layer0`, `/gspc-verify`, `/provenance-finding` instead of duplicating.
- `dangerouslySetInnerHTML` legacy markup + inline `<style>` block replaced with ordinary
  React/Tailwind.
- This is also where the donor's "live-worker clients" jewel lands: the donor's
  `src/lib/attestation.ts` was a Next.js server-side fetcher (not portable to a Vite SPA); the
  one call this page needs is reimplemented client-side here. The master's sovereign-brain
  client (`the measurement API`) is untouched.

## Wiring

See `client/WIRING-PATCH.md`. After wiring, add `/evidence-package` to
`client/src/lib/ai-surfaces.ts` as `rule_based` (display of fetched records; no inference).
