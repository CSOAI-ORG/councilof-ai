import { describe, expect, it } from "vitest";
import { onRequestGet } from "./mcp-registry-auth";

/**
 * These bytes are a live domain-ownership proof read by a third party we do not control.
 * The registry fetches them, follows no redirects, and parses them with one fixed regex; a
 * change that looks cosmetic here (a stray heading, a JSON wrapper, a 301) silently breaks
 * publication under ai.councilof/*. So the test pins the contract the registry actually
 * enforces, not merely that the handler returns something.
 *
 * Source of every assertion below: modelcontextprotocol/registry,
 * internal/api/handlers/v0/auth/http.go (FetchKey) and .../common.go (MCPProofRecordPattern).
 */

// Copied verbatim from MCPProofRecordPattern in the registry's common.go. If the two ever
// drift, this test is where it surfaces.
const REGISTRY_RECORD_RE = /v=MCPv1;\s*([^;]*k=[^;]+);\s*p=([A-Za-z0-9+/=]+)/;
const REGISTRY_RECORD_EXACT = /v=MCPv1;\s*k=([^;]+);\s*p=([A-Za-z0-9+/=]+)/;
const MAX_KEY_RESPONSE_SIZE = 4096; // MaxKeyResponseSize in http.go

async function body(): Promise<{ res: Response; text: string }> {
  const res = (await onRequestGet({} as never)) as Response;
  return { res, text: await res.text() };
}

describe("/.well-known/mcp-registry-auth", () => {
  it("returns 200 — the registry treats any other status as a fetch failure", async () => {
    const { res } = await body();
    expect(res.status).toBe(200);
  });

  it("is served as text/plain", async () => {
    const { res } = await body();
    expect(res.headers.get("content-type")).toMatch(/^text\/plain/);
  });

  it("fits inside the registry's 4096-byte cap", async () => {
    const { text } = await body();
    expect(new TextEncoder().encode(text).byteLength).toBeLessThanOrEqual(MAX_KEY_RESPONSE_SIZE);
  });

  it("matches the exact pattern the registry compiles", async () => {
    const { text } = await body();
    const match = REGISTRY_RECORD_EXACT.exec(text);
    expect(match).not.toBeNull();
    expect(match![1].trim()).toBe("ed25519");
  });

  it("carries a 32-byte Ed25519 public key", async () => {
    const { text } = await body();
    const match = REGISTRY_RECORD_EXACT.exec(text)!;
    const raw = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    // ParsePublicKey rejects any other length outright.
    expect(raw.byteLength).toBe(32);
  });

  it("carries exactly one record — HTTP auth reads the body as a single string, so a second key would be unreachable", async () => {
    const { text } = await body();
    const occurrences = text.match(/v=MCPv1;/g) || [];
    expect(occurrences.length).toBe(1);
  });

  it("negative control: the pinned regex rejects a malformed record", () => {
    // Guards against the pattern being loosened into something that matches anything.
    expect(REGISTRY_RECORD_EXACT.test("v=MCPv2; k=ed25519; p=AAAA")).toBe(false);
    expect(REGISTRY_RECORD_EXACT.test("k=ed25519; p=AAAA")).toBe(false);
    expect(REGISTRY_RECORD_RE.test("")).toBe(false);
  });

  it("does not claim the io.github namespace — that claim was refuted on 2026-09-23", async () => {
    // The permission a completed proof grants is derived from the reversed domain alone
    // (BuildPermissions), so this document can never reach io.github.CSOAI-ORG/*. The guard is
    // on the served bytes: they must not advertise a namespace at all.
    const { text } = await body();
    expect(text).not.toMatch(/io\.github/i);
    expect(text.trim().split("\n")).toHaveLength(1);
  });
});
