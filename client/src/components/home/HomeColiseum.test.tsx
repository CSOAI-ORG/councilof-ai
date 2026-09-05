import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import HomeColiseum from "./HomeColiseum";
import { BOSS_CHAIR_SCENARIOS } from "../lobby/bossChairModel";

describe("homepage Coliseum showcase", () => {
  const html = renderToStaticMarkup(<Router ssrPath="/"><HomeColiseum /></Router>);

  it("opens the playable eight-round browser game in the canonical workspace", () => {
    expect(BOSS_CHAIR_SCENARIOS).toHaveLength(8);
    expect(html).toContain("Put humans back in charge.");
    expect(html).toContain("/dashboard?tab=play&amp;game=boss-chair");
    expect(html).toContain("/dashboard?tab=learn");
    expect(html).toContain("not a live AI opponent");
    expect(html).toContain("Practice scores do not update GSPC");
  });

  it("labels future battles without manufacturing join links", () => {
    const future = html.slice(html.indexOf("Human vs AI"));
    expect(future.match(/In development/g)).toHaveLength(2);
    expect(future).not.toMatch(/join|battle-now|tab=swarm|tab=duel/i);
    expect(html).toContain("Networked team matches are not available yet");
  });

  it("uses published artwork, lazy loaded, with no injected gradients or video downloads", () => {
    for (const match of html.matchAll(/src="([^"]+)"/g)) {
      expect(existsSync(resolve(process.cwd(), `public${match[1]}`))).toBe(
        true,
      );
    }
    expect(html.match(/loading="lazy"/g)).toHaveLength(3);
    expect(html).not.toMatch(/<video|gradient|iframe/);
  });

  it("replaces homepage mirror directories without removing the original sections", () => {
    const home = readFileSync(
      resolve(__dirname, "../../pages/HomeVerify.tsx"),
      "utf8",
    );
    expect(home).not.toMatch(/HfLivingRecord|ReachStrip/);
    for (const component of [
      "HeroSlides",
      "LiveLeaderboard",
      "HomeColiseum",
      "ToolStack",
      "HomeFilms",
      "LivingStages",
      "HomeCinematicWorlds",
    ]) {
      expect(home).toContain(`<${component}`);
    }
  });
});
