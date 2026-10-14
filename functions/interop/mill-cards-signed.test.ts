import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { render, type Pointer, type Root } from "./mill-cards-signed/index";

const pub = (p: string) => resolve(__dirname, "../../public", p.replace(/^\//, ""));
const pointer = JSON.parse(readFileSync(pub("/interop/card-root-latest.json"), "utf8")) as Pointer;
const root = JSON.parse(readFileSync(pub(pointer.root_url!), "utf8")) as Root;

describe("/interop/mill-cards-signed/ index, from the real files", () => {
  const { status, html } = render(pointer, root);
  it("lists every root leaf, each linked to a card file that exists and to the verifier", () => {
    expect(status).toBe(200);
    expect(root.leaves!.length).toBe(root.n_leaves);
    for (const l of root.leaves!) {
      expect(existsSync(pub(`/interop/mill-cards-signed/${l.card}`)), l.card).toBe(true);
      expect(html).toContain(`href="/interop/mill-cards-signed/${l.card}"`);
    }
    expect(html.match(/>Verify</g)).toHaveLength(root.n_leaves!);
  });
  it("types no count: the stated count is the root's leaf count", () => {
    expect(html).toContain(`<p>${root.n_leaves} cards, read from the mill card root as of`);
  });
  it("JSON-LD matches the visible text and carries no rating, price or certification", () => {
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
    expect(ld["@type"]).toBe("CollectionPage");
    expect(html).toContain(ld.description.replace(/&/g, "&amp;"));
    expect(JSON.stringify(ld).replace("not certification", "")).not.toMatch(/aggregateRating|ratingValue|offers|price|certif/i);
    expect(html).not.toMatch(/\bcertified\b|\bsafe\b/i);
  });
  it("one <main>, public names only", () => {
    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html).not.toMatch(/\bsov-[a-z0-9]/i);
  });
  it("an unreadable root lists nothing and says UNCHECKABLE", () => {
    const r = render(pointer, null, "x answered HTTP 404");
    expect(r.status).toBe(503);
    expect(r.html).toContain("UNCHECKABLE: x answered HTTP 404");
    expect(r.html).not.toContain("<table");
  });
});
