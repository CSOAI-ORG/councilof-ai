/**
 * GET /feeds/board.atom: Atom feed of GSPC board changes. The entries are the same ones
 * /feeds/board.json carries (functions/feeds/_board.ts), written by the shared Atom writer
 * in ./_xml, which takes each entry's date from the artifact. If the live board differs
 * from the newest signed freeze, the subtitle says so.
 */
import { atom, FEED_HEADERS } from "./_xml";
import { boardEntries, liveNote, FEED_TITLE, FEED_DESC, ATOM_FEED_URL } from "./_board";
import { inProcessBoard, readBoardFacts, type BoardSource, type Ctx } from "../_lib/gspcBoardFacts";

export async function atomFeed(ctx: Ctx, src: BoardSource = inProcessBoard): Promise<string> {
  const live = liveNote(await readBoardFacts(src, ctx));
  return atom(FEED_TITLE, ATOM_FEED_URL, `${FEED_DESC} ${live.note}`, boardEntries());
}

export const onRequest: PagesFunction = async (context) => {
  const m = context.request.method.toUpperCase();
  if (m !== "GET" && m !== "HEAD") return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  const body = await atomFeed({ request: context.request, env: context.env, waitUntil: (p) => context.waitUntil(p) });
  return new Response(m === "HEAD" ? null : body, {
    headers: { ...FEED_HEADERS, "content-type": "application/atom+xml; charset=utf-8", "access-control-allow-origin": "*" },
  });
};
