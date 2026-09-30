import { describe, expect, it } from "vitest";
import { learningBoardUrl, learningScenarioUrl } from "./DashboardLearningPane";

describe("learningScenarioUrl", () => {
  it("keeps production same-origin", () => {
    expect(learningScenarioUrl("governance", "councilof.ai")).toBe(
      "/api/learning-scenarios?axis=governance",
    );
  });

  it("uses the public read-only feed in local review builds", () => {
    expect(learningScenarioUrl("care refusal", "127.0.0.1")).toBe(
      "https://councilof.ai/api/learning-scenarios?axis=care%20refusal",
    );
    expect(learningScenarioUrl("safety", "localhost")).toBe(
      "https://councilof.ai/api/learning-scenarios?axis=safety",
    );
  });
});

describe("learningBoardUrl", () => {
  it("reads the live board roster same-origin in production", () => {
    expect(learningBoardUrl("councilof.ai")).toBe("/api/gspc");
  });

  it("reads the public board in local review builds", () => {
    expect(learningBoardUrl("127.0.0.1")).toBe("https://councilof.ai/api/gspc");
    expect(learningBoardUrl("localhost")).toBe("https://councilof.ai/api/gspc");
  });
});
