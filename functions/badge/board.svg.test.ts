import { afterEach, describe, expect, it, vi } from "vitest";
import { handle, onRequestGet, readBoard, type BoardSource } from "./board.svg";
import { AXES_A } from "../api/_gspc_axes_a";
import { AXES_B } from "../api/_gspc_axes_b";
import { AXES_FIN } from "../api/_gspc_axes_fin";
import capture from "./__fixtures__/gspc-2026-09-05.json";

// A REAL capture of GET https://councilof.ai/api/gspc, read 2026-09-05 (66 KB, verbatim).
// The stub below is what a fetch of the board returned that day; nothing in it is typed here.
const CAPTURE = capture as { axes: Array<Record<string, unknown>>; totals: { lid: string; public_count: string }; measured_on: { date: string } };

const NOW = () => new Date("2026-09-05T15:00:00.000Z");
const ctx = (path: string) => ({ request: new Request(`https://councilof.ai${path}`), env: {}, waitUntil: () => {} });
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const stub = (body: unknown = CAPTURE, status = 200): BoardSource => async () => json(body, status);

const render = async (path: string, src: BoardSource = stub()) => {
  const r = await handle(ctx(path), src, NOW);
  return { r, svg: await r.text(), h: Object.fromEntries(r.headers.entries()) };
};

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

afterEach(() => vi.unstubAllGlobals());

