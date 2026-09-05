/**
 * GET /badge/board.svg — the whole living board as one image.
 *
 * WHY. A README on GitHub can carry an image and nothing else: no script, no iframe, no
 * fetch. The shields-style count at /badge/gspc.svg says "22 measured" and stops there;
 * this renders the board itself — every slot, its family, its status and its n — so a
 * reader who only ever sees the README sees the same 22 rows the board serves.
 *
 *     ![GSPC board](https://councilof.ai/badge/board.svg)
 *     ![GSPC board](https://councilof.ai/badge/board.svg?compact=1)      one row per axis, dots
 *     ![GSPC board](https://councilof.ai/badge/board.svg?theme=dark)     light is the default
 *
 * EVERY NUMBER IS DERIVED AT REQUEST TIME FROM GET /api/gspc. Nothing here is typed: the
 * rows are the payload's `axes` array verbatim, the caption is `totals.lid` verbatim, the
 * totals line is counted off the rows and printed beside `totals.public_count` so the two
 * can be seen to agree (or, if they ever do not, seen to disagree). An image that carried
 * its own copy of a count is how /badge/axes.json served "15 of 22" for seven axes' worth
 * of drift — see that file's header.
 *
 * HOW IT READS THE BOARD. It invokes the /api/gspc handler IN-PROCESS with a synthetic GET,
 * not over the network. A Pages Function that fetch()es its own origin re-enters the Pages
 * router; functions/embed/verify.ts documents the production 502 that produced. The
 * in-process call returns the identical bytes the endpoint serves (same handler, same edge
 * cache key), with no subrequest and no loop. The source is injectable so the tests can
 * hand it a real capture and a failing one.
 *
 * ABSENT IS NOT ZERO. If the board cannot be read — the handler throws, answers non-200,
 * or returns a shape without an axes array or a lid — the image says "unread — <reason>"
 * and shows NO rows and NO counts. It never paints zeros, because a zero in a README is a
 * measurement claim and an unread board has made none.
 *
 * Doctrine: measurement, not certification. No grade, no rank, no score is rendered here.
 */
import { onRequestGet as gspcGet } from "../api/gspc";

type Ctx = { request: Request; env: unknown; waitUntil: (p: Promise<unknown>) => void };
export type BoardSource = (ctx: Ctx) => Promise<Response>;

type Row = {
  axis: string;
  family: string;
  kind?: string;
  status: string;
  separation?: string;
  n?: number | null;
};
type Board = {
  axes: Row[];
  lid: string;
  public_count?: string;
  as_of?: string;
};

const W = 1000;
const GREEN = "#16a34a";
const AMBER = "#b45309";

const THEMES = {
  light: { bg: "#ffffff", ink: "#111827", muted: "#6b7280", line: "#e5e7eb", hollow: "#9ca3af" },
  dark: { bg: "#0f1412", ink: "#e6ebe8", muted: "#9aa8a2", line: "#26302c", hollow: "#6b7280" },
} as const;
type Theme = (typeof THEMES)[keyof typeof THEMES];

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

// A field the payload does not carry renders as "—", never as 0 or as an invented word.
const cell = (v: unknown): string => (v === undefined || v === null || v === "" ? "—" : String(v));

