import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import LobbyBoardPane from "@/components/lobby/LobbyBoardPane";
import { BOARD_PANE, DOORS, doorFromSearch, osLeaveForSearch } from "./OsLauncher";

const launcher = readFileSync(resolve(__dirname, "OsLauncher.tsx"), "utf8");
const lobbyHome = readFileSync(resolve(__dirname, "../components/lobby/LobbyHome.tsx"), "utf8");

describe("OsLauncher doors", () => {
  it("keeps the header rail to Board · Verify · Space · Assess · Harness", () => {
    expect(DOORS.map((d) => d.id)).toEqual(["board", "verify", "space", "assess", "harness"]);
    expect(DOORS.map((d) => d.label)).toEqual(["Board", "Verify", "Space", "Assess", "Harness"]);
  });

  it("maps ?lobby= onto those panes, including a harness panel query", () => {
    expect(doorFromSearch("lobby=board")).toBe("board");
    expect(doorFromSearch("embed=1&lobby=board")).toBe("board");
    expect(doorFromSearch("lobby=verify")).toBe("verify");
    expect(doorFromSearch("lobby=cards")).toBe("cards");
    expect(doorFromSearch("lobby=harness")).toBe("harness");
    expect(doorFromSearch("lobby=home")).toBeNull();
    expect(doorFromSearch("")).toBeNull();
  });

  it("maps space/assess deep-links onto header doors", () => {
    expect(doorFromSearch("lobby=space")).toBe("space");
    expect(doorFromSearch("lobby=assess")).toBe("assess");
    expect(doorFromSearch("task=pricing-overview")).toBe("assess");
    expect(doorFromSearch("task=read-the-board")).toBe("board");
    expect(DOORS.map((d) => d.id)).toContain("space");
    expect(DOORS.map((d) => d.id)).toContain("assess");
  });

  it("mounts LobbyBoardPane for /os?lobby=board — not an iframe", () => {
    expect(doorFromSearch("lobby=board")).toBe("board");
    expect(BOARD_PANE).toBe(LobbyBoardPane);
  });

  it("sends /os?lobby=software to /dashboard as a real navigation", () => {
    expect(osLeaveForSearch("lobby=software")).toBe("/dashboard");
    expect(osLeaveForSearch("lobby=board")).toBeNull();
  });

  it("mounts the product frame — header, door body, chat — not OsShell", () => {
    expect(launcher).toContain("<OsHeader");
    expect(launcher).toContain("<OsDoorBody");
    expect(launcher).toContain('id="os-chat"');
    expect(launcher).toContain("openLobby");
    expect(launcher).toContain("/gspc-verify");
    expect(launcher).toContain("/assess");
    expect(launcher).not.toContain("Free. The card is yours.");
    expect(launcher).toContain("Coming — Paddle");
    expect(launcher).toContain("/report");
    expect(launcher).toContain("HfLivingRecord");
    expect(launcher).toContain("/xrpl-attest");
    expect(launcher).toContain("huggingface.co/datasets/csoai/gspc-boards");
    expect(launcher).not.toMatch(/<OsShell|import OsShell/);
    expect(launcher).toContain('data-testid="os-directory"');
    expect(launcher).toContain("parseTerminal");
    expect(launcher).toContain("TERMINAL_HINT");
    expect(launcher).toContain("COMPUTE");
    expect(launcher).toContain("/api/compute");
    const doors = readFileSync(resolve(__dirname, "../components/os/OsDoors.tsx"), "utf8");
    expect(doors).toContain("/api/compute");
    expect(doors).toContain("AGUI_WIRE_URL");
    expect(doors).toContain("PublicRootCatalogue");
    expect(doors).not.toMatch(/MEASURED from the lobby/);
  });

  it("OsHeader door buttons are addressable so an end user can hop panes", () => {
    const header = readFileSync(resolve(__dirname, "../components/os/OsHeader.tsx"), "utf8");
    expect(header).toContain('data-testid={`os-door-${door.id}`}');
    expect(header).toContain("osDoorHref");
  });

  it("LobbyHome mounts the Hub record next to the living board — no Space iframe", () => {
    expect(lobbyHome).toContain("HfLivingRecord");
    expect(lobbyHome).toContain("LivingBoard");
    expect(lobbyHome).not.toMatch(/<iframe/i);
  });
});
