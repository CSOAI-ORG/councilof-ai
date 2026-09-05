import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import DashboardArenaPane, {
  ARENA_SCOREBOARD_ENDPOINT,
  ARENA_SCOREBOARD_FALLBACK,
  DASHBOARD_ARENA_CONTRACT,
  defaultArenaAxis,
  fetchArenaScoreboard,
  initialArenaPair,
  isPublicArenaModelId,
  parseArenaScoreboard,
} from "./DashboardArenaPane";

const PAYLOAD = {
  schema: "csoai.signed-arena-leaderboard/0.1",
  as_of: "2026-08-29T05:45:52Z",
  n_rounds: 42,
  axis_pass_rates: {
    care: {
      n_rounds: 30,
      models: {
        "model-a:7b": { pass: 9, n: 10, rate: 0.9 },
        "model-b:7b": { pass: 4, n: 8, rate: 0.5 },
        "oowm-private:7b": { pass: 7, n: 10, rate: 0.7 },
      },
    },
    governance: {
      n_rounds: 12,
      models: {
        "model-a:7b": { pass: 5, n: 10, rate: 0.5 },
        "model-b:7b": { pass: 4, n: 10, rate: 0.4 },
      },
    },
  },
  signature: {
    content_id: "abc123",
    sig: "signed-bytes",
    kid: "did:web:csoai.org#card-attestation-1",
  },
};

describe("dashboard measured arena", () => {
  it("states the current replay, chat, AG-UI, A2UI and live-battle boundaries", () => {
    expect(DASHBOARD_ARENA_CONTRACT).toMatchObject({
      replay: {
        state: "SIGNED",
        endpoint: "/api/arena/scoreboard",
        scope: "HISTORICAL_REPLAY",
        taxonomy: "NONCANONICAL_15_AXIS",
      },
      chat: { state: "RUNTIME_OBSERVED", endpoint: "/api/chat" },
      livePromptBattle: { state: "UNCHECKABLE", endpoint: null },
      agui: { state: "RUNTIME_OBSERVED", endpoint: "/api/agui/gspc-state" },
      aguiWire: { state: "UNREACHABLE", endpoint: "/api/agui/health" },
      a2ui: { state: "UNCHECKABLE", endpoint: null },
    });
  });

  it("parses measured rows without exposing internal model markers or coercing bad cells", () => {
    const board = parseArenaScoreboard(PAYLOAD);
    expect(Object.keys(board.axes.care.models)).toEqual([
      "model-a:7b",
      "model-b:7b",
    ]);
    expect(board.signature?.keyId).toBe("did:web:csoai.org#card-attestation-1");
    expect(defaultArenaAxis(board)).toBe("care");
    expect(initialArenaPair(board.axes.care)).toEqual([
      "model-a:7b",
      "model-b:7b",
    ]);
    expect(isPublicArenaModelId("public-model:7b")).toBe(true);
    expect(isPublicArenaModelId("sov33-private")).toBe(false);
    expect(isPublicArenaModelId("vendor/oowm:latest")).toBe(false);
  });

  it("uses the signed static artefact when a local Vite route returns HTML", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === ARENA_SCOREBOARD_ENDPOINT)
        return new Response("<!doctype html>", { status: 200 });
      if (url === ARENA_SCOREBOARD_FALLBACK) return Response.json(PAYLOAD);
      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;
    const board = await fetchArenaScoreboard(fetchImpl);
    expect(board.source).toBe(ARENA_SCOREBOARD_FALLBACK);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("renders a selector over replay evidence while refusing to fake live inference", () => {
    const board = parseArenaScoreboard(PAYLOAD);
    const html = renderToStaticMarkup(
      <DashboardArenaPane initialData={board} />,
    );
    expect(html).toContain("Compare two historical subjects");
    expect(html).toContain("SIGNED HISTORICAL ARTEFACT");
    expect(html).toContain("legacy, noncanonical 15-axis arena taxonomy");
    expect(html).toContain("not the canonical 22-axis GSPC board");
    expect(html).toContain("model-a:7b");
    expect(html).toContain("model-b:7b");
    expect(html).toContain(
      "No published endpoint currently accepts one prompt plus two model identifiers",
    );
    expect(html).toContain("UNCHECKABLE");
    expect(html).not.toContain("oowm-private:7b");
  });
});
