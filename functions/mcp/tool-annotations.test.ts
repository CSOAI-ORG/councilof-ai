import { describe, expect, it } from "vitest";
import FREE from "./gspc-tools.json";
import PAID from "./paid-tools.json";

/**
 * MCP tool annotations and output schemas (developer-persona finding, 2026-09-26: none of the
 * thirteen tools carried annotations; seven of nine free tools had no outputSchema though every one
 * returns structuredContent). tools/list on both transports serves these two files verbatim.
 */
type Tool = { name: string; title?: string; annotations?: Record<string, unknown>; outputSchema?: { type?: string; required?: string[] } };

describe("tool definitions carry annotations and outputSchema", () => {
  it("every free tool is a read-only, non-destructive, idempotent, open-world reader with an object outputSchema", () => {
    for (const t of (FREE as { tools: Tool[] }).tools) {
      expect(t.annotations, t.name).toMatchObject({ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true });
      expect(t.title, t.name).toBeTruthy();
      expect(t.outputSchema?.type, t.name).toBe("object");
    }
  });

  it("every paid tool is NOT read-only and NOT idempotent (with x_payment each call spends), and never destructive", () => {
    for (const t of (PAID as { tools: Tool[] }).tools) {
      expect(t.annotations, t.name).toMatchObject({ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true });
      expect(t.outputSchema?.required, t.name).toEqual(["status"]);
    }
  });

  it("no outputSchema requires a field a documented non-error state omits (only `state`/`status` are required)", () => {
    for (const t of [...(FREE as { tools: Tool[] }).tools, ...(PAID as { tools: Tool[] }).tools]) {
      for (const r of t.outputSchema?.required ?? []) expect(["state", "status"], `${t.name} requires ${r}`).toContain(r);
    }
  });
});
