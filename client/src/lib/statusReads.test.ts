import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readBytes, readJson } from "./statusReads";

const READ_AT = "2026-11-08T11:30:00.000Z";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(READ_AT));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("live status reads", () => {
  it.each(["Failed to fetch", "fetch failed"])(
    "keeps a JSON transport failure unknown without publishing %s",
    async (message) => {
      const fetcher = vi.fn().mockRejectedValue(new TypeError(message));
      vi.stubGlobal("fetch", fetcher);
      expect(await readJson("/api/health")).toEqual({
        ok: false, error: "source request unavailable", readAt: READ_AT,
      });
      expect(fetcher).toHaveBeenCalledWith("/api/health", {
        cache: "no-store", headers: { accept: "application/json" },
      });
    },
  );

  it("keeps a byte transport failure unread, with its attempted read time", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    expect(await readBytes("/proof.ots")).toEqual({
      ok: false, error: "source request unavailable", readAt: READ_AT,
    });
  });

  it.each([readJson, readBytes])("retains an actual HTTP failure", async (read) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    expect(await read("/source")).toEqual({ ok: false, error: "HTTP 503", readAt: READ_AT });
  });

  it("does not promote malformed JSON to a successful read", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>not JSON</html>")));
    expect(await readJson("/api/state")).toEqual({
      ok: false, error: "source response could not be decoded", readAt: READ_AT,
    });
  });

  it.each([{ body: null }, { body: [] }, { body: "not an object" }, { body: 0 }, { body: false }])(
    "keeps a non-object JSON body unread instead of exposing $body as component data",
    async ({ body }) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
      expect(await readJson("/api/health")).toEqual({
        ok: false, error: "source response did not contain an object", readAt: READ_AT,
      });
    },
  );

  it("preserves successful JSON, measured zero and existing request options", async () => {
    const body = { one_number: { all_time: 0, settlements: 0 } };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)));
    vi.stubGlobal("fetch", fetcher);
    expect(await readJson("/api/revenue", {
      headers: { accept: "application/vnd.github+json" },
    })).toEqual({ ok: true, body, readAt: READ_AT });
    expect(fetcher).toHaveBeenCalledWith("/api/revenue", {
      cache: "no-store", headers: { accept: "application/vnd.github+json" },
    });
  });

  it("preserves successful proof bytes and the no-store request", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(new Uint8Array([0, 1, 255])));
    vi.stubGlobal("fetch", fetcher);
    expect(await readBytes("/proof.ots")).toEqual({
      ok: true, body: new Uint8Array([0, 1, 255]), readAt: READ_AT,
    });
    expect(fetcher).toHaveBeenCalledWith("/proof.ots", { cache: "no-store" });
  });

  it("keeps a failed response-body read unread", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.reject(new TypeError("fetch failed")),
    }));
    expect(await readBytes("/proof.ots")).toEqual({
      ok: false, error: "source request unavailable", readAt: READ_AT,
    });
  });
});
