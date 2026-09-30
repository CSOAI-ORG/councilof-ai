/** GET /x402/<door-or-host>/index.json — the machine-readable twin of the page; same loader, same withholding rules. */
import { type Ctx, param, serve } from "../../_lib/reach/core";
import { loadX402, x402Json } from "../../_lib/reach/x402";

export const onRequest = async (ctx: Ctx & { next?: () => Promise<Response> }): Promise<Response> => {
  if (param(ctx, "key") === "index.json" && ctx.next) return ctx.next();
  return serve(ctx, "json", async () => ({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(x402Json(await loadX402(ctx, param(ctx, "key"))), null, 1) + "\n", lastModified: null }));
};