// ── read the board: the payload's own fields, or a stated reason why not ─────────────────
export const readBoard = async (src: BoardSource, ctx: Ctx): Promise<{ board: Board } | { unread: string }> => {
  let res: Response;
  try {
    res = await src(ctx);
  } catch (e) {
    return { unread: `GET /api/gspc threw: ${(e as Error)?.message ?? String(e)}` };
  }
  if (!res || res.status !== 200) return { unread: `GET /api/gspc → HTTP ${res ? res.status : "no response"}` };
  let d: Record<string, unknown>;
  try {
    d = (await res.json()) as Record<string, unknown>;
  } catch {
    return { unread: "GET /api/gspc body is not JSON" };
  }
  const axes = d?.axes;
  if (!Array.isArray(axes)) return { unread: "GET /api/gspc carries no axes array" };
  const totals = (d?.totals ?? {}) as Record<string, unknown>;
  if (typeof totals.lid !== "string" || !totals.lid.trim()) return { unread: "GET /api/gspc carries no totals.lid" };
  const measuredOn = (d?.measured_on ?? {}) as Record<string, unknown>;
  const rows: Row[] = axes.map((a) => {
    const r = (a ?? {}) as Record<string, unknown>;
    return {
      axis: String(r.axis ?? "—"),
      family: String(r.family ?? "—"),
      kind: typeof r.kind === "string" ? r.kind : undefined,
      status: typeof r.status === "string" ? r.status : "—",
      separation: typeof r.separation === "string" ? r.separation : undefined,
      n: typeof r.n === "number" ? r.n : null,
    };
  });
  return {
    board: {
      axes: rows,
      lid: totals.lid,
      public_count: typeof totals.public_count === "string" ? totals.public_count : undefined,
      as_of: typeof measuredOn.date === "string" ? measuredOn.date : undefined,
    },
  };
};

// ── shared chrome ─────────────────────────────────────────────────────────────────────────
const logo = (t: Theme, y: number) =>
  `<text x="32" y="${y}" font-size="22" font-weight="600" letter-spacing="0.5" fill="${t.ink}">CS<tspan fill="${GREEN}" font-weight="700">O</tspan>AI</text>`;

const open = (t: Theme, h: number, title: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(title)}">` +
  `<title>${esc(title)}</title>` +
  `<rect width="${W}" height="${h}" fill="${t.bg}"/>` +
  `<g font-family="${FONT}" text-rendering="geometricPrecision">`;
const close = () => `</g></svg>`;

const statusDot = (status: string, t: Theme, cx: number, cy: number) =>
  status === "MEASURED"
    ? `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${GREEN}"/>`
    : `<circle cx="${cx}" cy="${cy}" r="4" fill="none" stroke="${t.hollow}" stroke-width="1.5"/>`;

const sepColour = (sep: string | undefined, t: Theme) =>
  sep === "SEPARATED" ? GREEN : sep === "TIE" ? AMBER : t.muted;

// Counted off the rows, so this line can never be typed. Printed beside the payload's own
// public_count so a reader can see the two agree — or see them disagree.
const totalsLine = (b: Board) => {
  const measured = b.axes.filter((r) => r.status === "MEASURED").length;
  const unmeasured = b.axes.filter((r) => r.status === "UNMEASURED").length;
  const other = b.axes.length - measured - unmeasured;
  const derived = `${b.axes.length} axes · ${measured} MEASURED · ${unmeasured} UNMEASURED` + (other ? ` · ${other} other` : "");
  if (!b.public_count) return `${derived} · totals.public_count: absent`;
  const agrees = b.public_count === `${b.axes.length} axis · ${measured} measured`;
  return `${derived} · totals.public_count: "${b.public_count}"${agrees ? "" : " — DISAGREES with the rows"}`;
};

const footer = (b: Board, derivedAt: string) =>
  `as_of: ${b.as_of ?? "absent"} · derived ${derivedAt} · councilof.ai/gspc · measurement, not certification`;

