/**
 * Get results → Article 50 check (paid-route lane, 7 Oct 2026). A link to one generated file is the
 * art50 door's subject; Get results used to classify it as "a server or web address" and offer a
 * model run, so the first paid door was reachable only from menus.
 */
import { describe, expect, it } from "vitest";
import { MEDIA_URL_RE, art50Href } from "./GetResults";

describe("Get results — a file link goes to the Article 50 check", () => {
  it("recognises image, video, audio and PDF links, query strings included", () => {
    for (const u of [
      "https://councilof.ai/og-image.png",
      "https://cdn.example.com/out/IMG_01.JPG",
      "https://x.example/a.webp?w=1200",
      "http://x.example/clip.mp4",
      "https://x.example/voice.wav",
      "https://x.example/report.pdf#page=2",
    ])
      expect(MEDIA_URL_RE.test(u), u).toBe(true);
  });

  it("leaves servers, models and record ids alone", () => {
    for (const u of ["https://councilof.ai/mcp", "github.com", "qwen3:8b", "https://x.example/png", "82994353" + "ab".repeat(28)])
      expect(MEDIA_URL_RE.test(u), u).toBe(false);
  });

  it("links to the art50 pane with the file prefilled", () => {
    expect(art50Href("https://councilof.ai/og-image.png")).toBe("/dashboard/?tab=art50&url=https%3A%2F%2Fcouncilof.ai%2Fog-image.png");
  });
});
