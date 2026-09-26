/**
 * The measurement-capsule skills: measurement-capsules {op:index|verify} and server-evidence.
 * They live in FOUR places — the card, its alias, SKILL_IDS, and the directory census recount —
 * and each is asserted here, then called through the real router against the served layout.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { SKILL_IDS, onRequestPost } from "./a2a";
import BUNDLE from "../_lib/__fixtures__/measurement/layout-bundle.json";
import VECTORS from "../_lib/__fixtures__/measurement/capsule-vectors.json";

vi.setConfig({ testTimeout: 60_000 });
const FILES = (BUNDLE as { files: Record<string, string> }).files;
const J = (p: string) => JSON.parse(readFileSync(resolve(__dirname, "../..", p), "utf8"));
const NEW = ["measurement-capsules", "server-evidence"];
afterEach(() => vi.unstubAllGlobals());

function serve(files: Record<string, string>) {
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname;
    return path in files ? new Response(files[path]) : new Response("<!doctype html>", { status: 404 });
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function skill(id: string, input: Record<string, unknown>): Promise<any> {
  const res = await onRequestPost({
    request: new Request("https://councilof.ai/api/a2a", {
      method: "POST",
      headers: { "content-type": "application/json", "a2a-version": "1.0" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "SendMessage", params: { message: { messageId: "m", role: "ROLE_USER", parts: [{ data: { skill: id, input } }] } } }),
    }),
  } as never);
  return res.json();
}

describe("the measurement skills are wired in all four places", () => {
  it("1+3: the card and SKILL_IDS carry both", () => {
    const card = J("public/.well-known/agent-card.json");
    for (const id of NEW) {
      expect(SKILL_IDS).toContain(id);
      expect(card.skills.map((s: { id: string }) => s.id)).toContain(id);
    }
  });
  it("2: the alias is the same bytes as the card", () => {
    expect(readFileSync(resolve(__dirname, "../../public/.well-known/agent.json")).equals(readFileSync(resolve(__dirname, "../../public/.well-known/agent-card.json")))).toBe(true);
  });
  it("4: the directory census recount is superseded, not edited — the old bytes keep their proof at a dated path", () => {
    const doc = J("public/interop/a2a-directories.json");
    expect(doc.our_agent.skills).toBe(SKILL_IDS.length);
    const old = readFileSync(resolve(__dirname, "../..", `public${doc.supersedes.path}`));
    expect(createHash("sha256").update(old).digest("hex")).toBe(doc.supersedes.sha256);
    expect(JSON.parse(old.toString()).our_agent.skills).toBe(SKILL_IDS.length - NEW.length);
    expect(readFileSync(resolve(__dirname, "../..", `public${doc.supersedes.ots}`)).length).toBeGreaterThan(0);
  });
});

describe("the measurement skills answer through the real router", () => {
  it("measurement-capsules {op:index}: PUBLISHED, states only", async () => {
    serve(FILES);
    const j = await skill("measurement-capsules", { op: "index" });
    expect(j.error).toBeUndefined();
    const data = j.result.message.parts[1].data;
    expect(data).toMatchObject({ state: "PUBLISHED", skill: "measurement-capsules", doctrine: "measurement, not endorsement" });
    expect(j.result.message.parts[0].text).not.toMatch(/certified|compliant|endorsed/i);
  });
  it("measurement-capsules {op:verify}: INCLUDED for a published capsule", async () => {
    serve(FILES);
    const line = (VECTORS as { v02: { lines: string[] } }).v02.lines[3];
    const j = await skill("measurement-capsules", { op: "verify", capsule_json: line });
    expect(j.result.message.parts[1].data.payload.state).toBe("INCLUDED");
  });
  it("server-evidence: MEASURED for a known endpoint, NOT_MEASURED (a result, not an error) for an unknown one", async () => {
    serve(FILES);
    const known = await skill("server-evidence", { endpoint_url: "https://svc1.example/mcp" });
    expect(known.result.message.parts[1].data.state).toBe("MEASURED");
    const unknown = await skill("server-evidence", { endpoint_url: "https://nobody.example/mcp" });
    expect(unknown.error).toBeUndefined();
    expect(unknown.result.message.parts[1].data.payload).toMatchObject({ state: "NOT_MEASURED", capsules: [] });
  });
  it("refuses malformed input with a specific reason, never as 'unsupported skill'", async () => {
    serve(FILES);
    for (const [id, input] of [["measurement-capsules", {}], ["measurement-capsules", { op: "delete" }], ["server-evidence", {}], ["server-evidence", { endpoint_url: 5 }]] as const) {
      const j = await skill(id, input as Record<string, unknown>);
      expect(j.error.message).not.toBe("unsupported skill");
      expect(j.error.message).toMatch(new RegExp(id));
    }
  });
});
