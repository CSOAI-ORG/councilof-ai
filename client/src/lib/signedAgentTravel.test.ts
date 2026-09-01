import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AGENT_TRAVEL_AGREED,
  AGENT_TRAVEL_BETTER,
  AGENT_TRAVEL_RULING,
  autoWithoutPermission,
  mustStayGated,
  PLANTED_IDENTITY,
  TRAVEL_LANES,
} from "./signedAgentTravel";

const tools = readFileSync(resolve(__dirname, "../pages/ToolsPage.tsx"), "utf8");

describe("Signed agent travel", () => {
  it("agrees our agent travels without per-site permission, and census stays DISCOVERED", () => {
    expect(AGENT_TRAVEL_RULING).toMatch(/Sign Council once/);
    expect(AGENT_TRAVEL_RULING).toMatch(/Do not auto-sign the subjects/);
    expect(AGENT_TRAVEL_AGREED).toMatch(/do not auto-MEASURED/i);
    expect(autoWithoutPermission().map((l) => l.id)).toEqual(
      expect.arrayContaining(["council-agent", "census", "flags"]),
    );
    expect(mustStayGated().some((l) => l.id === "subject-cell")).toBe(true);
    expect(mustStayGated().some((l) => l.id === "publisher")).toBe(true);
    expect(TRAVEL_LANES.find((l) => l.id === "host-paste")?.needs_permission).toBe(false);
  });

  it("says the better move is bind discovery to did:web, not invent a key or auto-sign Hub agents", () => {
    expect(AGENT_TRAVEL_BETTER).toMatch(/did:web:csoai.org/);
    expect(PLANTED_IDENTITY.card_pin).toBe("did:web:csoai.org#card-attestation-1");
    expect(PLANTED_IDENTITY.agent_card_signed).toBe(false);
    expect(PLANTED_IDENTITY.mcp_json_signed).toBe(false);
    expect(PLANTED_IDENTITY.did_advertises_mcp).toBe(false);
    const blob = JSON.stringify({
      AGENT_TRAVEL_RULING,
      AGENT_TRAVEL_AGREED,
      AGENT_TRAVEL_BETTER,
      PLANTED_IDENTITY,
      TRAVEL_LANES,
    });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos/i);
    expect(tools).toContain("SignedAgentTravel");
  });
});
