/**
 * counts.test.ts — the count grammar door never invents, never sums, never reconciles.
 *
 * Fixture-backed: env.ASSETS serves small fixture docs in the shape of the real files. Every
 * assertion reads the served bytes; a NOT_READ must appear as a state, never as a zero or a
 * fabricated number; and the doc must contain no total of the figures, because the figures
 * count different things (the whole point of the door).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { onRequestGet, COUNTS_SCHEMA } from "./counts";

type Ctx = Parameters<typeof onRequestGet>[0];

const FIXTURES: Record<string, unknown> = {
  "/interop/models-measured.json": {
    schema: "csoai.models-measured/0.1",
    headline: { third_party_models: 165, own_models_excluded: 48, as_of: "2026-11-01" },
    models: Array.from({ length: 165 }, () => ({ kind: "third_party" })),
  },
  "/signed/card-matrix.json": { counts: { models: 13, models_third_party: 10, models_own: 3, models_own_unconfirmed: 3 } },
  "/independence/own-model-disclosure.json": { rules: [{ model_tags: 30 }, { model_tags: 18 }], unconfirmed: { tags: ["a", "b", "c"] } },
  "/root.json": { card_count: 428, as_of: "2026-11-01T15:09:42Z" },
  "/signed/card_index.json": { n_cards: 335, packaged_at: "2026-08-28T15:39:25Z" },
};

let assets: Map<string, unknown>;
beforeEach(() => {
  assets = new Map(Object.entries(FIXTURES));
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
});

const call = async (headers: Record<string, string> = {}) => {
  const env = {
    ASSETS: {
      fetch: async (req: Request) => {
        const path = new URL(req.url).pathname;
        if (!assets.has(path)) return new Response("not found", { status: 404 });
        return new Response(JSON.stringify(assets.get(path)), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  };
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/counts", { method: "GET", headers }),
    env,
    waitUntil: () => undefined,
  } as unknown as Ctx);
  return res;
};

const figure = (doc: { figures: { name: string; value: number | null; state: string; as_of?: string }[] }, name: string) =>
  doc.figures.find((f) => f.name === name);

describe("GET /api/counts", () => {
  it("serves the schema and every fixture figure as READ with its source and as_of", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    const doc = JSON.parse(await res.text());
    expect(doc.schema).toBe(COUNTS_SCHEMA);
    expect(doc.doctrine).toContain("measurement, not endorsement");
    const mm = figure(doc, "models_third_party_frozen_banks");
    expect(mm?.state).toBe("READ");
    expect(mm?.value).toBe(165);
    expect(mm?.as_of).toBe("2026-11-01");
    const root = figure(doc, "root_card_count");
    expect(root?.value).toBe(428);
    expect(root?.as_of).toBe("2026-11-01T15:09:42Z");
    const idx = figure(doc, "card_index_declared");
    expect(idx?.value).toBe(335);
    expect(doc.board_count_line).toMatch(/measured/);
  });

  it("a file that disagrees with its own headline is NOT_READ with a reason — never the headline anyway", async () => {
    assets.set("/interop/models-measured.json", { headline: { third_party_models: 165 }, models: [{ kind: "third_party" }] });
    const doc = JSON.parse(await (await call()).text());
    const mm = figure(doc, "models_third_party_frozen_banks");
    expect(mm?.state).toBe("NOT_READ");
    expect(mm?.value).toBeNull();
    expect(mm?.reason).toBeTruthy();
  });

  it("a missing file is NOT_READ — never a zero", async () => {
    assets.delete("/root.json");
    const doc = JSON.parse(await (await call()).text());
    const root = figure(doc, "root_card_count");
    expect(root?.state).toBe("NOT_READ");
    expect(root?.value).toBeNull();
  });

  it("disagreeing surfaces are reported as a relationship, not reconciled", async () => {
    const doc = JSON.parse(await (await call()).text());
    const rel = doc.relationships[0];
    expect(rel.surfaces).toEqual(["root_card_count", "card_index_declared"]);
    expect(rel.relationship).toContain("never summed");
  });

  it("the doc contains no total of the figures — the figures count different things", async () => {
    const text = await (await call()).text();
    expect(text).not.toMatch(/"total/i);
    expect(text).not.toMatch(/"sum"/i);
  });

  it("serves an ETag over the exact bytes and 304s a matching If-None-Match", async () => {
    const first = await call();
    const etag = first.headers.get("etag");
    expect(etag).toMatch(/^"[0-9a-f]{64}"$/);
    const second = await call({ "if-none-match": etag as string });
    expect(second.status).toBe(304);
    expect(await second.text()).toBe("");
  });
});
