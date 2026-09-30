/**
 * GET /notes/daily/ — every day whose signed measurement index verifies, newest first.
 * Answers /notes/daily and /notes/daily/ with the same page (canonical = slash form); no redirect,
 * so the sitemap's redirect scan never mistakes this hub for a retired route.
 */
import { type Ctx, serve } from "../../_lib/reach/core";
import { renderNotesHub, verifiedDays } from "../../_lib/reach/notes";

export const onRequest = async (ctx: Ctx): Promise<Response> => serve(ctx, "html", async () => renderNotesHub(await verifiedDays(ctx)));
