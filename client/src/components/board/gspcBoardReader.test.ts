import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGspcBoardReader,
  validateGspcPayload,
  type GspcPayload,
} from "./useGspcBoard";

// Dated minimal projection observed 2026-10-08T04:38:12.810Z, not a full response or live fallback.
const OBSERVED_AT = "2026-10-08T04:38:12.810Z";
const LATER_READ = "2026-10-08T04:40:12.810Z";
function observedProjection(): GspcPayload {
  const comparisonRows: Array<[string, number, "TIE" | "UNTESTED"]> = [
    ["governance", 237, "TIE"],
    ["safety", 36, "TIE"],
    ["provenance", 32, "TIE"],
    ["continuity", 33, "TIE"],
    ["conformance", 35, "TIE"],
    ["openness", 32, "TIE"],
    ["machinery-conformity", 33, "UNTESTED"],
    ["care", 199, "TIE"],
    ["cross-reality", 32, "UNTESTED"],
    ["detector-interop", 33, "UNTESTED"],
    ["art5-safeguard", 36, "UNTESTED"],
    ["swarm", 37, "UNTESTED"],
    ["affect", 41, "UNTESTED"],
    ["jail", 71, "UNTESTED"],
  ];
  const comparisons = comparisonRows.map(([axis, n, separation]) => ({
    axis,
    n,
    separation,
    family: "gspc",
    kind: "model-comparison",
    status: "MEASURED",
  }));
  const factRows: Array<[string, number, "gspc" | "financial"]> = [
    ["effect-binding", 261, "gspc"],
    ["provenance-controls", 6, "financial"],
    ["reserve-attestation", 16, "financial"],
    ["regulatory-framework", 16, "financial"],
    ["distribution-integrity", 16, "financial"],
    ["custody-disclosure", 16, "financial"],
    ["ai-adoption-components", 2, "financial"],
    ["labour-components", 2, "financial"],
    ["humanoid-labour-index", 8, "financial"],
  ];
  const facts = factRows.map(([axis, n, family]) => ({
    axis,
    n,
    family,
    kind: "deterministic-facts",
    status: "MEASURED",
  }));
  return {
    schema: "csoai.gspc-axes/0.5",
    totals: {
      axes: 23,
      measured_axes: 23,
      unmeasured_axes: 0,
      comparison_axes: 14,
      fact_runs: 9,
      separated_leads: 0,
      ties: 7,
      untested_separations: 7,
      public_count: "23 axes · 23 measured",
    },
    axes: [...comparisons, ...facts],
  } as GspcPayload;
}
function futureProjection(): GspcPayload {
  const d = observedProjection();
  d.axes!.push({
    axis: "future-slot",
    kind: "declared-slot",
    status: "UNMEASURED",
    n: 0,
  });
  d.totals = {
    ...d.totals,
    axes: 24,
    unmeasured_axes: 1,
    public_count: "24 axes · 23 measured",
  };
  return d;
}
const response = (d: unknown): Response =>
  new Response(JSON.stringify(d), {
    headers: { "content-type": "application/json" },
  });
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
afterEach(() => vi.useRealTimers());

