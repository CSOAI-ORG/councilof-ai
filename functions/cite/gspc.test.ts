import { describe, expect, it } from "vitest";
import { handle, bibtex, csl, pickFormat, BOARD_TITLE } from "./gspc";
import { factsFromPayload, type BoardSource } from "../_lib/gspcBoardFacts";
import capture from "../badge/__fixtures__/gspc-2026-09-05.json";

const CAPTURE = capture as any;
const NOW = () => new Date("2026-09-28T20:00:00Z");
const ctx = (qs = "", accept?: string) => ({
  request: new Request(`https://councilof.ai/cite/gspc${qs}`, accept ? { headers: { accept } } : {}),
  env: {},
  waitUntil: () => {},
});
const stub = (body: unknown = CAPTURE, status = 200): BoardSource => async () => new Response(JSON.stringify(body), { status });
const READ = factsFromPayload(CAPTURE);

describe("/cite/gspc: two references, each with what it is", () => {
  it("BibTeX: the live board by URL with the board's own count and as_of, plus the methodology DOI the board names", () => {
    const b = bibtex(READ, NOW());
    expect(b).toContain("@misc{csoai_gspc_board,");
    expect(b).toContain("url          = {https://councilof.ai/gspc}");
    expect(b).toContain("urldate      = {2026-09-28}");
    expect(b).toContain(CAPTURE.totals.public_count);
    expect(b).toContain(CAPTURE.measured_on.date);
    expect(b).toContain("as\\_of");
    expect(b).toContain(`doi       = {${CAPTURE.doi}}`);
    expect(b).toContain("it is not the live numbers");
    // balanced braces or the .bib file will not parse
    expect((b.match(/{/g) ?? []).length).toBe((b.match(/}/g) ?? []).length);
  });
  it("CSL-JSON: two items, dataset type, accessed date-parts, DOI only on the methodology record", () => {
    const c = csl(READ, NOW());
    expect(c.map((x) => x.id)).toEqual(["csoai_gspc_board", "csoai_gspc_methodology"]);
    expect(c[0].type).toBe("dataset");
    expect(c[0].title).toBe(BOARD_TITLE);
    expect(c[0].accessed).toEqual({ "date-parts": [[2026, 9, 28]] });
    expect(c[0].DOI).toBeUndefined();
    expect(c[1].DOI).toBe(CAPTURE.doi);
    expect(c[1].title).toBe(CAPTURE.doi_note.split(" (")[0]);
  });
  it("format by query or by Accept, as doi.org negotiates", () => {
    expect(pickFormat(ctx().request)).toBe("bibtex");
    expect(pickFormat(ctx("?format=csl").request)).toBe("csl");
    expect(pickFormat(ctx("?format=json").request)).toBe("json");
    expect(pickFormat(ctx("", "application/vnd.citationstyles.csl+json").request)).toBe("csl");
    expect(pickFormat(ctx("?format=ris").request)).toBeNull();
  });
  it("serves each format with its media type; 400 on an unknown one", async () => {
    const b = await handle(ctx(), stub(), NOW);
    expect(b.headers.get("content-type")).toMatch(/^text\/plain/);
    const bx = await handle(ctx("", "application/x-bibtex"), stub(), NOW);
    expect(bx.headers.get("content-type")).toMatch(/^application\/x-bibtex/);
    const c = await handle(ctx("?format=csl"), stub(), NOW);
    expect(c.headers.get("content-type")).toMatch(/^application\/vnd\.citationstyles\.csl\+json/);
    expect(Array.isArray(await c.json())).toBe(true);
    const j = await (await handle(ctx("?format=json"), stub(), NOW)).json();
    expect(j.board.public_count).toBe(CAPTURE.totals.public_count);
    expect(j.text).toContain("https://councilof.ai/gspc");
    expect((await handle(ctx("?format=ris"), stub(), NOW)).status).toBe(400);
  });
  it("unread board: the URL reference survives, the count does not, and no DOI is invented", async () => {
    const j = await (await handle(ctx("?format=json"), stub({}, 502), NOW)).json();
    expect(j.board.read).toBe("unread");
    expect(j.csl_json.length).toBe(1);
    expect(j.bibtex).toContain("unread at access");
    expect(j.bibtex).not.toContain("doi ");
  });
  it("no rank, grade, score, badge or certification claim in any output", async () => {
    const j = await (await handle(ctx("?format=json"), stub(), NOW)).text();
    expect(j).not.toMatch(/\b(certified|certify|ranked|rank|grade[ds]?|scores?|badge)\b/i);
  });
});
