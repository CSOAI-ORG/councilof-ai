/** POST /ard/v1/explore — facet counts over our ARD inventory (functions/_lib/ard). Read-only, free. */
import type { Ctx } from "../../_lib/reach/core";
import { explore } from "../../_lib/ard/handlers";

export const onRequest = (ctx: Ctx): Promise<Response> => explore(ctx);
