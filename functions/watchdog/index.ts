/**
 * GET /watchdog/ — slash variant of the Public Watchdog journey. Served by the SPA; no redirect.
 */
export function onRequest(context: { next: () => Promise<Response> }) {
  return context.next();
}
