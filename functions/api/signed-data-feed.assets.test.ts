import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as feed } from "./signed-data-feed";

const ORIGIN = "https://councilof.ai";

const STATIC: Record<string, unknown> = {
  "/signals/_index.json": {
    schema: "csoai.signals-index/0.3",
    signals: [{ axis: "gov" }, { axis: "prv" }],
  },
  "/root.json": {
    as_of: "2026-09-22T08:54:02Z",
    card_count: 305,
    merkle_root: "a".repeat(64),
  },
  "/signed/card_index.json": {
    cards: [{ id: 1 }, { id: 2 }, { id: 3 }],
  },
};

function context(overrides: Record<string, unknown> = {}) {
  const assets = {
    fetch: async (input: Request | string) => {
      const url = new URL(input instanceof Request ? input.url : input);
      const row = STATIC[url.pathname];
      return row
        ? new Response(JSON.stringify(row), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        : new Response("missing", { status: 404 });
    },
  };
  return {
    request: new Request(ORIGIN + "/api/signed-data-feed"),
    env: { ASSETS: assets, ...overrides },
    params: {},
  } as never;
}

afterEach(() => vi.unstubAllGlobals());

describe("EUNOMIA source reads use the deployment substrate", () => {
  it("does not self-fetch public static assets through the zone", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("public self-fetch must not be needed");
    });

    const response = await feed(context());
    expect(response).toBeInstanceOf(Response);
    const body = await (response as Response).json();

    expect(body.kind).toBe("preview");
    expect(body.streams.signals).toMatchObject({
      rows: 2,
      schema: "csoai.signals-index/0.3",
    });
    expect(body.streams.root).toMatchObject({
      card_count: 305,
      merkle_root: "a".repeat(64),
    });
    expect(body.streams.card_index.rows).toBe(3);

    // /api/fines is invoked in-process. An unsigned deployment is honest but readable.
    expect(body.streams.first_fine_watch.unreadable).toBeUndefined();
    expect(body.streams.first_fine_watch.signed).toBe(false);
  });

  it("keeps an unavailable static source UNCHECKABLE rather than substituting zero", async () => {
    const assets = {
      fetch: async (input: Request | string) => {
        const url = new URL(input instanceof Request ? input.url : input);
        if (url.pathname === "/root.json") return new Response("missing", { status: 404 });
        const row = STATIC[url.pathname];
        return row
          ? new Response(JSON.stringify(row), { status: 200 })
          : new Response("missing", { status: 404 });
      },
    };
    const response = await feed({
      request: new Request(ORIGIN + "/api/signed-data-feed"),
      env: { ASSETS: assets },
      params: {},
    } as never);
    const body = await (response as Response).json();
    expect(body.streams.root.as_of).toBeNull();
    expect(body.streams.root.unreadable).toBe("HTTP 404");
  });
});
