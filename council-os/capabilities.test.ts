import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  LIFECYCLES,
  ABSENCE_STATUSES,
  loadRegistry,
  routeTable,
  handlerFor,
  servedApiRoutes,
  doorTools,
  routerSkillIds,
  validateShape,
  validateAgainstCode,
  stats,
} from "../scripts/capability-registry.mjs";

/**
 * council-os/capabilities.json is the ONE declaration of every surface this estate serves, and
 * public/openapi.json, functions/mcp/tool-fleet.lock.json, the A2A agent card and its alias,
 * public/llms.txt and client/src/data/capability-nav.json are all rendered from it.
 *
 * A registry is only worth the guards around it, so each `it` below states a defect that has
 * either happened here or is one edit away, and fails on it:
 *
 *   an entry whose route has no handler          a catalogue claiming what nothing serves
 *   a handler no entry declares                  a served route missing from every catalogue
 *   LIVE whose probe expects an absence status   a lifecycle contradicting its own probe
 *   a generated artifact that drifted            a render nobody re-ran
 *   an MCP fleet swap of equal size              the defect a count baseline cannot see
 *   an A2A skill in one place and not another    the card, the alias, SKILL_IDS, the recount
 *
 * These are the same predicates scripts/capability-registry.mjs --check runs inside
 * `npm run build:client`. They are duplicated here on purpose: the build gate and the test
 * suite must not be able to disagree about what honest means.
 */

const REPO = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const R = (p: string) => readFileSync(join(REPO, p), "utf8");
const J = (p: string) => JSON.parse(R(p));

const registry = loadRegistry();
const TABLE = routeTable();

describe("the declaration is not vacuous", () => {
  it("reads a registry with entries of every kind it claims to cover", () => {
    const s = stats(registry);
    expect(s.total).toBeGreaterThan(100);
    for (const kind of ["http", "population_door", "mcp_tool", "a2a_skill", "well_known"]) {
      expect(s.by_kind[kind], kind).toBeGreaterThan(0);
    }
    expect(TABLE.size).toBeGreaterThan(100);
  });

  it("stores no count of its own — every total is derived by counting entries", () => {
    // A number typed into the declaration is a number nothing retires. The three surface lies
    // repaired on 2026-09-22 were each a stored figure that outlived the thing it described.
    expect(JSON.stringify(registry)).not.toMatch(/"(count|total|fleet_size|n_[a-z_]+)"\s*:\s*\d+/);
  });

  it("agrees with the code as committed", () => {
    expect([...validateShape(registry), ...validateAgainstCode(registry, { table: TABLE })]).toEqual([]);
  });
});

describe("a registry entry whose route has no handler fails", () => {
  it("the resolver reports no handler for a path this repo does not serve", () => {
    for (const invented of ["/api/anchors", "/api/watchdog", "/api/spectrum", "/api/drift"]) {
      expect(handlerFor(invented, TABLE), invented).toBeNull();
    }
  });

  it("planting one produces the failure", () => {
    const planted = structuredClone(registry);
    const i = planted.capabilities.findIndex((c: { kind: string }) => c.kind === "http");
    planted.capabilities[i] = { ...planted.capabilities[i], path: "/api/spectrum" };
    expect(validateAgainstCode(planted, { table: TABLE }).join("\n")).toContain("no handler in functions/");
  });

  it("every declared HTTP path resolves to a handler that serves its method", () => {
    const orphans: string[] = [];
    for (const c of registry.capabilities) {
      if (!["http", "population_door", "well_known"].includes(c.kind)) continue;
      const found = handlerFor(c.path, TABLE);
      if (!found) orphans.push(`${c.method} ${c.path} (${c.id})`);
      else if (!found[1].methods.has("*") && !found[1].methods.has(c.method.toLowerCase())) {
        orphans.push(`${c.method} ${c.path} (${c.id}) — ${found[1].file} serves ${[...found[1].methods].join(",")}`);
      }
    }
    expect(orphans).toEqual([]);
  });
});

