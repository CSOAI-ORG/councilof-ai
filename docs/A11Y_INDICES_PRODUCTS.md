# Accessibility pass — indices / products (NEXT_300 #219)

Checklist for `/indices`, `/indices/:slug`, `/products`, `/powered-by`:

- [x] Page titles set in `useEffect`
- [x] Meta descriptions via `setMetaDescription` / `setOgMeta`
- [x] Status communicated in text + pill (not color alone)
- [x] FaqBlock on `/indices` (keyboard-focusable headings)
- [x] NrsroDisclaimer as `role="note"`
- [ ] Full axe CI suite (open — extend e2e when bandwidth)
- [x] Mobile smoke 375×812 in `indices-products-smoke.spec.ts`

No decorative-only icon buttons without labels on these honesty surfaces.
