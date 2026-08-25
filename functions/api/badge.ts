// functions/api/badge.ts — the README / white-label badge endpoint (GROWTH-300 #41).
//
// A shields.io-style badge any project can drop into its README or its own site:
//     ![measured](https://councilof.ai/api/badge)
//     ![measured](https://councilof.ai/api/badge?measured=9&label=agentname)
//     ![governance](https://councilof.ai/api/badge?axis=governance)
//     ![card](https://councilof.ai/api/badge?card=82994353…)
//
// The default badge states the board's own honest count, derived from the same
// MEASURED / separation split as GET /api/gspc totals.public_count - never a typed
// slot count. Jail is MEASURED; living-board separation is TIE (not a separated lead). The
// in-lane slot stays unnamed and visible empty. A visiting agent that enrols and
// is measured on fewer axes states its real count, and an unmeasured subject
// renders honestly as "unmeasured" in grey - never a fabricated score.
//
// ?axis=<name> renders ONE axis's real live status from the same AXES data the
// board serves, three honest states, never a fabricated number:
//   · measured   (status MEASURED, separation determined) → "governance · measured · n=237"
//   · untested   (status MEASURED, separation UNTESTED)    → "jail · untested · n=71"
//   · unmeasured (status not MEASURED, or unknown axis)    → "<axis> · unmeasured"
// SEPARATED leads render green; a TIE (still a measured axis, but the point-estimate
// lead is not a measured advantage) renders lime — a visible, honest distinction.
//
// ?card=<hash> reflects one signed card's real state from /signed/card_index.json:
// "<axis> · signed" (green) when that card carries a signature, else grey. It never
// asserts the card verifies — that is the embed verify widget's job (real crypto).
//
// Formats:
//   (default)        → SVG (image/svg+xml), embeddable directly in a README or <img>
//   ?format=shields  → shields.io endpoint JSON {schemaVersion,label,message,color}
//                      use as https://img.shields.io/endpoint?url=<this-url>&format=shields
//   ?format=json     → the raw {measured,message,color,verify,public_count} object
//
// Doctrine: measurement, not certification. The badge is an image that points home
// to /gspc-verify, where the number is recomputable from its rows.

import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";

const AXES = [...AXES_A, ...AXES_B];

const boardCounts = () => {
  const m = AXES.filter((a) => a.status === "MEASURED");
  // Same derivation as functions/api/gspc.ts totals - never a typed slot count.
  const measured = m.filter((a) => a.separation !== "UNTESTED").length;
  const quotable = m.length;
  const publicCount = `${measured} measured of ${quotable} quotable`;
  const jailUntested = m.some((a) => a.axis === "jail" && a.separation === "UNTESTED");
  const defaultMessage = jailUntested
    ? `${publicCount}; jail floor untested`
    : publicCount;
  return { measured, quotable, publicCount, defaultMessage };
};

const VERIFY_URL = "https://councilof.ai/gspc-verify";
const GREY = "#9ca3af";
const GREEN = "#16a34a";
const LIME = "#65a30d";
const AMBER = "#ca8a04";

// One axis's honest live status, derived from the SAME AXES data GET /api/gspc
// serves. Three states only; n is the axis's real bank size, never invented.
type AxisBadge = { label: string; message: string; colour: string; state: string };
const axisBadge = (name: string): AxisBadge => {
  const a = AXES.find((x) => x.axis === name);
  if (!a) {
    // Unknown axis: honest grey, and the img still renders (a 404 would break it).
    return { label: name.slice(0, 40) || "axis", message: "not on the board", colour: GREY, state: "unknown" };
  }
  const label = a.axis;
  if (a.status !== "MEASURED") {
    return { label, message: "unmeasured", colour: GREY, state: "unmeasured" };
  }
  if (a.separation === "UNTESTED") {
    // Data present, separation test not yet run — quotable but not a measured axis.
    return { label, message: `untested · n=${a.n}`, colour: AMBER, state: "untested" };
  }
  // MEASURED with a determination. A TIE is still a measured axis (it counts in
  // public_count), but the lead is not separated — render lime, not green.
  const colour = a.separation === "SEPARATED" ? GREEN : LIME;
  return { label, message: `measured · n=${a.n}`, colour, state: "measured" };
};

const clampInt = (raw: string | null, fallback: number, max = 999): number => {
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : fallback;
};

// Colour ramp on the measured fraction: grey when nothing is measured, red→amber→green as
// coverage rises. Honest by construction — 0 measured is never green.
const colourFor = (measured: number, total: number): string => {
  if (measured <= 0 || total <= 0) return GREY;
  const frac = measured / total;
  if (frac >= 0.999) return "#16a34a"; // full — green
  if (frac >= 0.66) return "#65a30d"; // most — lime
  if (frac >= 0.34) return "#ca8a04"; // some — amber
  return "#dc2626"; // few — red
};

