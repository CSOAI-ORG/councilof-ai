/** GET /feeds/records.json — JSON Feed 1.1 of the same entries as /feeds/records.xml. One source, two syntaxes. */
import { type Ctx, serve } from "../_lib/reach/core";
import { jsonFeed, records } from "../_lib/reach/records";

export const onRequest = async (ctx: Ctx): Promise<Response> =>
  serve(ctx, "json", async () => {
    const recs = await records(ctx);
    return { status: 200, contentType: "application/feed+json; charset=utf-8", body: jsonFeed(recs), lastModified: recs[0]?.date ?? null };
  });
