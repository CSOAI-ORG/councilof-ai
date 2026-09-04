import { describe, expect, it, vi } from "vitest";
import {
  buildProviderCanaryStatus,
  onRequestGet,
  onRequestPost,
  PROVIDER_CANARY_MAX_RESPONSE_BYTES,
  runProviderCanary,
  type ProviderCanaryEnv,
} from "./provider-canary";

const ORIGIN = "https://councilof.ai";
const OPERATOR_TOKEN = "operator-secret-must-never-leak";
const HF_TOKEN = "hf-secret-must-never-leak";
const RUNPOD_TOKEN = "runpod-secret-must-never-leak";

const HF_ENV: ProviderCanaryEnv = {
  PROVIDER_CANARY_AUTH_TOKEN: OPERATOR_TOKEN,
  HF_INFERENCE_TOKEN: HF_TOKEN,
  HF_CANARY_MODEL: "openai/gpt-oss-120b:groq",
  HF_CANARY_MODEL_REVISION: "weights-2026-09-04",
};

const RUNPOD_ENV: ProviderCanaryEnv = {
  PROVIDER_CANARY_AUTH_TOKEN: OPERATOR_TOKEN,
  RUNPOD_API_KEY: RUNPOD_TOKEN,
  RUNPOD_CANARY_ENDPOINT_ID: "endpoint-123",
  RUNPOD_CANARY_MODEL: "Qwen/Qwen3-8B",
  RUNPOD_CANARY_MODEL_REVISION: "commit-deadbeef",
};

function invoke(
  body: unknown,
  env: ProviderCanaryEnv,
  options: { origin?: string; token?: string } = {},
) {
  const token = options.token ?? OPERATOR_TOKEN;
  return onRequestPost({
    request: new Request(`${ORIGIN}/api/provider-canary`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        ...(options.origin ? { origin: options.origin } : {}),
      },
      body: JSON.stringify(body),
    }),
    env,
  } as never);
}

const successfulProviderResponse = (secretOutput = "OK") =>
  Response.json({
    id: "canary-response-1",
    model: "openai/gpt-oss-120b",
    system_fingerprint: "fp_canary",
    choices: [{ message: { role: "assistant", content: secretOutput } }],
  });

describe("GET /api/provider-canary", () => {
  it("returns public status without probing or exposing credentials", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    try {
      const response = await onRequestGet({
        request: new Request(`${ORIGIN}/api/provider-canary`),
        env: { ...HF_ENV, ...RUNPOD_ENV },
      } as never);
      const body = await response.json();
      const encoded = JSON.stringify(body);

      expect(response.status).toBe(200);
      expect(fetcher).not.toHaveBeenCalled();
      expect(body).toMatchObject({
        schema: "csoai.provider-canary-status/0.1",
        probe_on_get: false,
        policy: {
          user_inference: false,
          arbitrary_urls: false,
          automatic_fallback: false,
          writes_board: false,
          measurement_state: "UNMEASURED",
        },
      });
      expect(body.adapters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            provider: "huggingface",
            state: "CONFIGURED_UNCHECKED",
            reachable: false,
            executable: false,
          }),
          expect.objectContaining({
            provider: "runpod",
            state: "CONFIGURED_UNCHECKED",
            endpoint:
              "https://api.runpod.ai/v2/endpoint-123/openai/v1/chat/completions",
            reachable: false,
            executable: false,
          }),
        ]),
      );
      expect(encoded).not.toContain(OPERATOR_TOKEN);
      expect(encoded).not.toContain(HF_TOKEN);
      expect(encoded).not.toContain(RUNPOD_TOKEN);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("reports missing configuration as unchecked, never unreachable", () => {
    const status = buildProviderCanaryStatus({});
    expect(status.adapters).toHaveLength(2);
    expect(
      status.adapters.every(
        (adapter) =>
          adapter.state === "UNCONFIGURED" &&
          adapter.reachable === false &&
          adapter.executable === false,
      ),
    ).toBe(true);
  });
});

