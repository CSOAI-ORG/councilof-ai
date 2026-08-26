# Accessibility pass — indices / products (NEXT_300 #219)

Checklist for `/indices`, `/indices/:slug`, `/products`, `/powered-by`:

- [x] Page titles set in `useEffect`
- [x] Meta descriptions via `setMetaDescription` / `setOgMeta`
- [x] Status communicated in text + pill (not color alone)
- [x] Index hub links carry `aria-label` with title + status
- [x] Products catalog links carry `aria-label` with name + register
- [x] FaqBlock on `/indices` (keyboard-focusable headings)
- [x] NrsroDisclaimer as `role="note"`
- [x] Full axe CI suite — `e2e/tests/indices-products-axe.spec.ts` (serious/critical fail; color-contrast-only logged)
- [x] Mobile smoke 375×812 in `indices-products-smoke.spec.ts`

No decorative-only icon buttons without labels on these honesty surfaces.

```bash
BASE_URL=http://127.0.0.1:43125 npx playwright test --config e2e/playwright.config.ts e2e/tests/indices-products-axe.spec.ts --project=chromium
```
