import { describe, expect, it } from "vitest";
import { onRequestGet } from "./certificate-schema";

const call = async () => {
  const res = await (onRequestGet as unknown as Function)({ env: {} });
  return { status: res.status, body: await res.json() };
};

describe("/api/certificate-schema — PHASE3 C.2 contract", () => {
  it("returns the schema endpoint contract", async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body.schema).toBe("csoai.certificate-schema-endpoint/0.1");
    expect(body.endpoint).toBe("/api/certificate-schema");
    expect(body.schema_version).toBe("csoai.certificate/0.1");
  });

  it("lists all required fields by name", async () => {
    const { body } = await call();
    for (const f of body.required_fields) {
      expect(typeof f).toBe("string");
      expect(f.length).toBeGreaterThan(0);
    }
    expect(body.required_fields.length).toBeGreaterThanOrEqual(7);
  });

  it("states hard doctrine: non_certification, non_promotion, writes_board:false", async () => {
    const { body } = await call();
    const doctrine = body.hard_doctrine.join(" | ");
    expect(doctrine).toContain("non_certification");
    expect(doctrine).toContain("non_promotion");
    expect(doctrine).toContain("writes_board");
  });

  it("names the schema URL and verification paths", async () => {
    const { body } = await call();
    expect(body.schema_url).toContain("csoai-certificate-0.1.schema.json");
    expect(body.relationships.verified_by.length).toBeGreaterThanOrEqual(1);
    expect(body.relationships.signed_by[0]).toMatch(/^did:web:.+#board-attestation-1\b/);
    expect(body.relationships.superseded_by[0]).toContain("refund-record");
  });

  it("embeds the schema JSON itself", async () => {
    const { body } = await call();
    expect(body.schema_json["$id"]).toContain("csoai-certificate-0.1.schema.json");
    expect(body.schema_json.properties.schema.const).toBe("csoai.certificate/0.1");
  });
});
