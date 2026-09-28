/**
 * HEAD for an x402 door: the status and headers its GET would answer, with no body.
 *
 * WHY. Pages dispatches HEAD only to an `onRequestHead` export; the doors exported GET and POST, so
 * HEAD fell through to the static-asset 404 on every door except /api/proof (28 Sep 2026). Uptime
 * monitors and index health checks that HEAD a resource then recorded a live 402 door as missing.
 *
 * PAYMENT IS NEVER TOUCHED. The GET handler is called with the payment headers REMOVED, so a HEAD
 * can only ever take the unpaid branch: it issues the same 402 challenge (PAYMENT-REQUIRED header
 * included) and cannot verify, settle or count a payment, even when a client sends X-PAYMENT on a
 * HEAD. No door's payment logic changes; this wrapper only decides which request reaches it.
 */
export const PAYMENT_REQUEST_HEADERS = ["x-payment", "payment-signature"] as const;

export function headFromGet<Ctx extends { request: Request }>(
  get: (context: Ctx) => Response | Promise<Response>,
): (context: Ctx) => Promise<Response> {
  return async (context) => {
    const headers = new Headers(context.request.headers);
    for (const h of PAYMENT_REQUEST_HEADERS) headers.delete(h);
    const request = new Request(context.request.url, { method: "GET", headers });
    const res = await get({ ...context, request } as Ctx);
    return new Response(null, { status: res.status, statusText: res.statusText, headers: res.headers });
  };
}
