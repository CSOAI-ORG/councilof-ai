/**
 * Markdown content negotiation ("Markdown for Agents",
 * https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/).
 *
 * A GET or HEAD whose Accept header prefers text/markdown gets a Markdown rendering of the SAME prerendered HTML
 * page a browser would get: headings, paragraphs, list items, links, code and table rows, with scripts, styles,
 * SVG and <noscript> dropped. Nothing is added that the page does not say, except one closing line naming the HTML
 * page as the authority. HTML stays the default: a request without text/markdown in Accept (every browser) is
 * untouched, and so is any response that is not HTML (JSON, the MCP door, files such as /auth.md or llms.txt).
 * `Vary: Accept` is set on the Markdown response. No x-markdown-tokens header is sent: we do not count tokens,
 * and an estimate would be a number we did not measure.
 */

type MediaRange = { type: string; q: number };

function parseAccept(accept: string): MediaRange[] {
  return accept
    .split(",")
    .map((part) => {
      const [type, ...params] = part.trim().toLowerCase().split(";");
      let q = 1;
      for (const p of params) {
        const [k, v] = p.trim().split("=");
        if (k === "q") {
          const n = Number(v);
          q = Number.isFinite(n) ? n : 0;
        }
      }
      return { type: type.trim(), q };
    })
    .filter((m) => m.type);
}

/**
 * true iff text/markdown is acceptable (q > 0) and either ranks above text/html (or the wildcard standing in for
 * it), or ties with a wildcard while being listed first and text/html is not named at all.
 */
export function prefersMarkdown(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const ranges = parseAccept(request.headers.get("accept") ?? "");
  const q = (t: string) => ranges.find((m) => m.type === t)?.q;
  const md = q("text/markdown");
  if (md === undefined || md <= 0) return false;
  const namedHtml = q("text/html");
  const html = namedHtml ?? q("text/*") ?? q("*/*") ?? 0;
  if (md > html) return true;
  return md === html && namedHtml === undefined && ranges[0]?.type === "text/markdown";
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", hellip: "…",
  middot: "·", copy: "©", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
};

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const inline = (s: string) => decode(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

function absolute(href: string, base: URL): string {
  try {
    return new URL(decode(href), base).toString();
  } catch {
    return href;
  }
}

/** Markdown from one HTML document. Pure; exported for tests. */
export function htmlToMarkdown(html: string, pageUrl: string): string {
  const base = new URL(pageUrl);
  const title = inline(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  let body = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html;
  body = body
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|svg|template|iframe|canvas)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n");
  const pre: string[] = [];
  body = body.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, c: string) => {
    pre.push("```\n" + decode(c.replace(/<[^>]+>/g, "")).replace(/\n+$/, "") + "\n```");
    return `\n\n@@PRE${pre.length - 1}@@\n\n`;
  });
  body = body
    .replace(/<a\b[^>]*href\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, text: string) => {
      const t = inline(text);
      if (!t) return "";
      if (/^(javascript:|#)/i.test(href)) return t;
      return `[${t.replace(/[[\]]/g, "")}](${absolute(href, base)})`;
    })
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, c: string) => "`" + inline(c).replace(/`/g, "'") + "`")
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, c: string) => (inline(c) ? `**${inline(c)}**` : ""))
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, c: string) => (inline(c) ? `*${inline(c)}*` : ""))
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, n: string, c: string) => `\n\n${"#".repeat(Number(n))} ${inline(c)}\n\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_m, c: string) => `\n- ${inline(c)}`)
    .replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi, (_m, c: string) => {
      const cells = [...c.matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => inline(m[1]).replace(/\|/g, "\\|"));
      return cells.length ? `\n| ${cells.join(" | ")} |` : "";
    })
    .replace(/<\/(p|div|section|article|header|footer|nav|aside|ul|ol|table|blockquote|figure|dl|dd|dt)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
  let md = decode(body)
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  md = md.replace(/@@PRE(\d+)@@/g, (_m, i: string) => pre[Number(i)]);
  const head = title && !md.startsWith("# ") ? `# ${title}\n\n` : "";
  return `${head}${md}\n\n---\nSource: ${base.toString()} (Markdown rendering of the served HTML page; the HTML page is the authority)\n`;
}

/** Wraps the upstream response: HTML -> Markdown when the request prefers it; anything else passes through. */
export async function negotiateMarkdown(request: Request, upstream: Response): Promise<Response> {
  const ct = upstream.headers.get("content-type") ?? "";
  if (upstream.status !== 200 || !/^text\/html\b/i.test(ct)) return upstream;
  const md = htmlToMarkdown(await upstream.text(), request.url);
  const headers = new Headers({
    "content-type": "text/markdown; charset=utf-8",
    vary: "Accept",
    "cache-control": "public, max-age=300",
    "x-content-type-options": "nosniff",
    link: `<${request.url}>; rel="alternate"; type="text/html"`,
  });
  return new Response(request.method === "HEAD" ? null : md, { status: 200, headers });
}
