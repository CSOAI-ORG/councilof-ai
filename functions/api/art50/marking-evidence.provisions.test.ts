// The Art 50(2) marking check names the frozen provision it is the predicate of, from the committed
// capsule-provision map, beside the measurement and never inside the signed leaf.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as get, KIND, PROVISIONS, fitLeafPayload, PAYMENT_BLOCK_WORST_CASE, type Measurement } from "./marking-evidence";
import { checkProvisionBinding, bindingFor, CAPSULE_SCHEMA_WITH_PROVISIONS } from "../../_lib/provisionBinding";

const MAP = JSON.parse(readFileSync(resolve(__dirname, "../../../public/mechanism/capsule-provision-map.json"), "utf8"));
const PLAIN_PNG = new Uint8Array(readFileSync(resolve(__dirname, "../../../fixtures/c2pa/c2pa-rs-libpng-test.png")));
const ORIGIN = "https://councilof.ai";
const EP = "/api/art50/marking-evidence";
const FORBIDDEN = /\b(non-?compliant|compliant|certified|certif(?:y|ies|ication)|absent|unsafe|safe|legal evidence|guarantee[sd]? that)\b/i;

afterEach(() => vi.unstubAllGlobals());

describe("Art 50 marking evidence names its frozen provision", () => {
  it("the binding is the map's row for this kind, pinned to the frozen manifest", () => {
    const rows = MAP.mappings.filter((m: { source: string; kind: string }) => m.source === "route" && m.kind === KIND);
    expect(rows.length).toBeGreaterThan(0);
    expect(PROVISIONS).toEqual(rows.map((m: { provision_id: string; relation: "PREDICATE" }) => bindingFor(m.provision_id, m.relation)));
    expect(checkProvisionBinding(PROVISIONS, CAPSULE_SCHEMA_WITH_PROVISIONS).state).toBe("PINNED");
  });

  async function preview() {
    vi.stubGlobal("fetch", async (u: string | URL | Request) => {
      const url = new URL(String(u instanceof Request ? u.url : u));
      if (url.hostname === "cdn.example") return new Response(PLAIN_PNG, { status: 200, headers: { "content-type": "image/png" } });
      return new Response("nope", { status: 404 });
    });
    const r = await get({ request: new Request(`${ORIGIN}${EP}?preview=1&url=https://cdn.example/plain.png`), env: {}, params: {} } as never);
    expect(r.status).toBe(200);
    return r.json();
  }

  it("the free preview carries the binding and its note; the wording rule still holds", async () => {
    const b = await preview();
    expect(b.schema).toBe(KIND);
    expect(b.provisions).toEqual(PROVISIONS);
    expect(b.provisions_note).toMatch(/never a compliance determination/);
    expect(JSON.stringify({ provisions: b.provisions, provisions_note: b.provisions_note })).not.toMatch(FORBIDDEN);
  });

  it("the signed leaf payload does not carry the binding, so its bytes and cap are unchanged", async () => {
    const m = (await preview()).measurement as Measurement;
    const fit = await fitLeafPayload(m, "2026-11-22T00:00:00.000Z", PAYMENT_BLOCK_WORST_CASE);
    expect(fit).not.toBeNull();
    expect(fit!.payload).not.toHaveProperty("provisions");
    expect(JSON.stringify(fit!.payload)).not.toContain(PROVISIONS[0].provision_sha256);
  });
});
