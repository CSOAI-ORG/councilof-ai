// client/src/App.tsx is the app root — main.tsx does `import App from "./App"`.
// If it loses its default export or its routes, the built site renders nothing.
//
// This has now happened TWICE, both times from a commit titled
// "feat(client): JA-D2 remove /sovereign-town Route from App":
//
//   18357103  2 Sep  75,845 B   intact
//   6afe826d  1 Sep   8,000 B   truncated   <- first time
//   89000036  1 Sep  74,983 B   "restore App.tsx after JA-D2 stub squash (#1068)"
//   3ee259de  3 Sep   8,000 B   truncated   <- second time
//
// Exactly 8,000 bytes each time — a truncated write, not an edit. The file ended
// mid-identifier at `const EUAIActClas`, with no `export default` at all. The
// only reason production survived is that the deploy queue was stuck, so the
// corrupted build never shipped.
//
// Note the change JA-D2 kept attempting was already done: /sovereign-town was
// removed by the SOV3->Council rename (41f33277). It was deleting nothing and
// truncating the file in the process.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "App.tsx");

describe("App.tsx is intact", () => {
  const src = readFileSync(APP, "utf8");

  it("exports a default component — main.tsx imports it", () => {
    expect(src).toMatch(/export default function App|export default App/);
  });

  it("still declares the route table", () => {
    // 497 routes at the last known-good commit. A floor well below that catches
    // truncation without failing on ordinary route churn.
    const routes = (src.match(/path=/g) || []).length;
    expect(routes).toBeGreaterThan(300);
  });

  it("is not a truncated write", () => {
    expect(src.length).toBeGreaterThan(50_000);
    // a truncated file ends mid-token; a real one closes its last statement
    expect(src.trimEnd()).toMatch(/[});]$/);
  });
});
