import { describe, expect, it } from "vitest";
import { askModel, modelConfigured } from "./_palModel";
import { talkToPal } from "./_palRuntime";
import { housePals } from "./_palRegistry";

/**
 * THE LIVE MODEL TEST. The one that answers "does the model actually load, work and talk?"
 *
 * It is skipped unless a provider is configured, so CI stays green and offline, and it runs
 * for real when the deployment's model route is set. The provider is named by environment
 * variables, never hard-coded, and no key is ever written into this file or into a receipt.
 *
 *   PAL_MODEL_URL    base URL of an OpenAI-compatible endpoint
 *   PAL_MODEL_TOKEN  bearer token for it
 *   PAL_MODEL_ID     the model to ask
 *
 * It proves three things, in this order:
 *
 *   1. THE MODEL LOADS. It answers, through the real askModel, with real provider bytes.
 *   2. IT TALKS. A question the published records do not answer gets a real conversational
 *      reply, and the reply says which model produced it.
 *   3. THE RECORDS STILL WIN. With the same model configured, a question the records DO
 *      answer is answered from the records and the model is never consulted.
 *
 * The third one is the estate's hardest rule, and it is the reason this test is worth having:
 * adding a model must not let the model become the source of a fact.
 */

const ENV = {
  PAL_MODEL_URL: process.env.PAL_MODEL_URL,
  PAL_MODEL_TOKEN: process.env.PAL_MODEL_TOKEN,
  PAL_MODEL_ID: process.env.PAL_MODEL_ID,
  PAL_MODEL_MAX_TOKENS: process.env.PAL_MODEL_MAX_TOKENS,
};

const CONFIGURED = modelConfigured(ENV);
// No DID: no keypair is provisioned for the house staff, and the registry refuses to build
// a record carrying a DID that is not a real ed25519 public key.
const pals = housePals(() => "", "2026-10-26T00:00:00Z");
const measure = pals.find((p) => p.slug === "measure")!;

describe.skipIf(!CONFIGURED)("the model, live", () => {
  it("loads and answers", async () => {
    const r = await askModel(ENV, {
      system: "You are a staff member of the Council of AI. Answer in one short sentence.",
      user: "What does the Council of AI measure?",
    });
    expect(r.ok, `the model did not answer: ${JSON.stringify(r)}`).toBe(true);
    if (r.ok) {
      expect(r.content.length).toBeGreaterThan(0);
      expect(r.model.length).toBeGreaterThan(0);
      console.log(`\n  [receipt] model ${r.model} via ${r.provider}\n  [receipt] ${r.content}\n`);
    }
  });

  it("talks when the published records do not answer", async () => {
    const r = await talkToPal(
      ENV,
      {
        pal: measure,
        question: "Tell me a joke about a duck, and keep it to one line.",
        all: pals,
        origin: "https://councilof.ai",
      },
    );
    expect(r.state).toBe("model");
    expect(r.answer.length).toBeGreaterThan(0);
    expect(r.model).not.toBeNull();
    expect(r.model?.model).toBeTruthy();
    console.log(`\n  [receipt] state=${r.state} model=${r.model?.model}\n  [receipt] ${r.answer}\n`);
  });

  it("still answers from the records, without the model, when they do answer", async () => {
    const r = await talkToPal(
      ENV,
      {
        pal: measure,
        question: "What is on the board? How many axes are there?",
        all: pals,
        origin: "https://councilof.ai",
      },
    );
    expect(r.state).toBe("grounded");
    // The model was configured and available, and was still not consulted.
    expect(r.model).toBeNull();
    console.log(`\n  [receipt] state=${r.state} model=${r.model?.model ?? "not consulted"}\n  [receipt] ${r.answer.slice(0, 400)}\n`);
  });
});