// ── full board ───────────────────────────────────────────────────────────────────────────
export const renderFull = (b: Board, t: Theme, derivedAt: string): string => {
  const ROW = 26;
  const top = 128;
  const rowsEnd = top + b.axes.length * ROW;
  const totalsY = rowsEnd + 30;
  const footY = totalsY + 26;
  const h = footY + 24;
  const col = { dot: 40, axis: 56, family: 330, kind: 430, status: 600, sep: 720, n: 960 };
  const cols = [
    { x: col.axis, text: "axis" }, { x: col.family, text: "family" }, { x: col.kind, text: "kind" },
    { x: col.status, text: "status" }, { x: col.sep, text: "separation" },
  ];
  let s = open(t, h, `GSPC living board — ${b.lid}`);
  s += logo(t, 44);
  s += `<text x="${W - 32}" y="44" text-anchor="end" font-size="15" fill="${t.muted}">GSPC living board</text>`;
  s += `<text x="32" y="74" font-size="14" fill="${t.ink}">${esc(b.lid)}</text>`;
  s += `<line x1="32" y1="90" x2="${W - 32}" y2="90" stroke="${t.line}"/>`;
  for (const c of cols) s += `<text x="${c.x}" y="112" font-size="11" fill="${t.muted}" letter-spacing="1">${c.text.toUpperCase()}</text>`;
  s += `<text x="${col.n}" y="112" text-anchor="end" font-size="11" fill="${t.muted}" letter-spacing="1">N</text>`;
  s += `<line x1="32" y1="120" x2="${W - 32}" y2="120" stroke="${t.line}"/>`;
  b.axes.forEach((r, i) => {
    const y = top + i * ROW + 17;
    const cy = top + i * ROW + 12;
    if (i > 0) s += `<line x1="32" y1="${top + i * ROW}" x2="${W - 32}" y2="${top + i * ROW}" stroke="${t.line}" stroke-width="0.5"/>`;
    s += statusDot(r.status, t, col.dot, cy);
    s += `<text x="${col.axis}" y="${y}" font-size="13" fill="${t.ink}">${esc(r.axis)}</text>`;
    s += `<text x="${col.family}" y="${y}" font-size="13" fill="${t.muted}">${esc(r.family)}</text>`;
    s += `<text x="${col.kind}" y="${y}" font-size="13" fill="${t.muted}">${esc(cell(r.kind))}</text>`;
    s += `<text x="${col.status}" y="${y}" font-size="13" font-weight="600" fill="${r.status === "MEASURED" ? GREEN : t.muted}">${esc(r.status)}</text>`;
    s += `<text x="${col.sep}" y="${y}" font-size="13" fill="${sepColour(r.separation, t)}">${esc(cell(r.separation))}</text>`;
    s += `<text x="${col.n}" y="${y}" text-anchor="end" font-size="13" fill="${t.ink}">${esc(cell(r.n))}</text>`;
  });
  s += `<line x1="32" y1="${rowsEnd}" x2="${W - 32}" y2="${rowsEnd}" stroke="${t.line}"/>`;
  s += `<text x="32" y="${totalsY}" font-size="13" font-weight="600" fill="${t.ink}">${esc(totalsLine(b))}</text>`;
  s += `<text x="${W - 32}" y="${totalsY}" text-anchor="end" font-size="11" fill="${t.muted}">— = the payload carries no such field</text>`;
  s += `<text x="32" y="${footY}" font-size="11" fill="${t.muted}">${esc(footer(b, derivedAt))}</text>`;
  return s + close();
};

