import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GspcStreamError,
  parseAguiGspcSse,
  parseGspcChatObservation,
  readAguiGspcOnce,
} from "./aguiGspcRead";
import {
  encodeAguiGspcSse,
  snapshotFromGspcPayload,
  type GspcLiveSnapshot,
} from "./aguiGspcStream";

const WIRE = {
  totals: {
    axes: 3,
    measured_axes: 2,
    unmeasured_axes: 1,
    public_count: "3 axis · 2 measured",
    count_grammar:
      "3 axis are declared; 2 carry a measurement and 1 stays empty.",
  },
  axes: [
    {
      axis: "governance-🧭",
      status: "MEASURED",
      family: "gspc",
      kind: "model-comparison",
      n: 37,
      accuracy: 0.73,
      separation: "SEPARATED",
    },
    {
      axis: "provenance-controls",
      status: "MEASURED",
      family: "financial",
      kind: "deterministic-facts",
      n: 6,
      accuracy: null,
      separation: null,
    },
    {
      axis: "reserve-attestation",
      status: "UNMEASURED",
      family: "financial",
      kind: "deterministic-facts",
      n: null,
      accuracy: null,
      separation: null,
    },
  ],
};

const snapshot = (): GspcLiveSnapshot => snapshotFromGspcPayload(WIRE);

function responseWithChunks(
  chunks: Uint8Array[],
  contentType = "text/event-stream; charset=utf-8",
): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
    { headers: { "content-type": contentType } },
  );
}

function caughtParse(body: string): GspcStreamError {
  try {
    parseAguiGspcSse(body);
  } catch (error) {
    expect(error).toBeInstanceOf(GspcStreamError);
    return error as GspcStreamError;
  }
  throw new Error("Expected parseAguiGspcSse to reject the fixture");
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("parseAguiGspcSse", () => {
  it("accepts the finite projection pair and preserves a measured null accuracy", () => {
    const parsed = parseAguiGspcSse(encodeAguiGspcSse(snapshot()));

    expect(parsed.public_count).toBe("3 axis · 2 measured");
    expect(parsed.measured.map((row) => row.axis)).toEqual([
      "governance-🧭",
      "provenance-controls",
    ]);
    expect(
      parsed.measured.find((row) => row.axis === "provenance-controls")
        ?.accuracy,
    ).toBeNull();
    expect(parsed.empty).toEqual([
      expect.objectContaining({
        axis: "reserve-attestation",
        status: "UNMEASURED",
        accuracy: null,
      }),
    ]);
  });

  it.each([
    [
      "an incomplete pair",
      () =>
        encodeAguiGspcSse(snapshot()).split("event: TEXT_MESSAGE_CONTENT")[0],
    ],
    [
      "mismatched presentation text",
      () =>
        encodeAguiGspcSse(snapshot()).replace(
          "Empty stays empty. Not a certificate.",
          "Everything passed.",
        ),
    ],
    [
      "malformed event JSON",
      () =>
        encodeAguiGspcSse(snapshot()).replace(
          '"type":"STATE_DELTA"',
          '"type":',
        ),
    ],
    [
      "an unapproved patch path",
      () =>
        encodeAguiGspcSse(snapshot()).replace(
          '"path":"/gspc/public_count"',
          '"path":"/gspc/claimed_compliance"',
        ),
    ],
  ])("fails closed on %s", (_label, makeBody) => {
    expect(caughtParse(makeBody()).state).toBe("unchecked");
  });

  it("rejects duplicate axes and any source other than the living wire", () => {
    const duplicate = snapshot();
    duplicate.measured.push({ ...duplicate.measured[0] });
    expect(caughtParse(encodeAguiGspcSse(duplicate)).state).toBe("unchecked");

    const disallowed = {
      ...snapshot(),
      source: "remembered-cache",
    } as unknown as GspcLiveSnapshot;
    expect(caughtParse(encodeAguiGspcSse(disallowed)).state).toBe("unchecked");
  });

  it("rejects a body over the bounded projection size", () => {
    const oversized = "x".repeat(128 * 1024 + 1);
    expect(caughtParse(oversized).state).toBe("unchecked");
  });
});

describe("readAguiGspcOnce", () => {
  it("decodes CRLF delivered one byte at a time, including split UTF-8", async () => {
    const crlf = encodeAguiGspcSse(snapshot()).replace(/\n/g, "\r\n");
    const bytes = new TextEncoder().encode(crlf);
    const chunks = Array.from(bytes, (_byte, index) =>
      bytes.slice(index, index + 1),
    );
    const fetchImpl = vi.fn(async () => responseWithChunks(chunks));

    const observed = await readAguiGspcOnce(
      fetchImpl as unknown as typeof fetch,
      { timeoutMs: 1_000 },
    );

    expect(observed.snapshot.measured[0].axis).toBe("governance-🧭");
    expect(observed.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/agui/gspc-state",
      expect.objectContaining({
        cache: "no-store",
        headers: { accept: "text/event-stream" },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("distinguishes HTTP reachability failure from a non-SSE response", async () => {
    const unavailable = vi.fn(
      async () => new Response("upstream unavailable", { status: 503 }),
    );
    await expect(
      readAguiGspcOnce(unavailable as unknown as typeof fetch),
    ).rejects.toMatchObject({
      state: "unreachable",
      message: expect.stringContaining("HTTP 503"),
    });
    expect(unavailable).toHaveBeenCalledTimes(1);

    const wrongType = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: { "content-type": "application/json" },
        }),
    );
    await expect(
      readAguiGspcOnce(wrongType as unknown as typeof fetch),
    ).rejects.toMatchObject({ state: "unchecked" });
    expect(wrongType).toHaveBeenCalledTimes(1);
  });

  it("bounds bytes while reading and never retries an invalid response", async () => {
    const bytes = new TextEncoder().encode("x".repeat(128 * 1024 + 1));
    const fetchImpl = vi.fn(async () => responseWithChunks([bytes]));

    await expect(
      readAguiGspcOnce(fetchImpl as unknown as typeof fetch),
    ).rejects.toMatchObject({ state: "unchecked" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("cancels a stalled reader on timeout and does not retry", async () => {
    vi.useFakeTimers();
    let cancellations = 0;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode("event: STATE_DELTA\ndata: {}\n\n"),
        );
      },
      cancel() {
        cancellations += 1;
      },
    });
    const fetchImpl = vi.fn(
      async () =>
        new Response(stream, {
          headers: { "content-type": "text/event-stream" },
        }),
    );

    const pending = readAguiGspcOnce(fetchImpl as unknown as typeof fetch, {
      timeoutMs: 25,
    });
    const rejection = expect(pending).rejects.toMatchObject({
      state: "unreachable",
      message: expect.stringContaining("stopped before it completed"),
    });
    await vi.advanceTimersByTimeAsync(26);
    await rejection;

    expect(cancellations).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not retry a rejected connection", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("network down");
    });

    await expect(
      readAguiGspcOnce(fetchImpl as unknown as typeof fetch),
    ).rejects.toMatchObject({ state: "unreachable" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("parseGspcChatObservation", () => {
  it("restores only a dated, wire-derived observation", () => {
    const value = {
      observedAt: "2026-09-05T03:45:00.000Z",
      snapshot: snapshot(),
    };
    expect(parseGspcChatObservation(value)).toEqual(value);
    expect(
      parseGspcChatObservation({ ...value, observedAt: "sometime today" }),
    ).toBeUndefined();
    expect(
      parseGspcChatObservation({
        ...value,
        snapshot: { ...value.snapshot, source: "session-cache" },
      }),
    ).toBeUndefined();
  });
});
