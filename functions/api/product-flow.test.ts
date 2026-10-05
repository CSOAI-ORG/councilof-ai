import { describe, expect, it, vi } from "vitest";
import { buildProductFlow } from "./product-flow";

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function fixtureFetch(overrides: Record<string, Response> = {}) {
  return (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (overrides[url.pathname]) return overrides[url.pathname].clone();
    const rows: Record<string, unknown> = {
      "/api/x402": {
        mcp: { paid_tools: [{ name: "commission_card", route: "https://councilof.ai/api/request-attestation" }] },
      },
      "/api/state": { schema: "csoai.live-state/1" },
      "/api/worker": {
        schema: "csoai.worker-state/0.1", status: "OFFLINE", worker: null,
      },
      "/api/gspc": { totals: { axes: 23, measured_axes: 23 } },
      "/.well-known/constitutional-harness.json": {
        status: "CURRENT_OPERATIONAL_CHARTER",
        version: "0.1.0",
      },
      "/root.json": { card_count: 305, card_sha256: [], as_of: "2026-09-22" },
      "/api/commission-queue": { status: "MEASURED", count: 1, queued: 1 },
      "/api/corrections": { corrections: [{ id: "C-1" }, { id: "C-2" }] },
      "/api/revenue": {
        one_number: {
          status: "MEASURED",
          all_time: 1,
          last_30d: 1,
          settlements: 1,
          settled_usdc_atomic: 20000,
          repeat_nonself_payers: { all_time: 0, last_30d: 0 },
        },
      },
    };
    return reply(rows[url.pathname] ?? { error: "missing fixture" }, rows[url.pathname] ? 200 : 404);
  }) as typeof fetch;
}

describe("product flow", () => {
  it("reports offline compute separately from measured evidence", async () => {
    const body = await buildProductFlow("https://councilof.ai", fixtureFetch());
    expect(body.schema).toBe("csoai.product-flow/0.1");
    expect(body.stages.map((stage) => stage.id)).toEqual([
      "request", "evidence", "runtime", "measurement",
      "review", "verify", "delivery", "maintain",
    ]);
    expect(body.stages.find((stage) => stage.id === "runtime")?.state).toBe("HOLD");
    expect(body.stages.find((stage) => stage.id === "measurement")?.state).toBe("OBSERVED");
    expect(body.next_action).toBe("runtime");
    expect(body.commercial.distinct_nonself_payers).toBe(1);
    expect(body.commercial.repeat_buyer).toBe("CUSTOMER_RELATIONSHIP_NOT_ESTABLISHED_BY_WALLET_COUNTS");
  });

  it("fails a missing commission catalogue closed without degrading unrelated measurement", async () => {
    const body = await buildProductFlow(
      "https://councilof.ai",
      fixtureFetch({ "/api/x402": reply({ mcp: { paid_tools: [] } }) }),
    );
    expect(body.stages.find((stage) => stage.id === "request")?.state).toBe("UNCHECKABLE");
    expect(body.stages.find((stage) => stage.id === "measurement")?.state).toBe("OBSERVED");
  });

  it("never turns an empty queue into delivered work", async () => {
    const body = await buildProductFlow(
      "https://councilof.ai",
      fixtureFetch({
        "/api/commission-queue": reply({ status: "MEASURED", count: 0, queued: 0 }),
      }),
    );
    const delivery = body.stages.find((stage) => stage.id === "delivery");
    expect(delivery?.state).toBe("AVAILABLE");
    expect(delivery?.observed?.active_queue_count).toBe(0);
  });
});

describe("product flow source boundaries", () => {
  it("rejects malformed successful responses instead of reporting availability", async () => {
    const paths = ["/api/state", "/root.json", "/api/commission-queue", "/api/corrections"];
    const body = await buildProductFlow("https://councilof.ai",
      fixtureFetch(Object.fromEntries(paths.map(path => [path, reply({})]))));
    for (const id of ["evidence", "verify", "delivery", "maintain"])
      expect(body.stages.find(stage => stage.id === id)?.state).toBe("UNCHECKABLE");
  });

  it("never promotes cached runtime or failed HTTP bodies to observed state", async () => {
    const worker = { schema: "csoai.worker-state/0.1", status: "LIVE", worker: { state: "RUNNING" } };
    const live = await buildProductFlow("https://councilof.ai", fixtureFetch({ "/api/worker": reply(worker) }));
    expect(live.stages.find(stage => stage.id === "runtime")?.state).toBe("OBSERVED");
    const stale = await buildProductFlow("https://councilof.ai", fixtureFetch({ "/api/worker": reply({ ...worker, status: "STALE", stale: true }) }));
    expect(stale.stages.find(stage => stage.id === "runtime")?.state).toBe("HOLD");
    const failed = await buildProductFlow("https://councilof.ai", fixtureFetch({
      "/api/worker": reply(worker, 503),
      "/api/revenue": reply({ one_number: { status: "MEASURED", all_time: 20 } }, 503),
    }));
    expect(failed.stages.find(stage => stage.id === "runtime")?.state).toBe("UNCHECKABLE");
    expect(failed.commercial.distinct_nonself_payers).toBeNull();
  });

  it("keeps unknown and invalid counts distinct from zero", async () => {
    const body = await buildProductFlow("https://councilof.ai", fixtureFetch({
      "/api/revenue": reply({ one_number: { status: "UNMEASURED", all_time: 9 } }),
      "/api/commission-queue": reply({ status: "MEASURED", count: -1 }),
      "/api/gspc": reply({ totals: { axes: 2, measured_axes: 3 } }),
    }));
    expect(body.commercial.distinct_nonself_payers).toBeNull();
    expect(body.stages.find(stage => stage.id === "delivery")?.state).toBe("UNCHECKABLE");
    expect(body.stages.find(stage => stage.id === "measurement")?.state).toBe("UNCHECKABLE");
  });

  it("bounds an unresponsive source and still returns other stages", async () => {
    vi.useFakeTimers();
    try {
      const original = fixtureFetch();
      const fetcher = ((input: RequestInfo | URL, init?: RequestInit) =>
        new URL(String(input)).pathname === "/api/worker" ? new Promise<Response>(() => {}) : original(input, init)) as typeof fetch;
      const pending = buildProductFlow("https://councilof.ai", fetcher);
      await vi.advanceTimersByTimeAsync(10_001);
      const body = await pending;
      expect(body.stages.find(stage => stage.id === "runtime")?.state).toBe("UNCHECKABLE");
      expect(body.stages.find(stage => stage.id === "measurement")?.state).toBe("OBSERVED");
    } finally { vi.useRealTimers(); }
  });

  it("reads the repeat-payer counter without calling a wallet a customer", async () => {
    const body = await buildProductFlow("https://councilof.ai", fixtureFetch());
    expect(body.commercial.repeat_nonself_payers).toBe(0);
    expect(body.commercial.repeat_buyer).toContain("NOT_ESTABLISHED");
  });
});
