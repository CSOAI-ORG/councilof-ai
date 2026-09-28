import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RECORDS, measurementRecordEntries } from "./measurementRecords";
import { records } from "./records";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("signed measurement records in the records feed", () => {
  it("every published public/measurements/<kind>/<id>/record.json is listed (none left out silently)", () => {
    const onDisk: string[] = [];
    const base = join(ROOT, "public/measurements");
    for (const kind of readdirSync(base)) {
      const k = join(base, kind);
      if (!statSync(k).isDirectory()) continue; // loose files beside the record dirs are not page records
      for (const id of readdirSync(k)) if (existsSync(join(k, id, "record.json"))) onDisk.push(`/measurements/${kind}/${id}`);
    }
    expect(RECORDS.map((r) => r.route).sort()).toEqual(onDisk.sort());
  });

  it("each entry is copied from the published record bytes and the page head", () => {
    const heads = JSON.parse(readFileSync(join(ROOT, "client/src/data/seo-head.json"), "utf8")).routes;
    const entries = measurementRecordEntries();
    expect(entries.length).toBe(RECORDS.length);
    for (const e of entries) {
      const pub = JSON.parse(readFileSync(join(ROOT, `public${e.route}/record.json`), "utf8"));
      expect(e.as_of).toBe(pub.as_of);
      expect(e.subject_id).toBe(pub.capsules[0].subject_id);
      expect(e.state).toBe(pub.capsules[0].measurement_state);
      expect(e.description).toBe(heads[e.route].description);
      expect(e.url).toBe(`https://councilof.ai${e.route}/`);
      for (const f of ["record.json", "record.signed.json", "record.json.ots"]) expect(existsSync(join(ROOT, `public${e.route}/${f}`))).toBe(true);
    }
  });

  afterEach(() => vi.unstubAllGlobals());
  it("records() carries one measurement-record entry per record, dated by the record's own as_of", async () => {
    // Offline: the Hub tree answers empty, so no daily notes are read; corrections and evidence notes are local.
    vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { status: 200, headers: { "content-type": "application/json" } })));
    const ctx = { request: new Request("https://councilof.ai/feeds/records.xml"), env: {}, params: {}, waitUntil: () => {} } as never;
    const recs = await records(ctx);
    const mr = recs.filter((r) => r.kind === "measurement-record");
    expect(mr.map((r) => r.url).sort()).toEqual(measurementRecordEntries().map((e) => e.url).sort());
    for (const r of mr) expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
