/** GET /notes/daily/<date>/index.json — the machine-readable twin of the page; same loader, same withholding rules. */
import { type Ctx, param, serve } from "../../../_lib/reach/core";
import { loadDailyNote, noteJson } from "../../../_lib/reach/notes";

export const onRequest = async (ctx: Ctx & { next?: () => Promise<Response> }): Promise<Response> => {

  return serve(ctx, "json", async () => ({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(noteJson(await loadDailyNote(ctx, param(ctx, "date"))), null, 1) + "\n", lastModified: null }));
};
