// End to end through the REAL /api/gspc handler, in-process, as production runs it: the embed page,
// the feeds and the citation all print the count that handler serves, and none of them types one.
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as gspcGet } from "../api/gspc";
import { onRequest as embedBoard } from "./board";
import { onRequest as feedJson } from "../feeds/board.json";
import { onRequest as feedAtom } from "../feeds/board.atom";
import { onRequest as cite } from "../cite/gspc";

afterEach(() => vi.unstubAllGlobals());
const call = (h: unknown, path: string) =>
  (h as (c: unknown) => Promise<Response>)({ request: new Request(`https://councilof.ai${path}`), env: {}, waitUntil: () => {} });

describe("GSPC everywhere: every surface agrees with the live handler", () => {
  it("embed, JSON Feed, Atom and citation all carry the handler's own totals.public_count", async () => {
    vi.stubGlobal("caches", { default: { match: async () => undefined, put: async () => {} } });
    const live = await (await call(gspcGet, "/api/gspc")).json();
    const pc: string = live.totals.public_count;
    expect(typeof pc).toBe("string");
    const html = await (await call(embedBoard, "/embed/board")).text();
    expect(html).toContain(`data-field="public_count">${pc}</p>`);
    expect(html).toContain(`as_of: ${live.measured_on.date}`);
    const jf = JSON.parse(await (await call(feedJson, "/feeds/board.json")).text());
    expect(jf._gspc.live).toBe("derived");
    expect(jf._gspc.live_public_count).toBe(pc);
    expect(typeof jf._gspc.newest_signed_freeze_agrees).toBe("boolean");
    const atom = await (await call(feedAtom, "/feeds/board.atom")).text();
    expect(atom).toContain("<feed xmlns=\"http://www.w3.org/2005/Atom\">");
    const bib = await (await call(cite, "/cite/gspc")).text();
    expect(bib).toContain(pc);
    expect(bib).toContain(`doi       = {${live.doi}}`);
  });
});
