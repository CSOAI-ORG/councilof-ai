import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { onRequestGet } from "./cards";

const historicalPackage = JSON.parse(
  readFileSync(resolve(__dirname, "../../public/signed/gspc-measurement.json"), "utf8"),
);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("GET /api/cards historical package claim", () => {
  it("does not call the old unsigned package signed or present its old readiness as current", async () => {
    expect(historicalPackage.signature).toBeUndefined();
    expect(historicalPackage.amendments.some((a: { note: string }) =>
      a.note.includes("This artifact carries no signature over itself"),
    )).toBe(true);

    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/signed/board_living.json"))
        return Response.json({
          schema: "csoai.gspc-living/0.1",
          signed: true,
          signature: "00",
          verification_state: "UNVERIFIABLE",
          axes: { governance: {} },
        });
      if (url.endsWith("/signed/card_index.json")) return Response.json({ cards: [] });
      if (url.endsWith("/signed/gspc-measurement.json")) return Response.json(historicalPackage);
      if (url.endsWith("/api/gspc"))
        return Response.json({ totals: { public_count: "23 axis · 23 measured", axes: 23, measured_axes: 23, unmeasured_axes: 0 } });
      return Response.json({}, { status: 404 });
    }));

    const response = await onRequestGet({
      request: new Request("https://councilof.ai/api/cards"),
    } as Parameters<typeof onRequestGet>[0]);
    const body = await response.json() as {
      measurement: {
        artifact_state: string;
        pack: string;
        publish_readiness?: unknown;
        historical_publish_readiness: { board: string };
        living_board: { axes: number };
      };
      board: { axes_note: string; signature: { verification_state: string } };
    };

    expect(body.measurement.artifact_state).toBe("HISTORICAL_UNSIGNED");
    expect(body.measurement.pack).toContain("historical unsigned package");
    expect(body.measurement.pack).toContain("/api/gspc");
    expect(body.measurement.publish_readiness).toBeUndefined();
    expect(body.measurement.historical_publish_readiness.board).toBe("live");
    expect(body.measurement.living_board.axes).toBe(23);
    expect(body.board.axes_note).toContain("signature verification state");
    expect(body.board.signature.verification_state).toBe("UNVERIFIABLE");
  });
});
