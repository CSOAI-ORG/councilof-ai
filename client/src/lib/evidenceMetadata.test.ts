import { describe, expect, it } from "vitest";
import { gspcAxisDatasets, gspcBoardDataset } from "./datasetSchema";
import {
  RECORD_NOT_CLAIMED,
  RECORD_RELATED,
  RECORD_SLIDES,
} from "../data/deckWorlds/whereTheRecordLives";
import softwareHeritage from "../../../public/.well-known/software-heritage.json";

const SNAPSHOT = "swh:1:snp:7b219f859e1ae214b44c0ed4bc01b0e8cc1b920c";

describe("evidence discovery metadata", () => {
  it("does not label a Hugging Face landing page as a JSON download", () => {
    const axes = gspcAxisDatasets();
    expect(axes.length).toBeGreaterThan(0);
    for (const axis of axes) {
      expect(axis.url).toMatch(/^https:\/\/huggingface\.co\/datasets\/csoai\//);
      expect(axis.sameAs).toBe(axis.url);
      expect(axis).not.toHaveProperty("distribution");
    }
  });

  it("keeps the board API as the real machine-readable distribution", () => {
    expect(gspcBoardDataset(false).distribution).toEqual([
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://councilof.ai/api/gspc",
      },
    ]);
  });

  it("states the dated archive identity without claiming the current release", () => {
    const limits = RECORD_NOT_CLAIMED.join("\n");
    expect(limits).toContain(SNAPSHOT);
    expect(limits).toContain("not today's release");
    expect(limits).toContain("not endorsement");
    expect(limits).not.toContain("do not have a Software Heritage identifier");

    const archiveLink = RECORD_RELATED.find(
      (entry) => entry.href === "/.well-known/software-heritage.json",
    );
    expect(archiveLink?.what).toContain("dated snapshot");
    expect(RECORD_SLIDES[1].points?.some((point) =>
      point.text.includes("2 September 2026"),
    )).toBe(true);

    expect(softwareHeritage.primary_snapshot.swhid).toBe(SNAPSHOT);
    expect(softwareHeritage.independent_verification.visit_observed).toMatchObject({
      origin: "https://github.com/CSOAI-ORG/councilof-ai",
      status: "full",
      snapshot: SNAPSHOT.replace("swh:1:snp:", ""),
    });
    expect(softwareHeritage.independent_verification.visit_response_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(softwareHeritage.independent_verification.snapshot_response_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(softwareHeritage.independent_verification.scope).toContain("not the current release");
  });
});