describe("POST /api/provider-canary authorization and input boundary", () => {
  it("rejects cross-origin requests before a provider call", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    try {
      const response = await invoke(
        { provider: "huggingface", probe: "minimal-chat" },
        HF_ENV,
        { origin: "https://outside.example" },
      );
      expect(response.status).toBe(403);
      expect(fetcher).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("requires a separately configured operator bearer", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    try {
      const unavailable = await invoke(
        { provider: "huggingface", probe: "minimal-chat" },
        { ...HF_ENV, PROVIDER_CANARY_AUTH_TOKEN: undefined },
      );
      expect(unavailable.status).toBe(503);
      expect(await unavailable.json()).toMatchObject({
        error: "provider_canary_auth_unconfigured",
        state: "UNCHECKABLE",
      });

      const denied = await invoke(
        { provider: "huggingface", probe: "minimal-chat" },
        HF_ENV,
        { token: "wrong" },
      );
      expect(denied.status).toBe(401);
      expect(fetcher).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("accepts only the named canary and rejects caller URLs or prompts", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    try {
      const response = await invoke(
        {
          provider: "runpod",
          probe: "minimal-chat",
          endpoint: "https://attacker.example/collect",
          prompt: "user-controlled",
        },
        RUNPOD_ENV,
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: "invalid_invocation",
      });
      expect(fetcher).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("provider-neutral capability receipts", () => {
  it("runs one pinned Hugging Face provider call and returns metadata, not content", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(
          "https://router.huggingface.co/v1/chat/completions",
        );
        expect(init).toMatchObject({ method: "POST", redirect: "manual" });
        expect(new Headers(init?.headers).get("authorization")).toBe(
          `Bearer ${HF_TOKEN}`,
        );
        expect(JSON.parse(String(init?.body))).toEqual({
          model: "openai/gpt-oss-120b:groq",
          messages: [{ role: "user", content: "Reply with OK." }],
          max_tokens: 1,
          temperature: 0,
          stream: false,
        });
        return successfulProviderResponse("PRIVATE-PROVIDER-OUTPUT");
      },
    );
    const times = [
      Date.parse("2026-09-04T08:00:00Z"),
      Date.parse("2026-09-04T08:00:00Z") + 27,
    ];
    const receipt = await runProviderCanary(HF_ENV, "huggingface", {
      fetcher,
      nowMs: () => times.shift() ?? 0,
    });
    const encoded = JSON.stringify(receipt);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(receipt).toMatchObject({
      provider: "huggingface",
      state: "EXECUTABLE",
      configured: true,
      reachable: true,
      executable: true,
      target: {
        endpoint_revision: "huggingface-router-openai-v1",
        model: "openai/gpt-oss-120b:groq",
        model_revision: "weights-2026-09-04",
        provider_route: "groq",
      },
      result: {
        http_status: 200,
        latency_ms: 27,
        response_content_type: "application/json",
        response_digest_scope: "complete",
        openai_response_shape: true,
        observed_model: "openai/gpt-oss-120b",
        system_fingerprint: "fp_canary",
        error_code: null,
      },
      policy: {
        user_input_accepted: false,
        arbitrary_url_accepted: false,
        application_fallback_attempted: false,
        provider_internal_routing_verified: false,
        secrets_exposed: false,
        writes_board: false,
        measurement_state: "UNMEASURED",
      },
    });
    expect(receipt.result.response_digest_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(encoded).not.toContain("PRIVATE-PROVIDER-OUTPUT");
    expect(encoded).not.toContain(HF_TOKEN);
    expect(encoded).not.toContain(OPERATOR_TOKEN);
  });

  it("derives the RunPod vLLM URL from an allowlisted endpoint id", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(
          "https://api.runpod.ai/v2/endpoint-123/openai/v1/chat/completions",
        );
        expect(new Headers(init?.headers).get("authorization")).toBe(
          `Bearer ${RUNPOD_TOKEN}`,
        );
        expect(JSON.parse(String(init?.body)).model).toBe("Qwen/Qwen3-8B");
        return Response.json({
          id: "runpod-canary",
          model: "Qwen/Qwen3-8B",
          choices: [{ message: { content: "OK" } }],
        });
      },
    );
    const receipt = await runProviderCanary(RUNPOD_ENV, "runpod", {
      fetcher,
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(receipt).toMatchObject({
      provider: "runpod",
      state: "EXECUTABLE",
      target: {
        endpoint_revision: "runpod-serverless-vllm-openai-v1",
        model_revision: "commit-deadbeef",
        provider_route: "declared-serverless-endpoint",
      },
      reachable: true,
      executable: true,
    });
    expect(JSON.stringify(receipt)).not.toContain(RUNPOD_TOKEN);
  });

  it("fails closed rather than using Hugging Face automatic routing", async () => {
    const fetcher = vi.fn();
    const receipt = await runProviderCanary(
      { ...HF_ENV, HF_CANARY_MODEL: "openai/gpt-oss-120b:fastest" },
      "huggingface",
      { fetcher },
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(receipt).toMatchObject({
      state: "UNCONFIGURED",
      configured: false,
      reachable: false,
      executable: false,
      result: { error_code: "UNCONFIGURED" },
    });
  });

  it("separates HTTP reachability from execution and digests error bodies", async () => {
    const fetcher = vi.fn(async () =>
      Response.json(
        { error: { message: "credential rejected" } },
        { status: 401 },
      ),
    );
    const receipt = await runProviderCanary(HF_ENV, "huggingface", {
      fetcher,
    });
    expect(receipt).toMatchObject({
      state: "REACHABLE_NOT_EXECUTABLE",
      configured: true,
      reachable: true,
      executable: false,
      result: {
        http_status: 401,
        response_digest_scope: "complete",
        openai_response_shape: false,
        error_code: "HTTP_401",
      },
    });
    expect(receipt.result.response_digest_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(receipt)).not.toContain("credential rejected");
  });

  it("does not call an empty OpenAI-shaped shell executable", async () => {
    const receipt = await runProviderCanary(HF_ENV, "huggingface", {
      fetcher: async () =>
        Response.json({
          id: "empty-shell",
          choices: [{}],
        }),
    });
    expect(receipt).toMatchObject({
      state: "REACHABLE_NOT_EXECUTABLE",
      reachable: true,
      executable: false,
      result: {
        http_status: 200,
        openai_response_shape: false,
        error_code: "INVALID_OPENAI_RESPONSE",
      },
    });
  });

  it("aborts at the hard deadline and reports the result as uncheckable", async () => {
    const fetcher = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const receipt = await runProviderCanary(HF_ENV, "huggingface", {
      fetcher,
      timeoutMs: 5,
    });
    expect(receipt).toMatchObject({
      state: "UNCHECKABLE",
      reachable: false,
      executable: false,
      result: { http_status: null, error_code: "TIMEOUT" },
    });
  });

  it("bounds provider responses and never parses a truncated body as execution", async () => {
    const oversized = JSON.stringify({
      choices: [
        {
          message: { content: "x".repeat(PROVIDER_CANARY_MAX_RESPONSE_BYTES) },
        },
      ],
    });
    const receipt = await runProviderCanary(HF_ENV, "huggingface", {
      fetcher: async () => new Response(oversized),
    });
    expect(receipt).toMatchObject({
      state: "REACHABLE_NOT_EXECUTABLE",
      reachable: true,
      executable: false,
      result: {
        response_bytes: PROVIDER_CANARY_MAX_RESPONSE_BYTES,
        response_digest_scope: "prefix",
        error_code: "RESPONSE_TOO_LARGE",
      },
    });
  });
});
