import { describe, expect, it } from "vitest";
import { onRequestGet } from "./free-door";

// x402scan and AgentCash (@agentcash/discovery 1.7.5, extractSchemas2) read a v2 door's schemas from
// FIXED paths: input = schema.properties.input.properties.body ?? .queryParams, output =
// schema.properties.output.properties.example — each must be a JSON object. Absent, the door is
// reported SCHEMA_INPUT_MISSING / SCHEMA_OUTPUT_MISSING (severity "error"), which is what the free
// door drew at every registration until 2026-09-28.
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const challenge = async () => {
  const r = await onRequestGet({
    request: new Request("https://councilof.ai/api/free-door"),
    env: {},
  } as Parameters<typeof onRequestGet>[0]);
  expect(r.status).toBe(402);
  return (await r.json()) as any;
};

describe("free door: discovery input/output schemas at the paths indexers read", () => {
  it("declares an input schema at schema.properties.input.properties.queryParams that admits no parameters", async () => {
    const { extensions } = await challenge();
    const qp = extensions.bazaar.schema.properties.input.properties.queryParams;
    expect(isRecord(qp)).toBe(true);
    expect(qp.type).toBe("object");
    expect(qp.properties).toEqual({});
    expect(qp.additionalProperties).toBe(false);
    // info.input still names no queryParams, so the facilitator's info-vs-schema check is unchanged
    expect(Object.keys(extensions.bazaar.info.input).sort()).toEqual(["method", "type"]);
    expect(extensions.bazaar.schema.properties.input.required).toEqual(["type", "method"]);
  });

  it("declares an output schema at schema.properties.output.properties.example that the advertised example satisfies", async () => {
    const { extensions } = await challenge();
    const out = extensions.bazaar.schema.properties.output.properties.example;
    expect(isRecord(out)).toBe(true);
    const example = extensions.bazaar.info.output.example as Record<string, unknown>;
    for (const k of out.required as string[]) expect(example, `example lacks required ${k}`).toHaveProperty(k);
    for (const [k, v] of Object.entries(example)) {
      const prop = out.properties[k];
      expect(prop, `example key ${k} is not declared`).toBeTruthy();
      if ("const" in prop) expect(v).toBe(prop.const);
      if (prop.type === "string") expect(typeof v).toBe("string");
      if (prop.type === "number") expect(typeof v).toBe("number");
    }
  });
});
