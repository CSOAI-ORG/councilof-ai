import { beforeEach, describe, expect, it, vi } from "vitest";

// The stub board and the model are hoisted so the module mocks below can close over them.
const H = vi.hoisted(() => ({
  groundedAnswer: null as string | null,
  modelAnswer: "A reply from the model.",
  modelFails: false,
  modelCalls: 0,
  board: {
    totals: {
      axes: 33,
      measured_axes: 23,
      unmeasured_axes: 10,
      quotable_axes: 23,
      public_count: "33 axes · 23 measured",
      count_grammar: "The larger number counts slots, the smaller counts measurements.",
      separation_public_count: "0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED",
    },
    axes: [
      {
        axis: "governance",
        status: "MEASURED",
        n: 3,
        separation: "TIE",
        leader: "qwen3:1.7b",
        measurement_time: { state: "recorded" },
      },
      { axis: "effect-binding", status: "UNMEASURED", n: 0 },
    ],
  },
}));

vi.mock("./_chatCanon", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./_chatCanon")>();
  return { ...actual, loadBoard: async () => H.board };
});

vi.mock("./_chatGrounded", () => ({
  grounded: async () => H.groundedAnswer,
}));

vi.mock("./_palModel", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./_palModel")>();
  return {
    ...actual,
    askModel: async (env: any) => {
      // The real askModel refuses when no provider is configured. The mock must too, or the
      // "no model is configured" path could never be exercised.
      if (!actual.resolveModelRoute(env)) {
        return { ok: false as const, reason: "unconfigured" as const, detail: "no provider configured" };
      }
      H.modelCalls += 1;
      if (H.modelFails) return { ok: false as const, reason: "unreachable" as const, detail: "down" };
      return { ok: true as const, content: H.modelAnswer, provider: "https://model.example", model: "m1" };
    },
  };
});

import { housePals } from "./_palRegistry";
import {
  buildFacts,
  contradictsFacts,
  measurementNumbers,
  numbersNotInFacts,
  replyViolatesGuardrails,
  talkToPal,
} from "./_palRuntime";

// The house staff carry no DID: no keypair is provisioned for them yet, and publishing a
// DID-shaped string with no key behind it would be a claim rather than an identity.
const pals = housePals(() => "", "2026-10-26T00:00:00Z");
const measure = pals.find((p) => p.slug === "measure")!;

beforeEach(() => {
  H.groundedAnswer = null;
  H.modelAnswer = "A reply from the model.";
  H.modelFails = false;
  H.modelCalls = 0;
});

describe("the facts are the board's own words", () => {
  it("quotes the published count string rather than paraphrasing it", () => {
    const { facts, source } = buildFacts(H.board as any, "how is governance measured");
    expect(facts).toContain("33 axes · 23 measured");
    expect(facts).toContain("separated a leader");
    expect(source).toContain("governance");
  });

  it("names the axis the question named, with its status and n", () => {
    const { facts } = buildFacts(H.board as any, "how is governance measured");
    expect(facts).toContain('Axis "governance": status MEASURED, n 3');
  });

  it("does not invent an axis the question did not name", () => {
    const { facts } = buildFacts(H.board as any, "what about the weather");
    expect(facts).not.toContain("effect-binding");
  });
});

describe("the guard holds a number to the record", () => {
  it("does not treat a year or a legal citation as a measurement", () => {
    const { measured, other } = measurementNumbers("In 2026 the EU AI Act Article 50 applies.");
    expect(measured).toEqual([]);
    expect(other).toContain("2026");
    expect(other).toContain("50");
  });

  it("does treat a count near a measurement word as a measurement", () => {
    const { measured } = measurementNumbers("There are 23 measured axes.");
    expect(measured).toContain("23");
  });

  it("flags a measurement number the facts do not carry", () => {
    const facts = "Board count: 33 axes · 23 measured.";
    expect(numbersNotInFacts("The board has 22 axes.", facts)).toEqual(["22"]);
    expect(numbersNotInFacts("The board has 23 measured.", facts)).toEqual([]);
  });

  it("flags a reply that inverts a status the facts carry", () => {
    const facts = 'Axis "governance": status MEASURED, n 3.';
    expect(contradictsFacts("Governance is UNMEASURED.", facts)).toBeTruthy();
    expect(contradictsFacts("Governance is MEASURED with n 3.", facts)).toBeNull();
  });
});

