import { describe, expect, it } from "vitest";
import { onRequestGet as manifest } from "../.well-known/x402.json";
import { onRequestGet as commission } from "./request-attestation";
import { REQUEST_ATTESTATION_DESCRIPTION } from "./_x402_descriptions";

describe("commission discovery contract", () => {
  it("advertises the same deliverable as the unpaid endpoint challenge", async () => {
    const context = (path: string) => ({ request: new Request(`https://councilof.ai${path}`), env: {} });
    const catalogueResponse = await manifest(context("/.well-known/x402.json") as Parameters<typeof manifest>[0]);
    const catalogue = await catalogueResponse.json() as { resources: { url: string; description: string; accepts: { description: string }[] }[] };
    const door = catalogue.resources.find((row) => new URL(row.url).pathname === "/api/request-attestation");
    expect(door).toBeDefined();
    expect(door!.description).toBe(REQUEST_ATTESTATION_DESCRIPTION);
    expect(door!.accepts[0].description).toBe(REQUEST_ATTESTATION_DESCRIPTION);
    // No subject means no reserve fetch, and no payment header means no facilitator call.
    const response = await commission(context("/api/request-attestation") as Parameters<typeof commission>[0]);
    expect(response.status).toBe(402);
    const challenge = await response.json() as { resource: { description: string } };
    expect(challenge.resource.description).toBe(door!.description);
    expect(door!.description).toContain("commission receipt");
    expect(door!.description).toContain("Payment never mints a MEASURED cell");
    expect(door!.description).not.toContain("rooted and witnessed");
  });
});
