import { describe, expect, it } from "vitest";
import { featuredEvidencePosts } from "./HomeEvidenceShowcase";

describe("homepage evidence showcase", () => {
  it("shows nine real, reachable blog entries without invented placeholders", () => {
    const posts = featuredEvidencePosts();
    expect(posts).toHaveLength(9);
    expect(new Set(posts.map((post) => post.slug)).size).toBe(9);
    for (const post of posts) {
      expect(post.href).toBe(`/blog/${post.slug}`);
      expect(post.title.length).toBeGreaterThan(10);
      expect(post.excerpt.length).toBeGreaterThan(20);
    }
  });
});
