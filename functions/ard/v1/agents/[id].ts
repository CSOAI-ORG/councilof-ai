/** GET /ard/v1/agents/<identifier> — one ARD entry from our inventory (functions/_lib/ard). */
import { type Ctx, param } from "../../../_lib/reach/core";
import { detail } from "../../../_lib/ard/handlers";

export const onRequest = (ctx: Ctx): Promise<Response> => detail(ctx, param(ctx, "id"));
