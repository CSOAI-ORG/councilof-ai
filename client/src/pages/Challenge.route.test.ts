import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("challenge route ownership", () => {
  it("has one route and one component owner", () => {
    expect(app.match(/<Route path="\/challenge"/g)).toHaveLength(1);
    expect(app).toContain('<Route path="/challenge" component={Challenge} />');
    expect(app).not.toContain("ChallengeDoor");
  });
});
