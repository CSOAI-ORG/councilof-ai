import { describe, expect, it } from "vitest";
import registry from "../../data/watchdog/source-registry.json";
import snapshot from "../../watchdog-source-status.json";
import {
  coveragePayloadForTest,
  freshnessForTest,
  onRequestGet,
  validRegistryForTest,
  validStatusForTest
} from "./watchdog-sources";

describe("public Watchdog source coverage", () => {
  it("keeps the source catalogue separate from report ingestion and GSPC writes", () => {
    expect(validRegistryForTest(registry)).toBe(true);
    expect(validStatusForTest(snapshot, registry)).toBe(true);
    expect(registry.controls.fetch_incident_records).toBe(false);
    expect(registry.controls.writes_gspc).toBe(false);
  });

  it("returns source-page status with coverage and reuse caveats, not incident records", async () => {
    const response = await onRequestGet({ request: new Request("https://example.test/api/watchdog-sources") });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.schema).toBe("csoai.watchdog-source-coverage/0.1");
    expect(body.scope).toMatch(/No incident report payloads are collected/);
    expect(body.controls).toMatchObject({
      source_page_metadata_only: true,
      incident_records_collected: false,
      automatic_action: false,
      writes_gspc: false,
      human_review_required_before_ingestion: true
    });
    expect(body.sources.map((source: { id: string }) => source.id)).toContain("aiid");
    expect(body.sources.map((source: { id: string }) => source.id)).toContain("oecd-aim");
    expect(body.sources.map((source: { id: string }) => source.id)).toContain("aiaaic");
    expect(body.sources.find((source: { id: string }) => source.id === "eu-ai-act-serious-incident-channel").availability_state).toBe("NOT_MONITORED");
    expect("reports" in body).toBe(false);
  });

  it("fails closed for invalid registry or status controls", () => {
    const unsafe = structuredClone(snapshot) as any;
    unsafe.controls.writes_gspc = true;
    expect(validStatusForTest(unsafe, registry)).toBe(false);
    expect(coveragePayloadForTest(registry, unsafe)).toBeNull();
    const malformed = structuredClone(registry) as any;
    malformed.sources[0].url = "http://example.test/";
    expect(validRegistryForTest(malformed)).toBe(false);
  });

  it("marks stale observations instead of treating them as current", () => {
    const observed = Date.parse(snapshot.observed_at);
    expect(freshnessForTest(snapshot.observed_at, observed + 1000)).toBe("FRESH");
    expect(freshnessForTest(snapshot.observed_at, observed + 37 * 60 * 60 * 1000)).toBe("STALE");
    expect(freshnessForTest("not-a-date", observed)).toBe("UNMEASURED");
  });
});
