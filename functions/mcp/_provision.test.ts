import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "../api/evidence-bundle";
import { provisionStatus, provisionToolResult, PROVISION_TOOL_DEFINITIONS } from "./_provision";
import GSPC_TOOLS from "./gspc-tools.json";
import WELLKNOWN_SERVER from "../../public/.well-known/mcp/server.json";
import REGISTRY_DESCRIPTOR from "../../mcp/gspc-server/server.json";
import NPM_PACKAGE from "../../mcp/gspc-server/package.json";
// @ts-expect-error: plain ESM script, no type declarations
import { doctrineViolations } from "../../scripts/harness-x/doctrine-lint.mjs";

const ORIGIN = "https://councilof.ai";

/** Route same-origin reads to the real handler; the card corpus is a one-card fixture. */
function stubOrigin() {
  const reads = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.href === `${ORIGIN}/cards-bundle.json`) {
      const sha = "2".repeat(64);
      return Response.json({ as_of: "2026-11-20T00:00:00Z", merkle_root: "r".repeat(64), cards: { [sha]: { card: { sha256: sha, sig_ed25519: "s", subject: "vendor-model", surface: "gspc.behavioural", tags: ["gpai"] }, proof: [] } } });
    }
    if (url.pathname === "/api/evidence-bundle") return onRequestGet({ request: new Request(url), env: {} } as never);
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", reads);
  return reads;
}

afterEach(() => vi.unstubAllGlobals());

describe("provision_status (free, no network)", () => {
  it("answers the ladder state of a provision without any read", () => {
    const reads = stubOrigin();
    const p = provisionStatus(ORIGIN, { provision_id: "32024R1689:50" });
    expect(p.state).toBe("OK");
    expect((p.provisions as { ladder_state: string }[])[0].ladder_state).toBe("PREDICATE");
    expect(p.not_a_certification).toBe(true);
    expect(reads).not.toHaveBeenCalled();
  });

  it("refuses an unknown provision and a missing argument as errors", async () => {
    expect(provisionStatus(ORIGIN, { provision_id: "32024R1689:999" }).state).toBe("UNKNOWN_PROVISION");
    expect(provisionStatus(ORIGIN, {}).state).toBe("BAD_ARGUMENTS");
    expect((await provisionToolResult("provision_status", { provision_id: "nope" }, ORIGIN, "free")).isError).toBe(true);
  });
});

describe("evidence_for", () => {
  it("free door: relays the route preview and carries no payment text", async () => {
    stubOrigin();
    const r = await provisionToolResult("evidence_for", { provision_id: "32024R1689:53" }, ORIGIN, "free");
    expect(r.isError).toBe(false);
    const p = r.structuredContent!;
    expect(p.state).toBe("RELEVANT_CARDS_FOUND");
    expect((p.obligation as { id: string }).id).toBe("article-53");
    expect(p).not.toHaveProperty("purchase");
    expect(JSON.stringify(p)).not.toMatch(/"buy"|"rail"|accepts|x402/);
  });

  it("paid door: names the existing paid tool and never charges by itself", async () => {
    const reads = stubOrigin();
    const p = (await provisionToolResult("evidence_for", { provision_id: "32022R2554:28" }, ORIGIN, "paid")).structuredContent!;
    expect(p.purchase).toEqual(expect.objectContaining({ tool: "evidence_bundle", arguments: { obligation: "dora" } }));
    for (const [input] of reads.mock.calls) {
      const u = new URL(input instanceof Request ? input.url : String(input));
      expect(u.searchParams.has("bundle")).toBe(false);
    }
  });

  it("a provision no obligation stands for is PROVISION_ONLY, with nothing to buy", async () => {
    stubOrigin();
    const p = (await provisionToolResult("evidence_for", { provision_id: "32016R0679:5" }, ORIGIN, "paid")).structuredContent!;
    expect(p.state).toBe("PROVISION_ONLY");
    expect((p.purchase as { tool: unknown }).tool).toBeNull();
  });

  it("an unknown provision is UNKNOWN_PROVISION", async () => {
    stubOrigin();
    const r = await provisionToolResult("evidence_for", { provision_id: "32024R1689:999" }, ORIGIN, "free");
    expect(r.structuredContent!.state).toBe("UNKNOWN_PROVISION");
    expect(r.isError).toBe(true);
  });
});

describe("tool definitions", () => {
  it("pass the fleet's doctrine lint and do not collide with a served tool", () => {
    for (const t of PROVISION_TOOL_DEFINITIONS) {
      expect(doctrineViolations(`${t.title} ${t.description}`), t.name).toEqual([]);
      expect(t.annotations.readOnlyHint).toBe(true);
      expect(GSPC_TOOLS.tools.some((x) => x.name === t.name), `${t.name} is not yet in the fleet`).toBe(false);
    }
  });
});

describe("well-known server.json names the npm package version the registry descriptor names", () => {
  it("public/.well-known/mcp/server.json, mcp/gspc-server/server.json and package.json agree", () => {
    const pkg = (d: { packages: { identifier: string; version: string; runtimeHint?: string }[] }) => d.packages.find((p) => p.identifier === "csoai-gspc-mcp")!;
    expect(pkg(WELLKNOWN_SERVER as never).version).toBe(NPM_PACKAGE.version);
    expect(pkg(REGISTRY_DESCRIPTOR as never).version).toBe(NPM_PACKAGE.version);
    expect(pkg(WELLKNOWN_SERVER as never).runtimeHint).toBe(`npx -y csoai-gspc-mcp@${NPM_PACKAGE.version}`);
  });
});
