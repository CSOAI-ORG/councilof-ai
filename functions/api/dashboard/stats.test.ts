import { describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./stats";

describe("dashboard stats semantics", () => {
  it("keeps board/card/fleet facts separate from council sessions and PDCA cycles", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/gspc")) return Response.json({ totals: { measured_axes: 15, quotable_axes: 16, public_count: 22, separated_leads: 4 }, measured_on: { living_stamp: { gold_run: "2026-08-18T03:22:16Z" } } });
      if (url.endsWith("/api/cards")) return Response.json({ cards: { count: 335, signed: 335 } });
      if (url.endsWith("/api/oracle-fleet")) return Response.json({ online: 2, nodes: [{}, {}] });
      return Response.json({ status: "available", count: 9 });
    }));

    const response = await onRequestGet({
      request: new Request("https://councilof.ai/api/dashboard/stats"),
    } as Parameters<typeof onRequestGet>[0]);
    const body = await response.json() as {
      gspc: { measured_axes: number; quotable_axes: number; separated_leads: number | null; last_run_at: string | null };
      cards: { count: number; signed: number };
      fleet: { online: number };
      council: { totalSessions: number; pendingReview: number; consensusReached: number; state: string };
      pdca: { totalCycles: number; activeCycles: number; completedCycles: number; state: string };
    };

    expect(body.gspc).toMatchObject({ measured_axes: 15, quotable_axes: 16, separated_leads: 4, last_run_at: "2026-08-18T03:22:16Z" });
    expect(body.cards).toEqual({ count: 335, signed: 335 });
    expect(body.fleet.online).toBe(2);
    expect(body.council).toMatchObject({ totalSessions: 0, pendingReview: 0, consensusReached: 0, state: "NOT_LIVE" });
    expect(body.pdca).toMatchObject({ totalCycles: 0, activeCycles: 0, completedCycles: 0, state: "UNMEASURED" });
  });

  it("leaves the source run date null when the board does not provide one", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/gspc")) return Response.json({ totals: { measured_axes: 15, quotable_axes: 16 } });
      if (url.endsWith("/api/cards")) return Response.json({ cards: { count: 0, signed: 0 } });
      if (url.endsWith("/api/oracle-fleet")) return Response.json({});
      return Response.json({ status: "available", count: 0 });
    }));

    const response = await onRequestGet({
      request: new Request("https://councilof.ai/api/dashboard/stats"),
    } as Parameters<typeof onRequestGet>[0]);
    const body = await response.json() as { gspc: { last_run_at: string | null } };

    expect(body.gspc.last_run_at).toBeNull();
  });
});
