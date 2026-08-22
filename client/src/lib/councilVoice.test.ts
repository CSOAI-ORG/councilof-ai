import { describe, expect, it } from "vitest";
import { chunkSpeech, prepSpeech, scoreVoice } from "./councilVoice";

describe("prepSpeech", () => {
  it("strips markdown and expands estate jargon so TTS does not spell-dump", () => {
    const out = prepSpeech("**CSOAI** seals with `Ed25519`. See https://councilof.ai/gspc and run npx foo-bar.");
    expect(out).toContain("Council of A I");
    expect(out).toContain("Ed 25519");
    expect(out).not.toContain("https://");
    expect(out).not.toContain("**");
    expect(out).toContain("one install command");
  });
});

describe("chunkSpeech", () => {
  it("breaks a paragraph into short clauses", () => {
    const parts = chunkSpeech(
      "Quick tour. Everyone else hands you a checklist. CSOAI is different: signed cards, the living board.",
    );
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts.every((p) => p.length <= 160)).toBe(true);
  });

  it("returns nothing for empty input", () => {
    expect(chunkSpeech("   ")).toEqual([]);
  });
});

describe("scoreVoice", () => {
  it("prefers a named neural voice over Chrome's stock robot", () => {
    const aria = scoreVoice("Microsoft Aria Online (Natural)", "en-US");
    const stock = scoreVoice("Google US English", "en-US");
    const espeak = scoreVoice("eSpeak Dummy", "en");
    expect(aria).toBeGreaterThan(stock);
    expect(stock).toBeGreaterThan(espeak);
  });

  it("boosts an explicit persona preference", () => {
    const daniel = scoreVoice("Daniel", "en-GB", /Daniel|en-GB/i);
    const us = scoreVoice("Google US English", "en-US", /Daniel|en-GB/i);
    expect(daniel).toBeGreaterThan(us);
  });
});
