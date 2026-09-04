import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InsurersDataUnavailable } from "./Insurers";

const BAKED_FAILURE_TEXT = /fetch failed|HTML instead of JSON|Failed to fetch/i;

describe("Insurers unavailable data states", () => {
  it.each([
    ["board", "/api/gspc", "No measurement values have been substituted."],
    ["reported", "/api/reported", "No reported figures have been substituted."],
  ] as const)(
    "renders an honest %s fallback that the prerender can publish",
    (source, endpoint, disclosure) => {
      const html = renderToStaticMarkup(
        <InsurersDataUnavailable source={source} />,
      );

      expect(html).toContain("is unavailable in this rendered view");
      expect(html).toContain(disclosure);
      expect(html).toContain(`href="${endpoint}"`);
      expect(html).not.toMatch(BAKED_FAILURE_TEXT);
    },
  );
});
