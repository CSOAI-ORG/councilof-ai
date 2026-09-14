import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { onRequest } from "./card_index";

const redirects = readFileSync(resolve(__dirname, "../../public/_redirects"), "utf8");

describe("card_index guessed-URL aliases", () => {
  it("/api/card_index 301s to the signed index and serves no bytes of its own", async () => {
    const r = onRequest();
    expect(r.status).toBe(301);
    expect(r.headers.get("location")).toBe("/signed/card_index.json");
    expect(await r.text()).toBe("");
  });

  it("the static aliases 301 to the signed index and sit before any splat rule", () => {
    const lines = redirects.split("\n").map((l) => l.trim());
    const firstSplat = lines.findIndex((l) => l && !l.startsWith("#") && l.split(/\s+/)[0].includes("*"));
    for (const from of ["/card_index.json", "/cards/card_index.json"]) {
      const i = lines.findIndex((l) => l.split(/\s+/)[0] === from);
      expect(i, from).toBeGreaterThan(-1);
      expect(lines[i].split(/\s+/).slice(1)).toEqual(["/signed/card_index.json", "301"]);
      expect(i).toBeLessThan(firstSplat);
    }
  });
});
