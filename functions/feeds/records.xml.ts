/** GET /feeds/records.xml — Atom 1.0 of every new dated record; see functions/_lib/reach/records.ts. */
import { type Ctx, serve } from "../_lib/reach/core";
import { atomFeed, records } from "../_lib/reach/records";

export const onRequest = async (ctx: Ctx): Promise<Response> =>
  serve(ctx, "xml", async () => {
    const recs = await records(ctx);
    return { status: 200, contentType: "application/atom+xml; charset=utf-8", body: atomFeed(recs), lastModified: recs[0]?.date ?? null };
  });
