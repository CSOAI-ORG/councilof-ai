/** GET /notes/daily/<date>/ — rendered at request time; see functions/_lib/reach/notes.ts. */
import { type Ctx, param, serve, slashRedirect } from "../../../_lib/reach/core";
import { loadDailyNote, renderNote } from "../../../_lib/reach/notes";

export const onRequest = async (ctx: Ctx & { next?: () => Promise<Response> }): Promise<Response> => {

  const bare = slashRedirect(ctx.request);
  if (bare) return bare;
  return serve(ctx, "html", async () => renderNote(await loadDailyNote(ctx, param(ctx, "date"))));
};
