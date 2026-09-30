/**
 * GET /feeds/board.json: JSON Feed 1.1 (https://jsonfeed.org/version/1.1) of GSPC board changes.
 * Entries come from functions/feeds/_board.ts; the Atom twin is /feeds/board.atom.
 * The live-versus-newest-freeze comparison rides in the `_gspc` extension object.
 */
import { boardEntries, liveNote, FEED_TITLE, FEED_DESC, JSON_FEED_URL, ATOM_FEED_URL, HOME } from "./_board";
import { SITE, inProcessBoard, readBoardFacts, type BoardSource, type Ctx } from "../_lib/gspcBoardFacts";

export async function jsonFeed(ctx: Ctx, src: BoardSource = inProcessBoard) {
  const live = liveNote(await readBoardFacts(src, ctx));
  const items = boardEntries().map((e) => ({
    id: e.id,
    url: e.link,
    title: e.title,
    content_text: e.body,
    date_published: new Date(e.iso.length === 10 ? `${e.iso}T00:00:00Z` : e.iso).toISOString(),
    tags: [e.state],
    _gspc: {
      public_count: e.public_count,
      state: e.state,
      signed_file: e.signed_file,
      status_file: e.status_file,
      superseded_by: e.superseded_by,
    },
  }));
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: FEED_TITLE,
    home_page_url: HOME,
    feed_url: JSON_FEED_URL,
    description: `${FEED_DESC} ${live.note}`,
    language: "en-GB",
    authors: [{ name: "CSOAI Ltd", url: `${SITE}/` }],
    _gspc: {
      about: "Live data from the GSPC board, compared with the newest signed freeze. Measurement, not certification.",
      atom: ATOM_FEED_URL,
      ...live,
    },
    items,
  };
}

export const onRequest: PagesFunction = async (context) => {
  const m = context.request.method.toUpperCase();
  if (m !== "GET" && m !== "HEAD") return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  const body = await jsonFeed({ request: context.request, env: context.env, waitUntil: (p) => context.waitUntil(p) });
  return new Response(m === "HEAD" ? null : JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/feed+json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