describe("a handler with no registry entry fails", () => {
  it("planting one produces the failure", () => {
    const planted = structuredClone(registry);
    planted.capabilities = planted.capabilities.filter((c: { id: string }) => c.id !== "api-gspc");
    expect(validateAgainstCode(planted, { table: TABLE }).join("\n")).toContain(
      "GET /api/gspc is served by functions/api/gspc.ts and declared by no capability entry",
    );
  });

  it("every served functions/api route is declared", () => {
    const declared = new Set(
      registry.capabilities
        .filter((c: { path?: string }) => c.path)
        .map((c: { method: string; path: string }) => `${c.method.toUpperCase()} ${c.path}`),
    );
    const missing = servedApiRoutes(TABLE)
      .map((r) => `${r.method} ${r.path}`)
      .filter((k) => !declared.has(k));
    expect(missing).toEqual([]);
  });
});

describe("a declared LIVE whose probe expects a 404 fails", () => {
  it("planting one produces the failure", () => {
    const planted = structuredClone(registry);
    const live = planted.capabilities.find((c: { lifecycle: string }) => c.lifecycle === "LIVE");
    live.probe.expect_status = [404];
    expect(validateShape(planted).join("\n")).toContain("a route that states its own absence is not LIVE");
  });

  it("no LIVE capability expects an absence status, and every other lifecycle expects its own", () => {
    const want: Record<string, number> = {
      NOT_IMPLEMENTED: 501,
      RETIRED: 503,
      DOOR_CLOSED: 404,
      QUARANTINED_PRE_RELEASE: 503,
      METHOD_NOT_ALLOWED: 405,
    };
    for (const c of registry.capabilities) {
      expect(LIFECYCLES, c.id).toContain(c.lifecycle);
      if (c.lifecycle === "LIVE") {
        expect(c.probe.expect_status.filter((s: number) => ABSENCE_STATUSES.has(s)), c.id).toEqual([]);
      } else {
        expect(c.probe.expect_status, c.id).toContain(want[c.lifecycle]);
      }
    }
  });

  it("a lifecycle is what the handler's own marker says, not what a catalogue remembers", () => {
    // Four handlers served {"schema":"csoai.retired-endpoint/0.1","code":"RETIRED"} while
    // public/openapi.json marked them QUARANTINED_PRE_RELEASE. Both answer 503, so no status
    // probe could tell them apart: "withdrawn" was catalogued as "not yet released".
    for (const name of ["atlas", "growth-loops", "prod-readiness", "synthesis"]) {
      const src = R(`functions/api/${name}.ts`);
      expect(src, name).toContain("@openapi-retired");
      const entry = registry.capabilities.find((c: { path?: string }) => c.path === `/api/${name}`);
      expect(entry?.lifecycle, name).toBe("RETIRED");
      const op = J("public/openapi.json").paths[`/api/${name}`].get;
      expect(op["x-csoai-lifecycle"], name).toBe("RETIRED");
    }
  });
});

