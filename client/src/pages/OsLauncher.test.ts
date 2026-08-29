import { describe, expect, it } from "vitest";
import LobbyBoardPane from "@/components/lobby/LobbyBoardPane";
import { BOARD_PANE, DOORS, doorFromSearch, osLeaveForSearch } from "./OsLauncher";

describe("OsLauncher doors", () => {
  it("keeps the header rail to native instruments plus MCP", () => {
    expect(DOORS.map((d) => d.id)).toEqual(["board", "verify", "cards", "harness"]);
  });

  it("maps ?lobby= onto those panes, including a harness panel query", () => {
    expect(doorFromSearch("lobby=board")).toBe("board");
    expect(doorFromSearch("embed=1&lobby=board")).toBe("board");
    expect(doorFromSearch("lobby=verify")).toBe("verify");
    expect(doorFromSearch("lobby=cards")).toBe("cards");
    expect(doorFromSearch("lobby=harness")).toBe("harness");
    expect(doorFromSearch("lobby=home")).toBe("board");
    expect(doorFromSearch("")).toBe("board");
  });

  it("keeps old space/assess deep-links as content, not header doors", () => {
    expect(doorFromSearch("lobby=space")).toBe("space");
    expect(doorFromSearch("lobby=assess")).toBe("assess");
    expect(doorFromSearch("task=pricing-overview")).toBe("assess");
    expect(DOORS.some((d) => d.id === "space" || d.id === "assess")).toBe(false);
  });

  it("mounts LobbyBoardPane for /os?lobby=board — not an iframe", () => {
    expect(doorFromSearch("lobby=board")).toBe("board");
    expect(BOARD_PANE).toBe(LobbyBoardPane);
  });

  it("sends /os?lobby=software to /dashboard as a real navigation", () => {
    expect(osLeaveForSearch("lobby=software")).toBe("/dashboard");
    expect(osLeaveForSearch("lobby=board")).toBeNull();
  });
});

