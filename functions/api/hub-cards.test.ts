import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./hub-cards";

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/hub-cards", () => {
  it("passes source metadata through and never coerces a truthy signing string", async () => {
    const row = {
      model: "example/model",
      axis: "safety",
      status: "UNMEASURED",
      accuracy: 0.5,
      n: 30,
      card_sha256: "a".repeat(64),
      card_url:
        "https://councilof.ai/interop/mill-cards-signed/signed-safety-aaaaaaaaaaaa.json",
      signed: "false",
      alg: "Ed25519",
      did: "did:web:csoai.org#board-attestation-1",
      verdict: "VALID",
      indexed: "2026-09-03T13:10:27Z",
      created: "2026-09-01T14:14:24Z",
      name_published: true,
      unmeasured: ["signed-pending-verify"],
    };
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/datasets/")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              sha: "1".repeat(40),
              lastModified: "2026-09-04T06:05:59.000Z",
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(
        new Response(`${JSON.stringify(row)}\n`, { status: 200 }),
      );
    });
    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    const response = await onRequestGet({} as Parameters<typeof onRequestGet>[0]);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      cells: Array<Record<string, unknown>>;
      source_revision: string;
      indexes: Array<Record<string, unknown>>;
    };
    expect(body.cells).toHaveLength(4);
    expect(body.source_revision).toBe("1".repeat(40));
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(
      fetchMock.mock.calls.slice(1).every(([url]) =>
        String(url).includes(`/resolve/${"1".repeat(40)}/mill-cards/`),
      ),
    ).toBe(true);
    expect(body.indexes.every((index) => index.state === "READ")).toBe(true);
    expect(body.cells[0]).toMatchObject({
      signed: false,
      alg: "Ed25519",
      did: "did:web:csoai.org#board-attestation-1",
      verdict: "VALID",
      indexed: "2026-09-03T13:10:27Z",
      created: "2026-09-01T14:14:24Z",
      name_published: true,
    });
  });

  it("distinguishes empty, malformed, HTTP-failed, and fetch-failed indexes", async () => {
    let indexCall = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        if (String(input).includes("/api/datasets/")) {
          return Promise.resolve(
            new Response(JSON.stringify({ sha: "2".repeat(40) }), {
              status: 200,
            }),
          );
        }
        indexCall++;
        if (indexCall === 1) return Promise.resolve(new Response("", { status: 200 }));
        if (indexCall === 2)
          return Promise.resolve(
            new Response(
              `${JSON.stringify({ model: "example/model", axis: "safety" })}\nnot-json\n`,
              { status: 200 },
            ),
          );
        if (indexCall === 3)
          return Promise.resolve(new Response("upstream error", { status: 502 }));
        return Promise.reject(new Error("network failed"));
      }),
    );

    const response = await onRequestGet({} as Parameters<typeof onRequestGet>[0]);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      cells: unknown[];
      counts: { indexes_read: number; malformed_rows: number };
      indexes: Array<{ state: string; malformed_rows: number }>;
    };
    expect(body.cells).toEqual([]);
    expect(body.counts).toMatchObject({ indexes_read: 2, malformed_rows: 2 });
    expect(body.indexes.map((index) => index.state)).toEqual([
      "READ_EMPTY",
      "READ_WITH_MALFORMED_ROWS",
      "HTTP_ERROR",
      "FETCH_ERROR",
    ]);
    expect(body.indexes[1].malformed_rows).toBe(2);
  });
});
