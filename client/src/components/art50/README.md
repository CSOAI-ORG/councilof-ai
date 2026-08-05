# components/art50 — Article 50 suite (ported from csoai-org-v2)

Donor: `~/clawd/csoai-org-v2` (CONSOLIDATION.md surface #3, "harvest jewels then retire").
Ported 2026-08-02. Theme: master wing (dark-emerald on `#03110b`), same register as
`components/gspc/` and the already-ported `pages/ProvenanceFinding.tsx`.

## Files

| Component | Donor source | Wants route | What it is |
|---|---|---|---|
| `Article50Calculator.tsx` | `src/app/article-50-calculator/Article50CalculatorClient.tsx` | `/article-50-calculator` | Interactive exposure estimator: deadline clocks + turnover slider -> max-fine arithmetic. Pure client-side, no backend. |
| `Article50Kit.tsx` | `src/app/article-50-kit/{page,Article50KitClient}.tsx` | `/article-50-kit` | Product page for the £999 kit, wired to the real `meok-watermark-attest-mcp` (PyPI, 9 tools). JSON-LD Product/SoftwareApplication/FAQ kept. |
| `Article50Explained.tsx` | `src/app/article-50-explained/page.tsx` | `/article-50-explained` | Plain-English explainer + obligations table + key dates + checklist. Article/FAQ JSON-LD kept (GEO/AEO asset). |

## Changes from the donor (all three)

- Next.js (`next/link`, `Metadata`, `"use client"`) -> wouter `Link` + `document.title` in
  `useEffect` (Vite SPA convention, cf. `pages/GSPCVerify.tsx`).
- Dark slate theme -> master dark-emerald wing.
- Kit: the donor posted to `/api/checkout` (a Next API route that does not exist in the master)
  with a Stripe-link fallback; the port uses the canonical Stripe payment links directly.
  NOTE: master `/pricing` uses `trpc.stripe.createCheckoutSession` instead — a human should
  decide whether the kit's direct links or a tRPC session is the canonical checkout path.
- Kit copy: "bespoke cert + 1-on-1 with the council" -> "a signed attestation of the result +
  a 1-on-1 review session" (attestation register).
- Explained: donor CTAs `/high-risk-classifier` and `/framework-crosswalk` (donor-only routes)
  -> master equivalents `/assess` and `/crosswalk`; added a third CTA to the calculator.
- Deadline clocks degrade honestly to 0 after the date passes (Art 50 applied 2 Aug 2026).

## Not ported from the donor's Art 50 neighbourhood

- `src/app/ai-transparency` — master's `/ai-transparency` (v2.0.0 self-conformance record with
  published correction) is strictly superior. Skip.

## Wiring

See `client/WIRING-PATCH.md`. Note: `/article-50-kit` already has a title entry in
`App.tsx`'s route-title map but no `<Route>` — the patch completes it. After wiring, add the
three routes to `client/src/lib/ai-surfaces.ts` as `rule_based` so the Art 50 guard covers them.
