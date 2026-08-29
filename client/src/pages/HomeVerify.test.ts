import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { wantsGetMeasured } from "@/components/os/osChat";

const home = readFileSync(resolve(__dirname, "HomeVerify.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const header = readFileSync(resolve(__dirname, "../components/Header.tsx"), "utf8");
const tools = readFileSync(resolve(__dirname, "ToolsPage.tsx"), "utf8");

describe("homepage is chat + GSPC list", () => {
  it("is OpenRouter layout without tokens or AG-UI", () => {
    expect(home).toMatch(/Check an AI claim\. Or measure your system\./);
    expect(home).toContain('href="/gspc-verify"');
    expect(home).toContain('href="/assess"');
    expect(home).toContain('id="os-chat"');
    expect(home).toContain("GSPC board");
    expect(home).toContain("https://councilof.ai/mcp");
    expect(home).toContain("/tools");
    expect(home).toContain("Run / re-attest");
    expect(home).toContain("Ledger");
    expect(home).toContain("Not a ranking for sale");
    expect(home).not.toContain("OsShell");
    expect(home).not.toContain("/govbench");
    expect(home).not.toMatch(/GET \/api\/gspc/);
    expect(home).not.toMatch(/Open Council OS|coliseum|GPAI Evidence|cobol|ToolStack/i);
    expect(home).not.toMatch(/p-value|separation_p/);
    expect(home).toContain("Not a ranking for sale");
    expect(home).not.toMatch(/certified organization|buy a rank/i);
  });

  it("routes Claude-at-work to get measured", () => {
    expect(wantsGetMeasured("I use Claude at work")).toBe(true);
  });

  it("App keeps AG-UI off /", () => {
    expect(app).toContain('component={HomeVerify}');
    expect(app).not.toMatch(/path === '\/' \|\| path === '\/os'/);
  });
});

describe("header is five words", () => {
  it("is Logo · Verify · Get measured · Board · Tools", () => {
    expect(header).toContain('name: "Verify"');
    expect(header).toContain('name: "Get measured"');
    expect(header).toContain('name: "Board"');
    expect(header).toContain('name: "Tools"');
    expect(header).not.toContain("Chat is Council OS");
  });
});

describe("/tools is the plugin snippet", () => {
  it("lists four hosts and one MCP URL", () => {
    expect(tools).toContain("Claude");
    expect(tools).toContain("Cursor");
    expect(tools).toContain("Kimi");
    expect(tools).toContain("Grok");
    expect(tools).toContain("https://councilof.ai/mcp");
    expect(tools).toMatch(/Ask: board totals/);
    expect(tools).not.toMatch(/lifestyle/i);
  });
});
