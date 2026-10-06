import { describe, expect, it } from "vitest";
import FREE from "./gspc-tools.json";
import PAID from "./paid-tools.json";

const tool = (rows: any[], name: string) => rows.find((row: any) => row.name === name);

describe("MCP security metadata", () => {
  it("constrains endpoint selectors to HTTP(S) URI shapes", () => {
    for (const [rows, name, field] of [
      [FREE.tools, "server_evidence", "endpoint_url"],
      [PAID.tools, "art50_marking_evidence", "url"],
    ] as const) {
      const schema = tool(rows as any[], name)?.inputSchema?.properties?.[field];
      expect(schema).toMatchObject({
        type: "string",
        format: "uri",
        pattern: "^https?://",
        maxLength: 2048,
      });
    }
  });

  it("keeps server_evidence description scoped to itself", () => {
    const description = tool(FREE.tools as any[], "server_evidence")?.description ?? "";
    expect(description).not.toMatch(/verify_capsule/i);
    expect(description).toMatch(/independent verification/i);
  });
});
