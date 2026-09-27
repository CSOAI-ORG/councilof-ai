/** GET /x402/<door-or-host>/ — rendered at request time; see functions/_lib/reach/x402.ts. */
import { type Ctx, param, serve, slashRedirect } from "../../_lib/reach/core";
import { loadX402, renderX402 } from "../../_lib/reach/x402";

export const onRequest = async (ctx: Ctx & { next?: () => Promise<Response> }): Promise<Response> => {
  if (param(ctx, "key") === "index.json" && ctx.next) return ctx.next();
  const bare = slashRedirect(ctx.request);
  if (bare) return bare;
  return serve(ctx, "html", async () => renderX402(await loadX402(ctx, param(ctx, "key"))));
};