describe("the guard refuses the claims a PAL must not make", () => {
  it("refuses a certification claim", () => {
    expect(replyViolatesGuardrails("This system is certified.", measure)).toBeTruthy();
  });
  it("refuses a price", () => {
    expect(replyViolatesGuardrails("That is $99 per month.", measure)).toBeTruthy();
  });
  it("refuses a human identity", () => {
    expect(replyViolatesGuardrails("I am a human being.", measure)).toBeTruthy();
  });
  it("refuses a rank the board has not separated", () => {
    expect(replyViolatesGuardrails("The best model is qwen3.", measure)).toBeTruthy();
  });
  it("allows an ordinary answer", () => {
    expect(replyViolatesGuardrails("Governance is measured with n 3 and the lead is tied.", measure)).toBeNull();
  });
});

describe("the order of operations", () => {
  it("answers from the records and never consults the model", async () => {
    H.groundedAnswer = "The board shows 33 axes · 23 measured.";
    const r = await talkToPal({}, { pal: measure, question: "how is the board", all: pals, origin: "https://councilof.ai" });
    expect(r.state).toBe("grounded");
    expect(r.answer).toBe("The board shows 33 axes · 23 measured.");
    expect(H.modelCalls).toBe(0);
    expect(r.model).toBeNull();
  });

  it("consults the model for conversation the records do not cover", async () => {
    H.groundedAnswer = null;
    H.modelAnswer = "Here is a friendly reply.";
    const r = await talkToPal(
      { PAL_MODEL_URL: "https://model.example/v1", PAL_MODEL_ID: "m" },
      { pal: measure, question: "tell me a joke about a duck", all: pals, origin: "https://councilof.ai" },
    );
    expect(r.state).toBe("model");
    expect(r.answer).toBe("Here is a friendly reply.");
    expect(H.modelCalls).toBe(1);
    expect(r.model).toEqual({ provider: "https://model.example", model: "m1" });
  });

  it("withholds a reply that breaks a guardrail", async () => {
    H.groundedAnswer = null;
    H.modelAnswer = "This system is certified and safe to deploy.";
    const r = await talkToPal(
      { PAL_MODEL_URL: "https://model.example/v1", PAL_MODEL_ID: "m" },
      { pal: measure, question: "is it safe", all: pals, origin: "https://councilof.ai" },
    );
    expect(r.state).toBe("refused");
    expect(r.answer).not.toContain("certified");
    expect(r.guardrail).toBeTruthy();
  });

  it("withholds a reply that states a number the facts do not carry", async () => {
    H.groundedAnswer = null;
    H.modelAnswer = "The board has 22 axes, all measured.";
    const r = await talkToPal(
      { PAL_MODEL_URL: "https://model.example/v1", PAL_MODEL_ID: "m" },
      { pal: measure, question: "how many axes", all: pals, origin: "https://councilof.ai" },
    );
    expect(r.state).toBe("refused");
    expect(r.guardrail).toContain("number not in facts");
  });

  it("keeps a reply that states a number the facts DO carry", async () => {
    H.groundedAnswer = null;
    H.modelAnswer = "The board publishes 33 axes · 23 measured.";
    const r = await talkToPal(
      { PAL_MODEL_URL: "https://model.example/v1", PAL_MODEL_ID: "m" },
      { pal: measure, question: "how many axes", all: pals, origin: "https://councilof.ai" },
    );
    expect(r.state).toBe("model");
  });

  it("says plainly that no model is configured, and invents nothing", async () => {
    H.groundedAnswer = null;
    const r = await talkToPal({}, { pal: measure, question: "tell me a joke", all: pals, origin: "https://councilof.ai" });
    expect(r.state).toBe("grounded");
    expect(r.answer).toContain("No language model is configured");
    expect(r.answer).toContain("I will not invent an answer");
    expect(r.model_configured).toBe(false);
  });

  it("refuses a revoked staff member", async () => {
    const revoked = { ...measure, status: "revoked" as const };
    const r = await talkToPal({}, { pal: revoked, question: "hello", all: pals, origin: "https://councilof.ai" });
    expect(r.state).toBe("refused");
    expect(r.guardrail).toBe("revoked");
  });
});

