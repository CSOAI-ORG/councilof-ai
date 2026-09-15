import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_RECORDS, featuredEvidencePosts, withdrawnReadingRecords } from "./HomeEvidenceShowcase";
import { isWithdrawnPath, routePatternMatches } from "@/lib/publicationState";

const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
const routes = [...app.matchAll(/<Route\s+path="([^"]+)"\s+component=\{([A-Za-z0-9_]+)\}/g)].map((m) => ({ path: m[1], comp: m[2] }));

describe("homepage recommended reading is driven by the reviewed manifest", () => {
  it("promotes only routed, non-withdrawn pages — never a 200 withdrawal notice", () => {
    const posts = featuredEvidencePosts();
    expect(posts.length).toBeGreaterThanOrEqual(6);
    expect(new Set(posts.map((p) => p.href)).size).toBe(posts.length);
    for (const post of posts) {
      expect(isWithdrawnPath(post.href), post.href).toBe(false);
      const route = routes.find((r) => routePatternMatches(r.path, post.href));
      expect(route, `${post.href} has no App.tsx route`).toBeTruthy();
      expect(route!.comp, post.href).not.toBe("ContentReviewNotice");
      expect(post.title.length).toBeGreaterThan(8);
      expect(post.excerpt.length).toBeGreaterThan(20);
    }
  });

  it("the nine former field notes are not promoted: every /blog path is withdrawn", () => {
    expect(isWithdrawnPath("/blog/governance-benchmarking-is-broken-signed-fix")).toBe(true);
    expect(isWithdrawnPath("/blog/eu-ai-act-article-50-machine-readable-marking")).toBe(true);
    expect(featuredEvidencePosts().some((p) => p.href.startsWith("/blog"))).toBe(false);
  });

  it("withdrawn entries are labelled and really are withdrawn", () => {
    const records = withdrawnReadingRecords();
    expect(records.length).toBeGreaterThan(0);
    for (const w of records) expect(isWithdrawnPath(w.href), w.href).toBe(true);
  });
});

describe("participation cards name their category and their record", () => {
  const CATEGORIES = ["Membership", "Technical contribution", "Framework mapping", "Public hosting", "Independent test", "Self-published description"];

  it("every card has a category from the fixed set and a proof kind", () => {
    for (const r of PUBLIC_RECORDS) {
      expect(CATEGORIES, r.name).toContain(r.category);
      expect(["public", "self-published", "private"], r.name).toContain(r.proof.kind);
      expect(r.linkLabel.length, r.name).toBeGreaterThan(5);
    }
  });

  it("our own OpenAPI document is labelled self-published, never as independent verification", () => {
    const own = PUBLIC_RECORDS.filter((r) => /councilof\.ai\/openapi\.json/.test(r.href));
    expect(own.length).toBe(1);
    expect(own[0].proof.kind).toBe("self-published");
    expect(own[0].category).toBe("Self-published description");
    expect(own[0].status).not.toMatch(/verified/i);
  });

  it("only an independent test may carry an 'independently' status; private confirmations say so", () => {
    for (const r of PUBLIC_RECORDS) {
      if (/independent/i.test(r.status)) expect(r.category, r.name).toBe("Independent test");
      if (r.proof.kind === "private") expect(r.proof.note, r.name).toMatch(/held privately/);
    }
  });
});
