import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = (name) => JSON.parse(readFileSync(resolve(root, name), "utf8"));

test("authenticated private operator routes are accounted for without public discovery", () => {
  const registry = load("council-os/capabilities.json");
  const legacy = load("capabilities/registry.json");
  const openapi = load("public/openapi.json");
  const privateCapabilities = registry.capabilities.filter((c) =>
    String(c.path ?? "").startsWith("/api/private/"),
  );
  assert.ok(privateCapabilities.length > 0, "This guard must exercise the operator route");
  for (const cap of privateCapabilities) {
    assert.deepEqual(cap.surfaces, [], `${cap.id}: private capability surfaced publicly`);
    assert.ok(registry.openapi_gap.some((g) => g.id === cap.id && g.path === cap.path && g.method === cap.method),
      `${cap.id}: private omission from OpenAPI not accounted for`);
    assert.ok(!Object.hasOwn(openapi.paths, cap.path), `${cap.id}: private URL listed in public OpenAPI`);
    assert.ok(!legacy.capabilities.some((r) => r.endpoint === cap.path),
      `${cap.id}: private URL listed in legacy public discovery`);
  }
});