describe("a generated artifact that drifted from the registry fails --check", () => {
  it("the MCP fleet lock is the registry's tool names, by name", () => {
    const lock = J("functions/mcp/tool-fleet.lock.json");
    const tools = registry.capabilities.filter((c: { kind: string }) => c.kind === "mcp_tool");
    expect([...lock.free].sort()).toEqual(
      tools.filter((t: { payment: string }) => t.payment === "free").map((t: { id: string }) => t.id).sort(),
    );
    expect([...lock.paid].sort()).toEqual(
      tools.filter((t: { payment: string }) => t.payment !== "free").map((t: { id: string }) => t.id).sort(),
    );
    expect(lock.fleet_size).toBe(lock.free.length + lock.paid.length);
  });

  it("the A2A card's skills are the registry's skills, and its alias is byte-identical", () => {
    const card = J("public/.well-known/agent-card.json");
    const alias = R("public/.well-known/agent.json");
    expect(alias).toBe(R("public/.well-known/agent-card.json"));
    const declared = registry.capabilities.filter((c: { kind: string }) => c.kind === "a2a_skill");
    expect(card.skills.map((s: { id: string }) => s.id).sort()).toEqual(
      declared.map((c: { id: string }) => c.id).sort(),
    );
    for (const s of card.skills) {
      const c = declared.find((x: { id: string }) => x.id === s.id);
      expect(s.name, s.id).toBe(c.name);
      expect(s.description, s.id).toBe(c.description);
    }
  });

  it("the navigation data is the registry's reader-facing rows, with no stored count", () => {
    const nav = J("client/src/data/capability-nav.json");
    const wanted = registry.capabilities.filter((c: { surfaces: string[] }) => c.surfaces.includes("nav"));
    expect(nav.capabilities.map((r: { id: string }) => r.id)).toEqual(wanted.map((c: { id: string }) => c.id));
    expect(nav.capabilities.every((r: { description: string }) => r.description.trim())).toBe(true);
    expect(JSON.stringify(nav)).not.toMatch(/"(count|total)"\s*:\s*\d+/);
  });

  it("openapi documents every declared door and claims no operation the registry does not know", () => {
    const spec = J("public/openapi.json");
    const declared = new Map<string, { lifecycle: string; surfaces: string[] }>(
      registry.capabilities
        .filter((c: { path?: string }) => c.path)
        .map((c: { path: string; method: string }) => [`${c.path}|${c.method.toLowerCase()}`, c]),
    );
    const undeclared: string[] = [];
    const wrongLifecycle: string[] = [];
    for (const [path, item] of Object.entries(spec.paths as Record<string, Record<string, { "x-csoai-lifecycle"?: string }>>)) {
      for (const [method, op] of Object.entries(item)) {
        const c = declared.get(`${path}|${method}`);
        if (!c) undeclared.push(`${method.toUpperCase()} ${path}`);
        else if ((op["x-csoai-lifecycle"] ?? "LIVE") !== c.lifecycle) {
          wrongLifecycle.push(`${method.toUpperCase()} ${path}: doc ${op["x-csoai-lifecycle"] ?? "LIVE"} vs registry ${c.lifecycle}`);
        }
      }
    }
    expect(undeclared).toEqual([]);
    expect(wrongLifecycle).toEqual([]);

    const missing: string[] = [];
    for (const [key, c] of declared) {
      const [path, method] = key.split("|");
      if (!c.surfaces.includes("openapi")) continue;
      if (!(spec.paths as Record<string, Record<string, unknown>>)[path]?.[method]) missing.push(`${method.toUpperCase()} ${path}`);
    }
    expect(missing).toEqual([]);
  });

  it("every x402 door the manifest advertises has an OpenAPI operation", () => {
    // The ten /api/pop/* doors and /api/wrapper/changes were in /.well-known/x402.json and in
    // no OpenAPI operation: advertised to agents, invisible to every indexer reading the
    // document. The manifest fixture and the document now come from the one declaration.
    const wk = J("scripts/fixtures/x402scan/well_known_x402.json");
    const spec = J("public/openapi.json");
    const missing = wk.resources
      .map((r: { url: string }) => new URL(r.url).pathname)
      .filter((p: string) => !spec.paths[p]);
    expect(missing).toEqual([]);
    expect(new Set(spec["x-x402"].doors)).toEqual(
      new Set(wk.resources.map((r: { url: string }) => new URL(r.url).pathname)),
    );
  });

  it("llms.txt names every paid door, derived rather than typed", () => {
    const txt = R("public/llms.txt");
    expect(R("scripts/llms/llms.txt.tmpl")).toMatch(/\{\{PAID_DOORS_SECTION\}\}/);
    for (const c of registry.capabilities) {
      // MCP tools are paid too, and they are not HTTP doors: they are reached through POST /mcp,
      // which llms.txt names on its own line. Only a door with a path belongs in the door list.
      if (c.payment !== "x402" && c.payment !== "free_preview_then_x402") continue;
      if (!c.path) continue;
      expect(txt, `${c.id} is a paid door and llms.txt does not name it`).toContain(`https://councilof.ai${c.path}`);
    }
  });
});

