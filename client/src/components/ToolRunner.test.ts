import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ToolRunner, {
  coerceToolArguments,
  fieldKind,
  initialToolDraft,
  isPaidTool,
  prefillToolDraft,
  outputHeader,
  resultOutcome,
  type RunnerTool,
  type RunnerToolResult,
} from "./ToolRunner";
import { mcpRpcEndpoints } from "@/lib/sovTools";

const typedTool: RunnerTool = {
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
  it("keeps catalog probes same-origin unless public fallback is explicit", () => {
    expect(mcpRpcEndpoints("councilof.ai")).toEqual(["/mcp"]);
    expect(mcpRpcEndpoints("127.0.0.1")).toEqual(["/mcp"]);
    expect(mcpRpcEndpoints("localhost")).toEqual(["/mcp"]);
    expect(mcpRpcEndpoints("localhost", "tools/list", true)).toEqual([
      "/mcp",
      "https://councilof.ai/mcp",
    ]);
  });

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
    const verify: RunnerTool = {
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
    const observed: RunnerToolResult = {
      ok: true,
      state: "runtime_observed",
      text: "challenge",
      structuredContent: { status: "PAYMENT_REQUIRED" },
    };
    expect(resultOutcome(observed)).toBe("PAYMENT_REQUIRED");
  });

  // Tools audit, 6 Oct 2026: a paid tool's 402 challenge was headed "UNCHECKABLE" in rose.
  it("heads a 402 challenge PAYMENT REQUIRED, nothing charged, never UNCHECKABLE", () => {
    const challenge: RunnerToolResult = {
      ok: false,
      state: "unchecked",
      text: "Payment required",
      structuredContent: { status: "PAYMENT_REQUIRED", nothing_charged: true },
    };
    const head = outputHeader(challenge);
    expect(head.word).toBe("PAYMENT REQUIRED: nothing has been charged");
    expect(head.tone).toBe("payment");
    expect(head.meaning).toMatch(/Nothing has been paid/);
    expect(head.word).not.toMatch(/UNCHECKABLE/);
    // Other outcomes keep their words.
    expect(outputHeader({ ok: true, state: "runtime_observed", text: "" }).word).toBe("RUNTIME_OBSERVED");
    expect(outputHeader({ ok: false, state: "unreachable", text: "" }).word).toBe("UNREACHABLE");
    expect(outputHeader({ ok: false, state: "unchecked", text: "", structuredContent: { status: "BAD_ARGUMENTS" } }).word).toBe("UNCHECKABLE");
  });
});

describe("a required enum starts unchosen", () => {
  // evidence_bundle_preview / evidence_bundle carry a required obligation enum. The select showed
  // its first value while the form held "", so Run answered "Required." beside a filled-looking field.
  const enumTool: RunnerTool = {
    name: "evidence_bundle_preview",
    description: "test",
    inputSchema: {
      type: "object",
      properties: {
        obligation: { type: "string", enum: ["article-50", "article-53", "dora", "cra"] },
        subject: { type: "string" },
      },
      required: ["obligation"],
    },
  };

  it("shows a disabled Choose option as the selected value, matching the empty draft", () => {
    const html = renderToStaticMarkup(createElement(ToolRunner, { catalogue: [enumTool], initialToolName: enumTool.name }));
    expect(html).toMatch(/<option value="" disabled="" selected="">Choose…<\/option>/);
    expect(html).not.toMatch(/<option value="article-50" selected/);
    expect(initialToolDraft(enumTool).obligation).toBe("");
    const blocked = coerceToolArguments(enumTool, initialToolDraft(enumTool));
    expect("errors" in blocked && blocked.errors.obligation).toBe("Required.");
  });

  it("an optional enum still offers Not set", () => {
    const optional: RunnerTool = { ...enumTool, inputSchema: { ...enumTool.inputSchema, required: [] } };
    const html = renderToStaticMarkup(createElement(ToolRunner, { catalogue: [optional], initialToolName: optional.name }));
    expect(html).toContain('<option value="" selected="">Not set</option>');
    expect(html).not.toContain("Choose…");
  });
});
