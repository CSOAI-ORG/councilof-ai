/** GET /agent-cards/<host>/ — rendered at request time; see functions/_lib/reach/agentCards.ts. */
import { type Ctx, param, serve, slashRedirect } from "../../_lib/reach/core";
import { loadCardHost, renderCard } from "../../_lib/reach/agentCards";

export const onRequest = async (ctx: Ctx & { next?: () => Promise<Response> }): Promise<Response> => {
  if (param(ctx, "host") === "index.json" && ctx.next) return ctx.next();
  const bare = slashRedirect(ctx.request);
  if (bare) return bare;
  return serve(ctx, "html", async () => renderCard(await loadCardHost(ctx, param(ctx, "host"))));
};