describe("the tool fleet is locked by NAME, so a swap of equal size is caught", () => {
  it("a renamed tool fails even though the fleet is the same size", () => {
    const { free, paid } = doorTools();
    const planted = structuredClone(registry);
    const target = planted.capabilities.find((c: { id: string }) => c.id === paid[0]);
    target.id = "witness_hash"; // quarantined, and not in the fleet
    const errs = validateAgainstCode(planted, { table: TABLE });
    expect(errs.join("\n")).toContain("paid MCP tools disagree");
    // and the sizes are identical, which is exactly what a count baseline cannot see
    expect(planted.capabilities.filter((c: { kind: string }) => c.kind === "mcp_tool").length).toBe(
      free.length + paid.length,
    );
  });

  it("the registry, the door's manifests and the lock name the same tools", () => {
    const { free, paid } = doorTools();
    const lock = J("functions/mcp/tool-fleet.lock.json");
    expect([...lock.free].sort()).toEqual([...free].sort());
    expect([...lock.paid].sort()).toEqual([...paid].sort());
    expect(lock.free.concat(lock.paid)).not.toContain("witness_hash");
  });
});

describe("an A2A skill declared in one place and not another fails", () => {
  it("the router's SKILL_IDS is the same set as the registry", () => {
    const routerIds = routerSkillIds();
    expect(routerIds).not.toBeNull();
    expect([...routerIds!].sort()).toEqual(
      registry.capabilities.filter((c: { kind: string }) => c.kind === "a2a_skill").map((c: { id: string }) => c.id).sort(),
    );
  });

  it("planting a mismatch produces the failure", () => {
    const planted = structuredClone(registry);
    const skill = planted.capabilities.find((c: { kind: string }) => c.kind === "a2a_skill");
    skill.id = "a-skill-the-router-never-heard-of";
    expect(validateAgainstCode(planted, { table: TABLE }).join("\n")).toContain("A2A skills disagree");
  });

  it("the directory census's recount agrees, and its timestamped bytes are not rewritten", () => {
    const doc = J("public/interop/a2a-directories.json");
    expect(doc.our_agent.skills).toBe(
      registry.capabilities.filter((c: { kind: string }) => c.kind === "a2a_skill").length,
    );
    // The .ots proof is over these bytes. A drift here is superseded with a dated artifact,
    // never edited in place — which is why nothing renders this file.
    expect(R("public/interop/a2a-directories.json.ots").length).toBeGreaterThan(0);
  });

  it("no skill count is typed into the router's served contract", () => {
    // GET /api/a2a published "seven card skills" while SKILL_IDS held eight.
    const src = R("functions/api/a2a.ts");
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const offences: string[] = [];
    for (const m of src.matchAll(/\b(\w+)\s+(?:card\s+)?skills?\b/gi)) {
      const w = m[1].toLowerCase();
      const n = words.indexOf(w) >= 0 ? words.indexOf(w) : /^\d+$/.test(w) ? Number(w) : null;
      if (n !== null && n !== routerSkillIds()!.length) offences.push(m[0].trim());
    }
    expect(offences).toEqual([]);
    expect(src).toContain("skills: [...SKILL_IDS]"); // the set is served, so a reader can count it
  });
});

describe("what the registry says it cannot reach, it names rather than counts", () => {
  it("every openapi_gap row names a real served route and a reason", () => {
    for (const g of registry.openapi_gap) {
      expect(handlerFor(g.path, TABLE), `${g.method} ${g.path}`).not.toBeNull();
      expect(g.reason, `${g.method} ${g.path}`).toBeTruthy();
      expect(J("public/openapi.json").paths[g.path]?.[g.method.toLowerCase()], `${g.method} ${g.path} is documented after all`).toBeUndefined();
    }
  });

  it("a capability the daily loop may not probe says why", () => {
    for (const c of registry.capabilities) {
      if (c.probe.safe) expect(["get", "head"], c.id).toContain(c.probe.method.toLowerCase());
      else expect(c.probe.unsafe_reason, `${c.id} is unprobed by the loop and does not say why`).toBeTruthy();
    }
  });

  it("an UNDOCUMENTED capability is never published to a reader", () => {
    for (const c of registry.capabilities) {
      expect(["DOCUMENTED", "UNDOCUMENTED"], c.id).toContain(c.description_state);
      if (c.description_state === "UNDOCUMENTED") {
        expect(c.description, c.id).toBe("");
        expect(c.surfaces, c.id).not.toContain("llms");
        expect(c.surfaces, c.id).not.toContain("nav");
      } else {
        expect(c.description.trim().length, c.id).toBeGreaterThan(0);
      }
    }
  });
});
