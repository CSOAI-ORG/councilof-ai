/**
 * Every relative import in every Pages route must RESOLVE.
 *
 * WHY THIS EXISTS. On 30 October 2026 the Layer 0 gateway shipped three routes whose
 * `headFromGet` import pointed at the wrong directory: `functions/api/gate.ts` imported
 * "../_head" and the two `functions/api/a2a/` routes imported "../../_head", while
 * `_head.ts` lives at `functions/api/_head.ts`. The routes could not resolve their own
 * import, the deploy failed, and it failed again on every subsequent merge to master until
 * the paths were corrected. Every deploy in the estate was blocked by three characters.
 *
 * WHY NOTHING CAUGHT IT. Three gates were silent about it:
 *
 *  - No test imports a Pages route. Vitest only loads the modules a test imports, and no
 *    test imported `functions/api/gate.ts`, so the bad path was never resolved.
 *  - `npm run check:functions` (tsc over tsconfig.functions.json) is in NO workflow. It would
 *    have caught it, but it is not run on pull requests, and pre-existing type errors in
 *    other files would make it red as a blanket gate.
 *  - The deploy is the last gate, and a failed deploy blocks every other merge to master,
 *    which is the worst possible place to find out.
 *
 * WHY IT IS STATIC. The first draft of this gate IMPORTED every route, which found the
 * defect immediately - and also found that `workers-og` ships a yoga wasm module that does
 * `import ... from 'a'`, which Node cannot resolve and Workers can. A gate that fires on a
 * runtime difference between two hosts is a gate that cries wolf. So this resolves each
 * RELATIVE import against the filesystem instead of executing it: that is exactly the defect
 * class, it is deterministic, and it cannot be broken by a dependency's internals.
 *
 * Bare specifiers (`workers-og`, `@modelcontextprotocol/server`) are the package manager's
 * business and are not checked here.
 *
 * It checks RESOLUTION, not correctness. A route whose imports all resolve can still answer
 * wrongly; that is what the route's own tests are for. What this catches is the class where
 * the module cannot be assembled at all.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// This file sits IN functions/, so its own directory IS the tree to walk.
const FUNCTIONS = dirname(fileURLToPath(import.meta.url));

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "__fixtures__") continue;
      walk(p, out);
    } else if (/\.(ts|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

// A route file: not a `_` helper, not a test, not a declaration file.
const isRoute = (f: string) => {
  const b = basename(f);
  return !b.startsWith("_") && !/\.(test|spec)\./.test(b) && !b.endsWith(".d.ts");
};

/** Import specifiers, from `import ... from "x"`, `export ... from "x"` and `import("x")`. */
export function importSpecifiers(src: string): string[] {
  const out: string[] = [];
  const re = /(?:^|\n)\s*(?:import|export)\b[^;\n]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) out.push(m[1] ?? m[2]);
  return out;
}

/** Does a relative specifier resolve to a real module? */
export function resolves(specifier: string, fromFile: string): boolean {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`, `${base}.js`, `${base}.mjs`,
    join(base, "index.ts"), join(base, "index.js"), join(base, "index.mjs"),
  ];
  return candidates.some((c) => existsSync(c));
}

describe("every Pages route's relative imports resolve", () => {
  const routes = walk(FUNCTIONS).filter(isRoute);

  it("finds the routes", () => {
    expect(routes.length).toBeGreaterThan(50);
  });

  it("no route imports a relative path that does not exist", () => {
    const failures: string[] = [];
    for (const file of routes) {
      const src = readFileSync(file, "utf8");
      for (const spec of importSpecifiers(src)) {
        if (!spec.startsWith(".")) continue;
        if (!resolves(spec, file)) {
          failures.push(`${file.replace(FUNCTIONS + "/", "")} imports "${spec}", which does not exist`);
        }
      }
    }
    expect(
      failures,
      `these Pages routes import a path that does not exist, so Pages cannot serve them:\n  ${failures.join("\n  ")}`,
    ).toEqual([]);
  });

  it("the gate can see a broken import", () => {
    // A gate that has never been seen failing is decoration. Point it at a path that does not
    // exist and confirm it says so.
    expect(resolves("./_does-not-exist", join(FUNCTIONS, "api", "gate.ts"))).toBe(false);
    expect(resolves("./_head", join(FUNCTIONS, "api", "gate.ts"))).toBe(true);
  });
});