// Verdana-11 width estimate (shields uses the same font). Generous enough not to clip.
const textWidth = (s: string): number =>
  [...s].reduce((w, c) => w + (c === " " ? 3.5 : /[iIl.:'|]/.test(c) ? 3 : /[mwMW]/.test(c) ? 9 : 6.6), 0);

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const svgBadge = (label: string, message: string, colour: string): string => {
  const padH = 6;
  const lw = Math.ceil(textWidth(label)) + padH * 2;
  const mw = Math.ceil(textWidth(message)) + padH * 2;
  const w = lw + mw;
  const lx = (lw / 2) * 10;
  const mx = (lw + mw / 2) * 10;
  const lt = (textWidth(label)) * 10;
  const mt = (textWidth(message)) * 10;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="20" role="img" aria-label="${esc(label)}: ${esc(message)}">
  <title>${esc(label)}: ${esc(message)}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${lw}" height="20" fill="#555"/>
    <rect x="${lw}" width="${mw}" height="20" fill="${colour}"/>
    <rect width="${w}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110" text-rendering="geometricPrecision">
    <text aria-hidden="true" x="${lx}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${lt}">${esc(label)}</text>
    <text x="${lx}" y="140" transform="scale(.1)" fill="#fff" textLength="${lt}">${esc(label)}</text>
    <text aria-hidden="true" x="${mx}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${mt}">${esc(message)}</text>
    <text x="${mx}" y="140" transform="scale(.1)" fill="#fff" textLength="${mt}">${esc(message)}</text>
  </g>
</svg>`;
};

// One signed card's real state, read from the published card index. Never asserts
// the card verifies (the embed verify widget does that with real crypto) — only
// whether the index says a signature is attached.
const cardBadge = async (origin: string, hash: string): Promise<AxisBadge> => {
  const h = hash.toLowerCase().replace(/[^0-9a-f]/g, "").slice(0, 64);
  const label = "card";
  if (h.length < 6) return { label, message: "invalid ref", colour: GREY, state: "invalid" };
  try {
    const res = await fetch(new URL("/signed/card_index.json", origin).toString());
    if (!res.ok) return { label, message: "index unavailable", colour: GREY, state: "unavailable" };
    const idx = (await res.json()) as { cards?: { card: string; axis?: string; signed?: boolean }[] };
    const entry = (idx.cards || []).find((c) => typeof c.card === "string" && c.card.toLowerCase().startsWith(h));
    if (!entry) return { label, message: "not in index", colour: GREY, state: "not-found" };
    const axis = (entry.axis || "card").slice(0, 40);
    return entry.signed
      ? { label: axis, message: "signed", colour: GREEN, state: "signed" }
      : { label: axis, message: "unsigned", colour: GREY, state: "unsigned" };
  } catch {
    return { label, message: "index unavailable", colour: GREY, state: "unavailable" };
  }
};

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const format = url.searchParams.get("format");
  const svgHeaders = {
    "cache-control": "public, max-age=300",
    "access-control-allow-origin": "*",
  } as Record<string, string>;

  // ── Per-axis or per-card badge (real live status; never a fabricated number) ──
  const axisParam = url.searchParams.get("axis");
  const cardParam = url.searchParams.get("card");
  if (axisParam || cardParam) {
    const b = axisParam ? axisBadge(axisParam) : await cardBadge(url.origin, cardParam as string);
    if (format === "shields") {
      return new Response(
        JSON.stringify({ schemaVersion: 1, label: b.label, message: b.message, color: b.colour }),
        { headers: { ...svgHeaders, "content-type": "application/json; charset=utf-8" } },
      );
    }
    if (format === "json") {
      return new Response(
        JSON.stringify({ label: b.label, message: b.message, color: b.colour, state: b.state, verify: VERIFY_URL }, null, 2),
        { headers: { ...svgHeaders, "content-type": "application/json; charset=utf-8" } },
      );
    }
    return new Response(svgBadge(b.label, b.message, b.colour), {
      headers: { ...svgHeaders, "content-type": "image/svg+xml; charset=utf-8" },
    });
  }

  const board = boardCounts();
  const total = clampInt(url.searchParams.get("total"), board.quotable);
  // `measured` may be omitted (board default) or explicitly 0 for an unmeasured subject.
  const measured = url.searchParams.has("measured")
    ? clampInt(url.searchParams.get("measured"), 0, total)
    : board.measured;
  const label = (url.searchParams.get("label") || "GSPC").slice(0, 40);

  const isDefaultBoard = !url.searchParams.has("measured");
  const message = measured <= 0
    ? "unmeasured"
    : isDefaultBoard
      ? board.defaultMessage
      : `${measured} measured`;
  const colour = colourFor(measured, total);

  const headers = svgHeaders;

  if (format === "shields") {
    // shields.io endpoint schema — https://shields.io/badges/endpoint-badge
    return new Response(
      JSON.stringify({ schemaVersion: 1, label, message, color: measured <= 0 ? "lightgrey" : colour }),
      { headers: { ...headers, "content-type": "application/json; charset=utf-8" } },
    );
  }
  if (format === "json") {
    return new Response(
      JSON.stringify({
        measured,
        message,
        color: colour,
        verify: VERIFY_URL,
        public_count: board.publicCount,
        ruling: `${board.publicCount} (derived from GET /api/gspc totals; never typed)`,
      }, null, 2),
      { headers: { ...headers, "content-type": "application/json; charset=utf-8" } },
    );
  }

  return new Response(svgBadge(label, message, colour), {
    headers: { ...headers, "content-type": "image/svg+xml; charset=utf-8" },
  });
};
