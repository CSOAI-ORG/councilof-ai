/** GET /mcp-servers/<host>/ — rendered at request time; see functions/_lib/reach/mcp.ts. */
import { type Ctx, param, serve, slashRedirect } from "../../_lib/reach/core";
import { loadMcpHost, renderMcp } from "../../_lib/reach/mcp";

export const onRequest = async (ctx: Ctx & { next?: () => Promise<Response> }): Promise<Response> => {
  if (param(ctx, "host") === "index.json" && ctx.next) return ctx.next();
  const bare = slashRedirect(ctx.request);
  if (bare) return bare;
  return serve(ctx, "html", async () => renderMcp(await loadMcpHost(ctx, param(ctx, "host"))));
};