describe("published board contract", () => {
  it("accepts the dated observed shape unchanged with distinct comparison and fact denominators", () => {
    const d = observedProjection();
    expect(validateGspcPayload(d)).toBe(d);
    expect(d.totals).toMatchObject({
      axes: 23,
      measured_axes: 23,
      comparison_axes: 14,
      fact_runs: 9,
      separated_leads: 0,
      ties: 7,
      untested_separations: 7,
    });
    expect(d.axes!.find((a) => a.axis === "effect-binding")).toMatchObject({
      kind: "deterministic-facts",
      n: 261,
    });
  });
  it("accepts a future declared slot without increasing comparisons or facts", () => {
    expect(validateGspcPayload(futureProjection()).totals).toMatchObject({
      axes: 24,
      measured_axes: 23,
      unmeasured_axes: 1,
      comparison_axes: 14,
      fact_runs: 9,
    });
  });
  it("accepts a zero-size or single-axis board without assuming today's roster", () => {
    const empty = {
      schema: "csoai.gspc-axes/0.5",
      axes: [],
      totals: {
        axes: 0,
        measured_axes: 0,
        unmeasured_axes: 0,
        comparison_axes: 0,
        fact_runs: 0,
        public_count: "0 axes · 0 measured",
      },
    };
    expect(validateGspcPayload(empty)).toBe(empty);
    const one = {
      ...empty,
      axes: [observedProjection().axes![14]],
      totals: {
        ...empty.totals,
        axes: 1,
        measured_axes: 1,
        fact_runs: 1,
        public_count: "1 axis · 1 measured",
      },
    };
    expect(validateGspcPayload(one)).toBe(one);
  });
  it("retains unknown optional evidence and null inapplicable fields unchanged", () => {
    const d = observedProjection();
    Object.assign(d.axes![14], {
      accuracy: null,
      interval: null,
      leader: null,
      separation: null,
      future_evidence_field: { state: "UNKNOWN_TO_THIS_READER" },
    });
    expect(validateGspcPayload(d)).toBe(d);
    delete d.totals!.separated_leads;
    delete d.totals!.ties;
    delete d.totals!.untested_separations;
    expect(validateGspcPayload(d)).toBe(d);
  });
  it.each([
    ["empty object", (d: any) => ({})],
    ["wrong schema", (d: any) => ({ ...d, schema: "csoai.gspc-axes/99" })],
    [
      "missing axes",
      (d: any) => {
        delete d.axes;
        return d;
      },
    ],
    [
      "missing totals",
      (d: any) => {
        delete d.totals;
        return d;
      },
    ],
    [
      "unknown kind",
      (d: any) => {
        d.axes[0].kind = "unknown-kind";
        return d;
      },
    ],
    [
      "unknown status",
      (d: any) => {
        d.axes[0].status = "UNKNOWN";
        return d;
      },
    ],
    [
      "unknown separation",
      (d: any) => {
        d.axes[0].separation = "WINNER";
        return d;
      },
    ],
    [
      "missing comparison separation",
      (d: any) => {
        delete d.axes[0].separation;
        return d;
      },
    ],
    [
      "fact separation",
      (d: any) => {
        d.axes[14].separation = "UNTESTED";
        return d;
      },
    ],
    [
      "fact accuracy",
      (d: any) => {
        d.axes[14].accuracy = 0;
        return d;
      },
    ],
    [
      "duplicate axis",
      (d: any) => {
        d.axes[1].axis = d.axes[0].axis;
        return d;
      },
    ],
    [
      "measured declared slot",
      (d: any) => {
        d.axes[14].kind = "declared-slot";
        return d;
      },
    ],
    [
      "missing primary count",
      (d: any) => {
        delete d.totals.measured_axes;
        return d;
      },
    ],
    [
      "count type",
      (d: any) => {
        d.totals.axes = "23";
        return d;
      },
    ],
    [
      "wrong measured count",
      (d: any) => {
        d.totals.measured_axes = 24;
        return d;
      },
    ],
    [
      "wrong fact count",
      (d: any) => {
        d.totals.fact_runs = 8;
        return d;
      },
    ],
    [
      "wrong comparison count",
      (d: any) => {
        d.totals.comparison_axes = 23;
        return d;
      },
    ],
    [
      "partial tallies",
      (d: any) => {
        delete d.totals.ties;
        return d;
      },
    ],
    [
      "contradictory tallies",
      (d: any) => {
        d.totals.ties = 8;
        return d;
      },
    ],
    [
      "negative count",
      (d: any) => {
        d.totals.axes = -1;
        return d;
      },
    ],
    [
      "fractional count",
      (d: any) => {
        d.totals.axes = 23.5;
        return d;
      },
    ],
    [
      "contradictory count text",
      (d: any) => {
        d.totals.public_count = "24 axes · 23 measured";
        return d;
      },
    ],
    [
      "out-of-range accuracy",
      (d: any) => {
        d.axes[0].accuracy = 2;
        return d;
      },
    ],
  ])("rejects %s without normalising it", (_name, change) => {
    expect(() => validateGspcPayload(change(observedProjection()))).toThrow(
      /Unreadable board/,
    );
  });
});

