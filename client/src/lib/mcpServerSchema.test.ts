import { describe, expect, it } from "vitest";
import { gspcBoardDataset, GSPC_BOARD_PAGE } from "./datasetSchema";
import { councilMcpServerLd, MCP_CONNECT_PAGE, MCP_FREE_ENDPOINT } from "./mcpServerSchema";
import { COUNCIL_ORG } from "./orgNode";

describe("structured data for the board and the MCP door (2026-11-17)", () => {
  it("names the public board page, not a redirect into the workspace", () => {
    // /gspc-scoreboard is 308'd to /dashboard?tab=board by public/_redirects.
    const board = gspcBoardDataset(false);
    expect(GSPC_BOARD_PAGE).toBe("https://councilof.ai/board/");
    expect(board.url).toBe(GSPC_BOARD_PAGE);
    expect(board["@id"]).toBe("https://councilof.ai/board/#dataset");
    expect(JSON.stringify(gspcBoardDataset(true))).not.toContain("gspc-scoreboard");
  });

  it("describes the free MCP door by its endpoint, without a count, a price or an offer", () => {
    const ld = councilMcpServerLd();
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("WebAPI");
    expect(ld.url).toBe(MCP_FREE_ENDPOINT);
    expect(ld.documentation).toBe(MCP_CONNECT_PAGE);
    expect(ld.provider).toBe(COUNCIL_ORG);
    const text = JSON.stringify(ld);
    expect(text).not.toMatch(/\d+\s+(free\s+)?(read-only\s+)?tools/i);
    expect(text).not.toMatch(/"(price|offers|priceCurrency)"/);
  });

  it("every node names one organisation, by the @id client/index.html declares", () => {
    expect(COUNCIL_ORG["@id"]).toBe("https://councilof.ai/#org");
    expect(COUNCIL_ORG.name).toBe("Council of AI");
    expect(gspcBoardDataset(false).publisher).toBe(COUNCIL_ORG);
  });
});
