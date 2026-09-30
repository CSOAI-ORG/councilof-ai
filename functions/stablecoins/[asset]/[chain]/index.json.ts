/** GET /stablecoins/<asset>/<chain>/index.json — the machine-readable twin of the page; same loader, same withholding rules. */
import { type Ctx, param, serve } from "../../../_lib/reach/core";
import { loadDeployment, deploymentJson } from "../../../_lib/reach/stablecoins";

export const onRequest = async (ctx: Ctx & { next?: () => Promise<Response> }): Promise<Response> => {
  if (param(ctx, "asset") === "deployments" && ctx.next) return ctx.next();
  return serve(ctx, "json", async () => ({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(deploymentJson(await loadDeployment(ctx, param(ctx, "asset"), param(ctx, "chain"))), null, 1) + "\n", lastModified: null }));
};
