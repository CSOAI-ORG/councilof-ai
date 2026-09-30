/** GET /agent-cards/<host>/index.json — the machine-readable twin of the page; same loader, same withholding rules. */
import { type Ctx, param, serve } from "../../_lib/reach/core";
import { loadCardHost, cardJson } from "../../_lib/reach/agentCards";

export const onRequest = async (ctx: Ctx & { next?: () => Promise<Response> }): Promise<Response> => {
  if (param(ctx, "host") === "index.json" && ctx.next) return ctx.next();
  return serve(ctx, "json", async () => ({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(cardJson(await loadCardHost(ctx, param(ctx, "host"))), null, 1) + "\n", lastModified: null }));
};
