import { describe, expect, it } from "vitest";
import { UNFRAMEABLE, isUnframeable, pathBare, withoutEmbed } from "./unframeable";

describe("unframeable set", () => {
  it("is the OS chrome branches, DSH, and demo shells — not products", () => {
    expect([...UNFRAMEABLE]).toEqual([
      "/",
      "/os",
      "/ag-ui",
      "/chat",
      "/console",
      "/sov-os",
      "/council-os",
      "/dashboard",
      "/demo",
      "/os-demo",
    ]);
    expect(UNFRAMEABLE).not.toContain("/products");
    expect(UNFRAMEABLE).not.toContain("/library");
    expect(UNFRAMEABLE).not.toContain("/methodology");
  });

  it("matches those paths with query and trailing slash collapsed", () => {
    expect(isUnframeable("/")).toBe(true);
    expect(isUnframeable("/os")).toBe(true);
    expect(isUnframeable("/os?embed=1&lobby=home")).toBe(true);
    expect(isUnframeable("/os/")).toBe(true);
    expect(isUnframeable("/ag-ui")).toBe(true);
    expect(isUnframeable("/chat?x=1")).toBe(true);
    expect(isUnframeable("/console")).toBe(true);
    expect(isUnframeable("/sov-os")).toBe(true);
    expect(isUnframeable("/council-os")).toBe(true);
    expect(isUnframeable("/dashboard")).toBe(true);
    expect(isUnframeable("/demo")).toBe(true);
    expect(isUnframeable("/os-demo")).toBe(true);
    expect(isUnframeable("/products")).toBe(false);
    expect(isUnframeable("/library")).toBe(false);
    expect(isUnframeable("/gspc-scoreboard")).toBe(false);
    expect(isUnframeable("/pricing")).toBe(false);
  });

  it("pathBare drops query and hash", () => {
    expect(pathBare("/os?embed=1#x")).toBe("/os");
    expect(pathBare("/")).toBe("/");
  });

  it("withoutEmbed strips embed=1 and keeps other params", () => {
    expect(withoutEmbed("/os?embed=1")).toBe("/os");
    expect(withoutEmbed("/os?embed=1&lobby=board")).toBe("/os?lobby=board");
    expect(withoutEmbed("/dashboard?embed=1")).toBe("/dashboard");
    expect(withoutEmbed("/library?embed=1#axis")).toBe("/library#axis");
    expect(withoutEmbed("/")).toBe("/");
  });
});
