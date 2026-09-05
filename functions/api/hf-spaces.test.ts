// The org catalogue must not report "0 models" because HF throttled one call.
//
// `fetchJSON` returned [] on any non-OK response and `counts` was the .length of
// whatever survived, with nothing in the payload to separate "csoai publishes no
// models" from "that request failed". Same shape as the /api/hub-cards defect:
// a fan-out totalling whatever came back.

import { afterEach, describe, expect, it, vi } from "vitest";

import { onRequestGet } from "./hf-spaces";

const listing = (n: number, prefix: string) =>
  Array.from({ length: n }, (_, i) => ({ id: `csoai/${prefix}-${i}`, likes: 0 }));

/** Answer each HF listing, except those named in `broken`. */
const installFetch = (broken: string[] = [], status = 429) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const kind = url.includes("/api/spaces")
        ? "spaces"
        : url.includes("/api/datasets")
          ? "datasets"
          : "models";
      if (broken.includes(kind)) return new Response("slow down", { status });
      const n = { spaces: 39, datasets: 97, models: 2 }[kind] as number;
      return Response.json(listing(n, kind));
    }),
  );
};

const invoke = async () => {
  const res = await onRequestGet({} as never);
  return { res, body: (await res.json()) as Record<string, never> };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("/api/hf-spaces", () => {
  it("counts the catalogue when every listing answered", async () => {
    installFetch([]);
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;

    expect(counts).toMatchObject({ spaces: 39, datasets: 97, models: 2, complete: true });
    expect(counts.listings_unread).toEqual([]);
  });

  // THE DEFECT. Today this publishes `models: 0`, indistinguishable from the
  // true statement that the org has no models.
  it("withholds a count rather than publishing 0 for a listing that failed", async () => {
    installFetch(["models"]);
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;

    expect(counts.models).toBeNull();
    expect(counts.models).not.toBe(0);
    expect(counts.complete).toBe(false);
    expect(counts.listings_unread).toEqual([{ listing: "models", reason: "http 429" }]);
    // the listings that DID answer keep their real counts
    expect(counts.spaces).toBe(39);
    expect(counts.datasets).toBe(97);
  });

  it("still reports a genuinely empty listing as 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/models")) return Response.json([]);
        return Response.json(listing(3, "x"));
      }),
    );
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;

    expect(counts.models).toBe(0);
    expect(counts.complete).toBe(true);
  });
});
