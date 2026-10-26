/**
 * GET /watchdog — the Public Watchdog journey (client/src/pages/Watchdog.tsx), 14 Oct 2026.
 * It used to 308 the retired earnings door onto Council OS; it now hands the request to the
 * static SPA so the journey and its stable claim links (?registry=&claim=) are served here.
 * /watchdog/help-protect-humanity and /watchdog/incident keep their own 308s.
 */
export function onRequest(context: { next: () => Promise<Response> }) {
  return context.next();
}
