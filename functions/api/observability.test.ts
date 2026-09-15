import { describe, expect, it } from "vitest";
import { onRequestGet } from "./observability";

const call = async () => {
  const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({ env: {} });
  return { status: res.status, body: await res.json() };
};

describe("/api/observability — machine-readable estate health", () => {
  it("returns the observability schema with all required sections", async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body.schema).toBe("csoai.observability/0.1");
    expect(body.endpoint).toBe("/api/observability");
    expect(body.contract).toContain("committed artifact");
  });

  it("lists connectors with freshness data", async () => {
    const { body } = await call();
    expect(Array.isArray(body.connectors)).toBe(true);
    expect(body.connectors.length).toBeGreaterThanOrEqual(6);
    const rootConn = body.connectors.find((c: any) => c.id === "public-root");
    expect(rootConn).toBeDefined();
    expect(rootConn.as_of).toBeTruthy();
    expect(typeof rootConn.age_hours).toBe("number");
  });

  it("reports root card count and age", async () => {
    const { body } = await call();
    expect(typeof body.root.card_count).toBe("number");
    expect(body.root.card_count).toBeGreaterThan(0);
    expect(body.root.as_of).toBeTruthy();
  });

  it("reports signed card counts", async () => {
    const { body } = await call();
    expect(typeof body.signed_cards.total).toBe("number");
    expect(typeof body.signed_cards.signed).toBe("number");
    expect(body.signed_cards.signed + body.signed_cards.unsigned).toBe(body.signed_cards.total);
  });

  it("reports worker status", async () => {
    const { body } = await call();
    expect(["LIVE", "STALE", "OFFLINE"]).toContain(body.worker.status);
  });

  it("reports MCP trust census data", async () => {
    const { body } = await call();
    expect(typeof body.mcp_trust.total).toBe("number");
    expect(body.mcp_trust.total).toBeGreaterThan(0);
  });

  it("reports stablecoin universe status", async () => {
    const { body } = await call();
    expect(body.stablecoin_universe).not.toBeNull();
    expect(body.stablecoin_universe.assets).toBe(425);
  });

  it("identifies the stalest connector", async () => {
    const { body } = await call();
    expect(body.stalest_connector).toBeDefined();
    expect(typeof body.stalest_connector.id).toBe("string");
  });

  it("has not_covered for things outside committed artifacts", async () => {
    const { body } = await call();
    expect(Array.isArray(body.not_covered)).toBe(true);
    expect(body.not_covered.length).toBeGreaterThan(0);
  });
});
