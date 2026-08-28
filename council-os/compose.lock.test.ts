import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "docker-compose.yml"),
  "utf8",
);

describe("Council OS compose (shipped docker-compose.yml)", () => {
  it("is exactly four services with healthchecks", () => {
    const body = src.split(/^services:\s*$/m)[1]?.split(/^volumes:/m)[0] ?? "";
    const names = [...body.matchAll(/^  ([a-z0-9-]+):\s*$/gm)].map((m) => m[1]);
    expect(names).toEqual(["postgres", "redis", "api", "nginx"]);
    expect(src).not.toMatch(/--protected-mode", "yes"/);
    for (const name of names) {
      const start = body.indexOf(`  ${name}:`);
      const rest = names.slice(names.indexOf(name) + 1);
      const end = rest.length ? body.indexOf(`  ${rest[0]}:`) : body.length;
      const block = body.slice(start, end);
      expect(block).toMatch(/healthcheck:/);
    }
  });
});
