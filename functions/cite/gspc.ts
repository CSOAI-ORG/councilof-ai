/**
 * GET /cite/gspc: "Cite the GSPC board" as BibTeX or CSL-JSON.
 *
 *   /cite/gspc                      BibTeX (text/plain, so a browser shows it)
 *   /cite/gspc?format=bibtex        the same
 *   /cite/gspc?format=csl           CSL-JSON (application/vnd.citationstyles.csl+json)
 *   /cite/gspc?format=json          both, plus a one-line plain-text reference
 *   Accept: application/x-bibtex or application/vnd.citationstyles.csl+json also select the format,
 *   the same content negotiation doi.org uses.
 *
 * Two references, not one, because they are two different things:
 *   1. the live board, cited by URL with the date it was accessed. Its note carries the
 *      board's own totals.public_count and its as_of (measured_on.date), read from GET
 *      /api/gspc when the request is served.
 *   2. the methodology record, cited by the DOI the board payload itself names (`doi`), with
 *      the title taken from its `doi_note`. The DOI is not typed here, so if the board ever
 *      names a new record, this citation follows it.
 * The DOI is for the methodology record, not the live numbers, and the output says so. A
 * frozen board state has no DOI of its own yet. When it gets one, it becomes the preferred
 * way to cite a specific state.
 *
 * "Accessed" is the date of this request. That is what an access date is, so it is the one
 * place new Date() is correct. Every other value is read from the board.
 * If the board cannot be read, the URL reference is still produced, with its note saying
 * the count was unread; the DOI reference is left out, because its DOI comes from the board.
 *
 * Measurement, not certification. No grade, rank or score is cited.
 */
import { BOARD_API, BOARD_PAGE, inProcessBoard, methodologyTitle, readBoardFacts, type BoardRead, type BoardSource, type Ctx } from "../_lib/gspcBoardFacts";