describe("/badge/board.svg — the whole board as one image, derived and never typed", () => {
  it("renders 22 rows: axis, family, status verbatim, separation verbatim, n — from the capture", async () => {
    const { r, svg, h } = await render("/badge/board.svg");
    expect(r.status).toBe(200);
    expect(h["content-type"]).toMatch(/^image\/svg\+xml/);
    expect(h["cache-control"]).toBe("public, max-age=300");
    expect(h["x-gspc-board"]).toBe("derived");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toMatch(/width="1000"/);
    for (const a of CAPTURE.axes) {
      expect(svg).toContain(`>${a.axis}</text>`);
      expect(svg).toContain(`>${a.status}</text>`);
    }
    // one status dot per axis, and every one of today's 22 is a filled MEASURED dot
    expect(count(svg, /<circle /g)).toBe(CAPTURE.axes.length);
    expect(count(svg, /<circle [^>]*fill="#16a34a"/g)).toBe(CAPTURE.axes.filter((a) => a.status === "MEASURED").length);
    // separation verbatim: the capture's TIEs and SEPARATED appear as such
    expect(count(svg, />TIE</g)).toBe(CAPTURE.axes.filter((a) => a.separation === "TIE").length);
    expect(count(svg, />SEPARATED</g)).toBe(CAPTURE.axes.filter((a) => a.separation === "SEPARATED").length);
    // n verbatim: governance's 237 is there, right-aligned
    expect(svg).toMatch(/text-anchor="end"[^>]*>237<\/text>/);
  });

  it("captions with totals.lid VERBATIM and prints the derived totals beside totals.public_count", async () => {
    const { svg } = await render("/badge/board.svg");
    expect(svg).toContain(`>${CAPTURE.totals.lid}</text>`);
    const measured = CAPTURE.axes.filter((a) => a.status === "MEASURED").length;
    const unmeasured = CAPTURE.axes.filter((a) => a.status === "UNMEASURED").length;
    expect(svg).toContain(`${CAPTURE.axes.length} axes · ${measured} MEASURED · ${unmeasured} UNMEASURED · totals.public_count: &quot;${CAPTURE.totals.public_count}&quot;`);
    expect(svg).not.toContain("DISAGREES");
  });

  it("says so when the payload's public_count disagrees with its own rows", async () => {
    const forged = { ...CAPTURE, totals: { ...CAPTURE.totals, public_count: "22 axis · 15 measured" } };
    const { svg } = await render("/badge/board.svg", stub(forged));
    expect(svg).toContain("DISAGREES with the rows");
  });

  it("footers with as_of (measured_on.date verbatim) and the derived ISO instant", async () => {
    const { svg } = await render("/badge/board.svg");
    expect(svg).toContain(`as_of: ${CAPTURE.measured_on.date} · derived 2026-09-05T15:00:00.000Z`);
    expect(svg).toContain("measurement, not certification");
  });

  it("height follows the row count", async () => {
    const full = (await render("/badge/board.svg")).svg;
    const fewer = { ...CAPTURE, axes: CAPTURE.axes.slice(0, 5) };
    const short = (await render("/badge/board.svg", stub(fewer))).svg;
    const height = (s: string) => Number(/height="(\d+)"/.exec(s)?.[1]);
    expect(height(full) - height(short)).toBe((CAPTURE.axes.length - 5) * 26);
  });

  it("?compact=1 is one row per axis with a dot, in two columns, and shorter", async () => {
    const full = (await render("/badge/board.svg")).svg;
    const compact = (await render("/badge/board.svg?compact=1")).svg;
    const height = (s: string) => Number(/height="(\d+)"/.exec(s)?.[1]);
    expect(height(compact)).toBeLessThan(height(full));
    expect(count(compact, /<circle /g)).toBe(CAPTURE.axes.length);
    for (const a of CAPTURE.axes) expect(compact).toContain(`>${a.axis}</text>`);
    expect(compact).toContain(`>${CAPTURE.totals.lid}</text>`);
    expect(compact).toMatch(/width="1000"/);
  });

  it("?theme=light is the default (white ground); ?theme=dark exists; anything else is light", async () => {
    const dflt = (await render("/badge/board.svg")).svg;
    const light = (await render("/badge/board.svg?theme=light")).svg;
    const dark = (await render("/badge/board.svg?theme=dark")).svg;
    const junk = (await render("/badge/board.svg?theme=neon")).svg;
    expect(dflt).toMatch(/<rect width="1000" height="\d+" fill="#ffffff"\/>/);
    expect(light).toMatch(/fill="#ffffff"\/>/);
    expect(junk).toMatch(/fill="#ffffff"\/>/);
    expect(dark).not.toMatch(/fill="#ffffff"\/>/);
    // brand: no gradients, no animation, system font only
    for (const s of [dflt, dark]) {
      expect(s).not.toMatch(/gradient|animate|@keyframes|@import|url\(/i);
      expect(s).toContain("-apple-system");
    }
  });

  it("carries the CSOAI lid logo with the green O and nothing the doctrine forbids", async () => {
    const { svg } = await render("/badge/board.svg");
    expect(svg).toContain(`CS<tspan fill="#16a34a" font-weight="700">O</tspan>AI`);
    expect(svg).not.toMatch(/certified|\bBFT\b|sovereign|\$|USDC|£|price|grade|rank/i);
  });

  describe("absent is not zero", () => {
    it("an axis with no n renders — and no separation renders —, never 0", async () => {
      const gap = { ...CAPTURE, axes: [...CAPTURE.axes, { axis: "declared-slot-x", family: "gspc", kind: "declared-slot", status: "UNMEASURED" }] };
      const { svg } = await render("/badge/board.svg", stub(gap));
      const row = /declared-slot-x<\/text>(.*?)<line/.exec(svg)?.[1] ?? "";
      expect(row).toContain(">UNMEASURED</text>");
      expect(count(row, />—<\/text>/g)).toBe(2); // separation and n
      expect(row).not.toMatch(/>0<\/text>/);
      // the hollow dot, not the green one
      expect(svg).toMatch(/<circle [^>]*fill="none" stroke="#9ca3af"/);
      expect(svg).toContain("23 axes · 22 MEASURED · 1 UNMEASURED");
    });

    it.each([
      ["the source throws", async () => { throw new Error("edge cache exploded"); }, "GET /api/gspc threw: edge cache exploded"],
      ["the source answers 503", async () => json({ error: "1102" }, 503), "GET /api/gspc → HTTP 503"],
      ["the body is not JSON", async () => new Response("<html>", { status: 200 }), "GET /api/gspc body is not JSON"],
      ["there is no axes array", async () => json({ totals: { lid: "x" } }), "GET /api/gspc carries no axes array"],
      ["there is no totals.lid", async () => json({ axes: [] }), "GET /api/gspc carries no totals.lid"],
    ] as Array<[string, BoardSource, string]>)("renders unread — reason when %s, with no rows and no counts", async (_n, src, reason) => {
      const { r, svg, h } = await render("/badge/board.svg", src);
      expect(r.status).toBe(200); // an image, so the README shows the reason instead of a broken icon
      expect(h["cache-control"]).toBe("public, max-age=60");
      expect(h["x-gspc-board"]).toBe("unread");
      expect(svg).toContain(`unread — ${reason}`);
      expect(svg).toContain("not a board of zeros");
      expect(svg).not.toMatch(/MEASURED|<circle |axes ·/);
      expect(svg).not.toMatch(/>\d+<\/text>/);
    });
  });

  it("escapes anything the payload says", async () => {
    const hostile = { ...CAPTURE, axes: [{ axis: `<script>alert(1)</script>`, family: "gspc", status: `"><x`, n: 1 }] };
    const { svg } = await render("/badge/board.svg", stub(hostile));
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("&quot;&gt;&lt;x");
  });

  it("readBoard maps the capture's rows 1:1, in order", async () => {
    const read = await readBoard(stub(), ctx("/badge/board.svg"));
    expect("board" in read).toBe(true);
    if ("board" in read) {
      expect(read.board.axes.map((r) => r.axis)).toEqual(CAPTURE.axes.map((a) => a.axis));
      expect(read.board.lid).toBe(CAPTURE.totals.lid);
    }
  });

  it("by default reads the /api/gspc handler in-process: the rows are the handler's own axis roster, in order", async () => {
    // The real handler consults the edge cache; give it an empty one so it builds the board.
    vi.stubGlobal("caches", { default: { match: async () => undefined, put: async () => {} } });
    const r = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/badge/board.svg"),
      env: {},
      waitUntil: () => {},
    });
    const svg = await r.text();
    expect(r.headers.get("x-gspc-board")).toBe("derived");
    const ids = [...AXES_A, ...AXES_B, ...AXES_FIN].map((a) => a.axis);
    const inSvg = [...svg.matchAll(/<text x="56" y="\d+" font-size="13" fill="#111827">([^<]+)<\/text>/g)].map((m) => m[1]);
    expect(inSvg).toEqual(ids);
    // and the capture taken from production today lists the same roster — the image cannot drift from the board
    expect(inSvg).toEqual(CAPTURE.axes.map((a) => a.axis));
  });
});