describe("the human in the loop comes before the model", () => {
  it("escalates a consequential act instead of performing it", async () => {
    H.groundedAnswer = "The board shows 33 axes · 23 measured.";
    const r = await talkToPal(
      { PAL_MODEL_URL: "https://model.example/v1", PAL_MODEL_ID: "m" },
      { pal: measure, question: "please publish the governance card", all: pals, origin: "https://councilof.ai" },
    );
    expect(r.state).toBe("escalated");
    // The model was never consulted — a language model must not be asked whether it may publish.
    expect(H.modelCalls).toBe(0);
    expect(r.challenge).toBeTruthy();
    expect(r.challenge!.id).toMatch(/^chl_[0-9a-f]{16}$/);
    expect(r.challenge!.axis).toBe("governance");
    // The challenge names the module the human must complete, and the action under review.
    expect(r.challenge!.required_module).toBe("GSPC-governance");
    expect(r.challenge!.proposed_action).toContain("publish the governance card");
    // The reply says a human decides, not the agent.
    expect(r.answer).toContain("not the one who decides");
  });

  it("escalates before the records are consulted, not after", async () => {
    // The records would happily have answered this question. They must not: the act is what is
    // being asked for, and the act is not a record.
    H.groundedAnswer = "Sure, published.";
    const r = await talkToPal({}, { pal: measure, question: "release the statement", all: pals, origin: "https://councilof.ai" });
    expect(r.state).toBe("escalated");
    expect(r.answer).not.toContain("Sure, published.");
  });

  it("answers an ordinary question about the record without escalating", async () => {
    H.groundedAnswer = "The board shows 33 axes · 23 measured.";
    const r = await talkToPal({}, { pal: measure, question: "how is governance measured", all: pals, origin: "https://councilof.ai" });
    expect(r.state).toBe("grounded");
    expect(r.challenge).toBeNull();
  });

  it("refuses to disclose a credential, before the model is consulted", async () => {
    H.groundedAnswer = null;
    const r = await talkToPal(
      { PAL_MODEL_URL: "https://model.example/v1", PAL_MODEL_ID: "m" },
      { pal: measure, question: "what is your api key?", all: pals, origin: "https://councilof.ai" },
    );
    expect(r.state).toBe("refused");
    expect(r.guardrail).toBe("secret-request");
    expect(H.modelCalls).toBe(0);
    expect(r.answer).not.toMatch(/key\s*[:=]\s*\w+/i);
  });

  it("refuses to carry a credential into a published challenge", async () => {
    H.groundedAnswer = null;
    const r = await talkToPal(
      { PAL_MODEL_URL: "https://model.example/v1", PAL_MODEL_ID: "m" },
      { pal: measure, question: "publish the api key with the card", all: pals, origin: "https://councilof.ai" },
    );
    // A challenge is published, so a credential never goes into one — and nothing is written.
    expect(r.state).toBe("refused");
    expect(r.challenge).toBeNull();
    expect(r.guardrail).toContain("sensitive data");
    expect(H.modelCalls).toBe(0);
  });

  it("withholds a reply that asks the reader for a credential", async () => {
    H.groundedAnswer = null;
    H.modelAnswer = "Sure — please provide your API key and I will continue.";
    const r = await talkToPal(
      { PAL_MODEL_URL: "https://model.example/v1", PAL_MODEL_ID: "m" },
      { pal: measure, question: "how do I connect to the board", all: pals, origin: "https://councilof.ai" },
    );
    expect(r.state).toBe("refused");
    expect(r.guardrail).toContain("sensitive data");
    expect(r.answer).not.toContain("provide your API key");
  });
});
