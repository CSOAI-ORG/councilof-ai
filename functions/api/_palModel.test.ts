import { afterEach, describe, expect, it, vi } from "vitest";
import { askModel, isModelFailure, modelConfigured, resolveModelRoute } from "./_palModel";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

function stubFetch(body: unknown, ok = true, status = 200) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("resolving the model route", () => {
  it("has no route when no provider is configured", () => {
    expect(resolveModelRoute({})).toBeNull();
    expect(modelConfigured({})).toBe(false);
  });

  it("refuses a provider with no model id rather than guessing one", () => {
    // The model id is provider-specific. Guessing produces a confusing 404 from the provider,
    // so a half-configured deployment is treated as unconfigured and says so.
    expect(resolveModelRoute({ PAL_MODEL_URL: "https://api.example/v1" })).toBeNull();
    expect(modelConfigured({ PAL_MODEL_URL: "https://api.example/v1" })).toBe(false);
  });

  it("takes the OpenAI-compatible route when a provider and model are named", () => {
    const r = resolveModelRoute({
      PAL_MODEL_URL: "https://api.example/v1/",
      PAL_MODEL_TOKEN: "t",
      PAL_MODEL_ID: "some-model",
    });
    expect(r).not.toBeNull();
    expect(r!.kind).toBe("openai");
    expect(r!.url).toBe("https://api.example/v1/chat/completions");
    expect(r!.model).toBe("some-model");
    expect(r!.public_model).toBe("some-model");
  });

  it("falls back to the estate's gate, and never publishes its private routing id", () => {
    const r = resolveModelRoute({ SOV_GATE_URL: "https://gate.example", SOV_GATE_TOKEN: "t" });
    expect(r).not.toBeNull();
    expect(r!.kind).toBe("ollama");
    expect(r!.url).toBe("https://gate.example/api/chat");
    // The gate's routing id is private. The public id is the one the chat surface already uses.
    expect(r!.public_model).toBe("council-routing-default");
    expect(r!.public_model).not.toBe("sov6-ethics-v3-light");
  });

  it("prefers the OpenAI-compatible route when both are configured", () => {
    const r = resolveModelRoute({
      PAL_MODEL_URL: "https://api.example/v1",
      PAL_MODEL_ID: "m",
      SOV_GATE_URL: "https://gate.example",
    });
    expect(r!.kind).toBe("openai");
  });
});

describe("asking the model", () => {
  it("says plainly that no model is configured, and does not pretend", async () => {
    const r = await askModel({}, { system: "s", user: "u" });
    expect(isModelFailure(r)).toBe(true);
    if (isModelFailure(r)) {
      expect(r.reason).toBe("unconfigured");
      expect(r.detail).toBeTruthy();
    }
  });

  it("reads the OpenAI-compatible shape", async () => {
    stubFetch({ choices: [{ message: { content: "hello from the model" } }] });
    const r = await askModel(
      { PAL_MODEL_URL: "https://api.example/v1", PAL_MODEL_ID: "m" },
      { system: "s", user: "u" },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.content).toBe("hello from the model");
      expect(r.model).toBe("m");
    }
  });

  it("reads the Ollama shape too, because both are in the wild", async () => {
    stubFetch({ message: { content: "hello from the gate" } });
    const r = await askModel({ SOV_GATE_URL: "https://gate.example" }, { system: "s", user: "u" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.content).toBe("hello from the gate");
  });

  it("joins content that arrives as parts", async () => {
    stubFetch({ choices: [{ message: { content: [{ text: "a " }, { text: "b" }] } }] });
    const r = await askModel(
      { PAL_MODEL_URL: "https://api.example/v1", PAL_MODEL_ID: "m" },
      { system: "s", user: "u" },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.content).toBe("a b");
  });

  it("reports an unreachable provider as unreachable, not as an empty answer", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("connection refused");
    }) as unknown as typeof fetch;
    const r = await askModel(
      { PAL_MODEL_URL: "https://api.example/v1", PAL_MODEL_ID: "m" },
      { system: "s", user: "u" },
    );
    expect(isModelFailure(r)).toBe(true);
    if (isModelFailure(r)) expect(r.reason).toBe("unreachable");
  });

  it("reports a provider error with its status", async () => {
    stubFetch({ error: "nope" }, false, 401);
    const r = await askModel(
      { PAL_MODEL_URL: "https://api.example/v1", PAL_MODEL_ID: "m" },
      { system: "s", user: "u" },
    );
    expect(isModelFailure(r)).toBe(true);
    if (isModelFailure(r)) {
      expect(r.reason).toBe("http_error");
      expect(r.detail).toContain("401");
    }
  });

  it("sends the bearer token it was given, and no token when it has none", async () => {
    const fn = stubFetch({ choices: [{ message: { content: "x" } }] });
    await askModel(
      { PAL_MODEL_URL: "https://api.example/v1", PAL_MODEL_ID: "m", PAL_MODEL_TOKEN: "sekrit" },
      { system: "s", user: "u" },
    );
    const init = fn.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer sekrit");

    const fn2 = stubFetch({ choices: [{ message: { content: "x" } }] });
    await askModel({ PAL_MODEL_URL: "https://api.example/v1", PAL_MODEL_ID: "m" }, { system: "s", user: "u" });
    const init2 = fn2.mock.calls[0][1] as RequestInit;
    expect((init2.headers as Record<string, string>).authorization).toBeUndefined();
  });
});
