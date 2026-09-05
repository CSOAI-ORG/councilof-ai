// "I could not read it" and "it is zero" are different facts.
//
// This endpoint coalesced every aggregate with `?? 0`, so an unreadable source
// became a hard number: if /api/gspc failed, the dashboard published
// `measured_axes: 0` — the board has 22. And `fleet.online` was derived from
// `.online ?? .nodes?.length ?? 0`, two fields /api/oracle-fleet has never
// emitted, so it reported 0 nodes online while the fleet answered 200 with a
// host at 26.9 days uptime. That one was live and wrong on 2026-09-05.
//
// It survived because the old test mocked oracle-fleet as `{online: 2, nodes: []}`
// — a shape the real endpoint does not return. A test that invents the upstream
// shape cannot catch a misread of the real one, so the fixture below is the
// actual live payload.

import { describe, expect, it, vi } from "vitest";

import { onRequestGet } from "./stats";

// Verbatim from GET https://councilof.ai/api/oracle-fleet on 2026-09-05.
// Note what it does NOT contain: `online`, and `nodes`.
const REAL_ORACLE_FLEET = {
  host: "sov33-owem-micro",
  updated: "2026-09-05T04:45:02Z",
  uptime_seconds: 2322936,
  feeds: { ollama: { models_loaded: 145 } },
  disk_free_mb: { root: 5858 },
  cron_jobs: 15,
  source: "live",
};

const invoke = async () => {
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/dashboard/stats"),
  } as Parameters<typeof onRequestGet>[0]);
  return (await res.json()) as Record<string, never>;
};

/** Answer every upstream, except those named in `broken`. */
const installFetch = (broken: string[] = [], fleet: unknown = REAL_ORACLE_FLEET) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const hit = (p: string) => url.endsWith(p);
      if (broken.some((b) => hit(b))) return new Response("upstream down", { status: 502 });
      if (hit("/api/gspc"))
        return Response.json({
          totals: { measured_axes: 22, quotable_axes: 22, public_count: "22 axis", separated_leads: 1 },
        });
      if (hit("/api/cards")) return Response.json({ cards: { count: 336, signed: 336 } });
      if (hit("/api/oracle-fleet")) return Response.json(fleet);
      return Response.json({ status: "UNPUBLISHED", count: 0 });
    }),
  );
};

describe("dashboard stats — absent is not zero", () => {
  it("reports the real numbers when every source answers", async () => {
    installFetch([], { online: 2, nodes: [{}, {}] });
    const body = await invoke();

    expect(body.gspc as unknown as Record<string, unknown>).toMatchObject({ measured_axes: 22 });
    expect(body.cards).toEqual({ count: 336, signed: 336 });
    expect((body.fleet as unknown as Record<string, unknown>).online).toBe(2);
  });

  // THE DEFECT. Today this returns measured_axes: 0 — a statement that the board
  // measures nothing, published because one fetch failed.
  it("says null, never 0, when the board could not be read", async () => {
    installFetch(["/api/gspc"]);
    const body = await invoke();
    const gspc = body.gspc as unknown as Record<string, unknown>;

    expect(gspc.measured_axes).toBeNull();
    expect(gspc.quotable_axes).toBeNull();
    expect(gspc.measured_axes).not.toBe(0);
    expect((body.sources as unknown as Record<string, string>).gspc).toMatch(/50\d|unread|http/i);
  });

  // THE LIVE ONE. The real fleet payload carries neither `online` nor `nodes`,
  // so the old derivation invented a 0 from two absent fields.
  it("will not derive an online count from fields the fleet never sends", async () => {
    installFetch([]);
    const body = await invoke();
    const fleet = body.fleet as unknown as Record<string, unknown>;

    expect(fleet.online).toBeNull();
    expect(fleet.online).not.toBe(0);
    // and it must say why, rather than leaving a bare null to be read as zero
    expect(String(fleet.online_note ?? "")).toMatch(/online|nodes|absent|not report/i);
  });

  it("still reports a real zero as zero when the source actually said so", async () => {
    installFetch([], { online: 0, nodes: [] });
    const body = await invoke();

    expect((body.fleet as unknown as Record<string, unknown>).online).toBe(0);
    // receipts genuinely answers UNPUBLISHED/count 0 — that zero is a measurement
    expect(body.receipts).toMatchObject({ status: "UNPUBLISHED", count: 0 });
  });

  it("nulls the card counts when the card endpoint is unreadable", async () => {
    installFetch(["/api/cards"]);
    const body = await invoke();

    expect(body.cards).toEqual({ count: null, signed: null });
  });

  it("names every source's state so a null is never guessed at", async () => {
    installFetch(["/api/cards", "/api/receipts/latest"]);
    const body = await invoke();
    const sources = body.sources as unknown as Record<string, string>;

    expect(Object.keys(sources).sort()).toEqual(["cards", "fleet", "gspc", "receipts"]);
    expect(sources.gspc).toBe("ok");
    expect(sources.cards).not.toBe("ok");
    expect(sources.receipts).not.toBe("ok");
  });
});