export const BOARD_TITLE = "GSPC board: Governance, Safety, Provenance and Continuity measurements (live)";
const AUTHOR = "CSOAI Ltd";
const PUBLISHER = "Council of AI";

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** BibTeX escaping for field text: the specials that break a .bib file. */
export const bibEsc = (s: string): string => s.replace(/\\/g, "\\textbackslash{}").replace(/([{}&%$#_])/g, "\\$1").replace(/~/g, "\\textasciitilde{}").replace(/\^/g, "\\textasciicircum{}");

export function boardNote(read: BoardRead, accessed: string): string {
  if ("unread" in read) return `Live data from the GSPC board, unread at access (${read.unread}). Machine-readable: ${BOARD_API}. Measurement, not certification. Accessed ${accessed}.`;
  const f = read.facts;
  return (
    `Live data from the GSPC board, as_of ${f.as_of ?? "absent from the payload"}: ${f.public_count}` +
    (f.separation_public_count ? ` (${f.separation_public_count})` : "") +
    `. Machine-readable: ${BOARD_API}. Measurement, not certification. Accessed ${accessed}.`
  );
}

export function bibtex(read: BoardRead, now: Date): string {
  const accessed = ymd(now);
  let out =
    `@misc{csoai_gspc_board,\n` +
    `  author       = {{${AUTHOR}}},\n` +
    `  title        = {{${bibEsc(BOARD_TITLE)}}},\n` +
    `  howpublished = {\\url{${BOARD_PAGE}}},\n` +
    `  url          = {${BOARD_PAGE}},\n` +
    `  year         = {${now.getUTCFullYear()}},\n` +
    `  urldate      = {${accessed}},\n` +
    `  note         = {${bibEsc(boardNote(read, accessed))}}\n` +
    `}\n`;
  if ("facts" in read && read.facts.doi) {
    const t = methodologyTitle(read.facts) ?? "GSPC methodology record";
    out +=
      `\n@misc{csoai_gspc_methodology,\n` +
      `  author    = {{${AUTHOR}}},\n` +
      `  title     = {{${bibEsc(t)}}},\n` +
      `  publisher = {Zenodo},\n` +
      `  doi       = {${read.facts.doi}},\n` +
      `  url       = {https://doi.org/${read.facts.doi}},\n` +
      `  note      = {The methodology record the GSPC board names; it is not the live numbers}\n` +
      `}\n`;
  }
  return out;
}

export function csl(read: BoardRead, now: Date): Array<Record<string, unknown>> {
  const accessed = ymd(now);
  const [y, m, d] = accessed.split("-").map(Number);
  const items: Array<Record<string, unknown>> = [
    {
      id: "csoai_gspc_board",
      type: "dataset",
      title: BOARD_TITLE,
      author: [{ literal: AUTHOR }],
      publisher: PUBLISHER,
      URL: BOARD_PAGE,
      accessed: { "date-parts": [[y, m, d]] },
      note: boardNote(read, accessed),
    },
  ];
  if ("facts" in read && read.facts.doi) {
    items.push({
      id: "csoai_gspc_methodology",
      // DataCite registers this DOI with resourceTypeGeneral "Report" (read 2026-09-28), so it is cited as one.
      type: "report",
      title: methodologyTitle(read.facts) ?? "GSPC methodology record",
      author: [{ literal: AUTHOR }],
      publisher: "Zenodo",
      DOI: read.facts.doi,
      URL: `https://doi.org/${read.facts.doi}`,
      note: "The methodology record the GSPC board names; it is not the live numbers.",
    });
  }
  return items;
}

export function plainText(read: BoardRead, now: Date): string {
  const accessed = ymd(now);
  const count = "facts" in read ? `${read.facts.public_count}, as_of ${read.facts.as_of ?? "absent"}` : "count unread";
  return `${AUTHOR}. ${BOARD_TITLE} [dataset]. ${PUBLISHER}. ${BOARD_PAGE} (${count}). Accessed ${accessed}.`;
}

type Fmt = "bibtex" | "csl" | "json";

export function pickFormat(req: Request): Fmt | null {
  const f = new URL(req.url).searchParams.get("format");
  if (f) {
    const k = f.toLowerCase();
    if (k === "bibtex" || k === "bib") return "bibtex";
    if (k === "csl" || k === "csl-json" || k === "csljson") return "csl";
    if (k === "json") return "json";
    return null;
  }
  const accept = (req.headers.get("accept") ?? "").toLowerCase();
  if (accept.includes("application/vnd.citationstyles.csl+json")) return "csl";
  return "bibtex";
}

export const handle = async (ctx: Ctx, src: BoardSource = inProcessBoard, now: () => Date = () => new Date()): Promise<Response> => {
  const fmt = pickFormat(ctx.request);
  const common = { "access-control-allow-origin": "*", "x-content-type-options": "nosniff" };
  if (!fmt) {
    return new Response("format must be bibtex, csl or json\n", {
      status: 400,
      headers: { ...common, "content-type": "text/plain; charset=utf-8" },
    });
  }
  const read = await readBoardFacts(src, ctx);
  const t = now();
  const cache = "unread" in read ? "public, max-age=60" : "public, max-age=3600";
  const head = ctx.request.method === "HEAD";
  const wantsBibType = (ctx.request.headers.get("accept") ?? "").toLowerCase().includes("application/x-bibtex");
  if (fmt === "bibtex") {
    return new Response(head ? null : bibtex(read, t), {
      headers: { ...common, "content-type": wantsBibType ? "application/x-bibtex; charset=utf-8" : "text/plain; charset=utf-8", "cache-control": cache },
    });
  }
  if (fmt === "csl") {
    return new Response(head ? null : JSON.stringify(csl(read, t), null, 2), {
      headers: { ...common, "content-type": "application/vnd.citationstyles.csl+json; charset=utf-8", "cache-control": cache },
    });
  }
  const bundle = {
    schema: "csoai.cite-gspc/0.1",
    grammar: "measurement, not certification",
    board: "unread" in read ? { read: "unread", reason: read.unread } : { read: "derived", ...read.facts },
    bibtex: bibtex(read, t),
    csl_json: csl(read, t),
    text: plainText(read, t),
  };
  return new Response(head ? null : JSON.stringify(bundle, null, 2), {
    headers: { ...common, "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });
};

export const onRequest: PagesFunction = async (context) => {
  const m = context.request.method.toUpperCase();
  if (m !== "GET" && m !== "HEAD") return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  return handle({ request: context.request, env: context.env, waitUntil: (p) => context.waitUntil(p) });
};
