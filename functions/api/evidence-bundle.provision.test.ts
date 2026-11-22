import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./evidence-bundle";
import COVERAGE from "../../public/mechanism/coverage.json";
import MANIFEST from "../../public/interop/frozen-provision-hashes.json";

const ORIGIN = "https://councilof.ai";
const call = (url: string, headers: Record<string, string> = {}) =>
  onRequestGet({ request: new Request(url, { headers }), env: {} } as never);

function stubCards() {
  const reads = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.href !== `${ORIGIN}/cards-bundle.json`) throw new Error(`Unexpected request: ${url}`);
    const sha = "1".repeat(64);
    return Response.json({
      as_of: "2026-11-20T00:00:00Z",
      merkle_root: "r".repeat(64),
      cards: { [sha]: { card: { sha256: sha, sig_ed25519: "synthetic-signature", subject: "image-model", surface: "gspc.provenance", tags: ["c2pa"] }, proof: [] } },
    });
  });
  vi.stubGlobal("fetch", reads);
  return reads;
}

afterEach(() => vi.unstubAllGlobals());

describe("evidence-bundle ?provision= door", () => {
  it("a provision an obligation stands for returns the obligation preview plus its ladder state", async () => {
    stubCards();
    const res = await call(`${ORIGIN}/api/evidence-bundle?provision=32024R1689:50`);
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.kind).toBe("preview");
    expect(b.obligation.id).toBe("article-50");
    expect(b.relevant_signed_cards).toBe(1);
    const p = b.provision.provisions[0];
    expect(p.provision_id).toBe("32024R1689:50");
    expect(p.provision_sha256).toBe((MANIFEST.anchors as Record<string, string>)["32024R1689:50"]);
    expect(p.ladder_state).toBe("PREDICATE");
    expect(p.predicates.map((x: { id: string }) => x.id)).toEqual(["art50-marking-evidence"]);
    expect(p.bound_capsules.via_map[0].kind).toBe("csoai.art50.marking-evidence/0.1");
    // Sidecar-bound batches are listed beside in-capsule ones, both read from coverage.json (never typed).
    const side = (COVERAGE.capsule_adapters as { batch: string; provision_ids_bound_by_sidecar: string[] }[]).filter((x) => x.provision_ids_bound_by_sidecar.includes("32024R1689:50")).map((x) => x.batch);
    expect(p.bound_capsules.by_sidecar.map((x: { batch: string }) => x.batch)).toEqual(side);
    expect(b.provision.corpus.capsule_bindings).toBe(`${ORIGIN}/mechanism/capsule-provision-bindings.json`);
    // The buy link is the obligation's own resource: same SKU, same URL as ?obligation=article-50.
    expect(b.buy.resource).toBe(`${ORIGIN}/api/evidence-bundle?obligation=article-50&bundle=1`);
  });

  it("ladder states are the coverage report's, and an untouched provision is HASH_ONLY", async () => {
    stubCards();
    const touched = new Map((COVERAGE.provisions_touched as { provision_id: string; status: string }[]).map((p) => [p.provision_id, p.status]));
    for (const id of ["32024R1689:53", "32022R2554:30", "32016R0679:5", "32024R1689:-3"]) {
      const b = await (await call(`${ORIGIN}/api/evidence-bundle?provision=${encodeURIComponent(id)}`)).json();
      expect(b.provision.provisions[0].ladder_state, id).toBe(touched.get(id) ?? "HASH_ONLY");
    }
  });

  it("the existing obligation ids work as aliases and keep their preview", async () => {
    stubCards();
    const viaAlias = await (await call(`${ORIGIN}/api/evidence-bundle?provision=dora`)).json();
    expect(viaAlias.obligation.id).toBe("dora");
    expect(viaAlias.provision.requested_via).toBe("obligation_alias");
    expect(viaAlias.provision.provisions.map((p: { provision_id: string }) => p.provision_id)).toEqual(["32022R2554:28", "32022R2554:29", "32022R2554:30"]);
    const cra = await (await call(`${ORIGIN}/api/evidence-bundle?provision=eu-cra`)).json();
    expect(cra.obligation.id).toBe("cra");
    expect(cra.provision.provisions).toEqual([]);
    expect(cra.provision.alias_note).toMatch(/names no Article/);
    const direct = await (await call(`${ORIGIN}/api/evidence-bundle?obligation=article-50`)).json();
    expect(direct.provision).toBeUndefined();
  });

  it("a provision no obligation stands for has a free view and nothing to buy", async () => {
    const reads = stubCards();
    const res = await call(`${ORIGIN}/api/evidence-bundle?provision=32016R0679:5`);
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.kind).toBe("provision_preview");
    expect(b.buy).toBeNull();
    expect(b.obligation).toBeNull();
    expect(reads).not.toHaveBeenCalled();
    for (const [q, h] of [["&bundle=1", {}], ["", { "X-PAYMENT": "eyJ4IjoxfQ==" }]] as const) {
      const refused = await call(`${ORIGIN}/api/evidence-bundle?provision=32016R0679:5${q}`, h);
      expect(refused.status).toBe(400);
      expect((await refused.json()).error).toBe("no_bundle_for_provision");
    }
    expect(reads).not.toHaveBeenCalled();
  });

  it("an unknown provision is a clear 404 JSON, before any read or payment", async () => {
    const reads = stubCards();
    for (const id of ["32024R1689:999", "not-a-provision", "32099R9999:1"]) {
      const res = await call(`${ORIGIN}/api/evidence-bundle?provision=${id}&bundle=1`, { "X-PAYMENT": "eyJ4IjoxfQ==" });
      expect(res.status, id).toBe(404);
      const b = await res.json();
      expect(b.error).toBe("unknown_provision");
      expect(b.usage).toMatch(/provision=/);
    }
    expect(reads).not.toHaveBeenCalled();
  });

  it("the paid path is unchanged: provision=<id>&bundle=1 answers the obligation's own 402", async () => {
    stubCards();
    const viaProvision = await call(`${ORIGIN}/api/evidence-bundle?provision=32024R1689:50&bundle=1`);
    const viaObligation = await call(`${ORIGIN}/api/evidence-bundle?obligation=article-50&bundle=1`);
    expect(viaProvision.status).toBe(402);
    expect(viaObligation.status).toBe(402);
    const a = await viaProvision.json();
    const o = await viaObligation.json();
    expect(a.resource.url).toBe(o.resource.url);
    expect(a.accepts).toEqual(o.accepts);
    expect(a.csoai.free_preview).toBe(o.csoai.free_preview);
  });

  it("provision and obligation together is refused", async () => {
    const res = await call(`${ORIGIN}/api/evidence-bundle?provision=32024R1689:50&obligation=dora`);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("provision_and_obligation");
  });
});
