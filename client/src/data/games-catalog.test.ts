/**
 * games-catalog.test.ts — tests for the living Council OS Games catalog.
 *
 * Enforced invariants:
 *   1. Every catalogued path is in PRIMARY_PATHS.
 *   2. FORBIDDEN games (Murder, Difflin, Mundrr) are NOT in the catalog as play surfaces.
 *   3. No typed board counts anywhere in the catalog.
 *   4. Play surfaces claim to use live board (usesLiveBoard: true).
 *   5. Broken surfaces are marked broken: true.
 */

import { describe, it, expect } from "vitest";
import {
  GAMES_CATALOG,
  CATALOG_PATHS,
  PLAY_SURFACES,
  WORKING_SURFACES,
  LEFTOVER_SURFACES,
  FROZEN_SURFACES,
  IN_BUILD_CARDS,
  LOCAL_ONLY_HARNESSES,
  FORBIDDEN_GAME_NAMES,
  isForbiddenGame,
} from "./games-catalog";
import { PRIMARY_PATHS } from "./library-ia";

describe("games-catalog", () => {
  describe("PRIMARY_PATHS coverage", () => {
    it("every catalogued path is in PRIMARY_PATHS", () => {
      const missing: string[] = [];
      for (const path of CATALOG_PATHS) {
        if (!PRIMARY_PATHS.has(path)) {
          missing.push(path);
        }
      }
      expect(missing).toEqual([]);
    });
  });

  describe("forbidden games", () => {
    it("Murder is not a catalogued play surface", () => {
      const murder = PLAY_SURFACES.find(
        (g) => g.name.toLowerCase().includes("murder")
      );
      expect(murder).toBeUndefined();
    });

    it("Difflin is not a catalogued play surface", () => {
      const difflin = PLAY_SURFACES.find(
        (g) => g.name.toLowerCase().includes("difflin")
      );
      expect(difflin).toBeUndefined();
    });

    it("Mundrr is not a catalogued play surface", () => {
      const mundrr = PLAY_SURFACES.find(
        (g) => g.name.toLowerCase().includes("mundrr")
      );
      expect(mundrr).toBeUndefined();
    });

    it("isForbiddenGame correctly identifies forbidden names", () => {
      expect(isForbiddenGame("Murder")).toBe(true);
      expect(isForbiddenGame("murder")).toBe(true);
      expect(isForbiddenGame("Difflin")).toBe(true);
      expect(isForbiddenGame("Mundrr")).toBe(true);
      expect(isForbiddenGame("Council Space")).toBe(false);
      expect(isForbiddenGame("Coliseum")).toBe(false);
    });

    it("no FORBIDDEN_GAME_NAMES appear as play surface names", () => {
      const forbidden = PLAY_SURFACES.filter((g) =>
        FORBIDDEN_GAME_NAMES.some(
          (f) => g.name.toLowerCase() === f.toLowerCase()
        )
      );
      expect(forbidden).toEqual([]);
    });
  });

  describe("no typed board counts", () => {
    it("catalog descriptions do not contain typed axis counts", () => {
      const typedCountPattern = /\b(12|13|14|15|16|17)\s*(axis|axes)\b/i;
      const withTypedCounts: string[] = [];

      for (const entry of GAMES_CATALOG) {
        if (typedCountPattern.test(entry.description)) {
          withTypedCounts.push(`${entry.name}: "${entry.description}"`);
        }
      }

      expect(withTypedCounts).toEqual([]);
    });

    it("catalog descriptions reference GET /api/gspc for counts", () => {
      const playAndPrinter = GAMES_CATALOG.filter(
        (g) => g.kind === "play" || g.kind === "printer"
      );
      const withoutApiRef = playAndPrinter.filter(
        (g) => g.usesLiveBoard && !g.description.includes("/api/gspc")
      );
      expect(withoutApiRef).toEqual([]);
    });
  });

  describe("catalog integrity", () => {
    it("has at least one play surface", () => {
      expect(PLAY_SURFACES.length).toBeGreaterThan(0);
    });

    it("Council Space is the only live play surface", () => {
      expect(PLAY_SURFACES.length).toBe(1);
      expect(PLAY_SURFACES[0].name).toBe("Council Space");
      expect(PLAY_SURFACES[0].path).toBe("/gspc-arena");
    });

    it("play surfaces use live board", () => {
      const playWithoutLiveBoard = PLAY_SURFACES.filter(
        (g) => !g.usesLiveBoard
      );
      expect(playWithoutLiveBoard).toEqual([]);
    });

    it("all entries have required fields", () => {
      for (const entry of GAMES_CATALOG) {
        expect(entry.id).toBeTruthy();
        expect(entry.name).toBeTruthy();
        expect(entry.path).toBeTruthy();
        expect(entry.kind).toBeTruthy();
        expect(entry.description).toBeTruthy();
        expect(typeof entry.usesLiveBoard).toBe("boolean");
      }
    });

    it("broken surfaces are marked with broken: true", () => {
      const broken = LEFTOVER_SURFACES.filter((e) => e.broken);
      expect(broken.length).toBeGreaterThan(0);
      for (const entry of broken) {
        expect(entry.broken).toBe(true);
      }
    });

    it("working surfaces do not have broken: true", () => {
      for (const entry of WORKING_SURFACES) {
        expect(entry.broken).toBeFalsy();
      }
    });
  });

  describe("local-only harnesses", () => {
    it("Munder-Difflin is catalogued as local-only harness", () => {
      const munderDifflin = LOCAL_ONLY_HARNESSES.find(
        (h) => h.name === "Munder-Difflin"
      );
      expect(munderDifflin).toBeDefined();
      expect(munderDifflin?.note).toContain("No public route");
    });

    it("local harnesses are not in PLAY_SURFACES", () => {
      for (const harness of LOCAL_ONLY_HARNESSES) {
        const inPlay = PLAY_SURFACES.find(
          (p) => p.name.toLowerCase() === harness.name.toLowerCase()
        );
        expect(inPlay).toBeUndefined();
      }
    });
  });

  describe("frozen surfaces", () => {
    it("GSPC Quests is catalogued as frozen leftover", () => {
      const quests = FROZEN_SURFACES.find((f) => f.id === "gspc-quests");
      expect(quests).toBeDefined();
      expect(quests?.frozen).toBe(true);
      expect(quests?.path).toBe("/gspc-quests.html");
    });

    it("frozen surfaces do not claim to use live board", () => {
      for (const entry of FROZEN_SURFACES) {
        expect(entry.usesLiveBoard).toBe(false);
      }
    });

    it("GSPC Quests description mentions v1 governance (not living n=237)", () => {
      const quests = FROZEN_SURFACES.find((f) => f.id === "gspc-quests");
      expect(quests?.description).toContain("v1");
      expect(quests?.description).toContain("NOT the living");
    });
  });

  describe("in-build cards", () => {
    it("Logic Duel is listed as in-build (no route)", () => {
      const duel = IN_BUILD_CARDS.find((c) => c.id === "logic-duel");
      expect(duel).toBeDefined();
    });

    it("Swarm Clash is listed as in-build (no route)", () => {
      const swarm = IN_BUILD_CARDS.find((c) => c.id === "swarm-clash");
      expect(swarm).toBeDefined();
    });

    it("Humans vs Humanoids is listed as in-build (no route)", () => {
      const hvh = IN_BUILD_CARDS.find((c) => c.id === "humans-vs-humanoids");
      expect(hvh).toBeDefined();
    });

    it("in-build cards are not in PLAY_SURFACES", () => {
      for (const card of IN_BUILD_CARDS) {
        const inPlay = PLAY_SURFACES.find(
          (p) => p.id === card.id
        );
        expect(inPlay).toBeUndefined();
      }
    });
  });
});
