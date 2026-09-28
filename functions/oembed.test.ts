import { describe, expect, it } from "vitest";
import { handle, embedSrcFor } from "./oembed";

const get = (qs: string, method = "GET") => handle(new Request(`https://councilof.ai/oembed?${qs}`, { method }));

describe("/oembed: oEmbed 1.0 for the GSPC board embed", () => {
  it("answers a rich iframe of /embed/board for the embed URL", async () => {
    const r = await get(`url=${encodeURIComponent("https://councilof.ai/embed/board")}&format=json`);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toMatch(/^application\/json/);
    expect(r.headers.get("access-control-allow-origin")).toBe("*");
    const o = await r.json();
    expect(o.version).toBe("1.0");
    expect(o.type).toBe("rich");
    expect(o.provider_url).toBe("https://councilof.ai/");
    expect(o.width).toBe(420);
    expect(o.height).toBe(200);
    expect(o.html).toMatch(/^<iframe src="https:\/\/councilof\.ai\/embed\/board" width="420" height="200"/);
    expect(o.html).not.toMatch(/<script/i);
  });
  it("carries no count, so a cached response can never go stale", async () => {
    const o = await (await get(`url=${encodeURIComponent("https://councilof.ai/gspc")}`)).json();
    expect(JSON.stringify(o)).not.toMatch(/\d+\s*(axis|axes)\b|measured/);
    expect(o.title).toBe("GSPC board: live data");
  });
  it("accepts /gspc, /gspc/, www, and passes a theme through; nothing else", () => {
    expect(embedSrcFor("https://councilof.ai/gspc")).toBe("https://councilof.ai/embed/board");
    expect(embedSrcFor("https://www.councilof.ai/gspc/")).toBe("https://councilof.ai/embed/board");
    expect(embedSrcFor("https://councilof.ai/embed/board?theme=dark")).toBe("https://councilof.ai/embed/board?theme=dark");
    expect(embedSrcFor("https://councilof.ai/embed/board?theme=<x>")).toBe("https://councilof.ai/embed/board");
    expect(embedSrcFor("https://evil.example/gspc")).toBeNull();
    expect(embedSrcFor("https://councilof.ai/pricing")).toBeNull();
    expect(embedSrcFor("javascript:alert(1)")).toBeNull();
    expect(embedSrcFor("not a url")).toBeNull();
  });
  it("honours maxwidth/maxheight within a floor", async () => {
    const o = await (await get(`url=${encodeURIComponent("https://councilof.ai/gspc")}&maxwidth=320&maxheight=170`)).json();
    expect([o.width, o.height]).toEqual([320, 170]);
    const tiny = await (await get(`url=${encodeURIComponent("https://councilof.ai/gspc")}&maxwidth=10&maxheight=10`)).json();
    expect([tiny.width, tiny.height]).toEqual([280, 160]);
    const big = await (await get(`url=${encodeURIComponent("https://councilof.ai/gspc")}&maxwidth=9999`)).json();
    expect(big.width).toBe(420);
  });
  it("speaks XML when asked", async () => {
    const r = await get(`url=${encodeURIComponent("https://councilof.ai/embed/board")}&format=xml`);
    expect(r.headers.get("content-type")).toMatch(/^text\/xml/);
    const x = await r.text();
    expect(x).toContain("<oembed>");
    expect(x).toContain("<type>rich</type>");
    expect(x).toContain("&lt;iframe src=&quot;https://councilof.ai/embed/board&quot;");
  });
  it("uses the spec's status codes: 400 missing url, 404 foreign url, 501 unknown format", async () => {
    expect((await get("")).status).toBe(400);
    expect((await get(`url=${encodeURIComponent("https://example.com/")}`)).status).toBe(404);
    expect((await get(`url=${encodeURIComponent("https://councilof.ai/gspc")}&format=yaml`)).status).toBe(501);
  });
  it("HEAD has headers and no body", async () => {
    const r = await get(`url=${encodeURIComponent("https://councilof.ai/gspc")}`, "HEAD");
    expect(r.status).toBe(200);
    expect(await r.text()).toBe("");
  });
});
