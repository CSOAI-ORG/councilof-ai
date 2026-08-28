/**
 * games-catalog.test.ts — tests for the living Council OS Games catalog.
 *
 * Enforced invariants:
 *   1. Every catalogued path is in PRIMARY_PATHS.
 *   2. FORBIDDEN games (Murder, Difflin, Town, etc.) are NOT in the catalog as play surfaces.
 *   3. No typed board counts anywhere in the catalog.
 *   4. Play surfaces claim to use live board (usesLiveBoard: true).
 */

import { describe, it, expect } from "vitest";
import {
  GAMES_CATALOG,
  CATALOG_PATHS,
  PLAY_SURFACES,
  FORBIDDEN_GAME_NAMES,
  isForbiddenGame,
  type CatalogEntry,
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

    it("Town is not a catalogued play surface", () => {
      const town = PLAY_SURFACES.find(
        (g) => g.name.toLowerCase() === "town" || g.name.toLowerCase() === "council town"
      );
      expect(town).toBeUndefined();
    });

    it("Munder-Difflin is not a catalogued play surface", () => {
      const munderDifflin = PLAY_SURFACES.find(
        (g) => g.name.toLowerCase().includes("munder")
      );
      expect(munderDifflin).toBeUndefined();
    });

    it("isForbiddenGame correctly identifies forbidden names", () => {
      expect(isForbiddenGame("Murder")).toBe(true);
      expect(isForbiddenGame("murder")).toBe(true);
      expect(isForbiddenGame("Difflin")).toBe(true);
      expect(isForbiddenGame("Town")).toBe(true);
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

    it("Council Space is the only play surface", () => {
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
  });
});
