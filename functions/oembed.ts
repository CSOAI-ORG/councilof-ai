/**
 * GET /oembed: oEmbed 1.0 provider for the GSPC board embed (https://oembed.com/).
 *
 *   /oembed?url=https://councilof.ai/embed/board&format=json
 *   /oembed?url=https://councilof.ai/gspc&maxwidth=360
 *
 * It answers type "rich" with an <iframe> of /embed/board. The iframe is the live board, so
 * the oEmbed response carries no count. A consumer that caches this response for cache_age
 * or longer still shows the board's current numbers, because it only cached the iframe tag.
 * The title is fixed for the same reason: a count in the title would go stale in every
 * consumer's cache.
 *
 * URL scheme (these are the only URLs it answers for, and the ones to list in a provider
 * registry):
 *   https://councilof.ai/embed/board  (optionally ?theme=light|dark)
 *   https://councilof.ai/gspc  and  https://councilof.ai/gspc/
 *   the same paths on www.councilof.ai
 *
 * Status codes, per the spec:
 *   400 url missing · 404 url not one of ours · 501 format other than json or xml.
 *
 * No thumbnail, no badge, no mark. Measurement, not certification.
 */
import { EMBED_PAGE, SITE, escHtml } from "./_lib/gspcBoardFacts";
import { EMBED_HEIGHT, EMBED_WIDTH } from "./embed/board";

const MIN_W = 280;
const MIN_H = 160;

const HOSTS = new Set(["councilof.ai", "www.councilof.ai"]);
const PATHS = new Set(["/embed/board", "/embed/board/", "/gspc", "/gspc/"]);

/** Returns the iframe src for an accepted URL, or null if the URL is not one we embed. */
export function embedSrcFor(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!HOSTS.has(u.hostname.toLowerCase())) return null;
  if (!PATHS.has(u.pathname)) return null;
  const theme = u.searchParams.get("theme");
  return theme === "light" || theme === "dark" ? `${EMBED_PAGE}?theme=${theme}` : EMBED_PAGE;
}

const clamp = (req: string | null, max: number, min: number): number => {
  const n = req === null ? NaN : Number.parseInt(req, 10);
  if (!Number.isFinite(n) || n <= 0) return max;
  return Math.max(min, Math.min(max, n));
};

export interface OEmbed {
  version: "1.0";
  type: "rich";
  provider_name: string;
  provider_url: string;
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  width: number;
  height: number;
  cache_age: number;
}

export function oembedFor(src: string, maxwidth: string | null, maxheight: string | null): OEmbed {
  const width = clamp(maxwidth, EMBED_WIDTH, MIN_W);
  const height = clamp(maxheight, EMBED_HEIGHT, MIN_H);
  const html =
    `<iframe src="${escHtml(src)}" width="${width}" height="${height}" style="border:0;max-width:100%" ` +
    `loading="lazy" referrerpolicy="strict-origin-when-cross-origin" title="GSPC board: live data from councilof.ai"></iframe>`;
  return {
    version: "1.0",
    type: "rich",
    provider_name: "Council of AI",
    provider_url: `${SITE}/`,
    title: "GSPC board: live data",
    author_name: "CSOAI Ltd",
    author_url: `${SITE}/`,
    html,
    width,
    height,
    cache_age: 3600,
  };
}

const xmlOf = (o: OEmbed): string =>
  `<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n<oembed>\n` +
  (Object.keys(o) as (keyof OEmbed)[]).map((k) => `  <${k}>${escHtml(o[k])}</${k}>`).join("\n") +
  `\n</oembed>\n`;

const COMMON = {
  "access-control-allow-origin": "*",
  "x-content-type-options": "nosniff",
};

const plain = (status: number, msg: string) =>
  new Response(msg + "\n", { status, headers: { ...COMMON, "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });

export function handle(request: Request): Response {
  const q = new URL(request.url).searchParams;
  const raw = q.get("url");
  if (!raw) return plain(400, "oEmbed: the url parameter is required");
  const format = (q.get("format") ?? "json").toLowerCase();
  if (format !== "json" && format !== "xml") return plain(501, `oEmbed: format ${format} is not implemented (json, xml)`);
  const src = embedSrcFor(raw);
  if (!src) return plain(404, "oEmbed: no embed for that url (accepted: https://councilof.ai/embed/board, https://councilof.ai/gspc)");
  const o = oembedFor(src, q.get("maxwidth"), q.get("maxheight"));
  const headers = { ...COMMON, "cache-control": "public, max-age=3600" };
  const head = request.method === "HEAD";
  return format === "xml"
    ? new Response(head ? null : xmlOf(o), { headers: { ...headers, "content-type": "text/xml; charset=utf-8" } })
    : new Response(head ? null : JSON.stringify(o), { headers: { ...headers, "content-type": "application/json; charset=utf-8" } });
}

export const onRequest: PagesFunction = async ({ request }) => {
  const m = request.method.toUpperCase();
  if (m !== "GET" && m !== "HEAD") return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  return handle(request);
};
