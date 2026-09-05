import { describe, expect, it } from "vitest";
import type { SovTool, ToolResult } from "../lib/sovTools";
import {
  coerceToolArguments,
  fieldKind,
  initialToolDraft,
  isPaidTool,
  prefillToolDraft,
  resultOutcome,
} from "./ToolRunner";

const typedTool: SovTool = {
  name: "typed_tool",
  description: "test",
  inputSchema: {
    type: "object",
    properties: {
      subject: { type: "string" },
      limit: { type: "integer", minimum: 0, maximum: 150 },
      threshold: { type: "number" },
      preview: { type: "boolean" },
      metadata: { type: "object" },
      optional: { type: "string" },
    },
    required: ["subject"],
  },
};

describe("MCP tool form model", () => {
  it("recognises primitive, JSON and object-or-string schemas", () => {
    expect(fieldKind({ type: "integer" })).toBe("integer");
    expect(fieldKind({ type: "boolean" })).toBe("boolean");
    expect(fieldKind({ type: "object" })).toBe("object");
    expect(fieldKind({ anyOf: [{ type: "object" }, { type: "string" }] })).toBe(
      "json-or-string",
    );
  });

  it("seeds booleans without pretending optional text has a value", () => {
    expect(initialToolDraft(typedTool)).toEqual({
      subject: "",
      limit: "",
      threshold: "",
      preview: false,
      metadata: "",
      optional: "",
    });
  });

  it("prefills only arguments advertised by the selected tool", () => {
    expect(
      prefillToolDraft(typedTool, {
        subject: "game:defbench",
        preview: true,
        unknown: "must not cross the schema boundary",
      }),
    ).toEqual({
      subject: "game:defbench",
      limit: "",
      threshold: "",
      preview: true,
      metadata: "",
      optional: "",
    });
  });

  it("sends values using the types advertised by JSON Schema", () => {
    expect(
      coerceToolArguments(typedTool, {
        subject: "model/example",
        limit: "12",
        threshold: "0.75",
        preview: true,
        metadata: '{"source":"browser"}',
        optional: "",
      }),
    ).toEqual({
      ok: true,
      args: {
        subject: "model/example",
        limit: 12,
        threshold: 0.75,
        preview: true,
        metadata: { source: "browser" },
      },
    });
  });

  it("accepts either a card object or a URL for verify_card", () => {
    const verify: SovTool = {
      name: "verify_card",
      description: "test",
      inputSchema: {
        type: "object",
        properties: {
          card: { anyOf: [{ type: "object" }, { type: "string" }] },
        },
        required: ["card"],
      },
    };
    expect(coerceToolArguments(verify, { card: '{"id":"gspc:1"}' })).toEqual({
      ok: true,
      args: { card: { id: "gspc:1" } },
    });
    expect(
      coerceToolArguments(verify, {
        card: "https://councilof.ai/signed/example.json",
      }),
    ).toEqual({
      ok: true,
      args: { card: "https://councilof.ai/signed/example.json" },
    });
  });

  it("blocks missing, fractional and malformed values before tools/call", () => {
    const result = coerceToolArguments(typedTool, {
      subject: "",
      limit: "2.5",
      threshold: "not-a-number",
      preview: false,
      metadata: "[]",
      optional: "",
    });
    expect(result.ok).toBe(false);
    if (!("errors" in result)) throw new Error("expected validation errors");
    expect(result.errors).toMatchObject({
      subject: "Required.",
      limit: "Enter a whole number.",
      threshold: "Enter a valid number.",
      metadata: expect.stringContaining("JSON object"),
    });
  });

  it("keeps access tier and runtime outcome distinct from evidence status", () => {
    expect(
      isPaidTool({ ...typedTool, csoai: { paid: true, rail: "x402" } }),
    ).toBe(true);
    const observed: ToolResult = {
      ok: true,
      state: "runtime_observed",
      text: "challenge",
      structuredContent: { status: "PAYMENT_REQUIRED" },
    };
    expect(resultOutcome(observed)).toBe("PAYMENT_REQUIRED");
  });
});
