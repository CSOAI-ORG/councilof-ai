import { describe, expect, it } from "vitest";
import { handle, onRequest, EMBED_WIDTH, EMBED_HEIGHT } from "./board";
import { factsFromPayload, readBoardFacts, methodologyTitle, type BoardSource } from "../_lib/gspcBoardFacts";
import capture from "../badge/__fixtures__/gspc-2026-09-05.json";

// A REAL capture of GET https://councilof.ai/api/gspc (2026-09-05), shared with /badge/board.svg's tests.
const CAPTURE = capture as { totals: { public_count: string; separation_public_count?: string }; measured_on: { date: string }; doi: string; doi_note: string };
const ctx = (path: string, method = "GET") => ({ request: new Request(`https://councilof.ai${path}`, { method }), env: {}, waitUntil: () => {} });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const stub = (body: unknown = CAPTURE, status = 200): BoardSource => async () => json(body, status);
// Doctrine: no certification verbs, no rank, no grade, no score, no badge in anything a visitor sees.
const DOCTRINE = /\b(certified|certify|certificate|ranked|ranking|rank|grade[ds]?|scores?|scored|badge|pass(?:ed)?|fail(?:ed)?)\b/i;
const visibleText = (html: string) => html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");

describe("gspcBoardFacts: the board's own fields, verbatim, or unread", () => {
  it("reads public_count, as_of, separation and doi from the capture without retyping them", () => {
    const r = factsFromPayload(CAPTURE);
    expect("facts" in r).toBe(true);
    if (!("facts" in r)) return;
    expect(r.facts.public_count).toBe(CAPTURE.totals.public_count);
    expect(r.facts.as_of).toBe(CAPTURE.measured_on.date);
    expect(r.facts.doi).toBe(CAPTURE.doi);
    expect(methodologyTitle(r.facts)).toBe(CAPTURE.doi_note.split(" (")[0]);
  });
  it("absent public_count, non-200, non-JSON and a throwing source are all unread, never zero", async () => {
    const noCount = JSON.parse(JSON.stringify(CAPTURE));
    delete noCount.totals.public_count;
    expect(factsFromPayload(noCount)).toEqual({ unread: "GET /api/gspc carries no totals.public_count" });
    expect(await readBoardFacts(stub(CAPTURE, 503), ctx("/"))).toEqual({ unread: "GET /api/gspc → HTTP 503" });
    const notJson: BoardSource = async () => new Response("<html>", { status: 200 });
    expect(await readBoardFacts(notJson, ctx("/"))).toEqual({ unread: "GET /api/gspc body is not JSON" });
    const boom: BoardSource = async () => { throw new Error("edge down"); };
    expect(await readBoardFacts(boom, ctx("/"))).toEqual({ unread: "GET /api/gspc threw: edge down" });
  });
});

describe("/embed/board: framable, script-free, live totals only", () => {
  it("renders public_count, as_of and the link verbatim from the board", async () => {
    const r = await handle(ctx("/embed/board"), stub());
    const html = await r.text();
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toMatch(/^text\/html/);
    expect(r.headers.get("x-gspc-board")).toBe("derived");
    expect(html).toContain(`data-field="public_count">${CAPTURE.totals.public_count}</p>`);
    expect(html).toContain(`as_of: ${CAPTURE.measured_on.date}`);
    expect(html).toContain('href="https://councilof.ai/gspc"');
    expect(html).toContain("Live data from the GSPC board");
    expect(html).toContain("measurement, not certification");
  });
  it("is framable by any origin and runs no script", async () => {
    const r = await handle(ctx("/embed/board"), stub());
    const csp = r.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("frame-ancestors *");
    expect(csp).toContain("default-src 'none'");
    expect(r.headers.get("x-frame-options")).toBeNull();
    const html = await r.text();
    expect(html).not.toMatch(/<script/i);
  });
  it("advertises oEmbed and both board-change feeds", async () => {
    const r = await handle(ctx("/embed/board"), stub());
    const html = await r.text();
    expect(html).toContain('type="application/json+oembed" href="https://councilof.ai/oembed?url=https%3A%2F%2Fcouncilof.ai%2Fembed%2Fboard&amp;format=json"');
    expect(html).toContain('type="application/feed+json" href="https://councilof.ai/feeds/board.json"');
    expect(html).toContain('type="application/atom+xml" href="https://councilof.ai/feeds/board.atom"');
    expect(r.headers.get("link")).toContain('rel="alternate"; type="application/json+oembed"');
  });
  it("unread board → says unread, shows no count, heals in 60 s", async () => {
    const r = await handle(ctx("/embed/board"), stub(CAPTURE, 500));
    const html = await r.text();
    expect(r.status).toBe(200);
    expect(r.headers.get("x-gspc-board")).toBe("unread");
    expect(r.headers.get("cache-control")).toBe("public, max-age=60");
    expect(html).toContain("unread");
    expect(html).toContain("HTTP 500");
    expect(html).not.toContain(CAPTURE.totals.public_count);
    expect(html).not.toMatch(/data-field="public_count"/);
  });
  it("escapes whatever the payload carries", async () => {
    const evil = JSON.parse(JSON.stringify(CAPTURE));
    evil.totals.public_count = '<img src=x onerror=alert(1)>';
    const html = await (await handle(ctx("/embed/board"), stub(evil))).text();
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
  it("theme is fixed only when asked; default follows the reader's scheme", async () => {
    const auto = await (await handle(ctx("/embed/board"), stub())).text();
    expect(auto).toContain("prefers-color-scheme: dark");
    const dark = await (await handle(ctx("/embed/board?theme=dark"), stub())).text();
    expect(dark).not.toContain("prefers-color-scheme");
    expect(dark).toContain("--bg:#0f1412");
  });
  it("carries no rank, grade, score, badge or certification wording in its visible text", async () => {
    for (const s of [stub(), stub(CAPTURE, 500)]) {
      const html = await (await handle(ctx("/embed/board"), s)).text();
      expect(visibleText(html)).not.toMatch(DOCTRINE);
    }
  });
  it("answers HEAD with no body and refuses POST", async () => {
    const h = await handle(ctx("/embed/board", "HEAD"), stub());
    expect(h.status).toBe(200);
    expect(await h.text()).toBe("");
    const p = await onRequest({ request: new Request("https://councilof.ai/embed/board", { method: "POST" }) } as never);
    expect(p.status).toBe(405);
  });
  it("declares the size the oEmbed endpoint hands out", () => {
    expect(EMBED_WIDTH).toBe(420);
    expect(EMBED_HEIGHT).toBe(200);
  });
});
