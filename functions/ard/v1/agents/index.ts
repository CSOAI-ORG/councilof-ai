/** GET /ard/v1/agents — ARD v0.91 list over our inventory (functions/_lib/ard). Read-only, free. */
import type { Ctx } from "../../../_lib/reach/core";
import { list } from "../../../_lib/ard/handlers";

export const onRequest = (ctx: Ctx): Promise<Response> => list(ctx);
