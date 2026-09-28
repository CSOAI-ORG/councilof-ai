/**
 * gspcBoardFacts: the few read-only facts every GSPC embed surface shows, read from the
 * board itself.
 *
 * Used by /embed/board (the iframe page), /cite/gspc (the citation snippet) and
 * /feeds/board.{json,atom} (the board-change feeds). None of them types a count. Each one
 * reads GET /api/gspc and prints these fields verbatim:
 *   totals.public_count           the headline count
 *   measured_on.date              the as_of
 *   totals.separation_public_count  the line the board says to read beside the count
 *   doi / doi_note                the methodology record
 *
 * It reads the board IN-PROCESS, the same way /badge/board.svg does. A Pages Function that
 * fetch()es its own origin re-enters the router; functions/embed/verify.ts records the
 * production 502 that caused. The source can be injected, so tests can pass it a real
 * capture or a failing source.
 *
 * ABSENT IS NOT ZERO. When the board cannot be read, the result is { unread: reason } and no
 * count is returned. A caller renders "unread", never 0.
 *
 * Doctrine: measurement, not certification. No grade, rank or score is read or produced.
 */
import { onRequestGet as gspcGet } from "../api/gspc";

export type Ctx = { request: Request; env: unknown; waitUntil: (p: Promise<unknown>) => void };
export type BoardSource = (ctx: Ctx) => Promise<Response>;

export const SITE = "https://councilof.ai";
export const BOARD_PAGE = `${SITE}/gspc`;
export const BOARD_API = `${SITE}/api/gspc`;
export const EMBED_PAGE = `${SITE}/embed/board`;

export interface BoardFacts {
  /** totals.public_count, verbatim. */
  public_count: string;
  /** measured_on.date, verbatim, or null if the payload has none. */
  as_of: string | null;
  /** totals.separation_public_count, verbatim, or null. */
  separation_public_count: string | null;
  axes: number | null;
  measured_axes: number | null;
  unmeasured_axes: number | null;
  doi: string | null;
  doi_note: string | null;
}

export type BoardRead = { facts: BoardFacts } | { unread: string };

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Parse a /api/gspc body. Exported so the tests can hand it captures directly. */
export function factsFromPayload(d: unknown): BoardRead {
  if (!d || typeof d !== "object") return { unread: "GET /api/gspc body is not an object" };
  const o = d as Record<string, unknown>;
  const totals = (o.totals ?? {}) as Record<string, unknown>;
  const pc = str(totals.public_count);
  if (!pc) return { unread: "GET /api/gspc carries no totals.public_count" };
  const measuredOn = (o.measured_on ?? {}) as Record<string, unknown>;
  return {
    facts: {
      public_count: pc,
      as_of: str(measuredOn.date),
      separation_public_count: str(totals.separation_public_count),
      axes: num(totals.axes),
      measured_axes: num(totals.measured_axes),
      unmeasured_axes: num(totals.unmeasured_axes),
      doi: str(o.doi),
      doi_note: str(o.doi_note),
    },
  };
}

export async function readBoardFacts(src: BoardSource, ctx: Ctx): Promise<BoardRead> {
  let res: Response;
  try {
    res = await src(ctx);
  } catch (e) {
    return { unread: `GET /api/gspc threw: ${(e as Error)?.message ?? String(e)}` };
  }
  if (!res || res.status !== 200) return { unread: `GET /api/gspc → HTTP ${res ? res.status : "no response"}` };
  let d: unknown;
  try {
    d = await res.json();
  } catch {
    return { unread: "GET /api/gspc body is not JSON" };
  }
  return factsFromPayload(d);
}

/** Default source: the /api/gspc handler itself, in-process. It returns the same bytes the endpoint serves. */
export const inProcessBoard: BoardSource = (ctx) =>
  (gspcGet as unknown as (c: Ctx) => Promise<Response>)({
    ...ctx,
    request: new Request(new URL("/api/gspc", ctx.request.url).toString(), {
      method: "GET",
      headers: { accept: "application/json" },
    }),
  });

/** HTML/XML text escaper shared by the embed surfaces. */
export const escHtml = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** The methodology record's title, taken from doi_note up to its first " (" and never typed. */
export const methodologyTitle = (f: Pick<BoardFacts, "doi_note">): string | null => {
  if (!f.doi_note) return null;
  const m = /^(.+?)\s+\(/.exec(f.doi_note);
  return (m ? m[1] : f.doi_note).trim() || null;
};
