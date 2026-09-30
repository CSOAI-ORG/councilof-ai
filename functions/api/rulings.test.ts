// GET /api/rulings, checked with the code a request runs, over the committed records.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildResponse, checkSigned, onRequestGet } from "./rulings";

const DIR = resolve(__dirname, "../../public/signed/rulings");
const ids = readdirSync(DIR).filter((f) => /^R-.*\.json$/.test(f)).map((f) => f.replace(/\.json$/, "")).sort();

describe("GET /api/rulings", () => {
  it("lists every record file, each VALID, under a VALID index", async () => {
    const { status, body } = await buildResponse(null);
    expect(status).toBe(200);
    const b = body as { count: number; index_signature_state: string; read_only: boolean; rulings: { signature_state: string; record: { ruling_id: string } }[] };
    expect(b.read_only).toBe(true);
    expect(b.count).toBe(ids.length);
    expect(b.index_signature_state).toBe("VALID");
    expect(b.rulings.map((x) => x.record.ruling_id)).toEqual(ids);
    for (const x of b.rulings) expect(x.signature_state, x.record.ruling_id).toBe("VALID");
  });

  it("?id= returns one record; an unknown id is 404", async () => {
    const one = await buildResponse(ids[0]);
    expect(one.status).toBe(200);
    expect((one.body as { signature_state: string }).signature_state).toBe("VALID");
    expect((await buildResponse("R-1999-0101-01")).status).toBe(404);
  });

  it("a served record edited after signing reads STALE, not VALID", async () => {
    const r = JSON.parse(readFileSync(join(DIR, `${ids[0]}.json`), "utf8"));
    r.question += " (edited)";
    expect((await checkSigned(r, "record")).state).toBe("STALE");
  });

  it("the handler answers GET and has no write verb", async () => {
    const res = await onRequestGet({ request: new Request("https://councilof.ai/api/rulings") } as never);
    expect(res.status).toBe(200);
    const mod = await import("./rulings");
    expect("onRequestPost" in mod).toBe(false);
    expect("onRequestPut" in mod).toBe(false);
  });
});
