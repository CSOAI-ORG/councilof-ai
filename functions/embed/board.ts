/**
 * GET /embed/board: the GSPC board's live totals as a page another site can frame.
 *
 *   <iframe src="https://councilof.ai/embed/board" width="420" height="200"
 *           style="border:0" loading="lazy" title="GSPC board: live data"></iframe>
 *
 * The page shows three things, all read from GET /api/gspc when the request is served:
 *   totals.public_count (verbatim), measured_on.date as the as_of (verbatim), and a link to
 *   councilof.ai/board/. It also prints the separation line, which the board says to read beside
 *   the count and never instead of it, so a reader cannot take "N measured" to mean N leaders.
 *
 * It is not a badge. It carries no mark, grade, rank, score or pass/fail, and no partner
 * branding. It shows the board's own words and the date they refer to.
 *
 * Server-rendered and script-free. The HTML is built here from the board read in-process
 * (see functions/_lib/gspcBoardFacts.ts), so the page works with JavaScript off and in
 * readers that strip scripts. The CSP forbids scripts outright.
 *
 * Framing: this path must be framable by any origin. The global X-Frame-Options:
 * SAMEORIGIN in public/_headers is detached for /embed/board there, and this response sets
 * CSP frame-ancestors * itself. Browsers honour frame-ancestors over X-Frame-Options.
 *
 * Discovery: <link rel="alternate"> points at the oEmbed endpoint (/oembed) and at the two
 * board-change feeds, so an oEmbed consumer or a feed reader handed this URL finds them.
 *
 * Query: ?theme=light|dark (default: follows prefers-color-scheme).
 * Unread board → HTTP 200 page that says "unread — <reason>" and shows no count.
 */
import { BOARD_API, BOARD_PAGE, EMBED_PAGE, SITE, escHtml, inProcessBoard, readBoardFacts, type BoardSource, type Ctx, type BoardFacts } from "../_lib/gspcBoardFacts";

export const EMBED_WIDTH = 420;
export const EMBED_HEIGHT = 200;

const OEMBED = `${SITE}/oembed?url=${encodeURIComponent(EMBED_PAGE)}&format=json`;

const CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors *";

const PALETTE = {
  light: "--bg:#ffffff;--ink:#111827;--muted:#4b5563;--line:#e5e7eb;--accent:#047857;",
  dark: "--bg:#0f1412;--ink:#e6ebe8;--muted:#a3b1ab;--line:#26302c;--accent:#34d399;",
};

const style = (theme: string | null) => {
  const fixed = theme === "dark" ? PALETTE.dark : theme === "light" ? PALETTE.light : null;
  const root = fixed
    ? `:root{${fixed}}`
    : `:root{${PALETTE.light}}@media (prefers-color-scheme: dark){:root{${PALETTE.dark}}}`;
  return (
    root +
    "*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--ink)}" +
    "body{font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}" +
    "main{padding:14px 16px;border:1px solid var(--line);border-radius:8px;min-height:100vh}" +
    ".k{margin:0;font-size:12px;color:var(--muted);letter-spacing:.02em}" +
    ".c{margin:6px 0 2px;font-size:22px;font-weight:600}" +
    ".s{margin:0 0 8px;font-size:12px;color:var(--muted)}" +
    ".a{margin:0 0 10px;font-size:12px}" +
    ".l{margin:0;font-size:12px;color:var(--muted)}a{color:var(--accent)}"
  );
};

const head = (theme: string | null, title: string) =>
  `<!doctype html>\n<html lang="en"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<meta name="robots" content="noindex,follow">` +
  `<title>${escHtml(title)}</title>` +
  `<link rel="alternate" type="application/json+oembed" href="${escHtml(OEMBED)}" title="GSPC board: live data">` +
  `<link rel="alternate" type="application/feed+json" href="${SITE}/feeds/board.json" title="GSPC board changes (JSON Feed)">` +
  `<link rel="alternate" type="application/atom+xml" href="${SITE}/feeds/board.atom" title="GSPC board changes (Atom)">` +
  `<style>${style(theme)}</style></head><body><main>`;

const foot =
  `<p class="l"><a href="${BOARD_PAGE}" target="_blank" rel="noopener">councilof.ai/board</a>` +
  ` · <a href="${BOARD_API}" target="_blank" rel="noopener">JSON</a>` +
  ` · <a href="${SITE}/cite/gspc" target="_blank" rel="noopener">cite</a>` +
  ` · measurement, not certification</p></main></body></html>\n`;

export function renderBoard(f: BoardFacts, theme: string | null): string {
  return (
    head(theme, `GSPC board: ${f.public_count}`) +
    `<p class="k">Live data from the GSPC board</p>` +
    `<p class="c" data-field="public_count">${escHtml(f.public_count)}</p>` +
    (f.separation_public_count
      ? `<p class="s" data-field="separation_public_count">${escHtml(f.separation_public_count)}</p>`
      : "") +
    `<p class="a" data-field="as_of">as_of: ${escHtml(f.as_of ?? "absent from the payload")}</p>` +
    foot
  );
}

export function renderUnread(reason: string, theme: string | null): string {
  return (
    head(theme, "GSPC board: unread") +
    `<p class="k">GSPC board</p>` +
    `<p class="c" data-field="unread">unread</p>` +
    `<p class="s">${escHtml(reason)}. No count is shown because none was read. An unread board is not a board of zeros.</p>` +
    foot
  );
}

export const handle = async (ctx: Ctx, src: BoardSource = inProcessBoard): Promise<Response> => {
  const url = new URL(ctx.request.url);
  const t = url.searchParams.get("theme");
  const theme = t === "dark" || t === "light" ? t : null;
  const read = await readBoardFacts(src, ctx);
  const unread = "unread" in read;
  const headers: Record<string, string> = {
    "content-type": "text/html; charset=utf-8",
    "content-security-policy": CSP,
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-robots-tag": "noindex, follow",
    "access-control-allow-origin": "*",
    // 300 s matches /api/gspc. An unread page heals sooner.
    "cache-control": unread ? "public, max-age=60" : "public, max-age=300",
    "x-gspc-board": unread ? "unread" : "derived",
    link: `<${OEMBED}>; rel="alternate"; type="application/json+oembed"`,
  };
  const body = unread ? renderUnread(read.unread, theme) : renderBoard(read.facts, theme);
  return new Response(ctx.request.method === "HEAD" ? null : body, { status: 200, headers });
};

export const onRequest: PagesFunction = async (context) => {
  const m = context.request.method.toUpperCase();
  if (m !== "GET" && m !== "HEAD") return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  return handle({ request: context.request, env: context.env, waitUntil: (p) => context.waitUntil(p) });
};
