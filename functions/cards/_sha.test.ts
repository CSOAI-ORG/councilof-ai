/**
 * The /cards/ URL grammar, one decoder, tested both ways.
 *
 * root.json publishes 64-hex digests; the mirror stores 16-hex filenames. Before the
 * [sha].ts route existed, the second grammar answered a mirror 404 while the same
 * leaf resolved at the first — the bytes were fine and the URL was the root's own.
 * These tests pin the decoder so the two grammars can never silently diverge again.
 */
import { describe, expect, it } from "vitest";
import { normalizeCardSha, CANONICAL_SHA_LEN } from "./_sha";
import { cardMirrorUrl } from "./[sha].ts";

const S64 = "056a1efd58d1324912ee3fcfced1c7308e7571348167dfe27e0e261701dbce54";
const S16 = S64.slice(0, CANONICAL_SHA_LEN);

describe("normalizeCardSha", () => {
  it("passes the canonical 16-hex form through unchanged", () => {
    expect(normalizeCardSha(S16)).toEqual({ sha16: S16, shortened: false });
    expect(normalizeCardSha(`${S16}.json`)).toEqual({ sha16: S16, shortened: false });
  });

  it("shortens the full 64-hex digest from root.json to the mirror's filename", () => {
    expect(normalizeCardSha(S64)).toEqual({ sha16: S16, shortened: true });
    expect(normalizeCardSha(`${S64}.json`)).toEqual({ sha16: S16, shortened: true });
  });

  it("accepts uppercase hex and lowercases to the mirror form", () => {
    expect(normalizeCardSha(S16.toUpperCase())?.sha16).toBe(S16);
  });

  it("refuses wrong lengths and non-hex so the route can fall through", () => {
    expect(normalizeCardSha("abc")).toBeNull();
    expect(normalizeCardSha("z".repeat(16))).toBeNull();
    expect(normalizeCardSha(`${S64}extra`)).toBeNull();
    expect(normalizeCardSha("")).toBeNull();
  });
});

describe("cardMirrorUrl", () => {
  const base =
    "https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/cards";

  it("serves both grammars the same bytes at the same mirror path", () => {
    expect(cardMirrorUrl(S16)).toBe(`${base}/${S16}.json`);
    expect(cardMirrorUrl(S64)).toBe(`${base}/${S16}.json`);
    expect(cardMirrorUrl(`${S64}.json`)).toBe(`${base}/${S16}.json`);
  });

  it("keeps the splat's passthrough for unknown shapes", () => {
    expect(cardMirrorUrl("weird-name")).toBe(`${base}/weird-name.json`);
  });
});
