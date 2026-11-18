import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 17 Nov 2026: /press/ (the press room functions/press/index.ts renders) was linked from neither
 * the footer nor the menu, so a journalist reached it only by typing the URL. Against master
 * before this change, this check fails.
 */
const footer = readFileSync(resolve(__dirname, "Footer.tsx"), "utf8");

describe("the footer links the press room", () => {
  it("lists Press in the Company column as a full page load", () => {
    const company = footer.slice(footer.indexOf("title: 'Company'"), footer.indexOf("title: 'Legal'"));
    expect(company).toContain("{ name: 'Press', href: '/press/', native: true }");
  });
});
