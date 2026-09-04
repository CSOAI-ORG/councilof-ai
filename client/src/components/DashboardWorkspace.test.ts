import { describe, expect, it } from "vitest";
import { paneForTool } from "./DashboardWorkspace";
import { LOBBY_TABS } from "./lobby/tabs";

describe("canonical dashboard workspace", () => {
  it("names the canonical living board GSPC", () => {
    expect(LOBBY_TABS.find((tab) => tab.id === "board")?.label).toBe("GSPC");
  });

  it("opens every currently published free MCP tool in a usable pane", () => {
    expect(paneForTool("board_totals")).toBe("board");
    expect(paneForTool("get_axis")).toBe("board");
    expect(paneForTool("verify_card")).toBe("verify");
    expect(paneForTool("list_cards")).toBe("cards");
    expect(paneForTool("get_root")).toBe("attestations");
    expect(paneForTool("get_card")).toBe("cards");
    expect(paneForTool("verify_inclusion")).toBe("attestations");
  });

  it("sends newly discovered tools to the live Tools workspace instead of inventing a UI", () => {
    expect(paneForTool("future_runtime_tool")).toBe("tools");
  });
});
