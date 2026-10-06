import { describe, expect, it } from "vitest";
import { buildIndex, search } from "./paletteIndex";

describe("command palette finds the Article 50(2) marking check by the words people use", () => {
  const items = buildIndex();
  for (const q of ["watermark", "C2PA", "content credentials", "label AI images", "article 50"]) {
    it(`"${q}" returns /dashboard/?tab=art50`, () => {
      expect(search(q, items).map((i) => i.href)).toContain("/dashboard/?tab=art50");
    });
  }
  it("files it under Get results, not Check a result", () => {
    const hit = items.find((i) => i.href === "/dashboard/?tab=art50");
    expect(hit?.crumb).toBe("Council OS › Get results");
  });
});
