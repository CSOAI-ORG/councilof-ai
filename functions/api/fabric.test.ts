import { describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  buildFabricManifest,
  onRequestGet,
  type FabricManifest,
} from "./fabric";

const OBSERVED_AT = "2026-09-04T06:00:00.000Z";
const ROOT_MERKLE = "c".repeat(64);
const ROOT_DID = "did:web:example.test#board-attestation-1";
const ROOT_KIND = "csoai.public-root/v1";
const ROOT_SCHEMA = "csoai.public-root/1";
const { publicKey: rootPublicKey, privateKey: rootPrivateKey } =
  generateKeyPairSync("ed25519");
const ROOT_JWK = rootPublicKey.export({ format: "jwk" });
const ROOT_SIGNATURE = sign(
  null,
  Buffer.from(
    JSON.stringify({
      as_of: "2026-09-04T04:24:30Z",
      card_count: 141,
      did_intended: ROOT_DID,
      kind: ROOT_KIND,
      merkle_root: ROOT_MERKLE,
      schema: ROOT_SCHEMA,
    }),
  ),
  rootPrivateKey,
).toString("hex");

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "content-type": "application/json" },
  });

function fixtureFetcher(
  options: {
    matchingWitness?: boolean;
    a2aReachable?: boolean;
    invalidRootSignature?: boolean;
  } = {},
) {
  const currentRoot = ROOT_MERKLE;
  const witnessedRoot = options.matchingWitness
    ? currentRoot
    : "older-root-9876543210";

  return vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = new URL(String(input));
      expect(url.origin).toBe("https://example.test");
      expect(init?.signal).toBeInstanceOf(AbortSignal);

      if (url.pathname === "/mcp") {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toMatchObject({
          method: "tools/list",
        });
        return json({
          jsonrpc: "2.0",
          result: {
            tools: Array.from({ length: 12 }, (_, index) => ({
              name: `tool-${index}`,
            })),
          },
        });
      }
      if (url.pathname === "/api/gspc") {
        return json({
          schema: "csoai.gspc-axes/0.5",
          totals: { public_count: "22 axis · 22 measured" },
          axes: Array.from({ length: 22 }, (_, index) => ({
            axis: `axis-${index}`,
          })),
        });
      }
      if (url.pathname === "/signed/card-matrix.json") {
        return json({
          schema: "csoai.card-matrix/2",
          counts: { admitted_cells: 0, quotable_cells: 0 },
        });
      }
      if (url.pathname === "/api/agui/gspc-state") {
        return new Response("event: RUN_STARTED\ndata: {}\n\n", {
          headers: { "content-type": "text/event-stream; charset=utf-8" },
        });
      }
      if (url.pathname === "/.well-known/agent-card.json") {
        return json({
          protocolVersion: "0.3.0",
          skills: [{ id: "board" }, { id: "verify" }],
        });
      }
      if (url.pathname === "/api/a2a/key") {
        return options.a2aReachable
          ? json({
              kid: "did:web:example.test#key",
              alg: "Ed25519",
              publicKey: "abc",
            })
          : json({ error: "not_found" }, 404);
      }
      if (url.pathname === "/api/compute") {
        return json({
          census: {
            as_of: "2026-09-03T06:00:00Z",
            n_unique_ids: 3_032_028,
            n_measured: 0,
            listing_state_all: "DISCOVERED",
            status_all: "UNMEASURED",
          },
          agui: {
            configured: false,
            status: "unconfigured",
            hint: "Set AGUI_WIRE_URL before claiming a provider wire.",
          },
          runpod: {
            note: "No RunPod API identity; remembered pod addresses are not evidence.",
          },
        });
      }
      if (url.pathname === "/api/provider-canary") {
        return json({
          schema: "csoai.provider-canary-status/0.1",
          probe_on_get: false,
          adapters: [
            {
              provider: "huggingface",
              configured: true,
              model: "openai/gpt-oss-120b:groq",
              missing_configuration: [],
              invalid_configuration: [],
              reachable: false,
              executable: false,
            },
            {
              provider: "runpod",
              configured: false,
              model: null,
              missing_configuration: ["RUNPOD_API_KEY"],
              invalid_configuration: [],
              reachable: false,
              executable: false,
            },
          ],
        });
      }
      if (url.pathname === "/api/action-jobs") {
        return json({
          schema: "csoai.action-job-contract/0.1",
          durable: true,
          storage: {
            mode: "SINGLE_WRITER_STAGING",
            concurrency_guarantee: "NONE",
          },
          execution: {
            automatic: false,
            provider_calls: false,
            worker_bound: false,
            board_write: false,
            model_training: false,
            external_egress: false,
          },
        });
      }
      if (url.pathname === "/api/oracle-fleet") {
        return json({
          host: "sov33-owem-micro",
          updated: "2026-09-04T05:55:00Z",
          source: "live",
        });
      }
      if (url.pathname === "/api/regulation") {
        return json({
          schema: "csoai.regulation-deadlines/0.1",
          verified_as_of: "2026-08-19",
          deadlines: [{ date: "2026-09-11" }, { date: "2026-12-02" }],
        });
      }
      if (url.pathname === "/api/xrpl") {
        return json({
          schema: "csoai.xrpl-reader/0.1",
          kind: "reader",
          writes_board: false,
          n: 16,
          as_of: "2026-09-04T04:24:30Z",
        });
      }
      if (url.pathname === "/root.json") {
        return json({
          kind: ROOT_KIND,
          schema: ROOT_SCHEMA,
          merkle_root: currentRoot,
          card_count: 141,
          as_of: "2026-09-04T04:24:30Z",
          did_intended: ROOT_DID,
          sig_ed25519: options.invalidRootSignature
            ? "0".repeat(128)
            : ROOT_SIGNATURE,
        });
      }
      if (url.pathname === "/.well-known/did.json") {
        return json({
          id: "did:web:example.test",
          verificationMethod: [
            {
              id: ROOT_DID,
              type: "JsonWebKey2020",
              publicKeyJwk: ROOT_JWK,
            },
          ],
        });
      }
      if (url.pathname === "/interop/root-witness-latest.json") {
        return json({
          as_of: "2026-09-02T07:13:32Z",
          artifact: {
            merkle_root: witnessedRoot,
            as_of: "2026-09-02T07:13:27Z",
          },
          corpus_scope: {
            relationship: "SEPARATE_CORPORA",
            public_root_count: 154,
            signed_card_count: 335,
            signed_card_id_overlap: 0,
            ots_covers: "PUBLIC_ROOT_BYTES_ONLY",
          },
          witnesses: {
            rekor: { status: "WITNESSED" },
            ots: { status: "STAMPED_PENDING_BITCOIN" },
            eas_base: { status: "NOT_YET" },
            xrpl_memo: { status: "NOT_YET" },
          },
        });
      }
      throw new Error(`unexpected probe ${url.pathname}`);
    },
  );
}

