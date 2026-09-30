/** GET /stablecoins/<asset>/<chain>/ — rendered at request time; see functions/_lib/reach/stablecoins.ts. */
import { type Ctx, param, serve, slashRedirect } from "../../../_lib/reach/core";
import { loadDeployment, renderDeployment } from "../../../_lib/reach/stablecoins";

export const onRequest = async (ctx: Ctx & { next?: () => Promise<Response> }): Promise<Response> => {
  if (param(ctx, "asset") === "deployments" && ctx.next) return ctx.next();
  const bare = slashRedirect(ctx.request);
  if (bare) return bare;
  return serve(ctx, "html", async () => renderDeployment(await loadDeployment(ctx, param(ctx, "asset"), param(ctx, "chain"))));
};
