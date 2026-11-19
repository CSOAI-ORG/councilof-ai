import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isWithdrawnPath } from "@/lib/publicationState";
import { resolveHead } from "@/lib/seoHead";

const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
describe("legacy course enrollment remains consistently closed", () => {
  it("has one withdrawn detail route and never mounts the old enrollment controller", () => {
    expect(app.match(/<Route path="\/courses\/:id"/g)).toHaveLength(1);
    expect(app).toContain('<Route path="/courses/:id" component={ContentReviewNotice} />');
    expect(app).not.toContain('import("./pages/CourseDetail")');
  });
  it.each(["/courses/1", "/courses/eu-ai-act/", "/courses/1/learn", "/free-course/1"])("keeps %s withdrawn in metadata as well as the UI", (path) => {
    expect(isWithdrawnPath(path)).toBe(true);
    expect(resolveHead(path).source).toBe("withdrawn");
    expect(resolveHead(path).title).toContain("withdrawn");
  });
});
