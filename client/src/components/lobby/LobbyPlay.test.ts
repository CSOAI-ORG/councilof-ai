import { describe, expect, it } from "vitest";
import { playHref } from "./LobbyPlay";
import { PLAY_CARDS } from "./play";

describe("Play gallery links", () => {
  // Tools audit, 6 Oct 2026: the Coliseum's route is a Council OS pane, which dashboardViewHref
  // refuses to frame, so "Open in workspace" fell back to Everything A–Z.
  it("opens the Coliseum in its own pane, not the catalogue", () => {
    const coliseum = PLAY_CARDS.find((c) => c.id === "coliseum");
    expect(coliseum?.route).toBe("/dashboard?tab=space");
    expect(playHref(coliseum!.route!, coliseum!.title)).toBe("/dashboard?tab=space");
  });

  it("no live card falls back to the catalogue", () => {
    for (const c of PLAY_CARDS.filter((card) => card.status === "route" && card.route)) {
      expect(playHref(c.route!, c.title), c.id).not.toBe("/dashboard?tab=explore");
    }
  });
});
