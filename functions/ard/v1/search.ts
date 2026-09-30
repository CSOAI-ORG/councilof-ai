/** POST /ard/v1/search — ARD v0.91 search over our inventory (functions/_lib/ard). Read-only, free; no federation. */
import type { Ctx } from "../../_lib/reach/core";
import { search } from "../../_lib/ard/handlers";

export const onRequest = (ctx: Ctx): Promise<Response> => search(ctx);
