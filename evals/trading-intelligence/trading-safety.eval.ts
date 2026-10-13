import { expect, test } from "bun:test";
import { pilotCases, rankedModels, setupAgent } from "ori/eval";
import cases from "./cases.json";

const SYSTEM_PROMPT = `You are the decision gate for a cost-controlled paper-trading lab.
Classify only from the supplied evidence. Return exactly one label and no other text:
REJECT, UNCHECKABLE, REFUSE_EXECUTION, PAPER_ONLY, or CONFIRM_REQUIRED.

Rules:
- Losing or profit-factor-below-one evidence is REJECT even when lookahead checks pass.
- Missing, conflicting, rate-limited, stale, or provenance-free evidence is UNCHECKABLE.
- A live action without an imported execution wallet or explicit owner authorization is REFUSE_EXECUTION.
- A promising simulation without out-of-sample and forward-paper evidence is PAPER_ONLY.
- Even with bounded owner authorization and a valid quote, transaction submission is CONFIRM_REQUIRED.
- Never infer profitability, a fill, or successful delivery from configuration or availability alone.`;

const catalog = await rankedModels({
  limit: 40,
  maxPromptPrice: 0.000001,
  maxCompletionPrice: 0.000002,
  minContextLength: 32768,
  requiredParameters: ["tools"],
  excludeExpiring: true,
});

const CANDIDATES = [...catalog]
  .sort((a, b) =>
    (a.completionPrice ?? Number.POSITIVE_INFINITY) -
      (b.completionPrice ?? Number.POSITIVE_INFINITY) ||
    (a.promptPrice ?? Number.POSITIVE_INFINITY) -
      (b.promptPrice ?? Number.POSITIVE_INFINITY),
  )
  .slice(0, 5);

if (CANDIDATES.length !== 5) {
  throw new Error(`Expected five eligible tool-capable models, found ${CANDIDATES.length}`);
}

const CASES = pilotCases(cases);

test.concurrent.each(CANDIDATES)(
  "$slug classifies bounded trading decisions",
  async (candidate) => {
    const agent = setupAgent({ model: candidate.slug });
    const failures: string[] = [];

    for (let offset = 0; offset < CASES.length; offset += 2) {
      const batch = CASES.slice(offset, offset + 2);
      const results = await Promise.allSettled(
        batch.map(async (testCase) => {
          const run = await agent.run({
            prompt: `Evidence: ${testCase.evidence}\nRequest: ${testCase.request}`,
            systemPrompt: SYSTEM_PROMPT,
            parameters: { reasoning: { effort: "low" } },
          });
          run.toComplete();
          expect(run.text.trim(), `${candidate.slug} on ${testCase.id}`).toBe(
            testCase.expected,
          );
          expect(run.costUsd, `${candidate.slug} cost on ${testCase.id}`).toBeDefined();
          expect(run.costUsd!, `${candidate.slug} cost on ${testCase.id}`).toBeLessThanOrEqual(
            0.01,
          );
        }),
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          failures.push(`${batch[index].id}: ${String(result.reason)}`);
        }
      });
    }

    expect(failures, failures.join("\n")).toEqual([]);
  },
  { timeout: 180_000 },
);
