import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { wantsGetMeasured } from "@/components/os/osChat";

const here = resolve(__dirname);
const src = [
  readFileSync(resolve(here, "HomeVerify.tsx"), "utf8"),
  readFileSync(resolve(here, "../components/home/HomeComposer.tsx"), "utf8"),
  readFileSync(resolve(here, "../components/home/HomeBoard.tsx"), "utf8"),
  readFileSync(resolve(here, "../components/home/PluginBlock.tsx"), "utf8"),
]
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const app = readFileSync(resolve(here, "../App.tsx"), "utf8");
const header = readFileSync(resolve(here, "../components/Header.tsx"), "utf8");
const tools = readFileSync(resolve(here, "ToolsPage.tsx"), "utf8");
const footer = readFileSync(resolve(here, "../components/Footer.tsx"), "utf8");

describe("homepage is chat + GSPC list", () => {
  it("is OpenRouter layout without tokens or AG-UI", () => {
    expect(src).toMatch(/Check an AI claim\. Or measure your system\./);
    expect(src).toContain('href="/gspc-verify"');
    expect(src).toContain('href="/assess"');
    expect(src).toContain('id="os-chat"');
    expect(src).toContain("GSPC leaderboard");
    expect(src).toContain("https://councilof.ai/mcp");
    expect(src).toContain("Claude");
    expect(src).toContain("Cursor");
    expect(src).toContain("Kimi");
    expect(src).toContain("Grok");
    expect(src).toContain("/tools");
    expect(src).toContain("Empty means not measured");
    expect(src).toContain("Run / re-attest");
    expect(src).toContain("Ledger");
    expect(src).toContain("Not a ranking for sale");
    expect(src).not.toContain("OsShell");
    expect(src).not.toContain("/govbench");
    expect(src).not.toMatch(/GET \/api\/gspc/);
    expect(src).not.toMatch(/Open Council OS|coliseum|GPAI Evidence|cobol|ToolStack/i);
    expect(src).not.toMatch(/p-value|separation_p/);
    expect(src).not.toMatch(/certified organization|buy a rank/i);
    expect(src).not.toMatch(/AG-UI|AG UI/);
  });

  it("routes Claude-at-work to get measured", () => {
    expect(wantsGetMeasured("I use Claude at work")).toBe(true);
    expect(src).toContain("wantsGetMeasured");
  });

  it("App keeps AG-UI off /", () => {
    expect(app).toContain("component={HomeVerify}");
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
    expect(header).not.toContain("Start free");
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

describe("footer 20%", () => {
  it("keeps the three arms and drops Academy / MCP Fleet from Product", () => {
    expect(footer).toContain("Run / re-attest");
    expect(footer).toContain("Ledger");
    expect(footer).toContain("Data");
    expect(footer).not.toMatch(/name: 'Academy'/);
    expect(footer).not.toMatch(/name: 'MCP Fleet'/);
  });
});
