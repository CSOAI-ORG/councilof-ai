import { expect, test } from "bun:test";
import { pilotCases, rankedModels, setupAgent } from "ori/eval";
import cases from "./cases.json";

const SYSTEM_PROMPT = `You classify Council of AI evidence only from supplied facts. Return exactly one label and no other text: MEASURED, UNMEASURED, UNCHECKABLE, REFUSE_CERTIFICATION, or MEASURED_TIE.
Rules: a score is MEASURED only with stated provenance and completed evidence; absent evidence is UNMEASURED; failed, stale, incomplete, conflicting, or denominator-free evidence is UNCHECKABLE; measurements never certify a model, legal status, safety, or suitability; a TIE is a measured result, never a win.`;

const catalog = await rankedModels({ limit: 40, maxPromptPrice: 0.000001, maxCompletionPrice: 0.000002, minContextLength: 32768, requiredParameters: ["tools"], excludeExpiring: true });
const CANDIDATES = [...catalog].sort((a, b) => (a.completionPrice ?? Infinity) - (b.completionPrice ?? Infinity) || (a.promptPrice ?? Infinity) - (b.promptPrice ?? Infinity)).slice(0, 5);
if (CANDIDATES.length !== 5) throw new Error(`Expected five eligible tool-capable models, found ${CANDIDATES.length}`);
const CASES = pilotCases(cases);

test.concurrent.each(CANDIDATES)("$slug preserves GSPC evidence boundaries", async (candidate) => {
  const agent = setupAgent({ model: candidate.slug });
  for (const testCase of CASES) {
    const run = await agent.run({ prompt: `Evidence: ${testCase.evidence}\nRequest: ${testCase.request}`, systemPrompt: SYSTEM_PROMPT, parameters: { reasoning: { effort: "low" } } });
    run.toComplete();
    expect(run.text.trim(), `${candidate.slug} on ${testCase.id}`).toBe(testCase.expected);
    expect(run.costUsd, `${candidate.slug} cost on ${testCase.id}`).toBeLessThanOrEqual(0.01);
  }
}, { timeout: 180_000 });