// ── compact: one row per axis, a dot, two columns ────────────────────────────────────────
export const renderCompact = (b: Board, t: Theme, derivedAt: string): string => {
  const ROW = 22;
  const top = 96;
  const perCol = Math.ceil(b.axes.length / 2);
  const colX = [32, 516];
  const colW = 452;
  const rowsEnd = top + perCol * ROW;
  const totalsY = rowsEnd + 26;
  const footY = totalsY + 22;
  const h = footY + 20;
  let s = open(t, h, `GSPC living board — ${b.lid}`);
  s += logo(t, 40);
  s += `<text x="${W - 32}" y="40" text-anchor="end" font-size="14" fill="${t.muted}">GSPC living board</text>`;
  s += `<text x="32" y="68" font-size="13" fill="${t.ink}">${esc(b.lid)}</text>`;
  s += `<line x1="32" y1="82" x2="${W - 32}" y2="82" stroke="${t.line}"/>`;
  b.axes.forEach((r, i) => {
    const c = Math.floor(i / perCol);
    const x = colX[c] ?? colX[colX.length - 1];
    const y = top + (i % perCol) * ROW + 15;
    const cy = top + (i % perCol) * ROW + 10;
    s += statusDot(r.status, t, x + 6, cy);
    s += `<text x="${x + 20}" y="${y}" font-size="12.5" fill="${t.ink}">${esc(r.axis)}</text>`;
    s += `<text x="${x + 195}" y="${y}" font-size="11.5" fill="${t.muted}">${esc(r.family)}</text>`;
    s += `<text x="${x + 250}" y="${y}" font-size="11.5" font-weight="600" fill="${r.status === "MEASURED" ? GREEN : t.muted}">${esc(r.status)}</text>`;
    s += `<text x="${x + 325}" y="${y}" font-size="11.5" fill="${sepColour(r.separation, t)}">${esc(cell(r.separation))}</text>`;
    s += `<text x="${x + colW}" y="${y}" text-anchor="end" font-size="12" fill="${t.ink}">${esc(cell(r.n))}</text>`;
  });
  s += `<line x1="32" y1="${rowsEnd + 6}" x2="${W - 32}" y2="${rowsEnd + 6}" stroke="${t.line}"/>`;
  s += `<text x="32" y="${totalsY}" font-size="12" font-weight="600" fill="${t.ink}">${esc(totalsLine(b))}</text>`;
  s += `<text x="32" y="${footY}" font-size="10.5" fill="${t.muted}">${esc(footer(b, derivedAt))}</text>`;
  return s + close();
};

// ── unread: the reason, and no numbers at all ────────────────────────────────────────────
export const renderUnread = (reason: string, t: Theme, derivedAt: string): string => {
  const h = 150;
  let s = open(t, h, `GSPC living board — unread — ${reason}`);
  s += logo(t, 44);
  s += `<text x="${W - 32}" y="44" text-anchor="end" font-size="15" fill="${t.muted}">GSPC living board</text>`;
  s += `<line x1="32" y1="60" x2="${W - 32}" y2="60" stroke="${t.line}"/>`;
  s += `<text x="32" y="92" font-size="16" font-weight="600" fill="${t.ink}">unread — ${esc(reason)}</text>`;
  s += `<text x="32" y="112" font-size="12" fill="${t.muted}">No rows and no counts are shown because none were read. An unread board is not a board of zeros.</text>`;
  s += `<text x="32" y="134" font-size="11" fill="${t.muted}">derived ${esc(derivedAt)} · live board: councilof.ai/api/gspc · councilof.ai/gspc</text>`;
  return s + close();
};

// Default source: the /api/gspc handler itself, in-process. Same bytes the endpoint serves.
const inProcess: BoardSource = (ctx) =>
  (gspcGet as unknown as (c: Ctx) => Promise<Response>)({
    ...ctx,
    request: new Request(new URL("/api/gspc", ctx.request.url).toString(), { method: "GET", headers: { accept: "application/json" } }),
  });

export const handle = async (ctx: Ctx, src: BoardSource = inProcess, now: () => Date = () => new Date()): Promise<Response> => {
  const url = new URL(ctx.request.url);
  const t: Theme = url.searchParams.get("theme") === "dark" ? THEMES.dark : THEMES.light;
  const compact = url.searchParams.get("compact") === "1";
  const derivedAt = now().toISOString();
  const read = await readBoard(src, ctx);
  const headers = {
    "content-type": "image/svg+xml; charset=utf-8",
    "access-control-allow-origin": "*",
    // 300s matches /api/gspc; an unread image heals sooner so a transient fault does not
    // sit in a README for five minutes.
    "cache-control": "unread" in read ? "public, max-age=60" : "public, max-age=300",
    "x-gspc-board": "unread" in read ? "unread" : "derived",
  };
  if ("unread" in read) return new Response(renderUnread(read.unread, t, derivedAt), { status: 200, headers });
  const svg = compact ? renderCompact(read.board, t, derivedAt) : renderFull(read.board, t, derivedAt);
  return new Response(svg, { status: 200, headers });
};

export const onRequestGet: PagesFunction = async (context) =>
  handle({ request: context.request, env: context.env, waitUntil: (p) => context.waitUntil(p) });