describe("shared bounded reads", () => {
  it("deduplicates subscribers, loads and simultaneous refresh", async () => {
    const reply = deferred<Response>(),
      fetcher = vi.fn(() => reply.promise);
    const reader = createGspcBoardReader({
      fetch: fetcher,
      now: () => new Date(OBSERVED_AT),
    });
    const a = vi.fn(),
      b = vi.fn(),
      stopA = reader.subscribe(a),
      stopB = reader.subscribe(b);
    const before = reader.getSnapshot();
    expect(reader.getSnapshot()).toBe(before);
    const first = reader.load(),
      second = reader.load(),
      refreshed = reader.refresh();
    expect(second).toBe(first);
    await Promise.resolve();
    expect(fetcher).toHaveBeenCalledTimes(1);
    reply.resolve(response(observedProjection()));
    await Promise.all([first, second, refreshed]);
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
    expect(reader.getSnapshot()).toMatchObject({
      error: null,
      loading: false,
      refreshing: false,
      readAt: OBSERVED_AT,
    });
    expect(reader.getSnapshot()).toBe(reader.getSnapshot());
    stopA();
    stopB();
  });
  it("installs its operation before notification so reentrant refresh shares it", async () => {
    const reply = deferred<Response>(),
      fetcher = vi.fn(() => reply.promise),
      reader = createGspcBoardReader({ fetch: fetcher });
    let invoked = false;
    const stop = reader.subscribe(() => {
      if (!invoked) {
        invoked = true;
        void reader.refresh();
      }
    });
    const pending = reader.load();
    await Promise.resolve();
    expect(fetcher).toHaveBeenCalledTimes(1);
    reply.resolve(response(observedProjection()));
    await pending;
    stop();
  });
  it("retains data and readAt after failure; recovery updates both", async () => {
    let clock = OBSERVED_AT;
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response(observedProjection()))
      .mockRejectedValueOnce(new Error("network offline"))
      .mockResolvedValueOnce(response(futureProjection()));
    const reader = createGspcBoardReader({
      fetch: fetcher,
      now: () => new Date(clock),
    });
    await reader.load();
    const before = reader.getSnapshot(),
      failed = reader.refresh();
    expect(reader.getSnapshot()).toMatchObject({
      data: before.data,
      readAt: OBSERVED_AT,
      loading: false,
      refreshing: true,
    });
    await failed;
    expect(reader.getSnapshot()).toMatchObject({
      data: before.data,
      readAt: OBSERVED_AT,
      error: "network offline",
      loading: false,
      refreshing: false,
    });
    clock = LATER_READ;
    await reader.refresh();
    expect(reader.getSnapshot()).toMatchObject({
      readAt: LATER_READ,
      error: null,
      refreshing: false,
    });
    expect(reader.getSnapshot().data!.totals!.axes).toBe(24);
  });
  it("load joins refresh rather than returning an old snapshot", async () => {
    const reply = deferred<Response>(),
      fetcher = vi
        .fn()
        .mockResolvedValueOnce(response(observedProjection()))
        .mockReturnValueOnce(reply.promise);
    const reader = createGspcBoardReader({ fetch: fetcher });
    await reader.load();
    const refreshed = reader.refresh(),
      loaded = reader.load();
    reply.resolve(response(futureProjection()));
    expect((await loaded).totals!.axes).toBe(24);
    await refreshed;
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it.each(["request", "body"] as const)(
    "bounds a stalled %s and aborts its signal",
    async (stage) => {
      vi.useFakeTimers();
      let signal: AbortSignal | null = null;
      const fetcher = vi.fn((_url, init) => {
        signal = init!.signal as AbortSignal;
        return stage === "request"
          ? new Promise<Response>(() => {})
          : Promise.resolve({
              ok: true,
              text: () => new Promise<string>(() => {}),
            } as Response);
      });
      const reader = createGspcBoardReader({ fetch: fetcher, timeoutMs: 50 }),
        settled = reader.load().catch((e) => e);
      await vi.advanceTimersByTimeAsync(50);
      expect((await settled).message).toMatch(/timed out/);
      expect(signal!.aborted).toBe(true);
      expect(reader.getSnapshot()).toMatchObject({
        data: null,
        readAt: null,
        loading: false,
        refreshing: false,
      });
      expect(vi.getTimerCount()).toBe(0);
    },
  );
  it.each([
    ["malformed JSON", () => new Response("{")],
    ["bad schema", () => response({ schema: "bad", axes: [], totals: {} })],
    ["empty object", () => response({})],
    ["denial", () => new Response("", { status: 403 })],
  ])(
    "reports %s without another request or false read",
    async (_name, reply) => {
      const fetcher = vi.fn().mockResolvedValue(reply()),
        reader = createGspcBoardReader({
          fetch: fetcher,
          localPreview: () => true,
        });
      await expect(reader.load()).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(reader.getSnapshot()).toMatchObject({
        data: null,
        readAt: null,
        loading: false,
      });
      expect(reader.getSnapshot().error).toBeTruthy();
    },
  );
  it("allows only localhost's missing-function fallback in the same bounded operation", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(response(observedProjection()));
    const reader = createGspcBoardReader({
      fetch: fetcher,
      localPreview: () => true,
    });
    await reader.load();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][0]).toBe("https://councilof.ai/api/gspc");
    expect(fetcher.mock.calls[0][1].signal).toBe(
      fetcher.mock.calls[1][1].signal,
    );
  });
  it("retains the same operation on StrictMode resubscription", async () => {
    const reply = deferred<Response>();
    let signal: AbortSignal | null = null;
    const fetcher = vi.fn((_url, init) => {
        signal = init!.signal as AbortSignal;
        return reply.promise;
      }),
      reader = createGspcBoardReader({ fetch: fetcher });
    const stop = reader.subscribe(() => {}),
      pending = reader.load();
    await Promise.resolve();
    stop();
    const stopAgain = reader.subscribe(() => {});
    await Promise.resolve();
    expect(signal!.aborted).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
    reply.resolve(response(observedProjection()));
    await pending;
    stopAgain();
  });
  it("retires cancellation before resubscription and ignores a late old response", async () => {
    const oldReply = deferred<Response>(),
      newReply = deferred<Response>();
    let oldSignal: AbortSignal | null = null;
    const fetcher = vi
      .fn((_url, init) => {
        oldSignal = init!.signal as AbortSignal;
        return oldReply.promise;
      })
      .mockImplementationOnce((_url, init) => {
        oldSignal = init!.signal as AbortSignal;
        return oldReply.promise;
      })
      .mockImplementationOnce(() => newReply.promise);
    const reader = createGspcBoardReader({
        fetch: fetcher,
        now: () => new Date(LATER_READ),
      }),
      stop = reader.subscribe(() => {}),
      old = reader.load().catch((e) => e);
    await Promise.resolve();
    stop();
    await Promise.resolve();
    expect(oldSignal!.aborted).toBe(true);
    const stopAgain = reader.subscribe(() => {}),
      replacement = reader.load();
    await Promise.resolve();
    expect(fetcher).toHaveBeenCalledTimes(2);
    newReply.resolve(response(futureProjection()));
    await replacement;
    oldReply.resolve(response(observedProjection()));
    expect((await old).message).toMatch(/cancelled/);
    await Promise.resolve();
    await Promise.resolve();
    expect(reader.getSnapshot()).toMatchObject({
      readAt: LATER_READ,
      error: null,
      loading: false,
    });
    expect(reader.getSnapshot().data!.totals!.axes).toBe(24);
    stopAgain();
  });
});