const byId = (manifest: FabricManifest, id: string) => {
  const found = manifest.rails.find((item) => item.id === id);
  if (!found) throw new Error(`missing rail ${id}`);
  return found;
};

describe("GET /api/fabric", () => {
  it("normalizes live evidence without promoting declarations to execution", async () => {
    const fetcher = fixtureFetcher();
    const manifest = await buildFabricManifest(
      "https://example.test/api/fabric",
      fetcher,
      OBSERVED_AT,
    );

    expect(manifest.schema).toBe("csoai.capability-fabric/0.1");
    expect(fetcher).toHaveBeenCalledTimes(15);
    expect(manifest.rails.length).toBe(16);
    expect(manifest.action_contract).toMatchObject({
      schema: "csoai.capability-action-contract/0.1",
      policy: { mode: "FAIL_CLOSED", execution_enabled: false },
    });
    expect(
      manifest.action_contract.actions.every(
        (action) =>
          action.definition.execution_policy.enabled === false &&
          action.runtime.execution_observed === false,
      ),
    ).toBe(true);
    expect(
      manifest.action_contract.actions.find(
        (action) => action.definition.id === "csoai.gspc.board.read",
      )?.runtime,
    ).toMatchObject({
      state: "CATALOGUED",
      verifier_passed: false,
      execution_enabled: false,
      execution_observed: false,
    });
    expect(manifest.rails.every((item) => item.writes_board === false)).toBe(
      true,
    );
    expect(
      manifest.rails.every((item) =>
        [
          "id",
          "label",
          "role",
          "protocol",
          "state",
          "observed_at",
          "endpoint",
          "writes_board",
          "evidence_ref",
          "summary",
          "freshness_seconds",
          "last_error",
        ].every((key) => key in item),
      ),
    ).toBe(true);

    expect(byId(manifest, "mcp-tools")).toMatchObject({
      state: "RUNTIME_OBSERVED",
      summary: expect.stringContaining("12 tool declarations"),
    });
    expect(byId(manifest, "gspc-board")).toMatchObject({
      state: "CATALOGUED",
      summary: expect.stringContaining("0 admitted, 0 quotable"),
    });
    expect(byId(manifest, "agui-gspc-state")).toMatchObject({
      state: "RUNTIME_OBSERVED",
      summary: expect.stringContaining("presentation transport only"),
    });
    expect(byId(manifest, "a2a-discovery").state).toBe("CATALOGUED");
    expect(byId(manifest, "a2a-runtime").state).toBe("UNREACHABLE");
    expect(byId(manifest, "a2ui-renderer").state).toBe("UNCHECKABLE");
    expect(byId(manifest, "hf-census")).toMatchObject({
      state: "CATALOGUED",
      freshness_seconds: 86_400,
    });
    expect(byId(manifest, "hf-provider-execution")).toMatchObject({
      state: "CATALOGUED",
      summary: expect.stringContaining("does not execute"),
    });
    expect(byId(manifest, "action-job-ledger")).toMatchObject({
      state: "CATALOGUED",
      summary: expect.stringContaining("no executor"),
      last_error: expect.stringContaining("SINGLE_WRITER_STAGING"),
    });
    expect(byId(manifest, "agui-provider-wire").state).toBe("UNCHECKABLE");
    expect(byId(manifest, "runpod-execution").state).toBe("UNCHECKABLE");
    expect(byId(manifest, "oracle-fleet")).toMatchObject({
      state: "RUNTIME_OBSERVED",
      freshness_seconds: 300,
      summary: "Live fleet heartbeat served; no inference task was exercised.",
    });
    expect(byId(manifest, "oracle-fleet").summary).not.toContain(
      "sov33-owem-micro",
    );
    expect(byId(manifest, "regulation-feed").state).toBe("RUNTIME_OBSERVED");
    expect(byId(manifest, "xrpl-reader")).toMatchObject({
      state: "RUNTIME_OBSERVED",
      writes_board: false,
      summary: expect.stringContaining("no settlement"),
    });
    expect(byId(manifest, "public-root").state).toBe("SIGNED");
    expect(byId(manifest, "public-root").summary).toContain("Ed25519 verified");
  });

  it("marks root/witness drift instead of inheriting an older witness", async () => {
    const manifest = await buildFabricManifest(
      "https://example.test/api/fabric",
      fixtureFetcher(),
      OBSERVED_AT,
    );
    const witness = byId(manifest, "root-witness");

    expect(witness.state).toBe("STALE");
    expect(witness.last_error).toContain("does not match");
    expect(witness.summary).toContain("older root");
    expect(witness.summary).toContain("OTS STAMPED_PENDING_BITCOIN");
    expect(witness.summary).toContain("XRPL memo NOT_YET");
    expect(witness.summary).toContain("154 root leaves versus a separate index of 335 signed cards");
    expect(witness.summary).toContain("0 identifier overlap");
    expect(witness.summary).toContain("OTS covers the root bytes only");
    expect(witness.summary.toLowerCase()).not.toContain("fully anchored");
  });

  it("never labels a merely present but invalid root signature SIGNED", async () => {
    const manifest = await buildFabricManifest(
      "https://example.test/api/fabric",
      fixtureFetcher({ invalidRootSignature: true }),
      OBSERVED_AT,
    );
    expect(byId(manifest, "public-root")).toMatchObject({
      state: "UNCHECKABLE",
      last_error: "root signature did not verify against published DID key",
    });
  });

  it("keeps a reachable A2A key catalogued and a matching witness state-specific", async () => {
    const manifest = await buildFabricManifest(
      "https://example.test/api/fabric",
      fixtureFetcher({ matchingWitness: true, a2aReachable: true }),
      OBSERVED_AT,
    );

    expect(byId(manifest, "a2a-runtime")).toMatchObject({
      state: "CATALOGUED",
      summary: expect.stringContaining("does not prove task routing"),
    });
    expect(byId(manifest, "root-witness")).toMatchObject({
      state: "RUNTIME_OBSERVED",
      summary: expect.stringContaining("OTS STAMPED_PENDING_BITCOIN"),
    });
  });

  it("degrades each dependent rail gracefully when every probe fails", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("network unavailable");
    });
    const manifest = await buildFabricManifest(
      "https://example.test/api/fabric",
      fetcher,
      OBSERVED_AT,
    );

    expect(manifest.rails.length).toBe(16);
    expect(byId(manifest, "mcp-tools")).toMatchObject({
      state: "UNREACHABLE",
      last_error: "network unavailable",
    });
    expect(byId(manifest, "hf-census")).toMatchObject({
      state: "UNCHECKABLE",
      last_error: "network unavailable",
    });
    expect(byId(manifest, "public-root").state).toBe("UNCHECKABLE");
    expect(byId(manifest, "root-witness").state).toBe("UNCHECKABLE");
    expect(manifest.rails.every((item) => item.writes_board === false)).toBe(
      true,
    );
  });

  it("aborts hanging same-origin probes at the bounded deadline", async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn(
        async (
          _input: RequestInfo | URL,
          init?: RequestInit,
        ): Promise<Response> =>
          await new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            );
          }),
      );
      const pending = buildFabricManifest(
        "https://example.test/api/fabric",
        fetcher,
        OBSERVED_AT,
      );

      await vi.advanceTimersByTimeAsync(3_500);
      const manifest = await pending;

      expect(fetcher).toHaveBeenCalledTimes(15);
      expect(byId(manifest, "mcp-tools")).toMatchObject({
        state: "UNREACHABLE",
        last_error: "probe timed out after 3500ms",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("serves no-store JSON", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fixtureFetcher() as typeof fetch;
    try {
      const response = await onRequestGet({
        request: new Request("https://example.test/api/fabric"),
      } as never);
      const body = (await response.json()) as FabricManifest;
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(body.schema).toBe("csoai.capability-fabric/0.1");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
