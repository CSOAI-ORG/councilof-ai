import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LobbyChat } from "@/components/lobby/useLobbyChat";
import { DashboardChatRail } from "./DashboardRightRail";

function chatFixture(): LobbyChat {
  const thread = {
    id: "thread-1",
    title: "Show me the measured care axis",
    startedAt: "2026-09-04T04:00:00Z",
    turns: [
      {
        role: "user" as const,
        text: "Show me the measured care axis",
        at: "2026-09-04T04:00:00Z",
      },
      {
        role: "council" as const,
        text: "The care axis is **MEASURED** from the published board.",
        state: "grounded",
        signature: "GET /api/gspc",
        at: "2026-09-04T04:00:01Z",
      },
    ],
  };
  return {
    threads: [thread],
    activeId: thread.id,
    active: thread,
    busy: false,
    send: async () => {},
    startThread: () => {},
    selectThread: () => {},
    clearHistory: () => {},
    turnCount: thread.turns.length,
  };
}

describe("dashboard chat rail", () => {
  it("renders the actual active thread beside the tool canvas and keeps history reachable", () => {
    const html = renderToStaticMarkup(
      <DashboardChatRail chat={chatFixture()} />,
    );
    expect(html).toContain('role="log"');
    expect(html).toContain("Show me the measured care axis");
    expect(html).toContain("The care axis is");
    expect(html).toContain("Current conversation");
    expect(html).toContain("History 1");
    expect(html).toContain("Reloading restores it");
    expect(html).toContain("Clear history removes it");
  });

  it("does not invent a transcript when no thread is active", () => {
    const chat = chatFixture();
    chat.activeId = null;
    chat.active = null;
    chat.turnCount = 0;
    const html = renderToStaticMarkup(<DashboardChatRail chat={chat} />);
    expect(html).toContain("No active conversation");
    expect(html).not.toContain('role="log"');
    expect(html).toContain("Open thread history");
  });
});
